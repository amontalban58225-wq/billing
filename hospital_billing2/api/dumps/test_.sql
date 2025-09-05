-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 02, 2025 at 09:29 AM
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
-- Database: `test/`
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
  `admission_date` date DEFAULT curdate(),
  `status` varchar(50) NOT NULL DEFAULT 'Admitted',
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `billing_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Billing_Category`
--

CREATE TABLE `Billing_Category` (
  `billing_categoryid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Billing_Category`
--

INSERT INTO `Billing_Category` (`billing_categoryid`, `name`) VALUES
(2, 'Laboratory'),
(4, 'Medicines'),
(3, 'Professional Fee'),
(1, 'Rooms');

-- --------------------------------------------------------

--
-- Table structure for table `Doctor`
--

CREATE TABLE `Doctor` (
  `doctorid` int(11) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `specialtyid` int(11) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `pf_rate` decimal(10,2) DEFAULT 0.00,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Doctor`
--

INSERT INTO `Doctor` (`doctorid`, `fullname`, `specialtyid`, `contact_no`, `status`, `pf_rate`, `deleted_at`) VALUES
(1, 'Carlos Yulo', 1, '0912732374234', 'Active', 0.00, NULL),
(2, 'Yu Chai Mei', 1, '0992835435', 'Active', 0.00, NULL);

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
(1, '2nd Floor', 0),
(2, '3rd Floor', 0),
(3, 'Ground', 0);

-- --------------------------------------------------------

--
-- Table structure for table `Generic_Medicine`
--

CREATE TABLE `Generic_Medicine` (
  `genericid` int(11) NOT NULL,
  `generic_name` varchar(100) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Generic_Medicine`
--

INSERT INTO `Generic_Medicine` (`genericid`, `generic_name`, `is_deleted`) VALUES
(1, 'Test', 0);

-- --------------------------------------------------------

--
-- Table structure for table `Insurance_Provider`
--

CREATE TABLE `Insurance_Provider` (
  `insuranceid` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `coverage_percent` decimal(5,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Insurance_Provider`
--

INSERT INTO `Insurance_Provider` (`insuranceid`, `name`, `coverage_percent`, `description`, `is_active`) VALUES
(1, 'Philhealth', 70.00, '', 1);

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
(1, 1, 'X-ray', '', 500.00);

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
(1, 'Imaging', '', 30.00, 1, 1);

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
(1, 1, 'Paracetamol', 'test', 12.00, 0);

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
(1, 'Belono-ac', 'Shaun Michael', 'Terceno', 'shan2', 'Male', '2004-10-01', 'Single', '09361470082', 'shaunu@gmail.com', 'Purok 1, San Vicente', 'KIBAWE', 'BUKIDNON', '8700', 'SSS', 1, 'Geraldine Belono-ac', 'Mother', '09551928071', '2025-09-02 15:01:04', '2025-09-02 15:01:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Payment`
--

CREATE TABLE `Payment` (
  `paymentid` int(11) NOT NULL,
  `admissionid` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `method` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `insuranceid` int(11) DEFAULT NULL
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
  `quantity` int(11) DEFAULT 1,
  `status` varchar(20) DEFAULT 'Pending',
  `prescription_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'Administrator', 'Active', 'ALL');

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
('100', 2, 3, 'Available'),
('200', 2, 1, 'Available'),
('300', 2, 2, 'Available'),
('400', 1, 3, 'Available'),
('500', 1, 1, 'Available'),
('600', 1, 2, 'Available');

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
(1, 'Suite Room', 'test', 900.00, 1),
(2, 'Private', '', 3000.00, 1);

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
(1, 'Test');

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `userid` int(11) NOT NULL,
  `roleid` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`userid`, `roleid`, `username`, `password`, `status`, `deleted_at`) VALUES
(1, 1, 'Shaunu', '$2y$10$EWp6aftG5qWZNjP1l1Yxp.4XUbZzw6zzIt3MY6XXOjfUaVwioezSu', 'Active', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_billing_auto_lines`
-- (See below for the actual view)
--
CREATE TABLE `vw_billing_auto_lines` (
`admissionid` int(11)
,`billing_category` varchar(16)
,`item_name` varchar(115)
,`service_date` datetime
,`quantity` int(11)
,`unit_price` decimal(11,2)
,`total_amount` decimal(20,2)
);

-- --------------------------------------------------------

--
-- Structure for view `vw_billing_auto_lines`
--
DROP TABLE IF EXISTS `vw_billing_auto_lines`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_billing_auto_lines`  AS SELECT `ra`.`admissionid` AS `admissionid`, 'Room' AS `billing_category`, `rc`.`name` AS `item_name`, `ra`.`start_date` AS `service_date`, greatest(to_days(coalesce(`ra`.`end_date`,curdate())) - to_days(`ra`.`start_date`),1) AS `quantity`, `rc`.`rate_per_day` AS `unit_price`, `rc`.`rate_per_day`* greatest(to_days(coalesce(`ra`.`end_date`,curdate())) - to_days(`ra`.`start_date`),1) AS `total_amount` FROM ((`room_assignment` `ra` join `room` `r` on(`r`.`room_no` = `ra`.`room_no`)) join `room_category` `rc` on(`rc`.`categoryid` = `r`.`categoryid`)) WHERE `ra`.`deleted_at` is nullunion allselect `p`.`admissionid` AS `admissionid`,'Medicine' AS `billing_category`,concat(`m`.`brand_name`,' (',coalesce(`p`.`quantity`,1),'x)') AS `item_name`,`p`.`prescription_date` AS `service_date`,coalesce(`p`.`quantity`,1) AS `quantity`,`m`.`price` AS `unit_price`,`m`.`price` * coalesce(`p`.`quantity`,1) AS `total_amount` from (`prescription` `p` join `medicine` `m` on(`m`.`medicineid` = `p`.`medicineid`)) where coalesce(`m`.`is_deleted`,0) = 0 union all select `lr`.`admissionid` AS `admissionid`,'Laboratory' AS `billing_category`,`lt`.`name` AS `item_name`,curdate() AS `service_date`,1 AS `quantity`,`lt`.`price` + coalesce(`ltc`.`handling_fee`,0) AS `unit_price`,`lt`.`price` + coalesce(`ltc`.`handling_fee`,0) AS `total_amount` from ((`lab_request` `lr` join `lab_test` `lt` on(`lt`.`testid` = `lr`.`testid`)) join `lab_test_category` `ltc` on(`ltc`.`labtestcatid` = `lt`.`categoryid`)) where `lr`.`status` <> 'Cancelled' union all select `da`.`admissionid` AS `admissionid`,'Professional Fee' AS `billing_category`,concat('PF - ',`d`.`fullname`) AS `item_name`,curdate() AS `service_date`,1 AS `quantity`,coalesce(`da`.`pf_override`,`d`.`pf_rate`,0.00) AS `unit_price`,coalesce(`da`.`pf_override`,`d`.`pf_rate`,0.00) AS `total_amount` from (`doctor_assignment` `da` join `doctor` `d` on(`d`.`doctorid` = `da`.`doctorid`)) where `da`.`deleted_at` is null  ;

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
  ADD PRIMARY KEY (`floorid`);

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
  ADD PRIMARY KEY (`insuranceid`);

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
  ADD PRIMARY KEY (`labtestcatid`);

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
  ADD PRIMARY KEY (`roleid`);

--
-- Indexes for table `Room`
--
ALTER TABLE `Room`
  ADD PRIMARY KEY (`room_no`),
  ADD KEY `categoryid` (`categoryid`);

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
  ADD PRIMARY KEY (`categoryid`);

--
-- Indexes for table `Specialty`
--
ALTER TABLE `Specialty`
  ADD PRIMARY KEY (`specialtyid`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`userid`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `roleid` (`roleid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Admission`
--
ALTER TABLE `Admission`
  MODIFY `admissionid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Billing`
--
ALTER TABLE `Billing`
  MODIFY `billingid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Billing_Category`
--
ALTER TABLE `Billing_Category`
  MODIFY `billing_categoryid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Doctor`
--
ALTER TABLE `Doctor`
  MODIFY `doctorid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Doctor_Assignment`
--
ALTER TABLE `Doctor_Assignment`
  MODIFY `assignmentid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Floor`
--
ALTER TABLE `Floor`
  MODIFY `floorid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `Generic_Medicine`
--
ALTER TABLE `Generic_Medicine`
  MODIFY `genericid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Insurance_Provider`
--
ALTER TABLE `Insurance_Provider`
  MODIFY `insuranceid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Lab_Request`
--
ALTER TABLE `Lab_Request`
  MODIFY `lab_requestid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Lab_Test`
--
ALTER TABLE `Lab_Test`
  MODIFY `testid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Lab_Test_Category`
--
ALTER TABLE `Lab_Test_Category`
  MODIFY `labtestcatid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Medicine`
--
ALTER TABLE `Medicine`
  MODIFY `medicineid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Patient`
--
ALTER TABLE `Patient`
  MODIFY `patientid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Payment`
--
ALTER TABLE `Payment`
  MODIFY `paymentid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Prescription`
--
ALTER TABLE `Prescription`
  MODIFY `prescriptionid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Role`
--
ALTER TABLE `Role`
  MODIFY `roleid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Room_Assignment`
--
ALTER TABLE `Room_Assignment`
  MODIFY `assignmentid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Room_Category`
--
ALTER TABLE `Room_Category`
  MODIFY `categoryid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Specialty`
--
ALTER TABLE `Specialty`
  MODIFY `specialtyid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `userid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Admission`
--
ALTER TABLE `Admission`
  ADD CONSTRAINT `admission_ibfk_1` FOREIGN KEY (`patientid`) REFERENCES `Patient` (`patientid`),
  ADD CONSTRAINT `admission_ibfk_2` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`),
  ADD CONSTRAINT `admission_ibfk_3` FOREIGN KEY (`userid`) REFERENCES `User` (`userid`);

--
-- Constraints for table `Billing`
--
ALTER TABLE `Billing`
  ADD CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `billing_ibfk_2` FOREIGN KEY (`billing_categoryid`) REFERENCES `Billing_Category` (`billing_categoryid`);

--
-- Constraints for table `Doctor`
--
ALTER TABLE `Doctor`
  ADD CONSTRAINT `doctor_ibfk_1` FOREIGN KEY (`specialtyid`) REFERENCES `Specialty` (`specialtyid`);

--
-- Constraints for table `Doctor_Assignment`
--
ALTER TABLE `Doctor_Assignment`
  ADD CONSTRAINT `doctor_assignment_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `doctor_assignment_ibfk_2` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`);

--
-- Constraints for table `Lab_Request`
--
ALTER TABLE `Lab_Request`
  ADD CONSTRAINT `lab_request_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `lab_request_ibfk_2` FOREIGN KEY (`requestedBy`) REFERENCES `User` (`userid`),
  ADD CONSTRAINT `lab_request_ibfk_3` FOREIGN KEY (`testid`) REFERENCES `Lab_Test` (`testid`);

--
-- Constraints for table `Lab_Test`
--
ALTER TABLE `Lab_Test`
  ADD CONSTRAINT `lab_test_ibfk_1` FOREIGN KEY (`categoryid`) REFERENCES `Lab_Test_Category` (`labtestcatid`);

--
-- Constraints for table `Medicine`
--
ALTER TABLE `Medicine`
  ADD CONSTRAINT `medicine_ibfk_1` FOREIGN KEY (`genericid`) REFERENCES `Generic_Medicine` (`genericid`);

--
-- Constraints for table `Patient`
--
ALTER TABLE `Patient`
  ADD CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`);

--
-- Constraints for table `Payment`
--
ALTER TABLE `Payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`);

--
-- Constraints for table `Prescription`
--
ALTER TABLE `Prescription`
  ADD CONSTRAINT `prescription_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `prescription_ibfk_2` FOREIGN KEY (`medicineid`) REFERENCES `Medicine` (`medicineid`),
  ADD CONSTRAINT `prescription_ibfk_3` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`);

--
-- Constraints for table `Room`
--
ALTER TABLE `Room`
  ADD CONSTRAINT `room_ibfk_1` FOREIGN KEY (`categoryid`) REFERENCES `Room_Category` (`categoryid`);

--
-- Constraints for table `Room_Assignment`
--
ALTER TABLE `Room_Assignment`
  ADD CONSTRAINT `room_assignment_ibfk_1` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`),
  ADD CONSTRAINT `room_assignment_ibfk_2` FOREIGN KEY (`room_no`) REFERENCES `Room` (`room_no`);

--
-- Constraints for table `User`
--
ALTER TABLE `User`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`roleid`) REFERENCES `Role` (`roleid`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
