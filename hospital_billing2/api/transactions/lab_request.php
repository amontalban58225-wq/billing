<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

class LabRequestAPI {
    private function connect() {
        include __DIR__ . "/../connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    function getAllLabRequests() {
        try {
            $conn = $this->connect();
            $stmt = $conn->query("
                SELECT lr.lab_requestid, lr.admissionid, lr.requestedBy, lr.testid, lr.status,
                       CONCAT(p.lastname, ', ', p.firstname, ' ', IFNULL(p.middlename, ''), ' ', IFNULL(p.suffix, '')) AS patient_name,
                       d.fullname AS doctor_name,
                       lt.name AS test_name,
                       lt.price AS test_price,
                       ltc.name AS category_name,
                       a.admission_date
                FROM Lab_Request lr
                JOIN Admission a ON lr.admissionid = a.admissionid
                JOIN Patient p ON a.patientid = p.patientid
                JOIN Doctor d ON lr.requestedBy = d.doctorid
                JOIN Lab_Test lt ON lr.testid = lt.testid
                JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid
                ORDER BY lr.lab_requestid DESC
            ");
            $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function getLabRequestById($id) {
        try {
            if (empty($id)) {
                $this->respond(["error" => "Lab Request ID is required"], 422);
            }
            
            $conn = $this->connect();
            $stmt = $conn->prepare("
                SELECT lr.lab_requestid, lr.admissionid, lr.requestedBy, lr.testid, lr.status,
                       CONCAT(p.lastname, ', ', p.firstname, ' ', IFNULL(p.middlename, ''), ' ', IFNULL(p.suffix, '')) AS patient_name,
                       d.fullname AS doctor_name,
                       lt.name AS test_name,
                       lt.price AS test_price,
                       ltc.name AS category_name,
                       a.admission_date
                FROM Lab_Request lr
                JOIN Admission a ON lr.admissionid = a.admissionid
                JOIN Patient p ON a.patientid = p.patientid
                JOIN Doctor d ON lr.requestedBy = d.doctorid
                JOIN Lab_Test lt ON lr.testid = lt.testid
                JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid
                WHERE lr.lab_requestid = :id
            ");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$result) {
                $this->respond(["error" => "Lab Request not found"], 404);
            }
            
            $this->respond($result);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function insertLabRequest($data) {
        try {
            $data = is_array($data) ? $data : json_decode($data, true);
            if (empty($data['admissionid']) || empty($data['requestedBy']) || empty($data['testid'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }
            
            $conn = $this->connect();
            
            // Validate admission exists
            $stmt = $conn->prepare("SELECT admissionid FROM Admission WHERE admissionid = :admissionid");
            $stmt->bindParam(':admissionid', $data['admissionid'], PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Invalid admission ID"], 422);
            }
            
            // Validate doctor exists
            $stmt = $conn->prepare("SELECT doctorid FROM Doctor WHERE doctorid = :doctorid");
            $stmt->bindParam(':doctorid', $data['requestedBy'], PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Invalid doctor ID"], 422);
            }
            
            // Validate test exists
            $stmt = $conn->prepare("SELECT testid FROM Lab_Test WHERE testid = :testid");
            $stmt->bindParam(':testid', $data['testid'], PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Invalid test ID"], 422);
            }
            
            // Insert lab request
            $stmt = $conn->prepare("
                INSERT INTO Lab_Request (admissionid, requestedBy, testid, status)
                VALUES (:admissionid, :requestedBy, :testid, :status)
            ");
            
            $status = $data['status'] ?? 'Pending';
            
            $stmt->bindParam(':admissionid', $data['admissionid'], PDO::PARAM_INT);
            $stmt->bindParam(':requestedBy', $data['requestedBy'], PDO::PARAM_INT);
            $stmt->bindParam(':testid', $data['testid'], PDO::PARAM_INT);
            $stmt->bindParam(':status', $status, PDO::PARAM_STR);
            $stmt->execute();
            
            $this->respond([
                "success" => true,
                "lab_requestid" => $conn->lastInsertId(),
                "message" => "Lab request created successfully"
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function updateLabRequest($data) {
        try {
            $data = is_array($data) ? $data : json_decode($data, true);
            if (empty($data['lab_requestid'])) {
                $this->respond(["success" => false, "error" => "Lab Request ID is required"], 422);
            }
            
            $conn = $this->connect();
            
            // Check if lab request exists
            $stmt = $conn->prepare("SELECT lab_requestid FROM Lab_Request WHERE lab_requestid = :id");
            $stmt->bindParam(':id', $data['lab_requestid'], PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Lab Request not found"], 404);
            }
            
            // Build update query dynamically based on provided fields
            $updateFields = [];
            $params = [':id' => $data['lab_requestid']];
            
            if (isset($data['admissionid'])) {
                $updateFields[] = "admissionid = :admissionid";
                $params[':admissionid'] = $data['admissionid'];
                
                // Validate admission exists
                $stmt = $conn->prepare("SELECT admissionid FROM Admission WHERE admissionid = :admissionid");
                $stmt->bindParam(':admissionid', $data['admissionid'], PDO::PARAM_INT);
                $stmt->execute();
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid admission ID"], 422);
                }
            }
            
            if (isset($data['requestedBy'])) {
                $updateFields[] = "requestedBy = :requestedBy";
                $params[':requestedBy'] = $data['requestedBy'];
                
                // Validate doctor exists
                $stmt = $conn->prepare("SELECT doctorid FROM Doctor WHERE doctorid = :doctorid");
                $stmt->bindParam(':doctorid', $data['requestedBy'], PDO::PARAM_INT);
                $stmt->execute();
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid doctor ID"], 422);
                }
            }
            
            if (isset($data['testid'])) {
                $updateFields[] = "testid = :testid";
                $params[':testid'] = $data['testid'];
                
                // Validate test exists
                $stmt = $conn->prepare("SELECT testid FROM Lab_Test WHERE testid = :testid");
                $stmt->bindParam(':testid', $data['testid'], PDO::PARAM_INT);
                $stmt->execute();
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid test ID"], 422);
                }
            }
            
            if (isset($data['status'])) {
                $updateFields[] = "status = :status";
                $params[':status'] = $data['status'];
            }
            
            if (empty($updateFields)) {
                $this->respond(["success" => false, "error" => "No fields to update"], 422);
            }
            
            // Execute update
            $sql = "UPDATE Lab_Request SET " . implode(", ", $updateFields) . " WHERE lab_requestid = :id";
            $stmt = $conn->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();
            
            $this->respond([
                "success" => true,
                "message" => "Lab request updated successfully"
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function deleteLabRequest($id) {
        try {
            if (empty($id)) {
                $this->respond(["success" => false, "error" => "Lab Request ID is required"], 422);
            }
            
            $conn = $this->connect();
            
            // Check if lab request exists
            $stmt = $conn->prepare("SELECT lab_requestid FROM Lab_Request WHERE lab_requestid = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Lab Request not found"], 404);
            }
            
            // Delete lab request
            $stmt = $conn->prepare("DELETE FROM Lab_Request WHERE lab_requestid = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $this->respond([
                "success" => true,
                "message" => "Lab request deleted successfully"
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }
}

// ===== REQUEST HANDLING =====
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$lab_requestid = $params['lab_requestid'] ?? '';
$jsonData = is_array($params['json'] ?? null) ? $params['json'] : json_decode($params['json'] ?? "{}", true);
if (empty($jsonData) && !empty($input) && $operation !== 'getAllLabRequests') {
    $jsonData = $input;
}

$api = new LabRequestAPI();
switch ($operation) {
    case "getAllLabRequests":
        $api->getAllLabRequests();
        break;
    case "getLabRequestById":
        $api->getLabRequestById($lab_requestid);
        break;
    case "insertLabRequest":
        $api->insertLabRequest($jsonData);
        break;
    case "updateLabRequest":
        $api->updateLabRequest($jsonData);
        break;
    case "deleteLabRequest":
        $api->deleteLabRequest($lab_requestid);
        break;
    default:
        echo json_encode(["error" => "Invalid operation: {$operation}"]);
}