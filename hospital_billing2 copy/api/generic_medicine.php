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

class GenericMedicine {
    private $conn;

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    private function logError($msg) {
        error_log("[GenericMedicine API] " . $msg);
    }

    /** ✅ Get all non-deleted generics */
    public function getAllGenericMedicines() {
        try {
            $stmt = $this->conn->prepare("SELECT genericid, generic_name
                                          FROM Generic_Medicine
                                          WHERE is_deleted = 0
                                          ORDER BY generic_name");
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respond(["success" => true, "data" => $data]);
        } catch (Exception $e) {
            $this->logError($e->getMessage());
            $this->respond(["success" => false, "error" => "Failed to get generics"], 500);
        }
    }

    /** ✅ Insert new generic */
    public function insertGenericMedicine($data) {
        try {
            if (empty($data['generic_name']) || strlen(trim($data['generic_name'])) === 0) {
                $this->respond(["success" => false, "error" => "Generic name required"], 422);
            }
            $name = trim($data['generic_name']);
            $stmt = $this->conn->prepare("SELECT COUNT(*)
                                          FROM Generic_Medicine
                                          WHERE generic_name = :name AND is_deleted = 0");
            $stmt->execute([':name' => $name]);
            if ($stmt->fetchColumn() > 0) {
                $this->respond(["success" => false, "error" => "Generic medicine already exists"], 409);
            }

            $stmt = $this->conn->prepare("INSERT INTO Generic_Medicine (generic_name, is_deleted) VALUES (:name, 0)");
            $stmt->execute([':name' => $name]);

            $this->respond(["success" => true, "id" => $this->conn->lastInsertId()], 201);
        } catch (PDOException $e) {
            $this->logError($e->getMessage());
            $this->respond(["success" => false, "error" => "Insert failed"], 500);
        }
    }

    /** ✅ Update existing generic */
    public function updateGenericMedicine($data) {
        try {
            if (empty($data['genericid']) || !filter_var($data['genericid'], FILTER_VALIDATE_INT)) {
                $this->respond(["success" => false, "error" => "Invalid genericid"], 422);
            }
            if (empty($data['generic_name']) || strlen(trim($data['generic_name'])) === 0) {
                $this->respond(["success" => false, "error" => "Generic name required"], 422);
            }

            $id = (int)$data['genericid'];
            $name = trim($data['generic_name']);

            $stmt = $this->conn->prepare("SELECT COUNT(*) FROM Generic_Medicine WHERE genericid = :id AND is_deleted = 0");
            $stmt->execute([':id' => $id]);
            if ($stmt->fetchColumn() === 0) {
                $this->respond(["success" => false, "error" => "Generic medicine not found"], 404);
            }

            $stmt = $this->conn->prepare("SELECT COUNT(*) FROM Generic_Medicine
                                          WHERE generic_name = :name AND genericid != :id AND is_deleted = 0");
            $stmt->execute([':name' => $name, ':id' => $id]);
            if ($stmt->fetchColumn() > 0) {
                $this->respond(["success" => false, "error" => "Another generic medicine with this name exists"], 409);
            }

            $stmt = $this->conn->prepare("UPDATE Generic_Medicine SET generic_name = :name WHERE genericid = :id");
            $stmt->execute([':name' => $name, ':id' => $id]);

            $this->respond(["success" => true]);
        } catch (PDOException $e) {
            $this->logError($e->getMessage());
            $this->respond(["success" => false, "error" => "Update failed"], 500);
        }
    }

    /** ✅ Soft delete */
    public function deleteGenericMedicine($genericid) {
        try {
            if (empty($genericid) || !filter_var($genericid, FILTER_VALIDATE_INT)) {
                $this->respond(["success" => false, "error" => "Invalid genericid"], 422);
            }

            // Always soft delete, even if referenced
            $stmt = $this->conn->prepare("UPDATE Generic_Medicine SET is_deleted = 1 WHERE genericid = :id");
            $stmt->execute([':id' => (int)$genericid]);

            $this->respond(["success" => true, "message" => "Generic medicine soft-deleted"]);
        } catch (PDOException $e) {
            $this->logError($e->getMessage());
            $this->respond(["success" => false, "error" => "Delete failed"], 500);
        }
    }
}

$operation = $_REQUEST['operation'] ?? null;
if (!$operation) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing operation"]);
    exit;
}

$jsonRaw = $_POST['json'] ?? '';
$jsonData = !empty($jsonRaw) ? json_decode($jsonRaw, true) : null;

if ($jsonRaw !== '' && json_last_error() !== JSON_ERROR_NONE && $operation !== 'getAllGenericMedicines') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON: " . json_last_error_msg()]);
    exit;
}

$genericid = $_REQUEST['genericid'] ?? null;

$genericMedicine = new GenericMedicine();

switch ($operation) {
    case 'getAllGenericMedicines':
        $genericMedicine->getAllGenericMedicines();
        break;
    case 'insertGenericMedicine':
        if (!is_array($jsonData)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }
        $genericMedicine->insertGenericMedicine($jsonData);
        break;
    case 'updateGenericMedicine':
        if (!is_array($jsonData)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }
        $genericMedicine->updateGenericMedicine($jsonData);
        break;
    case 'deleteGenericMedicine':
        $genericMedicine->deleteGenericMedicine($genericid);
        break;
    default:
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid operation"]);
        break;
}
?>
