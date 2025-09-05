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

class LabTest {
    private function connect() {
        include "connection.php";
        return (new Database())->connect();
    }

    function getAllTests() {
        try {
            $conn = $this->connect();
            $stmt = $conn->prepare("SELECT lt.*, ltc.name as category_name
                                   FROM Lab_test lt
                                   LEFT JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid
                                   ORDER BY lt.name");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function getTestById($id) {
        try {
            if (empty($id)) {
                echo json_encode(["error" => "Test ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("SELECT lt.*, ltc.name as category_name
                                   FROM Lab_test lt
                                   LEFT JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid
                                   WHERE lt.testid = :id LIMIT 1");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    function insertTest($data) {
        try {
            $conn = $this->connect();
            if (empty($data['name']) || empty($data['categoryid']) || empty($data['price'])) {
                echo json_encode(["success" => false, "error" => "Missing required fields"]);
                return;
            }
            $stmt = $conn->prepare("INSERT INTO Lab_test (name, categoryid, price, description) VALUES (:name, :categoryid, :price, :description)");
            $stmt->execute([
                ":name" => $data['name'],
                ":categoryid" => $data['categoryid'],
                ":price" => $data['price'],
                ":description" => $data['description'] ?? ''
            ]);
            echo json_encode(["success" => true, "testid" => $conn->lastInsertId()]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function updateTest($data) {
        try {
            $conn = $this->connect();
            if (empty($data['testid']) || empty($data['name']) || empty($data['categoryid']) || empty($data['price'])) {
                echo json_encode(["success" => false, "error" => "Missing required fields"]);
                return;
            }
            $stmt = $conn->prepare("UPDATE Lab_test SET name=:name, categoryid=:categoryid, price=:price, description=:description WHERE testid=:testid");
            $stmt->execute([
                ":name" => $data['name'],
                ":categoryid" => $data['categoryid'],
                ":price" => $data['price'],
                ":description" => $data['description'] ?? '',
                ":testid" => $data['testid']
            ]);
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }

    function deleteTest($id) {
        try {
            if (empty($id)) {
                echo json_encode(["success" => false, "error" => "Test ID is required"]);
                return;
            }
            $conn = $this->connect();
            $stmt = $conn->prepare("DELETE FROM Lab_test WHERE testid = :id");
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }
}

// ===== REQUEST HANDLING =====
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$testid = $params['testid'] ?? '';
$jsonData = is_array($params['json'] ?? null) ? $params['json'] : json_decode($params['json'] ?? "{}", true);
if (empty($jsonData) && !empty($input) && $operation !== 'getAllTests') {
    $jsonData = $input;
}

$test = new LabTest();
switch ($operation) {
    case "getAllTests":
        $test->getAllTests();
        break;
    case "getTestById":
        $test->getTestById($testid);
        break;
    case "insertTest":
        $test->insertTest($jsonData);
        break;
    case "updateTest":
        $test->updateTest($jsonData);
        break;
    case "deleteTest":
        $test->deleteTest($testid);
        break;
    default:
        echo json_encode(["error" => "Invalid operation: {$operation}"]);
}
?>
