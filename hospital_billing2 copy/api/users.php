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

class User {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    function getAllUsers() {
        try {
            $conn = $this->connect();
            $sql = "SELECT u.userid, u.username, u.roleid, r.name AS role_name, u.status
                    FROM User u
                    LEFT JOIN Role r ON u.roleid = r.roleid
                    ORDER BY u.userid ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }
    function getUserById($id) {
        try {
            if (empty($id)) {
                $this->respond(["error" => "User ID is required"], 422);
            }
            $conn = $this->connect();
            $sql = "SELECT u.userid, u.username, u.roleid, r.name AS role_name, u.status
                    FROM User u
                    LEFT JOIN Role r ON u.roleid = r.roleid
                    WHERE u.userid = :id LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            $this->respond($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function insertUser($data) {
        try {
            $data = is_array($data) ? $data : json_decode($data, true);
            if (empty($data['username']) || empty($data['roleid']) || empty($data['password'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }
            $conn = $this->connect();
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

            // Status is forced active on insert
            $stmt = $conn->prepare("INSERT INTO User (username, roleid, password, status) VALUES (:username, :roleid, :password, 'Active')");
            $stmt->execute([
                ":username" => $data['username'],
                ":roleid" => $data['roleid'],
                ":password" => $passwordHash
            ]);
            $this->respond(["success" => true, "userid" => $conn->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function updateUser($data) {
        try {
            $data = is_array($data) ? $data : json_decode($data, true);
            if (empty($data['userid']) || empty($data['username']) || empty($data['roleid']) || empty($data['status'])) {
                $this->respond(["success" => false, "error" => "Missing required fields"], 422);
            }
            $conn = $this->connect();

            if (!empty($data['password'])) {
                $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
                $sql = "UPDATE User SET username=:username, roleid=:roleid, password=:password, status=:status WHERE userid=:userid";
                $params = [
                    ":username" => $data['username'],
                    ":roleid" => $data['roleid'],
                    ":password" => $passwordHash,
                    ":status" => $data['status'],
                    ":userid" => $data['userid']
                ];
            } else {
                $sql = "UPDATE User SET username=:username, roleid=:roleid, status=:status WHERE userid=:userid";
                $params = [
                    ":username" => $data['username'],
                    ":roleid" => $data['roleid'],
                    ":status" => $data['status'],
                    ":userid" => $data['userid']
                ];
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function deleteUser($id) {
        try {
            if (empty($id)) {
                $this->respond(["success" => false, "error" => "User ID is required"], 422);
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("DELETE FROM User WHERE userid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            $this->respond(["success" => true]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }
}

// Router
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$operation = $_POST['operation'] ?? $_GET['operation'] ?? $input['operation'] ?? '';
$jsonData = $_POST['json'] ?? $_GET['json'] ?? $input['json'] ?? '';
$userid = $_POST['userid'] ?? $_GET['userid'] ?? $input['userid'] ?? '';

$user = new User();

switch ($operation) {
    case "getAllUsers": $user->getAllUsers(); break;
    case "getUserById": $user->getUserById($userid); break;
    case "insertUser": $user->insertUser($jsonData); break;
    case "updateUser": $user->updateUser($jsonData); break;
    case "deleteUser": $user->deleteUser($userid); break;
    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid operation"]);
        break;
}
?>
