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

class PaymentAPI {
    private function connect() {
        include __DIR__ . "/../connection.php";
        return (new Database())->connect();
    }

    private function respond($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
    
    private function validateInput($data, $requiredFields = []) {
        if (!is_array($data)) {
            $data = json_decode($data ?? "{}", true);
            if (!is_array($data)) {
                $this->respond(["success" => false, "error" => "Invalid data format"], 422);
            }
        }
        
        $missingFields = [];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $missingFields[] = $field;
            }
        }
        
        if (!empty($missingFields)) {
            $this->respond([
                "success" => false, 
                "error" => "Missing required fields: " . implode(", ", $missingFields)
            ], 422);
        }
        
        return $data;
    }

    function getPaymentsByAdmission($admissionId) {
        try {
            if (empty($admissionId)) $this->respond(["error" => "Admission ID required"], 422);
            
            $conn = $this->connect();
            $sql = "SELECT p.*, 
                           ip.name as insurance_name
                    FROM Payment p
                    LEFT JOIN Insurance_Provider ip ON p.insuranceid = ip.insuranceid
                    WHERE p.admissionid = :admissionid
                    ORDER BY p.date DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([":admissionid" => $admissionId]);
            $this->respond($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function getPaymentById($id) {
        try {
            if (empty($id)) $this->respond(["error" => "Payment ID required"], 422);
            
            $conn = $this->connect();
            $stmt = $conn->prepare("SELECT p.*, 
                                          ip.name as insurance_name
                                   FROM Payment p
                                   LEFT JOIN Insurance_Provider ip ON p.insuranceid = ip.insuranceid
                                   WHERE p.paymentid = :id");
            $stmt->execute([":id" => $id]);
            
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$payment) {
                $this->respond(["error" => "Payment not found"], 404);
            }
            
            $this->respond($payment);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }

    function insertPayment($data) {
        try {
            $data = $this->validateInput($data, ['admissionid', 'amount', 'method']);
            
            $conn = $this->connect();
            
            // Validate admission exists
            $stmt = $conn->prepare("SELECT admissionid FROM Admission WHERE admissionid = :admissionid AND deleted_at IS NULL");
            $stmt->execute([":admissionid" => $data['admissionid']]);
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Invalid admission"], 422);
            }
            
            // Validate insurance provider if provided
            if (!empty($data['insuranceid'])) {
                $stmt = $conn->prepare("SELECT insuranceid FROM Insurance_Provider WHERE insuranceid = :insuranceid AND is_active = 1");
                $stmt->execute([":insuranceid" => $data['insuranceid']]);
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid insurance provider"], 422);
                }
            }
            
            $sql = "INSERT INTO Payment (admissionid, amount, date, method, remarks, insuranceid, insurance_coverage) 
                    VALUES (:admissionid, :amount, NOW(), :method, :remarks, :insuranceid, :insurance_coverage)";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ":admissionid" => $data['admissionid'],
                ":amount" => $data['amount'],
                ":method" => $data['method'],
                ":remarks" => $data['remarks'] ?? null,
                ":insuranceid" => $data['insuranceid'] ?? null,
                ":insurance_coverage" => $data['insurance_coverage'] ?? null
            ]);
            
            $this->respond([
                "success" => true, 
                "message" => "Payment added successfully",
                "paymentid" => $conn->lastInsertId()
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function updatePayment($data) {
        try {
            $data = $this->validateInput($data, ['paymentid', 'amount', 'method']);
            
            $conn = $this->connect();
            
            // Check if payment exists
            $stmt = $conn->prepare("SELECT paymentid FROM Payment WHERE paymentid = :id");
            $stmt->execute([":id" => $data['paymentid']]);
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Payment not found"], 404);
            }
            
            // Validate insurance provider if provided
            if (!empty($data['insuranceid'])) {
                $stmt = $conn->prepare("SELECT insuranceid FROM Insurance_Provider WHERE insuranceid = :insuranceid AND is_active = 1");
                $stmt->execute([":insuranceid" => $data['insuranceid']]);
                if (!$stmt->fetch()) {
                    $this->respond(["success" => false, "error" => "Invalid insurance provider"], 422);
                }
            }
            
            $sql = "UPDATE Payment 
                    SET amount = :amount, 
                        method = :method, 
                        remarks = :remarks, 
                        insuranceid = :insuranceid, 
                        insurance_coverage = :insurance_coverage 
                    WHERE paymentid = :id";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ":id" => $data['paymentid'],
                ":amount" => $data['amount'],
                ":method" => $data['method'],
                ":remarks" => $data['remarks'] ?? null,
                ":insuranceid" => $data['insuranceid'] ?? null,
                ":insurance_coverage" => $data['insurance_coverage'] ?? null
            ]);
            
            $this->respond([
                "success" => true, 
                "message" => "Payment updated successfully"
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function deletePayment($data) {
        try {
            $data = $this->validateInput($data, ['paymentid']);
            
            $conn = $this->connect();
            
            // Check if payment exists
            $stmt = $conn->prepare("SELECT paymentid FROM Payment WHERE paymentid = :id");
            $stmt->execute([":id" => $data['paymentid']]);
            if (!$stmt->fetch()) {
                $this->respond(["success" => false, "error" => "Payment not found"], 404);
            }
            
            $sql = "DELETE FROM Payment WHERE paymentid = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([":id" => $data['paymentid']]);
            
            $this->respond([
                "success" => true, 
                "message" => "Payment deleted successfully"
            ]);
        } catch (Exception $e) {
            $this->respond(["success" => false, "error" => $e->getMessage()], 500);
        }
    }

    function getPaymentSummary($admissionId) {
        try {
            if (empty($admissionId)) $this->respond(["error" => "Admission ID required"], 422);
            
            $conn = $this->connect();
            
            // Get total billing amount
            $stmt = $conn->prepare("SELECT COALESCE(SUM(total_amount), 0) as total_billing 
                                   FROM Billing 
                                   WHERE admissionid = :admissionid");
            $stmt->execute([":admissionid" => $admissionId]);
            $billingResult = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalBilling = floatval($billingResult['total_billing']);
            
            // Get total payments
            $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total_payments 
                                   FROM Payment 
                                   WHERE admissionid = :admissionid");
            $stmt->execute([":admissionid" => $admissionId]);
            $paymentResult = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalPayments = floatval($paymentResult['total_payments']);
            
            $remaining = $totalBilling - $totalPayments;
            
            $this->respond([
                "total_billing" => $totalBilling,
                "total_payments" => $totalPayments,
                "remaining_balance" => $remaining,
                "is_fully_paid" => $remaining <= 0
            ]);
        } catch (Exception $e) {
            $this->respond(["error" => $e->getMessage()], 500);
        }
    }
}

// Handle requests
$api = new PaymentAPI();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = $_GET['operation'] ?? '';
    
    switch ($operation) {
        case 'getPaymentsByAdmission':
            $api->getPaymentsByAdmission($_GET['admissionid'] ?? '');
            break;
        case 'getPaymentById':
            $api->getPaymentById($_GET['id'] ?? '');
            break;
        case 'getPaymentSummary':
            $api->getPaymentSummary($_GET['admissionid'] ?? '');
            break;
        default:
            $api->respond(["error" => "Invalid operation"], 400);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $operation = $input['operation'] ?? '';
    
    switch ($operation) {
        case 'insertPayment':
            $api->insertPayment($input);
            break;
        case 'updatePayment':
            $api->updatePayment($input);
            break;
        case 'deletePayment':
            $api->deletePayment($input);
            break;
        default:
            $api->respond(["error" => "Invalid operation"], 400);
    }
} else {
    $api->respond(["error" => "Method not allowed"], 405);
}
?>
