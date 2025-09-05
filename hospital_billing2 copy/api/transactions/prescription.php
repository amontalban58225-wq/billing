<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . "/../connection.php";

class PrescriptionAPI {
  private $conn;

  public function __construct(){
    $this->conn = (new Database())->connect();
    $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }

  private function respond($data, $status=200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
  }

  public function getAllPrescriptions() {
    $sql = "SELECT p.prescriptionid, p.admissionid, p.medicineid, p.doctorid, p.quantity, p.status, p.prescription_date,
                   CONCAT(pt.lastname, ', ', pt.firstname, ' ', IFNULL(pt.middlename, ''), ' ', IFNULL(pt.suffix, '')) AS patient_name,
                   m.brand_name AS medicine_name,
                   d.fullname AS doctor_name,
                   CASE WHEN p.status = 'Pending' THEN 'badge bg-warning'
                        WHEN p.status = 'Dispensed' THEN 'badge bg-success'
                        WHEN p.status = 'Canceled' THEN 'badge bg-danger'
                        ELSE 'badge bg-secondary' END AS status_class,
                   CASE WHEN p.status = 'Pending' THEN 'Pending'
                        WHEN p.status = 'Dispensed' THEN 'Dispensed'
                        WHEN p.status = 'Canceled' THEN 'Canceled'
                        ELSE p.status END AS status_label
            FROM Prescription p
            JOIN Admission a ON p.admissionid = a.admissionid
            JOIN Patient pt ON a.patientid = pt.patientid
            JOIN Medicine m ON p.medicineid = m.medicineid
            JOIN Doctor d ON p.doctorid = d.doctorid
            WHERE a.status = 'Admitted'
            ORDER BY p.prescription_date DESC";
    $stmt = $this->conn->query($sql);
    $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  public function insertPrescription($data) {
    if(empty($data['admissionid']) || empty($data['medicineid']) || empty($data['doctorid']) || empty($data['quantity'])){
      $this->respond(['success'=>false,'error'=>'Missing required fields'], 422);
    }
    try {
      $this->conn->beginTransaction();
      $this->validateForeignKeys($data);
      $stmt = $this->conn->prepare("INSERT INTO Prescription (admissionid, medicineid, doctorid, quantity, status, prescription_date) VALUES (:admissionid, :medicineid, :doctorid, :quantity, 'Pending', NOW())");
      $stmt->execute([
        ':admissionid'=>$data['admissionid'],
        ':medicineid'=>$data['medicineid'],
        ':doctorid'=>$data['doctorid'],
        ':quantity'=>$data['quantity']
      ]);
      $id = $this->conn->lastInsertId();
      $this->conn->commit();
      $this->respond(['success'=>true,'prescriptionid'=>$id],201);
    }catch(PDOException $e){
      $this->conn->rollBack();
      $this->respond(['success'=>false,'error'=>$e->getMessage()],500);
    }
  }

  // Batch insert multiple prescriptions
  public function insertMultiplePrescriptions($payload) {
    $data = is_array($payload) ? $payload : json_decode($payload, true);
    if (empty($data['admissionid']) || empty($data['prescriptions']) || !is_array($data['prescriptions'])) {
        $this->respond(['success' => false, 'error' => 'Missing or invalid data'], 422);
    }
    try {
      $this->conn->beginTransaction();

      // Validate admission
      $stmt = $this->conn->prepare("SELECT 1 FROM Admission WHERE admissionid=:id AND status='Admitted'");
      $stmt->execute([':id'=>$data['admissionid']]);
      if (!$stmt->fetch()) {
        $this->conn->rollBack();
        $this->respond(['success' => false, 'error' => 'Invalid or inactive admission'], 422);
      }

      $insertStmt = $this->conn->prepare("INSERT INTO Prescription (admissionid, medicineid, doctorid, quantity, status, prescription_date) VALUES (:admissionid, :medicineid, :doctorid, :quantity, 'Pending', NOW())");

      foreach ($data['prescriptions'] as $prescription) {
        if (empty($prescription['medicineid']) || empty($prescription['quantity'])) {
          $this->conn->rollBack();
          $this->respond(['success' => false, 'error' => 'Each prescription must have medicineid and quantity'], 422);
        }

        // Optional validations for medicine and doctor
        $this->validateMedicineAndDoctor($prescription);

        $doctorid = $prescription['doctorid'] ?? null;

        $insertStmt->execute([
          ':admissionid' => $data['admissionid'],
          ':medicineid' => $prescription['medicineid'],
          ':doctorid' => $doctorid,
          ':quantity' => $prescription['quantity']
        ]);
      }

      $this->conn->commit();
      $this->respond(['success'=>true,'message'=>'Multiple prescriptions inserted successfully']);
    } catch (Exception $e) {
      $this->conn->rollBack();
      $this->respond(['success'=>false,'error'=>$e->getMessage()], 500);
    }
  }

  public function updatePrescription($data) {
    if(empty($data['prescriptionid']) || empty($data['medicineid']) || empty($data['doctorid']) || empty($data['quantity']) || empty($data['status'])){
      $this->respond(['success'=>false,'error'=>'Missing required fields'], 422);
    }
    try {
      $this->conn->beginTransaction();
      $this->validateForeignKeys($data);
      $stmt = $this->conn->prepare("SELECT 1 FROM Prescription WHERE prescriptionid=:id");
      $stmt->execute([':id'=>$data['prescriptionid']]);
      if(!$stmt->fetch()){
        $this->conn->rollBack();
        $this->respond(['success'=>false,'error'=>'Prescription not found'],404);
      }
      $stmt = $this->conn->prepare("UPDATE Prescription SET medicineid=:medicineid, doctorid=:doctorid, quantity=:quantity, status=:status WHERE prescriptionid=:prescriptionid");
      $stmt->execute([
        ':prescriptionid'=>$data['prescriptionid'],
        ':medicineid'=>$data['medicineid'],
        ':doctorid'=>$data['doctorid'],
        ':quantity'=>$data['quantity'],
        ':status'=>$data['status']
      ]);
      $this->conn->commit();
      $this->respond(['success'=>true,'message'=>'Prescription updated successfully']);
    } catch(PDOException $e){
      $this->conn->rollBack();
      $this->respond(['success'=>false,'error'=>$e->getMessage()],500);
    }
  }

  public function deletePrescription($data) {
    if(empty($data['prescriptionid'])){
      $this->respond(['success'=>false,'error'=>'Prescription ID required'],422);
    }
    try {
      $this->conn->beginTransaction();
      $stmt = $this->conn->prepare("SELECT 1 FROM Prescription WHERE prescriptionid=:id");
      $stmt->execute([':id'=>$data['prescriptionid']]);
      if(!$stmt->fetch()){
        $this->conn->rollBack();
        $this->respond(['success'=>false,'error'=>'Prescription not found'],404);
      }
      $stmt = $this->conn->prepare("DELETE FROM Prescription WHERE prescriptionid=:id");
      $stmt->execute([':id'=>$data['prescriptionid']]);
      $this->conn->commit();
      $this->respond(['success'=>true,'message'=>'Prescription deleted successfully']);
    } catch(PDOException $e){
      $this->conn->rollBack();
      $this->respond(['success'=>false,'error'=>$e->getMessage()],500);
    }
  }

  private function validateForeignKeys($data) {
    $this->validateAdmission($data['admissionid']);
    $this->validateMedicine($data['medicineid']);
    $this->validateDoctor($data['doctorid']);
  }

  private function validateAdmission($admissionid) {
    $stmt = $this->conn->prepare("SELECT 1 FROM Admission WHERE admissionid=:id AND status='Admitted'");
    $stmt->execute([':id'=>$admissionid]);
    if(!$stmt->fetch()){
      throw new Exception("Invalid or inactive admission");
    }
  }

  private function validateMedicine($medicineid) {
    $stmt = $this->conn->prepare("SELECT 1 FROM Medicine WHERE medicineid=:id");
    $stmt->execute([':id'=>$medicineid]);
    if(!$stmt->fetch()){
      throw new Exception("Invalid medicine");
    }
  }

  private function validateDoctor($doctorid) {
    $stmt = $this->conn->prepare("SELECT 1 FROM Doctor WHERE doctorid=:id");
    $stmt->execute([':id'=>$doctorid]);
    if(!$stmt->fetch()){
      throw new Exception("Invalid doctor");
    }
  }

  private function validateMedicineAndDoctor($prescription) {
    $this->validateMedicine($prescription['medicineid']);
    if (isset($prescription['doctorid'])) {
      $this->validateDoctor($prescription['doctorid']);
    }
  }
}

$api = new PrescriptionAPI();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true) ?: [];

$operation = $_GET['operation'] ?? $input['operation'] ?? null;

if (!$operation) {
  http_response_code(400);
  echo json_encode(['error'=>'Operation required']);
  exit;
}

switch ($operation) {
  case 'getAllPrescriptions': $api->getAllPrescriptions(); break;
  case 'insertPrescription': $api->insertPrescription($input); break;
  case 'insertMultiplePrescriptions': $api->insertMultiplePrescriptions($input); break;
  case 'updatePrescription': $api->updatePrescription($input); break;
  case 'deletePrescription': $api->deletePrescription($input); break;
  default:
    http_response_code(400);
    echo json_encode(['error'=>'Invalid operation']);
    exit;
}
?>
