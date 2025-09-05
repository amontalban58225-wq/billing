-- Add status tracking to Billing Table
ALTER TABLE `Billing` ADD COLUMN `status` VARCHAR(20) DEFAULT 'Pending';

-- Add reference type and auto-calculation flag
ALTER TABLE `Billing` ADD COLUMN `reference_type` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `Billing` ADD COLUMN `auto_calculated` TINYINT(1) DEFAULT 0;

-- Enhance Billing_Category Table
ALTER TABLE `Billing_Category` ADD COLUMN `description` TEXT DEFAULT NULL;
ALTER TABLE `Billing_Category` ADD COLUMN `default_unit_price` DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE `Billing_Category` ADD COLUMN `is_active` TINYINT(1) DEFAULT 1;
ALTER TABLE `Billing_Category` ADD COLUMN `tax_rate` DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE `Billing_Category` ADD COLUMN `discount_eligible` TINYINT(1) DEFAULT 1;

-- Add discount and tax tracking to Billing
ALTER TABLE `Billing` ADD COLUMN `discount_amount` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `Billing` ADD COLUMN `tax_amount` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `Billing` ADD COLUMN `net_amount` DECIMAL(10,2) DEFAULT NULL;

-- Add insurance coverage tracking
ALTER TABLE `Billing` ADD COLUMN `insurance_coverage_percent` DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE `Billing` ADD COLUMN `insurance_covered_amount` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `Billing` ADD COLUMN `patient_responsibility` DECIMAL(10,2) DEFAULT NULL;
