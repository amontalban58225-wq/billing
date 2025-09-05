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

class LabTestCategory {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    function getAllCategories($showInactive = false) {
        try {
            $conn = $this->connect();

            if ($showInactive) {
                $stmt = $conn->prepare("
                    SELECT labtestcatid, name, description, handling_fee, turnaround_days, is_active
                    FROM Lab_Test_Category
                    ORDER BY name
                ");
            } else {
                $stmt = $conn->prepare("
                    SELECT labtestcatid, name, description, handling_fee, turnaround_days, is_active
                    FROM Lab_Test_Category
                    WHERE is_active = 1
                    ORDER BY name
                ");
            }

            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function getCategoryById($id) {
        try {
            if (empty($id)) {
                echo json_encode(["error" => "Category ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("
                SELECT labtestcatid, name, description, handling_fee, turnaround_days, is_active
                FROM Lab_Test_Category
                WHERE labtestcatid = :id
                LIMIT 1
            ");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function insertCategory($data) {
        try {
            $conn = $this->connect();
            if (empty($data['name']) || empty($data['handling_fee']) || empty($data['turnaround_days'])) {
                echo json_encode(["success" => false, "error" => "Missing required fields"]);
                return;
            }
            $stmt = $conn->prepare("
                INSERT INTO Lab_Test_Category (name, description, handling_fee, turnaround_days, is_active)
                VALUES (:name, :description, :handling_fee, :turnaround_days, 1)
            ");
            $stmt->execute([
                ":name" => $data['name'],
                ":description" => $data['description'] ?? '',
                ":handling_fee" => $data['handling_fee'],
                ":turnaround_days" => $data['turnaround_days']
            ]);
            echo json_encode(["success" => true, "labtestcatid" => $conn->lastInsertId()]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function updateCategory($data) {
        try {
            $conn = $this->connect();
            if (empty($data['labtestcatid']) || empty($data['name']) || empty($data['handling_fee']) || empty($data['turnaround_days'])) {
                echo json_encode(["success" => false, "error" => "Missing required fields"]);
                return;
            }
            $stmt = $conn->prepare("
                UPDATE Lab_Test_Category
                SET name = :name,
                    description = :description,
                    handling_fee = :handling_fee,
                    turnaround_days = :turnaround_days
                WHERE labtestcatid = :labtestcatid
            ");
            $stmt->execute([
                ":name" => $data['name'],
                ":description" => $data['description'] ?? '',
                ":handling_fee" => $data['handling_fee'],
                ":turnaround_days" => $data['turnaround_days'],
                ":labtestcatid" => $data['labtestcatid']
            ]);
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function deleteCategory($id) {
        try {
            if (empty($id)) {
                echo json_encode(["success" => false, "error" => "Category ID is required"]);
                return;
            }
            $conn = $this->connect();
            // Soft delete: mark inactive
            $stmt = $conn->prepare("UPDATE Lab_Test_Category SET is_active = 0 WHERE labtestcatid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Category deactivated"]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function restoreCategory($id) {
        try {
            if (empty($id)) {
                echo json_encode(["success" => false, "error" => "Category ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("UPDATE Lab_Test_Category SET is_active = 1 WHERE labtestcatid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Category restored"]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }
}

// ===== REQUEST HANDLING =====
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$categoryid = $params['labtestcatid'] ?? '';
$showInactive = !empty($params['showInactive']);
$jsonData = is_array($params['json'] ?? null) ? $params['json'] : json_decode($params['json'] ?? "{}", true);
if (empty($jsonData) && !empty($input) && $operation !== 'getAllCategories') {
    $jsonData = $input;
}

$category = new LabTestCategory();
switch ($operation) {
    case "getAllCategories":
        $category->getAllCategories($showInactive);
        break;
    case "getCategoryById":
        $category->getCategoryById($categoryid);
        break;
    case "insertCategory":
        $category->insertCategory($jsonData);
        break;
    case "updateCategory":
        $category->updateCategory($jsonData);
        break;
    case "deleteCategory":
        $category->deleteCategory($categoryid);
        break;
    case "restoreCategory":
        $category->restoreCategory($categoryid);
        break;
    default:
        echo json_encode(["error" => "Invalid operation: {$operation}"]);
}
?>
