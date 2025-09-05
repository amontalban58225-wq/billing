<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

class Floor {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    private function validateFloorData($data) {
        $missing = [];
        if (empty($data['name'])) $missing[] = 'name';
        if (count($missing) > 0) {
            $this->respond(["success" => false, "error" => "Missing required fields: " . implode(", ", $missing)], 422);
        }
    }

    // Return only floors that are not soft deleted
    function getAllFloors() {
        try {
            $conn = $this->connect();
            $stmt = $conn->prepare("SELECT floorid, name, is_deleted FROM Floor ORDER BY name");
            $stmt->execute();
            $floors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respond($floors);
        } catch (Exception $e) {
            error_log("getAllFloors error: " . $e->getMessage());
            $this->respond(["success" => false, "error" => "Failed to get floors: " . $e->getMessage()], 500);
        }
    }

    function insertFloor($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);
            $this->validateFloorData($data);

            $check = $conn->prepare("SELECT COUNT(*) FROM Floor WHERE name = :name AND is_deleted = 0");
            $check->execute([":name" => $data['name']]);
            if ($check->fetchColumn() > 0) {
                $this->respond(["success" => false, "error" => "Floor name already exists"], 409);
            }

            $stmt = $conn->prepare("INSERT INTO Floor (name, is_deleted) VALUES (:name, 0)");
            $stmt->execute([":name" => $data['name']]);
            $this->respond(["success" => true, "floorid" => $conn->lastInsertId()]);
        } catch (PDOException $e) {
            error_log("insertFloor error: " . $e->getMessage());
            $this->respond(["success" => false, "error" => "Insert failed: " . $e->getMessage()], 500);
        }
    }

    function updateFloor($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);
            $this->validateFloorData($data);

            if (empty($data['floorid'])) {
                $this->respond(["success" => false, "error" => "Floor ID is required"], 422);
            }

            $check = $conn->prepare("SELECT COUNT(*) FROM Floor WHERE name = :name AND floorid != :floorid AND is_deleted = 0");
            $check->execute([":name" => $data['name'], ":floorid" => $data['floorid']]);
            if ($check->fetchColumn() > 0) {
                $this->respond(["success" => false, "error" => "Floor name already exists"], 409);
            }

            $stmt = $conn->prepare("UPDATE Floor SET name = :name WHERE floorid = :floorid");
            $stmt->execute([":name" => $data['name'], ":floorid" => $data['floorid']]);
            $this->respond(["success" => true]);
        } catch (PDOException $e) {
            error_log("updateFloor error: " . $e->getMessage());
            $this->respond(["success" => false, "error" => "Update failed: " . $e->getMessage()], 500);
        }
    }

    // Soft-delete floor only if no active rooms reference it
    function deleteFloor($floorid) {
        try {
            if (empty($floorid)) {
                $this->respond(["success" => false, "error" => "Floor ID is required"], 422);
            }

            $conn = $this->connect();

            // Check if any active (not soft deleted) rooms exist on this floor
            $checkRooms = $conn->prepare("SELECT COUNT(*) FROM Room WHERE floorid = :floorid AND is_deleted = 0");
            $checkRooms->execute([":floorid" => $floorid]);
            if ($checkRooms->fetchColumn() > 0) {
                $this->respond(["success" => false, "error" => "Cannot delete floor assigned to active rooms"], 409);
            }

            // Soft delete floor
            $stmt = $conn->prepare("UPDATE Floor SET is_deleted = 1 WHERE floorid = :floorid");
            if (!$stmt->execute([":floorid" => $floorid])) {
                $errorInfo = $stmt->errorInfo();
                error_log("Failed to soft delete floor ID {$floorid}: " . json_encode($errorInfo));
                $this->respond(["success" => false, "error" => "Failed to delete floor"], 500);
            }

            $this->respond(["success" => true]);
        } catch (Exception $e) {
            error_log("deleteFloor exception: " . $e->getMessage());
            $this->respond(["success" => false, "error" => "Delete failed: " . $e->getMessage()], 500);
        }
    }

    function restoreFloor($floorid) {
        try {
            if (empty($floorid)) {
                $this->respond(["success" => false, "error" => "Floor ID is required"], 422);
            }

            $conn = $this->connect();

            // Restore the floor
            $stmt = $conn->prepare("UPDATE Floor SET is_deleted = 0 WHERE floorid = :floorid");
            $stmt->execute([":floorid" => $floorid]);
            $this->respond(["success" => true]);
        } catch (Exception $e) {
            error_log("restoreFloor exception: " . $e->getMessage());
            $this->respond(["success" => false, "error" => "Restore failed: " . $e->getMessage()], 500);
        }
    }
}

// Handle incoming operations
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);
$operation = $params['operation'] ?? '';
$floorid = $params['floorid'] ?? '';
$jsonData = [];

if (!empty($params['json'])) {
    $jsonData = is_array($params['json']) ? $params['json'] : json_decode($params['json'], true);
} else if (!empty($input) && !in_array($operation, ['getAllFloors', 'deleteFloor', 'restoreFloor'])) {
    $jsonData = $input;
}

$floor = new Floor();

switch ($operation) {
    case 'getAllFloors':
        $floor->getAllFloors();
        break;
    case 'insertFloor':
        $floor->insertFloor($jsonData);
        break;
    case 'updateFloor':
        $floor->updateFloor($jsonData);
        break;
    case 'deleteFloor':
        $floor->deleteFloor($floorid);
        break;
    case 'restoreFloor':
        $floor->restoreFloor($floorid);
        break;
    default:
        echo json_encode(["error" => "Invalid operation"]);
        break;
}
?>
