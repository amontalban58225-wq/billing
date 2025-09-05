# Hospital Billing System Database Relationships

## Overview

This document outlines the relationships between tables in the Hospital Billing System database. Proper foreign key constraints have been added to ensure data integrity and accurate relationships in the database schema.

## Core Tables and Relationships

### Patient Management

- **Patient** table
  - Primary key: `patientid`
  - Foreign keys:
    - `insuranceid` → `Insurance_Provider.insuranceid`

- **Insurance_Provider** table
  - Primary key: `insuranceid`

### Admission Management

- **Admission** table
  - Primary key: `admissionid`
  - Foreign keys:
    - `patientid` → `Patient.patientid`
    - `doctorid` → `Doctor.doctorid`
    - `userid` → `User.userid`

- **Room_Assignment** table
  - Primary key: `assignmentid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `room_no` → `Room.room_no`

### Room Management

- **Room** table
  - Primary key: `room_no`
  - Foreign keys:
    - `categoryid` → `Room_Category.categoryid`
    - `floorid` → `Floor.floorid`

- **Room_Category** table
  - Primary key: `categoryid`

- **Floor** table
  - Primary key: `floorid`

### Doctor Management

- **Doctor** table
  - Primary key: `doctorid`
  - Foreign keys:
    - `specialtyid` → `Specialty.specialtyid`

- **Specialty** table
  - Primary key: `specialtyid`

- **Doctor_Assignment** table
  - Primary key: `assignmentid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `doctorid` → `Doctor.doctorid`

### Billing Management

- **Billing** table
  - Primary key: `billingid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `billing_categoryid` → `Billing_Category.billing_categoryid`

- **Billing_Category** table
  - Primary key: `billing_categoryid`

- **Payment** table
  - Primary key: `paymentid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `insuranceid` → `Insurance_Provider.insuranceid`

### Laboratory Management

- **Lab_Request** table
  - Primary key: `lab_requestid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `requestedBy` → `User.userid`
    - `testid` → `Lab_Test.testid`

- **Lab_Test** table
  - Primary key: `testid`
  - Foreign keys:
    - `categoryid` → `Lab_Test_Category.labtestcatid`

- **Lab_Test_Category** table
  - Primary key: `labtestcatid`

### Medication Management

- **Prescription** table
  - Primary key: `prescriptionid`
  - Foreign keys:
    - `admissionid` → `Admission.admissionid`
    - `medicineid` → `Medicine.medicineid`
    - `doctorid` → `Doctor.doctorid`

- **Medicine** table
  - Primary key: `medicineid`
  - Foreign keys:
    - `genericid` → `Generic_Medicine.genericid`

- **Generic_Medicine** table
  - Primary key: `genericid`

### User Management

- **User** table
  - Primary key: `userid`
  - Foreign keys:
    - `roleid` → `Role.roleid`

- **Role** table
  - Primary key: `roleid`

## Relationship Diagram

```
+----------------+     +-------------------+     +---------------+
|    Patient     |<----+    Admission     +---->|     Doctor    |
+----------------+     +-------------------+     +---------------+
       ^                       ^   |  ^                ^
       |                       |   |  |                |
       |                       |   |  |                |
       |                       |   |  |                |
+----------------+     +-------+   |  +----------+     +---------------+
| Insurance_Prov |     |           v            |     |   Specialty   |
+----------------+     |    +-------------+     |     +---------------+
       ^               |    | Room_Assign |     |
       |               |    +-------------+     |
       |               |           |            |
       |               |           v            |
+----------------+     |    +-------------+     |     +---------------+
|    Payment     +-----+    |    Room     |     +---->| Doctor_Assign |
+----------------+          +-------------+           +---------------+
                                   |  ^
                                   |  |
                                   v  |
                            +-------------+     +---------------+
                            | Room_Categ  |     |     Floor     |
                            +-------------+     +---------------+

+----------------+     +-------------------+     +---------------+
|    Billing     +---->| Billing_Category |     |  Lab_Request  |
+----------------+     +-------------------+     +---------------+
       ^                                               ^
       |                                               |
       |                                               |
       |                                               v
+----------------+     +-------------------+     +---------------+
|   Admission    |<----| Prescription      |     |   Lab_Test    |
+----------------+     +-------------------+     +---------------+
                              |                         |
                              v                         v
                       +-------------+           +---------------+
                       |  Medicine   |           | Lab_Test_Cat  |
                       +-------------+           +---------------+
                              |
                              v
                       +-------------+
                       | Generic_Med |
                       +-------------+

+----------------+     +-------------------+
|     User       |<----|      Role         |
+----------------+     +-------------------+
```

## Implementation Notes

1. All foreign key constraints use `ON DELETE RESTRICT` to prevent accidental deletion of referenced records, except for child tables of `Admission` which use `ON DELETE CASCADE` to automatically remove related records when an admission is deleted.

2. All foreign key constraints use `ON UPDATE CASCADE` to ensure that when a primary key is updated, all references to it are automatically updated.

3. The database schema has been updated to include these constraints in the `hospital_db_fixed.sql` file.

4. A PHP script `update_database_relationships.php` has been provided to apply these constraints to an existing database.