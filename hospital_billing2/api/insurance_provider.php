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

class InsuranceProvider {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    function getAll($showInactive = false) {
        try {
            $conn = $this->connect();

            if ($showInactive) {
                $stmt = $conn->prepare("SELECT * FROM Insurance_Provider ORDER BY name");
            } else {
                $stmt = $conn->prepare("SELECT * FROM Insurance_Provider WHERE is_active = 1 ORDER BY name");
            }

            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respond($data ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => "Failed to load providers: " . $e->getMessage()], 500);
        }
    }

    function getById($id) {
        try {
            $conn = $this->connect();
            $stmt = $conn->prepare("SELECT * FROM Insurance_Provider WHERE insuranceid = :id LIMIT 1");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->respond($data ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => "Failed to get provider: " . $e->getMessage()], 500);
        }
    }

    function insert($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            if (empty($data['name'])) {
                $this->respond(["success" => false, "error" => "Provider name required"], 422);
            }

            $stmt = $conn->prepare("INSERT INTO Insurance_Provider (name, coverage_percent, description, is_active)
                                    VALUES (:name, :coverage_percent, :description, 1)");
            $stmt->execute([
                ":name"            => $data['name'],
                ":coverage_percent"=> $data['coverage_percent'] ?? 0,
                ":description"     => $data['description'] ?? null
            ]);

            $this->respond(["success" => true, "id" => $conn->lastInsertId()]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to insert provider: " . $e->getMessage()], 500);
        }
    }

    function update($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            if (empty($data['insuranceid']) || empty($data['name'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }

            $stmt = $conn->prepare("UPDATE Insurance_Provider
                                    SET name = :name, coverage_percent = :coverage_percent, description = :description
                                    WHERE insuranceid = :insuranceid");
            $stmt->execute([
                ":name"            => $data['name'],
                ":coverage_percent"=> $data['coverage_percent'] ?? 0,
                ":description"     => $data['description'] ?? null,
                ":insuranceid"     => $data['insuranceid']
            ]);

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to update provider: " . $e->getMessage()], 500);
        }
    }

    function delete($id) {
        try {
            if (empty($id)) {
                $this->respond(["success" => false, "error" => "Provider ID is required"], 422);
            }

            $conn = $this->connect();
            // Soft delete: mark inactive
            $stmt = $conn->prepare("UPDATE Insurance_Provider SET is_active = 0 WHERE insuranceid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();

            $this->respond(["success" => true, "message" => "Provider deactivated"]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to deactivate provider: " . $e->getMessage()], 500);
        }
    }

    function restore($id) {
        try {
            if (empty($id)) {
                $this->respond(["success" => false, "error" => "Provider ID is required"], 422);
            }

            $conn = $this->connect();
            $stmt = $conn->prepare("UPDATE Insurance_Provider SET is_active = 1 WHERE insuranceid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();

            $this->respond(["success" => true, "message" => "Provider restored"]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => "Failed to restore provider: " . $e->getMessage()], 500);
        }
    }
}

// Router logic
$raw = json_decode(file_get_contents("php://input"), true) ?? [];
$operation    = $_POST['operation']    ?? $_GET['operation']    ?? $raw['operation']    ?? '';
$json         = $_POST['json']         ?? $_GET['json']         ?? $raw['json']         ?? '';
$insuranceid  = $_POST['insuranceid']  ?? $_GET['insuranceid']  ?? $raw['insuranceid']  ?? '';
$showInactive = $_POST['showInactive'] ?? $_GET['showInactive'] ?? $raw['showInactive'] ?? false;

$provider = new InsuranceProvider();

switch ($operation) {
    case "getAll":   $provider->getAll($showInactive); break;
    case "getById":  $provider->getById($insuranceid); break;
    case "insert":   $provider->insert($json); break;
    case "update":   $provider->update($json); break;
    case "delete":   $provider->delete($insuranceid); break;
    case "restore":  $provider->restore($insuranceid); break;
    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid operation"]);
        exit;
}
?>
