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

class Role {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    function getAllRoles($showInactive = false) {
        try {
            $conn = $this->connect();

            if ($showInactive) {
                $stmt = $conn->prepare("
                    SELECT roleid, name, permissions, status
                    FROM Role
                    ORDER BY roleid ASC
                ");
            } else {
                $stmt = $conn->prepare("
                    SELECT roleid, name, permissions, status
                    FROM Role
                    WHERE status = 'Active'
                    ORDER BY roleid ASC
                ");
            }

            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function getRoleById($id) {
        try {
            if (empty($id)) {
                echo json_encode(["error" => "Role ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("
                SELECT roleid, name, permissions, status
                FROM Role
                WHERE roleid = :id
                LIMIT 1
            ");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function insertRole($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            if (empty($data['name'])) {
                echo json_encode(["success" => false, "error" => "Role name is required"]);
                return;
            }

            $stmt = $conn->prepare("
                INSERT INTO Role (name, permissions, status)
                VALUES (:name, :permissions, 'Active')
            ");
            $stmt->execute([
                ":name" => $data['name'],
                ":permissions" => $data['permissions'] ?? null
            ]);

            echo json_encode(["success" => true, "roleid" => $conn->lastInsertId()]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function updateRole($data) {
        try {
            $conn = $this->connect();
            $data = is_array($data) ? $data : json_decode($data, true);

            if (empty($data['roleid']) || empty($data['name']) || empty($data['status'])) {
                echo json_encode(["success" => false, "error" => "Missing required fields"]);
                return;
            }

            $stmt = $conn->prepare("
                UPDATE Role
                SET name = :name,
                    permissions = :permissions,
                    status = :status
                WHERE roleid = :roleid
            ");
            $stmt->execute([
                ":name" => $data['name'],
                ":permissions" => $data['permissions'] ?? null,
                ":status" => $data['status'],
                ":roleid" => $data['roleid']
            ]);

            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function deleteRole($id) {
        try {
            if (empty($id)) {
                echo json_encode(["success" => false, "error" => "Role ID is required"]);
                return;
            }
            $conn = $this->connect();
            // Soft delete: mark inactive
            $stmt = $conn->prepare("UPDATE Role SET status = 'Inactive' WHERE roleid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Role deactivated"]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function restoreRole($id) {
        try {
            if (empty($id)) {
                echo json_encode(["success" => false, "error" => "Role ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("UPDATE Role SET status = 'Active' WHERE roleid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Role restored"]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }
}

// ==== REQUEST HANDLING ====
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$roleid = $params['roleid'] ?? '';
$showInactive = !empty($params['showInactive']);
$jsonData = is_array($params['json'] ?? null) ? $params['json'] : json_decode($params['json'] ?? "{}", true);
if (empty($jsonData) && !empty($input) && $operation !== 'getAllRoles') {
    $jsonData = $input;
}

$role = new Role();

switch ($operation) {
    case "getAllRoles":
        $role->getAllRoles($showInactive);
        break;
    case "getRoleById":
        $role->getRoleById($roleid);
        break;
    case "insertRole":
        $role->insertRole($jsonData);
        break;
    case "updateRole":
        $role->updateRole($jsonData);
        break;
    case "deleteRole":
        $role->deleteRole($roleid);
        break;
    case "restoreRole":
        $role->restoreRole($roleid);
        break;
    default:
        echo json_encode(["error" => "Invalid operation: {$operation}"]);
}
?>
