Assign Remote Work
Test

SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'requested_by_user_id' cannot be null (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: vasp_crm_v2, SQL: insert into `remote_work_requests` (`employee_id`, `start_date`, `end_date`, `reason`, `requested_by_user_id`, `updated_at`, `created_at`) values (8, 2026-05-29 00:00:00, 2026-05-30 00:00:00, Test, ?, 2026-05-27 11:27:20, 2026-05-27 11:27:20))