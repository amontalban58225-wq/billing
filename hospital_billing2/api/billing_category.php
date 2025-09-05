<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

class BillingCategory {
  private function connect() {
    include "connection.php";
    return (new Database())->connect();
  }

  private function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
  }

  private function validate($data) {
    if (empty($data['name'])) {
      $this->respond(['success' => false, 'error' => 'Category name is required'], 422);
    }
    
    // Validate numeric fields if provided
    if (isset($data['default_unit_price']) && (!is_numeric($data['default_unit_price']) || $data['default_unit_price'] < 0)) {
      $this->respond(['success' => false, 'error' => 'Default unit price must be a non-negative number'], 422);
    }
    
    if (isset($data['tax_rate']) && (!is_numeric($data['tax_rate']) || $data['tax_rate'] < 0 || $data['tax_rate'] > 100)) {
      $this->respond(['success' => false, 'error' => 'Tax rate must be between 0 and 100'], 422);
    }
  }

  public function getAllCategories() {
    try {
      $conn = $this->connect();
      $stmt = $conn->prepare("SELECT billing_categoryid, name, default_unit_price, is_active, tax_rate, discount_eligible, source_table, source_field, source_condition FROM Billing_Category ORDER BY billing_categoryid DESC");
      $stmt->execute();
      $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $this->respond(['success' => true, 'data' => $categories]);
    } catch (Exception $e) {
      $this->respond(['success' => false, 'error' => 'Failed to fetch categories: ' . $e->getMessage()], 500);
    }
  }

  public function insertCategory($data) {
    $data = is_array($data) ? $data : json_decode($data, true);
    $this->validate($data);

    try {
      $conn = $this->connect();
      
      // Prepare fields and values
      $fields = ['name'];
      $placeholders = [':name'];
      $params = [':name' => $data['name']];
      
      // Add optional fields if provided
      if (isset($data['default_unit_price'])) {
        $fields[] = 'default_unit_price';
        $placeholders[] = ':default_unit_price';
        $params[':default_unit_price'] = $data['default_unit_price'];
      }
      
      if (isset($data['is_active'])) {
        $fields[] = 'is_active';
        $placeholders[] = ':is_active';
        $params[':is_active'] = $data['is_active'] ? 1 : 0;
      }
      
      if (isset($data['tax_rate'])) {
        $fields[] = 'tax_rate';
        $placeholders[] = ':tax_rate';
        $params[':tax_rate'] = $data['tax_rate'];
      }
      
      if (isset($data['discount_eligible'])) {
        $fields[] = 'discount_eligible';
        $placeholders[] = ':discount_eligible';
        $params[':discount_eligible'] = $data['discount_eligible'] ? 1 : 0;
      }
      
      // Add source table fields if provided
      if (isset($data['source_table'])) {
        $fields[] = 'source_table';
        $placeholders[] = ':source_table';
        $params[':source_table'] = $data['source_table'];
      }
      
      if (isset($data['source_field'])) {
        $fields[] = 'source_field';
        $placeholders[] = ':source_field';
        $params[':source_field'] = $data['source_field'];
      }
      
      if (isset($data['source_condition'])) {
        $fields[] = 'source_condition';
        $placeholders[] = ':source_condition';
        $params[':source_condition'] = $data['source_condition'];
      }
      
      // Build and execute query
      $sql = "INSERT INTO Billing_Category (" . implode(", ", $fields) . ") VALUES (" . implode(", ", $placeholders) . ")";
      $stmt = $conn->prepare($sql);
      $stmt->execute($params);
      
      $this->respond(['success' => true, 'billing_categoryid' => $conn->lastInsertId()]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => 'Insert failed: '.$e->getMessage()], 500);
    }
  }

  public function updateCategory($data) {
    $data = is_array($data) ? $data : json_decode($data, true);
    if (empty($data['billing_categoryid'])) {
      $this->respond(['success' => false, 'error' => 'Category ID is required'], 422);
    }
    $this->validate($data);

    try {
      $conn = $this->connect();
      
      // Prepare update fields and parameters
      $updateFields = ['name=:name'];
      $params = [
        ':name' => $data['name'],
        ':billing_categoryid' => $data['billing_categoryid']
      ];
      
      // Add optional fields if provided
      if (isset($data['default_unit_price'])) {
        $updateFields[] = 'default_unit_price=:default_unit_price';
        $params[':default_unit_price'] = $data['default_unit_price'];
      }
      
      if (isset($data['is_active'])) {
        $updateFields[] = 'is_active=:is_active';
        $params[':is_active'] = $data['is_active'] ? 1 : 0;
      }
      
      if (isset($data['tax_rate'])) {
        $updateFields[] = 'tax_rate=:tax_rate';
        $params[':tax_rate'] = $data['tax_rate'];
      }
      
      if (isset($data['discount_eligible'])) {
        $updateFields[] = 'discount_eligible=:discount_eligible';
        $params[':discount_eligible'] = $data['discount_eligible'] ? 1 : 0;
      }
      
      // Add source table fields if provided
      if (isset($data['source_table'])) {
        $updates[] = 'source_table = :source_table';
        $params[':source_table'] = $data['source_table'];
      }
      
      if (isset($data['source_field'])) {
        $updates[] = 'source_field = :source_field';
        $params[':source_field'] = $data['source_field'];
      }
      
      if (isset($data['source_condition'])) {
        $updates[] = 'source_condition = :source_condition';
        $params[':source_condition'] = $data['source_condition'];
      }
      
      // Build and execute query
      $sql = "UPDATE Billing_Category SET " . implode(", ", $updateFields) . " WHERE billing_categoryid=:billing_categoryid";
      $stmt = $conn->prepare($sql);
      $stmt->execute($params);
      
      $this->respond(['success' => true]);
    } catch (PDOException $e) {
      $this->respond(['success' => false, 'error' => 'Update failed: '.$e->getMessage()],500);
    }
  }

  public function deleteCategory($id) {
    if (empty($id)) {
      $this->respond(['success' => false, 'error' => 'Category ID required'], 422);
    }
    try {
      $conn = $this->connect();
      $stmt = $conn->prepare("DELETE FROM Billing_Category WHERE billing_categoryid=:id");
      $stmt->execute([':id' => $id]);
      $this->respond(['success' => true]);
    } catch (Exception $e) {
      $this->respond(['success' => false, 'error' => 'Delete failed: ' . $e->getMessage()], 500);
    }
  }
}

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$params = array_merge($_GET, $_POST, $input);

$operation = $params['operation'] ?? '';
$categoryId = $params['billing_categoryid'] ?? '';
$jsonData = [];

if (!empty($params['json'])) {
  $jsonData = is_array($params['json']) ? $params['json'] : json_decode($params['json'], true);
} else if (!empty($input) && !in_array($operation, ['getAllCategories', 'deleteCategory'])) {
  $jsonData = $input;
}

$category = new BillingCategory();

switch ($operation) {
  case 'getAllCategories':
    $category->getAllCategories();
    break;
  case 'insertCategory':
    $category->insertCategory($jsonData);
    break;
  case 'updateCategory':
    $category->updateCategory($jsonData);
    break;
  case 'deleteCategory':
    $category->deleteCategory($categoryId);
    break;
  default:
    echo json_encode(['error' => 'Invalid operation']);
    break;
}
