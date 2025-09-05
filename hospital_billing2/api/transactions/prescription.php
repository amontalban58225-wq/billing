<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../connection.php';

class PrescriptionAPI {
    private $conn;

    public function __construct() {
        try {
            $this->conn = (new Database())->connect();
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            $this->respond(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()], 500);
        }
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** ========== GET ALL PRESCRIPTIONS ========== */
    public function getAllPrescriptions() {
        try {
            $sql = "
                SELECT p.prescriptionid, p.admissionid, p.medicineid, p.doctorid, p.quantity, p.status, p.prescription_date,
                       CONCAT(pt.lastname, ', ', pt.firstname, ' ', IFNULL(pt.middlename, ''), ' ', IFNULL(pt.suffix, '')) AS patient_name,
                       m.brand_name AS medicine_name,
                       d.fullname AS doctor_name,
                       CASE
                           WHEN p.status = 'Pending' THEN 'badge bg-warning'
                           WHEN p.status = 'Dispensed' THEN 'badge bg-success'
                           WHEN p.status = 'Cancelled' THEN 'badge bg-danger'
                           WHEN p.status = 'Expired' THEN 'badge bg-secondary'
                           ELSE 'badge bg-secondary'
                       END AS status_class,
                       CASE
                           WHEN p.status = 'Pending' THEN 'Pending'
                           WHEN p.status = 'Dispensed' THEN 'Dispensed'
                           WHEN p.status = 'Cancelled' THEN 'Cancelled'
                           WHEN p.status = 'Expired' THEN 'Expired'
                           ELSE p.status
                       END AS status_label
                FROM Prescription p
                JOIN Admission a ON p.admissionid = a.admissionid
                JOIN Patient pt ON a.patientid = pt.patientid
                JOIN Medicine m ON p.medicineid = m.medicineid
                JOIN Doctor d ON p.doctorid = d.doctorid
                WHERE a.status = 'Admitted'
                ORDER BY p.prescription_date DESC
            ";

            $stmt = $this->conn->query($sql);
            $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (PDOException $e) {
            $this->respond(['success' => false, 'error' => 'Failed to fetch prescriptions: ' . $e->getMessage()], 500);
        }
    }

    /** ========== CREATE PRESCRIPTION ========== */
    public function insertPrescription($data) {
        try {
            $admissionid = $data['admissionid'] ?? null;
            $medicineid = $data['medicineid'] ?? null;
            $doctorid = $data['doctorid'] ?? null;
            $quantity = $data['quantity'] ?? null;

            if (!$admissionid || !$medicineid || !$doctorid || !$quantity) {
                $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
            }

            $this->conn->beginTransaction();

            // Validate admission
            $stmt = $this->conn->prepare("SELECT 1 FROM Admission WHERE admissionid = :id AND status = 'Admitted'");
            $stmt->execute([':id' => $admissionid]);
            if (!$stmt->fetch()) {
                $this->conn->rollBack();
                $this->respond(['success' => false, 'error' => 'Invalid or inactive admission'], 422);
            }

            // Validate medicine
            $stmt = $this->conn->prepare("SELECT 1 FROM Medicine WHERE medicineid = :id");
            $stmt->execute([':id' => $medicineid]);
            if (!$stmt->fetch()) {
                $this->conn->rollBack();
                $this->respond(['success' => false, 'error' => 'Invalid medicine'], 422);
            }

            // Validate doctor
            $stmt = $this->conn->prepare("SELECT 1 FROM Doctor WHERE doctorid = :id");
            $stmt->execute([':id' => $doctorid]);
            if (!$stmt->fetch()) {
                $this->conn->rollBack();
                $this->respond(['success' => false, 'error' => 'Invalid doctor'], 422);
            }

            // Insert prescription
            $stmt = $this->conn->prepare("
                INSERT INTO Prescription (admissionid, medicineid, doctorid, quantity, status, prescription_date)
                VALUES (:admissionid, :medicineid, :doctorid, :quantity, 'Pending', NOW())
            ");
            $stmt->execute([
                ':admissionid' => $admissionid,
                ':medicineid' => $medicineid,
                ':doctorid' => $doctorid,
                ':quantity' => $quantity
            ]);

            $newId = $this->conn->lastInsertId();
            $this->conn->commit();

            $this->respond(['success' => true, 'prescriptionid' => $newId], 201);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            $this->respond(['success' => false, 'error' => 'Error inserting prescription: ' . $e->getMessage()], 500);
        }
    }

    /** ========== UPDATE PRESCRIPTION ========== */
    public function updatePrescription($data) {
        try {
            $prescriptionid = $data['prescriptionid'] ?? null;
            $medicineid = $data['medicineid'] ?? null;
            $doctorid = $data['doctorid'] ?? null;
            $quantity = $data['quantity'] ?? null;
            $status = $data['status'] ?? null;

            if (!$prescriptionid || !$medicineid || !$doctorid || !$quantity || !$status) {
                $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
            }

            $this->conn->beginTransaction();

            // Validate prescription
            $stmt = $this->conn->prepare("SELECT 1 FROM Prescription WHERE prescriptionid = :id");
            $stmt->execute([':id' => $prescriptionid]);
            if (!$stmt->fetch()) {
                $this->conn->rollBack();
                $this->respond(['success' => false, 'error' => 'Prescription not found'], 404);
            }
            
            // Update prescription
            $stmt = $this->conn->prepare("
                UPDATE Prescription 
                SET medicineid = :medicineid, 
                    doctorid = :doctorid, 
                    quantity = :quantity, 
                    status = :status 
                WHERE prescriptionid = :prescriptionid
            ");
            
            $stmt->execute([
                ':prescriptionid' => $prescriptionid,
                ':medicineid' => $medicineid,
                ':doctorid' => $doctorid,
                ':quantity' => $quantity,
                ':status' => $status
            ]);

            $this->conn->commit();
            $this->respond(['success' => true, 'message' => 'Prescription updated successfully']);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            $this->respond(['success' => false, 'error' => 'Error updating prescription: ' . $e->getMessage()], 500);
        }
    }

    /** ========== DELETE PRESCRIPTION ========== */
    public function deletePrescription($data) {
        try {
            $prescriptionid = $data['prescriptionid'] ?? null;

            if (!$prescriptionid) {
                $this->respond(['success' => false, 'error' => 'Prescription ID required'], 422);
            }

            $this->conn->beginTransaction();

            // Validate that prescription exists
            $stmt = $this->conn->prepare("SELECT 1 FROM Prescription WHERE prescriptionid = :id");
            $stmt->execute([':id' => $prescriptionid]);
            if (!$stmt->fetch()) {
                $this->conn->rollBack();
                $this->respond(['success' => false, 'error' => 'Prescription not found'], 404);
            }

            // Hard delete prescription
            $stmt = $this->conn->prepare("DELETE FROM Prescription WHERE prescriptionid = :id");
            $stmt->execute([':id' => $prescriptionid]);

            $this->conn->commit();
            $this->respond(['success' => true, 'message' => 'Prescription deleted successfully']);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            $this->respond(['success' => false, 'error' => 'Error deleting prescription: ' . $e->getMessage()], 500);
        }
    }
}

// Handle API requests
$api = new PrescriptionAPI();

// Get request data
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$operation = $_GET['operation'] ?? $input['operation'] ?? null;

if (!$operation) {
    http_response_code(400);
    echo json_encode(['error' => 'Operation required']);
    exit;
}

switch ($operation) {
    case 'getAllPrescriptions':
        $api->getAllPrescriptions();
        break;
    case 'insertPrescription':
        $api->insertPrescription($input);
        break;
    case 'updatePrescription':
        $api->updatePrescription($input);
        break;
    case 'deletePrescription':
        $api->deletePrescription($input);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid operation']);
        exit;
}
?>
