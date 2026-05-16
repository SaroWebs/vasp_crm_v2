-- Create the tmp_db database
CREATE DATABASE IF NOT EXISTS `tmp_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `tmp_db`;

-- Create the punches table
CREATE TABLE IF NOT EXISTS `punches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `EmployeeId` INT NOT NULL,
  `MachineId` INT NULL,
  `PunchTime` DATETIME NOT NULL,
  `Ip` VARCHAR(255) NULL,
  `GroupName` VARCHAR(255) NULL,
  `EmployeeName` VARCHAR(255) NULL,
  `Islive` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_punch` (`EmployeeId`, `PunchTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
