<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

class RoomCategory {
    private function connect() {
        include "connection.php"; // assumes you have Database class
        return (new Database())->connect();
    }

    private function respond($data, int $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    // GET categories (all or single)
    public function get($id = null, $showInactive = false) {
        try {
            $conn = $this->connect();
            if ($id !== null) {
                $stmt = $conn->prepare("SELECT categoryid, name, description, rate_per_day, is_active
                                        FROM Room_Category WHERE categoryid = :id LIMIT 1");
                $stmt->execute([':id' => $id]);
                $category = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$category) return $this->respond(["error" => "Category not found"], 404);
                return $this->respond($category);
            } else {
                if ($showInactive) {
                    $stmt = $conn->prepare("SELECT categoryid, name, description, rate_per_day, is_active
                                            FROM Room_Category ORDER BY name");
                } else {
                    $stmt = $conn->prepare("SELECT categoryid, name, description, rate_per_day, is_active
                                            FROM Room_Category WHERE is_active = 1 ORDER BY name");
                }
                $stmt->execute();
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return $this->respond($categories);
            }
        } catch (Exception $e) {
            return $this->respond(["error" => "Failed to load categories: " . $e->getMessage()], 500);
        }
    }

    // CREATE category
    public function create($data) {
        try {
            $conn = $this->connect();
            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $rate_per_day = $data['rate_per_day'] ?? null;

            if (empty($name) || !is_numeric($rate_per_day) || $rate_per_day < 0) {
                return $this->respond(["error" => "Invalid input"], 422);
            }

            // check duplicate
            $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM Room_Category WHERE name = :name AND is_active = 1");
            $stmtCheck->execute([':name' => $name]);
            if ($stmtCheck->fetchColumn() > 0) {
                return $this->respond(["error" => "Category name already exists"], 409);
            }

            $stmt = $conn->prepare("INSERT INTO Room_Category (name, description, rate_per_day, is_active)
                                    VALUES (:name, :description, :rate_per_day, 1)");
            $stmt->execute([':name' => $name, ':description' => $description, ':rate_per_day' => $rate_per_day]);

            return $this->respond(["message" => "Category created", "categoryid" => $conn->lastInsertId()], 201);
        } catch (Exception $e) {
            return $this->respond(["error" => "Failed to create category: " . $e->getMessage()], 500);
        }
    }

    // UPDATE category
    public function update($id, $data) {
        try {
            $conn = $this->connect();
            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $rate_per_day = $data['rate_per_day'] ?? null;

            if (!$id || empty($name) || !is_numeric($rate_per_day) || $rate_per_day < 0) {
                return $this->respond(["error" => "Invalid input or missing id"], 422);
            }

            // check if exists
            $stmtExist = $conn->prepare("SELECT COUNT(*) FROM Room_Category WHERE categoryid = :id");
            $stmtExist->execute([':id' => $id]);
            if ($stmtExist->fetchColumn() == 0) {
                return $this->respond(["error" => "Category not found"], 404);
            }

            // check duplicate (excluding current id)
            $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM Room_Category WHERE name = :name AND categoryid != :id AND is_active = 1");
            $stmtCheck->execute([':name' => $name, ':id' => $id]);
            if ($stmtCheck->fetchColumn() > 0) {
                return $this->respond(["error" => "Category name already exists"], 409);
            }

            $stmt = $conn->prepare("UPDATE Room_Category
                                    SET name = :name, description = :description, rate_per_day = :rate_per_day
                                    WHERE categoryid = :id");
            $stmt->execute([':name' => $name, ':description' => $description, ':rate_per_day' => $rate_per_day, ':id' => $id]);

            return $this->respond(["message" => "Category updated"]);
        } catch (Exception $e) {
            return $this->respond(["error" => "Failed to update category: " . $e->getMessage()], 500);
        }
    }

    // SOFT DELETE (set is_active = 0)
    public function delete($id) {
        try {
            if (!$id) return $this->respond(["error" => "Missing category id"], 422);

            $conn = $this->connect();
            $stmt = $conn->prepare("UPDATE Room_Category SET is_active = 0 WHERE categoryid = :id");
            $stmt->execute([':id' => $id]);

            return $this->respond(["message" => "Category soft deleted"]);
        } catch (Exception $e) {
            return $this->respond(["error" => "Failed to delete category: " . $e->getMessage()], 500);
        }
    }

    // RESTORE (set is_active = 1)
    public function restore($id) {
        try {
            if (!$id) return $this->respond(["error" => "Missing category id"], 422);

            $conn = $this->connect();
            $stmt = $conn->prepare("UPDATE Room_Category SET is_active = 1 WHERE categoryid = :id");
            $stmt->execute([':id' => $id]);

            return $this->respond(["message" => "Category restored"]);
        } catch (Exception $e) {
            return $this->respond(["error" => "Failed to restore category: " . $e->getMessage()], 500);
        }
    }
}

// ROUTER
$category = new RoomCategory();
$requestMethod = $_SERVER['REQUEST_METHOD'];
parse_str($_SERVER['QUERY_STRING'] ?? '', $queryParams);
$id = $queryParams['id'] ?? null;
$action = $queryParams['action'] ?? null;
$showInactive = isset($queryParams['showInactive']) && ($queryParams['showInactive'] == '1');

$inputData = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($requestMethod) {
    case 'GET':
        $category->get($id, $showInactive);
        break;
    case 'POST':
        $category->create($inputData);
        break;
    case 'PUT':
        $category->update($id, $inputData);
        break;
    case 'DELETE':
        $category->delete($id);
        break;
    case 'PATCH':
        if ($action === 'restore') {
            $category->restore($id);
        } else {
            http_response_code(422);
            echo json_encode(["error" => "Invalid request for patch"]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
