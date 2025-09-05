<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once __DIR__ . '/../connection.php';

class DoctorAssignment {
    private $conn;
    public function __construct() {
        $this->conn = (new Database())->connect();
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    private function respond($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function parsePayload($payload) {
        if (is_array($payload)) return $payload;
        if (is_string($payload) && trim($payload) !== '') {
            $decoded = json_decode($payload, true);
            if (json_last_error() === JSON_ERROR_NONE) return $decoded;
        }
        return [];
    }

    public function getAssignments() {
        $sql = "SELECT
                    da.assignmentid, da.admissionid, da.doctorid, da.role, da.notes, da.pf_override,
                    CONCAT(p.lastname, ', ', p.firstname, ' ', IFNULL(p.middlename,''), ' ', IFNULL(p.suffix,'')) AS patient_name,
                    d.fullname AS doctor_name,
                    d.professional_fee AS default_pf
                FROM Doctor_Assignment da
                LEFT JOIN Admission a ON da.admissionid = a.admissionid
                LEFT JOIN Patient p ON a.patientid = p.patientid
                LEFT JOIN Doctor d ON da.doctorid = d.doctorid
                WHERE da.deleted_at IS NULL
                ORDER BY da.assignmentid DESC";
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $this->respond(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function checkDuplicate($doctorid, $admissionid, $excludeId = null) {
        $sql = "SELECT 1 FROM Doctor_Assignment WHERE doctorid = :did AND admissionid = :aid AND deleted_at IS NULL";
        if ($excludeId !== null) {
            $sql .= " AND assignmentid != :excludeId";
        }
        $stmt = $this->conn->prepare($sql);
        $params = [':did' => $doctorid, ':aid' => $admissionid];
        if ($excludeId !== null) $params[':excludeId'] = $excludeId;
        $stmt->execute($params);
        return (bool) $stmt->fetchColumn();
    }

    public function insertAssignment($payload) {
        $data = $this->parsePayload($payload);
        if (empty($data['admissionid']) || empty($data['doctorid']) || empty($data['role'])) {
            $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
        }
        // Check for duplicate
        if ($this->checkDuplicate($data['doctorid'], $data['admissionid'])) {
            $this->respond(['success' => false, 'error' => 'This doctor is already assigned to this admission'], 422);
        }
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO Doctor_Assignment (admissionid, doctorid, role, pf_override, notes)
                VALUES (:aid, :did, :role, :pf, :notes)");
            $stmt->execute([
                ':aid' => $data['admissionid'],
                ':did' => $data['doctorid'],
                ':role' => $data['role'],
                ':pf'  => $data['pf_override'] ?? null,
                ':notes' => $data['notes'] ?? ''
            ]);
            $this->respond(['success' => true, 'assignmentid' => $this->conn->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function updateAssignment($payload) {
        $data = $this->parsePayload($payload);
        if (empty($data['assignmentid']) || empty($data['doctorid']) || empty($data['role'])) {
            $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
        }
        // Check for duplicate excluding current record
        if ($this->checkDuplicate($data['doctorid'], $data['admissionid'], $data['assignmentid'])) {
            $this->respond(['success' => false, 'error' => 'This doctor is already assigned to this admission'], 422);
        }
        try {
            $stmt = $this->conn->prepare("
                            UPDATE Doctor_Assignment
                SET admissionid=:aid, doctorid=:did, role=:role, pf_override=:pf, notes=:notes
                WHERE assignmentid=:id AND deleted_at IS NULL");
            $stmt->execute([
                ':aid' => $data['admissionid'],
                ':did' => $data['doctorid'],
                ':role' => $data['role'],
                ':pf'   => $data['pf_override'] ?? null,
                ':notes'=> $data['notes'] ?? '',
                ':id'   => $data['assignmentid']
            ]);
            $this->respond(['success' => true, 'message' => 'Assignment updated']);
        } catch (Exception $e) {
            $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteAssignment($id) {
        if (empty($id)) {
            $this->respond(['success' => false, 'error' => 'Assignment id required'], 422);
        }
        try {
            $stmt = $this->conn->prepare("UPDATE Doctor_Assignment SET deleted_at=NOW() WHERE assignmentid=:id AND deleted_at IS NULL");
            $stmt->execute([':id' => $id]);
            if ($stmt->rowCount() === 0) {
                $this->respond(['success' => false, 'error' => 'Assignment not found or already deleted'], 404);
            }
            $this->respond(['success' => true, 'message' => 'Assignment deleted']);
        } catch (Exception $e) {
            $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}

$api = new DoctorAssignment();
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (isset($_POST['json'])) $input = json_decode($_POST['json'], true) ?? $input;

$params = array_merge($_GET, $_POST, $input);
$operation = $params['operation'] ?? null;
$payload   = $params['json'] ?? $input;

switch ($operation) {
    case 'getAssignments':
        $api->getAssignments();
        break;
    case 'insertAssignment':
        $api->insertAssignment($payload);
        break;
    case 'updateAssignment':
        $api->updateAssignment($payload);
        break;
    case 'deleteAssignment':
        $api->deleteAssignment($params['assignmentid'] ?? null);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid operation']);
}
?>
