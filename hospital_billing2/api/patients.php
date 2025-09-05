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

class Patient {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    function getAll() {
        try {
            $conn = $this->connect();
            $sql = "SELECT p.*, i.name AS insurance_name
                    FROM Patient p
                    LEFT JOIN Insurance_Provider i ON p.insuranceid = i.insuranceid
                    WHERE p.deleted_at IS NULL
                    ORDER BY p.lastname, p.firstname";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function getById($id) {
        try {
            $conn = $this->connect();
            $sql = "SELECT p.*, i.name AS insurance_name
                    FROM Patient p
                    LEFT JOIN Insurance_Provider i ON p.insuranceid = i.insuranceid
                    WHERE p.patientid = :id AND p.deleted_at IS NULL
                    LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            $this->respond($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function insert($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            // Validate required fields
            if (empty($data['lastname']) || empty($data['firstname']) || empty($data['gender']) || empty($data['birthdate']) || empty($data['address'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }

            // Validate insurance provider if provided
            if (!empty($data['insuranceid'])) {
                $stmt = $conn->prepare("SELECT insuranceid FROM Insurance_Provider WHERE insuranceid = :insuranceid");
                $stmt->execute([":insuranceid" => $data['insuranceid']]);
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid insurance provider ID"], 422);
                }
            }

            $stmt = $conn->prepare("INSERT INTO Patient
                (lastname, firstname, middlename, suffix, gender, civil_status, birthdate, contact_no, email, address, city, province, zipcode, national_id, insuranceid, emergency_name, emergency_relation, emergency_contact)
                VALUES
                (:lastname, :firstname, :middlename, :suffix, :gender, :civil_status, :birthdate, :contact_no, :email, :address, :city, :province, :zipcode, :national_id, :insuranceid, :emergency_name, :emergency_relation, :emergency_contact)");
            $stmt->execute([
                ":lastname" => $data['lastname'],
                ":firstname" => $data['firstname'],
                ":middlename" => $data['middlename'] ?? null,
                ":suffix" => $data['suffix'] ?? null,
                ":gender" => $data['gender'],
                ":civil_status" => $data['civil_status'] ?? null,
                ":birthdate" => $data['birthdate'],
                ":contact_no" => $data['contact_no'] ?? null,
                ":email" => $data['email'] ?? null,
                ":address" => $data['address'],
                ":city" => $data['city'] ?? null,
                ":province" => $data['province'] ?? null,
                ":zipcode" => $data['zipcode'] ?? null,
                ":national_id" => $data['national_id'] ?? null,
                ":insuranceid" => $data['insuranceid'] ?? null,
                ":emergency_name" => $data['emergency_name'] ?? null,
                ":emergency_relation" => $data['emergency_relation'] ?? null,
                ":emergency_contact" => $data['emergency_contact'] ?? null,
            ]);

            $this->respond(["success" => true, "id" => $conn->lastInsertId()]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function update($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            if (empty($data['patientid']) || empty($data['lastname']) || empty($data['firstname']) || empty($data['gender']) || empty($data['birthdate']) || empty($data['address'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }

            // Check if patient exists and not deleted
            $stmt = $conn->prepare("SELECT patientid FROM Patient WHERE patientid = :patientid AND deleted_at IS NULL");
            $stmt->execute([":patientid" => $data['patientid']]);
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Patient not found"], 404);
            }

            // Validate insurance provider if provided
            if (!empty($data['insuranceid'])) {
                $stmt = $conn->prepare("SELECT insuranceid FROM Insurance_Provider WHERE insuranceid = :insuranceid");
                $stmt->execute([":insuranceid" => $data['insuranceid']]);
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid insurance provider ID"], 422);
                }
            }

            $stmt = $conn->prepare("UPDATE Patient SET
                lastname = :lastname,
                firstname = :firstname,
                middlename = :middlename,
                suffix = :suffix,
                gender = :gender,
                civil_status = :civil_status,
                birthdate = :birthdate,
                contact_no = :contact_no,
                email = :email,
                address = :address,
                city = :city,
                province = :province,
                zipcode = :zipcode,
                national_id = :national_id,
                insuranceid = :insuranceid,
                emergency_name = :emergency_name,
                emergency_relation = :emergency_relation,
                emergency_contact = :emergency_contact,
                updated_at = CURRENT_TIMESTAMP
                WHERE patientid = :patientid AND deleted_at IS NULL
            ");

            $stmt->execute([
                ":lastname" => $data['lastname'],
                ":firstname" => $data['firstname'],
                ":middlename" => $data['middlename'] ?? null,
                ":suffix" => $data['suffix'] ?? null,
                ":gender" => $data['gender'],
                ":civil_status" => $data['civil_status'] ?? null,
                ":birthdate" => $data['birthdate'],
                ":contact_no" => $data['contact_no'] ?? null,
                ":email" => $data['email'] ?? null,
                ":address" => $data['address'],
                ":city" => $data['city'] ?? null,
                ":province" => $data['province'] ?? null,
                ":zipcode" => $data['zipcode'] ?? null,
                ":national_id" => $data['national_id'] ?? null,
                ":insuranceid" => $data['insuranceid'] ?? null,
                ":emergency_name" => $data['emergency_name'] ?? null,
                ":emergency_relation" => $data['emergency_relation'] ?? null,
                ":emergency_contact" => $data['emergency_contact'] ?? null,
                ":patientid" => $data['patientid']
            ]);

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function delete($id) {
        try {
            $conn = $this->connect();

            // Check if patient exists and not deleted
            $stmt = $conn->prepare("SELECT patientid FROM Patient WHERE patientid = :id AND deleted_at IS NULL");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Patient not found"], 404);
            }

            // Check for related admissions before deleting
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM Admission WHERE patientid = :id AND deleted_at IS NULL");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result['count'] > 0) {
                $this->respond(["success" => false, "error" => "Cannot delete patient with related admission records"], 422);
            }

            // Soft delete the patient by setting deleted_at
            $stmt = $conn->prepare("UPDATE Patient SET deleted_at = CURRENT_TIMESTAMP WHERE patientid = :id AND deleted_at IS NULL");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }
}

// Request router
$raw = json_decode(file_get_contents("php://input"), true) ?? [];
$operation = $_POST['operation'] ?? $_GET['operation'] ?? $raw['operation'] ?? '';
$json = $_POST['json'] ?? $_GET['json'] ?? $raw['json'] ?? '';
$patientid = $_POST['patientid'] ?? $_GET['patientid'] ?? $raw['patientid'] ?? '';

$patient = new Patient();
switch ($operation) {
    case "getAll":   $patient->getAll(); break;
    case "getById":  $patient->getById($patientid); break;
    case "insert":   $patient->insert($json); break;
    case "update":   $patient->update($json); break;
    case "delete":   $patient->delete($patientid); break;
    default:         echo json_encode(["error" => "Invalid operation"]);
}
