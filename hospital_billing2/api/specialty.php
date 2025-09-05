<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

class Specialty {
  private function connect() {
    include "connection.php"; // Must provide Database() returning PDO connection
    return (new Database())->connect();
  }

  private function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
  }

  private function validateSpecialtyData($data) {
    $missing = [];
    if (empty($data['name'])) $missing[] = 'name';

    if (count($missing) > 0) {
      $this->respond([
        "success" => false,
        "error" => "Missing required fields: " . implode(", ", $missing)
      ], 422);
    }
  }

  function getAllSpecialties() {
    try {
      $conn = $this->connect();
      $stmt = $conn->prepare("SELECT specialtyid, name FROM Specialty ORDER BY name");
      $stmt->execute();
      $specialties = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond($specialties);
    } catch (Exception $e) {
      $this->respond(["error" => "Failed to get specialties: " . $e->getMessage()], 500);
    }
  }

  function insertSpecialty($data) {
    try {
      $conn = $this->connect();
      $data = is_array($data) ? $data : json_decode($data, true);
      $this->validateSpecialtyData($data);

      // Check for duplicate name
      $checkStmt = $conn->prepare("SELECT COUNT(*) FROM Specialty WHERE name = :name");
      $checkStmt->execute([":name" => $data['name']]);
      if ($checkStmt->fetchColumn() > 0) {
        $this->respond(["success" => false, "error" => "Specialty name already exists"], 409);
      }

      $stmt = $conn->prepare("INSERT INTO Specialty (name) VALUES (:name)");
      $stmt->execute([":name" => $data['name']]);
      $this->respond(["success" => true, "specialtyid" => $conn->lastInsertId()]);
    } catch (PDOException $e) {
      $this->respond(["success" => false, "error" => "Insert failed: " . $e->getMessage()], 500);
    }
  }

  function updateSpecialty($data) {
    try {
      $conn = $this->connect();
      $data = is_array($data) ? $data : json_decode($data, true);
      $this->validateSpecialtyData($data);

      if (empty($data['specialtyid'])) {
        $this->respond(["success" => false, "error" => "Specialty ID is required"], 422);
      }

      // Check for duplicate name
      $checkStmt = $conn->prepare("SELECT COUNT(*) FROM Specialty WHERE name = :name AND specialtyid != :specialtyid");
      $checkStmt->execute([":name" => $data['name'], ":specialtyid" => $data['specialtyid']]);
      if ($checkStmt->fetchColumn() > 0) {
        $this->respond(["success" => false, "error" => "Specialty name already exists"], 409);
      }

      $stmt = $conn->prepare("UPDATE Specialty SET name = :name WHERE specialtyid = :specialtyid");
      $stmt->execute([":name" => $data['name'], ":specialtyid" => $data['specialtyid']]);
      $this->respond(["success" => true]);
    } catch (PDOException $e) {
      $this->respond(["success" => false, "error" => "Update failed: " . $e->getMessage()], 500);
    }
  }

  function deleteSpecialty($specialtyid) {
    try {
      if (empty($specialtyid)) {
        $this->respond(["success" => false, "error" => "Specialty ID is required"], 422);
      }

      $conn = $this->connect();

      // Check if specialty is in use by any doctors
      $checkStmt = $conn->prepare("SELECT COUNT(*) FROM Doctor WHERE specialtyid = :specialtyid");
      $checkStmt->execute([":specialtyid" => $specialtyid]);
      if ($checkStmt->fetchColumn() > 0) {
        $this->respond(["success" => false, "error" => "Cannot delete specialty that is assigned to doctors"], 409);
      }

      $stmt = $conn->prepare("DELETE FROM Specialty WHERE specialtyid = :specialtyid");
      $stmt->bindParam(":specialtyid", $specialtyid, PDO::PARAM_INT);
      $stmt->execute();
      $this->respond(["success" => true]);
    } catch (Exception $e) {
      $this->respond(["success" => false, "error" => "Delete failed: " . $e->getMessage()], 500);
    }
  }
}

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);
$operation = $params['operation'] ?? '';
$specialtyid = $params['specialtyid'] ?? '';
$jsonData = [];

if (!empty($params['json'])) {
  $jsonData = is_array($params['json']) ? $params['json'] : json_decode($params['json'], true);
} else if (!empty($input) && !in_array($operation, ['getAllSpecialties', 'deleteSpecialty'])) {
  $jsonData = $input;
}

$specialty = new Specialty();

switch ($operation) {
  case 'getAllSpecialties':
    $specialty->getAllSpecialties();
    break;
  case 'insertSpecialty':
    $specialty->insertSpecialty($jsonData);
    break;
  case 'updateSpecialty':
    $specialty->updateSpecialty($jsonData);
    break;
  case 'deleteSpecialty':
    $specialty->deleteSpecialty($specialtyid);
    break;
  default:
    echo json_encode(["error" => "Invalid operation"]);
    break;
}
?>