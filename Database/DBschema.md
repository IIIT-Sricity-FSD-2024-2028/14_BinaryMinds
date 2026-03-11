# Digital Governance License Generating System  
## Database Schema

This file contains the SQL statements required to create the database and all tables for the Licensing System.

Executing this file will create a fresh database instance with all required tables and relationships.

---

## Create Database

```sql
CREATE DATABASE IF NOT EXISTS licensing_system;
USE licensing_system;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'applicant',
        'field_officer',
        'department_officer'
    ) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,

    full_name VARCHAR(120) NOT NULL,
    father_name VARCHAR(120),
    date_of_birth DATE,
    gender VARCHAR(20),

    aadhaar_number VARCHAR(20) UNIQUE,
    applicant_phone VARCHAR(15),

    business_name VARCHAR(150) NOT NULL,
    business_type VARCHAR(100),
    trade_category VARCHAR(100),

    shop_address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),

    business_start_date DATE,

    application_status ENUM(
        'submitted',
        'documents_uploaded',
        'inspection_scheduled',
        'inspection_completed',
        'department_review',
        'approved',
        'rejected'
    ) DEFAULT 'submitted',

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (applicant_id) REFERENCES users(user_id)
);
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,

    document_type ENUM(
        'aadhar_card',
        'business_affidavit',
        'passport_photo'
    ) NOT NULL,

    file_path VARCHAR(255) NOT NULL,

    verification_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) DEFAULT 'pending',

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,

    amount DECIMAL(10,2) NOT NULL,
    transaction_reference VARCHAR(100),

    payment_status ENUM(
        'pending',
        'success',
        'failed'
    ) DEFAULT 'pending',

    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);
CREATE TABLE document_verifications (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    field_officer_id INT NOT NULL,

    verification_status ENUM(
        'pending',
        'approved_for_inspection',
        'rejected_on_verification'
    ) DEFAULT 'pending',

    rejection_reason TEXT,

    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (field_officer_id) REFERENCES users(user_id)
);
CREATE TABLE field_officer_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    field_officer_id INT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inspection_date DATE,
    sla_deadline DATE,

    assignment_status ENUM(
        'assigned',
        'inspection_scheduled',
        'inspection_completed',
        'sla_escalated'
    ) DEFAULT 'assigned',

    escalated_to_department BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (field_officer_id) REFERENCES users(user_id)
);
CREATE TABLE inspections (
    inspection_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    field_officer_id INT NOT NULL,

    inspection_date DATE,
    inspection_report TEXT,

    inspection_result ENUM(
        'approved',
        'rejected'
    ),

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (field_officer_id) REFERENCES users(user_id)
);
CREATE TABLE department_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    department_officer_id INT NOT NULL,

    review_type ENUM(
        'normal_review',
        'sla_escalation'
    ) DEFAULT 'normal_review',

    review_status ENUM(
        'approved',
        'rejected'
    ),

    review_comments TEXT,
    digital_signature VARCHAR(255),

    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (department_officer_id) REFERENCES users(user_id)
);
CREATE TABLE licenses (
    license_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,

    license_number VARCHAR(50) UNIQUE,

    issue_date DATE,
    expiry_date DATE,

    license_status ENUM(
        'active',
        'renewal_required',
        'expired',
        'suspended',
        'cancelled'
    ) DEFAULT 'active',

    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);
CREATE TABLE license_renewals (
    renewal_id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT NOT NULL,

    renewal_fee DECIMAL(10,2),

    renewal_status ENUM(
        'submitted',
        'inspection_scheduled',
        'inspection_completed',
        'department_review',
        'approved',
        'rejected'
    ) DEFAULT 'submitted',

    new_expiry_date DATE,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_id) REFERENCES licenses(license_id)
);
CREATE TABLE compliance_violations (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT NOT NULL,
    reported_by INT NOT NULL,

    violation_type VARCHAR(150),
    violation_description TEXT,

    action_taken ENUM(
        'warning',
        'fine',
        'suspended',
        'license_cancelled'
    ),

    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_id) REFERENCES licenses(license_id),
    FOREIGN KEY (reported_by) REFERENCES users(user_id)
);
CREATE TABLE field_officer_warnings (
    warning_id INT AUTO_INCREMENT PRIMARY KEY,
    field_officer_id INT NOT NULL,
    application_id INT NOT NULL,

    warning_reason VARCHAR(255),

    warning_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (field_officer_id) REFERENCES users(user_id),
    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);
