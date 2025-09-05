<?php
class Database {
    private $host = "localhost";
    private $db_name = "clean_db";  // Using hospital database as specified by user
    private $username = "root";         // Your DB user
    private $password = "";             // Your DB password
    private $conn;

    public function connect() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,         // Throw exceptions on errors
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,    // Fetch associative arrays by default
                PDO::ATTR_EMULATE_PREPARES => false,                 // Use real prepares if possible
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch(PDOException $e) {
            // This should ideally be logged, not echoed on production
            echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
            exit;
        }

        return $this->conn;
    }
}
