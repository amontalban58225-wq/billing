<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include "connection.php";

class Medicine {
    private $conn;

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    private function respond($data, $status=200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    private function validateMedicineData($data, $isUpdate = false) {
        if ($isUpdate) {
            if (empty($data['medicineid']) || !filter_var($data['medicineid'], FILTER_VALIDATE_INT)) {
                return "Missing or invalid medicine ID";
            }
        }
        if (empty($data['brand_name']) || strlen(trim($data['brand_name'])) === 0) {
            return "Medicine name is required";
        }
        if (!isset($data['genericid']) || !filter_var($data['genericid'], FILTER_VALIDATE_INT)) {
            return "Valid generic ID is required";
        }
        if (!isset($data['price']) || !is_numeric($data['price']) || $data['price'] < 0) {
            return "Valid price is required and must be non-negative";
        }
        return true;
    }

    /** ✅ Get all non-deleted medicines */
    public function getAllMedicines() {
        try {
            $stmt = $this->conn->prepare(
                "SELECT m.medicineid, m.brand_name, m.description, m.price, m.genericid, g.generic_name
                 FROM Medicine m
                 LEFT JOIN Generic_Medicine g ON m.genericid = g.genericid
                 WHERE m.is_deleted = 0
                 ORDER BY m.brand_name"
            );
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respond(["success" => true, "data" => $data]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to load medicines: " . $e->getMessage()], 500);
        }
    }

    /** ✅ Insert medicine */
    public function insertMedicine($data) {
        try {
            $validation = $this->validateMedicineData($data);
            if ($validation !== true) {
                $this->respond(["success" => false, "error" => $validation], 422);
            }

            $stmt = $this->conn->prepare(
                "INSERT INTO Medicine (brand_name, genericid, description, price, is_deleted)
                 VALUES (:brand_name, :genericid, :description, :price, 0)"
            );
            $stmt->execute([
                ':brand_name' => trim($data['brand_name']),
                ':genericid' => (int)$data['genericid'],
                ':description' => isset($data['description']) ? trim($data['description']) : '',
                ':price' => (float)$data['price'],
            ]);

            $this->respond(["success" => true, "id" => $this->conn->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to insert medicine: " . $e->getMessage()], 500);
        }
    }

    /** ✅ Update medicine */
    public function updateMedicine($data) {
        try {
            $validation = $this->validateMedicineData($data, true);
            if ($validation !== true) {
                $this->respond(["success" => false, "error" => $validation], 422);
            }

            $stmt = $this->conn->prepare(
                "UPDATE Medicine
                 SET brand_name = :brand_name, genericid = :genericid, description = :description, price = :price
                 WHERE medicineid = :medicineid AND is_deleted = 0"
            );
            $stmt->execute([
                ':medicineid' => (int)$data['medicineid'],
                ':brand_name' => trim($data['brand_name']),
                ':genericid' => (int)$data['genericid'],
                ':description' => isset($data['description']) ? trim($data['description']) : '',
                ':price' => (float)$data['price'],
            ]);

            if ($stmt->rowCount() === 0) {
                $this->respond(["success" => false, "error" => "Medicine not found or already deleted"], 404);
            }

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to update medicine: " . $e->getMessage()], 500);
        }
    }

    /** ✅ Soft delete medicine */
    public function deleteMedicine($medicineid) {
        try {
            if (empty($medicineid) || !filter_var($medicineid, FILTER_VALIDATE_INT)) {
                $this->respond(["success" => false, "error" => "Missing or invalid medicine ID"], 422);
            }

            $stmt = $this->conn->prepare("UPDATE Medicine SET is_deleted = 1 WHERE medicineid = :medicineid");
            $stmt->execute([':medicineid' => (int)$medicineid]);

            if ($stmt->rowCount() === 0) {
                $this->respond(["success" => false, "error" => "Medicine not found or already deleted"], 404);
            }

            $this->respond(["success" => true, "message" => "Medicine soft-deleted"]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to delete medicine: " . $e->getMessage()], 500);
        }
    }
}

// -------------------- ROUTER --------------------
$operation = $_REQUEST['operation'] ?? null;
if (!$operation) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing operation parameter"]);
    exit;
}

$jsonRaw = $_POST['json'] ?? '';
$jsonData = !empty($jsonRaw) ? json_decode($jsonRaw, true) : null;

if ($jsonRaw !== '' && json_last_error() !== JSON_ERROR_NONE && $operation !== 'getAllMedicines') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON: " . json_last_error_msg()]);
    exit;
}

$medicineid = $_REQUEST['medicineid'] ?? null;

$medicine = new Medicine();

switch ($operation) {
    case 'getAllMedicines':
        $medicine->getAllMedicines();
        break;
    case 'insertMedicine':
        if (!is_array($jsonData)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }
        $medicine->insertMedicine($jsonData);
        break;
    case 'updateMedicine':
        if (!is_array($jsonData)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }
        $medicine->updateMedicine($jsonData);
        break;
    case 'deleteMedicine':
        $medicine->deleteMedicine($medicineid);
        break;
    default:
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid operation"]);
        exit;
}
?>
