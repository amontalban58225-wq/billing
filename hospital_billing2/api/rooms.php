<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

include "connection.php";

class Room {
  private function connect() {
    return (new Database())->connect();
  }

  private function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
  }

  private function validateRoomData($data) {
    $missing = [];
    if (empty($data['room_no'])) $missing[] = 'room_no';
    if (empty($data['categoryid'])) $missing[] = 'categoryid';
    if (!isset($data['floorid'])) $missing[] = 'floorid';
    if (empty($data['status'])) $missing[] = 'status';

    if (count($missing) > 0) {
      $this->respond([
        "success" => false,
        "error" => "Missing required fields: " . implode(", ", $missing)
      ], 422);
    }
  }

  function getAllRooms() {
    try {
      $conn = $this->connect();
      $stmt = $conn->prepare("
        SELECT r.room_no, r.categoryid, r.floorid, r.status,
               c.name AS category_name,
               f.name AS floor_name
        FROM Room r
        LEFT JOIN Room_Category c ON r.categoryid = c.categoryid
        LEFT JOIN Floor f ON r.floorid = f.floorid
        ORDER BY r.room_no
      ");
      $stmt->execute();
      $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
      $this->respond(["error" => "Failed to get rooms: " . $e->getMessage()], 500);
    }
  }

  function getAvailableRooms() {
    try {
      $conn = $this->connect();
      $stmt = $conn->prepare("
        SELECT r.room_no, r.categoryid, r.floorid, r.status,
               c.name AS category_name,
               f.name AS floor_name
        FROM Room r
        LEFT JOIN Room_Category c ON r.categoryid = c.categoryid
        LEFT JOIN Floor f ON r.floorid = f.floorid
        WHERE r.status = 'Available'
        ORDER BY r.room_no
      ");
      $stmt->execute();
      $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
      $this->respond(["error" => "Failed to get available rooms: " . $e->getMessage()], 500);
    }
  }

  function insertRoom($data) {
    try {
      $conn = $this->connect();
      $this->validateRoomData($data);

      // prevent duplicate room numbers
      $check = $conn->prepare("SELECT COUNT(*) FROM Room WHERE room_no = :room_no");
      $check->execute([":room_no" => $data['room_no']]);
      if ($check->fetchColumn() > 0) {
        $this->respond(["success" => false, "error" => "Room number already exists"], 409);
      }

      $stmt = $conn->prepare("INSERT INTO Room (room_no, categoryid, floorid, status)
                              VALUES (:room_no, :categoryid, :floorid, :status)");
      $stmt->execute([
        ":room_no" => $data['room_no'],
        ":categoryid" => $data['categoryid'],
        ":floorid" => $data['floorid'],
        ":status" => $data['status']
      ]);
      $this->respond(["success" => true, "room_no" => $data['room_no']], 201);
    } catch (PDOException $e) {
      $this->respond(["success" => false, "error" => "Insert failed: " . $e->getMessage()], 500);
    }
  }

  function updateRoom($data) {
    try {
      $conn = $this->connect();
      $this->validateRoomData($data);

      // prevent changing to Occupied if already occupied
      if ($data['status'] === "Occupied") {
        $check = $conn->prepare("SELECT status FROM Room WHERE room_no = :room_no");
        $check->execute([":room_no" => $data['room_no']]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);
        if ($existing && $existing['status'] === "Occupied") {
          $this->respond(["success" => false, "error" => "Room already occupied"], 409);
        }
      }

      $stmt = $conn->prepare("UPDATE Room
                              SET categoryid = :categoryid,
                                  floorid = :floorid,
                                  status = :status
                              WHERE room_no = :room_no");
      $stmt->execute([
        ":categoryid" => $data['categoryid'],
        ":floorid" => $data['floorid'],
        ":status" => $data['status'],
        ":room_no" => $data['room_no']
      ]);

      if ($stmt->rowCount() === 0) {
        $this->respond(["success" => false, "error" => "Room not found"], 404);
      }

      $this->respond(["success" => true, "message" => "Room updated"]);
    } catch (PDOException $e) {
      $this->respond(["success" => false, "error" => "Update failed: " . $e->getMessage()], 500);
    }
  }

  function deleteRoom($room_no) {
    try {
      if (empty($room_no)) {
        $this->respond(["success" => false, "error" => "Room number is required"], 422);
      }
      $conn = $this->connect();

      $stmt = $conn->prepare("DELETE FROM Room WHERE room_no = :room_no");
      $stmt->execute([":room_no" => $room_no]);

      if ($stmt->rowCount() === 0) {
        $this->respond(["success" => false, "error" => "Room not found"], 404);
      }

      $this->respond(["success" => true, "message" => "Room deleted"]);
    } catch (Exception $e) {
      $this->respond(["success" => false, "error" => "Delete failed: " . $e->getMessage()], 500);
    }
  }
}

// --- ROUTER ---
$input = json_decode(file_get_contents("php://input"), true) ?? [];
// handle "json" param from FormData
if (isset($_POST['json'])) {
  $input = json_decode($_POST['json'], true) ?? [];
}
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$room_no = $params['room_no'] ?? '';

$room = new Room();

switch ($operation) {
  case 'getAllRooms':
    $room->getAllRooms();
    break;
  case 'getAvailableRooms':
    $room->getAvailableRooms();
    break;
  case 'insertRoom':
    $room->insertRoom($input);
    break;
  case 'updateRoom':
    $room->updateRoom($input);
    break;
  case 'deleteRoom':
    $room->deleteRoom($room_no);
    break;
  default:
    http_response_code(400);
    echo json_encode(["error" => "Invalid operation"]);
}
