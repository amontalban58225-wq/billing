-- Fixed hospital database schema with proper foreign key constraints
-- This file adds missing foreign key constraints to ensure data integrity

-- Add foreign key constraints to Admission table
ALTER TABLE `Admission`
  ADD CONSTRAINT `admission_patient_fk` FOREIGN KEY (`patientid`) REFERENCES `Patient` (`patientid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `admission_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `admission_user_fk` FOREIGN KEY (`userid`) REFERENCES `User` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Billing table
ALTER TABLE `Billing`
  ADD CONSTRAINT `billing_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `billing_category_fk` FOREIGN KEY (`billing_categoryid`) REFERENCES `Billing_Category` (`billing_categoryid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Lab_Request table
ALTER TABLE `Lab_Request`
  ADD CONSTRAINT `lab_request_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lab_request_user_fk` FOREIGN KEY (`requestedBy`) REFERENCES `User` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `lab_request_test_fk` FOREIGN KEY (`testid`) REFERENCES `Lab_Test` (`testid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Lab_Test table
ALTER TABLE `Lab_Test`
  ADD CONSTRAINT `lab_test_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Lab_Test_Category` (`labtestcatid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Medicine table
ALTER TABLE `Medicine`
  ADD CONSTRAINT `medicine_generic_fk` FOREIGN KEY (`genericid`) REFERENCES `Generic_Medicine` (`genericid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Patient table
ALTER TABLE `Patient`
  ADD CONSTRAINT `patient_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Payment table
ALTER TABLE `Payment`
  ADD CONSTRAINT `payment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payment_insurance_fk` FOREIGN KEY (`insuranceid`) REFERENCES `Insurance_Provider` (`insuranceid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Prescription table
ALTER TABLE `Prescription`
  ADD CONSTRAINT `prescription_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `prescription_medicine_fk` FOREIGN KEY (`medicineid`) REFERENCES `Medicine` (`medicineid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `prescription_doctor_fk` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Room table
ALTER TABLE `Room`
  ADD CONSTRAINT `room_category_fk` FOREIGN KEY (`categoryid`) REFERENCES `Room_Category` (`categoryid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `room_floor_fk` FOREIGN KEY (`floorid`) REFERENCES `Floor` (`floorid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Room_Assignment table
ALTER TABLE `Room_Assignment`
  ADD CONSTRAINT `room_assignment_admission_fk` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `room_assignment_room_fk` FOREIGN KEY (`room_no`) REFERENCES `Room` (`room_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to User table
ALTER TABLE `User`
  ADD CONSTRAINT `user_role_fk` FOREIGN KEY (`roleid`) REFERENCES `Role` (`roleid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Doctor table
ALTER TABLE `Doctor`
  ADD CONSTRAINT `doctor_specialty_fk` FOREIGN KEY (`specialtyid`) REFERENCES `Specialty` (`specialtyid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraints to Doctor_Assignment table
-- Note: These constraints are already present in the original schema
-- ALTER TABLE `Doctor_Assignment`
--   ADD CONSTRAINT `fk_assignment_admission` FOREIGN KEY (`admissionid`) REFERENCES `Admission` (`admissionid`) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT `fk_assignment_doctor` FOREIGN KEY (`doctorid`) REFERENCES `Doctor` (`doctorid`) ON DELETE CASCADE ON UPDATE CASCADE;