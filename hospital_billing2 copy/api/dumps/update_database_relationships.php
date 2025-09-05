<?php
/**
 * Database Relationship Update Script
 * 
 * This script updates the hospital database by adding missing foreign key constraints
 * to ensure data integrity and proper relationships between tables.
 */

// Database connection parameters
$host = 'localhost';
$db = 'hospital_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Set up DSN
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    // Connect to database
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "<h1>Database Relationship Update</h1>";
    echo "<p>Starting database update process...</p>";
    
    // Disable foreign key checks temporarily
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // Array of SQL statements to add foreign key constraints
    $sqlStatements = [
        // Admission table constraints
        "ALTER TABLE `Admission`
         ADD CONSTRAINT `admission_patient_fk` FOREIGN KEY (`patientid`) REFERENCES `Patient` (`patientid`) ON DELETE RESTRICT ON UPDATE CASCADE,
         ADD CONSTRAINT `admission_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE RESTRICT ON UPDATE CASCADE,
         ADD CONSTRAINT `admission_user_fk` FOREIGN KEY (`userid`) REFERENCES `User` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Billing table constraints
        "ALTER TABLE `Billing`
         ADD CONSTRAINT `billing_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
         ADD CONSTRAINT `billing_category_fk` FOREIGN KEY (`billing_categoryid`) REFERENCES `Billing_Category` (`billing_categoryid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Lab_Request table constraints
        "ALTER TABLE `Lab_Request`
         ADD CONSTRAINT `lab_request_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
         ADD CONSTRAINT `lab_request_user_fk` FOREIGN KEY (`requestedBy`) REFERENCES `User` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE,
         ADD CONSTRAINT `lab_request_test_fk` FOREIGN KEY (`testid`) REFERENCES `Lab_Test` (`testid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Lab_Test table constraints
        "ALTER TABLE `Lab_Test`
         ADD CONSTRAINT `lab_test_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Lab_Test_Category` (`labtestcatid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Medicine table constraints
        "ALTER TABLE `Medicine`
         ADD CONSTRAINT `medicine_generic_fk` FOREIGN KEY (`genericid`) REFERENCES `Generic_Medicine` (`genericid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Patient table constraints
        "ALTER TABLE `Patient`
         ADD CONSTRAINT `patient_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Payment table constraints
        "ALTER TABLE `Payment`
         ADD CONSTRAINT `payment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
         ADD CONSTRAINT `payment_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Prescription table constraints
        "ALTER TABLE `Prescription`
         ADD CONSTRAINT `prescription_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
         ADD CONSTRAINT `prescription_medicine_fk` FOREIGN KEY (`medicineid`) REFERENCES `Medicine` (`medicineid`) ON DELETE RESTRICT ON UPDATE CASCADE,
         ADD CONSTRAINT `prescription_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Room table constraints
        "ALTER TABLE `Room`
         ADD CONSTRAINT `room_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Room_Category` (`categoryid`) ON DELETE RESTRICT ON UPDATE CASCADE,
         ADD CONSTRAINT `room_floor_fk` FOREIGN KEY (`floorid`) REFERENCES `Floor` (`floorid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Room_Assignment table constraints
        "ALTER TABLE `Room_Assignment`
         ADD CONSTRAINT `room_assignment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
         ADD CONSTRAINT `room_assignment_room_fk` FOREIGN KEY (`room_no`) REFERENCES `Room` (`room_no`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // User table constraints
        "ALTER TABLE `User`
         ADD CONSTRAINT `user_role_fk` FOREIGN KEY (`roleid`) REFERENCES `Role` (`roleid`) ON DELETE RESTRICT ON UPDATE CASCADE",
        
        // Doctor table constraints
        "ALTER TABLE `Doctor`
         ADD CONSTRAINT `doctor_specialty_fk` FOREIGN KEY (`specialtyid`) REFERENCES `Specialty` (`specialtyid`) ON DELETE RESTRICT ON UPDATE CASCADE"
    ];
    
    // Execute each SQL statement
    $successCount = 0;
    $errorCount = 0;
    
    echo "<div style='margin: 20px; padding: 10px; border: 1px solid #ccc;'>";
    
    foreach ($sqlStatements as $index => $sql) {
        try {
            $pdo->exec($sql);
            echo "<p style='color: green;'>✓ Successfully executed statement #" . ($index + 1) . "</p>";
            $successCount++;
        } catch (PDOException $e) {
            echo "<p style='color: red;'>✗ Error executing statement #" . ($index + 1) . ": " . $e->getMessage() . "</p>";
            $errorCount++;
        }
    }
    
    echo "</div>";
    
    // Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    // Summary
    echo "<h2>Update Summary</h2>";
    echo "<p>Total statements: " . count($sqlStatements) . "</p>";
    echo "<p style='color: green;'>Successful: $successCount</p>";
    echo "<p style='color: red;'>Failed: $errorCount</p>";
    
    if ($errorCount > 0) {
        echo "<p><strong>Note:</strong> Some constraints may have failed if they already exist or if there are data integrity issues. Check the error messages above.</p>";
    }
    
    echo "<p>Database update process completed.</p>";
    
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>