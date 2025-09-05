-- SQL Script to enhance Billing_Category table for automated billing

-- Add new columns to Billing_Category table
ALTER TABLE Billing_Category
ADD COLUMN source_table VARCHAR(50) NULL COMMENT 'Reference to source table (Room_Category, Medicine, Lab_Test, etc.)',
ADD COLUMN source_field VARCHAR(50) NULL COMMENT 'Field in source table for price (rate_per_day, price, etc.)',
ADD COLUMN source_condition VARCHAR(255) NULL COMMENT 'Optional condition for filtering source data',
ADD COLUMN default_unit_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Default price when no source is specified',
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Default tax rate for this category',
ADD COLUMN discount_eligible TINYINT(1) DEFAULT 1 COMMENT 'Whether items in this category are eligible for discounts',
ADD COLUMN is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this category is active';

-- Update existing categories with source information
UPDATE Billing_Category SET source_table = 'Room_Category', source_field = 'rate_per_day', default_unit_price = 0.00, is_active = 1 WHERE name = 'Room';
UPDATE Billing_Category SET source_table = 'Lab_Test', source_field = 'price', default_unit_price = 0.00, is_active = 1 WHERE name = 'Laboratory';
UPDATE Billing_Category SET source_table = 'Medicine', source_field = 'price', default_unit_price = 0.00, is_active = 1 WHERE name = 'Medicine';

-- Add handling_fee reference for Laboratory category
UPDATE Billing_Category 
SET source_condition = 'JOIN Lab_Test_Category ltc ON lt.categoryid = ltc.labtestcatid' 
WHERE name = 'Laboratory';

-- Set default values for other categories
UPDATE Billing_Category SET default_unit_price = 500.00, is_active = 1 WHERE name = 'Professional Fee';
UPDATE Billing_Category SET default_unit_price = 100.00, is_active = 1 WHERE name = 'Miscellaneous';