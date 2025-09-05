-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 05, 2025 at 01:49 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Admission`
--

CREATE TABLE `Admission` (
  `admissionid` int(11) NOT NULL,
  `patientid` int(11) DEFAULT NULL,
  `doctorid` int(11) DEFAULT NULL,
  `userid` int(11) DEFAULT NULL,
  `admission_date` date DEFAULT current_timestamp(),
  `status` varchar(50) NOT NULL DEFAULT 'Admitted',
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Admission`
--

INSERT INTO `Admission` (`admissionid`, `patientid`, `doctorid`, `userid`, `admission_date`, `status`, `deleted_at`) VALUES
(5, 4, 8, 1, '2025-08-28', 'Admitted', NULL),
(9, 7, 9, 1, '2025-08-29', 'Admitted', NULL),
(10, 8, 5, 2, '2025-08-29', 'Admitted', NULL),
(11, 6, 5, 1, '2025-08-29', 'Admitted', NULL),
(12, 9, 9, 2, '2025-08-30', 'Admitted', '2025-08-30 17:15:17'),
(13, 10, 12, 1, '2025-08-30', 'Admitted', NULL),
(14, 11, 12, 1, '2025-08-30', 'Admitted', NULL),
(15, 5, 12, 1, '2025-08-30', 'Admitted', NULL),
(16, 9, 5, 2, '2025-08-30', 'Admitted', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Billing`
--

CREATE TABLE `Billing` (
  `billingid` int(11) NOT NULL,
  `admissionid` int(11) NOT NULL,
  `billing_categoryid` int(11) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `billing_date` datetime DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'Pending',
  `reference_type` varchar(50) DEFAULT NULL,
  `auto_calculated` tinyint(1) DEFAULT 0,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) DEFAULT NULL,
  `insurance_coverage_percent` decimal(5,2) DEFAULT 0.00,
  `insurance_covered_amount` decimal(10,2) DEFAULT 0.00,
  `patient_responsibility` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Billing_Category`
--

CREATE TABLE `Billing_Category` (
  `billing_categoryid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `default_unit_price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `discount_eligible` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Billing_Category`
--

INSERT INTO `Billing_Category` (`billing_categoryid`, `name`, `description`, `default_unit_price`, `is_active`, `tax_rate`, `discount_eligible`) VALUES
(1, 'Room', NULL, NULL, 1, 0.00, 1),
(2, 'Laboratory', NULL, NULL, 1, 0.00, 1),
(3, 'Medicine', NULL, NULL, 1, 0.00, 1),
(4, 'Professional Fee', NULL, NULL, 1, 0.00, 1),
(5, 'Miscellaneous', NULL, NULL, 1, 0.00, 1),
(7, 'osmium', NULL, NULL, 1, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Doctor`
--

CREATE TABLE `Doctor` (
  `doctorid` int(11) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `specialtyid` int(11) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `pf_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Doctor`
--

INSERT INTO `Doctor` (`doctorid`, `fullname`, `specialtyid`, `contact_no`, `status`, `pf_rate`, `deleted_at`) VALUES
(1, 'Dr. Maria Santos', 1, '09171234567', 'Active', 0.00, NULL),
(2, 'Dr. Jose Ramirez', 2, '09181234567', 'Active', 0.00, NULL),
(3, 'Dr. Liza Dela Cruz', 3, '09991234567', 'Active', 0.00, NULL),
(4, 'Dr. Roberto Gutierrez', 4, '09181239876', 'Active', 0.00, NULL),
(5, 'Dr. Angela Manalo', 2, '09221234567', 'Active', 0.00, NULL),
(6, 'Dr. Carlo Enriquez', 6, '09351234567', 'Active', 0.00, NULL),
(7, 'Dr. Katrina Uy', 7, '09181237654', 'Active', 0.00, NULL),
(8, 'Dr. Miguel Villanueva', 8, '09291234567', 'Active', 0.00, NULL),
(9, 'Dr. Sofia Reyes', 9, '09981234567', 'Active', 0.00, NULL),
(10, 'Dr. Ramon Aquino', 10, '09161234567', 'Active', 0.00, NULL),
(11, 'DR. Carlos Yulo', 1, '0981234324', 'Active', 0.00, NULL),
(12, 'Alter Corcuera', 7, '09273423534', 'Active', 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Doctor_Assignment`
--

CREATE TABLE `Doctor_Assignment` (
  `assignmentid` int(11) NOT NULL,
  `admissionid` int(11) DEFAULT NULL,
  `doctorid` int(11) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `pf_override` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Doctor_Assignment`
--

INSERT INTO `Doctor_Assignment` (`assignmentid`, `admissionid`, `doctorid`, `role`, `pf_override`, `notes`, `deleted_at`) VALUES
(9, 10, 6, 'kn', NULL, 'j', '2025-08-30 14:47:42'),
(10, 11, 8, 'n', NULL, '', '2025-08-30 03:16:58'),
(11, 11, 3, 'hg', NULL, 'gv', '2025-08-30 14:42:10'),
(12, 9, 9, 'check his heart', NULL, 'nigga', '2025-08-30 14:42:07'),
(13, 10, 11, 'uyadbcvcv', NULL, 'ac', '2025-08-30 14:42:04'),
(14, 10, 6, 'aaa', NULL, 'a', '2025-08-30 14:42:02'),
(15, 9, 11, 'vv', NULL, '', '2025-08-30 14:41:59'),
(16, 11, 6, 'a000', NULL, '', '2025-08-30 14:41:57'),
(17, 9, 7, 'test', NULL, 'test', '2025-08-30 14:48:45'),
(18, 11, 11, 'test', NULL, 'test', '2025-08-30 14:57:09'),
(19, 9, 11, 'b', NULL, 'b', NULL),
(20, 13, 12, 'null', NULL, 'null', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Floor`
--

CREATE TABLE `Floor` (
  `floorid` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Floor`
--

INSERT INTO `Floor` (`floorid`, `name`, `is_deleted`) VALUES
(1, 'Ground Floor', 0),
(2, '2nd Floor', 0),
(3, '3rd Floor', 0),
(4, '4th Floor', 0);

-- --------------------------------------------------------

--
-- Table structure for table `Generic_Medicine`
--

CREATE TABLE `Generic_Medicine` (
  `genericid` int(11) NOT NULL,
  `generic_name` varchar(100) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Generic_Medicine`
--

INSERT INTO `Generic_Medicine` (`genericid`, `generic_name`, `is_deleted`) VALUES
(1, 'Paracetamol', 0),
(2, 'Amoxicillin', 0),
(3, 'Metformin', 0),
(4, 'Amlodipine', 0),
(5, 'Ceftriaxone', 0),
(6, 'Omeprazole', 0),
(7, 'Losartan', 0),
(8, 'Ciprofloxacin', 0),
(9, 'GAGUEEEE', 1),
(10, 'gahh', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Insurance_Provider`
--

CREATE TABLE `Insurance_Provider` (
  `insuranceid` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `coverage_percent` decimal(5,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Insurance_Provider`
--

INSERT INTO `Insurance_Provider` (`insuranceid`, `name`, `coverage_percent`, `description`, `is_active`) VALUES
(1, 'PhilHealth', 60.00, 'National Health Insurance Program', 1),
(2, 'Maxicare', 80.00, 'Private HMO coverage', 1),
(3, 'Medicard', 75.00, 'Private HMO coverage', 1),
(4, 'Intellicare', 70.00, 'Corporate HMO coverage', 1),
(5, 'Kaiser', 65.00, 'Private insurance provider', 1),
(6, 'test', 89.00, 'test', 0);

-- --------------------------------------------------------

--
-- Table structure for table `Lab_Request`
--

CREATE TABLE `Lab_Request` (
  `lab_requestid` int(11) NOT NULL,
  `admissionid` int(11) DEFAULT NULL,
  `requestedBy` int(11) DEFAULT NULL,
  `testid` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Lab_Request`
--

INSERT INTO `Lab_Request` (`lab_requestid`, `admissionid`, `requestedBy`, `testid`, `status`) VALUES
(5, 5, 2, 4, 'Pending'),
(6, 7, 2, 5, 'Pending'),
(7, 8, 8, 7, 'Pending'),
(9, 11, 7, 11, 'Cancelled'),
(10, 9, 9, 6, 'Cancelled'),
(12, 13, 12, 7, 'Completed'),
(13, 13, 11, 10, 'Pending'),
(14, 16, 12, 7, 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `Lab_Test`
--

CREATE TABLE `Lab_Test` (
  `testid` int(11) NOT NULL,
  `categoryid` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Lab_Test`
--

INSERT INTO `Lab_Test` (`testid`, `categoryid`, `name`, `description`, `price`) VALUES
(4, 2, 'Fasting Blood Sugar', 'Glucose level fasting', 150.00),
(5, 2, 'Lipid Profile', 'Cholesterol & triglycerides', 500.00),
(6, 2, 'Liver Function Test', 'AST, ALT, Bilirubin', 650.00),
(7, 3, 'HIV Test', 'Antibody screening', 450.00),
(8, 4, 'Urine Culture', 'Bacterial culture from urine', 400.00),
(9, 5, 'Chest X-Ray', 'PA view', 300.00),
(10, 5, 'CT Scan - Head', 'Non-contrast head scan', 3500.00),
(11, 5, 'MRI Brain', 'With/without contrast', 7500.00);

-- --------------------------------------------------------

--
-- Table structure for table `Lab_Test_Category`
--

CREATE TABLE `Lab_Test_Category` (
  `labtestcatid` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `handling_fee` decimal(10,2) DEFAULT 0.00,
  `turnaround_days` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Lab_Test_Category`
--

INSERT INTO `Lab_Test_Category` (`labtestcatid`, `name`, `description`, `handling_fee`, `turnaround_days`, `is_active`) VALUES
(1, 'X', '', 2.00, 2, 0),
(2, 'Hematology', 'Blood-related diagnostic tests', 50.00, 1, 1),
(3, 'Chemistry', 'Blood chemistry analysis', 75.00, 1, 1),
(4, 'Immunology', 'Immune system tests', 100.00, 2, 1),
(5, 'Microbiology', 'Culture and sensitivity tests', 120.00, 3, 1),
(6, 'Imaging', 'X-ray, CT, MRI scans', 200.00, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Medicine`
--

CREATE TABLE `Medicine` (
  `medicineid` int(11) NOT NULL,
  `genericid` int(11) DEFAULT NULL,
  `brand_name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Medicine`
--

INSERT INTO `Medicine` (`medicineid`, `genericid`, `brand_name`, `description`, `price`, `is_deleted`) VALUES
(1, 1, 'Biogesic', '500mg tablet', 5.00, 0),
(2, 1, 'Calpol', 'Syrup 250mg/5ml', 40.00, 0),
(3, 2, 'Amoxil', '500mg capsule', 15.00, 0),
(4, 2, 'Amoclav', '625mg tablet', 25.00, 0),
(5, 3, 'Glucophage', '500mg tablet', 10.00, 0),
(6, 4, 'Norvasc', '5mg tablet', 18.00, 0),
(7, 5, 'Rocephin', '1g vial for injection', 350.00, 0),
(8, 6, 'Losec', '20mg capsule', 20.00, 0),
(9, 7, 'Cozaar', '50mg tablet', 22.00, 0),
(10, 8, 'Ciproxin', '500mg tablet', 28.00, 0),
(11, 9, 'ECCCCCCCVVVV', '12', 12.00, 1),
(12, 10, 'bb n', 'jhgg', 878.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Patient`
--

CREATE TABLE `Patient` (
  `patientid` int(11) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `middlename` varchar(50) DEFAULT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `birthdate` date NOT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Other') DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `zipcode` varchar(10) DEFAULT NULL,
  `national_id` varchar(50) DEFAULT NULL,
  `insuranceid` int(11) DEFAULT NULL,
  `emergency_name` varchar(100) DEFAULT NULL,
  `emergency_relation` varchar(50) DEFAULT NULL,
  `emergency_contact` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Patient`
--

INSERT INTO `Patient` (`patientid`, `lastname`, `firstname`, `middlename`, `suffix`, `gender`, `birthdate`, `civil_status`, `contact_no`, `email`, `address`, `city`, `province`, `zipcode`, `national_id`, `insuranceid`, `emergency_name`, `emergency_relation`, `emergency_contact`, `created_at`, `updated_at`, `deleted_at`) VALUES
(4, 'Belono-ac', 'Shaun', 'terceno', 'shan2', 'Male', '2004-10-01', 'Single', '09871723122', 'shaunu2gmail.com', 'East Kibawe', 'Kibawe', 'Bukidnon', '8700', 'SSS', 1, 'Geraldine', 'Mother', '098123892873', '2025-09-02 13:42:03', '2025-09-02 13:57:26', NULL),
(5, 'Luzon', 'Charlie', NULL, NULL, 'Male', '2004-10-02', NULL, '0981274234', NULL, 'TEST', NULL, NULL, NULL, NULL, 4, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(6, 'Bucod', 'Lin', NULL, NULL, 'Female', '2006-02-05', NULL, '09817234234', NULL, 'test', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(7, 'Egama', 'Dodot', NULL, NULL, 'Male', '2000-09-23', NULL, '098273432', NULL, 'test', NULL, NULL, NULL, NULL, 4, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(8, 'Pitogo', 'Crystil', NULL, NULL, 'Female', '2004-11-18', NULL, '09912837123', NULL, 'kinase', NULL, NULL, NULL, NULL, 4, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(9, 'Sale', 'Jam', 'Binoong', 'jamb', 'Female', '2003-10-03', 'Separated', '09812423642', 'jambee@gmail.com', 'Purok 3, Upper', 'Kisolon', 'Bukidnon', '9000', 'SSS', 1, 'Sale Binoong', 'Mother', '09876545347', '2025-09-02 13:42:03', '2025-09-04 22:13:52', NULL),
(10, 'Yulo', 'Carlos', NULL, NULL, 'Male', '2004-11-27', NULL, '09712342343', NULL, 'Carmen, Tulay Ng Cathedral', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(11, 'patient', 'unique', NULL, NULL, 'Other', '2004-10-02', NULL, '092873428', NULL, 'oo', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2025-09-02 13:42:03', '2025-09-02 13:42:03', NULL),
(12, 'Dela Cruz', 'Juan', 'Santos', NULL, 'Male', '1998-05-12', 'Single', '09171234567', 'juan.delacruz@email.com', '123 Barangay Uno', 'Valencia City', 'Bukidnon', '8709', 'PH1234567890', NULL, 'Maria Dela Cruz', 'Mother', '09179876543', '2025-09-02 13:45:15', '2025-09-02 13:45:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Patient_old`
--

CREATE TABLE `Patient_old` (
  `patientid` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `insuranceid` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Patient_old`
--

INSERT INTO `Patient_old` (`patientid`, `fullname`, `gender`, `birthdate`, `contact_no`, `address`, `insuranceid`, `deleted_at`) VALUES
(4, 'Shaun Michael T. Belono-ac', 'Male', '2004-10-01', '09871723122', 'East Kibawe', 5, NULL),
(5, 'Charlie Luzon', 'Male', '2004-10-02', '0981274234', 'TEST', 4, NULL),
(6, 'Lin Bucod', 'Female', '2006-02-05', '09817234234', 'test', 1, NULL),
(7, 'Dodot Egama', 'Male', '2000-09-23', '098273432', 'test', 4, NULL),
(8, 'Crystil Pitogo', 'Female', '2004-11-18', '09912837123', 'kinase', 4, NULL),
(9, 'Jam Sale', 'Female', '2003-10-03', '09812423642', 'Kisolon', 1, NULL),
(10, 'Carlos Yulo', 'Male', '2004-11-27', '09712342343', 'Carmen, Tulay Ng Cathedral', 1, NULL),
(11, 'unique patient', 'Other', '2004-10-02', '092873428', 'oo', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Payment`
--

CREATE TABLE `Payment` (
  `paymentid` int(11) NOT NULL,
  `admissionid` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `method` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `insuranceid` int(11) DEFAULT NULL,
  `insurance_coverage` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Prescription`
--

CREATE TABLE `Prescription` (
  `prescriptionid` int(11) NOT NULL,
  `admissionid` int(11) DEFAULT NULL,
  `medicineid` int(11) DEFAULT NULL,
  `doctorid` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `prescription_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Prescription`
--

INSERT INTO `Prescription` (`prescriptionid`, `admissionid`, `medicineid`, `doctorid`, `quantity`, `status`, `prescription_date`) VALUES
(1, 15, 4, 12, 2, 'Pending', '2025-09-04 19:56:20'),
(2, 15, 4, 5, 324, 'Pending', '2025-09-04 20:18:21'),
(3, 16, 4, 12, 1, 'Dispensed', '2025-09-04 23:12:28');

-- --------------------------------------------------------

--
-- Table structure for table `Role`
--

CREATE TABLE `Role` (
  `roleid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `permissions` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Role`
--

INSERT INTO `Role` (`roleid`, `name`, `status`, `permissions`) VALUES
(1, 'ADMINISTRATOR', 'Active', 'ALL,Manage Roles,Manage Users'),
(2, 'SAMPLE', 'Inactive', 'ALL,Manage Roles,Manage Users,Manage Patients,Manage Doctors,Manage Admissions,Manage Billing,Manage Payments,Manage Rooms,Manage Room Assignments,Manage Lab Tests,Manage Lab Requests,Manage Prescriptions,Manage Doctor Assignments'),
(3, 'Doctor', 'Active', 'Manage Patients,Manage Admissions,Manage Lab Requests,Manage Prescriptions'),
(4, 'Nurse', 'Active', 'Manage Patients,Manage Admissions,Manage Lab Requests,Manage Prescriptions');

-- --------------------------------------------------------

--
-- Table structure for table `Room`
--

CREATE TABLE `Room` (
  `room_no` varchar(20) NOT NULL,
  `categoryid` int(11) DEFAULT NULL,
  `floorid` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Room`
--

INSERT INTO `Room` (`room_no`, `categoryid`, `floorid`, `status`) VALUES
('101', 1, 1, 'Occupied'),
('102', 1, 1, 'Occupied'),
('201', 2, 2, 'Occupied'),
('202', 2, 2, 'Occupied'),
('301', 3, 3, 'Occupied'),
('302', 3, 3, 'Occupied'),
('401', 4, 4, 'Occupied');

-- --------------------------------------------------------

--
-- Table structure for table `Room_Assignment`
--

CREATE TABLE `Room_Assignment` (
  `assignmentid` int(11) NOT NULL,
  `admissionid` int(11) DEFAULT NULL,
  `room_no` varchar(20) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Room_Assignment`
--

INSERT INTO `Room_Assignment` (`assignmentid`, `admissionid`, `room_no`, `start_date`, `end_date`, `deleted_at`) VALUES
(2, 5, '102', '2025-08-29', NULL, NULL),
(3, 7, '401', '2025-12-09', NULL, NULL),
(4, 8, '101', '2025-08-29', NULL, NULL),
(5, 9, '201', '2025-08-29', NULL, NULL),
(6, 10, '102', '2025-08-29', NULL, NULL),
(8, 13, '301', '2025-08-29', '2025-09-04', NULL),
(9, 16, '202', '2025-09-04', '2025-09-20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Room_Category`
--

CREATE TABLE `Room_Category` (
  `categoryid` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `rate_per_day` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Room_Category`
--

INSERT INTO `Room_Category` (`categoryid`, `name`, `description`, `rate_per_day`, `is_active`) VALUES
(1, 'Ward', 'Shared ward, 6–8 beds', 500.00, 1),
(2, 'Semi-Private Room', '2 beds per room', 1200.00, 1),
(3, 'Private Room', 'Single occupancy room', 2500.00, 1),
(4, 'ICU', 'Intensive Care Unit', 5000.00, 1),
(5, 'Deluxe Suite', 'Premium private suite with amenities', 7000.00, 1),
(6, 'TEST', '', 1200.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Specialty`
--

CREATE TABLE `Specialty` (
  `specialtyid` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Specialty`
--

INSERT INTO `Specialty` (`specialtyid`, `name`) VALUES
(1, 'Cardiology'),
(9, 'Dermatology'),
(10, 'Emergency Medicine'),
(8, 'ENT (Otorhinolaryngology)'),
(5, 'General Surgery'),
(2, 'Internal Medicine'),
(7, 'Neurology'),
(4, 'Obstetrics and Gynecology'),
(6, 'Orthopedics'),
(3, 'Pediatrics');

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `userid` int(11) NOT NULL,
  `roleid` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`userid`, `roleid`, `username`, `password`, `status`, `deleted_at`) VALUES
(1, 1, 'Ivan Pascua', '$2y$10$7bC6k5G1hG0hHqmsvsu8Iu88Tmnr.USf4.zAr4f1bd8n6yuYe3X.S', 'Active', NULL),
(2, 3, 'Cejay', '$2y$10$8YdVCDg8FK5vuH2mFDTF..8WCToOA8FWjFikGIGbAhDmklNulFWlK', 'Active', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Admission`
--
ALTER TABLE `Admission`
  ADD PRIMARY KEY (`admissionid`),
  ADD KEY `patientid` (`patientid`),
  ADD KEY `doctorid` (`doctorid`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `Billing`
--
ALTER TABLE `Billing`
  ADD PRIMARY KEY (`billingid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `billing_categoryid` (`billing_categoryid`);

--
-- Indexes for table `Billing_Category`
--
ALTER TABLE `Billing_Category`
  ADD PRIMARY KEY (`billing_categoryid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Doctor`
--
ALTER TABLE `Doctor`
  ADD PRIMARY KEY (`doctorid`),
  ADD KEY `specialtyid` (`specialtyid`);

--
-- Indexes for table `Doctor_Assignment`
--
ALTER TABLE `Doctor_Assignment`
  ADD PRIMARY KEY (`assignmentid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `doctorid` (`doctorid`);

--
-- Indexes for table `Floor`
--
ALTER TABLE `Floor`
  ADD PRIMARY KEY (`floorid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Generic_Medicine`
--
ALTER TABLE `Generic_Medicine`
  ADD PRIMARY KEY (`genericid`),
  ADD UNIQUE KEY `generic_name` (`generic_name`);

--
-- Indexes for table `Insurance_Provider`
--
ALTER TABLE `Insurance_Provider`
  ADD PRIMARY KEY (`insuranceid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Lab_Request`
--
ALTER TABLE `Lab_Request`
  ADD PRIMARY KEY (`lab_requestid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `requestedBy` (`requestedBy`),
  ADD KEY `testid` (`testid`);

--
-- Indexes for table `Lab_Test`
--
ALTER TABLE `Lab_Test`
  ADD PRIMARY KEY (`testid`),
  ADD KEY `categoryid` (`categoryid`);

--
-- Indexes for table `Lab_Test_Category`
--
ALTER TABLE `Lab_Test_Category`
  ADD PRIMARY KEY (`labtestcatid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Medicine`
--
ALTER TABLE `Medicine`
  ADD PRIMARY KEY (`medicineid`),
  ADD KEY `genericid` (`genericid`);

--
-- Indexes for table `Patient`
--
ALTER TABLE `Patient`
  ADD PRIMARY KEY (`patientid`),
  ADD KEY `insuranceid` (`insuranceid`);

--
-- Indexes for table `Patient_old`
--
ALTER TABLE `Patient_old`
  ADD PRIMARY KEY (`patientid`),
  ADD KEY `insuranceid` (`insuranceid`);

--
-- Indexes for table `Payment`
--
ALTER TABLE `Payment`
  ADD PRIMARY KEY (`paymentid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `insuranceid` (`insuranceid`);

--
-- Indexes for table `Prescription`
--
ALTER TABLE `Prescription`
  ADD PRIMARY KEY (`prescriptionid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `medicineid` (`medicineid`),
  ADD KEY `doctorid` (`doctorid`);

--
-- Indexes for table `Role`
--
ALTER TABLE `Role`
  ADD PRIMARY KEY (`roleid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Room`
--
ALTER TABLE `Room`
  ADD PRIMARY KEY (`room_no`),
  ADD KEY `categoryid` (`categoryid`),
  ADD KEY `floorid` (`floorid`);

--
-- Indexes for table `Room_Assignment`
--
ALTER TABLE `Room_Assignment`
  ADD PRIMARY KEY (`assignmentid`),
  ADD KEY `admissionid` (`admissionid`),
  ADD KEY `room_no` (`room_no`);

--
-- Indexes for table `Room_Category`
--
ALTER TABLE `Room_Category`
  ADD PRIMARY KEY (`categoryid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Specialty`
--
ALTER TABLE `Specialty`
  ADD PRIMARY KEY (`specialtyid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`userid`),
  ADD KEY `roleid` (`roleid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Admission`
--
ALTER TABLE `Admission`
  MODIFY `admissionid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `Billing`
--
ALTER TABLE `Billing`
  MODIFY `billingid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Billing_Category`
--
ALTER TABLE `Billing_Category`
  MODIFY `billing_categoryid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `Doctor`
--
ALTER TABLE `Doctor`
  MODIFY `doctorid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Doctor_Assignment`
--
ALTER TABLE `Doctor_Assignment`
  MODIFY `assignmentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `Floor`
--
ALTER TABLE `Floor`
  MODIFY `floorid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Generic_Medicine`
--
ALTER TABLE `Generic_Medicine`
  MODIFY `genericid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `Insurance_Provider`
--
ALTER TABLE `Insurance_Provider`
  MODIFY `insuranceid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Lab_Request`
--
ALTER TABLE `Lab_Request`
  MODIFY `lab_requestid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `Lab_Test`
--
ALTER TABLE `Lab_Test`
  MODIFY `testid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Lab_Test_Category`
--
ALTER TABLE `Lab_Test_Category`
  MODIFY `labtestcatid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Medicine`
--
ALTER TABLE `Medicine`
  MODIFY `medicineid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Patient`
--
ALTER TABLE `Patient`
  MODIFY `patientid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Patient_old`
--
ALTER TABLE `Patient_old`
  MODIFY `patientid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Payment`
--
ALTER TABLE `Payment`
  MODIFY `paymentid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Prescription`
--
ALTER TABLE `Prescription`
  MODIFY `prescriptionid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `Role`
--
ALTER TABLE `Role`
  MODIFY `roleid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Room_Assignment`
--
ALTER TABLE `Room_Assignment`
  MODIFY `assignmentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `Room_Category`
--
ALTER TABLE `Room_Category`
  MODIFY `categoryid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Specialty`
--
ALTER TABLE `Specialty`
  MODIFY `specialtyid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `userid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Admission`
--
ALTER TABLE `Admission`
  ADD CONSTRAINT `admission_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `admission_patient_fk` FOREIGN KEY (`patientid`) REFERENCES `Patient` (`patientid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `admission_user_fk` FOREIGN KEY (`userid`) REFERENCES `User` (`userid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Billing`
--
ALTER TABLE `Billing`
  ADD CONSTRAINT `billing_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `billing_category_fk` FOREIGN KEY (`billing_categoryid`) REFERENCES `Billing_Category` (`billing_categoryid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Doctor`
--
ALTER TABLE `Doctor`
  ADD CONSTRAINT `doctor_specialty_fk` FOREIGN KEY (`specialtyid`) REFERENCES `Specialty` (`specialtyid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Doctor_Assignment`
--
ALTER TABLE `Doctor_Assignment`
  ADD CONSTRAINT `fk_assignment_admission` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assignment_doctor` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Lab_Request`
--
ALTER TABLE `Lab_Request`
  ADD CONSTRAINT `lab_request_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lab_request_test_fk` FOREIGN KEY (`testid`) REFERENCES `Lab_Test` (`testid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `lab_request_user_fk` FOREIGN KEY (`requestedBy`) REFERENCES `User` (`userid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Lab_Test`
--
ALTER TABLE `Lab_Test`
  ADD CONSTRAINT `lab_test_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Lab_Test_Category` (`labtestcatid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Medicine`
--
ALTER TABLE `Medicine`
  ADD CONSTRAINT `medicine_generic_fk` FOREIGN KEY (`genericid`) REFERENCES `Generic_Medicine` (`genericid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Patient`
--
ALTER TABLE `Patient`
  ADD CONSTRAINT `patient_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Payment`
--
ALTER TABLE `Payment`
  ADD CONSTRAINT `payment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payment_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Prescription`
--
ALTER TABLE `Prescription`
  ADD CONSTRAINT `prescription_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `prescription_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `prescription_medicine_fk` FOREIGN KEY (`medicineid`) REFERENCES `Medicine` (`medicineid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Room`
--
ALTER TABLE `Room`
  ADD CONSTRAINT `room_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Room_Category` (`categoryid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `room_floor_fk` FOREIGN KEY (`floorid`) REFERENCES `Floor` (`floorid`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `Room_Assignment`
--
ALTER TABLE `Room_Assignment`
  ADD CONSTRAINT `room_assignment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `room_assignment_room_fk` FOREIGN KEY (`room_no`) REFERENCES `Room` (`room_no`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `User`
--
ALTER TABLE `User`
  ADD CONSTRAINT `user_role_fk` FOREIGN KEY (`roleid`) REFERENCES `Role` (`roleid`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
