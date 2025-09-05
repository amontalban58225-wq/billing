# Hospital Billing System Database Documentation

## Overview

This directory contains files related to the database structure and relationships for the Hospital Billing System. These files are designed to help maintain data integrity and provide documentation for the database schema.

## Files

### 1. DATABASE_RELATIONSHIPS.md

A comprehensive documentation of all table relationships in the Hospital Billing System database. This file includes:

- Detailed descriptions of each table and its relationships
- Foreign key constraints between tables
- Implementation notes for database maintenance

### 2. database_diagram.svg

A visual representation of the database schema showing all tables and their relationships. This SVG file can be viewed in any web browser or SVG viewer.

### 3. hospital_db_fixed.sql

SQL script containing `ALTER TABLE` statements to add missing foreign key constraints to the database. This script ensures data integrity by properly defining relationships between tables.

### 4. update_database_relationships.php

PHP script to apply the foreign key constraints to an existing database. This script connects to the database and executes the necessary SQL statements to add the constraints.

## How to Use

### Applying Database Constraints

To apply the foreign key constraints to your database:

1. Ensure your XAMPP server is running
2. Navigate to this directory in your terminal
3. Run the PHP script:
   ```
   php update_database_relationships.php
   ```

### Viewing the Database Diagram

Open the `database_diagram.svg` file in any web browser to view the visual representation of the database schema.

### Understanding Table Relationships

Refer to `DATABASE_RELATIONSHIPS.md` for a detailed explanation of all table relationships in the database.

## Maintenance

When making changes to the database schema:

1. Update the `hospital_db_fixed.sql` file with any new constraints
2. Update the `update_database_relationships.php` script to include the new constraints
3. Update the documentation in `DATABASE_RELATIONSHIPS.md`
4. Update the visual diagram in `database_diagram.svg`

## Notes

- All foreign key constraints use `ON DELETE RESTRICT` to prevent accidental deletion of referenced records
- All foreign key constraints use `ON UPDATE CASCADE` to ensure that when a primary key is updated, all references to it are automatically updated
- Child tables of `Admission` use `ON DELETE CASCADE` to automatically remove related records when an admission is deleted