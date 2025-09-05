<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once __DIR__ . '/../connection.php';

class RoomAssignmentAPI {
    private $conn;

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    private function checkExists($table, $column, $value) {
        $stmt = $this->conn->prepare("SELECT 1 FROM {$table} WHERE {$column} = :value LIMIT 1");
        $stmt->execute([':value' => $value]);
        return $stmt->fetchColumn() !== false;
    }

    /**
     * GET: returns assignments with room status and patient name, category, floor
     */
    public function getAssignments() {
        try {
            $stmt = $this->conn->query("
                SELECT ra.assignmentid,
                       ra.admissionid,
                       ra.room_no,
                       ra.start_date,
                       ra.end_date,
                       CONCAT(p.lastname, ', ', p.firstname, ' ', IFNULL(p.middlename, ''), ' ', IFNULL(p.suffix, '')) AS patient_name,
                       r.status AS room_status,
                       rc.name AS category_name,
                       f.name AS floor_name
                FROM Room_Assignment ra
                JOIN Admission a ON ra.admissionid = a.admissionid
                JOIN Patient p ON a.patientid = p.patientid
                JOIN Room r ON ra.room_no = r.room_no
                LEFT JOIN Room_Category rc ON r.categoryid = rc.categoryid
                LEFT JOIN Floor f ON r.floorid = f.floorid
                ORDER BY ra.assignmentid DESC
            ");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respond($results);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * POST: insert assignment, ensure room exists and is Available, mark Occupied
     */
    public function insertAssignment($data) {
        try {
            if (empty($data['admissionid']) || empty($data['room_no'])) {
                $this->respond(["success" => false, "error" => "Admission ID and Room No are required"], 422);
            }

            if (!$this->checkExists('Admission', 'admissionid', $data['admissionid'])) {
                $this->respond(["success" => false, "error" => "Invalid Admission ID"], 422);
            }
            if (!$this->checkExists('Room', 'room_no', $data['room_no'])) {
                $this->respond(["success" => false, "error" => "Invalid Room No"], 422);
            }

            // check room status
            $check = $this->conn->prepare("SELECT status FROM Room WHERE room_no = :room_no LIMIT 1");
            $check->execute([':room_no' => $data['room_no']]);
            $roomStatus = $check->fetchColumn();

            if ($roomStatus === false) {
                $this->respond(["success" => false, "error" => "Room not found"], 404);
            }

            if (strtolower($roomStatus) === 'occupied') {
                $this->respond(["success" => false, "error" => "Room already occupied"], 409);
            }

            // transaction: insert assignment + mark room Occupied
            $this->conn->beginTransaction();

            $stmt = $this->conn->prepare("
                INSERT INTO Room_Assignment (admissionid, room_no, start_date, end_date)
                VALUES (:admissionid, :room_no, :start_date, :end_date)
            ");
            $stmt->execute([
                ':admissionid' => $data['admissionid'],
                ':room_no' => $data['room_no'],
                ':start_date' => $data['start_date'] ?? null,
                ':end_date' => $data['end_date'] ?? null
            ]);

            $assignmentId = $this->conn->lastInsertId();

            // If end_date is set and in the past, don't mark room as Occupied
            $roomStatus = 'Occupied';
            if (isset($data['end_date']) && strtotime($data['end_date']) <= time()) {
                $roomStatus = 'Available';
            }
            
            $upd = $this->conn->prepare("UPDATE Room SET status = :status WHERE room_no = :room_no");
            $upd->execute([':status' => $roomStatus, ':room_no' => $data['room_no']]);

            $this->conn->commit();

            $this->respond(["success" => true, "assignmentid" => $assignmentId], 201);
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) $this->conn->rollBack();
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    /**
     * PUT: update assignment. If room changed, ensure new room available and switch statuses.
     */
    public function updateAssignment($data) {
        try {
            if (empty($data['assignmentid']) || empty($data['admissionid']) || empty($data['room_no'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }

            if (!$this->checkExists('Admission', 'admissionid', $data['admissionid'])) {
                $this->respond(["success" => false, "error" => "Invalid Admission ID"], 422);
            }
            if (!$this->checkExists('Room', 'room_no', $data['room_no'])) {
                $this->respond(["success" => false, "error" => "Invalid Room No"], 422);
            }

            // fetch existing assignment to know current room and end date
            $fetch = $this->conn->prepare("SELECT room_no, end_date FROM Room_Assignment WHERE assignmentid = :assignmentid LIMIT 1");
            $fetch->execute([':assignmentid' => $data['assignmentid']]);
            $current = $fetch->fetch(PDO::FETCH_ASSOC);

            if (!$current) {
                $this->respond(["success" => false, "error" => "Assignment not found"], 404);
            }

            $currentRoom = $current['room_no'];
            $newRoom = $data['room_no'];
            $currentEndDate = $current['end_date'];
            $newEndDate = $data['end_date'] ?? null;
            $endDateChanged = $currentEndDate !== $newEndDate;

            $this->conn->beginTransaction();

            // If room changed, ensure new room is available (or it's the same)
            if ($currentRoom !== $newRoom) {
                $check = $this->conn->prepare("SELECT status FROM Room WHERE room_no = :room_no LIMIT 1");
                $check->execute([':room_no' => $newRoom]);
                $roomStatus = $check->fetchColumn();

                if ($roomStatus === false) {
                    $this->conn->rollBack();
                    $this->respond(["success" => false, "error" => "New room not found"], 404);
                }

                if (strtolower($roomStatus) === 'occupied') {
                    $this->conn->rollBack();
                    $this->respond(["success" => false, "error" => "New room is already occupied"], 409);
                }
            }

            // update assignment
            $stmt = $this->conn->prepare("
                UPDATE Room_Assignment
                SET admissionid = :admissionid, room_no = :room_no, start_date = :start_date, end_date = :end_date
                WHERE assignmentid = :assignmentid
            ");
            $stmt->execute([
                ':admissionid' => $data['admissionid'],
                ':room_no' => $data['room_no'],
                ':start_date' => $data['start_date'] ?? null,
                ':end_date' => $newEndDate,
                ':assignmentid' => $data['assignmentid']
            ]);

            // Determine room status based on end date
            $roomStatus = 'Occupied';
            if ($newEndDate && strtotime($newEndDate) <= time()) {
                $roomStatus = 'Available';
            }

            // if room changed: set new room status based on end date and previous to Available
            if ($currentRoom !== $newRoom) {
                $updNew = $this->conn->prepare("UPDATE Room SET status = :status WHERE room_no = :room_no");
                $updNew->execute([':status' => $roomStatus, ':room_no' => $newRoom]);

                $updOld = $this->conn->prepare("UPDATE Room SET status = 'Available' WHERE room_no = :room_no");
                $updOld->execute([':room_no' => $currentRoom]);
            }
            // If only end date changed, update room status accordingly
            else if ($endDateChanged) {
                $updRoom = $this->conn->prepare("UPDATE Room SET status = :status WHERE room_no = :room_no");
                $updRoom->execute([':status' => $roomStatus, ':room_no' => $newRoom]);
            }

            $this->conn->commit();

            if ($stmt->rowCount() === 0) {
                $this->respond(["success" => true, "notice" => "No changes recorded (assignment may be unchanged)"]);
            }

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) $this->conn->rollBack();
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE: remove assignment and mark room Available
     */
    public function deleteAssignment($assignmentid) {
        try {
            if (empty($assignmentid)) {
                $this->respond(["success" => false, "error" => "Assignment ID required"], 422);
            }

            // get room_no for this assignment
            $fetch = $this->conn->prepare("SELECT room_no FROM Room_Assignment WHERE assignmentid = :id LIMIT 1");
            $fetch->execute([':id' => $assignmentid]);
            $row = $fetch->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $this->respond(["success" => false, "error" => "Assignment not found"], 404);
            }
            $room_no = $row['room_no'];

            $this->conn->beginTransaction();

            $stmt = $this->conn->prepare("DELETE FROM Room_Assignment WHERE assignmentid = :id");
            $stmt->execute([':id' => $assignmentid]);

            // set room to Available (only if no other active assignment uses it)
            // but since Room_Assignment rows are not flagged active/inactive, we will simply set Available
            $upd = $this->conn->prepare("UPDATE Room SET status = 'Available' WHERE room_no = :room_no");
            $upd->execute([':room_no' => $room_no]);

            $this->conn->commit();

            if ($stmt->rowCount() === 0) {
                $this->respond(["success" => false, "error" => "Assignment not deleted (not found)"], 404);
            }

            $this->respond(["success" => true, "message" => "Assignment deleted"]);
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) $this->conn->rollBack();
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }
}

// --- ROUTER ---
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$method = $_SERVER['REQUEST_METHOD'];
$api = new RoomAssignmentAPI();

switch ($method) {
    case 'GET':
        $api->getAssignments();
        break;
    case 'POST':
        $api->insertAssignment($input);
        break;
    case 'PUT':
        $api->updateAssignment($input);
        break;
    case 'DELETE':
        $api->deleteAssignment($params['assignmentid'] ?? null);
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
