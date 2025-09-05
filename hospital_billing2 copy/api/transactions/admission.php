<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../connection.php';

class AdmissionAPI {
    private $conn;

    public function __construct() {
        $this->conn = (new Database())->connect();
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function mapStatusUI($status) {
        $map = [
            'Admitted' => ['label' => 'Admitted', 'class' => 'badge bg-success'],
            'Discharged' => ['label' => 'Discharged', 'class' => 'badge bg-danger'],
            'Closed' => ['label' => 'Closed', 'class' => 'badge bg-secondary'],
        ];
        return $map[$status] ?? ['label' => $status, 'class' => 'badge bg-primary'];
    }

    /** Get all admissions */
    public function getAllAdmissions() {
        $sql = "
            SELECT a.admissionid, a.patientid, a.userid, a.admission_date, a.status,
                   CONCAT(p.firstname, ' ', p.lastname) AS patient_name,
                   u.username AS user_name
            FROM Admission a
            LEFT JOIN Patient p ON a.patientid = p.patientid
            LEFT JOIN User u ON a.userid = u.userid
            WHERE a.deleted_at IS NULL
            ORDER BY a.admissionid DESC
        ";
        $stmt = $this->conn->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $statusUI = $this->mapStatusUI($row['status']);
            $row['status_label'] = $statusUI['label'];
            $row['status_class'] = $statusUI['class'];
        }

        $this->respond($rows);
    }

    /** Get active admissions only */
    public function getActiveAdmissions() {
        $sql = "
            SELECT a.admissionid, a.patientid, a.admission_date, a.status,
                   CONCAT(p.firstname, ' ', p.lastname) AS patient_name
            FROM Admission a
            JOIN Patient p ON a.patientid = p.patientid
            WHERE a.deleted_at IS NULL AND a.status = 'Admitted'
            ORDER BY a.admission_date DESC
        ";
        $stmt = $this->conn->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $statusUI = $this->mapStatusUI($row['status']);
            $row['status_label'] = $statusUI['label'];
            $row['status_class'] = $statusUI['class'];
        }

        $this->respond($rows);
    }

    /** Insert admission (doctor removed) */
    public function insertAdmission($data) {
        $patientid = $data['patientid'] ?? null;
        $userid = $data['userid'] ?? null;
        $admission_date = $data['admission_date'] ?? date('Y-m-d');

        if (!$patientid || !$userid) {
            $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
        }

        // Prevent duplicate admission
        $check = $this->conn->prepare("SELECT 1 FROM Admission WHERE patientid = :pid AND status = 'Admitted' AND deleted_at IS NULL");
        $check->execute([':pid' => $patientid]);
        if ($check->fetchColumn()) {
            $this->respond(['success' => false, 'error' => 'Patient already admitted'], 422);
        }

        $stmt = $this->conn->prepare("INSERT INTO Admission (patientid, userid, admission_date, status) VALUES (:pid, :uid, :date, 'Admitted')");
        $stmt->execute([':pid' => $patientid, ':uid' => $userid, ':date' => $admission_date]);
        $this->respond(['success' => true, 'admissionid' => $this->conn->lastInsertId()], 201);
    }

    /** Update admission */
    public function updateAdmission($data) {
        $admissionid = $data['admissionid'] ?? null;
        $userid = $data['userid'] ?? null;
        $admission_date = $data['admission_date'] ?? null;
        $status = $data['status'] ?? null;

        if (!$admissionid || !$userid || !$admission_date || !$status) {
            $this->respond(['success' => false, 'error' => 'Missing required fields'], 422);
        }

        $stmt = $this->conn->prepare("UPDATE Admission SET userid=:uid, admission_date=:date, status=:status WHERE admissionid=:id AND deleted_at IS NULL");
        $stmt->execute([':uid' => $userid, ':date' => $admission_date, ':status' => $status, ':id' => $admissionid]);

        $this->respond(['success' => true, 'message' => 'Admission updated']);
    }

    /** Delete admission */
    public function deleteAdmission($admissionid) {
        if (!$admissionid) {
            $this->respond(['success' => false, 'error' => 'Admission ID required'], 422);
        }

        $stmt = $this->conn->prepare("UPDATE Admission SET deleted_at = NOW() WHERE admissionid = :id AND deleted_at IS NULL");
        $stmt->execute([':id' => $admissionid]);

        $this->respond(['success' => true, 'message' => 'Admission deleted']);
    }
}

$api = new AdmissionAPI();
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$operation = $_GET['operation'] ?? $input['operation'] ?? null;

switch ($operation) {
    case 'getAllAdmissions': $api->getAllAdmissions(); break;
    case 'getActiveAdmissions': $api->getActiveAdmissions(); break;
    case 'insertAdmission': $api->insertAdmission($input); break;
    case 'updateAdmission': $api->updateAdmission($input); break;
    case 'deleteAdmission': $api->deleteAdmission($_GET['admissionid'] ?? $input['admissionid'] ?? null); break;
    default: http_response_code(400); echo json_encode(['error' => 'Invalid operation']); exit;
}
