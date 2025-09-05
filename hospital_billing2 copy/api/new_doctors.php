<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Database connection parameters
$host = "localhost";
$db_name = "hospital_db";
$username = "root";
$password = "";

// Create PDO connection
try {
    $conn = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

// Get operation from request
$operation = isset($_GET['operation']) ? $_GET['operation'] : '';

// Handle operations
switch ($operation) {
    case "getAllDoctors":
        getAllDoctors($conn);
        break;
    default:
        echo json_encode(["error" => "Invalid operation: {$operation}"]);
}

// Function to get all doctors
function getAllDoctors($conn) {
    try {
        $stmt = $conn->prepare("
            SELECT d.doctorid, d.fullname, d.specialtyid, s.name as specialty_name, d.contact_no, d.status
            FROM Doctor d
            LEFT JOIN Specialty s ON d.specialtyid = s.specialtyid
            ORDER BY d.fullname
        ");
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>