# Sales CRM Migration SQL

Equivalent SQL for the Sales CRM migrations that start with `2026_06_08`.
Phase 5 also adds conversion fields with a `2026_06_09` migration.

Migration files:

- `database/migrations/2026_06_08_171720_create_sales_leads_table.php`
- `database/migrations/2026_06_08_171721_create_sales_lead_activities_table.php`
- `database/migrations/2026_06_09_112309_add_conversion_fields_to_sales_leads_table.php`

## Create `sales_leads`

```sql
CREATE TABLE `sales_leads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `owner_user_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NULL,
    `created_by_user_id` BIGINT UNSIGNED NULL,
    `updated_by_user_id` BIGINT UNSIGNED NULL,
    `organization_name` VARCHAR(255) NOT NULL,
    `organization_type` ENUM('school', 'college', 'business', 'logistics_company', 'other') NOT NULL DEFAULT 'other',
    `contact_person_name` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(30) NULL,
    `contact_email` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `service_notes` TEXT NULL,
    `interest_level` ENUM('negative', 'unclear', 'positive') NOT NULL DEFAULT 'unclear',
    `status` ENUM('new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost') NOT NULL DEFAULT 'new',
    `source` VARCHAR(255) NULL,
    `latest_response` TEXT NULL,
    `last_contacted_at` DATETIME NULL,
    `next_follow_up_at` DATETIME NULL,
    `notes` TEXT NULL,
    `deleted_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `sales_leads_owner_user_id_status_index` (`owner_user_id`, `status`),
    INDEX `sales_leads_interest_level_status_index` (`interest_level`, `status`),
    INDEX `sales_leads_next_follow_up_at_index` (`next_follow_up_at`),
    INDEX `sales_leads_organization_type_index` (`organization_type`),
    CONSTRAINT `sales_leads_owner_user_id_foreign`
        FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT,
    CONSTRAINT `sales_leads_product_id_foreign`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        ON DELETE SET NULL,
    CONSTRAINT `sales_leads_created_by_user_id_foreign`
        FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
        ON DELETE SET NULL,
    CONSTRAINT `sales_leads_updated_by_user_id_foreign`
        FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
        ON DELETE SET NULL
);
```

## Create `sales_lead_activities`

```sql
CREATE TABLE `sales_lead_activities` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sales_lead_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `activity_type` ENUM('call', 'visit', 'meeting', 'whatsapp', 'email', 'note') NOT NULL,
    `outcome_status` ENUM('new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost') NULL,
    `response_text` TEXT NULL,
    `activity_at` DATETIME NOT NULL,
    `next_follow_up_at` DATETIME NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `sales_lead_activities_sales_lead_id_activity_at_index` (`sales_lead_id`, `activity_at`),
    INDEX `sales_lead_activities_user_id_activity_at_index` (`user_id`, `activity_at`),
    INDEX `sales_lead_activities_next_follow_up_at_index` (`next_follow_up_at`),
    CONSTRAINT `sales_lead_activities_sales_lead_id_foreign`
        FOREIGN KEY (`sales_lead_id`) REFERENCES `sales_leads` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `sales_lead_activities_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT
);
```

## Rollback SQL

Drop child tables before parent tables.

```sql
DROP TABLE IF EXISTS `sales_lead_activities`;
DROP TABLE IF EXISTS `sales_leads`;
```

## Phase 5 Conversion Fields

```sql
ALTER TABLE `sales_leads`
    ADD COLUMN `converted_client_id` BIGINT UNSIGNED NULL AFTER `updated_by_user_id`,
    ADD COLUMN `converted_at` TIMESTAMP NULL AFTER `converted_client_id`;

ALTER TABLE `sales_leads`
    ADD INDEX `sales_leads_converted_client_id_foreign` (`converted_client_id`),
    ADD INDEX `sales_leads_converted_at_index` (`converted_at`);

ALTER TABLE `sales_leads`
    ADD CONSTRAINT `sales_leads_converted_client_id_foreign`
        FOREIGN KEY (`converted_client_id`) REFERENCES `clients` (`id`)
        ON DELETE SET NULL;
```

## Phase 5 Rollback SQL

```sql
ALTER TABLE `sales_leads`
    DROP FOREIGN KEY `sales_leads_converted_client_id_foreign`;

ALTER TABLE `sales_leads`
    DROP INDEX `sales_leads_converted_at_index`,
    DROP INDEX `sales_leads_converted_client_id_foreign`;

ALTER TABLE `sales_leads`
    DROP COLUMN `converted_client_id`,
    DROP COLUMN `converted_at`;
----------------------------------------------------------------------------



-- -----------------------------------------------------------------------------
-- STEP 1: Insert new project_phases rows from project_milestones
--         (only where no matching phase already exists by project_id + name + end_date)
-- -----------------------------------------------------------------------------4

INSERT INTO project_phases (
    project_id,
    name,
    description,
    sort_order,
    start_date,
    end_date,
    status,
    progress,
    color,
    settings,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    m.project_id,
    m.name,
    m.description,
    m.sort_order,
 
    -- start_date = previous milestone's target_date (chained), clamped to end_date
    LEAST(
        COALESCE(
            LAG(DATE(m.target_date)) OVER (
                PARTITION BY m.project_id
                ORDER BY m.sort_order, m.target_date
            ),
            p.start_date,
            DATE(m.target_date)
        ),
        DATE(m.target_date)
    ) AS start_date,
 
    DATE(m.target_date) AS end_date,
 
    -- Map milestone status → phase status
    CASE m.status
        WHEN 'in_progress' THEN 'active'
        WHEN 'completed'   THEN 'completed'
        WHEN 'overdue'     THEN 'active'
        ELSE 'pending'
    END AS status,
 
    m.progress,
    NULL AS color,
 
    -- Embed legacy milestone data into settings JSON
    JSON_OBJECT(
        'legacy_project_milestones', JSON_ARRAY(
            JSON_OBJECT(
                'id',             m.id,
                'type',           m.type,
                'target_date',    DATE(m.target_date),
                'completed_date', m.completed_date,
                'status',         m.status,
                'metadata',       IF(m.metadata IS NULL OR m.metadata = '', JSON_OBJECT(), CAST(m.metadata AS JSON))
            )
        )
    ) AS settings,
 
    m.created_at,
    m.updated_at,
    NULL AS deleted_at
 
FROM project_milestones m
JOIN projects p ON p.id = m.project_id
 
-- Only insert rows where no matching phase already exists
WHERE m.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM project_phases pp
      WHERE pp.project_id  = m.project_id
        AND pp.name        = m.name
        AND DATE(pp.end_date) = DATE(m.target_date)
  )
 
ORDER BY m.project_id, m.sort_order, m.target_date;
 
-- -----------------------------------------------------------------------------
-- STEP 2: Merge legacy milestone data into existing matching phases
--         (where project_id + name + end_date already matched a phase)
-- -----------------------------------------------------------------------------

UPDATE project_phases pp
JOIN project_milestones m
    ON  pp.project_id        = m.project_id
    AND pp.name              = m.name
    AND DATE(pp.end_date)    = DATE(m.target_date)
SET pp.settings = JSON_SET(
    COALESCE(pp.settings, '{}'),
    '$.legacy_project_milestones',
    JSON_ARRAY_APPEND(
        COALESCE(
            JSON_EXTRACT(pp.settings, '$.legacy_project_milestones'),
            JSON_ARRAY()
        ),
        '$',
        JSON_OBJECT(
            'id',             m.id,
            'type',           m.type,
            'target_date',    DATE(m.target_date),
            'completed_date', m.completed_date,
            'status',         m.status,
            'metadata',       IF(m.metadata IS NULL OR m.metadata = '', JSON_OBJECT(), CAST(m.metadata AS JSON))
        )
    )
)
WHERE m.deleted_at IS NULL;
 
-- -----------------------------------------------------------------------------
-- STEP 3: Drop the milestones table
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS project_milestones;
 
 
-- -----------------------------------------------------------------------------
-- STEP 4: Copy role_permissions from milestone permission → phase permission
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT
    rp.role_id,
    (SELECT id FROM permissions WHERE slug = 'project.manage_phases' LIMIT 1) AS permission_id,
    rp.created_at,
    rp.updated_at
FROM role_permissions rp
WHERE rp.permission_id = (
    SELECT id FROM permissions WHERE slug = 'project.manage_milestones' LIMIT 1
);
 
 
-- -----------------------------------------------------------------------------
-- STEP 5: Copy user_permissions (granted only) → phase permission
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO user_permissions (user_id, permission_id, granted, created_at, updated_at)
SELECT
    up.user_id,
    (SELECT id FROM permissions WHERE slug = 'project.manage_phases' LIMIT 1),
    'granted',
    up.created_at,
    up.updated_at
FROM user_permissions up
WHERE up.permission_id = (
    SELECT id FROM permissions WHERE slug = 'project.manage_milestones' LIMIT 1
)
  AND up.granted = 'granted';
 
 
-- -----------------------------------------------------------------------------
-- STEP 6: Delete the old milestone permission record
-- -----------------------------------------------------------------------------
DELETE FROM permissions
WHERE slug = 'project.manage_milestones';

```
