DO $$
DECLARE
    branch_1_id INT;
    branch_2_id INT;
    branch_3_id INT;
    lessor_1_id INT;
    lessor_2_id INT;
    lessor_3_id INT;
    lease_1_id INT;
    lease_2_id INT;
    lease_3_id INT;
    user_1_id INT;
    user_2_id INT;
BEGIN
    TRUNCATE TABLE
        lease_payment_schedule,
        lease,
        branch,
        lessor,
        refresh_tokens,
        "user"
    RESTART IDENTITY CASCADE;

    INSERT INTO branch (oracle_code, branch_name, lessee, status, created_at, updated_at)
    VALUES ('BR-001', 'Colombo Head Office', 'ABC Holdings PLC', 'Active', TIMESTAMP '2026-05-01 09:00:00', TIMESTAMP '2026-05-20 16:30:00')
    RETURNING pk_branch_id INTO branch_1_id;

    INSERT INTO branch (oracle_code, branch_name, lessee, status, created_at, updated_at)
    VALUES ('BR-002', 'Kandy Regional Office', 'ABC Holdings PLC', 'Active', TIMESTAMP '2026-04-15 10:15:00', TIMESTAMP '2026-05-19 14:00:00')
    RETURNING pk_branch_id INTO branch_2_id;

    INSERT INTO branch (oracle_code, branch_name, lessee, status, created_at, updated_at)
    VALUES ('BR-003', 'Galle Branch', 'ABC Holdings PLC', 'Inactive', TIMESTAMP '2026-03-10 08:45:00', TIMESTAMP '2026-05-18 11:20:00')
    RETURNING pk_branch_id INTO branch_3_id;

    INSERT INTO lessor (full_name, nic, address, bank_name, account_number, created_at, updated_at)
    VALUES ('Oceanview Properties (Pvt) Ltd', '912345678V', 'No. 12, Marine Drive, Colombo 03', 'Commercial Bank', '012345678901', TIMESTAMP '2026-05-01 09:30:00', TIMESTAMP '2026-05-20 16:45:00')
    RETURNING pk_lessor_id INTO lessor_1_id;

    INSERT INTO lessor (full_name, nic, address, bank_name, account_number, created_at, updated_at)
    VALUES ('Greenfield Estates', '845678123V', '45, Peradeniya Road, Kandy', 'Sampath Bank', '098765432109', TIMESTAMP '2026-04-20 11:00:00', TIMESTAMP '2026-05-19 15:10:00')
    RETURNING pk_lessor_id INTO lessor_2_id;

    INSERT INTO lessor (full_name, nic, address, bank_name, account_number, created_at, updated_at)
    VALUES ('Southern Hospitality Trust', '765432198V', '88, Church Street, Galle', 'Hatton National Bank', '112233445566', TIMESTAMP '2026-03-12 13:25:00', TIMESTAMP '2026-05-18 12:05:00')
    RETURNING pk_lessor_id INTO lessor_3_id;

    INSERT INTO lease (
        fk_branch_id,
        fk_lessor_id,
        lease_no,
        lease_property_address,
        sqft,
        start_date,
        end_date,
        extensions,
        number_of_years,
        rent_advance,
        rent_advance_period,
        refundable_deposit,
        notice_period_months,
        remarks,
        agreement_value,
        annual_rate,
        lease_status,
        created_at,
        updated_at
    )
    VALUES (
        branch_1_id,
        lessor_1_id,
        'LEASE-COLOMBO-001',
        'No. 45, Galle Road, Colombo 03',
        4200,
        DATE '2024-01-01',
        DATE '2028-12-31',
        'First extension approved for 2 years if required.',
        3,
        1200000.00,
        12,
        500000.00,
        3,
        'Prime office lease for corporate headquarters.',
        18000000.00,
        12.50,
        'Active',
        TIMESTAMP '2026-05-01 10:00:00',
        TIMESTAMP '2026-05-20 16:50:00'
    )
    RETURNING pk_lease_id INTO lease_1_id;

    INSERT INTO lease (
        fk_branch_id,
        fk_lessor_id,
        lease_no,
        lease_property_address,
        sqft,
        start_date,
        end_date,
        extensions,
        number_of_years,
        rent_advance,
        rent_advance_period,
        refundable_deposit,
        notice_period_months,
        remarks,
        agreement_value,
        annual_rate,
        lease_status,
        created_at,
        updated_at
    )
    VALUES (
        branch_2_id,
        lessor_2_id,
        'LEASE-KDY-002',
        'No. 18, Peradeniya Road, Kandy',
        2800,
        DATE '2023-07-01',
        DATE '2029-06-30',
        'Extended once for lease continuity.',
        5,
        800000.00,
        10,
        350000.00,
        6,
        'Regional office with storage and admin space.',
        12500000.00,
        10.00,
        'Active',
        TIMESTAMP '2026-04-15 10:30:00',
        TIMESTAMP '2026-05-19 14:10:00'
    )
    RETURNING pk_lease_id INTO lease_2_id;

    INSERT INTO lease (
        fk_branch_id,
        fk_lessor_id,
        lease_no,
        lease_property_address,
        sqft,
        start_date,
        end_date,
        extensions,
        number_of_years,
        rent_advance,
        rent_advance_period,
        refundable_deposit,
        notice_period_months,
        remarks,
        agreement_value,
        annual_rate,
        lease_status,
        created_at,
        updated_at
    )
    VALUES (
        branch_3_id,
        lessor_3_id,
        'LEASE-GAL-003',
        'No. 77, Lighthouse Street, Galle',
        3600,
        DATE '2022-04-01',
        DATE '2030-03-31',
        'Reconfigured floor plan in 2025.',
        6,
        1500000.00,
        15,
        750000.00,
        4,
        'Tourism support office; branch currently inactive.',
        22000000.00,
        11.75,
        'Terminate',
        TIMESTAMP '2026-03-10 09:00:00',
        TIMESTAMP '2026-05-18 12:15:00'
    )
    RETURNING pk_lease_id INTO lease_3_id;

    INSERT INTO lease_payment_schedule (fk_lease_id, lease_year, gross_amount, paid_amount, created_at, updated_at)
    VALUES
        (lease_1_id, 1, 4200000.00, 4180000.00, TIMESTAMP '2026-05-01 11:00:00', TIMESTAMP '2026-05-20 16:55:00'),
        (lease_1_id, 2, 4350000.00, 4300000.00, TIMESTAMP '2026-05-01 11:05:00', TIMESTAMP '2026-05-20 16:55:00'),
        (lease_1_id, 3, 4500000.00, 4500000.00, TIMESTAMP '2026-05-01 11:10:00', TIMESTAMP '2026-05-20 16:55:00');

    INSERT INTO lease_payment_schedule (fk_lease_id, lease_year, gross_amount, paid_amount, created_at, updated_at)
    VALUES
        (lease_2_id, 1, 2400000.00, 2400000.00, TIMESTAMP '2026-04-15 12:00:00', TIMESTAMP '2026-05-19 14:20:00'),
        (lease_2_id, 2, 2500000.00, 2485000.00, TIMESTAMP '2026-04-15 12:05:00', TIMESTAMP '2026-05-19 14:20:00'),
        (lease_2_id, 3, 2600000.00, 2600000.00, TIMESTAMP '2026-04-15 12:10:00', TIMESTAMP '2026-05-19 14:20:00'),
        (lease_2_id, 4, 2700000.00, 0.00, TIMESTAMP '2026-04-15 12:15:00', TIMESTAMP '2026-05-19 14:20:00'),
        (lease_2_id, 5, 2800000.00, 0.00, TIMESTAMP '2026-04-15 12:20:00', TIMESTAMP '2026-05-19 14:20:00');

    INSERT INTO lease_payment_schedule (fk_lease_id, lease_year, gross_amount, paid_amount, created_at, updated_at)
    VALUES
        (lease_3_id, 1, 3000000.00, 2950000.00, TIMESTAMP '2026-03-10 13:00:00', TIMESTAMP '2026-05-18 12:25:00'),
        (lease_3_id, 2, 3100000.00, 3050000.00, TIMESTAMP '2026-03-10 13:05:00', TIMESTAMP '2026-05-18 12:25:00'),
        (lease_3_id, 3, 3200000.00, 3150000.00, TIMESTAMP '2026-03-10 13:10:00', TIMESTAMP '2026-05-18 12:25:00'),
        (lease_3_id, 4, 3300000.00, 0.00, TIMESTAMP '2026-03-10 13:15:00', TIMESTAMP '2026-05-18 12:25:00'),
        (lease_3_id, 5, 3400000.00, 0.00, TIMESTAMP '2026-03-10 13:20:00', TIMESTAMP '2026-05-18 12:25:00'),
        (lease_3_id, 6, 3500000.00, 0.00, TIMESTAMP '2026-03-10 13:25:00', TIMESTAMP '2026-05-18 12:25:00');

    INSERT INTO "user" (password_hash, full_name, email, role, created_at, updated_at)
    VALUES ('$2a$11$0xIFRSsamplehash0xIFRSsamplehash0xIFRSsamplehash0xI', 'System Admin', 'admin@ifrs.local', 'admin'::user_role, TIMESTAMP '2026-05-01 08:00:00', TIMESTAMP '2026-05-20 09:00:00')
    RETURNING pk_user_id INTO user_1_id;

    INSERT INTO "user" (password_hash, full_name, email, role, created_at, updated_at)
    VALUES ('$2a$11$1xIFRSsamplehash1xIFRSsamplehash1xIFRSsamplehash1xI', 'Finance Officer', 'finance@ifrs.local', 'user'::user_role, TIMESTAMP '2026-05-02 08:30:00', TIMESTAMP '2026-05-20 09:15:00')
    RETURNING pk_user_id INTO user_2_id;

    INSERT INTO refresh_tokens (fk_user_id, token, expires_at, created_at)
    VALUES
        (user_1_id, 'rt-admin-20260521-001', TIMESTAMP '2026-06-21 00:00:00', TIMESTAMP '2026-05-21 00:00:00'),
        (user_2_id, 'rt-finance-20260521-002', TIMESTAMP '2026-06-21 00:00:00', TIMESTAMP '2026-05-21 00:00:00');
END $$;
