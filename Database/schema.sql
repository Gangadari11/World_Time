CREATE TABLE BRANCH (
  PK_branch_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  oracle_code VARCHAR(100),
  branch_name VARCHAR(255),
  lessee VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE LESSOR (
  PK_lessor_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255),
  nic VARCHAR(20),
  address TEXT,
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  bank_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE LEASE (
  PK_lease_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  FK_branch_id INT,
  FK_lessor_id INT,
  lease_no VARCHAR(100),
  lease_property_address TEXT,
  sqft INT,
  start_date DATE,
  end_date DATE,
  extensions TEXT,
  number_of_years INT,
  rent_advance NUMERIC(12,2),
  rent_advance_period INT,
  refundable_deposit NUMERIC(12,2),
  notice_period_months INT,
  remarks TEXT,
  agreement_value NUMERIC(12,2),
  annual_rate NUMERIC(12,2),
  lease_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (FK_branch_id)
      REFERENCES BRANCH(PK_branch_id),

  FOREIGN KEY (FK_lessor_id)
      REFERENCES LESSOR(PK_lessor_id)
);

CREATE TABLE LEASE_PAYMENT_SCHEDULE (
  PK_payment_schedule_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  FK_lease_id INT,
  lease_year INT,
  gross_amount NUMERIC(12,2),
  paid_amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (FK_lease_id)
      REFERENCES LEASE(PK_lease_id)
);

CREATE TYPE user_role AS ENUM ('admin', 'data_entry', 'auditor');

CREATE TABLE "USER" (
  PK_user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role user_role NOT NULL DEFAULT 'data_entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE REFRESH_TOKENS (
  PK_refresh_token_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  FK_user_id INT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (FK_user_id)
      REFERENCES "USER"(PK_user_id) ON DELETE CASCADE
);

CREATE TABLE entity_change_request (
  pk_entity_change_request_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id INT NOT NULL,
  entity_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_value_snapshot JSONB,
  new_value_snapshot JSONB NOT NULL,
  status TEXT NOT NULL,
  requested_by INT NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  request_comments VARCHAR(1000),
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  review_comments VARCHAR(1000),
  entity_updated_at_snapshot TIMESTAMP,

  CONSTRAINT FK_entity_change_request_user_requested_by
    FOREIGN KEY (requested_by)
      REFERENCES "USER"(PK_user_id) ON DELETE RESTRICT,

  CONSTRAINT FK_entity_change_request_user_reviewed_by
    FOREIGN KEY (reviewed_by)
      REFERENCES "USER"(PK_user_id) ON DELETE SET NULL
);

CREATE INDEX IX_entity_change_request_requested_at
  ON entity_change_request(requested_at);

CREATE INDEX IX_entity_change_request_requested_by
  ON entity_change_request(requested_by);

CREATE INDEX IX_entity_change_request_reviewed_by
  ON entity_change_request(reviewed_by);

CREATE INDEX IX_entity_change_request_status_entity_type_entity_id
  ON entity_change_request(status, entity_type, entity_id);