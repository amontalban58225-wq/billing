<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){ http_response_code(204); exit; }
require_once __DIR__ . '/connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

class Doctor {
    private PDO $conn;
    public function __construct(){
        $this->conn = (new Database())->connect();
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function getAllDoctors(){
        $stmt = $this->conn->prepare("
            SELECT d.doctorid, d.fullname, d.specialtyid,
                   s.name AS specialty_name,
                   d.contact_no, d.professional_fee, d.status
            FROM Doctor d
            LEFT JOIN Specialty s ON d.specialtyid = s.specialtyid
            WHERE d.deleted_at IS NULL
            ORDER BY d.fullname
        ");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getDoctorById($id){
        if (empty($id)){ echo json_encode(['error'=>'Doctor id required']); return; }
        $stmt = $this->conn->prepare("
            SELECT d.doctorid, d.fullname, d.specialtyid,
                   s.name AS specialty_name,
                   d.contact_no, d.professional_fee, d.status
            FROM Doctor d
            LEFT JOIN Specialty s ON d.specialtyid = s.specialtyid
            WHERE d.doctorid = :id AND d.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id'=>$id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: []);
    }

    public function insertDoctor($data){
        if (empty($data['fullname']) || !isset($data['specialtyid']) || !isset($data['contact_no']) || !isset($data['professional_fee']) || !isset($data['status'])) {
            echo json_encode(['success'=>false,'error'=>'Missing fields']); return;
        }
        $stmt = $this->conn->prepare("
            INSERT INTO Doctor (fullname, specialtyid, contact_no, professional_fee, status)
            VALUES (:fullname,:specialtyid,:contact_no,:professional_fee,:status)
        ");
        $stmt->execute([
            ':fullname'=>$data['fullname'],
            ':specialtyid'=>$data['specialtyid'],
            ':contact_no'=>$data['contact_no'],
            ':professional_fee'=>$data['professional_fee'],
            ':status'=>$data['status']
        ]);
        echo json_encode(['success'=>true,'doctorid'=>$this->conn->lastInsertId()]);
    }

    public function updateDoctor($data){
        if (empty($data['doctorid']) || empty($data['fullname']) || !isset($data['specialtyid']) || !isset($data['contact_no']) || !isset($data['professional_fee']) || !isset($data['status'])) {
            echo json_encode(['success'=>false,'error'=>'Missing fields']); return;
        }
        $stmt = $this->conn->prepare("
            UPDATE Doctor
            SET fullname=:fullname, specialtyid=:specialtyid,
                contact_no=:contact_no, professional_fee=:professional_fee, status=:status
            WHERE doctorid=:doctorid AND deleted_at IS NULL
        ");
        $stmt->execute([
            ':fullname'=>$data['fullname'],
            ':specialtyid'=>$data['specialtyid'],
            ':contact_no'=>$data['contact_no'],
            ':professional_fee'=>$data['professional_fee'],
            ':status'=>$data['status'],
            ':doctorid'=>$data['doctorid']
        ]);
        echo json_encode(['success'=>true]);
    }

    public function deleteDoctor($id){
        if (empty($id)){ echo json_encode(['success'=>false,'error'=>'Doctor id required']); return; }
        $stmt = $this->conn->prepare("UPDATE Doctor SET deleted_at = NOW() WHERE doctorid = :id AND deleted_at IS NULL");
        $stmt->execute([':id'=>$id]);
        if ($stmt->rowCount() === 0) echo json_encode(['success'=>false,'error'=>'Doctor not found or already deleted']);
        else echo json_encode(['success'=>true,'message'=>'Doctor soft-deleted']);
    }
}

// router
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$params = array_merge($_GET, $_POST, $input);
$op = $params['operation'] ?? null;
$api = new Doctor();

switch($op){
    case 'getAllDoctors': $api->getAllDoctors(); break;
    case 'getDoctorById': $api->getDoctorById($params['doctorid'] ?? null); break;
    case 'insertDoctor': $api->insertDoctor($params); break;
    case 'updateDoctor': $api->updateDoctor($params); break;
    case 'deleteDoctor': $api->deleteDoctor($params['doctorid'] ?? null); break;
    default: echo json_encode(['error'=>'Invalid operation']);
}
