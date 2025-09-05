# Automated Billing System Documentation

## Overview

The Automated Billing System enhances the hospital billing process by automatically generating billing entries based on predefined categories and their associated source tables. This feature streamlines the billing workflow, reduces manual entry errors, and ensures consistent pricing across the hospital system.

## Key Components

### Database Enhancements

#### Billing_Category Table

The `Billing_Category` table has been enhanced with the following new columns:

- `source_table`: Specifies which table to pull items from (e.g., Room, Lab_Test, Medicine)
- `source_field`: Specifies which field in the source table contains the price/rate
- `source_condition`: Optional SQL WHERE condition to filter source items
- `default_unit_price`: Default price when no source is specified
- `tax_rate`: Percentage of tax to apply
- `discount_eligible`: Whether the category is eligible for discounts
- `is_active`: Whether the category is active

### API Endpoints

#### New Endpoints in billing.php

1. `getAvailableRooms`: Retrieves available rooms with their categories and rates
2. `getLabTests`: Retrieves lab tests with their prices
3. `getMedicines`: Retrieves medicines with their prices and stock information
4. `getRoomAssignment`: Retrieves room assignment details for a specific admission
5. `getItemsByCategory`: Dynamically fetches items from the source table specified in the billing category
6. `generateAutomaticBilling`: Creates a new billing entry based on category source and reference item

### User Interface

#### Billing Category Management

- Enhanced form for configuring source tables and fields
- Visual indicators showing which categories have automated sources
- Dropdown selection for common source tables (Room, Lab_Test, Medicine)

#### Automated Billing Generation

- New "Add Automated Billing" button in the billing interface
- Modal form for selecting admission, category, and specific items
- Dynamic loading of items based on the selected category's source table

## How It Works

1. **Configuration**: Administrators configure billing categories with appropriate source tables and fields
2. **Item Selection**: When creating a new billing, users select a category, which dynamically loads relevant items
3. **Price Calculation**: The system automatically retrieves the price from the source table's specified field
4. **Billing Generation**: A new billing record is created with calculated amounts, taxes, and discounts

## Usage Examples

### Room Charges

1. Configure a "Room Charge" billing category with:
   - `source_table`: "Room"
   - `source_field`: "rate"
   - `tax_rate`: 5%

2. When generating a billing, select "Room Charge" category and a specific room
3. The system automatically pulls the room rate and calculates taxes

### Laboratory Tests

1. Configure a "Laboratory" billing category with:
   - `source_table`: "Lab_Test"
   - `source_field`: "price"
   - `tax_rate`: 8%

2. When generating a billing, select "Laboratory" category and a specific test
3. The system automatically pulls the test price and calculates taxes

## Implementation Notes

- The system supports multiple source tables and can be extended to include additional sources
- Default prices are used when source tables or fields are not specified
- The automated billing process includes proper validation and error handling
- All billing records maintain audit trails with creation timestamps and user information