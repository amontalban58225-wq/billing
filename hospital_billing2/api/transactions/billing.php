<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/../connection.php';

class BillingAPI {
  private $conn;

  public function __construct() {
    $this->conn = (new Database())->connect();
    $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }
  
  // Helper method to get billing category details
  private function getBillingCategory($categoryId) {
    try {
      $stmt = $this->conn->prepare("SELECT * FROM Billing_Category WHERE billing_categoryid = :id");
      $stmt->execute([':id' => $categoryId]);
      return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
      return null;
    }
  }

  private function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
  }

  public function getBillings() {
    try {
      $sql = "
        SELECT
          b.billingid,
          a.admissionid,
          p.patientid,
          CONCAT(p.firstname, ' ', p.lastname) AS patient_name,
          b.billing_categoryid,
          bc.name AS category_name,
          bc.default_unit_price,
          b.description,
          b.quantity,
          b.unit_price,
          b.total_amount,
          b.discount_amount,
          b.tax_amount,
          b.net_amount,
          b.insurance_coverage_percent,
          b.insurance_covered_amount,
          b.patient_responsibility,
          b.billing_date,
          DATE_FORMAT(b.billing_date, '%b %d, %Y') AS formatted_date,
          b.status AS status_label,
          CASE 
            WHEN b.status = 'Completed' THEN 'badge bg-success'
            WHEN b.status = 'Pending' THEN 'badge bg-warning'
            WHEN b.status = 'Despensed' THEN 'badge bg-info'
            WHEN b.status = 'Discharged' THEN 'badge bg-primary'
            ELSE 'badge bg-secondary'
          END AS status_class,
          b.reference_type,
          b.auto_calculated
        FROM Billing b
        JOIN Admission a ON b.admissionid = a.admissionid
        JOIN Patient p ON a.patientid = p.patientid
        LEFT JOIN Billing_Category bc ON b.billing_categoryid = bc.billing_categoryid
        WHERE a.deleted_at IS NULL
        ORDER BY b.billing_date DESC
      ";
      $stmt = $this->conn->query($sql);
      $billings = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond(['success' => true, 'data' => $billings]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }

  public function updateBilling($data) {
    if (empty($data['billingid'])) {
      $this->respond(['success' => false, 'error' => 'Missing billingid'], 422);
    }
    
    $id = $data['billingid'];
    $amount = $data['amount'] ?? null;
    $status = $data['status'] ?? null;
    $quantity = $data['quantity'] ?? null;
    $unitPrice = $data['unit_price'] ?? null;
    $discountAmount = $data['discount_amount'] ?? 0;
    $taxAmount = $data['tax_amount'] ?? 0;
    $insuranceCoveragePercent = $data['insurance_coverage_percent'] ?? 0;
    
    // Calculate derived values if quantity and unit price are provided
    if ($quantity !== null && $unitPrice !== null) {
      $amount = $quantity * $unitPrice;
    }
    
    // Calculate net amount (after discounts and taxes)
    $netAmount = $amount;
    if ($amount !== null) {
      $netAmount = $amount - $discountAmount + $taxAmount;
    }
    
    // Calculate insurance covered amount and patient responsibility
    $insuranceCoveredAmount = 0;
    $patientResponsibility = $netAmount;
    if ($insuranceCoveragePercent > 0 && $netAmount > 0) {
      $insuranceCoveredAmount = $netAmount * ($insuranceCoveragePercent / 100);
      $patientResponsibility = $netAmount - $insuranceCoveredAmount;
    }
    
    try {
      $updateFields = [];
      $params = [':id' => $id];
      
      if ($quantity !== null) {
        $updateFields[] = "quantity = :quantity";
        $params[':quantity'] = $quantity;
      }
      
      if ($unitPrice !== null) {
        $updateFields[] = "unit_price = :unit_price";
        $params[':unit_price'] = $unitPrice;
      }
      
      if ($amount !== null) {
        $updateFields[] = "total_amount = :amount";
        $params[':amount'] = $amount;
      }
      
      if ($status !== null) {
        $updateFields[] = "status = :status";
        $params[':status'] = $status;
      }
      
      if ($discountAmount !== null) {
        $updateFields[] = "discount_amount = :discount_amount";
        $params[':discount_amount'] = $discountAmount;
      }
      
      if ($taxAmount !== null) {
        $updateFields[] = "tax_amount = :tax_amount";
        $params[':tax_amount'] = $taxAmount;
      }
      
      if ($netAmount !== null) {
        $updateFields[] = "net_amount = :net_amount";
        $params[':net_amount'] = $netAmount;
      }
      
      if ($insuranceCoveragePercent !== null) {
        $updateFields[] = "insurance_coverage_percent = :insurance_coverage_percent";
        $params[':insurance_coverage_percent'] = $insuranceCoveragePercent;
      }
      
      if ($insuranceCoveredAmount !== null) {
        $updateFields[] = "insurance_covered_amount = :insurance_covered_amount";
        $params[':insurance_covered_amount'] = $insuranceCoveredAmount;
      }
      
      if ($patientResponsibility !== null) {
        $updateFields[] = "patient_responsibility = :patient_responsibility";
        $params[':patient_responsibility'] = $patientResponsibility;
      }
      
      if (empty($updateFields)) {
        $this->respond(['success' => false, 'error' => 'No fields to update'], 422);
      }
      
      $sql = "UPDATE Billing SET " . implode(", ", $updateFields) . " WHERE billingid = :id";
      $stmt = $this->conn->prepare($sql);
      $stmt->execute($params);
      
      $this->respond(['success' => true, 'message' => 'Billing updated']);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }

  public function deleteBilling($data) {
    if (empty($data['billingid'])) {
      $this->respond(['success' => false, 'error' => 'Missing billingid'], 422);
    }
    $id = $data['billingid'];

    try {
      $stmt = $this->conn->prepare("DELETE FROM Billing WHERE billingid = :id");
      $stmt->execute([':id' => $id]);
      $this->respond(['success' => true, 'message' => 'Billing deleted']);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Get available rooms for billing
  public function getAvailableRooms() {
    try {
      $sql = "
        SELECT 
          r.roomid,
          r.room_number,
          rc.name AS category_name,
          rc.rate_per_day,
          r.status,
          r.floor
        FROM Room r
        JOIN Room_Category rc ON r.room_categoryid = rc.room_categoryid
        ORDER BY r.room_number
      ";
      $stmt = $this->conn->query($sql);
      $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond(['success' => true, 'data' => $rooms]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Get lab tests for billing
  public function getLabTests() {
    try {
      $sql = "
        SELECT 
          lt.labtestid,
          lt.name AS test_name,
          lt.price,
          ltc.name AS category_name,
          ltc.handling_fee
        FROM Lab_Test lt
        JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid
        ORDER BY lt.name
      ";
      $stmt = $this->conn->query($sql);
      $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond(['success' => true, 'data' => $tests]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Get medicines for billing
  public function getMedicines() {
    try {
      $sql = "
        SELECT 
          m.medicineid,
          m.brand_name,
          m.generic_name,
          m.price,
          m.stock_quantity
        FROM Medicine m
        WHERE m.stock_quantity > 0
        ORDER BY m.brand_name
      ";
      $stmt = $this->conn->query($sql);
      $medicines = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond(['success' => true, 'data' => $medicines]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Get room assignment for a specific admission
  public function getRoomAssignment($data) {
    if (empty($data['admissionid'])) {
      $this->respond(['success' => false, 'error' => 'Missing admissionid'], 422);
    }
    
    $admissionId = $data['admissionid'];
    
    try {
      $sql = "
        SELECT 
          ra.room_assignmentid,
          r.roomid,
          r.room_number,
          rc.name AS category_name,
          rc.rate_per_day,
          ra.start_date,
          ra.end_date,
          DATEDIFF(IFNULL(ra.end_date, CURRENT_DATE), ra.start_date) AS days_occupied
        FROM Room_Assignment ra
        JOIN Room r ON ra.roomid = r.roomid
        JOIN Room_Category rc ON r.room_categoryid = rc.room_categoryid
        WHERE ra.admissionid = :admissionid
        ORDER BY ra.start_date DESC
      ";
      
      $stmt = $this->conn->prepare($sql);
      $stmt->execute([':admissionid' => $admissionId]);
      $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
      
      $this->respond(['success' => true, 'data' => $assignments]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Get items based on billing category
  public function getItemsByCategory($data) {
    if (empty($data['billing_categoryid'])) {
      $this->respond(['success' => false, 'error' => 'Missing billing_categoryid'], 422);
    }
    
    $categoryId = $data['billing_categoryid'];
    $category = $this->getBillingCategory($categoryId);
    
    if (!$category) {
      $this->respond(['success' => false, 'error' => 'Invalid billing category'], 404);
    }
    
    // If no source table is defined, return empty array
    if (empty($category['source_table'])) {
      $this->respond(['success' => true, 'data' => [], 'message' => 'No source table defined for this category']);
    }
    
    try {
      $sourceTable = $category['source_table'];
      $sourceField = $category['source_field'] ?? 'price';
      $sourceCondition = $category['source_condition'] ?? '';
      
      // Build dynamic SQL based on source table
      $sql = "SELECT * FROM {$sourceTable}";
      
      if (!empty($sourceCondition)) {
        $sql .= " {$sourceCondition}";
      }
      
      $stmt = $this->conn->query($sql);
      $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
      
      $this->respond(['success' => true, 'data' => $items, 'source_field' => $sourceField]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
  
  // Generate automatic billing based on category source
  public function generateAutomaticBilling($data) {
    if (empty($data['admissionid'])) {
      $this->respond(['success' => false, 'error' => 'Missing admissionid'], 422);
    }
    
    if (empty($data['billing_categoryid'])) {
      $this->respond(['success' => false, 'error' => 'Missing billing_categoryid'], 422);
    }
    
    if (empty($data['reference_id'])) {
      $this->respond(['success' => false, 'error' => 'Missing reference_id'], 422);
    }
    
    $admissionId = $data['admissionid'];
    $categoryId = $data['billing_categoryid'];
    $referenceId = $data['reference_id'];
    $referenceType = $data['reference_type'] ?? '';
    $quantity = $data['quantity'] ?? 1;
    
    // Get billing category details
    $category = $this->getBillingCategory($categoryId);
    if (!$category) {
      $this->respond(['success' => false, 'error' => 'Invalid billing category'], 404);
    }
    
    try {
      // Get price from source table based on reference_id
      $unitPrice = 0;
      $description = '';
      
      if (!empty($category['source_table']) && !empty($category['source_field'])) {
        $sourceTable = $category['source_table'];
        $sourceField = $category['source_field'];
        $primaryKey = '';
        $nameField = '';
        
        // Determine primary key and name field based on source table
        switch ($sourceTable) {
          case 'Room_Category':
            $primaryKey = 'room_categoryid';
            $nameField = 'name';
            break;
          case 'Room':
            $primaryKey = 'roomid';
            $nameField = 'room_number';
            break;
          case 'Lab_Test':
            $primaryKey = 'labtestid';
            $nameField = 'name';
            break;
          case 'Medicine':
            $primaryKey = 'medicineid';
            $nameField = 'brand_name';
            break;
          default:
            $primaryKey = $sourceTable . 'id';
            $nameField = 'name';
        }
        
        // Get item details from source table
        $sql = "SELECT * FROM {$sourceTable} WHERE {$primaryKey} = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':id' => $referenceId]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($item) {
          $unitPrice = $item[$sourceField] ?? 0;
          $description = $item[$nameField] ?? 'Automatic billing';
          
          // Special handling for lab tests (add handling fee)
          if ($sourceTable === 'Lab_Test' && isset($item['categoryid'])) {
            $sql = "SELECT handling_fee FROM Lab_Test_Category WHERE labtestcatid = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => $item['categoryid']]);
            $category = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($category && isset($category['handling_fee'])) {
              $unitPrice += $category['handling_fee'];
            }
          }
        }
      } else {
        // Use default price from billing category
        $unitPrice = $category['default_unit_price'] ?? 0;
        $description = $category['name'] ?? 'Automatic billing';
      }
      
      // Calculate amounts
      $totalAmount = $unitPrice * $quantity;
      $taxRate = $category['tax_rate'] ?? 0;
      $taxAmount = $totalAmount * ($taxRate / 100);
      $discountAmount = 0; // Can be updated later if needed
      $netAmount = $totalAmount + $taxAmount - $discountAmount;
      
      // Default insurance coverage (can be updated later)
      $insuranceCoveragePercent = 0;
      $insuranceCoveredAmount = 0;
      $patientResponsibility = $netAmount;
      
      // Insert new billing record
      $sql = "INSERT INTO Billing (
        admissionid, 
        billing_categoryid, 
        description, 
        quantity, 
        unit_price, 
        total_amount, 
        discount_amount, 
        tax_amount, 
        net_amount, 
        insurance_coverage_percent, 
        insurance_covered_amount, 
        patient_responsibility, 
        billing_date, 
        status, 
        reference_id, 
        reference_type, 
        auto_calculated
      ) VALUES (
        :admissionid, 
        :billing_categoryid, 
        :description, 
        :quantity, 
        :unit_price, 
        :total_amount, 
        :discount_amount, 
        :tax_amount, 
        :net_amount, 
        :insurance_coverage_percent, 
        :insurance_covered_amount, 
        :patient_responsibility, 
        NOW(), 
        'Pending', 
        :reference_id, 
        :reference_type, 
        1
      )";
      
      $stmt = $this->conn->prepare($sql);
      $stmt->execute([
        ':admissionid' => $admissionId,
        ':billing_categoryid' => $categoryId,
        ':description' => $description,
        ':quantity' => $quantity,
        ':unit_price' => $unitPrice,
        ':total_amount' => $totalAmount,
        ':discount_amount' => $discountAmount,
        ':tax_amount' => $taxAmount,
        ':net_amount' => $netAmount,
        ':insurance_coverage_percent' => $insuranceCoveragePercent,
        ':insurance_covered_amount' => $insuranceCoveredAmount,
        ':patient_responsibility' => $patientResponsibility,
        ':reference_id' => $referenceId,
        ':reference_type' => $referenceType
      ]);
      
      $billingId = $this->conn->lastInsertId();
      
      $this->respond([
        'success' => true, 
        'message' => 'Automatic billing generated successfully', 
        'billingid' => $billingId,
        'unit_price' => $unitPrice,
        'total_amount' => $totalAmount,
        'net_amount' => $netAmount
      ]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
  }
}

$api = new BillingAPI();

$method = $_SERVER['REQUEST_METHOD'];
$params = array_merge($_GET, json_decode(file_get_contents('php://input'), true) ?? []);

switch ($method) {
  case 'GET':
    $operation = $params['operation'] ?? '';
    switch ($operation) {
      case 'getBillings':
        $api->getBillings();
        break;
      case 'getAvailableRooms':
        $api->getAvailableRooms();
        break;
      case 'getLabTests':
        $api->getLabTests();
        break;
      case 'getMedicines':
        $api->getMedicines();
        break;
      case 'getRoomAssignment':
        $api->getRoomAssignment($params);
        break;
      case 'getItemsByCategory':
        $api->getItemsByCategory($params);
        break;
      default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid operation']);
    }
    break;

  case 'POST':
    $operation = $params['operation'] ?? '';
    if ($operation === 'updateBilling') {
      $api->updateBilling($params);
    } elseif ($operation === 'deleteBilling') {
      $api->deleteBilling($params);
    } else {
      http_response_code(400);
      echo json_encode(['error' => 'Invalid operation']);
    }
    break;

  default:
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
