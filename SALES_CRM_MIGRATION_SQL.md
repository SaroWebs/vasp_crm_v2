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
```
