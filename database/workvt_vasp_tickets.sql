-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 07, 2026 at 10:08 AM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `workvt_vasp_tickets`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `log_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `causer_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `causer_id` bigint(20) UNSIGNED NOT NULL,
  `properties` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `log_name`, `description`, `subject_type`, `subject_id`, `causer_type`, `causer_id`, `properties`, `created_at`, `updated_at`) VALUES
(4, 'DepartmentUser', 'Assigned to department', 'App\\Models\\DepartmentUser', 11, 'App\\Models\\User', 1, '[]', '2026-04-01 08:36:00', '2026-04-01 08:36:00'),
(5, 'department', 'Department updated', 'App\\Models\\Department', 3, 'App\\Models\\User', 15, '{\"action\": \"update\", \"new_data\": {\"id\": 3, \"name\": \"IT-Support\", \"slug\": \"it-support\", \"color\": \"#10B981\", \"status\": \"active\", \"created_at\": null, \"deleted_at\": null, \"sort_order\": 2, \"updated_at\": \"2026-04-01 16:39:07\", \"description\": \"Customer support and assistance team\"}, \"old_data\": {\"id\": 3, \"name\": \"IT-Support\", \"slug\": \"it-support\", \"color\": \"#10B981\", \"status\": \"active\", \"created_at\": null, \"deleted_at\": null, \"sort_order\": 2, \"updated_at\": \"2026-04-01T11:09:07.000000Z\", \"description\": \"Customer support and assistance team\"}}', '2026-04-01 11:09:07', '2026-04-01 11:09:07'),
(6, 'DepartmentUser', 'Removed from department', 'App\\Models\\DepartmentUser', 11, 'App\\Models\\User', 1, '[]', '2026-04-01 11:29:38', '2026-04-01 11:29:38'),
(7, 'department', 'User removed from department', 'App\\Models\\Department', 4, 'App\\Models\\User', 16, '{\"action\": \"remove_user\", \"user_id\": 15, \"user_name\": \"Neha Bansal\"}', '2026-04-01 11:29:38', '2026-04-01 11:29:38'),
(8, 'DepartmentUser', 'Assigned to department', 'App\\Models\\DepartmentUser', 12, 'App\\Models\\User', 16, '[]', '2026-04-01 11:30:00', '2026-04-01 11:30:00'),
(9, 'DepartmentUser', 'Assigned to department', 'App\\Models\\DepartmentUser', 13, 'App\\Models\\User', 16, '[]', '2026-04-01 11:55:14', '2026-04-01 11:55:14'),
(10, 'DepartmentUser', 'Assigned to department', 'App\\Models\\DepartmentUser', 14, 'App\\Models\\User', 16, '[]', '2026-04-01 11:58:41', '2026-04-01 11:58:41'),
(11, 'DepartmentUser', 'Assigned to department', 'App\\Models\\DepartmentUser', 15, 'App\\Models\\User', 16, '[]', '2026-04-01 12:00:30', '2026-04-01 12:00:30');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('vasp-tickets-cache-17ba0791499db908433b80f37c5fbc89b870084b', 'i:1;', 1774866679),
('vasp-tickets-cache-17ba0791499db908433b80f37c5fbc89b870084b:timer', 'i:1774866679;', 1774866679);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sso_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `sso_secret` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `code`, `address`, `status`, `sso_enabled`, `sso_secret`, `deleted_at`, `created_at`, `updated_at`, `product_id`) VALUES
(1, 'KAMLA WAREHOUSING', 'admin@rsc.com', '9289345410', 'RSCPL', 'Jorhat', 'active', 1, 'eyJpdiI6ImpucGllTWpsdnViZy9rYnJlckRFOXc9PSIsInZhbHVlIjoiL3h2VWpaU0o4aURQbUpGZk1KbW1rQVdINWhBL2o4blZzcWhRM2w1aE5yZ2p3QUI3SWttc21mZUhFekkxS3o4OSIsIm1hYyI6ImUxZDZkMjNiNmIyYzgyNGUxOGM5Mzk3ZmM3MDJiMzUyMjZkOTYzODkyMTZiYWZiMDZkZjVlOGYzNDU0ZDg3ZTQiLCJ0YWciOiIifQ==', NULL, '2026-02-19 05:21:45', '2026-04-01 05:36:05', NULL),
(2, 'ST. FRANCIS DE SALES SCHOOL, GUWAHATI', 'sfs@sfsguwahati.ac.in', '18003453581', '25634', 'Guwahati', 'active', 1, 'eyJpdiI6ImxId2dZT2x1QUh1SUMvR2JEbk11NXc9PSIsInZhbHVlIjoiM3dPbERnVlFkdEdsNlF3RUF4TzRYU2hxcUNCNFVqaG9WVTA2YXB1TnF4Yk5PRTN2cTA0b2NESkZlaVpjS3hvcCIsIm1hYyI6IjRlMTBlM2I4Mzg0OWMyNDRhMDVhY2Q1NTNiZTkzMDA1Nzk5NGMwYjFmMjViMjNjZGE2ZjU5ZTUyOTRkODM3NzkiLCJ0YWciOiIifQ==', NULL, '2026-02-19 05:33:07', '2026-03-26 12:59:01', NULL),
(3, 'HPS', 'admin@hps.com', '8812922333', 'HPS', 'Bharalumukh, Guwahati', 'active', 1, NULL, NULL, '2026-03-02 02:53:28', '2026-03-02 05:25:33', 2),
(4, 'SFS-BURBURIA', 'sfsburburia@gmail.com', '+91 9615837112', 'SFS_BUR', 'Gamaku(PO),Amarpur,Gomati (Dist),Tripura,PIN: 799101', 'active', 1, NULL, NULL, '2026-03-02 05:12:04', '2026-03-02 05:12:04', 1),
(5, 'DBHS-SILAPATHAR', 'donboscoslp@gmail.com', '+91 8638 998477', 'DBHS_SLP', 'Likabali Road, Silapathar – 787059, Dhemaji (DT), Assam.', 'active', 1, NULL, NULL, '2026-03-02 05:59:09', '2026-03-02 05:59:09', 2),
(6, 'MHS-Guwahati', 'modernschool85@gmail.com', '+91 99540-94641', 'MHS_GHY', 'M.T. Road, Geetanagar, Guwahati-781020', 'active', 1, NULL, NULL, '2026-03-02 06:17:28', '2026-03-02 06:17:28', 2),
(7, 'ST.ROSE NURSERY', 'stroseschool1996@gmail.com', '60266 52631', NULL, 'St. Rose School, Narengi, Satgaon, Udayan Vihar, Guwahati - 781171, Assam.', 'active', 0, NULL, NULL, '2026-03-31 07:37:26', '2026-03-31 07:37:26', 1),
(8, 'SFS-DHEMAJI', 'principal@sfsdhemaji.ac.in', '8822134301', NULL, 'St Francis De Sales Sr. Sec. School, Dhemaji, Assam\nPO & Dt. : Dhemaji, Assam 787057', 'active', 0, NULL, NULL, '2026-03-31 07:44:50', '2026-03-31 07:44:50', 1),
(9, 'CKS-GOGAMUKH', 'contact@yourdomain.com', '69019 36685', NULL, 'Christ King Hr. Sec. School ,Gogamukh, Dhemaji Dt, Assam - 787034', 'active', 0, NULL, NULL, '2026-03-31 07:49:18', '2026-03-31 07:49:18', 1),
(10, 'SFS-SILAPATHAR', 'silapatharsfsschool@gmail.com', '7099925807', NULL, 'Silapathar, Dhemaji Dt. Assam', 'active', 0, NULL, NULL, '2026-03-31 07:52:47', '2026-03-31 07:52:47', 1),
(11, 'SFS-TELAM', 'Sfsschooltelam@gmail.com', '8848195857', NULL, 'SFS High School, Telam, Dhemaji Dist. Assam - 787061', 'active', 0, NULL, NULL, '2026-03-31 07:55:30', '2026-03-31 07:55:30', 1),
(12, 'RPS', 'realitypublicschool@gmail.com', '9435293000', NULL, 'The Reality Public School Chandamari - Kokrajhar BTC(ASSAM) - 783370', 'active', 0, NULL, NULL, '2026-03-31 07:58:21', '2026-03-31 07:58:21', 2),
(13, 'ST.XAVIER-MUSHALPUR', 'stxaviershsmushalpur@gmail.com', '8753974775', NULL, 'Barimukh (Mushalpur), Baksha(BTAD), Assam - 781372', 'active', 0, NULL, NULL, '2026-03-31 08:01:06', '2026-03-31 08:01:06', 2),
(14, 'ST.XAVIER-MUSHALPUR', 'stxaviershsmushalpur@gmail.com', '8753974775', NULL, 'Barimukh (Mushalpur), Baksha(BTAD), Assam - 781372', 'active', 0, NULL, NULL, '2026-03-31 08:02:37', '2026-03-31 08:02:37', 1),
(15, 'ST.XAVIER-MUSHALPUR', 'stxaviershsmushalpur@gmail.com', '8753974775', NULL, 'Barimukh (Mushalpur), Baksha(BTAD), Assam - 781372', 'active', 0, NULL, NULL, '2026-03-31 08:45:48', '2026-03-31 08:45:48', 1);

-- --------------------------------------------------------

--
-- Table structure for table `comment_attachments`
--

CREATE TABLE `comment_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `comment_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment_id` bigint(20) UNSIGNED NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_by_type` enum('user','organization_user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#3B82F6',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `slug`, `description`, `color`, `sort_order`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Management', 'management', 'Product management and planning team', '#8B5CF6', 4, 'active', NULL, NULL, NULL),
(2, 'Development', 'development', 'Software development and engineering team', '#3B82F6', 1, 'active', NULL, NULL, NULL),
(3, 'IT-Support', 'it-support', 'Customer support and assistance team', '#10B981', 2, 'active', NULL, '2026-04-01 11:09:07', NULL),
(4, 'HR', 'hr', NULL, '#ff80c0', 0, 'active', '2026-04-01 08:30:32', '2026-04-01 08:30:32', NULL),
(5, 'Sales', 'sales', NULL, '#3B82F6', 0, 'active', '2026-04-01 11:08:43', '2026-04-01 11:08:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `department_users`
--

CREATE TABLE `department_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department_users`
--

INSERT INTO `department_users` (`id`, `department_id`, `user_id`, `assigned_by`, `assigned_at`, `created_at`, `updated_at`) VALUES
(2, 2, 7, 1, '2026-01-27 18:08:21', '2026-01-27 18:08:21', '2026-01-27 18:08:21'),
(3, 2, 8, 1, '2026-01-27 18:08:21', '2026-01-27 18:08:21', '2026-01-27 18:08:21'),
(4, 2, 9, 1, '2026-01-27 18:08:21', '2026-01-27 18:08:21', '2026-01-27 18:08:21'),
(5, 2, 10, 1, '2026-01-27 18:08:21', '2026-01-27 18:08:21', '2026-01-27 18:08:21'),
(6, 2, 11, 1, '2026-01-27 18:08:30', '2026-01-27 18:08:30', '2026-01-27 18:08:30'),
(7, 3, 12, 1, '2026-02-20 02:32:41', '2026-02-20 02:32:41', '2026-02-20 02:32:41'),
(8, 2, 13, 1, '2026-02-20 02:58:17', '2026-02-20 02:58:17', '2026-02-20 02:58:17'),
(9, 2, 14, 1, '2026-03-02 03:10:42', '2026-03-02 03:10:42', '2026-03-02 03:10:42'),
(10, 2, 5, 1, '2026-03-17 09:58:58', '2026-03-17 09:58:58', '2026-03-17 09:58:58'),
(12, 4, 15, 16, '2026-04-01 11:30:00', '2026-04-01 11:30:00', '2026-04-01 11:30:00'),
(13, 2, 17, 16, '2026-04-01 11:55:14', '2026-04-01 11:55:14', '2026-04-01 11:55:14'),
(14, 5, 18, 16, '2026-04-01 11:58:41', '2026-04-01 11:58:41', '2026-04-01 11:58:41'),
(15, 5, 19, 16, '2026-04-01 12:00:30', '2026-04-01 12:00:30', '2026-04-01 12:00:30');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `designation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('active','inactive','on_leave','terminated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `name`, `email`, `phone`, `user_id`, `department_id`, `designation`, `code`, `address`, `date_of_birth`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 'Sarowar Alam', 'sarowar@vasptechnologies.co.in', '8638733589', 5, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-08 13:41:33', '2026-01-08 13:41:33', NULL),
(7, 'Ritupan Deka', 'ritupan@vasptechnologies.co.in', '9401600335', 7, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-09 07:18:21', '2026-01-09 07:18:21', NULL),
(8, 'Md. Shad Alam', 'shad@vasptechnologies.co.in', '7091771277', 8, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-09 09:29:09', '2026-01-09 09:29:09', NULL),
(9, 'Meraj Alam', 'meraj@vasptechnologies.co.in', '9101200063', 9, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-11 07:02:54', '2026-01-11 07:02:54', NULL),
(10, 'Aditya Kumar', 'aditya@vasptechnologies.co.in', '9547401952', 10, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-11 07:14:29', '2026-01-11 07:14:29', NULL),
(11, 'Gautam Das', 'gautamdas@vasptechnologies.com', '7086043203', 11, 2, NULL, NULL, NULL, NULL, 'active', '2026-01-11 07:27:36', '2026-03-26 04:39:47', NULL),
(12, 'Pranadeep Sinha', 'pranadeep@vasptechnologies.co.in', '7099020896', 12, 3, NULL, NULL, NULL, NULL, 'active', '2026-02-20 02:32:41', '2026-03-26 04:38:48', NULL),
(13, 'Badal Sutradhar', 'badal@vasptechnologies.co.in', '7005802715', 13, 2, NULL, NULL, NULL, NULL, 'active', '2026-02-20 02:58:17', '2026-02-23 03:54:09', NULL),
(14, 'Bhanu Pratap Mourya', 'bhanu@vasptechnologies.com', '7086059166', 14, 2, NULL, NULL, NULL, NULL, 'active', '2026-03-02 03:10:42', '2026-03-26 04:41:06', NULL),
(15, 'Neha Bansal', 'neha@vasptechnologies.co.in', '7099020876', 15, 4, NULL, NULL, NULL, NULL, 'active', '2026-04-01 08:36:00', '2026-04-01 08:36:00', NULL),
(16, 'Anurag Maurya', 'anurag@vasptechnologies.co.in', '9569178782', 17, 2, NULL, NULL, NULL, NULL, 'active', '2026-04-01 11:55:14', '2026-04-01 11:55:14', NULL),
(17, 'Harshit Bora', 'harshit@vasptechnologies.co.in', '8638080124', 18, 5, NULL, NULL, NULL, NULL, 'active', '2026-04-01 11:58:41', '2026-04-01 11:58:41', NULL),
(18, 'Khimjali Maibangsa', 'khimjali@vasptechnologies.co.in', '6009818404', 19, 5, NULL, NULL, NULL, NULL, 'active', '2026-04-01 12:00:30', '2026-04-01 12:00:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(2, 'default', '{\"uuid\":\"2deb9746-1bf0-4141-96c1-dd0acadbe63a\",\"displayName\":\"App\\\\Events\\\\TicketCommentCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:31:\\\"App\\\\Events\\\\TicketCommentCreated\\\":1:{s:7:\\\"comment\\\";a:10:{s:2:\\\"id\\\";i:5;s:9:\\\"ticket_id\\\";i:104;s:12:\\\"comment_text\\\";s:3:\\\"Tst\\\";s:17:\\\"commented_by_type\\\";s:17:\\\"organization_user\\\";s:12:\\\"commented_by\\\";i:4;s:11:\\\"is_internal\\\";b:0;s:10:\\\"created_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-24 15:06:30.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:10:\\\"updated_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-24 15:06:30.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:9:\\\"commenter\\\";O:27:\\\"App\\\\Models\\\\OrganizationUser\\\":36:{s:13:\\\"\\u0000*\\u0000connection\\\";s:5:\\\"mysql\\\";s:8:\\\"\\u0000*\\u0000table\\\";s:18:\\\"organization_users\\\";s:13:\\\"\\u0000*\\u0000primaryKey\\\";s:2:\\\"id\\\";s:10:\\\"\\u0000*\\u0000keyType\\\";s:3:\\\"int\\\";s:12:\\\"incrementing\\\";b:1;s:7:\\\"\\u0000*\\u0000with\\\";a:0:{}s:12:\\\"\\u0000*\\u0000withCount\\\";a:0:{}s:19:\\\"preventsLazyLoading\\\";b:0;s:10:\\\"\\u0000*\\u0000perPage\\\";i:15;s:6:\\\"exists\\\";b:1;s:18:\\\"wasRecentlyCreated\\\";b:0;s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;s:13:\\\"\\u0000*\\u0000attributes\\\";a:3:{s:2:\\\"id\\\";i:4;s:4:\\\"name\\\";s:13:\\\"Admin (Kamla)\\\";s:5:\\\"email\\\";s:15:\\\"admin@kamla.com\\\";}s:11:\\\"\\u0000*\\u0000original\\\";a:3:{s:2:\\\"id\\\";i:4;s:4:\\\"name\\\";s:13:\\\"Admin (Kamla)\\\";s:5:\\\"email\\\";s:15:\\\"admin@kamla.com\\\";}s:10:\\\"\\u0000*\\u0000changes\\\";a:0:{}s:11:\\\"\\u0000*\\u0000previous\\\";a:0:{}s:8:\\\"\\u0000*\\u0000casts\\\";a:1:{s:10:\\\"deleted_at\\\";s:8:\\\"datetime\\\";}s:17:\\\"\\u0000*\\u0000classCastCache\\\";a:0:{}s:21:\\\"\\u0000*\\u0000attributeCastCache\\\";a:0:{}s:13:\\\"\\u0000*\\u0000dateFormat\\\";N;s:10:\\\"\\u0000*\\u0000appends\\\";a:0:{}s:19:\\\"\\u0000*\\u0000dispatchesEvents\\\";a:0:{}s:14:\\\"\\u0000*\\u0000observables\\\";a:0:{}s:12:\\\"\\u0000*\\u0000relations\\\";a:0:{}s:10:\\\"\\u0000*\\u0000touches\\\";a:0:{}s:27:\\\"\\u0000*\\u0000relationAutoloadCallback\\\";N;s:26:\\\"\\u0000*\\u0000relationAutoloadContext\\\";N;s:10:\\\"timestamps\\\";b:1;s:13:\\\"usesUniqueIds\\\";b:0;s:9:\\\"\\u0000*\\u0000hidden\\\";a:0:{}s:10:\\\"\\u0000*\\u0000visible\\\";a:0:{}s:11:\\\"\\u0000*\\u0000fillable\\\";a:6:{i:0;s:9:\\\"client_id\\\";i:1;s:4:\\\"name\\\";i:2;s:5:\\\"email\\\";i:3;s:11:\\\"designation\\\";i:4;s:5:\\\"phone\\\";i:5;s:6:\\\"status\\\";}s:10:\\\"\\u0000*\\u0000guarded\\\";a:1:{i:0;s:1:\\\"*\\\";}s:19:\\\"\\u0000*\\u0000authPasswordName\\\";s:8:\\\"password\\\";s:20:\\\"\\u0000*\\u0000rememberTokenName\\\";s:14:\\\"remember_token\\\";s:16:\\\"\\u0000*\\u0000forceDeleting\\\";b:0;}s:11:\\\"attachments\\\";O:39:\\\"Illuminate\\\\Database\\\\Eloquent\\\\Collection\\\":2:{s:8:\\\"\\u0000*\\u0000items\\\";a:0:{}s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774344990,\"delay\":null}', 0, NULL, 1774344990, 1774344990),
(3, 'default', '{\"uuid\":\"89e8769d-c271-434d-8b35-5e7625f00d0b\",\"displayName\":\"App\\\\Events\\\\TicketCommentCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:31:\\\"App\\\\Events\\\\TicketCommentCreated\\\":1:{s:7:\\\"comment\\\";a:10:{s:2:\\\"id\\\";i:6;s:9:\\\"ticket_id\\\";i:104;s:12:\\\"comment_text\\\";s:2:\\\"ok\\\";s:17:\\\"commented_by_type\\\";s:4:\\\"user\\\";s:12:\\\"commented_by\\\";i:1;s:11:\\\"is_internal\\\";b:0;s:10:\\\"created_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-24 15:07:28.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:10:\\\"updated_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-24 15:07:28.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:9:\\\"commenter\\\";O:15:\\\"App\\\\Models\\\\User\\\":35:{s:13:\\\"\\u0000*\\u0000connection\\\";s:5:\\\"mysql\\\";s:8:\\\"\\u0000*\\u0000table\\\";s:5:\\\"users\\\";s:13:\\\"\\u0000*\\u0000primaryKey\\\";s:2:\\\"id\\\";s:10:\\\"\\u0000*\\u0000keyType\\\";s:3:\\\"int\\\";s:12:\\\"incrementing\\\";b:1;s:7:\\\"\\u0000*\\u0000with\\\";a:0:{}s:12:\\\"\\u0000*\\u0000withCount\\\";a:0:{}s:19:\\\"preventsLazyLoading\\\";b:0;s:10:\\\"\\u0000*\\u0000perPage\\\";i:15;s:6:\\\"exists\\\";b:1;s:18:\\\"wasRecentlyCreated\\\";b:0;s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;s:13:\\\"\\u0000*\\u0000attributes\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:11:\\\"\\u0000*\\u0000original\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:10:\\\"\\u0000*\\u0000changes\\\";a:0:{}s:11:\\\"\\u0000*\\u0000previous\\\";a:0:{}s:8:\\\"\\u0000*\\u0000casts\\\";a:3:{s:17:\\\"email_verified_at\\\";s:8:\\\"datetime\\\";s:8:\\\"password\\\";s:6:\\\"hashed\\\";s:23:\\\"two_factor_confirmed_at\\\";s:8:\\\"datetime\\\";}s:17:\\\"\\u0000*\\u0000classCastCache\\\";a:0:{}s:21:\\\"\\u0000*\\u0000attributeCastCache\\\";a:0:{}s:13:\\\"\\u0000*\\u0000dateFormat\\\";N;s:10:\\\"\\u0000*\\u0000appends\\\";a:0:{}s:19:\\\"\\u0000*\\u0000dispatchesEvents\\\";a:0:{}s:14:\\\"\\u0000*\\u0000observables\\\";a:0:{}s:12:\\\"\\u0000*\\u0000relations\\\";a:0:{}s:10:\\\"\\u0000*\\u0000touches\\\";a:0:{}s:27:\\\"\\u0000*\\u0000relationAutoloadCallback\\\";N;s:26:\\\"\\u0000*\\u0000relationAutoloadContext\\\";N;s:10:\\\"timestamps\\\";b:1;s:13:\\\"usesUniqueIds\\\";b:0;s:9:\\\"\\u0000*\\u0000hidden\\\";a:4:{i:0;s:8:\\\"password\\\";i:1;s:17:\\\"two_factor_secret\\\";i:2;s:25:\\\"two_factor_recovery_codes\\\";i:3;s:14:\\\"remember_token\\\";}s:10:\\\"\\u0000*\\u0000visible\\\";a:0:{}s:11:\\\"\\u0000*\\u0000fillable\\\";a:3:{i:0;s:4:\\\"name\\\";i:1;s:5:\\\"email\\\";i:2;s:8:\\\"password\\\";}s:10:\\\"\\u0000*\\u0000guarded\\\";a:1:{i:0;s:1:\\\"*\\\";}s:19:\\\"\\u0000*\\u0000authPasswordName\\\";s:8:\\\"password\\\";s:20:\\\"\\u0000*\\u0000rememberTokenName\\\";s:14:\\\"remember_token\\\";}s:11:\\\"attachments\\\";O:39:\\\"Illuminate\\\\Database\\\\Eloquent\\\\Collection\\\":2:{s:8:\\\"\\u0000*\\u0000items\\\";a:0:{}s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774345048,\"delay\":null}', 0, NULL, 1774345048, 1774345048),
(4, 'default', '{\"uuid\":\"5ac6e600-cfe0-4d8b-8b41-ff147448419f\",\"displayName\":\"App\\\\Events\\\\TicketCommentCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:31:\\\"App\\\\Events\\\\TicketCommentCreated\\\":1:{s:7:\\\"comment\\\";a:10:{s:2:\\\"id\\\";i:7;s:9:\\\"ticket_id\\\";i:6;s:12:\\\"comment_text\\\";s:22:\\\"Please look into this.\\\";s:17:\\\"commented_by_type\\\";s:17:\\\"organization_user\\\";s:12:\\\"commented_by\\\";i:4;s:11:\\\"is_internal\\\";b:0;s:10:\\\"created_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 10:31:48.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:10:\\\"updated_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 10:31:48.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:9:\\\"commenter\\\";O:27:\\\"App\\\\Models\\\\OrganizationUser\\\":36:{s:13:\\\"\\u0000*\\u0000connection\\\";s:5:\\\"mysql\\\";s:8:\\\"\\u0000*\\u0000table\\\";s:18:\\\"organization_users\\\";s:13:\\\"\\u0000*\\u0000primaryKey\\\";s:2:\\\"id\\\";s:10:\\\"\\u0000*\\u0000keyType\\\";s:3:\\\"int\\\";s:12:\\\"incrementing\\\";b:1;s:7:\\\"\\u0000*\\u0000with\\\";a:0:{}s:12:\\\"\\u0000*\\u0000withCount\\\";a:0:{}s:19:\\\"preventsLazyLoading\\\";b:0;s:10:\\\"\\u0000*\\u0000perPage\\\";i:15;s:6:\\\"exists\\\";b:1;s:18:\\\"wasRecentlyCreated\\\";b:0;s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;s:13:\\\"\\u0000*\\u0000attributes\\\";a:3:{s:2:\\\"id\\\";i:4;s:4:\\\"name\\\";s:13:\\\"Admin (Kamla)\\\";s:5:\\\"email\\\";s:15:\\\"admin@kamla.com\\\";}s:11:\\\"\\u0000*\\u0000original\\\";a:3:{s:2:\\\"id\\\";i:4;s:4:\\\"name\\\";s:13:\\\"Admin (Kamla)\\\";s:5:\\\"email\\\";s:15:\\\"admin@kamla.com\\\";}s:10:\\\"\\u0000*\\u0000changes\\\";a:0:{}s:11:\\\"\\u0000*\\u0000previous\\\";a:0:{}s:8:\\\"\\u0000*\\u0000casts\\\";a:1:{s:10:\\\"deleted_at\\\";s:8:\\\"datetime\\\";}s:17:\\\"\\u0000*\\u0000classCastCache\\\";a:0:{}s:21:\\\"\\u0000*\\u0000attributeCastCache\\\";a:0:{}s:13:\\\"\\u0000*\\u0000dateFormat\\\";N;s:10:\\\"\\u0000*\\u0000appends\\\";a:0:{}s:19:\\\"\\u0000*\\u0000dispatchesEvents\\\";a:0:{}s:14:\\\"\\u0000*\\u0000observables\\\";a:0:{}s:12:\\\"\\u0000*\\u0000relations\\\";a:0:{}s:10:\\\"\\u0000*\\u0000touches\\\";a:0:{}s:27:\\\"\\u0000*\\u0000relationAutoloadCallback\\\";N;s:26:\\\"\\u0000*\\u0000relationAutoloadContext\\\";N;s:10:\\\"timestamps\\\";b:1;s:13:\\\"usesUniqueIds\\\";b:0;s:9:\\\"\\u0000*\\u0000hidden\\\";a:0:{}s:10:\\\"\\u0000*\\u0000visible\\\";a:0:{}s:11:\\\"\\u0000*\\u0000fillable\\\";a:6:{i:0;s:9:\\\"client_id\\\";i:1;s:4:\\\"name\\\";i:2;s:5:\\\"email\\\";i:3;s:11:\\\"designation\\\";i:4;s:5:\\\"phone\\\";i:5;s:6:\\\"status\\\";}s:10:\\\"\\u0000*\\u0000guarded\\\";a:1:{i:0;s:1:\\\"*\\\";}s:19:\\\"\\u0000*\\u0000authPasswordName\\\";s:8:\\\"password\\\";s:20:\\\"\\u0000*\\u0000rememberTokenName\\\";s:14:\\\"remember_token\\\";s:16:\\\"\\u0000*\\u0000forceDeleting\\\";b:0;}s:11:\\\"attachments\\\";O:39:\\\"Illuminate\\\\Database\\\\Eloquent\\\\Collection\\\":2:{s:8:\\\"\\u0000*\\u0000items\\\";a:0:{}s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774501308,\"delay\":null}', 0, NULL, 1774501308, 1774501308),
(5, 'default', '{\"uuid\":\"6349566c-2b74-4b2e-9afd-007df31e1474\",\"displayName\":\"App\\\\Events\\\\TicketCommentCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:31:\\\"App\\\\Events\\\\TicketCommentCreated\\\":1:{s:7:\\\"comment\\\";a:10:{s:2:\\\"id\\\";i:8;s:9:\\\"ticket_id\\\";i:6;s:12:\\\"comment_text\\\";s:13:\\\"looking on it\\\";s:17:\\\"commented_by_type\\\";s:4:\\\"user\\\";s:12:\\\"commented_by\\\";i:1;s:11:\\\"is_internal\\\";b:0;s:10:\\\"created_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 12:30:47.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:10:\\\"updated_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 12:30:47.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:9:\\\"commenter\\\";O:15:\\\"App\\\\Models\\\\User\\\":35:{s:13:\\\"\\u0000*\\u0000connection\\\";s:5:\\\"mysql\\\";s:8:\\\"\\u0000*\\u0000table\\\";s:5:\\\"users\\\";s:13:\\\"\\u0000*\\u0000primaryKey\\\";s:2:\\\"id\\\";s:10:\\\"\\u0000*\\u0000keyType\\\";s:3:\\\"int\\\";s:12:\\\"incrementing\\\";b:1;s:7:\\\"\\u0000*\\u0000with\\\";a:0:{}s:12:\\\"\\u0000*\\u0000withCount\\\";a:0:{}s:19:\\\"preventsLazyLoading\\\";b:0;s:10:\\\"\\u0000*\\u0000perPage\\\";i:15;s:6:\\\"exists\\\";b:1;s:18:\\\"wasRecentlyCreated\\\";b:0;s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;s:13:\\\"\\u0000*\\u0000attributes\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:11:\\\"\\u0000*\\u0000original\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:10:\\\"\\u0000*\\u0000changes\\\";a:0:{}s:11:\\\"\\u0000*\\u0000previous\\\";a:0:{}s:8:\\\"\\u0000*\\u0000casts\\\";a:3:{s:17:\\\"email_verified_at\\\";s:8:\\\"datetime\\\";s:8:\\\"password\\\";s:6:\\\"hashed\\\";s:23:\\\"two_factor_confirmed_at\\\";s:8:\\\"datetime\\\";}s:17:\\\"\\u0000*\\u0000classCastCache\\\";a:0:{}s:21:\\\"\\u0000*\\u0000attributeCastCache\\\";a:0:{}s:13:\\\"\\u0000*\\u0000dateFormat\\\";N;s:10:\\\"\\u0000*\\u0000appends\\\";a:0:{}s:19:\\\"\\u0000*\\u0000dispatchesEvents\\\";a:0:{}s:14:\\\"\\u0000*\\u0000observables\\\";a:0:{}s:12:\\\"\\u0000*\\u0000relations\\\";a:0:{}s:10:\\\"\\u0000*\\u0000touches\\\";a:0:{}s:27:\\\"\\u0000*\\u0000relationAutoloadCallback\\\";N;s:26:\\\"\\u0000*\\u0000relationAutoloadContext\\\";N;s:10:\\\"timestamps\\\";b:1;s:13:\\\"usesUniqueIds\\\";b:0;s:9:\\\"\\u0000*\\u0000hidden\\\";a:4:{i:0;s:8:\\\"password\\\";i:1;s:17:\\\"two_factor_secret\\\";i:2;s:25:\\\"two_factor_recovery_codes\\\";i:3;s:14:\\\"remember_token\\\";}s:10:\\\"\\u0000*\\u0000visible\\\";a:0:{}s:11:\\\"\\u0000*\\u0000fillable\\\";a:3:{i:0;s:4:\\\"name\\\";i:1;s:5:\\\"email\\\";i:2;s:8:\\\"password\\\";}s:10:\\\"\\u0000*\\u0000guarded\\\";a:1:{i:0;s:1:\\\"*\\\";}s:19:\\\"\\u0000*\\u0000authPasswordName\\\";s:8:\\\"password\\\";s:20:\\\"\\u0000*\\u0000rememberTokenName\\\";s:14:\\\"remember_token\\\";}s:11:\\\"attachments\\\";O:39:\\\"Illuminate\\\\Database\\\\Eloquent\\\\Collection\\\":2:{s:8:\\\"\\u0000*\\u0000items\\\";a:0:{}s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774508447,\"delay\":null}', 0, NULL, 1774508447, 1774508447),
(6, 'default', '{\"uuid\":\"0d085c79-5c26-454e-92f9-7547d03523b1\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"5f761bd0-ac7e-440f-9222-6105dbe9389e\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:12;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774529998,\"delay\":null}', 0, NULL, 1774529998, 1774529998),
(7, 'default', '{\"uuid\":\"6b3deeb6-9129-4c23-93d3-6b2fb2111b3f\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"eaff8faf-4401-4d3e-8fe3-830c9300210f\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:12;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774530711,\"delay\":null}', 0, NULL, 1774530711, 1774530711),
(8, 'default', '{\"uuid\":\"df21d6cf-9734-4426-9773-e9edfeb1bca3\",\"displayName\":\"App\\\\Events\\\\TicketCommentCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:31:\\\"App\\\\Events\\\\TicketCommentCreated\\\":1:{s:7:\\\"comment\\\";a:10:{s:2:\\\"id\\\";i:9;s:9:\\\"ticket_id\\\";i:8;s:12:\\\"comment_text\\\";s:12:\\\"test message\\\";s:17:\\\"commented_by_type\\\";s:4:\\\"user\\\";s:12:\\\"commented_by\\\";i:1;s:11:\\\"is_internal\\\";b:0;s:10:\\\"created_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 18:44:34.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:10:\\\"updated_at\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-03-26 18:44:34.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:13:\\\"Asia\\/Calcutta\\\";}s:9:\\\"commenter\\\";O:15:\\\"App\\\\Models\\\\User\\\":35:{s:13:\\\"\\u0000*\\u0000connection\\\";s:5:\\\"mysql\\\";s:8:\\\"\\u0000*\\u0000table\\\";s:5:\\\"users\\\";s:13:\\\"\\u0000*\\u0000primaryKey\\\";s:2:\\\"id\\\";s:10:\\\"\\u0000*\\u0000keyType\\\";s:3:\\\"int\\\";s:12:\\\"incrementing\\\";b:1;s:7:\\\"\\u0000*\\u0000with\\\";a:0:{}s:12:\\\"\\u0000*\\u0000withCount\\\";a:0:{}s:19:\\\"preventsLazyLoading\\\";b:0;s:10:\\\"\\u0000*\\u0000perPage\\\";i:15;s:6:\\\"exists\\\";b:1;s:18:\\\"wasRecentlyCreated\\\";b:0;s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;s:13:\\\"\\u0000*\\u0000attributes\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:11:\\\"\\u0000*\\u0000original\\\";a:3:{s:2:\\\"id\\\";i:1;s:4:\\\"name\\\";s:13:\\\"Administrator\\\";s:5:\\\"email\\\";s:17:\\\"admin@example.com\\\";}s:10:\\\"\\u0000*\\u0000changes\\\";a:0:{}s:11:\\\"\\u0000*\\u0000previous\\\";a:0:{}s:8:\\\"\\u0000*\\u0000casts\\\";a:3:{s:17:\\\"email_verified_at\\\";s:8:\\\"datetime\\\";s:8:\\\"password\\\";s:6:\\\"hashed\\\";s:23:\\\"two_factor_confirmed_at\\\";s:8:\\\"datetime\\\";}s:17:\\\"\\u0000*\\u0000classCastCache\\\";a:0:{}s:21:\\\"\\u0000*\\u0000attributeCastCache\\\";a:0:{}s:13:\\\"\\u0000*\\u0000dateFormat\\\";N;s:10:\\\"\\u0000*\\u0000appends\\\";a:0:{}s:19:\\\"\\u0000*\\u0000dispatchesEvents\\\";a:0:{}s:14:\\\"\\u0000*\\u0000observables\\\";a:0:{}s:12:\\\"\\u0000*\\u0000relations\\\";a:0:{}s:10:\\\"\\u0000*\\u0000touches\\\";a:0:{}s:27:\\\"\\u0000*\\u0000relationAutoloadCallback\\\";N;s:26:\\\"\\u0000*\\u0000relationAutoloadContext\\\";N;s:10:\\\"timestamps\\\";b:1;s:13:\\\"usesUniqueIds\\\";b:0;s:9:\\\"\\u0000*\\u0000hidden\\\";a:4:{i:0;s:8:\\\"password\\\";i:1;s:17:\\\"two_factor_secret\\\";i:2;s:25:\\\"two_factor_recovery_codes\\\";i:3;s:14:\\\"remember_token\\\";}s:10:\\\"\\u0000*\\u0000visible\\\";a:0:{}s:11:\\\"\\u0000*\\u0000fillable\\\";a:3:{i:0;s:4:\\\"name\\\";i:1;s:5:\\\"email\\\";i:2;s:8:\\\"password\\\";}s:10:\\\"\\u0000*\\u0000guarded\\\";a:1:{i:0;s:1:\\\"*\\\";}s:19:\\\"\\u0000*\\u0000authPasswordName\\\";s:8:\\\"password\\\";s:20:\\\"\\u0000*\\u0000rememberTokenName\\\";s:14:\\\"remember_token\\\";}s:11:\\\"attachments\\\";O:39:\\\"Illuminate\\\\Database\\\\Eloquent\\\\Collection\\\":2:{s:8:\\\"\\u0000*\\u0000items\\\";a:0:{}s:28:\\\"\\u0000*\\u0000escapeWhenCastingToString\\\";b:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774530874,\"delay\":null}', 0, NULL, 1774530874, 1774530874),
(9, 'default', '{\"uuid\":\"4c1165b5-75df-4f5e-b8ba-4e6cb336e372\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"336eafee-d9af-467d-bb07-58e9593fb723\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:12;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774613648,\"delay\":null}', 0, NULL, 1774613648, 1774613648),
(10, 'default', '{\"uuid\":\"e3230685-5db3-4dc5-8c3c-775b0728f579\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"4d24711d-aa67-475b-a7bf-0cb6c5d95d31\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:12;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1774867006,\"delay\":null}', 0, NULL, 1774867006, 1774867006),
(11, 'default', '{\"uuid\":\"9bee63ca-242f-4bc4-a2a5-bf5f30ef679e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"d065f703-4711-401c-800e-0c9a9f667ca7\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775023868,\"delay\":null}', 0, NULL, 1775023868, 1775023868),
(12, 'default', '{\"uuid\":\"5dccfb31-a73a-4ed9-962f-b55e1a72e095\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"f243ea36-cdcb-4951-a6cf-5d18d4e2852e\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775024283,\"delay\":null}', 0, NULL, 1775024283, 1775024283),
(13, 'default', '{\"uuid\":\"1a4293e3-3d6f-451d-a4ec-9348591e3b7e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"6c2b323f-2ff1-4610-b00c-07e230ae96d0\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775032809,\"delay\":null}', 0, NULL, 1775032809, 1775032809),
(14, 'default', '{\"uuid\":\"c88fa8a6-65b1-464d-a9f6-d1e1343a725e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"79775782-937d-4361-93db-576292f19f30\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775124096,\"delay\":null}', 0, NULL, 1775124096, 1775124096),
(15, 'default', '{\"uuid\":\"27b3aa1a-2d84-4279-b8f3-cd2387adb3f5\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"7e8cda8f-b0c6-4f59-90fd-b73dcdefef89\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775124131,\"delay\":null}', 0, NULL, 1775124131, 1775124131),
(16, 'default', '{\"uuid\":\"173d4f90-254d-4d82-b8ea-241cc94c72c0\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":2:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"c18d6911-a1f1-4d8f-8f52-a5077d305a60\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775125271,\"delay\":null}', 0, NULL, 1775125271, 1775125271),
(17, 'default', '{\"uuid\":\"974cecf9-94b1-4208-ab35-3fca28300799\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"3a2b99c8-5b8f-4ac5-899f-4c80e731b89e\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:13:\\\"39925.5647449\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775125981,\"delay\":null}', 0, NULL, 1775125981, 1775125981),
(18, 'default', '{\"uuid\":\"17761d4f-fc60-4e8f-9eb2-3345f0ee953a\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"56c26c43-eeba-421a-9501-0768ddc7332c\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:13:\\\"40007.3213377\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775126049,\"delay\":null}', 0, NULL, 1775126049, 1775126049),
(19, 'default', '{\"uuid\":\"e0a61037-91e7-4246-b192-acafd0e2d148\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"d19bac8e-f863-474d-9226-52e9e4e53d23\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:13:\\\"39930.5694585\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775128859,\"delay\":null}', 0, NULL, 1775128859, 1775128859),
(20, 'default', '{\"uuid\":\"3fd76b8c-8e32-44d5-a0f3-75a1f41c3176\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"e84dbfc8-9c2a-471e-bac0-717a543bfbd5\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:8;s:6:\\\"socket\\\";s:13:\\\"39865.9464048\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775132140,\"delay\":null}', 0, NULL, 1775132140, 1775132140),
(21, 'default', '{\"uuid\":\"9020151e-1c51-4c96-90eb-2ad2c93f40cf\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"0dd82a43-81f1-43a3-a24c-ec4af5ad5cf5\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:13:\\\"39865.9464637\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775132174,\"delay\":null}', 0, NULL, 1775132174, 1775132174),
(22, 'default', '{\"uuid\":\"a397d615-b438-4f9e-88d2-4a4a2cf57dc1\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"9a80bf4b-85da-4f6b-b165-f41d6a00e7cb\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:17;s:6:\\\"socket\\\";s:13:\\\"40023.2451084\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775133390,\"delay\":null}', 0, NULL, 1775133390, 1775133390),
(23, 'default', '{\"uuid\":\"d528d25e-7265-406d-9824-c0db433db78e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"9c24650b-51a5-4840-9e66-f1cbbf5c7800\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:13:\\\"39968.3584902\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775133720,\"delay\":null}', 0, NULL, 1775133720, 1775133720),
(24, 'default', '{\"uuid\":\"d515b2ae-02f3-4d99-a9fd-cdb24857997b\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"bca5d2d8-9bc5-4ab5-942c-33c4a261f2c7\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:12:\\\"40503.257127\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775193813,\"delay\":null}', 0, NULL, 1775193813, 1775193813),
(25, 'default', '{\"uuid\":\"c5314db1-ffa6-4146-a3d0-8e5f84b6629b\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"a6bdc2ae-91d2-4ff8-8d84-bf8b2495b7f9\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;s:6:\\\"socket\\\";s:12:\\\"40510.263292\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775194526,\"delay\":null}', 0, NULL, 1775194526, 1775194526),
(26, 'default', '{\"uuid\":\"422f99e2-c0db-43b8-a194-fd67a403e922\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"10be77d3-690f-4280-87b8-c870bc31381e\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:8;s:6:\\\"socket\\\";s:12:\\\"40414.321649\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775204776,\"delay\":null}', 0, NULL, 1775204776, 1775204776);
INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(27, 'default', '{\"uuid\":\"317167e4-bc07-430f-b1b7-03258d959575\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"a4a34a5f-2e1f-47f3-b327-b9622d6cb3d0\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:8;s:6:\\\"socket\\\";s:12:\\\"40434.328337\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775204887,\"delay\":null}', 0, NULL, 1775204887, 1775204887),
(28, 'default', '{\"uuid\":\"c4d4d22c-2bd3-499c-8b2e-e4e9430ff56c\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"56a88a48-a8db-48df-80e0-353214695674\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:12:\\\"40470.335545\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775206636,\"delay\":null}', 0, NULL, 1775206636, 1775206636),
(29, 'default', '{\"uuid\":\"7c5dd4c9-a496-4557-a0f9-aee0e3c0fdbe\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"c1cd58cb-81f9-460b-86ff-3f2a2f2c14ec\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:12:\\\"40446.360086\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775211007,\"delay\":null}', 0, NULL, 1775211007, 1775211007),
(30, 'default', '{\"uuid\":\"484d9580-53f8-42ff-adb5-ba3b57e4dc0e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"4f92db9e-9e5d-4002-8629-61e2c87f41cd\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:12:\\\"40499.372081\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775212176,\"delay\":null}', 0, NULL, 1775212176, 1775212176),
(31, 'default', '{\"uuid\":\"1a98558e-0966-4aeb-8bfc-e31e85662b2f\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"328b1717-ec1a-45a7-90a4-34d17489e83e\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:7;s:6:\\\"socket\\\";s:12:\\\"40628.444371\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775276222,\"delay\":null}', 0, NULL, 1775276222, 1775276222),
(32, 'default', '{\"uuid\":\"707224e5-4919-4a96-a545-28f3e318cfd2\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"53b22fc8-5a76-43e5-b234-320bca0fc056\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:5;s:6:\\\"socket\\\";s:12:\\\"40628.444371\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775276244,\"delay\":null}', 0, NULL, 1775276244, 1775276244),
(33, 'default', '{\"uuid\":\"97087c5f-f671-4a8f-8031-eb6635b2a40f\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"74ed8677-6559-4584-8e7d-1a15c365a234\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;s:6:\\\"socket\\\";s:12:\\\"40560.681503\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775276476,\"delay\":null}', 0, NULL, 1775276476, 1775276476),
(34, 'default', '{\"uuid\":\"f0992dbf-3b67-4a7b-9850-a01ecdccf771\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"ef518f06-7053-4fd7-a1a6-8637539834cb\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:12:\\\"40620.528304\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775276721,\"delay\":null}', 0, NULL, 1775276721, 1775276721),
(35, 'default', '{\"uuid\":\"ac35baae-7fc2-4373-8a74-6815d11c981b\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"9fcea4cf-62be-48b1-a28e-6abde4d0ef77\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:12:\\\"40594.712229\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775277317,\"delay\":null}', 0, NULL, 1775277317, 1775277317),
(36, 'default', '{\"uuid\":\"53659862-b4a1-4dd1-9e98-ea8bc2dee1c2\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"47d7b6c9-8750-412d-ba87-0acd9da244ca\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40400.1477820\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775444537,\"delay\":null}', 0, NULL, 1775444537, 1775444537),
(37, 'default', '{\"uuid\":\"fa504166-8e26-4445-8e04-467d9741326b\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"c75c2169-604f-47ce-8009-86269d738294\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40637.1151815\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775447119,\"delay\":null}', 0, NULL, 1775447119, 1775447119),
(38, 'default', '{\"uuid\":\"87874ea3-7c78-4460-91ad-e57587a6cbfd\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"99f20cb4-3a87-4c27-9556-282160f36f9b\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;s:6:\\\"socket\\\";s:13:\\\"40482.1583692\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775458524,\"delay\":null}', 0, NULL, 1775458524, 1775458524),
(39, 'default', '{\"uuid\":\"c815d8b1-a237-4918-810d-571e53df12ea\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"9dd97cab-98dd-478b-8f8f-0e715ea3dc0b\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40582.1658785\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775473379,\"delay\":null}', 0, NULL, 1775473379, 1775473379),
(40, 'default', '{\"uuid\":\"0944d99d-60f9-4e2a-a955-ad86cffaec69\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"b515e66a-9793-46b5-b9b6-976732051730\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40615.1597750\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775473433,\"delay\":null}', 0, NULL, 1775473433, 1775473433),
(41, 'default', '{\"uuid\":\"9f500795-bf15-42b8-926f-e8187d9c80d4\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"ee48f604-fcdb-459a-952a-05356a5cd389\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40615.1597750\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775474263,\"delay\":null}', 0, NULL, 1775474263, 1775474263),
(42, 'default', '{\"uuid\":\"b15baff3-51a6-4be5-ae5b-645662dcb8f1\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"9fa78ed0-983a-4d32-9af8-2e05cfeffc52\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:11;s:6:\\\"socket\\\";s:13:\\\"40504.1711080\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775475486,\"delay\":null}', 0, NULL, 1775475486, 1775475486),
(43, 'default', '{\"uuid\":\"39ae326f-3664-4f94-8b2a-62ced62a2c1e\",\"displayName\":\"App\\\\Events\\\\NotificationEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\NotificationEvent\\\":3:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";s:36:\\\"28383d35-5c92-474e-8019-aa2bccef2118\\\";s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:6:\\\"userId\\\";i:14;s:6:\\\"socket\\\";s:13:\\\"40497.1978523\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775529832,\"delay\":null}', 0, NULL, 1775529832, 1775529832);

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_roles_table', 1),
(2, '0001_01_01_000000_create_users_table', 1),
(3, '0001_01_01_000001_create_cache_table', 1),
(4, '0001_01_01_000001_create_role_user_table', 1),
(5, '0001_01_01_000002_create_jobs_table', 1),
(6, '2025_08_26_100418_add_two_factor_columns_to_users_table', 1),
(7, '2025_10_18_060310_create_task_types_table', 1),
(8, '2025_10_18_060412_create_sla_policies_table', 1),
(9, '2025_11_15_074000_create_clients_table', 1),
(10, '2025_11_15_074001_create_organization_users_table', 1),
(11, '2025_11_15_074004_create_products_table', 1),
(12, '2025_11_15_075004_create_departments_table', 1),
(13, '2025_11_15_075334_create_tickets_table', 1),
(14, '2025_11_15_075714_create_ticket_attachments_table', 1),
(15, '2025_11_15_080300_create_projects_table', 1),
(16, '2025_11_15_080300_create_ticket_comments_table', 1),
(17, '2025_11_15_080301_create_project_teams_table', 1),
(18, '2025_11_15_080553_create_tasks_table', 1),
(19, '2025_11_15_081131_create_task_forwardings_table', 1),
(20, '2025_11_15_081411_create_task_attachments_table', 1),
(21, '2025_11_15_081750_create_task_comments_table', 1),
(22, '2025_11_15_081923_create_activity_logs_table', 1),
(23, '2025_11_15_082112_create_notifications_table', 1),
(24, '2025_11_15_082409_create_ticket_histories_table', 1),
(25, '2025_11_15_082516_create_task_histories_table', 1),
(26, '2025_11_15_090102_create_department_users_table', 1),
(27, '2025_11_24_070000_create_permissions_table', 1),
(28, '2025_11_24_070010_create_role_permissions_table', 1),
(29, '2025_11_26_103443_create_employees_table', 1),
(30, '2025_11_28_071200_create_user_permissions_table', 1),
(31, '2025_12_12_074030_create_comment_attachments_table', 1),
(32, '2025_12_18_060500_create_task_audit_events_table', 1),
(33, '2025_12_18_060624_create_workload_metrics_table', 1),
(34, '2025_12_18_060744_create_user_skills_table', 1),
(35, '2025_12_18_060745_add_indexing_fields', 1),
(36, '2025_12_24_072724_create_users_notifications_table', 1),
(37, '2025_12_31_000000_create_timeline_events_table', 1),
(38, '2025_12_31_000001_create_task_dependencies_table', 1),
(39, '2025_12_31_080000_create_task_time_entries_table', 1),
(40, '2026_01_12_000001_create_task_assignments_table', 1),
(41, '2026_01_19_000001_create_timeline_event_attachments_table', 1),
(42, '2026_01_20_000000_create_reports_table', 1),
(43, '2026_01_20_000001_create_report_tasks_table', 1),
(44, '2026_01_20_000002_create_report_attachments_table', 1),
(45, '2026_01_20_053931_create_task_comment_attachments_table', 1),
(46, '2026_02_18_000001_add_milestone_columns_to_timeline_events_table', 1),
(47, '2026_02_24_000001_modify_projects_table', 1),
(48, '2026_02_24_000002_create_project_milestones_table', 1),
(49, '2026_02_24_000003_create_project_phases_table', 1),
(50, '2026_02_24_000004_create_project_timeline_events_table', 1),
(51, '2026_02_24_000005_create_project_attachments_table', 1),
(52, '2026_02_24_000006_add_phase_id_to_tasks_table', 1),
(53, '2026_03_06_000007_create_role_menu_items_table', 1),
(54, '2026_03_17_000003_add_product_id_to_clients_table', 2),
(55, '2026_03_18_113925_add_sso_fields_to_clients_table', 3),
(56, '2026_03_18_113938_add_unique_client_id_email_index_to_organization_users_table', 3),
(57, '2026_03_18_113955_create_sso_login_tokens_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint(20) UNSIGNED NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `delivery_channel` enum('pusher','whatsapp','sms','email','database') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'database' COMMENT 'The channel used to deliver this notification',
  `delivered` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether notification was delivered via external channel',
  `delivered_at` timestamp NULL DEFAULT NULL COMMENT 'When notification was delivered via external channel',
  `delivery_response` text COLLATE utf8mb4_unicode_ci COMMENT 'Response from external delivery API',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`, `delivery_channel`, `delivered`, `delivered_at`, `delivery_response`, `created_at`, `updated_at`) VALUES
('10be77d3-690f-4280-87b8-c870bc31381e', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 8, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Mirai admission issue. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/318\",\"task_id\":318,\"task_title\":\"Mirai admission issue\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-03 08:26:16', NULL, '2026-04-03 08:26:16', '2026-04-03 08:26:16'),
('28383d35-5c92-474e-8019-aa2bccef2118', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Unable add the student ~Burburia. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/391\",\"task_id\":391,\"task_title\":\"Unable add the student ~Burburia\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-07 02:43:52', NULL, '2026-04-07 02:43:52', '2026-04-07 02:43:52'),
('328b1717-ec1a-45a7-90a4-34d17489e83e', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 7, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Parish Management System. Assigned by: Badal. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/334\",\"task_id\":334,\"task_title\":\"Parish Management System\",\"assigned_by_id\":13,\"assigned_by_name\":\"Badal\"}', NULL, 'pusher', 1, '2026-04-04 04:17:02', NULL, '2026-04-04 04:17:02', '2026-04-04 04:17:02'),
('47d7b6c9-8750-412d-ba87-0acd9da244ca', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Leave Configuration ~Gogamukh. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/358\",\"task_id\":358,\"task_title\":\"Leave Configuration ~Gogamukh\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 03:02:17', NULL, '2026-04-06 03:02:17', '2026-04-06 03:02:17'),
('4f92db9e-9e5d-4002-8629-61e2c87f41cd', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 5, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: RSCPL-Report Data Load issue. Assigned by: Superadmin. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/309\",\"task_id\":309,\"task_title\":\"RSCPL-Report Data Load issue\",\"assigned_by_id\":16,\"assigned_by_name\":\"Superadmin\"}', '2026-04-03 11:50:37', 'pusher', 1, '2026-04-03 10:29:36', NULL, '2026-04-03 10:29:36', '2026-04-03 11:50:37'),
('53b22fc8-5a76-43e5-b234-320bca0fc056', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 5, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Parish Management System. Assigned by: Badal. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/334\",\"task_id\":334,\"task_title\":\"Parish Management System\",\"assigned_by_id\":13,\"assigned_by_name\":\"Badal\"}', '2026-04-04 09:05:35', 'pusher', 1, '2026-04-04 04:17:24', NULL, '2026-04-04 04:17:24', '2026-04-04 09:05:35'),
('56a88a48-a8db-48df-80e0-353214695674', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: MHS CONVERION TO PREMIUM. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/320\",\"task_id\":320,\"task_title\":\"MHS CONVERION TO PREMIUM\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-03 08:57:16', NULL, '2026-04-03 08:57:16', '2026-04-03 08:57:16'),
('6c2b323f-2ff1-4610-b00c-07e230ae96d0', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: HPS Appointment Letter. Assigned by: Administrator. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/277\",\"task_id\":277,\"task_title\":\"HPS Appointment Letter\",\"assigned_by_id\":1,\"assigned_by_name\":\"Administrator\"}', '2026-04-04 08:33:18', 'pusher', 1, '2026-04-01 08:40:09', NULL, '2026-04-01 08:40:09', '2026-04-04 08:33:18'),
('74ed8677-6559-4584-8e7d-1a15c365a234', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Transfer the Time-table data ~Gogamukh. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/337\",\"task_id\":337,\"task_title\":\"Transfer the Time-table data ~Gogamukh\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', '2026-04-04 08:33:04', 'pusher', 1, '2026-04-04 04:21:16', NULL, '2026-04-04 04:21:16', '2026-04-04 08:33:04'),
('79775782-937d-4361-93db-576292f19f30', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Admission Form. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/290\",\"task_id\":290,\"task_title\":\"Admission Form\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-02 10:01:35', NULL, '2026-04-02 10:01:35', '2026-04-02 10:01:35'),
('7e8cda8f-b0c6-4f59-90fd-b73dcdefef89', 'App\\Notifications\\TaskCommentNotification', 'App\\Models\\User', 14, '{\"title\":\"New Comment on Task\",\"message\":\"Pranadeep Sinha commented on task \'Admission Form\'\",\"task_id\":290,\"task_title\":\"Admission Form\",\"comment_id\":16,\"comment_text\":\"Please Look into the screenshot\",\"commented_by_id\":12,\"commented_by_name\":\"Pranadeep Sinha\"}', NULL, 'database', 0, NULL, NULL, '2026-04-02 10:02:11', '2026-04-02 10:02:11'),
('99f20cb4-3a87-4c27-9556-282160f36f9b', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Time-Table\\/Time Slot ~ MHS. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/372\",\"task_id\":372,\"task_title\":\"Time-Table\\/Time Slot ~ MHS\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 06:55:23', NULL, '2026-04-06 06:55:23', '2026-04-06 06:55:23'),
('9a80bf4b-85da-4f6b-b165-f41d6a00e7cb', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 17, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: another test with whatsapp. Assigned by: Superadmin. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/305\",\"task_id\":305,\"task_title\":\"another test with whatsapp\",\"assigned_by_id\":16,\"assigned_by_name\":\"Superadmin\"}', NULL, 'pusher', 1, '2026-04-02 12:36:30', NULL, '2026-04-02 12:36:30', '2026-04-02 12:36:30'),
('9c24650b-51a5-4840-9e66-f1cbbf5c7800', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 5, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: another test with whatsapp. Assigned by: Superadmin. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/305\",\"task_id\":305,\"task_title\":\"another test with whatsapp\",\"assigned_by_id\":16,\"assigned_by_name\":\"Superadmin\"}', '2026-04-03 10:26:26', 'pusher', 1, '2026-04-02 12:42:00', NULL, '2026-04-02 12:42:00', '2026-04-03 10:26:26'),
('9dd97cab-98dd-478b-8f8f-0e715ea3dc0b', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Double Name issue ~HPSB. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/380\",\"task_id\":380,\"task_title\":\"Double Name issue ~HPSB\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 11:02:59', NULL, '2026-04-06 11:02:59', '2026-04-06 11:02:59'),
('9fa78ed0-983a-4d32-9af8-2e05cfeffc52', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Holychild App Need to Live. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/385\",\"task_id\":385,\"task_title\":\"Holychild App Need to Live\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 11:38:06', NULL, '2026-04-06 11:38:06', '2026-04-06 11:38:06'),
('9fcea4cf-62be-48b1-a28e-6abde4d0ef77', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Remove of  CBSE FORMATE. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/342\",\"task_id\":342,\"task_title\":\"Remove of  CBSE FORMATE\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-04 04:35:17', NULL, '2026-04-04 04:35:17', '2026-04-04 04:35:17'),
('a4a34a5f-2e1f-47f3-b327-b9622d6cb3d0', 'App\\Notifications\\TaskCommentNotification', 'App\\Models\\User', 8, '{\"title\":\"New Comment on Task\",\"message\":\"Pranadeep Sinha commented on task \'Mirai admission issue\'\",\"task_id\":318,\"task_title\":\"Mirai admission issue\",\"comment_id\":17,\"comment_text\":\"Please look into the attached screenshot\",\"commented_by_id\":12,\"commented_by_name\":\"Pranadeep Sinha\"}', NULL, 'database', 0, NULL, NULL, '2026-04-03 08:28:07', '2026-04-03 08:28:07'),
('a6bdc2ae-91d2-4ff8-8d84-bf8b2495b7f9', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: HPS Data Transfer. Assigned by: Administrator. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/313\",\"task_id\":313,\"task_title\":\"HPS Data Transfer\",\"assigned_by_id\":1,\"assigned_by_name\":\"Administrator\"}', '2026-04-04 08:33:15', 'pusher', 1, '2026-04-03 05:35:26', NULL, '2026-04-03 05:35:26', '2026-04-04 08:33:15'),
('b515e66a-9793-46b5-b9b6-976732051730', 'App\\Notifications\\TaskCommentNotification', 'App\\Models\\User', 14, '{\"title\":\"New Comment on Task\",\"message\":\"Pranadeep Sinha commented on task \'Double Name issue ~HPSB\'\",\"task_id\":380,\"task_title\":\"Double Name issue ~HPSB\",\"comment_id\":19,\"comment_text\":\"Sir it also create loading issue while collecting Fee\",\"commented_by_id\":12,\"commented_by_name\":\"Pranadeep Sinha\"}', NULL, 'database', 0, NULL, NULL, '2026-04-06 11:03:53', '2026-04-06 11:03:53'),
('bca5d2d8-9bc5-4ab5-942c-33c4a261f2c7', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Admission Form~Burburia. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/311\",\"task_id\":311,\"task_title\":\"Admission Form~Burburia\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-03 05:23:33', NULL, '2026-04-03 05:23:33', '2026-04-03 05:23:33'),
('c1cd58cb-81f9-460b-86ff-3f2a2f2c14ec', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Chapter plan\\/lesson plan\\/reflection ~ HPSG And HPSB. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/322\",\"task_id\":322,\"task_title\":\"Chapter plan\\/lesson plan\\/reflection ~ HPSG And HPSB\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-03 10:10:07', NULL, '2026-04-03 10:10:07', '2026-04-03 10:10:07'),
('c75c2169-604f-47ce-8009-86269d738294', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: WHATSAPP PORTAL ~ Social.ednect. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/359\",\"task_id\":359,\"task_title\":\"WHATSAPP PORTAL ~ Social.ednect\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 03:45:19', NULL, '2026-04-06 03:45:19', '2026-04-06 03:45:19'),
('d065f703-4711-401c-800e-0c9a9f667ca7', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 11, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Manikbond Data Transfer. Assigned by: Administrator. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/275\",\"task_id\":275,\"task_title\":\"Manikbond Data Transfer\",\"assigned_by_id\":1,\"assigned_by_name\":\"Administrator\"}', '2026-04-04 08:33:24', 'pusher', 1, '2026-04-01 06:11:07', NULL, '2026-04-01 06:11:07', '2026-04-04 08:33:24'),
('e84dbfc8-9c2a-471e-bac0-717a543bfbd5', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 8, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: final test for whatapp. Assigned by: Superadmin. View: https:\\/\\/work.vasptechnologies.com\\/my\\/tasks\\/304\",\"task_id\":304,\"task_title\":\"final test for whatapp\",\"assigned_by_id\":16,\"assigned_by_name\":\"Superadmin\"}', NULL, 'pusher', 1, '2026-04-02 12:15:40', NULL, '2026-04-02 12:15:40', '2026-04-02 12:15:40'),
('ee48f604-fcdb-459a-952a-05356a5cd389', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: Leave Count Issue ~Dhemaji. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/383\",\"task_id\":383,\"task_title\":\"Leave Count Issue ~Dhemaji\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-06 11:17:43', NULL, '2026-04-06 11:17:43', '2026-04-06 11:17:43'),
('ef518f06-7053-4fd7-a1a6-8637539834cb', 'App\\Notifications\\TaskAssignedNotification', 'App\\Models\\User', 14, '{\"title\":\"New Task Assigned\",\"message\":\"You have been assigned to task: ID Cards Design ~ Holly Child. Assigned by: Pranadeep Sinha. View: https:\\/\\/work.vasptechnologies.com\\/admin\\/tasks\\/341\",\"task_id\":341,\"task_title\":\"ID Cards Design ~ Holly Child\",\"assigned_by_id\":12,\"assigned_by_name\":\"Pranadeep Sinha\"}', NULL, 'pusher', 1, '2026-04-04 04:25:21', NULL, '2026-04-04 04:25:21', '2026-04-04 04:25:21');

-- --------------------------------------------------------

--
-- Table structure for table `organization_users`
--

CREATE TABLE `organization_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organization_users`
--

INSERT INTO `organization_users` (`id`, `client_id`, `name`, `email`, `designation`, `phone`, `status`, `deleted_at`, `created_at`, `updated_at`) VALUES
(4, 1, 'Admin (Kamla)', 'admin@kamla.com', NULL, NULL, 'active', NULL, '2026-03-24 09:11:23', '2026-03-24 09:11:23'),
(5, 1, 'Admin (Sambalpur)', 'admin@rscpl-sam.com', NULL, NULL, 'active', NULL, '2026-03-24 10:45:34', '2026-03-24 10:45:34'),
(6, 2, '1027', 'test@gmail.com', NULL, '999999999999', 'active', NULL, '2026-03-26 12:59:01', '2026-04-01 08:28:39'),
(7, 1, 'Admin (Mamta)', 'admin@mamta.com', NULL, NULL, 'active', NULL, '2026-03-30 10:35:23', '2026-03-30 10:35:23'),
(8, 3, 'HPSG', 'info@heritagepublicschool.edu.in', NULL, NULL, 'active', NULL, '2026-03-31 07:18:05', '2026-03-31 07:18:05'),
(9, 3, 'HPSB', 'info2@heritagepublicschool.edu.in', NULL, NULL, 'active', NULL, '2026-03-31 07:19:34', '2026-03-31 07:19:34');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `slug`, `module`, `action`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Activitylog Create', 'activity.create', 'activity', 'create', 'Create new activity log', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(2, 'Activitylog Read', 'activity.read', 'activity', 'read', 'View activity log', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(3, 'Activitylog Update', 'activity.update', 'activity', 'update', 'Update activity log', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(4, 'Activitylog Delete', 'activity.delete', 'activity', 'delete', 'Delete activity log', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(5, 'Activitylog View All', 'activity.view_all', 'activity', 'view_all', 'View all activity logs', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(6, 'Activitylog View Own', 'activity.view_own', 'activity', 'view_own', 'View own activity log', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(7, 'Client.Create', 'client.create', 'client', 'create', 'Create new clients', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(8, 'Client.Read', 'client.read', 'client', 'read', 'View clients', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(9, 'Client.Update', 'client.update', 'client', 'update', 'Update clients', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(10, 'Client.Delete', 'client.delete', 'client', 'delete', 'Delete clients', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(11, 'Client View All', 'client.view_all', 'client', 'view_all', 'View all clients', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(12, 'Client View Own', 'client.view_own', 'client', 'view_own', 'View own client', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(13, 'Commentattachment Create', 'comment_attachments.create', 'comment_attachments', 'create', 'Create new comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(14, 'Commentattachment Read', 'comment_attachments.read', 'comment_attachments', 'read', 'View comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(15, 'Commentattachment Update', 'comment_attachments.update', 'comment_attachments', 'update', 'Update comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(16, 'Comment_Attachments Delete', 'comment_attachments.delete', 'comment_attachments', 'delete', 'Delete comment attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(17, 'Commentattachment View All', 'comment_attachments.view_all', 'comment_attachments', 'view_all', 'View all comment attachments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(18, 'Commentattachment View Own', 'comment_attachments.view_own', 'comment_attachments', 'view_own', 'View own comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(19, 'Department.Create', 'department.create', 'department', 'create', 'Create new departments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(20, 'Department.Read', 'department.read', 'department', 'read', 'View departments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(21, 'Department.Update', 'department.update', 'department', 'update', 'Update departments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(22, 'Department.Delete', 'department.delete', 'department', 'delete', 'Delete departments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(23, 'Department View All', 'department.view_all', 'department', 'view_all', 'View all departments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(24, 'Department View Own', 'department.view_own', 'department', 'view_own', 'View own department', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(25, 'Departmentuser Create', 'department_users.create', 'department_users', 'create', 'Create new department user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(26, 'Departmentuser Read', 'department_users.read', 'department_users', 'read', 'View department user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(27, 'Departmentuser Update', 'department_users.update', 'department_users', 'update', 'Update department user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(28, 'Departmentuser Delete', 'department_users.delete', 'department_users', 'delete', 'Delete department user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(29, 'Departmentuser View All', 'department_users.view_all', 'department_users', 'view_all', 'View all department users', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(30, 'Departmentuser View Own', 'department_users.view_own', 'department_users', 'view_own', 'View own department user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(31, 'Employee.Create', 'employee.create', 'employee', 'create', 'Create new employees', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(32, 'Employee.Read', 'employee.read', 'employee', 'read', 'View employees', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(33, 'Employee.Update', 'employee.update', 'employee', 'update', 'Update employees', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(34, 'Employee.Delete', 'employee.delete', 'employee', 'delete', 'Delete employees', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(35, 'Employee View All', 'employee.view_all', 'employee', 'view_all', 'View all employees', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(36, 'Employee View Own', 'employee.view_own', 'employee', 'view_own', 'View own employee', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(37, 'Notification Create', 'notification.create', 'notification', 'create', 'Create new notification', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(38, 'Notification.Read', 'notification.read', 'notification', 'read', 'View notifications', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(39, 'Notification.Update', 'notification.update', 'notification', 'update', 'Update notifications', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(40, 'Notification.Delete', 'notification.delete', 'notification', 'delete', 'Delete notifications', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(41, 'Notification View All', 'notification.view_all', 'notification', 'view_all', 'View all notifications', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(42, 'Notification View Own', 'notification.view_own', 'notification', 'view_own', 'View own notification', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(43, 'Organizationuser Create', 'organization_users.create', 'organization_users', 'create', 'Create new organization user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(44, 'Organizationuser Read', 'organization_users.read', 'organization_users', 'read', 'View organization user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(45, 'Organizationuser Update', 'organization_users.update', 'organization_users', 'update', 'Update organization user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(46, 'Organizationuser Delete', 'organization_users.delete', 'organization_users', 'delete', 'Delete organization user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(47, 'Organizationuser View All', 'organization_users.view_all', 'organization_users', 'view_all', 'View all organization users', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(48, 'Organizationuser View Own', 'organization_users.view_own', 'organization_users', 'view_own', 'View own organization user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(49, 'Permission Create', 'permission.create', 'permission', 'create', 'Create new permission', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(50, 'Permission Read', 'permission.read', 'permission', 'read', 'View permission', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(51, 'Permission Update', 'permission.update', 'permission', 'update', 'Update permission', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(52, 'Permission Delete', 'permission.delete', 'permission', 'delete', 'Delete permission', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(53, 'Permission View All', 'permission.view_all', 'permission', 'view_all', 'View all permissions', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(54, 'Permission View Own', 'permission.view_own', 'permission', 'view_own', 'View own permission', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(55, 'Product.Create', 'product.create', 'product', 'create', 'Create new products', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(56, 'Product.Read', 'product.read', 'product', 'read', 'View products', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(57, 'Product.Update', 'product.update', 'product', 'update', 'Update products', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(58, 'Product.Delete', 'product.delete', 'product', 'delete', 'Delete products', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(59, 'Product View All', 'product.view_all', 'product', 'view_all', 'View all products', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(60, 'Product View Own', 'product.view_own', 'product', 'view_own', 'View own product', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(61, 'Project.Create', 'project.create', 'project', 'create', 'Create new projects', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(62, 'Project.Read', 'project.read', 'project', 'read', 'View projects', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(63, 'Project.Update', 'project.update', 'project', 'update', 'Update projects', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(64, 'Project.Delete', 'project.delete', 'project', 'delete', 'Delete projects', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(65, 'Project View All', 'project.view_all', 'project', 'view_all', 'View all projects', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(66, 'Project View Own', 'project.view_own', 'project', 'view_own', 'View own project', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(67, 'Project_Attachments Create', 'project_attachments.create', 'project_attachments', 'create', 'Create new project attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(68, 'Project_Attachments Read', 'project_attachments.read', 'project_attachments', 'read', 'View project attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(69, 'Project_Attachments Update', 'project_attachments.update', 'project_attachments', 'update', 'Update project attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(70, 'Project_Attachments Delete', 'project_attachments.delete', 'project_attachments', 'delete', 'Delete project attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(71, 'Project_Attachments View All', 'project_attachments.view_all', 'project_attachments', 'view_all', 'View all project attachments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(72, 'Projectattachment View Own', 'project_attachments.view_own', 'project_attachments', 'view_own', 'View own project attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(73, 'Project_Milestones Create', 'project_milestones.create', 'project_milestones', 'create', 'Create new project milestone', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(74, 'Project_Milestones Read', 'project_milestones.read', 'project_milestones', 'read', 'View project milestone', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(75, 'Project_Milestones Update', 'project_milestones.update', 'project_milestones', 'update', 'Update project milestone', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(76, 'Project_Milestones Delete', 'project_milestones.delete', 'project_milestones', 'delete', 'Delete project milestone', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(77, 'Project_Milestones View All', 'project_milestones.view_all', 'project_milestones', 'view_all', 'View all project milestones', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(78, 'Projectmilestone View Own', 'project_milestones.view_own', 'project_milestones', 'view_own', 'View own project milestone', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(79, 'Project_Phases Create', 'project_phases.create', 'project_phases', 'create', 'Create new project phase', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(80, 'Project_Phases Read', 'project_phases.read', 'project_phases', 'read', 'View project phase', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(81, 'Project_Phases Update', 'project_phases.update', 'project_phases', 'update', 'Update project phase', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(82, 'Project_Phases Delete', 'project_phases.delete', 'project_phases', 'delete', 'Delete project phase', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(83, 'Project_Phases View All', 'project_phases.view_all', 'project_phases', 'view_all', 'View all project phases', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(84, 'Projectphase View Own', 'project_phases.view_own', 'project_phases', 'view_own', 'View own project phase', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(85, 'Projectteam Create', 'project_teams.create', 'project_teams', 'create', 'Create new project team', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(86, 'Projectteam Read', 'project_teams.read', 'project_teams', 'read', 'View project team', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(87, 'Projectteam Update', 'project_teams.update', 'project_teams', 'update', 'Update project team', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(88, 'Projectteam Delete', 'project_teams.delete', 'project_teams', 'delete', 'Delete project team', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(89, 'Projectteam View All', 'project_teams.view_all', 'project_teams', 'view_all', 'View all project teams', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(90, 'Projectteam View Own', 'project_teams.view_own', 'project_teams', 'view_own', 'View own project team', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(91, 'Projecttimelineevent Create', 'project_timeline_events.create', 'project_timeline_events', 'create', 'Create new project timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(92, 'Projecttimelineevent Read', 'project_timeline_events.read', 'project_timeline_events', 'read', 'View project timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(93, 'Projecttimelineevent Update', 'project_timeline_events.update', 'project_timeline_events', 'update', 'Update project timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(94, 'Projecttimelineevent Delete', 'project_timeline_events.delete', 'project_timeline_events', 'delete', 'Delete project timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(95, 'Projecttimelineevent View All', 'project_timeline_events.view_all', 'project_timeline_events', 'view_all', 'View all project timeline events', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(96, 'Projecttimelineevent View Own', 'project_timeline_events.view_own', 'project_timeline_events', 'view_own', 'View own project timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(97, 'Reports Create', 'reports.create', 'reports', 'create', 'Create new report', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(98, 'Reports Read', 'reports.read', 'reports', 'read', 'View report', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(99, 'Reports Update', 'reports.update', 'reports', 'update', 'Update report', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(100, 'Reports Delete', 'reports.delete', 'reports', 'delete', 'Delete report', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(101, 'Reports View All', 'reports.view_all', 'reports', 'view_all', 'View all reports', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(102, 'Report View Own', 'reports.view_own', 'reports', 'view_own', 'View own report', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(103, 'Reportattachment Create', 'report_attachments.create', 'report_attachments', 'create', 'Create new report attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(104, 'Reportattachment Read', 'report_attachments.read', 'report_attachments', 'read', 'View report attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(105, 'Reportattachment Update', 'report_attachments.update', 'report_attachments', 'update', 'Update report attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(106, 'Reportattachment Delete', 'report_attachments.delete', 'report_attachments', 'delete', 'Delete report attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(107, 'Reportattachment View All', 'report_attachments.view_all', 'report_attachments', 'view_all', 'View all report attachments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(108, 'Reportattachment View Own', 'report_attachments.view_own', 'report_attachments', 'view_own', 'View own report attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(109, 'Role Create', 'role.create', 'role', 'create', 'Create new role', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(110, 'Role Read', 'role.read', 'role', 'read', 'View role', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(111, 'Role Update', 'role.update', 'role', 'update', 'Update role', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(112, 'Role Delete', 'role.delete', 'role', 'delete', 'Delete role', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(113, 'Role View All', 'role.view_all', 'role', 'view_all', 'View all roles', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(114, 'Role View Own', 'role.view_own', 'role', 'view_own', 'View own role', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(115, 'Slapolicy Create', 'sla_policies.create', 'sla_policies', 'create', 'Create new sla policy', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(116, 'Slapolicy Read', 'sla_policies.read', 'sla_policies', 'read', 'View sla policy', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(117, 'Slapolicy Update', 'sla_policies.update', 'sla_policies', 'update', 'Update sla policy', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(118, 'Slapolicy Delete', 'sla_policies.delete', 'sla_policies', 'delete', 'Delete sla policy', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(119, 'Slapolicy View All', 'sla_policies.view_all', 'sla_policies', 'view_all', 'View all sla policies', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(120, 'Slapolicy View Own', 'sla_policies.view_own', 'sla_policies', 'view_own', 'View own sla policy', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(121, 'Task.Create', 'task.create', 'task', 'create', 'Create new tasks', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(122, 'Task.Read', 'task.read', 'task', 'read', 'Read tasks', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(123, 'Task.Update', 'task.update', 'task', 'update', 'Update tasks', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(124, 'Task Delete', 'task.delete', 'task', 'delete', 'Delete task', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(125, 'Task.ViewAll', 'task.view_all', 'task', 'view_all', 'View all tasks', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(126, 'Task.ViewOwn', 'task.view_own', 'task', 'view_own', 'View own tasks', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(127, 'Taskassignment Create', 'task_assignments.create', 'task_assignments', 'create', 'Create new task assignment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(128, 'Taskassignment Read', 'task_assignments.read', 'task_assignments', 'read', 'View task assignment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(129, 'Taskassignment Update', 'task_assignments.update', 'task_assignments', 'update', 'Update task assignment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(130, 'Taskassignment Delete', 'task_assignments.delete', 'task_assignments', 'delete', 'Delete task assignment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(131, 'Taskassignment View All', 'task_assignments.view_all', 'task_assignments', 'view_all', 'View all task assignments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(132, 'Taskassignment View Own', 'task_assignments.view_own', 'task_assignments', 'view_own', 'View own task assignment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(133, 'Task_Attachments Create', 'task_attachments.create', 'task_attachments', 'create', 'Create new task attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(134, 'Taskattachment Read', 'task_attachments.read', 'task_attachments', 'read', 'View task attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(135, 'Taskattachment Update', 'task_attachments.update', 'task_attachments', 'update', 'Update task attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(136, 'Task_Attachments Delete', 'task_attachments.delete', 'task_attachments', 'delete', 'Delete task attachment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(137, 'Task_Attachments View All', 'task_attachments.view_all', 'task_attachments', 'view_all', 'View all task attachments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(138, 'Taskattachment View Own', 'task_attachments.view_own', 'task_attachments', 'view_own', 'View own task attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(139, 'Taskauditevent Create', 'task_audit_events.create', 'task_audit_events', 'create', 'Create new task audit event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(140, 'Taskauditevent Read', 'task_audit_events.read', 'task_audit_events', 'read', 'View task audit event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(141, 'Taskauditevent Update', 'task_audit_events.update', 'task_audit_events', 'update', 'Update task audit event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(142, 'Taskauditevent Delete', 'task_audit_events.delete', 'task_audit_events', 'delete', 'Delete task audit event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(143, 'Taskauditevent View All', 'task_audit_events.view_all', 'task_audit_events', 'view_all', 'View all task audit events', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(144, 'Taskauditevent View Own', 'task_audit_events.view_own', 'task_audit_events', 'view_own', 'View own task audit event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(145, 'Task_Comments Create', 'task_comments.create', 'task_comments', 'create', 'Create new task comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(146, 'Taskcomment Read', 'task_comments.read', 'task_comments', 'read', 'View task comment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(147, 'Task_Comments Update', 'task_comments.update', 'task_comments', 'update', 'Update task comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(148, 'Task_Comments Delete', 'task_comments.delete', 'task_comments', 'delete', 'Delete task comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(149, 'Task_Comments View All', 'task_comments.view_all', 'task_comments', 'view_all', 'View all task comments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(150, 'Taskcomment View Own', 'task_comments.view_own', 'task_comments', 'view_own', 'View own task comment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(151, 'Taskcommentattachment Create', 'task_comment_attachments.create', 'task_comment_attachments', 'create', 'Create new task comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(152, 'Taskcommentattachment Read', 'task_comment_attachments.read', 'task_comment_attachments', 'read', 'View task comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(153, 'Taskcommentattachment Update', 'task_comment_attachments.update', 'task_comment_attachments', 'update', 'Update task comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(154, 'Taskcommentattachment Delete', 'task_comment_attachments.delete', 'task_comment_attachments', 'delete', 'Delete task comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(155, 'Taskcommentattachment View All', 'task_comment_attachments.view_all', 'task_comment_attachments', 'view_all', 'View all task comment attachments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(156, 'Taskcommentattachment View Own', 'task_comment_attachments.view_own', 'task_comment_attachments', 'view_own', 'View own task comment attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(157, 'Task_Dependencies Create', 'task_dependencies.create', 'task_dependencies', 'create', 'Create new task dependency', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(158, 'Task_Dependencies Read', 'task_dependencies.read', 'task_dependencies', 'read', 'View task dependency', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(159, 'Task_Dependencies Update', 'task_dependencies.update', 'task_dependencies', 'update', 'Update task dependency', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(160, 'Task_Dependencies Delete', 'task_dependencies.delete', 'task_dependencies', 'delete', 'Delete task dependency', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(161, 'Task_Dependencies View All', 'task_dependencies.view_all', 'task_dependencies', 'view_all', 'View all task dependencies', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(162, 'Taskdependency View Own', 'task_dependencies.view_own', 'task_dependencies', 'view_own', 'View own task dependency', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(163, 'Task_Forwardings Create', 'task_forwardings.create', 'task_forwardings', 'create', 'Create new task forwarding', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(164, 'Taskforwarding Read', 'task_forwardings.read', 'task_forwardings', 'read', 'View task forwarding', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(165, 'Taskforwarding Update', 'task_forwardings.update', 'task_forwardings', 'update', 'Update task forwarding', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(166, 'Taskforwarding Delete', 'task_forwardings.delete', 'task_forwardings', 'delete', 'Delete task forwarding', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(167, 'Task_Forwardings View All', 'task_forwardings.view_all', 'task_forwardings', 'view_all', 'View all task forwardings', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(168, 'Taskforwarding View Own', 'task_forwardings.view_own', 'task_forwardings', 'view_own', 'View own task forwarding', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(169, 'Taskhistory Create', 'task_histories.create', 'task_histories', 'create', 'Create new task history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(170, 'Taskhistory Read', 'task_histories.read', 'task_histories', 'read', 'View task history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(171, 'Taskhistory Update', 'task_histories.update', 'task_histories', 'update', 'Update task history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(172, 'Taskhistory Delete', 'task_histories.delete', 'task_histories', 'delete', 'Delete task history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(173, 'Taskhistory View All', 'task_histories.view_all', 'task_histories', 'view_all', 'View all task histories', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(174, 'Taskhistory View Own', 'task_histories.view_own', 'task_histories', 'view_own', 'View own task history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(175, 'Tasktimeentry Create', 'task_time_entries.create', 'task_time_entries', 'create', 'Create new task time entry', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(176, 'Tasktimeentry Read', 'task_time_entries.read', 'task_time_entries', 'read', 'View task time entry', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(177, 'Tasktimeentry Update', 'task_time_entries.update', 'task_time_entries', 'update', 'Update task time entry', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(178, 'Tasktimeentry Delete', 'task_time_entries.delete', 'task_time_entries', 'delete', 'Delete task time entry', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(179, 'Tasktimeentry View All', 'task_time_entries.view_all', 'task_time_entries', 'view_all', 'View all task time entries', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(180, 'Tasktimeentry View Own', 'task_time_entries.view_own', 'task_time_entries', 'view_own', 'View own task time entry', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(181, 'Tasktype Create', 'task_types.create', 'task_types', 'create', 'Create new task type', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(182, 'Tasktype Read', 'task_types.read', 'task_types', 'read', 'View task type', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(183, 'Tasktype Update', 'task_types.update', 'task_types', 'update', 'Update task type', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(184, 'Tasktype Delete', 'task_types.delete', 'task_types', 'delete', 'Delete task type', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(185, 'Tasktype View All', 'task_types.view_all', 'task_types', 'view_all', 'View all task types', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(186, 'Tasktype View Own', 'task_types.view_own', 'task_types', 'view_own', 'View own task type', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(187, 'Ticket.Create', 'ticket.create', 'ticket', 'create', 'Create new tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(188, 'Ticket.Read', 'ticket.read', 'ticket', 'read', 'View tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(189, 'Ticket.Update', 'ticket.update', 'ticket', 'update', 'Update tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(190, 'Ticket.Delete', 'ticket.delete', 'ticket', 'delete', 'Delete tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(191, 'Ticket.ViewAll', 'ticket.view_all', 'ticket', 'view_all', 'View all tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(192, 'Ticket.ViewOwn', 'ticket.view_own', 'ticket', 'view_own', 'View own tickets', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(193, 'Ticketattachment Create', 'ticket_attachments.create', 'ticket_attachments', 'create', 'Create new ticket attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(194, 'Ticketattachment Read', 'ticket_attachments.read', 'ticket_attachments', 'read', 'View ticket attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(195, 'Ticketattachment Update', 'ticket_attachments.update', 'ticket_attachments', 'update', 'Update ticket attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(196, 'Ticketattachment Delete', 'ticket_attachments.delete', 'ticket_attachments', 'delete', 'Delete ticket attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(197, 'Ticketattachment View All', 'ticket_attachments.view_all', 'ticket_attachments', 'view_all', 'View all ticket attachments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(198, 'Ticketattachment View Own', 'ticket_attachments.view_own', 'ticket_attachments', 'view_own', 'View own ticket attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(199, 'Ticket_Comments Create', 'ticket_comments.create', 'ticket_comments', 'create', 'Create new ticket comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(200, 'Ticketcomment Read', 'ticket_comments.read', 'ticket_comments', 'read', 'View ticket comment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(201, 'Ticket_Comments Update', 'ticket_comments.update', 'ticket_comments', 'update', 'Update ticket comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(202, 'Ticket_Comments Delete', 'ticket_comments.delete', 'ticket_comments', 'delete', 'Delete ticket comment', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(203, 'Ticket_Comments View All', 'ticket_comments.view_all', 'ticket_comments', 'view_all', 'View all ticket comments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(204, 'Ticketcomment View Own', 'ticket_comments.view_own', 'ticket_comments', 'view_own', 'View own ticket comment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(205, 'Tickethistory Create', 'ticket_histories.create', 'ticket_histories', 'create', 'Create new ticket history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(206, 'Tickethistory Read', 'ticket_histories.read', 'ticket_histories', 'read', 'View ticket history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(207, 'Tickethistory Update', 'ticket_histories.update', 'ticket_histories', 'update', 'Update ticket history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(208, 'Tickethistory Delete', 'ticket_histories.delete', 'ticket_histories', 'delete', 'Delete ticket history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(209, 'Tickethistory View All', 'ticket_histories.view_all', 'ticket_histories', 'view_all', 'View all ticket histories', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(210, 'Tickethistory View Own', 'ticket_histories.view_own', 'ticket_histories', 'view_own', 'View own ticket history', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(211, 'Timeline_Events Create', 'timeline_events.create', 'timeline_events', 'create', 'Create new timeline event', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(212, 'Timeline_Events Read', 'timeline_events.read', 'timeline_events', 'read', 'View timeline event', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(213, 'Timeline_Events Update', 'timeline_events.update', 'timeline_events', 'update', 'Update timeline event', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(214, 'Timeline_Events Delete', 'timeline_events.delete', 'timeline_events', 'delete', 'Delete timeline event', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(215, 'Timeline_Events View All', 'timeline_events.view_all', 'timeline_events', 'view_all', 'View all timeline events', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(216, 'Timelineevent View Own', 'timeline_events.view_own', 'timeline_events', 'view_own', 'View own timeline event', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(217, 'Timelineeventattachment Create', 'timeline_event_attachments.create', 'timeline_event_attachments', 'create', 'Create new timeline event attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(218, 'Timelineeventattachment Read', 'timeline_event_attachments.read', 'timeline_event_attachments', 'read', 'View timeline event attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(219, 'Timelineeventattachment Update', 'timeline_event_attachments.update', 'timeline_event_attachments', 'update', 'Update timeline event attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(220, 'Timelineeventattachment Delete', 'timeline_event_attachments.delete', 'timeline_event_attachments', 'delete', 'Delete timeline event attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(221, 'Timelineeventattachment View All', 'timeline_event_attachments.view_all', 'timeline_event_attachments', 'view_all', 'View all timeline event attachments', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(222, 'Timelineeventattachment View Own', 'timeline_event_attachments.view_own', 'timeline_event_attachments', 'view_own', 'View own timeline event attachment', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(223, 'User.Create', 'user.create', 'user', 'create', 'Create new users', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(224, 'User.Read', 'user.read', 'user', 'read', 'View users', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(225, 'User.Update', 'user.update', 'user', 'update', 'Update users', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(226, 'User.Delete', 'user.delete', 'user', 'delete', 'Delete users', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(227, 'User View All', 'user.view_all', 'user', 'view_all', 'View all users', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(228, 'User View Own', 'user.view_own', 'user', 'view_own', 'View own user', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(229, 'Userskill Create', 'user_skills.create', 'user_skills', 'create', 'Create new user skill', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(230, 'Userskill Read', 'user_skills.read', 'user_skills', 'read', 'View user skill', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(231, 'Userskill Update', 'user_skills.update', 'user_skills', 'update', 'Update user skill', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(232, 'Userskill Delete', 'user_skills.delete', 'user_skills', 'delete', 'Delete user skill', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(233, 'Userskill View All', 'user_skills.view_all', 'user_skills', 'view_all', 'View all user skills', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(234, 'Userskill View Own', 'user_skills.view_own', 'user_skills', 'view_own', 'View own user skill', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(235, 'Workloadmetric Create', 'workload_metrics.create', 'workload_metrics', 'create', 'Create new workload metric', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(236, 'Workloadmetric Read', 'workload_metrics.read', 'workload_metrics', 'read', 'View workload metric', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(237, 'Workloadmetric Update', 'workload_metrics.update', 'workload_metrics', 'update', 'Update workload metric', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(238, 'Workloadmetric Delete', 'workload_metrics.delete', 'workload_metrics', 'delete', 'Delete workload metric', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(239, 'Workloadmetric View All', 'workload_metrics.view_all', 'workload_metrics', 'view_all', 'View all workload metrics', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(240, 'Workloadmetric View Own', 'workload_metrics.view_own', 'workload_metrics', 'view_own', 'View own workload metric', '2026-03-17 07:42:02', '2026-03-17 07:42:02'),
(241, 'Authenticated_Sessions Create', 'authenticated_sessions.create', 'authenticated_sessions', 'create', 'Create new authenticated session', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(242, 'Password_Reset_Links Create', 'password_reset_links.create', 'password_reset_links', 'create', 'Create new password reset link', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(243, 'New_Passwords Create', 'new_passwords.create', 'new_passwords', 'create', 'Create new new password', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(244, 'Email_Verification_Notifications Create', 'email_verification_notifications.create', 'email_verification_notifications', 'create', 'Create new email verification notification', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(245, 'Confirmable_Passwords Read', 'confirmable_passwords.read', 'confirmable_passwords', 'read', 'View confirmable password', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(246, 'Confirmed_Password_Statuses Read', 'confirmed_password_statuses.read', 'confirmed_password_statuses', 'read', 'View confirmed password status', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(247, 'Confirmable_Passwords Create', 'confirmable_passwords.create', 'confirmable_passwords', 'create', 'Create new confirmable password', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(248, 'Two_Factor_Authenticated_Sessions Create', 'two_factor_authenticated_sessions.create', 'two_factor_authenticated_sessions', 'create', 'Create new two factor authenticated session', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(249, 'Two_Factor_Authentications Create', 'two_factor_authentications.create', 'two_factor_authentications', 'create', 'Create new two factor authentication', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(250, 'Confirmed_Two_Factor_Authentications Create', 'confirmed_two_factor_authentications.create', 'confirmed_two_factor_authentications', 'create', 'Create new confirmed two factor authentication', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(251, 'Two_Factor_Authentications Delete', 'two_factor_authentications.delete', 'two_factor_authentications', 'delete', 'Delete two factor authentication', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(252, 'Two_Factor_Qr_Codes Read', 'two_factor_qr_codes.read', 'two_factor_qr_codes', 'read', 'View two factor qr code', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(253, 'Two_Factor_Secret_Keys Read', 'two_factor_secret_keys.read', 'two_factor_secret_keys', 'read', 'View two factor secret key', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(254, 'Recovery_Codes View All', 'recovery_codes.view_all', 'recovery_codes', 'view_all', 'View all recovery codes', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(255, 'Recovery_Codes Create', 'recovery_codes.create', 'recovery_codes', 'create', 'Create new recovery code', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(256, 'Admin_Dashboards View All', 'admin_dashboards.view_all', 'admin_dashboards', 'view_all', 'View all admin dashboards', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(257, 'Project_Timelines View All', 'project_timelines.view_all', 'project_timelines', 'view_all', 'View all project timelines', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(258, 'Project_Timelines Create', 'project_timelines.create', 'project_timelines', 'create', 'Create new project timeline', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(259, 'Project_Timelines Read', 'project_timelines.read', 'project_timelines', 'read', 'View project timeline', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(260, 'Project_Timelines Update', 'project_timelines.update', 'project_timelines', 'update', 'Update project timeline', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(261, 'Project_Timelines Delete', 'project_timelines.delete', 'project_timelines', 'delete', 'Delete project timeline', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(262, 'Admin_Tickets View All', 'admin_tickets.view_all', 'admin_tickets', 'view_all', 'View all admin tickets', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(263, 'Admin_Tickets Create', 'admin_tickets.create', 'admin_tickets', 'create', 'Create new admin ticket', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(264, 'Admin_Tickets Read', 'admin_tickets.read', 'admin_tickets', 'read', 'View admin ticket', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(265, 'Admin_Tickets Update', 'admin_tickets.update', 'admin_tickets', 'update', 'Update admin ticket', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(266, 'Admin_Tickets Delete', 'admin_tickets.delete', 'admin_tickets', 'delete', 'Delete admin ticket', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(267, 'Admin_Tasks View All', 'admin_tasks.view_all', 'admin_tasks', 'view_all', 'View all admin tasks', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(268, 'Admin_Tasks Create', 'admin_tasks.create', 'admin_tasks', 'create', 'Create new admin task', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(269, 'Admin_Tasks Read', 'admin_tasks.read', 'admin_tasks', 'read', 'View admin task', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(270, 'Admin_Tasks Update', 'admin_tasks.update', 'admin_tasks', 'update', 'Update admin task', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(271, 'Admin_Tasks Delete', 'admin_tasks.delete', 'admin_tasks', 'delete', 'Delete admin task', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(272, 'Menu_Managements View All', 'menu_managements.view_all', 'menu_managements', 'view_all', 'View all menu managements', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(273, 'Menu_Managements Update', 'menu_managements.update', 'menu_managements', 'update', 'Update menu management', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(274, 'Workload_Matrices View All', 'workload_matrices.view_all', 'workload_matrices', 'view_all', 'View all workload matrices', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(275, 'Profiles Update', 'profiles.update', 'profiles', 'update', 'Update profile', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(276, 'Profiles Delete', 'profiles.delete', 'profiles', 'delete', 'Delete profile', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(277, 'Passwords Update', 'passwords.update', 'passwords', 'update', 'Update password', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(278, 'Two_Factor_Authentications Read', 'two_factor_authentications.read', 'two_factor_authentications', 'read', 'View two factor authentication', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(279, 'Project Restore', 'project.restore', 'project', 'restore', 'Restore project', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(280, 'Project Manage Team', 'project.manage_team', 'project', 'manage_team', 'Manage project team', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(281, 'Project Manage Milestones', 'project.manage_milestones', 'project', 'manage_milestones', 'Manage project milestones', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(282, 'Project Manage Phases', 'project.manage_phases', 'project', 'manage_phases', 'Manage project phases', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(283, 'Project Manage Timeline', 'project.manage_timeline', 'project', 'manage_timeline', 'Manage project timeline', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(284, 'Project Manage Attachments', 'project.manage_attachments', 'project', 'manage_attachments', 'Manage project attachments', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(285, 'Project View Reports', 'project.view_reports', 'project', 'view_reports', 'View project reports', '2026-03-17 07:42:04', '2026-03-17 07:42:04'),
(286, 'Task.Assign', 'task.assign', 'task', 'assign', 'Assign tasks to users/departments', NULL, NULL),
(287, 'Task.Reassign', 'task.reassign', 'task', 'reassign', 'Reassign tasks between users/departments', NULL, NULL),
(288, 'Task.ChangePriority', 'task.change_priority', 'task', 'change_priority', 'Change task priority', NULL, NULL),
(289, 'Task.ChangeSLA', 'task.change_sla', 'task', 'change_sla', 'Change SLA settings', NULL, NULL),
(290, 'Task.Start', 'task.start', 'task', 'start', 'Start work on tasks', NULL, NULL),
(291, 'Task.UpdateProgress', 'task.update_progress', 'task', 'update_progress', 'Update task progress', NULL, NULL),
(292, 'Task.Block', 'task.block', 'task', 'block', 'Block tasks', NULL, NULL),
(293, 'Task.Unblock', 'task.unblock', 'task', 'unblock', 'Unblock tasks', NULL, NULL),
(294, 'Task.RequestReview', 'task.request_review', 'task', 'request_review', 'Submit tasks for review', NULL, NULL),
(295, 'Task.ReviewApprove', 'task.review_approve', 'task', 'review_approve', 'Approve task reviews', NULL, NULL),
(296, 'Task.ReviewReject', 'task.review_reject', 'task', 'review_reject', 'Reject task reviews', NULL, NULL),
(297, 'Task.Complete', 'task.complete', 'task', 'complete', 'Mark tasks as complete', NULL, NULL),
(298, 'Task.Cancel', 'task.cancel', 'task', 'cancel', 'Cancel tasks', NULL, NULL),
(299, 'Task.Override', 'task.override', 'task', 'override', 'Override normal workflow guards', NULL, NULL),
(300, 'Task.ViewDepartment', 'task.view_department', 'task', 'view_department', 'View department tasks', NULL, NULL),
(301, 'Task.ManageOthers', 'task.manage_others', 'task', 'manage_others', 'Manage other users tasks', NULL, NULL),
(302, 'Ticket.Assign', 'ticket.assign', 'ticket', 'assign', 'Assign tickets', NULL, NULL),
(303, 'Ticket.Approve', 'ticket.approve', 'ticket', 'approve', 'Approve tickets', NULL, NULL),
(304, 'Ticket.Reject', 'ticket.reject', 'ticket', 'reject', 'Reject tickets', NULL, NULL),
(305, 'Ticket.Manage', 'ticket.manage', 'ticket', 'manage', 'Manage tickets', NULL, NULL),
(306, 'User.ManageRoles', 'user.manage_roles', 'user', 'manage_roles', 'Manage user roles', NULL, NULL),
(307, 'User.ManagePermissions', 'user.manage_permissions', 'user', 'manage_permissions', 'Manage user permissions', NULL, NULL),
(308, 'Department.ManageUsers', 'department.manage_users', 'department', 'manage_users', 'Manage department users', NULL, NULL),
(309, 'Client.ManageProducts', 'client.manage_products', 'client', 'manage_products', 'Manage client products', NULL, NULL),
(310, 'SLA.Create', 'sla.create', 'sla', 'create', 'Create new SLA policies', NULL, NULL),
(311, 'SLA.Read', 'sla.read', 'sla', 'read', 'View SLA policies', NULL, NULL),
(312, 'SLA.Update', 'sla.update', 'sla', 'update', 'Update SLA policies', NULL, NULL),
(313, 'SLA.Delete', 'sla.delete', 'sla', 'delete', 'Delete SLA policies', NULL, NULL),
(314, 'Report.View', 'report.view', 'report', 'view', 'View reports', NULL, NULL),
(315, 'Report.Generate', 'report.generate', 'report', 'generate', 'Generate reports', NULL, NULL),
(316, 'Report.Export', 'report.export', 'report', 'export', 'Export reports', NULL, NULL),
(317, 'Report.Create', 'report.create', 'report', 'create', 'Create reports', NULL, NULL),
(318, 'Report.Update', 'report.update', 'report', 'update', 'Update reports', NULL, NULL),
(319, 'Report.Delete', 'report.delete', 'report', 'delete', 'Delete reports', NULL, NULL),
(320, 'ActivityLog.Read', 'activity_log.read', 'activity_log', 'read', 'View activity logs', NULL, NULL),
(321, 'ActivityLog.Delete', 'activity_log.delete', 'activity_log', 'delete', 'Delete activity logs', NULL, NULL),
(322, 'TimelineEvent.Create', 'timeline_event.create', 'timeline_event', 'create', 'Create timeline events', NULL, NULL),
(323, 'TimelineEvent.Read', 'timeline_event.read', 'timeline_event', 'read', 'View timeline events', NULL, NULL),
(324, 'TimelineEvent.Update', 'timeline_event.update', 'timeline_event', 'update', 'Update timeline events', NULL, NULL),
(325, 'TimelineEvent.Delete', 'timeline_event.delete', 'timeline_event', 'delete', 'Delete timeline events', NULL, NULL),
(326, 'TaskDependency.Create', 'task_dependency.create', 'task_dependency', 'create', 'Create task dependencies', NULL, NULL),
(327, 'TaskDependency.Read', 'task_dependency.read', 'task_dependency', 'read', 'View task dependencies', NULL, NULL),
(328, 'TaskDependency.Update', 'task_dependency.update', 'task_dependency', 'update', 'Update task dependencies', NULL, NULL),
(329, 'TaskDependency.Delete', 'task_dependency.delete', 'task_dependency', 'delete', 'Delete task dependencies', NULL, NULL),
(330, 'TaskForwarding.Create', 'task_forwarding.create', 'task_forwarding', 'create', 'Create task forwardings', NULL, NULL),
(331, 'TaskForwarding.Read', 'task_forwarding.read', 'task_forwarding', 'read', 'View task forwardings', NULL, NULL),
(332, 'TaskForwarding.Update', 'task_forwarding.update', 'task_forwarding', 'update', 'Update task forwardings', NULL, NULL),
(333, 'TaskForwarding.Delete', 'task_forwarding.delete', 'task_forwarding', 'delete', 'Delete task forwardings', NULL, NULL),
(334, 'TaskAssignment.Create', 'task_assignment.create', 'task_assignment', 'create', 'Create task assignments', NULL, NULL),
(335, 'TaskAssignment.Read', 'task_assignment.read', 'task_assignment', 'read', 'View task assignments', NULL, NULL),
(336, 'TaskAssignment.Update', 'task_assignment.update', 'task_assignment', 'update', 'Update task assignments', NULL, NULL),
(337, 'TaskAssignment.Delete', 'task_assignment.delete', 'task_assignment', 'delete', 'Delete task assignments', NULL, NULL),
(338, 'System.Settings', 'system.settings', 'system', 'settings', 'Access system settings', NULL, NULL),
(339, 'System.Maintenance', 'system.maintenance', 'system', 'maintenance', 'Perform system maintenance', NULL, NULL),
(340, 'System.Backup', 'system.backup', 'system', 'backup', 'Backup system data', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `version` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','discontinued') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `metadata` json DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `version`, `status`, `metadata`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Desalite Connect', 'Complete school management solution', '1.0.0', 'active', '{\"category\": \"Education\", \"features\": [\"attendance\", \"fees\", \"exams\", \"timetable\"], \"supported_modules\": [\"core\", \"hr\", \"finance\"]}', NULL, NULL, NULL),
(2, 'Ednect', 'School management system', '1.0.0', 'active', '{\"category\": \"Education\", \"features\": [\"attendance\", \"fees\", \"exams\", \"timetable\"], \"supported_modules\": [\"core\", \"hr\", \"finance\"]}', NULL, NULL, NULL),
(3, 'Transtract', 'Logistics system', '2.0.0', 'active', '{\"category\": \"Enterprise\", \"features\": [\"inventory\", \"finance\"], \"supported_modules\": [\"all\"]}', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('planning','active','on_hold','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `progress` int(11) NOT NULL DEFAULT '0',
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_attachments`
--

CREATE TABLE `project_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `filename` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int(11) NOT NULL,
  `path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_milestones`
--

CREATE TABLE `project_milestones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `target_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `status` enum('pending','in_progress','completed','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `type` enum('start','checkpoint','delivery','completion','custom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom',
  `progress` int(11) NOT NULL DEFAULT '0',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_phases`
--

CREATE TABLE `project_phases` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('pending','active','completed','on_hold') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `progress` int(11) NOT NULL DEFAULT '0',
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_teams`
--

CREATE TABLE `project_teams` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_timeline_events`
--

CREATE TABLE `project_timeline_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `phase_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_description` text COLLATE utf8mb4_unicode_ci,
  `event_date` datetime NOT NULL,
  `is_milestone` tinyint(1) NOT NULL DEFAULT '0',
  `milestone_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `progress_percentage` int(11) NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `report_date` date NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `total_hours` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `user_id`, `report_date`, `title`, `description`, `total_hours`, `status`, `metadata`, `created_at`, `updated_at`) VALUES
(247, 9, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-03-31 12:32:39', '2026-03-31 12:32:39'),
(248, 10, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 0.67, 'submitted', NULL, '2026-03-31 12:36:34', '2026-03-31 12:36:34'),
(249, 10, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 0.67, 'submitted', NULL, '2026-03-31 12:36:35', '2026-03-31 12:36:35'),
(250, 7, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-03-31 12:40:48', '2026-03-31 12:40:48'),
(251, 8, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-03-31 12:42:36', '2026-03-31 12:42:36'),
(252, 5, '2026-03-31', 'Daily Report - 2026-03-31', 'Completed tasks and work details for the day.', 7.79, 'submitted', NULL, '2026-03-31 12:47:35', '2026-03-31 12:47:35'),
(253, 9, '2026-04-01', 'Daily Report - 2026-04-01', 'Completed tasks and work details for the day.', 8.22, 'submitted', NULL, '2026-04-01 12:24:30', '2026-04-01 12:24:30'),
(254, 10, '2026-04-01', 'Daily Report - 2026-04-01', 'Completed tasks and work details for the day.', 8.24, 'submitted', NULL, '2026-04-01 12:29:44', '2026-04-01 12:29:44'),
(255, 7, '2026-04-01', 'Daily Report - 2026-04-01', 'Completed tasks and work details for the day.', 8.59, 'submitted', NULL, '2026-04-01 12:36:12', '2026-04-01 12:36:12'),
(256, 5, '2026-04-01', 'Daily Report - 2026-04-01', '<p>Completed RSCPL requirement and portal refinement.</p>', 7.19, 'submitted', NULL, '2026-04-01 12:58:17', '2026-04-01 12:58:17'),
(257, 8, '2026-04-01', 'Daily Report - 2026-04-01', 'Completed tasks and work details for the day.', 9.48, 'submitted', NULL, '2026-04-01 13:28:09', '2026-04-01 13:28:09'),
(258, 12, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 0.01, 'submitted', NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(259, 19, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-02 12:05:45', '2026-04-02 12:05:45'),
(260, 18, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-02 12:05:50', '2026-04-02 12:05:50'),
(261, 10, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 8.41, 'submitted', NULL, '2026-04-02 12:25:45', '2026-04-02 12:25:45'),
(262, 7, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 8.44, 'submitted', NULL, '2026-04-02 12:26:35', '2026-04-02 12:26:35'),
(263, 9, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 6.87, 'submitted', NULL, '2026-04-02 12:27:15', '2026-04-02 12:27:15'),
(264, 8, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 8.54, 'submitted', NULL, '2026-04-02 12:40:48', '2026-04-02 12:40:48'),
(265, 5, '2026-04-02', 'Daily Report - 2026-04-02', 'Completed tasks and work details for the day.', 0.40, 'submitted', NULL, '2026-04-02 12:48:44', '2026-04-02 12:48:44'),
(266, 12, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-03 11:31:44', '2026-04-03 11:31:44'),
(268, 19, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 0.04, 'submitted', NULL, '2026-04-03 12:21:25', '2026-04-03 12:21:25'),
(269, 18, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 2.74, 'submitted', NULL, '2026-04-03 12:24:07', '2026-04-03 12:24:07'),
(270, 10, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 0.53, 'submitted', NULL, '2026-04-03 12:25:50', '2026-04-03 12:25:50'),
(271, 5, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 4.78, 'submitted', NULL, '2026-04-03 12:48:22', '2026-04-03 12:48:22'),
(272, 8, '2026-04-03', 'Daily Report - 2026-04-03', 'Completed tasks and work details for the day.', 7.53, 'submitted', NULL, '2026-04-03 12:52:39', '2026-04-03 12:52:39'),
(273, 12, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-04 07:37:35', '2026-04-04 07:37:35'),
(274, 18, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.67, 'submitted', NULL, '2026-04-04 08:09:09', '2026-04-04 08:09:09'),
(275, 19, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-04 08:20:10', '2026-04-04 08:20:10'),
(276, 10, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 3.98, 'submitted', NULL, '2026-04-04 08:23:30', '2026-04-04 08:23:30'),
(277, 9, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.01, 'submitted', NULL, '2026-04-04 08:27:31', '2026-04-04 08:27:31'),
(279, 7, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 4.52, 'submitted', NULL, '2026-04-04 08:35:46', '2026-04-04 08:35:46'),
(280, 15, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.58, 'submitted', NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(281, 15, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.58, 'submitted', NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(282, 15, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 0.58, 'submitted', NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(283, 5, '2026-04-04', 'Daily Report - 2026-04-04', '<p>Preparing timeline events sample, please check the attached file. which is being designed with sample data. </p>', 4.32, 'submitted', NULL, '2026-04-04 09:04:40', '2026-04-04 09:04:40'),
(284, 8, '2026-04-04', 'Daily Report - 2026-04-04', 'Completed tasks and work details for the day.', 4.82, 'submitted', NULL, '2026-04-04 09:15:13', '2026-04-04 09:15:13'),
(285, 12, '2026-04-06', 'Daily Report - 2026-04-06', 'Completed tasks and work details for the day.', 0.26, 'submitted', NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(286, 19, '2026-04-06', 'Daily Report - 2026-04-06', 'Completed tasks and work details for the day.', 7.52, 'submitted', NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(287, 19, '2026-04-06', 'Daily Report - 2026-04-06', 'Completed tasks and work details for the day.', 7.52, 'submitted', NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(288, 15, '2026-04-06', 'Daily Report - 2026-04-06', 'Completed tasks and work details for the day.', 0.00, 'submitted', NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(289, 5, '2026-04-06', 'Daily Report - 2026-04-06', '<p>Worked on some required updates.</p>', 4.79, 'submitted', NULL, '2026-04-06 12:57:15', '2026-04-06 12:57:15'),
(290, 8, '2026-04-06', 'Daily Report - 2026-04-06', 'Completed tasks and work details for the day.', 0.76, 'submitted', NULL, '2026-04-06 14:12:16', '2026-04-06 14:12:16');

-- --------------------------------------------------------

--
-- Table structure for table `report_attachments`
--

CREATE TABLE `report_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `report_id` bigint(20) UNSIGNED NOT NULL,
  `file_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_attachments`
--

INSERT INTO `report_attachments` (`id`, `report_id`, `file_name`, `file_path`, `file_type`, `file_size`, `metadata`, `created_at`, `updated_at`) VALUES
(15, 269, 'private schools of Arunachal.xlsx', 'reports/269/attachments/u6dm5V4vTHNM4Io1h5nuJBWb9aUE9FKKQVSXipbU.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 12181, '{\"extension\": \"xlsx\", \"uploaded_at\": \"2026-04-03T12:24:07.980755Z\", \"uploaded_by\": 18, \"original_name\": \"private schools of Arunachal.xlsx\"}', '2026-04-03 12:24:07', '2026-04-03 12:24:07'),
(16, 269, 'SIKKIM PRIVATE SCHOOLS.xlsx', 'reports/269/attachments/RgVA8FKGlIBekGPDx1zy0aU4aRGAWonj9fBubMKH.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 12099, '{\"extension\": \"xlsx\", \"uploaded_at\": \"2026-04-03T12:24:07.980458Z\", \"uploaded_by\": 18, \"original_name\": \"SIKKIM PRIVATE SCHOOLS.xlsx\"}', '2026-04-03 12:24:07', '2026-04-03 12:24:07'),
(17, 274, 'SIKKIM PRIVATE SCHOOLS.xlsx', 'reports/274/attachments/1xzZPERzWjVA5Iagfr5qf4XFAbu8GuhivmEcdn9A.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 12099, '{\"extension\": \"xlsx\", \"uploaded_at\": \"2026-04-04T08:09:10.165945Z\", \"uploaded_by\": 18, \"original_name\": \"SIKKIM PRIVATE SCHOOLS.xlsx\"}', '2026-04-04 08:09:10', '2026-04-04 08:09:10'),
(18, 283, 'Screenshot 2026-04-04 142523.png', 'reports/283/attachments/3eHpKS6FQLR3W6HvPxitUGqpTGGT4uDnaWTNgqFR.png', 'image/png', 59491, '{\"extension\": \"png\", \"uploaded_at\": \"2026-04-04T09:04:40.962341Z\", \"uploaded_by\": 5, \"original_name\": \"Screenshot 2026-04-04 142523.png\"}', '2026-04-04 09:04:40', '2026-04-04 09:04:40');

-- --------------------------------------------------------

--
-- Table structure for table `report_tasks`
--

CREATE TABLE `report_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `report_id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_tasks`
--

INSERT INTO `report_tasks` (`id`, `report_id`, `task_id`, `remarks`, `created_at`, `updated_at`) VALUES
(390, 247, 266, '<ul><li><p>created figma design for MSFS Guwahati Province (login and notification)</p></li><li><p> provided support to Aditya - provided screenshots for the gogamukh update, updated logos of the gogamukh in photoshop.</p></li><li><p>implemented readmission model and controller and design the readmission in the homescreen.</p></li></ul><p></p>', '2026-03-31 12:32:39', '2026-03-31 12:32:39'),
(391, 248, 264, '<p>Below the summary of today’s work:</p><ul><li><p>Debugged the iOS application issue where the app was getting stuck on the splash screen.</p></li><li><p>Analyzed and identified potential causes related to API calls, Firebase initialization, and connectivity handling.</p></li><li><p>Implemented robust error handling across the Splash Screen:</p><ul><li><p>Added full error popup dialogs for better visibility.</p></li><li><p>Integrated retry mechanism for failed operations.</p></li><li><p>Added error logging and download functionality for debugging.</p></li></ul></li><li><p>Fixed internet connectivity check logic to prevent false positives.</p></li><li><p>Improved API handling with proper exception throwing and validation.</p></li><li><p>Enhanced overall app stability by preventing infinite loading scenarios.</p></li></ul><p></p>', '2026-03-31 12:36:34', '2026-03-31 12:36:34'),
(392, 249, 264, '<p>Below the summary of today’s work:</p><ul><li><p>Debugged the iOS application issue where the app was getting stuck on the splash screen.</p></li><li><p>Analyzed and identified potential causes related to API calls, Firebase initialization, and connectivity handling.</p></li><li><p>Implemented robust error handling across the Splash Screen:</p><ul><li><p>Added full error popup dialogs for better visibility.</p></li><li><p>Integrated retry mechanism for failed operations.</p></li><li><p>Added error logging and download functionality for debugging.</p></li></ul></li><li><p>Fixed internet connectivity check logic to prevent false positives.</p></li><li><p>Improved API handling with proper exception throwing and validation.</p></li><li><p>Enhanced overall app stability by preventing infinite loading scenarios.</p></li></ul><p></p>', '2026-03-31 12:36:35', '2026-03-31 12:36:35'),
(393, 250, 267, '<p>Sfs Burburia</p><ul><li><p>Set Up Wordpress  for Sfs Burburia </p></li><li><p>Created navigation menu as per existing website menu</p></li><li><p>Created school logo for the website.</p></li><li><p><br>MHS </p></li><li><p>In MHS updated mandatory public disclosure page  school info.</p></li><li><p>And Updated pdfs.</p></li></ul><p></p>', '2026-03-31 12:40:48', '2026-03-31 12:40:48'),
(394, 251, 268, '<ul><li><p>I dug into the backend logic for the <strong>Scholarship module</strong>, focusing on how we handle fee waivers and student discounts.</p></li><li><p>Successfully set up the <strong>Data Binding</strong> to pull in the exact fee structure for each student before applying any concessions.</p></li><li><p>Developed the core <strong>Save functionality</strong>, which now allows us to store the specific concession amount against a student\'s record.</p></li><li><p>Wrote the calculation logic to ensure the \"Total Payable\" amount updates automatically once a scholarship is saved.</p></li><li><p>Integrated a validation check to make sure the concession amount doesn\'t exceed the actual total fee of the student.</p></li></ul><p></p>', '2026-03-31 12:42:36', '2026-03-31 12:42:36'),
(395, 252, 269, '<p>Adding some Internal Updates</p><ul><li><p>Add user notification preferences and real-time notification handling</p></li><li><p>Improved user session integrity.</p></li><li><p>Updated user notification settings.</p></li><li><p>Improve to listen for real-time notifications via Pusher.</p></li><li><p>Added delivery tracking to notifications with new columns in the notifications table.</p></li><li><p>Introduced settings page for users to configure notification preferences (email, SMS, WhatsApp).</p></li><li><p>Added session_id column to users table for session management.</p></li></ul><p></p>', '2026-03-31 12:47:35', '2026-03-31 12:47:35'),
(396, 253, 266, '<ul><li><p>Webview configure and redirect url setup and send release bundle to bhanu sir</p></li></ul><p></p>', '2026-04-01 12:24:30', '2026-04-01 12:24:30'),
(397, 253, 272, '<ul><li><p>Redesign the screen for login</p></li><li><p>calendar screen</p></li><li><p>profile screen</p></li></ul><p></p>', '2026-04-01 12:24:30', '2026-04-01 12:24:30'),
(398, 254, 273, '<p>Here’s a summary of today’s work fransalian and galsi app:</p><ul><li><p>Debugged and resolved UI issues for empty profile icon in both apps.</p></li><li><p>Optimized layout structure and improved widget performance.</p></li><li><p>Configure firebase in the project for remote and notification.</p></li><li><p>Setup and make the apps for ios release.</p></li><li><p>Test and fill up the form questionaries in the app store connect.</p></li><li><p>Publish the apps.</p></li></ul><p></p><p></p>', '2026-04-01 12:29:44', '2026-04-01 12:29:44'),
(399, 255, 270, '<ul><li><p>Created Job Application form with validation check.</p></li><li><p>On submit sending email to the client email as requested with resume attachment</p></li><li><p>Added redirect on pop up to the form on click</p></li></ul><p></p>', '2026-04-01 12:36:12', '2026-04-01 12:36:12'),
(400, 255, 274, '<ul><li><p>Updated Images in banner slider and other section in the home page.</p></li><li><p>Created About us, Principals Desk and Mission&amp;Vision Page.</p></li></ul><p></p>', '2026-04-01 12:36:12', '2026-04-01 12:36:12'),
(401, 256, 269, '<p>Improve task and client data endpoints with additional statistics and relationships</p>', '2026-04-01 12:58:17', '2026-04-01 12:58:17'),
(402, 256, 278, '<p>In some branch the admin made some wrong entry which has been fixed on request. Got a new update for Consignment Number, which was added. </p>', '2026-04-01 12:58:17', '2026-04-01 12:58:17'),
(403, 257, 268, '<ul><li><p><strong>Fee Auditing</strong>: I double-checked the fee data to make sure scholarships are hitting the right base amounts.</p></li><li><p><strong>Master Rules</strong>: Built the core \"Scholarship Master\" so admins can now define specific discount rules.</p></li><li><p><strong>Full CRUD</strong>: Finished the Save, Update, and Delete functions for all scholarship settings.</p></li><li><p><strong>Student Mapping</strong>: Added the logic to assign these specific rules to individual students easily.</p></li><li><p><strong>Calculation Check</strong>: Verified that any change in the master rule instantly updates the student\'s total payable.</p></li><li><p><strong>Error Prevention</strong>: Put in validations to stop any duplicate or conflicting scholarship entries.</p></li></ul><p></p>', '2026-04-01 13:28:09', '2026-04-01 13:28:09'),
(404, 257, 280, '<ul><li><p><strong>Dynamic Reports</strong>: Finished the engine that lets users pull custom, flexible reports.</p></li><li><p><strong>Code Cleanup</strong>: Did a final polish on the reporting logic to keep things fast and bug-free.</p></li><li><p><strong>Git Push</strong>: Successfully uploaded all the latest code to the repository.</p></li><li><p><strong>Final Submission</strong>: Handed everything over to Bhanu Sir for the final review.</p></li></ul><p></p>', '2026-04-01 13:28:09', '2026-04-01 13:28:09'),
(405, 258, 287, NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(406, 258, 289, NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(407, 258, 292, NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(408, 258, 293, NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(409, 258, 296, NULL, '2026-04-02 11:28:02', '2026-04-02 11:28:02'),
(410, 259, 297, NULL, '2026-04-02 12:05:45', '2026-04-02 12:05:45'),
(411, 259, 298, NULL, '2026-04-02 12:05:45', '2026-04-02 12:05:45'),
(412, 260, 301, NULL, '2026-04-02 12:05:50', '2026-04-02 12:05:50'),
(413, 260, 302, NULL, '2026-04-02 12:05:50', '2026-04-02 12:05:50'),
(414, 260, 303, NULL, '2026-04-02 12:05:50', '2026-04-02 12:05:50'),
(415, 261, 281, '<p>Please find below the summary of my work for today:</p><p></p><ul><li><p>Debugged issues in the Flutter application and resolved multiple runtime errors.</p></li><li><p>Worked on fixing iOS-related issues and ensured proper build configuration.</p></li><li><p>Successfully generated iOS release builds for the applications.</p></li><li><p>Addressed App Store Connect submission issues, including resolving metadata errors.</p></li></ul><ul><li><p>Verified build stability for iOS release.</p></li><li><p>Prepared the app for submission and handled review-related errors.</p></li></ul><p></p>', '2026-04-02 12:25:45', '2026-04-02 12:25:45'),
(416, 261, 291, '<ul><li><p>Debugged issues in the Flutter application and resolved multiple runtime errors.</p></li><li><p>Worked on fixing iOS-related issues and ensured proper build configuration.</p></li><li><p>Successfully generated iOS release builds for the applications.</p></li></ul><p></p>', '2026-04-02 12:25:45', '2026-04-02 12:25:45'),
(417, 262, 274, '<ul><li><p>Worked on Academics Section : Academics Overview , Facilities &amp; Services Pages.</p></li><li><p>Worked On Contact us Page.</p></li></ul><p><br>MHS Geetanagar:</p><ul><li><p>Added Readmission Section in Admission Page section.</p></li></ul><p></p>', '2026-04-02 12:26:35', '2026-04-02 12:26:35'),
(418, 263, 266, '<p>Resolve the issue with the keystore and send the updated bundle and forwarded to bhanu sir</p>', '2026-04-02 12:27:15', '2026-04-02 12:27:15'),
(419, 263, 285, '<ul><li><p>Created a new project with the updated version</p></li><li><p>updated and generated icons and the login screen of app</p></li><li><p>implemented overall log for all the api calls for easier debug.</p></li><li><p>made all the updates from the rest of the app</p></li><li><p>firebase configure and fcm tes</p></li></ul><p></p>', '2026-04-02 12:27:15', '2026-04-02 12:27:15'),
(420, 264, 268, '<p>​RAM Upgrade: I installed a new 8GB RAM stick to rule out memory exhaustion or faulty modules as the cause of the crashes.</p><p>​Fresh OS Install: I performed a clean installation of Windows to eliminate any software bugs, corrupted drivers, or malware.</p><p>​Persistent Issue: Despite the new hardware and fresh software, the system is still rebooting unexpectedly.</p><p>​Hardware Deep-Dive: Since the basic fixes didn\'t work, I\'m now shifting focus to potential motherboard, power supply (PSU), or overheating issues.</p>', '2026-04-02 12:40:48', '2026-04-02 12:40:48'),
(421, 265, 269, '<p>Editable task milestone, updated estimate hour input, Added Assign employee while task create, updates whatsapp notification</p>', '2026-04-02 12:48:44', '2026-04-02 12:48:44'),
(422, 266, 310, NULL, '2026-04-03 11:31:44', '2026-04-03 11:31:44'),
(423, 266, 314, NULL, '2026-04-03 11:31:44', '2026-04-03 11:31:44'),
(424, 266, 324, NULL, '2026-04-03 11:31:44', '2026-04-03 11:31:44'),
(426, 268, 326, NULL, '2026-04-03 12:21:25', '2026-04-03 12:21:25'),
(427, 269, 315, NULL, '2026-04-03 12:24:07', '2026-04-03 12:24:07'),
(428, 269, 316, NULL, '2026-04-03 12:24:07', '2026-04-03 12:24:07'),
(429, 270, 307, '<p>Please find below the summary of today’s work:</p><p></p><p>• Identified and analyzed App Store validation errors during iOS app submission<br>• Fixed app icon issue by removing alpha channel and ensuring compliance with Apple guidelines<br>• Updated app version and build number to resolve pre-release and versioning issues<br>• Worked on resolving missing dSYM files for Razorpay and other frameworks<br>• Cleaned and rebuilt the iOS project to ensure proper archive generation</p>', '2026-04-03 12:25:50', '2026-04-03 12:25:50'),
(430, 270, 325, '<p>Please find below the summary of today’s work:</p><p></p><ol><li><p>Set-up and configure background and push notification the project.</p></li><li><p>Generate and configure app icons for ios for landing and search icon.</p></li><li><p>Upload and publish the app in the apple app store connect.</p></li><li><p>Configure and setup the app store console for release. </p></li></ol><p></p>', '2026-04-03 12:25:50', '2026-04-03 12:25:50'),
(431, 271, 269, '<p>My TaskCards: added prority flag,<br><br>Notification: Additional notification to Admin on task completion. notifications for support team</p>', '2026-04-03 12:48:22', '2026-04-03 12:48:22'),
(432, 271, 309, '<p>Fixed data loading for previous sessions</p>', '2026-04-03 12:48:22', '2026-04-03 12:48:22'),
(433, 272, 268, '<p>SQL Server Installation: Got the SQL Server back up and running on the fresh Windows install to restore the local database environment.</p><p>Visual Studio Setup: Reinstalled Visual Studio and configured all the necessary .NET workloads to get back to coding.</p><p>Environment Config: Spent time setting up the connection strings and environment variables to point to the new local server.</p><p>Repository Sync: Re-cloned the project repositories and verified that the build process is working smoothly on the new set up.</p><p></p>', '2026-04-03 12:52:39', '2026-04-03 12:52:39'),
(434, 272, 318, '<p>Dynamic Selection: I updated the Admission Form so users can now manually select the specific Academic Year for new entries.</p><p>Fee Mapping: Tied the admission logic to the selected year so the system pulls the correct Admission Fees automatically.</p><p>Support &amp; Fixes: Resolved several pending admission issues that were blocking the registration process for new students.</p><p>Validation: Added a check to ensure student data is being saved under the correct academic cycle to avoid reporting errors later</p>', '2026-04-03 12:52:39', '2026-04-03 12:52:39'),
(435, 273, 352, NULL, '2026-04-04 07:37:35', '2026-04-04 07:37:35'),
(436, 273, 353, NULL, '2026-04-04 07:37:35', '2026-04-04 07:37:35'),
(437, 274, 345, NULL, '2026-04-04 08:09:09', '2026-04-04 08:09:09'),
(438, 274, 346, NULL, '2026-04-04 08:09:09', '2026-04-04 08:09:09'),
(439, 274, 348, NULL, '2026-04-04 08:09:09', '2026-04-04 08:09:09'),
(440, 275, 356, '<p>Did 15 cold calling to silchar school out of which 8 schools responded.</p>', '2026-04-04 08:20:10', '2026-04-04 08:20:10'),
(441, 275, 357, '<p>completed data fetching on silchar schools and emailing</p>', '2026-04-04 08:20:10', '2026-04-04 08:20:10'),
(442, 276, 336, '<p>Here is the summary of my work for today:</p><ul><li><p>Api Testing in the app for data and optimization</p></li><li><p>Tested the application on multiple devices to ensure UI consistency.</p></li><li><p>Add re-admission functionality in the app</p></li><li><p>configure firebase for push notification.</p></li></ul><p></p><p>SFS Dhemaji :</p><p></p><ol><li><p>Solve the issue of the metadata in the apple app console and republish it</p></li></ol><p></p>', '2026-04-04 08:23:30', '2026-04-04 08:23:30'),
(443, 277, 308, '<ul><li><p>Created two UI screens from the dashboard module: Birthday List screen and Parish Dashboard/Home screen.</p></li><li><p>Designed the Birthday List screen to show priests’ birthdays in a month-wise organized list.</p></li><li><p>Designed the Parish Dashboard/Home screen with quick access to important parish modules.</p></li></ul><p></p>', '2026-04-04 08:27:31', '2026-04-04 08:27:31'),
(445, 279, 274, '<ul><li><p>Implemented Gallery functionality in WordPress using a plugin, enabling album creation and image uploads for structured media display.</p></li><li><p>Added an Enquiry Form on the Contact page using a WordPress plugin, allowing users to submit queries.</p></li></ul><p></p>', '2026-04-04 08:35:47', '2026-04-04 08:35:47'),
(446, 280, 299, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(447, 280, 344, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(448, 280, 347, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(449, 280, 350, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(450, 280, 351, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(451, 280, 354, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(452, 280, 355, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(453, 281, 299, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(454, 281, 344, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(455, 281, 347, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(456, 281, 350, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(457, 281, 351, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(458, 281, 354, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(459, 281, 355, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(460, 282, 299, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(461, 282, 344, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(462, 282, 347, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(463, 282, 350, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(464, 282, 351, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(465, 282, 354, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(466, 282, 355, NULL, '2026-04-04 08:39:22', '2026-04-04 08:39:22'),
(467, 283, 269, '<p>Update in workload matrix, CSRF issue fixed, Updating Timeline events (inprogress)</p>', '2026-04-04 09:04:40', '2026-04-04 09:04:40'),
(468, 283, 343, '<p>Consignment number format update for Guwahati branch</p>', '2026-04-04 09:04:40', '2026-04-04 09:04:40'),
(469, 284, 268, '<ul><li><p>I integrated the <strong>Scholarship section</strong> into both the Admission and Fees modules to handle discounts from the start.</p></li><li><p>Set up the logic to manage <strong>two distinct fee structures</strong>, ensuring the system knows which one to apply to each student.</p></li><li><p>Made sure the scholarship amount correctly offsets the specific fee categories within both structures.</p></li><li><p>Updated the UI so the selected fee type and applied scholarship are clearly visible during the admission process.</p></li></ul><p></p>', '2026-04-04 09:15:13', '2026-04-04 09:15:13'),
(470, 284, 335, NULL, '2026-04-04 09:15:13', '2026-04-04 09:15:13'),
(471, 285, 374, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(472, 285, 375, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(473, 285, 376, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(474, 285, 377, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(475, 285, 378, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(476, 285, 379, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(477, 285, 381, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(478, 285, 382, NULL, '2026-04-06 11:30:53', '2026-04-06 11:30:53'),
(479, 286, 361, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(480, 286, 362, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(481, 286, 363, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(482, 287, 361, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(483, 287, 362, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(484, 287, 363, NULL, '2026-04-06 12:23:45', '2026-04-06 12:23:45'),
(485, 288, 386, NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(486, 288, 387, NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(487, 288, 388, NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(488, 288, 389, NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(489, 288, 390, NULL, '2026-04-06 12:25:41', '2026-04-06 12:25:41'),
(490, 289, 269, '<ul><li><p>Added sort filters on tasks list.</p></li><li><p>Increased Task Attachment input file size.</p></li><li><p>Added all employee progress panel.</p></li></ul><p></p>', '2026-04-06 12:57:15', '2026-04-06 12:57:15'),
(491, 289, 334, NULL, '2026-04-06 12:57:15', '2026-04-06 12:57:15'),
(492, 290, 335, '<p>I\'ve officially wrapped up the Concession module, including the full reporting side of it.</p><p></p><p>Integrated the concession logic into the Admission Fee section so discounts apply the moment a student joins.</p><p>Made sure the system handles concessions for Installment payments as well, automatically adjusting each balance.</p><p></p><p>Updated the Fee Collection module to show the discounted amount and the original fee side-by-side.</p><p></p><p>Ran tests on the collection reports to verify that the total received and the concession given are both tracking correctly.</p><p></p><p>Checked that the student’s ledger stays accurate after a concession is applied to an existing installment plan.</p><p></p>', '2026-04-06 14:12:16', '2026-04-06 14:12:16');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'web',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `level` int(10) UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `guard_name`, `description`, `is_default`, `level`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'super-admin', 'web', 'Full system access', 0, 10, NULL, NULL),
(2, 'Administrator', 'admin', 'web', 'System administrator with most permissions', 0, 8, NULL, NULL),
(3, 'Manager', 'manager', 'web', 'Department manager with team management permissions', 0, 6, NULL, NULL),
(4, 'Team Lead', 'team-lead', 'web', 'Team lead with review and assignment permissions', 0, 4, NULL, NULL),
(5, 'Developer', 'developer', 'web', 'Developer with task management permissions', 0, 2, NULL, NULL),
(6, 'IT-Support', 'support-agent', 'web', 'Support agent with ticket management permissions', 0, 2, NULL, '2026-04-01 11:09:49'),
(7, 'hr', 'hr', 'web', NULL, 0, 3, '2026-04-01 11:11:01', '2026-04-01 11:11:01'),
(8, 'Sales', 'sales', 'web', NULL, 0, 2, '2026-04-01 11:47:06', '2026-04-01 11:47:06');

-- --------------------------------------------------------

--
-- Table structure for table `role_menu_items`
--

CREATE TABLE `role_menu_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `menu_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_menu_items`
--

INSERT INTO `role_menu_items` (`id`, `role_id`, `menu_key`, `is_allowed`, `created_at`, `updated_at`) VALUES
(1, 3, 'organization.departments', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(2, 3, 'organization.products', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(3, 3, 'organization.projects', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(4, 3, 'organization.employees', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(5, 3, 'organization.clients', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(6, 3, 'tasks.tickets', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(7, 3, 'tasks.tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(8, 3, 'tasks.task-reports', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(9, 3, 'tasks.workload-matrix', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(10, 3, 'tasks.my-tasks', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(11, 3, 'security.roles-permissions', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(12, 3, 'system.notifications', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(13, 4, 'organization.departments', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(14, 4, 'organization.products', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(15, 4, 'organization.projects', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(16, 4, 'organization.employees', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(17, 4, 'organization.clients', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(18, 4, 'tasks.tickets', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(19, 4, 'tasks.tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(20, 4, 'tasks.task-reports', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(21, 4, 'tasks.workload-matrix', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(22, 4, 'tasks.my-tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(23, 4, 'security.roles-permissions', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(24, 4, 'system.notifications', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(25, 5, 'organization.departments', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(26, 5, 'organization.products', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(27, 5, 'organization.projects', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(28, 5, 'organization.employees', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(29, 5, 'organization.clients', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(30, 5, 'tasks.tickets', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(31, 5, 'tasks.tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(32, 5, 'tasks.task-reports', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(33, 5, 'tasks.workload-matrix', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(34, 5, 'tasks.my-tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(35, 5, 'security.roles-permissions', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(36, 5, 'system.notifications', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(37, 6, 'organization.departments', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(38, 6, 'organization.products', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(39, 6, 'organization.projects', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(40, 6, 'organization.employees', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(41, 6, 'organization.clients', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(42, 6, 'tasks.tickets', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(43, 6, 'tasks.tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(44, 6, 'tasks.task-reports', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(45, 6, 'tasks.workload-matrix', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(46, 6, 'tasks.my-tasks', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(47, 6, 'security.roles-permissions', 0, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(48, 6, 'system.notifications', 1, '2026-03-18 09:02:55', '2026-04-02 06:59:36'),
(97, 7, 'organization.departments', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(98, 7, 'organization.products', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(99, 7, 'organization.projects', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(100, 7, 'organization.employees', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(101, 7, 'organization.clients', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(102, 7, 'tasks.tickets', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(103, 7, 'tasks.tasks', 0, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(104, 7, 'tasks.task-reports', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(105, 7, 'tasks.workload-matrix', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(106, 7, 'tasks.my-tasks', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(107, 7, 'security.roles-permissions', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(108, 7, 'system.notifications', 1, '2026-04-01 11:33:04', '2026-04-02 06:59:36'),
(217, 8, 'organization.departments', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(218, 8, 'organization.products', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(219, 8, 'organization.projects', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(220, 8, 'organization.employees', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(221, 8, 'organization.clients', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(222, 8, 'tasks.tickets', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(223, 8, 'tasks.tasks', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(224, 8, 'tasks.task-reports', 1, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(225, 8, 'tasks.workload-matrix', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(226, 8, 'tasks.my-tasks', 1, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(227, 8, 'security.roles-permissions', 0, '2026-04-01 12:16:21', '2026-04-02 06:59:36'),
(228, 8, 'system.notifications', 1, '2026-04-01 12:16:21', '2026-04-02 06:59:36');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, NULL),
(2, 1, 4, NULL, NULL),
(3, 1, 2, NULL, NULL),
(4, 1, 3, NULL, NULL),
(5, 1, 5, NULL, NULL),
(6, 1, 6, NULL, NULL),
(7, 1, 321, NULL, NULL),
(8, 1, 320, NULL, NULL),
(9, 1, 256, NULL, NULL),
(10, 1, 268, NULL, NULL),
(11, 1, 271, NULL, NULL),
(12, 1, 269, NULL, NULL),
(13, 1, 270, NULL, NULL),
(14, 1, 267, NULL, NULL),
(15, 1, 263, NULL, NULL),
(16, 1, 266, NULL, NULL),
(17, 1, 264, NULL, NULL),
(18, 1, 265, NULL, NULL),
(19, 1, 262, NULL, NULL),
(20, 1, 241, NULL, NULL),
(21, 1, 11, NULL, NULL),
(22, 1, 12, NULL, NULL),
(23, 1, 7, NULL, NULL),
(24, 1, 10, NULL, NULL),
(25, 1, 309, NULL, NULL),
(26, 1, 8, NULL, NULL),
(27, 1, 9, NULL, NULL),
(28, 1, 16, NULL, NULL),
(29, 1, 13, NULL, NULL),
(30, 1, 14, NULL, NULL),
(31, 1, 15, NULL, NULL),
(32, 1, 17, NULL, NULL),
(33, 1, 18, NULL, NULL),
(34, 1, 247, NULL, NULL),
(35, 1, 245, NULL, NULL),
(36, 1, 246, NULL, NULL),
(37, 1, 250, NULL, NULL),
(38, 1, 23, NULL, NULL),
(39, 1, 24, NULL, NULL),
(40, 1, 19, NULL, NULL),
(41, 1, 22, NULL, NULL),
(42, 1, 308, NULL, NULL),
(43, 1, 20, NULL, NULL),
(44, 1, 21, NULL, NULL),
(45, 1, 25, NULL, NULL),
(46, 1, 28, NULL, NULL),
(47, 1, 26, NULL, NULL),
(48, 1, 27, NULL, NULL),
(49, 1, 29, NULL, NULL),
(50, 1, 30, NULL, NULL),
(51, 1, 244, NULL, NULL),
(52, 1, 35, NULL, NULL),
(53, 1, 36, NULL, NULL),
(54, 1, 31, NULL, NULL),
(55, 1, 34, NULL, NULL),
(56, 1, 32, NULL, NULL),
(57, 1, 33, NULL, NULL),
(58, 1, 273, NULL, NULL),
(59, 1, 272, NULL, NULL),
(60, 1, 243, NULL, NULL),
(61, 1, 37, NULL, NULL),
(62, 1, 41, NULL, NULL),
(63, 1, 42, NULL, NULL),
(64, 1, 40, NULL, NULL),
(65, 1, 38, NULL, NULL),
(66, 1, 39, NULL, NULL),
(67, 1, 43, NULL, NULL),
(68, 1, 46, NULL, NULL),
(69, 1, 44, NULL, NULL),
(70, 1, 45, NULL, NULL),
(71, 1, 47, NULL, NULL),
(72, 1, 48, NULL, NULL),
(73, 1, 242, NULL, NULL),
(74, 1, 277, NULL, NULL),
(75, 1, 49, NULL, NULL),
(76, 1, 52, NULL, NULL),
(77, 1, 50, NULL, NULL),
(78, 1, 51, NULL, NULL),
(79, 1, 53, NULL, NULL),
(80, 1, 54, NULL, NULL),
(81, 1, 59, NULL, NULL),
(82, 1, 60, NULL, NULL),
(83, 1, 55, NULL, NULL),
(84, 1, 58, NULL, NULL),
(85, 1, 56, NULL, NULL),
(86, 1, 57, NULL, NULL),
(87, 1, 276, NULL, NULL),
(88, 1, 275, NULL, NULL),
(89, 1, 284, NULL, NULL),
(90, 1, 281, NULL, NULL),
(91, 1, 282, NULL, NULL),
(92, 1, 280, NULL, NULL),
(93, 1, 283, NULL, NULL),
(94, 1, 279, NULL, NULL),
(95, 1, 65, NULL, NULL),
(96, 1, 66, NULL, NULL),
(97, 1, 285, NULL, NULL),
(98, 1, 67, NULL, NULL),
(99, 1, 70, NULL, NULL),
(100, 1, 68, NULL, NULL),
(101, 1, 69, NULL, NULL),
(102, 1, 71, NULL, NULL),
(103, 1, 73, NULL, NULL),
(104, 1, 76, NULL, NULL),
(105, 1, 74, NULL, NULL),
(106, 1, 75, NULL, NULL),
(107, 1, 77, NULL, NULL),
(108, 1, 79, NULL, NULL),
(109, 1, 82, NULL, NULL),
(110, 1, 80, NULL, NULL),
(111, 1, 81, NULL, NULL),
(112, 1, 83, NULL, NULL),
(113, 1, 258, NULL, NULL),
(114, 1, 261, NULL, NULL),
(115, 1, 259, NULL, NULL),
(116, 1, 260, NULL, NULL),
(117, 1, 257, NULL, NULL),
(118, 1, 61, NULL, NULL),
(119, 1, 64, NULL, NULL),
(120, 1, 62, NULL, NULL),
(121, 1, 63, NULL, NULL),
(122, 1, 72, NULL, NULL),
(123, 1, 78, NULL, NULL),
(124, 1, 84, NULL, NULL),
(125, 1, 85, NULL, NULL),
(126, 1, 88, NULL, NULL),
(127, 1, 86, NULL, NULL),
(128, 1, 87, NULL, NULL),
(129, 1, 89, NULL, NULL),
(130, 1, 90, NULL, NULL),
(131, 1, 91, NULL, NULL),
(132, 1, 94, NULL, NULL),
(133, 1, 92, NULL, NULL),
(134, 1, 93, NULL, NULL),
(135, 1, 95, NULL, NULL),
(136, 1, 96, NULL, NULL),
(137, 1, 255, NULL, NULL),
(138, 1, 254, NULL, NULL),
(139, 1, 102, NULL, NULL),
(140, 1, 317, NULL, NULL),
(141, 1, 319, NULL, NULL),
(142, 1, 316, NULL, NULL),
(143, 1, 315, NULL, NULL),
(144, 1, 318, NULL, NULL),
(145, 1, 314, NULL, NULL),
(146, 1, 103, NULL, NULL),
(147, 1, 106, NULL, NULL),
(148, 1, 104, NULL, NULL),
(149, 1, 105, NULL, NULL),
(150, 1, 107, NULL, NULL),
(151, 1, 108, NULL, NULL),
(152, 1, 97, NULL, NULL),
(153, 1, 100, NULL, NULL),
(154, 1, 98, NULL, NULL),
(155, 1, 99, NULL, NULL),
(156, 1, 101, NULL, NULL),
(157, 1, 109, NULL, NULL),
(158, 1, 112, NULL, NULL),
(159, 1, 110, NULL, NULL),
(160, 1, 111, NULL, NULL),
(161, 1, 113, NULL, NULL),
(162, 1, 114, NULL, NULL),
(163, 1, 310, NULL, NULL),
(164, 1, 313, NULL, NULL),
(165, 1, 311, NULL, NULL),
(166, 1, 312, NULL, NULL),
(167, 1, 115, NULL, NULL),
(168, 1, 118, NULL, NULL),
(169, 1, 116, NULL, NULL),
(170, 1, 117, NULL, NULL),
(171, 1, 119, NULL, NULL),
(172, 1, 120, NULL, NULL),
(173, 1, 340, NULL, NULL),
(174, 1, 339, NULL, NULL),
(175, 1, 338, NULL, NULL),
(176, 1, 124, NULL, NULL),
(177, 1, 133, NULL, NULL),
(178, 1, 136, NULL, NULL),
(179, 1, 137, NULL, NULL),
(180, 1, 145, NULL, NULL),
(181, 1, 148, NULL, NULL),
(182, 1, 147, NULL, NULL),
(183, 1, 149, NULL, NULL),
(184, 1, 157, NULL, NULL),
(185, 1, 160, NULL, NULL),
(186, 1, 158, NULL, NULL),
(187, 1, 159, NULL, NULL),
(188, 1, 161, NULL, NULL),
(189, 1, 163, NULL, NULL),
(190, 1, 167, NULL, NULL),
(191, 1, 286, NULL, NULL),
(192, 1, 292, NULL, NULL),
(193, 1, 298, NULL, NULL),
(194, 1, 288, NULL, NULL),
(195, 1, 289, NULL, NULL),
(196, 1, 297, NULL, NULL),
(197, 1, 121, NULL, NULL),
(198, 1, 301, NULL, NULL),
(199, 1, 299, NULL, NULL),
(200, 1, 122, NULL, NULL),
(201, 1, 287, NULL, NULL),
(202, 1, 294, NULL, NULL),
(203, 1, 295, NULL, NULL),
(204, 1, 296, NULL, NULL),
(205, 1, 290, NULL, NULL),
(206, 1, 293, NULL, NULL),
(207, 1, 123, NULL, NULL),
(208, 1, 291, NULL, NULL),
(209, 1, 125, NULL, NULL),
(210, 1, 300, NULL, NULL),
(211, 1, 126, NULL, NULL),
(212, 1, 127, NULL, NULL),
(213, 1, 130, NULL, NULL),
(214, 1, 128, NULL, NULL),
(215, 1, 129, NULL, NULL),
(216, 1, 131, NULL, NULL),
(217, 1, 132, NULL, NULL),
(218, 1, 334, NULL, NULL),
(219, 1, 337, NULL, NULL),
(220, 1, 335, NULL, NULL),
(221, 1, 336, NULL, NULL),
(222, 1, 134, NULL, NULL),
(223, 1, 135, NULL, NULL),
(224, 1, 138, NULL, NULL),
(225, 1, 139, NULL, NULL),
(226, 1, 142, NULL, NULL),
(227, 1, 140, NULL, NULL),
(228, 1, 141, NULL, NULL),
(229, 1, 143, NULL, NULL),
(230, 1, 144, NULL, NULL),
(231, 1, 146, NULL, NULL),
(232, 1, 150, NULL, NULL),
(233, 1, 151, NULL, NULL),
(234, 1, 154, NULL, NULL),
(235, 1, 152, NULL, NULL),
(236, 1, 153, NULL, NULL),
(237, 1, 155, NULL, NULL),
(238, 1, 156, NULL, NULL),
(239, 1, 162, NULL, NULL),
(240, 1, 326, NULL, NULL),
(241, 1, 329, NULL, NULL),
(242, 1, 327, NULL, NULL),
(243, 1, 328, NULL, NULL),
(244, 1, 166, NULL, NULL),
(245, 1, 164, NULL, NULL),
(246, 1, 165, NULL, NULL),
(247, 1, 168, NULL, NULL),
(248, 1, 330, NULL, NULL),
(249, 1, 333, NULL, NULL),
(250, 1, 331, NULL, NULL),
(251, 1, 332, NULL, NULL),
(252, 1, 169, NULL, NULL),
(253, 1, 172, NULL, NULL),
(254, 1, 170, NULL, NULL),
(255, 1, 171, NULL, NULL),
(256, 1, 173, NULL, NULL),
(257, 1, 174, NULL, NULL),
(258, 1, 175, NULL, NULL),
(259, 1, 178, NULL, NULL),
(260, 1, 176, NULL, NULL),
(261, 1, 177, NULL, NULL),
(262, 1, 179, NULL, NULL),
(263, 1, 180, NULL, NULL),
(264, 1, 181, NULL, NULL),
(265, 1, 184, NULL, NULL),
(266, 1, 182, NULL, NULL),
(267, 1, 183, NULL, NULL),
(268, 1, 185, NULL, NULL),
(269, 1, 186, NULL, NULL),
(270, 1, 199, NULL, NULL),
(271, 1, 202, NULL, NULL),
(272, 1, 201, NULL, NULL),
(273, 1, 203, NULL, NULL),
(274, 1, 303, NULL, NULL),
(275, 1, 302, NULL, NULL),
(276, 1, 187, NULL, NULL),
(277, 1, 190, NULL, NULL),
(278, 1, 305, NULL, NULL),
(279, 1, 188, NULL, NULL),
(280, 1, 304, NULL, NULL),
(281, 1, 189, NULL, NULL),
(282, 1, 191, NULL, NULL),
(283, 1, 192, NULL, NULL),
(284, 1, 193, NULL, NULL),
(285, 1, 196, NULL, NULL),
(286, 1, 194, NULL, NULL),
(287, 1, 195, NULL, NULL),
(288, 1, 197, NULL, NULL),
(289, 1, 198, NULL, NULL),
(290, 1, 200, NULL, NULL),
(291, 1, 204, NULL, NULL),
(292, 1, 205, NULL, NULL),
(293, 1, 208, NULL, NULL),
(294, 1, 206, NULL, NULL),
(295, 1, 207, NULL, NULL),
(296, 1, 209, NULL, NULL),
(297, 1, 210, NULL, NULL),
(298, 1, 211, NULL, NULL),
(299, 1, 214, NULL, NULL),
(300, 1, 212, NULL, NULL),
(301, 1, 213, NULL, NULL),
(302, 1, 215, NULL, NULL),
(303, 1, 216, NULL, NULL),
(304, 1, 322, NULL, NULL),
(305, 1, 325, NULL, NULL),
(306, 1, 323, NULL, NULL),
(307, 1, 324, NULL, NULL),
(308, 1, 217, NULL, NULL),
(309, 1, 220, NULL, NULL),
(310, 1, 218, NULL, NULL),
(311, 1, 219, NULL, NULL),
(312, 1, 221, NULL, NULL),
(313, 1, 222, NULL, NULL),
(314, 1, 248, NULL, NULL),
(315, 1, 249, NULL, NULL),
(316, 1, 251, NULL, NULL),
(317, 1, 278, NULL, NULL),
(318, 1, 252, NULL, NULL),
(319, 1, 253, NULL, NULL),
(320, 1, 227, NULL, NULL),
(321, 1, 228, NULL, NULL),
(322, 1, 223, NULL, NULL),
(323, 1, 226, NULL, NULL),
(324, 1, 307, NULL, NULL),
(325, 1, 306, NULL, NULL),
(326, 1, 224, NULL, NULL),
(327, 1, 225, NULL, NULL),
(328, 1, 229, NULL, NULL),
(329, 1, 232, NULL, NULL),
(330, 1, 230, NULL, NULL),
(331, 1, 231, NULL, NULL),
(332, 1, 233, NULL, NULL),
(333, 1, 234, NULL, NULL),
(334, 1, 274, NULL, NULL),
(335, 1, 235, NULL, NULL),
(336, 1, 238, NULL, NULL),
(337, 1, 236, NULL, NULL),
(338, 1, 237, NULL, NULL),
(339, 1, 239, NULL, NULL),
(340, 1, 240, NULL, NULL),
(341, 2, 121, NULL, NULL),
(342, 2, 122, NULL, NULL),
(343, 2, 123, NULL, NULL),
(344, 2, 286, NULL, NULL),
(345, 2, 287, NULL, NULL),
(346, 2, 288, NULL, NULL),
(347, 2, 289, NULL, NULL),
(348, 2, 290, NULL, NULL),
(349, 2, 291, NULL, NULL),
(350, 2, 292, NULL, NULL),
(351, 2, 293, NULL, NULL),
(352, 2, 294, NULL, NULL),
(353, 2, 295, NULL, NULL),
(354, 2, 296, NULL, NULL),
(355, 2, 297, NULL, NULL),
(356, 2, 298, NULL, NULL),
(357, 2, 125, NULL, NULL),
(358, 2, 126, NULL, NULL),
(359, 2, 300, NULL, NULL),
(360, 2, 301, NULL, NULL),
(361, 2, 187, NULL, NULL),
(362, 2, 188, NULL, NULL),
(363, 2, 189, NULL, NULL),
(364, 2, 190, NULL, NULL),
(365, 2, 302, NULL, NULL),
(366, 2, 303, NULL, NULL),
(367, 2, 304, NULL, NULL),
(368, 2, 191, NULL, NULL),
(369, 2, 192, NULL, NULL),
(370, 2, 305, NULL, NULL),
(371, 2, 223, NULL, NULL),
(372, 2, 224, NULL, NULL),
(373, 2, 225, NULL, NULL),
(374, 2, 226, NULL, NULL),
(375, 2, 306, NULL, NULL),
(376, 2, 307, NULL, NULL),
(377, 2, 31, NULL, NULL),
(378, 2, 32, NULL, NULL),
(379, 2, 33, NULL, NULL),
(380, 2, 34, NULL, NULL),
(381, 2, 19, NULL, NULL),
(382, 2, 20, NULL, NULL),
(383, 2, 21, NULL, NULL),
(384, 2, 22, NULL, NULL),
(385, 2, 308, NULL, NULL),
(386, 2, 7, NULL, NULL),
(387, 2, 8, NULL, NULL),
(388, 2, 9, NULL, NULL),
(389, 2, 10, NULL, NULL),
(390, 2, 309, NULL, NULL),
(391, 2, 55, NULL, NULL),
(392, 2, 56, NULL, NULL),
(393, 2, 57, NULL, NULL),
(394, 2, 58, NULL, NULL),
(395, 2, 61, NULL, NULL),
(396, 2, 62, NULL, NULL),
(397, 2, 63, NULL, NULL),
(398, 2, 64, NULL, NULL),
(399, 2, 310, NULL, NULL),
(400, 2, 311, NULL, NULL),
(401, 2, 312, NULL, NULL),
(402, 2, 313, NULL, NULL),
(403, 2, 314, NULL, NULL),
(404, 2, 315, NULL, NULL),
(405, 2, 316, NULL, NULL),
(406, 2, 317, NULL, NULL),
(407, 2, 318, NULL, NULL),
(408, 2, 319, NULL, NULL),
(409, 2, 320, NULL, NULL),
(410, 2, 321, NULL, NULL),
(411, 2, 322, NULL, NULL),
(412, 2, 323, NULL, NULL),
(413, 2, 324, NULL, NULL),
(414, 2, 325, NULL, NULL),
(415, 2, 326, NULL, NULL),
(416, 2, 327, NULL, NULL),
(417, 2, 328, NULL, NULL),
(418, 2, 329, NULL, NULL),
(419, 2, 330, NULL, NULL),
(420, 2, 331, NULL, NULL),
(421, 2, 332, NULL, NULL),
(422, 2, 333, NULL, NULL),
(423, 2, 334, NULL, NULL),
(424, 2, 335, NULL, NULL),
(425, 2, 336, NULL, NULL),
(426, 2, 337, NULL, NULL),
(427, 2, 38, NULL, NULL),
(428, 2, 39, NULL, NULL),
(429, 2, 40, NULL, NULL),
(430, 2, 338, NULL, NULL),
(431, 2, 339, NULL, NULL),
(432, 3, 121, NULL, NULL),
(433, 3, 122, NULL, NULL),
(434, 3, 123, NULL, NULL),
(435, 3, 286, NULL, NULL),
(436, 3, 287, NULL, NULL),
(437, 3, 288, NULL, NULL),
(438, 3, 289, NULL, NULL),
(439, 3, 290, NULL, NULL),
(440, 3, 291, NULL, NULL),
(441, 3, 292, NULL, NULL),
(442, 3, 293, NULL, NULL),
(443, 3, 294, NULL, NULL),
(444, 3, 295, NULL, NULL),
(445, 3, 296, NULL, NULL),
(446, 3, 297, NULL, NULL),
(447, 3, 298, NULL, NULL),
(448, 3, 125, NULL, NULL),
(449, 3, 126, NULL, NULL),
(450, 3, 300, NULL, NULL),
(451, 3, 301, NULL, NULL),
(452, 3, 187, NULL, NULL),
(453, 3, 188, NULL, NULL),
(454, 3, 189, NULL, NULL),
(455, 3, 302, NULL, NULL),
(456, 3, 303, NULL, NULL),
(457, 3, 304, NULL, NULL),
(458, 3, 191, NULL, NULL),
(459, 3, 192, NULL, NULL),
(460, 3, 305, NULL, NULL),
(461, 3, 224, NULL, NULL),
(462, 3, 225, NULL, NULL),
(463, 3, 306, NULL, NULL),
(464, 3, 32, NULL, NULL),
(465, 3, 33, NULL, NULL),
(466, 3, 20, NULL, NULL),
(467, 3, 21, NULL, NULL),
(468, 3, 308, NULL, NULL),
(469, 3, 8, NULL, NULL),
(470, 3, 9, NULL, NULL),
(471, 3, 56, NULL, NULL),
(472, 3, 62, NULL, NULL),
(473, 3, 311, NULL, NULL),
(474, 3, 314, NULL, NULL),
(475, 3, 315, NULL, NULL),
(476, 3, 317, NULL, NULL),
(477, 3, 318, NULL, NULL),
(478, 3, 320, NULL, NULL),
(479, 3, 323, NULL, NULL),
(480, 3, 327, NULL, NULL),
(481, 3, 331, NULL, NULL),
(482, 3, 335, NULL, NULL),
(483, 3, 38, NULL, NULL),
(484, 3, 39, NULL, NULL),
(485, 3, 338, NULL, NULL),
(486, 4, 121, NULL, NULL),
(487, 4, 122, NULL, NULL),
(488, 4, 123, NULL, NULL),
(489, 4, 286, NULL, NULL),
(490, 4, 287, NULL, NULL),
(491, 4, 288, NULL, NULL),
(492, 4, 290, NULL, NULL),
(493, 4, 291, NULL, NULL),
(494, 4, 292, NULL, NULL),
(495, 4, 293, NULL, NULL),
(496, 4, 294, NULL, NULL),
(497, 4, 295, NULL, NULL),
(498, 4, 296, NULL, NULL),
(499, 4, 297, NULL, NULL),
(500, 4, 298, NULL, NULL),
(501, 4, 125, NULL, NULL),
(502, 4, 126, NULL, NULL),
(503, 4, 300, NULL, NULL),
(504, 4, 187, NULL, NULL),
(505, 4, 188, NULL, NULL),
(506, 4, 189, NULL, NULL),
(507, 4, 302, NULL, NULL),
(508, 4, 303, NULL, NULL),
(509, 4, 304, NULL, NULL),
(510, 4, 191, NULL, NULL),
(511, 4, 192, NULL, NULL),
(512, 4, 224, NULL, NULL),
(513, 4, 225, NULL, NULL),
(514, 4, 32, NULL, NULL),
(515, 4, 20, NULL, NULL),
(516, 4, 8, NULL, NULL),
(517, 4, 56, NULL, NULL),
(518, 4, 62, NULL, NULL),
(519, 4, 314, NULL, NULL),
(520, 4, 317, NULL, NULL),
(521, 4, 320, NULL, NULL),
(522, 4, 323, NULL, NULL),
(523, 4, 327, NULL, NULL),
(524, 4, 331, NULL, NULL),
(525, 4, 335, NULL, NULL),
(526, 4, 38, NULL, NULL),
(527, 4, 39, NULL, NULL),
(528, 5, 121, NULL, NULL),
(529, 5, 122, NULL, NULL),
(530, 5, 123, NULL, NULL),
(531, 5, 290, NULL, NULL),
(532, 5, 291, NULL, NULL),
(533, 5, 292, NULL, NULL),
(534, 5, 293, NULL, NULL),
(535, 5, 294, NULL, NULL),
(536, 5, 297, NULL, NULL),
(537, 5, 298, NULL, NULL),
(538, 5, 126, NULL, NULL),
(539, 5, 300, NULL, NULL),
(540, 5, 188, NULL, NULL),
(541, 5, 192, NULL, NULL),
(542, 5, 224, NULL, NULL),
(543, 5, 32, NULL, NULL),
(544, 5, 20, NULL, NULL),
(545, 5, 8, NULL, NULL),
(546, 5, 56, NULL, NULL),
(547, 5, 62, NULL, NULL),
(548, 5, 314, NULL, NULL),
(549, 5, 317, NULL, NULL),
(550, 5, 318, NULL, NULL),
(551, 5, 319, NULL, NULL),
(552, 5, 320, NULL, NULL),
(553, 5, 323, NULL, NULL),
(554, 5, 322, NULL, NULL),
(555, 5, 324, NULL, NULL),
(556, 5, 327, NULL, NULL),
(557, 5, 326, NULL, NULL),
(558, 5, 328, NULL, NULL),
(559, 5, 331, NULL, NULL),
(560, 5, 330, NULL, NULL),
(561, 5, 332, NULL, NULL),
(562, 5, 335, NULL, NULL),
(563, 5, 334, NULL, NULL),
(564, 5, 336, NULL, NULL),
(565, 5, 38, NULL, NULL),
(566, 5, 39, NULL, NULL),
(609, 5, 286, NULL, NULL),
(610, 5, 287, NULL, NULL),
(611, 5, 288, NULL, NULL),
(612, 5, 289, NULL, NULL),
(613, 5, 299, NULL, NULL),
(614, 5, 301, NULL, NULL),
(615, 5, 127, NULL, NULL),
(616, 5, 145, NULL, NULL),
(617, 5, 146, NULL, NULL),
(741, 5, 1, NULL, NULL),
(742, 5, 2, NULL, NULL),
(743, 5, 3, NULL, NULL),
(744, 5, 4, NULL, NULL),
(745, 5, 5, NULL, NULL),
(746, 5, 6, NULL, NULL),
(747, 5, 13, NULL, NULL),
(748, 5, 14, NULL, NULL),
(749, 5, 15, NULL, NULL),
(750, 5, 16, NULL, NULL),
(751, 5, 17, NULL, NULL),
(752, 5, 18, NULL, NULL),
(753, 5, 37, NULL, NULL),
(754, 5, 40, NULL, NULL),
(755, 5, 41, NULL, NULL),
(756, 5, 42, NULL, NULL),
(757, 5, 91, NULL, NULL),
(758, 5, 92, NULL, NULL),
(759, 5, 93, NULL, NULL),
(760, 5, 94, NULL, NULL),
(761, 5, 95, NULL, NULL),
(762, 5, 96, NULL, NULL),
(763, 5, 97, NULL, NULL),
(764, 5, 98, NULL, NULL),
(765, 5, 99, NULL, NULL),
(766, 5, 100, NULL, NULL),
(767, 5, 101, NULL, NULL),
(768, 5, 102, NULL, NULL),
(769, 5, 103, NULL, NULL),
(770, 5, 104, NULL, NULL),
(771, 5, 105, NULL, NULL),
(772, 5, 106, NULL, NULL),
(773, 5, 107, NULL, NULL),
(774, 5, 108, NULL, NULL),
(775, 5, 124, NULL, NULL),
(776, 5, 125, NULL, NULL),
(777, 5, 295, NULL, NULL),
(778, 5, 296, NULL, NULL),
(779, 5, 128, NULL, NULL),
(780, 5, 129, NULL, NULL),
(781, 5, 130, NULL, NULL),
(782, 5, 131, NULL, NULL),
(783, 5, 132, NULL, NULL),
(784, 5, 133, NULL, NULL),
(785, 5, 134, NULL, NULL),
(786, 5, 135, NULL, NULL),
(787, 5, 136, NULL, NULL),
(788, 5, 137, NULL, NULL),
(789, 5, 138, NULL, NULL),
(790, 5, 139, NULL, NULL),
(791, 5, 140, NULL, NULL),
(792, 5, 141, NULL, NULL),
(793, 5, 142, NULL, NULL),
(794, 5, 143, NULL, NULL),
(795, 5, 144, NULL, NULL),
(796, 5, 147, NULL, NULL),
(797, 5, 148, NULL, NULL),
(798, 5, 149, NULL, NULL),
(799, 5, 150, NULL, NULL),
(800, 5, 151, NULL, NULL),
(801, 5, 152, NULL, NULL),
(802, 5, 153, NULL, NULL),
(803, 5, 154, NULL, NULL),
(804, 5, 155, NULL, NULL),
(805, 5, 156, NULL, NULL),
(806, 5, 157, NULL, NULL),
(807, 5, 158, NULL, NULL),
(808, 5, 159, NULL, NULL),
(809, 5, 160, NULL, NULL),
(810, 5, 161, NULL, NULL),
(811, 5, 162, NULL, NULL),
(812, 5, 163, NULL, NULL),
(813, 5, 164, NULL, NULL),
(814, 5, 165, NULL, NULL),
(815, 5, 166, NULL, NULL),
(816, 5, 167, NULL, NULL),
(817, 5, 168, NULL, NULL),
(818, 5, 169, NULL, NULL),
(819, 5, 170, NULL, NULL),
(820, 5, 171, NULL, NULL),
(821, 5, 172, NULL, NULL),
(822, 5, 173, NULL, NULL),
(823, 5, 174, NULL, NULL),
(824, 5, 175, NULL, NULL),
(825, 5, 176, NULL, NULL),
(826, 5, 177, NULL, NULL),
(827, 5, 178, NULL, NULL),
(828, 5, 179, NULL, NULL),
(829, 5, 180, NULL, NULL),
(830, 5, 181, NULL, NULL),
(831, 5, 182, NULL, NULL),
(832, 5, 183, NULL, NULL),
(833, 5, 184, NULL, NULL),
(834, 5, 185, NULL, NULL),
(835, 5, 186, NULL, NULL),
(836, 5, 187, NULL, NULL),
(837, 5, 189, NULL, NULL),
(838, 5, 190, NULL, NULL),
(839, 5, 191, NULL, NULL),
(840, 5, 302, NULL, NULL),
(841, 5, 303, NULL, NULL),
(842, 5, 304, NULL, NULL),
(843, 5, 305, NULL, NULL),
(844, 5, 193, NULL, NULL),
(845, 5, 194, NULL, NULL),
(846, 5, 195, NULL, NULL),
(847, 5, 196, NULL, NULL),
(848, 5, 197, NULL, NULL),
(849, 5, 198, NULL, NULL),
(850, 5, 199, NULL, NULL),
(851, 5, 200, NULL, NULL),
(852, 5, 201, NULL, NULL),
(853, 5, 202, NULL, NULL),
(854, 5, 203, NULL, NULL),
(855, 5, 204, NULL, NULL),
(856, 5, 205, NULL, NULL),
(857, 5, 206, NULL, NULL),
(858, 5, 207, NULL, NULL),
(859, 5, 208, NULL, NULL),
(860, 5, 209, NULL, NULL),
(861, 5, 210, NULL, NULL),
(862, 5, 211, NULL, NULL),
(863, 5, 212, NULL, NULL),
(864, 5, 213, NULL, NULL),
(865, 5, 214, NULL, NULL),
(866, 5, 215, NULL, NULL),
(867, 5, 216, NULL, NULL),
(868, 5, 217, NULL, NULL),
(869, 5, 218, NULL, NULL),
(870, 5, 219, NULL, NULL),
(871, 5, 220, NULL, NULL),
(872, 5, 221, NULL, NULL),
(873, 5, 222, NULL, NULL),
(874, 5, 225, NULL, NULL),
(875, 5, 228, NULL, NULL),
(876, 5, 235, NULL, NULL),
(877, 5, 236, NULL, NULL),
(878, 5, 237, NULL, NULL),
(879, 5, 238, NULL, NULL),
(880, 5, 239, NULL, NULL),
(881, 5, 240, NULL, NULL),
(882, 5, 242, NULL, NULL),
(883, 5, 243, NULL, NULL),
(884, 5, 256, NULL, NULL),
(885, 5, 257, NULL, NULL),
(886, 5, 258, NULL, NULL),
(887, 5, 259, NULL, NULL),
(888, 5, 260, NULL, NULL),
(889, 5, 261, NULL, NULL),
(890, 5, 262, NULL, NULL),
(891, 5, 263, NULL, NULL),
(892, 5, 264, NULL, NULL),
(893, 5, 265, NULL, NULL),
(894, 5, 266, NULL, NULL),
(895, 5, 267, NULL, NULL),
(896, 5, 268, NULL, NULL),
(897, 5, 269, NULL, NULL),
(898, 5, 270, NULL, NULL),
(899, 5, 271, NULL, NULL),
(900, 5, 274, NULL, NULL),
(901, 5, 275, NULL, NULL),
(902, 5, 277, NULL, NULL),
(903, 5, 315, NULL, NULL),
(904, 5, 316, NULL, NULL),
(905, 2, 1, NULL, NULL),
(906, 2, 2, NULL, NULL),
(907, 2, 3, NULL, NULL),
(908, 2, 4, NULL, NULL),
(909, 2, 5, NULL, NULL),
(910, 2, 6, NULL, NULL),
(911, 2, 11, NULL, NULL),
(912, 2, 12, NULL, NULL),
(913, 2, 13, NULL, NULL),
(914, 2, 14, NULL, NULL),
(915, 2, 15, NULL, NULL),
(916, 2, 16, NULL, NULL),
(917, 2, 17, NULL, NULL),
(918, 2, 18, NULL, NULL),
(919, 2, 23, NULL, NULL),
(920, 2, 24, NULL, NULL),
(921, 2, 25, NULL, NULL),
(922, 2, 26, NULL, NULL),
(923, 2, 27, NULL, NULL),
(924, 2, 28, NULL, NULL),
(925, 2, 29, NULL, NULL),
(926, 2, 30, NULL, NULL),
(927, 2, 35, NULL, NULL),
(928, 2, 36, NULL, NULL),
(929, 2, 37, NULL, NULL),
(930, 2, 41, NULL, NULL),
(931, 2, 42, NULL, NULL),
(932, 2, 43, NULL, NULL),
(933, 2, 44, NULL, NULL),
(934, 2, 45, NULL, NULL),
(935, 2, 46, NULL, NULL),
(936, 2, 47, NULL, NULL),
(937, 2, 48, NULL, NULL),
(938, 2, 49, NULL, NULL),
(939, 2, 50, NULL, NULL),
(940, 2, 51, NULL, NULL),
(941, 2, 52, NULL, NULL),
(942, 2, 53, NULL, NULL),
(943, 2, 54, NULL, NULL),
(944, 2, 59, NULL, NULL),
(945, 2, 60, NULL, NULL),
(946, 2, 65, NULL, NULL),
(947, 2, 66, NULL, NULL),
(948, 2, 279, NULL, NULL),
(949, 2, 280, NULL, NULL),
(950, 2, 281, NULL, NULL),
(951, 2, 282, NULL, NULL),
(952, 2, 283, NULL, NULL),
(953, 2, 284, NULL, NULL),
(954, 2, 285, NULL, NULL),
(955, 2, 67, NULL, NULL),
(956, 2, 68, NULL, NULL),
(957, 2, 69, NULL, NULL),
(958, 2, 70, NULL, NULL),
(959, 2, 71, NULL, NULL),
(960, 2, 72, NULL, NULL),
(961, 2, 73, NULL, NULL),
(962, 2, 74, NULL, NULL),
(963, 2, 75, NULL, NULL),
(964, 2, 76, NULL, NULL),
(965, 2, 77, NULL, NULL),
(966, 2, 78, NULL, NULL),
(967, 2, 79, NULL, NULL),
(968, 2, 80, NULL, NULL),
(969, 2, 81, NULL, NULL),
(970, 2, 82, NULL, NULL),
(971, 2, 83, NULL, NULL),
(972, 2, 84, NULL, NULL),
(973, 2, 85, NULL, NULL),
(974, 2, 86, NULL, NULL),
(975, 2, 87, NULL, NULL),
(976, 2, 88, NULL, NULL),
(977, 2, 89, NULL, NULL),
(978, 2, 90, NULL, NULL),
(979, 2, 91, NULL, NULL),
(980, 2, 92, NULL, NULL),
(981, 2, 93, NULL, NULL),
(982, 2, 94, NULL, NULL),
(983, 2, 95, NULL, NULL),
(984, 2, 96, NULL, NULL),
(985, 2, 97, NULL, NULL),
(986, 2, 98, NULL, NULL),
(987, 2, 99, NULL, NULL),
(988, 2, 100, NULL, NULL),
(989, 2, 101, NULL, NULL),
(990, 2, 102, NULL, NULL),
(991, 2, 103, NULL, NULL),
(992, 2, 104, NULL, NULL),
(993, 2, 105, NULL, NULL),
(994, 2, 106, NULL, NULL),
(995, 2, 107, NULL, NULL),
(996, 2, 108, NULL, NULL),
(997, 2, 109, NULL, NULL),
(998, 2, 110, NULL, NULL),
(999, 2, 111, NULL, NULL),
(1000, 2, 112, NULL, NULL),
(1001, 2, 113, NULL, NULL),
(1002, 2, 114, NULL, NULL),
(1003, 2, 115, NULL, NULL),
(1004, 2, 116, NULL, NULL),
(1005, 2, 117, NULL, NULL),
(1006, 2, 118, NULL, NULL),
(1007, 2, 119, NULL, NULL),
(1008, 2, 120, NULL, NULL),
(1009, 2, 124, NULL, NULL),
(1010, 2, 299, NULL, NULL),
(1011, 2, 127, NULL, NULL),
(1012, 2, 128, NULL, NULL),
(1013, 2, 129, NULL, NULL),
(1014, 2, 130, NULL, NULL),
(1015, 2, 131, NULL, NULL),
(1016, 2, 132, NULL, NULL),
(1017, 2, 133, NULL, NULL),
(1018, 2, 134, NULL, NULL),
(1019, 2, 135, NULL, NULL),
(1020, 2, 136, NULL, NULL),
(1021, 2, 137, NULL, NULL),
(1022, 2, 138, NULL, NULL),
(1023, 2, 139, NULL, NULL),
(1024, 2, 140, NULL, NULL),
(1025, 2, 141, NULL, NULL),
(1026, 2, 142, NULL, NULL),
(1027, 2, 143, NULL, NULL),
(1028, 2, 144, NULL, NULL),
(1029, 2, 145, NULL, NULL),
(1030, 2, 146, NULL, NULL),
(1031, 2, 147, NULL, NULL),
(1032, 2, 148, NULL, NULL),
(1033, 2, 149, NULL, NULL),
(1034, 2, 150, NULL, NULL),
(1035, 2, 151, NULL, NULL),
(1036, 2, 152, NULL, NULL),
(1037, 2, 153, NULL, NULL),
(1038, 2, 154, NULL, NULL),
(1039, 2, 155, NULL, NULL),
(1040, 2, 156, NULL, NULL),
(1041, 2, 157, NULL, NULL),
(1042, 2, 158, NULL, NULL),
(1043, 2, 159, NULL, NULL),
(1044, 2, 160, NULL, NULL),
(1045, 2, 161, NULL, NULL),
(1046, 2, 162, NULL, NULL),
(1047, 2, 163, NULL, NULL),
(1048, 2, 164, NULL, NULL),
(1049, 2, 165, NULL, NULL),
(1050, 2, 166, NULL, NULL),
(1051, 2, 167, NULL, NULL),
(1052, 2, 168, NULL, NULL),
(1053, 2, 169, NULL, NULL),
(1054, 2, 170, NULL, NULL),
(1055, 2, 171, NULL, NULL),
(1056, 2, 172, NULL, NULL),
(1057, 2, 173, NULL, NULL),
(1058, 2, 174, NULL, NULL),
(1059, 2, 175, NULL, NULL),
(1060, 2, 176, NULL, NULL),
(1061, 2, 177, NULL, NULL),
(1062, 2, 178, NULL, NULL),
(1063, 2, 179, NULL, NULL),
(1064, 2, 180, NULL, NULL),
(1065, 2, 181, NULL, NULL),
(1066, 2, 182, NULL, NULL),
(1067, 2, 183, NULL, NULL),
(1068, 2, 184, NULL, NULL),
(1069, 2, 185, NULL, NULL),
(1070, 2, 186, NULL, NULL),
(1071, 2, 193, NULL, NULL),
(1072, 2, 194, NULL, NULL),
(1073, 2, 195, NULL, NULL),
(1074, 2, 196, NULL, NULL),
(1075, 2, 197, NULL, NULL),
(1076, 2, 198, NULL, NULL),
(1077, 2, 199, NULL, NULL),
(1078, 2, 200, NULL, NULL),
(1079, 2, 201, NULL, NULL),
(1080, 2, 202, NULL, NULL),
(1081, 2, 203, NULL, NULL),
(1082, 2, 204, NULL, NULL),
(1083, 2, 205, NULL, NULL),
(1084, 2, 206, NULL, NULL),
(1085, 2, 207, NULL, NULL),
(1086, 2, 208, NULL, NULL),
(1087, 2, 209, NULL, NULL),
(1088, 2, 210, NULL, NULL),
(1089, 2, 211, NULL, NULL),
(1090, 2, 212, NULL, NULL),
(1091, 2, 213, NULL, NULL),
(1092, 2, 214, NULL, NULL),
(1093, 2, 215, NULL, NULL),
(1094, 2, 216, NULL, NULL),
(1095, 2, 217, NULL, NULL),
(1096, 2, 218, NULL, NULL),
(1097, 2, 219, NULL, NULL),
(1098, 2, 220, NULL, NULL),
(1099, 2, 221, NULL, NULL),
(1100, 2, 222, NULL, NULL),
(1101, 2, 227, NULL, NULL),
(1102, 2, 228, NULL, NULL),
(1103, 2, 235, NULL, NULL),
(1104, 2, 236, NULL, NULL),
(1105, 2, 237, NULL, NULL),
(1106, 2, 238, NULL, NULL),
(1107, 2, 239, NULL, NULL),
(1108, 2, 240, NULL, NULL),
(1109, 2, 256, NULL, NULL),
(1110, 2, 340, NULL, NULL),
(1111, 2, 277, NULL, NULL),
(1112, 2, 275, NULL, NULL),
(1113, 2, 276, NULL, NULL),
(1114, 2, 274, NULL, NULL),
(1115, 2, 272, NULL, NULL),
(1116, 2, 273, NULL, NULL),
(1117, 2, 267, NULL, NULL),
(1118, 2, 268, NULL, NULL),
(1119, 2, 269, NULL, NULL),
(1120, 2, 270, NULL, NULL),
(1121, 2, 271, NULL, NULL),
(1122, 2, 262, NULL, NULL),
(1123, 2, 263, NULL, NULL),
(1124, 2, 264, NULL, NULL),
(1125, 2, 265, NULL, NULL),
(1126, 2, 266, NULL, NULL),
(1127, 3, 1, NULL, NULL),
(1128, 3, 2, NULL, NULL),
(1129, 3, 3, NULL, NULL),
(1130, 3, 4, NULL, NULL),
(1131, 3, 5, NULL, NULL),
(1132, 3, 6, NULL, NULL),
(1133, 3, 7, NULL, NULL),
(1134, 3, 10, NULL, NULL),
(1135, 3, 11, NULL, NULL),
(1136, 3, 12, NULL, NULL),
(1137, 3, 309, NULL, NULL),
(1138, 3, 13, NULL, NULL),
(1139, 3, 14, NULL, NULL),
(1140, 3, 15, NULL, NULL),
(1141, 3, 16, NULL, NULL),
(1142, 3, 17, NULL, NULL),
(1143, 3, 18, NULL, NULL),
(1144, 3, 19, NULL, NULL),
(1145, 3, 22, NULL, NULL),
(1146, 3, 23, NULL, NULL),
(1147, 3, 24, NULL, NULL),
(1148, 3, 25, NULL, NULL),
(1149, 3, 26, NULL, NULL),
(1150, 3, 27, NULL, NULL),
(1151, 3, 28, NULL, NULL),
(1152, 3, 29, NULL, NULL),
(1153, 3, 30, NULL, NULL),
(1154, 3, 31, NULL, NULL),
(1155, 3, 34, NULL, NULL),
(1156, 3, 35, NULL, NULL),
(1157, 3, 36, NULL, NULL),
(1158, 3, 37, NULL, NULL),
(1159, 3, 40, NULL, NULL),
(1160, 3, 41, NULL, NULL),
(1161, 3, 42, NULL, NULL),
(1162, 3, 49, NULL, NULL),
(1163, 3, 50, NULL, NULL),
(1164, 3, 51, NULL, NULL),
(1165, 3, 52, NULL, NULL),
(1166, 3, 53, NULL, NULL),
(1167, 3, 54, NULL, NULL),
(1168, 3, 43, NULL, NULL),
(1169, 3, 44, NULL, NULL),
(1170, 3, 45, NULL, NULL),
(1171, 3, 46, NULL, NULL),
(1172, 3, 47, NULL, NULL),
(1173, 3, 48, NULL, NULL),
(1174, 3, 55, NULL, NULL),
(1175, 3, 57, NULL, NULL),
(1176, 3, 58, NULL, NULL),
(1177, 3, 59, NULL, NULL),
(1178, 3, 60, NULL, NULL),
(1179, 3, 61, NULL, NULL),
(1180, 3, 63, NULL, NULL),
(1181, 3, 64, NULL, NULL),
(1182, 3, 65, NULL, NULL),
(1183, 3, 66, NULL, NULL),
(1184, 3, 279, NULL, NULL),
(1185, 3, 280, NULL, NULL),
(1186, 3, 281, NULL, NULL),
(1187, 3, 282, NULL, NULL),
(1188, 3, 283, NULL, NULL),
(1189, 3, 284, NULL, NULL),
(1190, 3, 285, NULL, NULL),
(1191, 3, 67, NULL, NULL),
(1192, 3, 68, NULL, NULL),
(1193, 3, 69, NULL, NULL),
(1194, 3, 70, NULL, NULL),
(1195, 3, 71, NULL, NULL),
(1196, 3, 72, NULL, NULL),
(1197, 3, 73, NULL, NULL),
(1198, 3, 74, NULL, NULL),
(1199, 3, 75, NULL, NULL),
(1200, 3, 76, NULL, NULL),
(1201, 3, 77, NULL, NULL),
(1202, 3, 78, NULL, NULL),
(1203, 3, 79, NULL, NULL),
(1204, 3, 80, NULL, NULL),
(1205, 3, 81, NULL, NULL),
(1206, 3, 82, NULL, NULL),
(1207, 3, 83, NULL, NULL),
(1208, 3, 84, NULL, NULL),
(1209, 3, 85, NULL, NULL),
(1210, 3, 86, NULL, NULL),
(1211, 3, 87, NULL, NULL),
(1212, 3, 88, NULL, NULL),
(1213, 3, 89, NULL, NULL),
(1214, 3, 90, NULL, NULL),
(1215, 3, 91, NULL, NULL),
(1216, 3, 92, NULL, NULL),
(1217, 3, 93, NULL, NULL),
(1218, 3, 94, NULL, NULL),
(1219, 3, 95, NULL, NULL),
(1220, 3, 96, NULL, NULL),
(1221, 3, 97, NULL, NULL),
(1222, 3, 98, NULL, NULL),
(1223, 3, 99, NULL, NULL),
(1224, 3, 100, NULL, NULL),
(1225, 3, 101, NULL, NULL),
(1226, 3, 102, NULL, NULL),
(1227, 3, 103, NULL, NULL),
(1228, 3, 104, NULL, NULL),
(1229, 3, 105, NULL, NULL),
(1230, 3, 106, NULL, NULL),
(1231, 3, 107, NULL, NULL),
(1232, 3, 108, NULL, NULL),
(1233, 3, 109, NULL, NULL),
(1234, 3, 110, NULL, NULL),
(1235, 3, 111, NULL, NULL),
(1236, 3, 112, NULL, NULL),
(1237, 3, 113, NULL, NULL),
(1238, 3, 114, NULL, NULL),
(1239, 3, 115, NULL, NULL),
(1240, 3, 116, NULL, NULL),
(1241, 3, 117, NULL, NULL),
(1242, 3, 118, NULL, NULL),
(1243, 3, 119, NULL, NULL),
(1244, 3, 120, NULL, NULL),
(1245, 3, 124, NULL, NULL),
(1246, 3, 299, NULL, NULL),
(1247, 3, 127, NULL, NULL),
(1248, 3, 128, NULL, NULL),
(1249, 3, 129, NULL, NULL),
(1250, 3, 130, NULL, NULL),
(1251, 3, 131, NULL, NULL),
(1252, 3, 132, NULL, NULL),
(1253, 3, 133, NULL, NULL),
(1254, 3, 134, NULL, NULL),
(1255, 3, 135, NULL, NULL),
(1256, 3, 136, NULL, NULL),
(1257, 3, 137, NULL, NULL),
(1258, 3, 138, NULL, NULL),
(1259, 3, 139, NULL, NULL),
(1260, 3, 140, NULL, NULL),
(1261, 3, 141, NULL, NULL),
(1262, 3, 142, NULL, NULL),
(1263, 3, 143, NULL, NULL),
(1264, 3, 144, NULL, NULL),
(1265, 3, 145, NULL, NULL),
(1266, 3, 146, NULL, NULL),
(1267, 3, 147, NULL, NULL),
(1268, 3, 148, NULL, NULL),
(1269, 3, 149, NULL, NULL),
(1270, 3, 150, NULL, NULL),
(1271, 3, 151, NULL, NULL),
(1272, 3, 152, NULL, NULL),
(1273, 3, 153, NULL, NULL),
(1274, 3, 154, NULL, NULL),
(1275, 3, 155, NULL, NULL),
(1276, 3, 156, NULL, NULL),
(1277, 3, 157, NULL, NULL),
(1278, 3, 158, NULL, NULL),
(1279, 3, 159, NULL, NULL),
(1280, 3, 160, NULL, NULL),
(1281, 3, 161, NULL, NULL),
(1282, 3, 162, NULL, NULL),
(1283, 3, 163, NULL, NULL),
(1284, 3, 164, NULL, NULL),
(1285, 3, 165, NULL, NULL),
(1286, 3, 166, NULL, NULL),
(1287, 3, 167, NULL, NULL),
(1288, 3, 168, NULL, NULL),
(1289, 3, 169, NULL, NULL),
(1290, 3, 170, NULL, NULL),
(1291, 3, 171, NULL, NULL),
(1292, 3, 172, NULL, NULL),
(1293, 3, 173, NULL, NULL),
(1294, 3, 174, NULL, NULL),
(1295, 3, 175, NULL, NULL),
(1296, 3, 176, NULL, NULL),
(1297, 3, 177, NULL, NULL),
(1298, 3, 178, NULL, NULL),
(1299, 3, 179, NULL, NULL),
(1300, 3, 180, NULL, NULL),
(1301, 3, 181, NULL, NULL),
(1302, 3, 182, NULL, NULL),
(1303, 3, 183, NULL, NULL),
(1304, 3, 184, NULL, NULL),
(1305, 3, 185, NULL, NULL),
(1306, 3, 186, NULL, NULL),
(1307, 3, 190, NULL, NULL),
(1308, 3, 193, NULL, NULL),
(1309, 3, 194, NULL, NULL),
(1310, 3, 195, NULL, NULL),
(1311, 3, 196, NULL, NULL),
(1312, 3, 197, NULL, NULL),
(1313, 3, 198, NULL, NULL),
(1314, 3, 199, NULL, NULL),
(1315, 3, 200, NULL, NULL),
(1316, 3, 201, NULL, NULL),
(1317, 3, 202, NULL, NULL),
(1318, 3, 203, NULL, NULL),
(1319, 3, 204, NULL, NULL),
(1320, 3, 205, NULL, NULL),
(1321, 3, 206, NULL, NULL),
(1322, 3, 207, NULL, NULL),
(1323, 3, 208, NULL, NULL),
(1324, 3, 209, NULL, NULL),
(1325, 3, 210, NULL, NULL),
(1326, 3, 211, NULL, NULL),
(1327, 3, 212, NULL, NULL),
(1328, 3, 213, NULL, NULL),
(1329, 3, 214, NULL, NULL),
(1330, 3, 215, NULL, NULL),
(1331, 3, 216, NULL, NULL),
(1332, 3, 217, NULL, NULL),
(1333, 3, 218, NULL, NULL),
(1334, 3, 219, NULL, NULL),
(1335, 3, 220, NULL, NULL),
(1336, 3, 221, NULL, NULL),
(1337, 3, 222, NULL, NULL),
(1338, 3, 223, NULL, NULL),
(1339, 3, 226, NULL, NULL),
(1340, 3, 227, NULL, NULL),
(1341, 3, 228, NULL, NULL),
(1342, 3, 307, NULL, NULL),
(1343, 3, 229, NULL, NULL),
(1344, 3, 230, NULL, NULL),
(1345, 3, 231, NULL, NULL),
(1346, 3, 232, NULL, NULL),
(1347, 3, 233, NULL, NULL),
(1348, 3, 234, NULL, NULL),
(1349, 3, 235, NULL, NULL),
(1350, 3, 236, NULL, NULL),
(1351, 3, 237, NULL, NULL),
(1352, 3, 238, NULL, NULL),
(1353, 3, 239, NULL, NULL),
(1354, 3, 240, NULL, NULL),
(1355, 3, 241, NULL, NULL),
(1356, 3, 242, NULL, NULL),
(1357, 3, 339, NULL, NULL),
(1358, 3, 340, NULL, NULL),
(1359, 3, 334, NULL, NULL),
(1360, 3, 336, NULL, NULL),
(1361, 3, 337, NULL, NULL),
(1362, 3, 330, NULL, NULL),
(1363, 3, 332, NULL, NULL),
(1364, 3, 333, NULL, NULL),
(1365, 6, 1, NULL, NULL),
(1366, 6, 2, NULL, NULL),
(1367, 6, 3, NULL, NULL),
(1368, 6, 4, NULL, NULL),
(1369, 6, 5, NULL, NULL),
(1370, 6, 6, NULL, NULL),
(1371, 6, 7, NULL, NULL),
(1372, 6, 8, NULL, NULL),
(1373, 6, 9, NULL, NULL),
(1374, 6, 10, NULL, NULL),
(1375, 6, 11, NULL, NULL),
(1376, 6, 12, NULL, NULL),
(1377, 6, 309, NULL, NULL),
(1378, 6, 13, NULL, NULL),
(1379, 6, 14, NULL, NULL),
(1380, 6, 15, NULL, NULL),
(1381, 6, 16, NULL, NULL),
(1382, 6, 17, NULL, NULL),
(1383, 6, 18, NULL, NULL),
(1384, 6, 19, NULL, NULL),
(1385, 6, 20, NULL, NULL),
(1386, 6, 21, NULL, NULL),
(1387, 6, 22, NULL, NULL),
(1388, 6, 23, NULL, NULL),
(1389, 6, 24, NULL, NULL),
(1390, 6, 308, NULL, NULL),
(1391, 6, 25, NULL, NULL),
(1392, 6, 26, NULL, NULL),
(1393, 6, 27, NULL, NULL),
(1394, 6, 28, NULL, NULL),
(1395, 6, 29, NULL, NULL),
(1396, 6, 30, NULL, NULL),
(1397, 6, 31, NULL, NULL),
(1398, 6, 32, NULL, NULL),
(1399, 6, 33, NULL, NULL),
(1400, 6, 34, NULL, NULL),
(1401, 6, 35, NULL, NULL),
(1402, 6, 36, NULL, NULL),
(1403, 6, 37, NULL, NULL),
(1404, 6, 38, NULL, NULL),
(1405, 6, 39, NULL, NULL),
(1406, 6, 40, NULL, NULL),
(1407, 6, 41, NULL, NULL),
(1408, 6, 42, NULL, NULL),
(1409, 6, 43, NULL, NULL),
(1410, 6, 44, NULL, NULL),
(1411, 6, 45, NULL, NULL),
(1412, 6, 46, NULL, NULL),
(1413, 6, 47, NULL, NULL),
(1414, 6, 48, NULL, NULL),
(1415, 6, 55, NULL, NULL),
(1416, 6, 56, NULL, NULL),
(1417, 6, 57, NULL, NULL),
(1418, 6, 58, NULL, NULL),
(1419, 6, 59, NULL, NULL),
(1420, 6, 60, NULL, NULL),
(1421, 6, 61, NULL, NULL),
(1422, 6, 62, NULL, NULL),
(1423, 6, 63, NULL, NULL),
(1424, 6, 64, NULL, NULL),
(1425, 6, 65, NULL, NULL),
(1426, 6, 66, NULL, NULL),
(1427, 6, 279, NULL, NULL),
(1428, 6, 280, NULL, NULL),
(1429, 6, 281, NULL, NULL),
(1430, 6, 282, NULL, NULL),
(1431, 6, 283, NULL, NULL),
(1432, 6, 284, NULL, NULL),
(1433, 6, 285, NULL, NULL),
(1434, 6, 97, NULL, NULL),
(1435, 6, 98, NULL, NULL),
(1436, 6, 99, NULL, NULL),
(1437, 6, 100, NULL, NULL),
(1438, 6, 101, NULL, NULL),
(1439, 6, 102, NULL, NULL),
(1440, 6, 121, NULL, NULL),
(1441, 6, 122, NULL, NULL),
(1442, 6, 123, NULL, NULL),
(1443, 6, 124, NULL, NULL),
(1444, 6, 125, NULL, NULL),
(1445, 6, 126, NULL, NULL),
(1446, 6, 286, NULL, NULL),
(1447, 6, 287, NULL, NULL),
(1448, 6, 288, NULL, NULL),
(1449, 6, 289, NULL, NULL),
(1450, 6, 290, NULL, NULL),
(1451, 6, 291, NULL, NULL),
(1452, 6, 292, NULL, NULL),
(1453, 6, 293, NULL, NULL),
(1454, 6, 294, NULL, NULL),
(1455, 6, 295, NULL, NULL),
(1456, 6, 296, NULL, NULL),
(1457, 6, 297, NULL, NULL),
(1458, 6, 298, NULL, NULL),
(1459, 6, 299, NULL, NULL),
(1460, 6, 300, NULL, NULL),
(1461, 6, 301, NULL, NULL),
(1462, 6, 127, NULL, NULL),
(1463, 6, 128, NULL, NULL),
(1464, 6, 129, NULL, NULL),
(1465, 6, 130, NULL, NULL),
(1466, 6, 131, NULL, NULL),
(1467, 6, 132, NULL, NULL),
(1468, 6, 133, NULL, NULL),
(1469, 6, 134, NULL, NULL),
(1470, 6, 135, NULL, NULL),
(1471, 6, 136, NULL, NULL),
(1472, 6, 137, NULL, NULL),
(1473, 6, 138, NULL, NULL),
(1474, 6, 139, NULL, NULL),
(1475, 6, 140, NULL, NULL),
(1476, 6, 141, NULL, NULL),
(1477, 6, 142, NULL, NULL),
(1478, 6, 143, NULL, NULL),
(1479, 6, 144, NULL, NULL),
(1480, 6, 145, NULL, NULL),
(1481, 6, 146, NULL, NULL),
(1482, 6, 147, NULL, NULL),
(1483, 6, 148, NULL, NULL),
(1484, 6, 149, NULL, NULL),
(1485, 6, 150, NULL, NULL),
(1486, 6, 151, NULL, NULL),
(1487, 6, 152, NULL, NULL),
(1488, 6, 153, NULL, NULL),
(1489, 6, 154, NULL, NULL),
(1490, 6, 155, NULL, NULL),
(1491, 6, 156, NULL, NULL),
(1492, 6, 157, NULL, NULL),
(1493, 6, 158, NULL, NULL),
(1494, 6, 159, NULL, NULL),
(1495, 6, 160, NULL, NULL),
(1496, 6, 161, NULL, NULL),
(1497, 6, 162, NULL, NULL),
(1498, 6, 163, NULL, NULL),
(1499, 6, 164, NULL, NULL),
(1500, 6, 165, NULL, NULL),
(1501, 6, 166, NULL, NULL),
(1502, 6, 167, NULL, NULL),
(1503, 6, 168, NULL, NULL),
(1504, 6, 169, NULL, NULL),
(1505, 6, 170, NULL, NULL),
(1506, 6, 171, NULL, NULL),
(1507, 6, 172, NULL, NULL),
(1508, 6, 173, NULL, NULL),
(1509, 6, 174, NULL, NULL),
(1510, 6, 175, NULL, NULL),
(1511, 6, 176, NULL, NULL),
(1512, 6, 177, NULL, NULL),
(1513, 6, 178, NULL, NULL),
(1514, 6, 179, NULL, NULL),
(1515, 6, 180, NULL, NULL),
(1516, 6, 181, NULL, NULL),
(1517, 6, 182, NULL, NULL),
(1518, 6, 183, NULL, NULL),
(1519, 6, 184, NULL, NULL),
(1520, 6, 185, NULL, NULL),
(1521, 6, 186, NULL, NULL),
(1522, 6, 187, NULL, NULL),
(1523, 6, 188, NULL, NULL),
(1524, 6, 189, NULL, NULL),
(1525, 6, 190, NULL, NULL),
(1526, 6, 191, NULL, NULL),
(1527, 6, 192, NULL, NULL),
(1528, 6, 302, NULL, NULL),
(1529, 6, 303, NULL, NULL),
(1530, 6, 304, NULL, NULL),
(1531, 6, 305, NULL, NULL),
(1532, 6, 193, NULL, NULL),
(1533, 6, 194, NULL, NULL),
(1534, 6, 195, NULL, NULL),
(1535, 6, 196, NULL, NULL),
(1536, 6, 197, NULL, NULL),
(1537, 6, 198, NULL, NULL),
(1538, 6, 199, NULL, NULL),
(1539, 6, 200, NULL, NULL),
(1540, 6, 201, NULL, NULL),
(1541, 6, 202, NULL, NULL),
(1542, 6, 203, NULL, NULL),
(1543, 6, 204, NULL, NULL),
(1544, 6, 205, NULL, NULL),
(1545, 6, 206, NULL, NULL),
(1546, 6, 207, NULL, NULL),
(1547, 6, 208, NULL, NULL),
(1548, 6, 209, NULL, NULL),
(1549, 6, 210, NULL, NULL),
(1550, 6, 211, NULL, NULL),
(1551, 6, 212, NULL, NULL),
(1552, 6, 213, NULL, NULL),
(1553, 6, 214, NULL, NULL),
(1554, 6, 215, NULL, NULL),
(1555, 6, 216, NULL, NULL),
(1556, 6, 217, NULL, NULL),
(1557, 6, 218, NULL, NULL),
(1558, 6, 219, NULL, NULL),
(1559, 6, 220, NULL, NULL),
(1560, 6, 221, NULL, NULL),
(1561, 6, 222, NULL, NULL),
(1562, 6, 223, NULL, NULL),
(1563, 6, 224, NULL, NULL),
(1564, 6, 225, NULL, NULL),
(1565, 6, 226, NULL, NULL),
(1566, 6, 227, NULL, NULL),
(1567, 6, 228, NULL, NULL),
(1568, 6, 306, NULL, NULL),
(1569, 6, 307, NULL, NULL),
(1570, 6, 235, NULL, NULL),
(1571, 6, 236, NULL, NULL),
(1572, 6, 237, NULL, NULL),
(1573, 6, 238, NULL, NULL),
(1574, 6, 239, NULL, NULL),
(1575, 6, 240, NULL, NULL),
(1576, 6, 262, NULL, NULL),
(1577, 6, 263, NULL, NULL),
(1578, 6, 264, NULL, NULL),
(1579, 6, 265, NULL, NULL),
(1580, 6, 266, NULL, NULL),
(1581, 6, 267, NULL, NULL),
(1582, 6, 268, NULL, NULL),
(1583, 6, 269, NULL, NULL),
(1584, 6, 270, NULL, NULL),
(1585, 6, 271, NULL, NULL),
(1586, 6, 274, NULL, NULL),
(1587, 6, 275, NULL, NULL),
(1588, 6, 277, NULL, NULL),
(1589, 6, 314, NULL, NULL),
(1590, 6, 315, NULL, NULL),
(1591, 6, 316, NULL, NULL),
(1592, 6, 317, NULL, NULL),
(1593, 6, 318, NULL, NULL),
(1594, 6, 319, NULL, NULL),
(1595, 6, 334, NULL, NULL),
(1596, 6, 335, NULL, NULL),
(1597, 6, 336, NULL, NULL),
(1598, 6, 337, NULL, NULL),
(1599, 7, 13, NULL, NULL),
(1600, 7, 14, NULL, NULL),
(1601, 7, 15, NULL, NULL),
(1602, 7, 16, NULL, NULL),
(1603, 7, 17, NULL, NULL),
(1604, 7, 18, NULL, NULL),
(1605, 7, 25, NULL, NULL),
(1606, 7, 26, NULL, NULL),
(1607, 7, 27, NULL, NULL),
(1608, 7, 28, NULL, NULL),
(1609, 7, 29, NULL, NULL),
(1610, 7, 30, NULL, NULL),
(1611, 7, 19, NULL, NULL),
(1612, 7, 20, NULL, NULL),
(1613, 7, 21, NULL, NULL),
(1614, 7, 22, NULL, NULL),
(1615, 7, 23, NULL, NULL),
(1616, 7, 24, NULL, NULL),
(1617, 7, 308, NULL, NULL),
(1618, 7, 31, NULL, NULL),
(1619, 7, 32, NULL, NULL),
(1620, 7, 33, NULL, NULL),
(1621, 7, 34, NULL, NULL),
(1622, 7, 35, NULL, NULL),
(1623, 7, 36, NULL, NULL),
(1624, 7, 37, NULL, NULL),
(1625, 7, 38, NULL, NULL),
(1626, 7, 39, NULL, NULL),
(1627, 7, 40, NULL, NULL),
(1628, 7, 41, NULL, NULL),
(1629, 7, 42, NULL, NULL),
(1630, 7, 97, NULL, NULL),
(1631, 7, 98, NULL, NULL),
(1632, 7, 99, NULL, NULL),
(1633, 7, 100, NULL, NULL),
(1634, 7, 101, NULL, NULL),
(1635, 7, 102, NULL, NULL),
(1636, 7, 103, NULL, NULL),
(1637, 7, 104, NULL, NULL),
(1638, 7, 105, NULL, NULL),
(1639, 7, 106, NULL, NULL),
(1640, 7, 107, NULL, NULL),
(1641, 7, 108, NULL, NULL),
(1642, 7, 121, NULL, NULL),
(1643, 7, 122, NULL, NULL),
(1644, 7, 123, NULL, NULL),
(1645, 7, 124, NULL, NULL),
(1646, 7, 125, NULL, NULL),
(1647, 7, 126, NULL, NULL),
(1648, 7, 286, NULL, NULL),
(1649, 7, 287, NULL, NULL),
(1650, 7, 288, NULL, NULL),
(1651, 7, 289, NULL, NULL),
(1652, 7, 290, NULL, NULL),
(1653, 7, 291, NULL, NULL),
(1654, 7, 292, NULL, NULL),
(1655, 7, 293, NULL, NULL),
(1656, 7, 294, NULL, NULL),
(1657, 7, 295, NULL, NULL),
(1658, 7, 296, NULL, NULL),
(1659, 7, 297, NULL, NULL),
(1660, 7, 298, NULL, NULL),
(1661, 7, 299, NULL, NULL),
(1662, 7, 300, NULL, NULL),
(1663, 7, 301, NULL, NULL),
(1664, 7, 127, NULL, NULL),
(1665, 7, 128, NULL, NULL),
(1666, 7, 129, NULL, NULL),
(1667, 7, 130, NULL, NULL),
(1668, 7, 131, NULL, NULL),
(1669, 7, 132, NULL, NULL),
(1670, 7, 133, NULL, NULL),
(1671, 7, 134, NULL, NULL),
(1672, 7, 135, NULL, NULL),
(1673, 7, 136, NULL, NULL),
(1674, 7, 137, NULL, NULL),
(1675, 7, 138, NULL, NULL),
(1676, 7, 139, NULL, NULL),
(1677, 7, 140, NULL, NULL),
(1678, 7, 141, NULL, NULL),
(1679, 7, 142, NULL, NULL),
(1680, 7, 143, NULL, NULL),
(1681, 7, 144, NULL, NULL),
(1682, 7, 145, NULL, NULL),
(1683, 7, 146, NULL, NULL),
(1684, 7, 147, NULL, NULL),
(1685, 7, 148, NULL, NULL),
(1686, 7, 149, NULL, NULL),
(1687, 7, 150, NULL, NULL),
(1688, 7, 151, NULL, NULL),
(1689, 7, 152, NULL, NULL),
(1690, 7, 153, NULL, NULL),
(1691, 7, 154, NULL, NULL),
(1692, 7, 155, NULL, NULL),
(1693, 7, 156, NULL, NULL),
(1694, 7, 157, NULL, NULL),
(1695, 7, 158, NULL, NULL),
(1696, 7, 159, NULL, NULL),
(1697, 7, 160, NULL, NULL),
(1698, 7, 161, NULL, NULL),
(1699, 7, 162, NULL, NULL),
(1700, 7, 163, NULL, NULL),
(1701, 7, 164, NULL, NULL),
(1702, 7, 165, NULL, NULL),
(1703, 7, 166, NULL, NULL),
(1704, 7, 167, NULL, NULL),
(1705, 7, 168, NULL, NULL),
(1706, 7, 169, NULL, NULL),
(1707, 7, 170, NULL, NULL),
(1708, 7, 171, NULL, NULL),
(1709, 7, 172, NULL, NULL),
(1710, 7, 173, NULL, NULL),
(1711, 7, 174, NULL, NULL),
(1712, 7, 175, NULL, NULL),
(1713, 7, 176, NULL, NULL),
(1714, 7, 177, NULL, NULL),
(1715, 7, 178, NULL, NULL),
(1716, 7, 179, NULL, NULL),
(1717, 7, 180, NULL, NULL),
(1718, 7, 181, NULL, NULL),
(1719, 7, 182, NULL, NULL),
(1720, 7, 183, NULL, NULL),
(1721, 7, 184, NULL, NULL),
(1722, 7, 185, NULL, NULL),
(1723, 7, 186, NULL, NULL),
(1724, 7, 223, NULL, NULL),
(1725, 7, 224, NULL, NULL),
(1726, 7, 225, NULL, NULL),
(1727, 7, 226, NULL, NULL),
(1728, 7, 227, NULL, NULL),
(1729, 7, 228, NULL, NULL),
(1730, 7, 306, NULL, NULL),
(1731, 7, 307, NULL, NULL),
(1732, 7, 235, NULL, NULL),
(1733, 7, 236, NULL, NULL),
(1734, 7, 237, NULL, NULL),
(1735, 7, 238, NULL, NULL),
(1736, 7, 239, NULL, NULL),
(1737, 7, 240, NULL, NULL),
(1738, 7, 242, NULL, NULL),
(1739, 7, 243, NULL, NULL),
(1740, 7, 267, NULL, NULL),
(1741, 7, 268, NULL, NULL),
(1742, 7, 269, NULL, NULL),
(1743, 7, 270, NULL, NULL),
(1744, 7, 271, NULL, NULL),
(1745, 7, 274, NULL, NULL),
(1746, 7, 275, NULL, NULL),
(1747, 7, 277, NULL, NULL),
(1748, 7, 314, NULL, NULL),
(1749, 7, 315, NULL, NULL),
(1750, 7, 316, NULL, NULL),
(1751, 7, 317, NULL, NULL),
(1752, 7, 318, NULL, NULL),
(1753, 7, 319, NULL, NULL),
(1754, 7, 320, NULL, NULL),
(1755, 7, 321, NULL, NULL),
(1756, 7, 326, NULL, NULL),
(1757, 7, 327, NULL, NULL),
(1758, 7, 328, NULL, NULL),
(1759, 7, 329, NULL, NULL),
(1760, 7, 330, NULL, NULL),
(1761, 7, 331, NULL, NULL),
(1762, 7, 332, NULL, NULL),
(1763, 7, 333, NULL, NULL),
(1764, 7, 334, NULL, NULL),
(1765, 7, 335, NULL, NULL),
(1766, 7, 336, NULL, NULL),
(1767, 7, 337, NULL, NULL),
(1768, 8, 1, NULL, NULL),
(1769, 8, 2, NULL, NULL),
(1770, 8, 3, NULL, NULL),
(1771, 8, 4, NULL, NULL),
(1772, 8, 5, NULL, NULL),
(1773, 8, 6, NULL, NULL),
(1774, 8, 13, NULL, NULL),
(1775, 8, 14, NULL, NULL),
(1776, 8, 15, NULL, NULL),
(1777, 8, 16, NULL, NULL),
(1778, 8, 17, NULL, NULL),
(1779, 8, 18, NULL, NULL),
(1780, 8, 37, NULL, NULL),
(1781, 8, 38, NULL, NULL),
(1782, 8, 39, NULL, NULL),
(1783, 8, 40, NULL, NULL),
(1784, 8, 41, NULL, NULL),
(1785, 8, 42, NULL, NULL),
(1786, 8, 97, NULL, NULL),
(1787, 8, 98, NULL, NULL),
(1788, 8, 99, NULL, NULL),
(1789, 8, 100, NULL, NULL),
(1790, 8, 101, NULL, NULL),
(1791, 8, 102, NULL, NULL),
(1792, 8, 103, NULL, NULL),
(1793, 8, 104, NULL, NULL),
(1794, 8, 105, NULL, NULL),
(1795, 8, 106, NULL, NULL),
(1796, 8, 107, NULL, NULL),
(1797, 8, 108, NULL, NULL),
(1798, 8, 121, NULL, NULL),
(1799, 8, 122, NULL, NULL),
(1800, 8, 123, NULL, NULL),
(1801, 8, 124, NULL, NULL),
(1802, 8, 125, NULL, NULL),
(1803, 8, 126, NULL, NULL),
(1804, 8, 286, NULL, NULL),
(1805, 8, 287, NULL, NULL),
(1806, 8, 288, NULL, NULL),
(1807, 8, 289, NULL, NULL),
(1808, 8, 290, NULL, NULL),
(1809, 8, 291, NULL, NULL),
(1810, 8, 292, NULL, NULL),
(1811, 8, 293, NULL, NULL),
(1812, 8, 294, NULL, NULL),
(1813, 8, 295, NULL, NULL),
(1814, 8, 296, NULL, NULL),
(1815, 8, 297, NULL, NULL),
(1816, 8, 298, NULL, NULL),
(1817, 8, 299, NULL, NULL),
(1818, 8, 300, NULL, NULL),
(1819, 8, 301, NULL, NULL),
(1820, 8, 127, NULL, NULL),
(1821, 8, 128, NULL, NULL),
(1822, 8, 129, NULL, NULL),
(1823, 8, 130, NULL, NULL),
(1824, 8, 131, NULL, NULL),
(1825, 8, 132, NULL, NULL),
(1826, 8, 133, NULL, NULL),
(1827, 8, 134, NULL, NULL),
(1828, 8, 135, NULL, NULL),
(1829, 8, 136, NULL, NULL),
(1830, 8, 137, NULL, NULL),
(1831, 8, 138, NULL, NULL),
(1832, 8, 139, NULL, NULL),
(1833, 8, 140, NULL, NULL),
(1834, 8, 141, NULL, NULL),
(1835, 8, 142, NULL, NULL),
(1836, 8, 143, NULL, NULL),
(1837, 8, 144, NULL, NULL),
(1838, 8, 145, NULL, NULL),
(1839, 8, 146, NULL, NULL),
(1840, 8, 147, NULL, NULL),
(1841, 8, 148, NULL, NULL),
(1842, 8, 149, NULL, NULL),
(1843, 8, 150, NULL, NULL),
(1844, 8, 151, NULL, NULL),
(1845, 8, 152, NULL, NULL),
(1846, 8, 153, NULL, NULL),
(1847, 8, 154, NULL, NULL),
(1848, 8, 155, NULL, NULL),
(1849, 8, 156, NULL, NULL),
(1850, 8, 157, NULL, NULL),
(1851, 8, 158, NULL, NULL),
(1852, 8, 159, NULL, NULL),
(1853, 8, 160, NULL, NULL),
(1854, 8, 161, NULL, NULL),
(1855, 8, 162, NULL, NULL),
(1856, 8, 163, NULL, NULL),
(1857, 8, 164, NULL, NULL),
(1858, 8, 165, NULL, NULL),
(1859, 8, 166, NULL, NULL),
(1860, 8, 167, NULL, NULL),
(1861, 8, 168, NULL, NULL),
(1862, 8, 169, NULL, NULL),
(1863, 8, 170, NULL, NULL),
(1864, 8, 171, NULL, NULL),
(1865, 8, 172, NULL, NULL),
(1866, 8, 173, NULL, NULL),
(1867, 8, 174, NULL, NULL),
(1868, 8, 175, NULL, NULL),
(1869, 8, 176, NULL, NULL),
(1870, 8, 177, NULL, NULL),
(1871, 8, 178, NULL, NULL),
(1872, 8, 179, NULL, NULL),
(1873, 8, 180, NULL, NULL),
(1874, 8, 181, NULL, NULL),
(1875, 8, 182, NULL, NULL),
(1876, 8, 183, NULL, NULL),
(1877, 8, 184, NULL, NULL),
(1878, 8, 185, NULL, NULL),
(1879, 8, 186, NULL, NULL),
(1880, 8, 235, NULL, NULL),
(1881, 8, 236, NULL, NULL),
(1882, 8, 237, NULL, NULL),
(1883, 8, 238, NULL, NULL),
(1884, 8, 239, NULL, NULL),
(1885, 8, 240, NULL, NULL),
(1886, 8, 241, NULL, NULL),
(1887, 8, 242, NULL, NULL),
(1888, 8, 243, NULL, NULL),
(1889, 8, 245, NULL, NULL),
(1890, 8, 247, NULL, NULL),
(1891, 8, 246, NULL, NULL),
(1892, 8, 267, NULL, NULL),
(1893, 8, 268, NULL, NULL),
(1894, 8, 269, NULL, NULL),
(1895, 8, 270, NULL, NULL),
(1896, 8, 271, NULL, NULL),
(1897, 8, 275, NULL, NULL),
(1898, 8, 276, NULL, NULL),
(1899, 8, 330, NULL, NULL),
(1900, 8, 331, NULL, NULL),
(1901, 8, 332, NULL, NULL),
(1902, 8, 333, NULL, NULL),
(1903, 8, 334, NULL, NULL),
(1904, 8, 335, NULL, NULL),
(1905, 8, 336, NULL, NULL),
(1906, 8, 337, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_user`
--

INSERT INTO `role_user` (`id`, `role_id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 3, 1, NULL, NULL),
(2, 5, 10, NULL, NULL),
(3, 5, 5, NULL, NULL),
(4, 5, 7, NULL, NULL),
(5, 5, 8, NULL, NULL),
(6, 5, 9, NULL, NULL),
(7, 5, 11, NULL, NULL),
(9, 5, 13, NULL, NULL),
(11, 5, 14, NULL, NULL),
(12, 6, 12, NULL, NULL),
(15, 1, 16, NULL, NULL),
(18, 7, 15, NULL, NULL),
(19, 5, 17, NULL, NULL),
(20, 8, 18, NULL, NULL),
(21, 8, 19, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('0LdkDsHLXCzYk5yqtCsb206HKdC7hPrcqeOa5EPL', NULL, '184.95.46.154', 'node', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiUjR6N0NrejdFZmV6UFFxT0h6S0d1V1RCdUFlVHNyYkUzdWxNNkZGWSI7czo1OiJlcnJvciI7czozNDoiUGxlYXNlIGxvZ2luIHRvIGFjY2VzcyBhZG1pbiBhcmVhLiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJuZXciO2E6MDp7fXM6Mzoib2xkIjthOjE6e2k6MDtzOjU6ImVycm9yIjt9fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjQ5OiJodHRwczovL3dvcmsudmFzcHRlY2hub2xvZ2llcy5jb20vYWRtaW4vdGFza3MvMzkxIjtzOjU6InJvdXRlIjtzOjIyOiJhZG1pbi50YXNrcy5hZG1pbi5zaG93Ijt9fQ==', 1775529876),
('57P8jtGPXx7qDNAXsZvUeXv8j669AZoQSNfMmQO5', NULL, '184.95.46.154', 'node', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibFlQR240Wk52NXJUWFRFNlVSMVRCeUtHaTlYQTRDWnR4ak0wU082bSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDU6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoxMToiYWRtaW4ubG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1775529866),
('Azs4fZnxU7WlLoCqn6h7sRFsO11k6OUkvvlpuwUE', NULL, '184.95.46.154', 'node', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoieExvVzdURW9nWktDTHUyVXJvN25HSXNZRG9tVkc1ajhXbzVyQkYwciI7czo1OiJlcnJvciI7czozNDoiUGxlYXNlIGxvZ2luIHRvIGFjY2VzcyBhZG1pbiBhcmVhLiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJuZXciO2E6MDp7fXM6Mzoib2xkIjthOjE6e2k6MDtzOjU6ImVycm9yIjt9fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjQ5OiJodHRwczovL3dvcmsudmFzcHRlY2hub2xvZ2llcy5jb20vYWRtaW4vdGFza3MvMzkxIjtzOjU6InJvdXRlIjtzOjIyOiJhZG1pbi50YXNrcy5hZG1pbi5zaG93Ijt9fQ==', 1775529866),
('EgPTHyuRiYlWOlpiiKRUWSrrTrmUMHE8h3LvFxA8', 10, '2405:201:a80d:9853:dc83:ab18:9c5c:c062', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiRUJXNkh2dHhNR1BEODY0cnB3ZFhRcEU1b2RBbUVpQ2NJdk5nMGM3MSI7czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTA7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9teS90YXNrcyI7czo1OiJyb3V0ZSI7czo4OiJ0YXNrcy5teSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1775536637),
('j5ceM2QBCXMKjRkc5rOkWvLrLHcom9CGXi8Hv5Os', 12, '2405:201:a801:22d0:9428:deab:f4bf:9843', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoidHp5WnNpR20zRlJJVFROMjE2Rm9yeXZNRWJOSVZHZzJEVno3ZGxheCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NTI6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9hZG1pbi90YXNrcy9jcmVhdGUiO3M6NToicm91dGUiO3M6MjQ6ImFkbWluLnRhc2tzLmFkbWluLmNyZWF0ZSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjEyO30=', 1775535626),
('JcFMfwR6qSHJ4Xo7v8rKJbrAewKKALLxZzVwolmr', 11, '2405:201:a80d:9853:ac19:f6af:a099:e936', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoicHhBZWhGSnZYSHd6bUpMMVpGdDlmTk5qZWw2Nm5jNjUwZDhGRFJyTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbSI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTE7fQ==', 1775535540),
('p2n0QopAYtXeDQy2PWaRzaVpKnj7zl984ecvCZFW', 9, '49.37.109.31', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiVzZBeFFSNWJIMjBESEdBTXVoMTB6b1Z1c3NiYVJjS1ZodW0yVVEzayI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czo0MjoiaHR0cHM6Ly93b3JrLnZhc3B0ZWNobm9sb2dpZXMuY29tL215L3Rhc2tzIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzk6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjk7fQ==', 1775536478),
('sr8Hv0Y2NEd3vG3ZGaY5ZcQorlo0fSg1x3AG5kAW', 14, '106.222.224.134', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoicWVjRjJ5ckdUY3VDcFFSWXJxWFpRblpZOGVDUnVJSFFvNDJRYWRxOCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbSI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTQ7fQ==', 1775536638),
('tPKt1qFpDhXWl22B1vDYqS6A289rGnS9PDaIuG08', 13, '2405:201:a801:22d0:6492:24f3:febc:aef3', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoienk2a3pzOXR4UnM1VnEwNGxlUTN5clp2UzJIMVdCcUw5RktDZUJSMyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbSI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTM7fQ==', 1775536679),
('V70BOYfarIFpP0E5KE74VqlDeCC9t9Xfj9pWCz40', 7, '2405:201:a80d:9853:1d16:4586:5ab9:ecef', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiU2FwRWlYZDRtUWg2YjMyUnZwN1dRS0NMbUszYlRHZkJhdXE5dHp5UiI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czo0MjoiaHR0cHM6Ly93b3JrLnZhc3B0ZWNobm9sb2dpZXMuY29tL215L3Rhc2tzIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzk6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjc7fQ==', 1775536470),
('ZWYlfLWSpnWouqDHf7UOi9ysp96bCWczpyChMVDo', NULL, '184.95.46.154', 'node', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaVhxMGR0NEhVYWRCdGI3NkhNd3B0SERTMjRKTlAzVTdxTXZqWVA4QiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDU6Imh0dHBzOi8vd29yay52YXNwdGVjaG5vbG9naWVzLmNvbS9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoxMToiYWRtaW4ubG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1775529877);

-- --------------------------------------------------------

--
-- Table structure for table `sla_policies`
--

CREATE TABLE `sla_policies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `priority` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `response_time_minutes` int(11) NOT NULL,
  `resolution_time_minutes` int(11) NOT NULL,
  `review_time_minutes` int(11) NOT NULL,
  `escalation_steps` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sla_policies`
--

INSERT INTO `sla_policies` (`id`, `name`, `description`, `task_type_id`, `priority`, `response_time_minutes`, `resolution_time_minutes`, `review_time_minutes`, `escalation_steps`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Bugfix P1 Policy', 'Critical bug fix', 1, 'P1', 60, 480, 240, '[{\"notify\": \"Team Lead\", \"after_minutes\": 120}, {\"notify\": \"Manager\", \"after_minutes\": 360}]', 1, NULL, NULL, NULL),
(2, 'Bugfix P2 Policy', 'High priority bug fix', 1, 'P2', 240, 2880, 1440, '[{\"notify\": \"Team Lead\", \"after_minutes\": 1440}]', 1, NULL, NULL, NULL),
(3, 'Bugfix P3 Policy', 'Medium priority bug fix', 1, 'P3', 480, 7200, 2880, '[]', 1, NULL, NULL, NULL),
(4, 'Bugfix P4 Policy', 'Low priority bug fix', 1, 'P4', 1440, 14400, 5760, '[]', 1, NULL, NULL, NULL),
(5, 'ProjectWork P1 Policy', 'Critical project work', 2, 'P1', 240, 2880, 1440, '[{\"notify\": \"Project Manager\", \"after_minutes\": 1440}]', 1, NULL, NULL, NULL),
(6, 'ProjectWork P2 Policy', 'High priority project work', 2, 'P2', 480, 5760, 2880, '[]', 1, NULL, NULL, NULL),
(7, 'ProjectWork P3 Policy', 'Medium priority project work', 2, 'P3', 960, 10080, 5760, '[]', 1, NULL, NULL, NULL),
(8, 'Support P1 Policy', 'Critical support request', 3, 'P1', 120, 1440, 720, '[{\"notify\": \"Support Manager\", \"after_minutes\": 240}]', 1, NULL, NULL, NULL),
(9, 'Support P2 Policy', 'High priority support request', 3, 'P2', 480, 2880, 1440, '[]', 1, NULL, NULL, NULL),
(10, 'Support P3 Policy', 'Medium priority support request', 3, 'P3', 1440, 7200, 2880, '[]', 1, NULL, NULL, NULL),
(11, 'InternalRequest P2 Policy', 'High priority internal request', 4, 'P2', 480, 2880, 1440, '[]', 1, NULL, NULL, NULL),
(12, 'InternalRequest P3 Policy', 'Medium priority internal request', 4, 'P3', 1440, 5760, 2880, '[]', 1, NULL, NULL, NULL),
(13, 'Inspection P2 Policy', 'High priority inspection', 5, 'P2', 480, 2880, 1440, '[]', 1, NULL, NULL, NULL),
(14, 'Inspection P3 Policy', 'Medium priority inspection', 5, 'P3', 1440, 5760, 2880, '[]', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sso_login_tokens`
--

CREATE TABLE `sso_login_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `organization_user_id` bigint(20) UNSIGNED NOT NULL,
  `jti` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sso_login_tokens`
--

INSERT INTO `sso_login_tokens` (`id`, `client_id`, `organization_user_id`, `jti`, `expires_at`, `used_at`, `ip`, `user_agent`, `created_at`, `updated_at`) VALUES
(9, 1, 4, '5405d6d4-927e-4c0b-b12f-0e7abd4f149c', '2026-03-24 09:16:23', '2026-03-24 09:11:23', '2405:201:a80d:9814:89a3:eb53:d492:39c5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-24 09:11:23', '2026-03-24 09:11:23'),
(10, 1, 4, '0013faae-9a80-4504-ba4c-0c38e16c1cb0', '2026-03-24 09:41:05', '2026-03-24 09:36:06', '2405:201:a80d:9814:89a3:eb53:d492:39c5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-24 09:36:06', '2026-03-24 09:36:06'),
(11, 1, 4, '3e5f4d7f-4159-41de-bcc6-37b13a979172', '2026-03-24 09:59:44', '2026-03-24 09:54:44', '2405:201:a80d:9814:89a3:eb53:d492:39c5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-24 09:54:44', '2026-03-24 09:54:44'),
(12, 1, 4, 'a4d1509b-7a14-4e19-94d3-4ab94abfad83', '2026-03-24 10:49:16', '2026-03-24 10:44:18', '49.37.101.39', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-24 10:44:18', '2026-03-24 10:44:18'),
(13, 1, 5, 'd15e3c88-b16e-4c57-84f3-1c475759456a', '2026-03-24 10:50:33', '2026-03-24 10:45:34', '49.37.101.39', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-24 10:45:34', '2026-03-24 10:45:34'),
(14, 1, 4, '5e136253-ecc1-4f01-bbd7-e749f81d0e68', '2026-03-26 04:52:47', '2026-03-26 04:47:48', '2405:201:a801:22d0:e42f:8d67:f09d:1594', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-26 04:47:48', '2026-03-26 04:47:48'),
(15, 1, 4, 'd5759310-6320-402c-859a-0f608a82bb7a', '2026-03-26 05:00:08', '2026-03-26 04:55:08', '2405:201:a801:22d0:e42f:8d67:f09d:1594', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-26 04:55:08', '2026-03-26 04:55:08'),
(16, 2, 6, 'f9e178c7-abab-40a0-9174-6f7a4539a510', '2026-03-26 13:04:00', '2026-03-26 12:59:01', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 12:59:01', '2026-03-26 12:59:01'),
(17, 2, 6, 'f3406ae6-dfa8-4661-8635-38f05189095b', '2026-03-26 13:12:19', '2026-03-26 13:07:26', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:07:26', '2026-03-26 13:07:26'),
(18, 2, 6, 'a908d3a1-b36b-4360-824a-680fe4b4066a', '2026-03-26 13:12:35', '2026-03-26 13:07:37', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:07:37', '2026-03-26 13:07:37'),
(19, 2, 6, '71483a27-903c-485b-9052-90e2c36cd0c1', '2026-03-26 13:16:30', '2026-03-26 13:11:33', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:11:33', '2026-03-26 13:11:33'),
(20, 2, 6, 'a5399358-66a1-4134-9ac2-ddf479ff813d', '2026-03-26 13:17:10', '2026-03-26 13:12:12', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:12:12', '2026-03-26 13:12:12'),
(21, 2, 6, '702e2e19-6696-458c-9a43-2109890e9b4c', '2026-03-26 13:26:32', '2026-03-26 13:21:34', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:21:34', '2026-03-26 13:21:34'),
(22, 2, 6, '53a17df6-6bde-43eb-9158-60572d35627a', '2026-03-26 13:27:57', '2026-03-26 13:22:59', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:22:59', '2026-03-26 13:22:59'),
(23, 2, 6, '428bfae1-aada-4792-a295-422a68436d5f', '2026-03-26 13:28:13', '2026-03-26 13:23:15', '106.222.227.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 13:23:15', '2026-03-26 13:23:15'),
(24, 1, 5, '986c5949-9787-4ad4-bf1a-031a93057bf6', '2026-03-26 22:26:48', '2026-03-26 22:21:51', '2401:4900:1c3b:68a1:21d7:1991:96a5:e438', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-26 22:21:51', '2026-03-26 22:21:51'),
(25, 1, 4, '9d2fb5ef-5838-4c28-832d-596ab893df05', '2026-03-27 12:00:10', '2026-03-27 11:55:12', '49.37.102.8', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-03-27 11:55:12', '2026-03-27 11:55:12'),
(26, 1, 4, '63e8c700-290e-476c-b339-3830de54a085', '2026-03-27 12:17:44', '2026-03-27 12:12:47', '2405:201:a80d:9814:1898:3c59:8b5b:3285', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-03-27 12:12:47', '2026-03-27 12:12:47'),
(27, 1, 5, '52055acc-fcbb-4bbb-9611-e4bca65a4ef9', '2026-03-28 13:08:57', '2026-03-28 13:04:00', '49.42.212.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-28 13:04:00', '2026-03-28 13:04:00'),
(28, 1, 5, '1bd5000f-e98d-494f-8cdc-603b90e4d865', '2026-03-28 13:09:17', '2026-03-28 13:04:18', '49.42.212.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-28 13:04:18', '2026-03-28 13:04:18'),
(29, 1, 7, '455f7ffa-66e4-47f3-a598-83ff4c433583', '2026-03-30 10:40:23', '2026-03-30 10:35:23', '2405:201:a801:22d0:b9b1:4db3:8acc:131d', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-30 10:35:23', '2026-03-30 10:35:23'),
(30, 1, 4, '9021683a-df61-47fb-8d76-0cece24d5d56', '2026-04-01 05:41:04', '2026-04-01 05:36:05', '2405:201:a801:22d0:7419:1768:3b1f:ddc3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 05:36:05', '2026-04-01 05:36:05'),
(31, 1, 4, '0c34ee21-1907-4737-a1c3-751353240d30', '2026-04-01 05:41:29', '2026-04-01 05:36:30', '2405:201:a801:22d0:7419:1768:3b1f:ddc3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 05:36:30', '2026-04-01 05:36:30'),
(32, 1, 4, '05815841-4fc9-49c5-ae2e-29f8aa33112e', '2026-04-01 05:42:24', '2026-04-01 05:37:25', '2405:201:a801:22d0:7419:1768:3b1f:ddc3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 05:37:25', '2026-04-01 05:37:25'),
(33, 2, 6, '91e4b7ba-dd50-4b75-ba11-0e82aa215967', '2026-04-01 08:33:38', '2026-04-01 08:28:39', '103.162.80.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 08:28:39', '2026-04-01 08:28:39'),
(34, 1, 4, '5d31ccf2-fdaf-4fe5-adba-6dedd55cdeaf', '2026-04-03 11:00:20', '2026-04-03 10:55:21', '2405:201:a801:22d0:2191:e92:4c33:37c', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-03 10:55:21', '2026-04-03 10:55:21');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sla_policy_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `phase_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `current_owner_kind` enum('USER','DEPARTMENT','UNASSIGNED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNASSIGNED',
  `current_owner_id` bigint(20) DEFAULT NULL,
  `state` enum('Draft','Assigned','InProgress','Blocked','InReview','Done','Cancelled','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `start_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `estimate_hours` decimal(5,2) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `parent_task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ticket_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `completion_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `task_code`, `title`, `description`, `task_type_id`, `sla_policy_id`, `project_id`, `phase_id`, `department_id`, `current_owner_kind`, `current_owner_id`, `state`, `start_at`, `due_at`, `completed_at`, `estimate_hours`, `tags`, `version`, `metadata`, `parent_task_id`, `ticket_id`, `created_by`, `assigned_to`, `assigned_department_id`, `completion_notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(258, 'TASK-450792-4PO', 'Question Library (SFS Bahalpur)', NULL, 2, 5, NULL, NULL, NULL, 'USER', 11, 'InProgress', '2026-03-31 11:10:00', '2026-04-09 05:40:00', NULL, 60.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:12:31', '2026-03-31 11:29:02', NULL),
(259, 'TASK-810574-S5F', 'Document Management System', NULL, 2, 7, NULL, NULL, NULL, 'USER', 11, 'Draft', '2026-03-31 11:16:00', '2026-04-08 05:46:00', NULL, 40.00, '[]', 2, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:17:27', '2026-03-31 11:18:18', NULL),
(260, 'TASK-993190-C1G', 'Tally Core API + Desalite fast', NULL, 2, 6, NULL, NULL, NULL, 'USER', 11, 'Draft', '2026-04-10 11:18:00', '2026-05-31 11:18:00', NULL, 200.00, '[]', 2, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:26:25', '2026-03-31 11:26:58', NULL),
(261, 'TASK-441364-T5X', 'Modulewise Data Transfer Option.', NULL, 2, 5, NULL, NULL, NULL, 'USER', 11, 'Draft', '2026-04-03 11:27:00', '2026-04-08 05:57:00', NULL, 20.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:28:49', '2026-03-31 11:28:49', NULL),
(262, 'TASK-605339-WOV', 'Examination Module Redesign in ERP', NULL, 2, 5, NULL, NULL, NULL, 'USER', 11, 'Draft', '2026-04-08 11:29:00', '2026-04-24 10:29:00', NULL, 100.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:31:31', '2026-03-31 11:31:31', NULL),
(263, 'TASK-926760-V1Z', 'Holychild School, Bijni Student Data Import (Few Conflict Students)', NULL, 2, 5, NULL, NULL, NULL, 'USER', 11, 'InProgress', '2026-04-01 11:35:00', '2026-04-02 05:35:00', NULL, 4.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 11:53:51', '2026-04-03 03:38:43', NULL),
(264, 'TASK-092921-KG2', 'ios release and bug fix', 'Ios release for gogamukh and galsi', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-03-31 11:54:00', '2026-04-01 11:54:00', '2026-03-31 12:36:15', 10.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-03-31 11:56:05', '2026-03-31 12:36:15', NULL),
(265, 'TASK-588924-X7H', 'ID Card Design, Holychild School, Bijni (Student, Employee and Parents)', NULL, 2, 6, NULL, NULL, NULL, 'USER', 11, 'Draft', '2026-04-03 12:01:00', '2026-06-05 06:01:00', NULL, 4.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-03-31 12:04:36', '2026-03-31 12:04:36', NULL),
(266, 'TASK-119257-JIR', 'Readmission - Ednect', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'Done', '2026-03-31 12:28:00', '2026-04-01 10:28:00', '2026-04-02 04:52:48', 8.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-03-31 12:29:07', '2026-04-02 04:52:48', NULL),
(267, 'TASK-492419-O59', 'Sfs Burburia and Mhs', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 7, 'Done', '2026-03-31 12:34:00', '2026-04-01 10:34:00', '2026-03-31 12:40:53', 8.00, '[]', 2, NULL, NULL, NULL, 7, NULL, NULL, NULL, '2026-03-31 12:35:31', '2026-03-31 12:40:53', NULL),
(268, 'TASK-827766-1YP', 'Mirai - Scholarship/Concession', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 8, 'Done', '2026-03-31 01:04:00', '2026-03-31 12:40:00', '2026-04-04 04:09:44', 20.00, NULL, 1, NULL, NULL, NULL, 8, NULL, NULL, NULL, '2026-03-31 12:42:17', '2026-04-04 04:09:44', NULL),
(269, 'TASK-712339-1GK', 'VASP Portal Fix and implementation', NULL, 2, 6, NULL, NULL, NULL, 'USER', 5, 'InProgress', '2026-03-31 03:50:00', '2026-04-07 12:30:00', NULL, 63.00, '[]', 1, '[]', NULL, NULL, 5, NULL, NULL, NULL, '2026-03-31 12:42:20', '2026-04-06 12:12:52', NULL),
(270, 'TASK-527822-1SH', 'Goswami Engineering Application Form', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 7, 'Done', '2026-04-01 03:52:00', '2026-04-01 07:52:00', '2026-04-01 05:30:35', 4.00, NULL, 1, NULL, NULL, NULL, 7, NULL, NULL, NULL, '2026-04-01 03:54:11', '2026-04-01 05:30:35', NULL),
(271, 'TASK-371454-UJE', 'Subject Mapping and Timetable Data Transfer (SFS Dhemaji)', 'Request By Partha Over Phone', 3, 8, NULL, NULL, NULL, 'USER', 11, 'Done', '2026-04-01 04:06:00', '2026-04-01 06:06:00', '2026-04-01 04:40:00', 2.00, '[]', 2, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-04-01 04:07:31', '2026-04-01 05:44:12', NULL),
(272, 'TASK-546746-WX1', 'Figma Design of Province', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'Done', '2026-04-01 04:09:00', '2026-04-01 12:09:00', '2026-04-01 10:15:06', 8.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-01 04:09:27', '2026-04-01 10:15:06', NULL),
(273, 'TASK-511215-YU2', 'New app release', 'create and configure new app for app release for SFS Galsi and Fransalian.', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-01 04:08:00', '2026-04-01 13:08:00', '2026-04-01 12:25:02', 9.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-01 04:10:34', '2026-04-01 12:25:02', NULL),
(274, 'TASK-364770-2WK', 'SFS Burburia Website', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 7, 'InProgress', '2026-04-01 05:29:00', '2026-04-07 09:59:00', NULL, 40.00, NULL, 1, NULL, NULL, NULL, 7, NULL, NULL, NULL, '2026-04-01 05:30:23', '2026-04-01 05:30:30', NULL),
(275, 'TASK-633426-LFV', 'Manikbond Data Transfer', 'Please update the data for SJS Manikbond', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-01 06:07:00', '2026-04-02 04:07:00', '2026-04-07 04:17:21', 8.00, '[]', 1, '[]', NULL, NULL, 1, NULL, NULL, NULL, '2026-04-01 06:09:58', '2026-04-07 04:17:21', NULL),
(277, 'TASK-740573-P29', 'HPS Appointment Letter', 'Please update the appointment letter for HPS Gotanagar and Bharalumukh', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Draft', '2026-04-01 08:39:00', '2026-04-04 08:39:00', NULL, 20.00, '[]', 1, '[]', NULL, NULL, 1, NULL, NULL, NULL, '2026-04-01 08:39:51', '2026-04-01 08:39:51', NULL),
(278, 'TASK-195531-JVR', 'RSCPL-New session support', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 5, 'Done', '2026-04-01 04:49:00', '2026-04-01 12:38:00', '2026-04-01 14:07:55', 4.00, NULL, 1, NULL, NULL, NULL, 5, NULL, NULL, NULL, '2026-04-01 09:54:46', '2026-04-01 14:07:55', NULL),
(279, 'TASK-435828-YAR', 'Lengpui Class XI Report Card', NULL, 2, 5, NULL, NULL, NULL, 'USER', 11, 'Done', '2026-04-02 03:40:00', '2026-04-04 10:00:00', '2026-04-02 08:31:03', 12.00, NULL, 1, NULL, NULL, NULL, 11, NULL, NULL, NULL, '2026-04-01 10:49:04', '2026-04-02 08:31:03', NULL),
(280, 'TASK-129730-B19', 'FastDibrugarh - Dynamic report included export in pdf and Excel', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 8, 'Done', '2026-04-01 10:58:00', '2026-04-02 03:58:00', '2026-04-01 13:24:43', 3.00, NULL, 1, NULL, NULL, NULL, 8, NULL, NULL, NULL, '2026-04-01 11:00:12', '2026-04-01 13:24:43', NULL),
(281, 'TASK-075633-1C4', 'DBHS silapathar ios release', 'Setup and and make release build for the silapathar ios', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-02 03:54:00', '2026-04-02 10:54:00', '2026-04-02 10:54:22', 7.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-02 03:58:11', '2026-04-02 10:54:22', NULL),
(282, 'TASK-573361-4IU', 'Android dhemaji', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'InProgress', '2026-04-02 04:49:00', '2026-04-02 12:49:00', NULL, 8.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-02 04:54:02', '2026-04-02 04:54:07', NULL),
(283, 'TASK-195318-6PI', 'Workflow and Data Diagram for Parish Management', 'Workflow and Data Diagram for Parish Management', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Done', '2026-04-02 05:03:00', '2026-04-02 11:03:00', '2026-04-03 06:06:59', 6.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-02 05:04:18', '2026-04-03 06:06:59', NULL),
(284, 'TASK-263887-37M', 'SFS Galsi , Gallery Images Updation', 'SFS Galsi , Gallery Images Updation', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Done', '2026-04-02 05:04:00', '2026-04-02 06:04:00', '2026-04-02 06:09:58', 1.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-02 05:05:17', '2026-04-02 06:09:58', NULL),
(285, 'TASK-751786-2N5', 'App telam', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'Done', '2026-04-02 04:54:00', '2026-04-02 12:54:00', '2026-04-02 12:18:35', 8.00, '[]', 2, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-02 05:29:28', '2026-04-02 12:18:35', NULL),
(286, 'TASK-552532-B6Y', 'Msfs Homepage Banner Adjustment', 'Msfs Homepage Banner Adjustment', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Done', '2026-04-02 05:22:00', '2026-04-02 06:22:00', '2026-04-02 06:36:09', 1.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-02 05:42:53', '2026-04-02 06:36:09', NULL),
(287, 'TASK-131091-XCS', '.NET Training', 'Training Regarding , how Fee Collection work in the ERP both Online and Offline.', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 05:31:00', '2026-04-09 06:10:00', '2026-04-02 07:19:00', 0.50, '[]', 2, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 07:04:57', '2026-04-02 07:21:47', NULL),
(288, 'TASK-949938-3QC', 'SFS Guwahati Fee Structure Updation Session 2026-2027', 'SFS Guwahati Fee Structure Updation Session 2026-2027', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Done', '2026-04-02 07:12:00', '2026-04-02 07:42:00', '2026-04-02 07:24:19', 0.50, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-02 07:13:08', '2026-04-02 07:24:19', NULL),
(289, 'TASK-717866-Y5K', 'MHS Client timetable Training', 'Explain the concept of parallel entry and parallel Location', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 03:00:00', '2026-04-02 03:55:00', '2026-04-02 07:36:46', 0.34, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 07:36:29', '2026-04-02 07:36:46', NULL),
(290, 'TASK-843767-OI1', 'Admission Form', 'Unable to add the student through admission Form', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-02 09:57:00', '2026-04-07 10:27:00', NULL, 26.00, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 10:01:35', '2026-04-02 10:01:35', NULL),
(291, 'TASK-229507-UMS', 'RPS App Release build setup', 'Create an app release build and setup for ios.', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-02 05:58:00', '2026-04-02 10:58:00', '2026-04-02 12:23:04', 5.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-02 10:08:49', '2026-04-02 12:23:04', NULL),
(292, 'TASK-275748-Y1I', 'Sale Training', 'Please provide a demo training session with added pitches.', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 07:30:00', '2026-04-04 04:04:00', '2026-04-02 10:15:25', 0.58, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 10:15:16', '2026-04-02 10:15:25', NULL),
(293, 'TASK-974555-1U0', 'Class 9 Report Printing', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 10:16:00', '2026-04-02 10:19:00', '2026-04-02 10:17:17', 0.05, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 10:17:11', '2026-04-02 10:17:17', NULL),
(294, 'TASK-042852-LH2', 'EST Student promotion Training', 'How to proceed with Promotion Process', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 10:17:00', '2026-04-02 10:27:00', '2026-04-02 10:19:48', 0.17, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 10:19:42', '2026-04-02 10:19:48', NULL),
(296, 'TASK-218763-HPH', 'Report Card Analysis', 'Make my teammate  to understand the concept of carry forward mark', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-02 09:30:00', '2026-04-02 10:34:00', '2026-04-02 10:27:24', 0.25, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-02 10:27:19', '2026-04-02 10:27:24', NULL),
(297, 'TASK-719922-MLI', 'Cold Calling & follow-up calls', 'Did Call calling to west Bengal and Mizoram School and few Meghalaya Schools.\r\nTook follow-ups calls on previous schools who asked for brochure', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-02 04:30:00', '2026-04-02 08:30:00', '2026-04-02 11:05:05', 4.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-02 11:04:44', '2026-04-02 11:05:05', NULL),
(298, 'TASK-914697-9Q7', 'Emailing & Follow-up Emails', 'Drafted and send emails and also took follow-up', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-02 11:04:00', '2026-04-04 08:04:00', '2026-04-02 11:09:06', 2.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-02 11:09:00', '2026-04-02 11:09:06', NULL),
(299, 'TASK-668639-UCE', '3 hours Bootcamp Training', 'Training of HR to 2 students who joined on 30th March and 1st April', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'InProgress', '2026-04-02 04:30:00', '2026-07-31 06:30:00', NULL, 720.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-02 11:20:57', '2026-04-04 06:58:52', NULL),
(301, 'TASK-710736-CVY', 'Data Fetching', 'Did data collection on schools of Sikkim and Arunachal', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-02 03:30:00', '2026-04-02 08:00:00', '2026-04-02 11:38:07', 4.50, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-02 11:37:54', '2026-04-02 11:38:07', NULL),
(302, 'TASK-897042-9F1', 'Cold Calling / Follow ups', 'Did calling to the schools and took follow ups on the interested clients', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-02 09:30:00', '2026-04-02 11:30:00', '2026-04-02 11:42:36', 2.00, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-02 11:42:31', '2026-04-02 11:42:36', NULL),
(303, 'TASK-160284-QY1', 'Lead Generation and Demo trails', 'Did scheduled  a demo and was getting trained for demo', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-02 08:00:00', '2026-04-02 09:30:00', '2026-04-02 11:45:03', 1.50, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-02 11:44:57', '2026-04-02 11:45:03', NULL),
(306, 'TASK-415597-CNY', 'Parish Management Multi role dashboard design', 'Parish Management Multi role dashboard design', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-03 03:53:00', '2026-04-03 03:53:00', NULL, 6.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-03 03:53:46', '2026-04-03 06:06:48', NULL),
(307, 'TASK-167940-TOD', 'The RPS IOS release', 'Createa release build and send app for review', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-03 04:06:00', '2026-04-04 08:30:00', '2026-04-03 12:18:39', 5.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-03 04:08:21', '2026-04-03 12:18:39', NULL),
(308, 'TASK-495493-06O', 'screen for parish management', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'Done', '2026-04-03 04:11:00', '2026-04-03 04:11:00', '2026-04-06 12:35:04', 48.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-03 04:11:54', '2026-04-06 12:35:04', NULL),
(309, 'TASK-449213-OPF', 'RSCPL-Report Data Load issue', 'Fix past year report data, past year report data are not loading even after selecting past year as financial year.', 1, 1, NULL, NULL, NULL, 'USER', 5, 'Done', '2026-04-03 04:27:00', '2026-04-03 06:27:00', '2026-04-03 12:20:00', 1.00, NULL, 1, NULL, NULL, NULL, 5, NULL, NULL, NULL, '2026-04-03 04:28:25', '2026-04-03 12:20:00', NULL),
(310, 'TASK-202385-CO2', 'Promotion Process-HPSB', 'Explain the steps, how to do the promotion process', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-03 03:30:00', '2026-04-03 03:40:00', '2026-04-03 05:14:05', 0.17, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 05:14:00', '2026-04-03 05:14:05', NULL),
(311, 'TASK-292093-UKF', 'Admission Form~Burburia', 'Please add the admission form for the Burburia school, as they are currently unable to complete the admission process.', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-03 05:14:00', '2026-04-03 05:14:00', '2026-04-03 07:18:47', NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 05:23:33', '2026-04-03 07:18:47', NULL),
(312, 'TASK-074048-BXG', 'Apsoprs Accomodation Page Updates', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 7, 'Done', '2026-04-03 05:30:00', '2026-04-03 09:30:00', '2026-04-03 08:22:55', 4.00, NULL, 1, NULL, NULL, NULL, 7, NULL, NULL, NULL, '2026-04-03 05:29:03', '2026-04-03 08:22:55', NULL),
(313, 'TASK-488398-6EH', 'HPS Data Transfer', 'Please transfer the Book and Syllabus for both branches.', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-03 05:34:00', '2026-04-03 09:34:00', '2026-04-03 09:07:46', 4.00, '[]', 1, '[]', NULL, NULL, 1, NULL, NULL, NULL, '2026-04-03 05:35:13', '2026-04-03 09:07:46', NULL),
(314, 'TASK-994893-CYW', 'DEMO SESSION', 'Product Demo', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-03 05:30:00', '2026-04-03 06:30:00', '2026-04-03 06:44:18', 1.00, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 06:34:29', '2026-04-03 06:44:18', NULL),
(315, 'TASK-653795-P3K', 'DEMO SESSION', 'Provided a demo session to a client alongside my Colleague Prandeep', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-03 05:30:00', '2026-04-03 06:30:00', '2026-04-03 06:46:35', 1.00, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-03 06:46:30', '2026-04-03 06:46:35', NULL),
(316, 'TASK-809087-898', 'Data Collection', 'Collecting data of schools in Sikkim', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-03 06:30:00', '2026-04-03 11:30:00', '2026-04-03 09:34:10', 5.00, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-03 06:50:04', '2026-04-03 09:34:10', NULL),
(317, 'TASK-764021-CXG', 'MHS Premium', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 14, 'Done', '2026-04-03 07:35:00', '2026-04-03 07:35:00', '2026-04-04 04:50:22', 2.00, NULL, 1, NULL, NULL, NULL, 14, NULL, NULL, NULL, '2026-04-03 07:36:24', '2026-04-04 04:50:22', NULL),
(318, 'TASK-717039-XZO', 'Mirai admission issue', 'Unable to select the level', 3, 9, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-03 08:25:00', '2026-04-03 08:25:00', '2026-04-03 11:39:27', NULL, '[]', 3, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 08:26:16', '2026-04-03 11:39:27', NULL),
(320, 'TASK-545254-MIW', 'MHS CONVERION TO PREMIUM', 'Please convert package from standard tp premium', 3, 8, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-03 08:55:00', '2026-04-03 08:55:00', '2026-04-04 04:50:27', NULL, '[]', 2, '[]', 317, NULL, 12, NULL, NULL, NULL, '2026-04-03 08:57:16', '2026-04-04 04:50:27', NULL),
(322, 'TASK-828623-8CW', 'Chapter plan/lesson plan/reflection Sheet ~ HPSG And HPSB', 'Please add the Chapter plan/lesson plan/reflection same as the Dhemaji in the HPS', 3, 10, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-03 10:07:00', '2026-04-03 10:07:00', NULL, NULL, '[]', 2, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 10:10:07', '2026-04-03 10:10:52', NULL),
(324, 'TASK-877535-KPV', 'Team-mate Training', 'include some tasks in the demo, such as admission processing, roll number assignment, fee collection, etc', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-03 14:30:00', '2026-04-04 03:40:00', '2026-04-03 11:22:19', 0.17, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-03 11:16:44', '2026-04-03 11:22:19', NULL),
(325, 'TASK-833476-R5M', 'Dhemaji ios app release', 'Setup and create a release build for ios dhemaji', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-03 11:46:00', '2026-04-04 07:46:00', '2026-04-03 12:18:47', 6.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-03 11:52:43', '2026-04-03 12:18:47', NULL),
(326, 'TASK-210588-S9U', 'Data Fetching', 'Data Collection on Meghalaya Schools & few West Bengals', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-03 04:00:00', '2026-04-04 09:00:00', '2026-04-03 12:13:26', 5.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-03 12:10:43', '2026-04-03 12:13:26', NULL),
(327, 'TASK-450047-3PA', 'Emailing & Follow-ups', 'Drafted and send emails to Nagaland & Meghalaya schools & took follow-up', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-03 09:30:00', '2026-04-03 10:30:00', '2026-04-03 12:23:15', 1.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-03 12:15:12', '2026-04-03 12:23:15', NULL),
(328, 'TASK-516791-P5J', 'Cold Calling', 'Did call calling to west Bengals and took follow up calls on Meghalaya', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-03 10:30:00', '2026-04-03 11:30:00', '2026-04-03 12:23:04', 1.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-03 12:21:06', '2026-04-03 12:23:04', NULL),
(329, 'TASK-846684-NPD', 'Holy Child Bijni', 'New Updates from client', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-04 03:54:00', '2026-04-04 03:54:00', NULL, 2.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 03:54:39', '2026-04-04 04:44:49', NULL),
(330, 'TASK-904213-X9S', 'Alliance Engineers - Wordpress Implementation', 'New Implementation - https://alliance-engineers.in/', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Draft', '2026-04-04 03:54:00', '2026-05-21 11:24:00', NULL, 288.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 03:58:25', '2026-04-04 03:58:25', NULL),
(331, 'TASK-171577-LKH', 'Nazareth School Aizawl - Fine Tuning', 'Nazareth School Aizawl', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Draft', '2026-04-04 03:58:00', '2026-04-23 07:28:00', NULL, 120.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 04:00:24', '2026-04-04 04:00:24', NULL),
(332, 'TASK-242719-XOM', 'SFS Sateek - Bug Fixing', 'https://sfssateek.in/ - Internal pages issue for design', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Draft', '2026-04-04 04:00:00', '2026-04-23 07:30:00', NULL, 120.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 04:01:50', '2026-04-04 04:01:50', NULL),
(333, 'TASK-331452-MAK', 'SFS Burburia - Fine Tuning', 'https://sfsburburia.laksvrddhi.com/ - Fine tuning for the pages', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Draft', '2026-04-04 04:01:00', '2026-04-23 07:31:00', NULL, 120.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 04:03:00', '2026-04-04 04:03:00', NULL),
(334, 'TASK-541781-YPZ', 'Parish Management System', 'Tech stack for PMS\r\n-> Frontend - “Slim Mui React Starter”\r\n-> Backend - “Laravel 13”\r\n-> PHP - “8.3”\r\n-> Database – “Mysql / 10.6.23-MariaDB”\r\nEstimated date of completion: “30-04-2026”\r\n*Based on project complecity estimated date can be extended.*\r\nDevelopment Server: “https://pms.laksvrddhi.com”\r\nGit Repo: “https://github.com/badal-vasptechnologies/parish-management-\r\nsystem.git”\r\nBranch: “dev”\r\n\r\n\r\nModules distribution after discussion\r\nDeveloper’s: Sarowar, Ritupan & Badal\r\nSarowar will handled: Module 3\r\nRitupan will handled: Module 4\r\nBadal will handled: Module 1, 2, 5, 6, 7, 8', 2, 6, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-04 04:03:00', '2026-06-30 06:33:00', NULL, 624.00, '[\"Fullstack\"]', 5, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-04 04:06:14', '2026-04-04 04:36:04', NULL),
(335, 'TASK-785176-26H', 'Merai - Scholarhip', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 8, 'InProgress', '2026-04-04 04:09:00', '2026-04-07 03:39:00', NULL, 10.00, NULL, 1, NULL, NULL, NULL, 8, NULL, NULL, NULL, '2026-04-04 04:10:58', '2026-04-04 04:11:00', NULL),
(336, 'TASK-192664-DXY', 'Holy Child Bijni school app release for ios', 'Test and debug holy child for the ios and make a release build', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-04 04:16:00', '2026-04-04 04:16:00', '2026-04-04 08:16:51', 9.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-04 04:18:04', '2026-04-04 08:16:51', NULL),
(337, 'TASK-439875-W50', 'Transfer the Time-table data ~Gogamukh', NULL, 3, 8, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-04 04:20:00', '2026-04-04 04:20:00', '2026-04-04 05:13:02', NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-04 04:21:16', '2026-04-04 05:13:02', NULL),
(341, 'TASK-537021-4E1', 'ID Cards Design ~ Holly Child', 'Please Update the Id card design for both teacher and student.', 3, 10, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-04 04:22:00', '2026-04-04 04:22:00', NULL, NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-04 04:25:21', '2026-04-04 04:25:21', NULL),
(342, 'TASK-053048-ZFW', 'Removable of  CBSE FORMATE', 'Under website Module in the ERP, CBSE FORMATE Need to remove.', 3, 10, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-04 04:30:00', '2026-04-04 04:30:00', NULL, NULL, '[]', 2, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-04 04:35:17', '2026-04-04 04:36:05', NULL),
(343, 'TASK-595187-D8C', 'RSCPL Data Update', NULL, 3, 9, NULL, NULL, NULL, 'USER', 5, 'Done', '2026-04-04 05:10:00', '2026-04-04 06:25:00', '2026-04-04 05:33:20', 0.17, NULL, 1, NULL, NULL, NULL, 5, NULL, NULL, NULL, '2026-04-04 05:31:50', '2026-04-04 05:33:20', NULL),
(344, 'TASK-789635-92Z', 'Interview calls', 'Around 20+ calls have been taken to find suitable candidates for IT Support/.Net /WordPress/Digital Marketing/BDA', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-04 06:56:00', '2026-04-04 08:30:00', '2026-04-04 07:12:27', 4.00, '[]', 2, '[]', NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 06:58:08', '2026-04-04 07:12:27', NULL),
(345, 'TASK-633823-2VD', 'Data Fertching', 'did data fetching on schools in Sikkim', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-04 03:30:00', '2026-04-06 06:30:00', '2026-04-04 07:11:06', 3.00, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-04 07:10:57', '2026-04-04 07:11:06', NULL),
(346, 'TASK-670368-4QK', 'Lead Generation', 'Scheduling and coordinating with the interested clients', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-04 07:00:00', '2026-04-04 08:30:00', '2026-04-04 07:13:55', 1.50, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-04 07:13:10', '2026-04-04 07:13:55', NULL),
(347, 'TASK-757502-7QC', 'Managed team of BDA', 'Guided and gave the BDA team and required changes made in their existing way of data collection and calling.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-04 04:00:00', '2026-04-04 08:09:00', '2026-04-04 07:16:00', 4.00, '[]', 3, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 07:15:11', '2026-04-04 07:29:48', NULL),
(348, 'TASK-305353-S83', 'e-mailing', 'Did emailing to the schools', NULL, NULL, NULL, NULL, NULL, 'USER', 18, 'Done', '2026-04-04 07:30:00', '2026-04-04 08:00:00', '2026-04-04 08:02:28', 0.50, NULL, 1, NULL, NULL, NULL, 18, NULL, NULL, NULL, '2026-04-04 07:22:55', '2026-04-04 08:02:28', NULL),
(349, 'TASK-121162-BFV', 'BDA candidate joining', 'BDA candidate will be joining on 20th April in 13k salary as discussed.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'InProgress', '2026-03-31 11:00:00', '2026-04-20 03:30:00', NULL, 23.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 07:25:04', '2026-04-04 07:25:18', NULL),
(350, 'TASK-522369-WDI', '.NET Candidate joining', 'Subhajit - .NET candidate will be joining by 4th May in STPI office', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'InProgress', '2026-02-02 07:25:00', '2026-05-04 03:30:00', NULL, 23.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 07:27:42', '2026-04-04 07:27:52', NULL),
(351, 'TASK-812048-Z6Y', 'Medium of hiring', 'New hiring requirement has been posted on different job portals like Naukri, LinkedIn, Social media platforms, employee referrals, etc.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'InProgress', '2026-04-04 03:30:00', '2026-04-30 12:30:00', NULL, 23.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 07:33:08', '2026-04-06 11:51:25', '2026-04-06 11:51:25'),
(352, 'TASK-897773-S6U', 'Student Promotion Process ~EST', 'Explain the student promotion Process', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-04 03:00:00', '2026-04-04 03:35:00', '2026-04-04 07:33:37', 0.08, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-04 07:33:25', '2026-04-04 07:33:37', NULL),
(353, 'TASK-024724-W0J', 'Time-table ~ Gogamukh', 'Explain the concept of subject allotment and manage time table', NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-04 05:33:00', '2026-04-04 06:03:00', '2026-04-04 07:35:43', 0.50, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-04 07:35:37', '2026-04-04 07:35:43', NULL),
(354, 'TASK-009725-D32', 'Offer letter release', 'Offer letter has been released for both the candidates who will be joining as BDA and .NET', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-04 07:33:00', '2026-04-04 08:33:00', '2026-04-04 07:35:46', 1.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 07:35:38', '2026-04-04 07:35:46', NULL),
(355, 'TASK-354185-FQ2', 'Interview of BDA (Offline scheduled)', 'Candidate of BDA has been scheduled today and candidate has been Selected.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-04 07:30:00', '2026-04-06 09:00:00', '2026-04-04 08:37:48', 3.00, '[]', 3, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-04 08:10:46', '2026-04-04 08:37:48', NULL),
(356, 'TASK-437897-KE4', 'Cold calling', 'Made 15 call out of which 8 responded, some they have ERP and the rest not interested', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-04 04:00:00', '2026-04-06 06:00:00', '2026-04-04 08:18:36', 2.50, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-04 08:16:30', '2026-04-04 08:18:36', NULL),
(357, 'TASK-594650-VG5', 'Data Fetching & Emailing', 'completed data fetching & Emailing on silchar schools', NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-04 06:00:00', '2026-04-06 07:30:00', '2026-04-04 08:18:42', 1.50, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-04 08:18:21', '2026-04-04 08:18:42', NULL),
(358, 'TASK-349517-UA4', 'Leave Configuration ~Gogamukh', 'Unable to configure Leave', 3, 9, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-06 02:59:00', '2026-04-06 02:59:00', '2026-04-06 04:51:51', NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 03:02:17', '2026-04-06 04:51:51', NULL),
(359, 'TASK-985154-008', 'WHATSAPP PORTAL ~ Social.ednect', 'Unable to create the Suppot account', 3, 9, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-06 03:43:00', '2026-04-06 03:43:00', '2026-04-06 04:51:45', NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 03:45:19', '2026-04-06 04:51:45', NULL),
(360, 'TASK-437624-0T1', 'Alliance Engineers Wordpress Templates Preparation', 'Alliance Engineers Wordpress Templates Preparation', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-06 03:50:00', '2026-04-06 03:50:00', NULL, 1.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-06 03:51:20', '2026-04-06 03:51:25', NULL),
(361, 'TASK-121194-OUJ', 'Data Fetching ON West Bengals School', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-06 03:50:00', '2026-04-06 05:10:00', '2026-04-06 05:13:35', 1.33, '[]', 6, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-06 03:51:53', '2026-04-06 05:13:35', NULL),
(362, 'TASK-705853-LC6', 'Cold Calling & Follow -ups', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-06 05:10:00', '2026-04-06 08:30:00', '2026-04-06 09:26:31', 3.33, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-06 03:56:28', '2026-04-06 09:26:31', NULL),
(363, 'TASK-801155-SLH', 'Emailing & Follow -ups', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 19, 'Done', '2026-04-06 10:30:00', '2026-04-06 12:30:00', '2026-04-06 11:28:59', 2.00, NULL, 1, NULL, NULL, NULL, 19, NULL, NULL, NULL, '2026-04-06 03:57:26', '2026-04-06 11:28:59', NULL),
(364, 'TASK-144280-H1H', 'Holy Child Bijni, Mobile Responsivness', 'Mentioned by hcb consult person to look into this issue in priority as people used to mobile device', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-06 03:51:00', '2026-04-06 05:51:00', NULL, 2.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-06 04:04:06', '2026-04-06 04:04:12', NULL),
(365, 'TASK-700072-B3E', 'Galsi IOS app issue fix', 'Galsi app issue fix for ios release.', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-06 04:27:00', '2026-04-06 07:27:00', '2026-04-06 06:15:07', 3.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-06 04:30:59', '2026-04-06 06:15:07', NULL),
(366, 'TASK-136351-LN3', 'SFS Guwahati ID Card Changes', 'SFS Guwahati ID Card Changes', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-06 04:52:00', '2026-04-06 05:52:00', '2026-04-06 05:41:59', 1.00, '[]', 1, '[]', NULL, NULL, 14, NULL, NULL, NULL, '2026-04-06 04:52:38', '2026-04-06 05:41:59', NULL),
(367, 'TASK-636948-OPC', 'ednect - timetable issue fix', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'InProgress', '2026-04-06 05:00:00', '2026-04-06 05:00:00', NULL, 8.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-06 05:00:59', '2026-04-06 05:01:02', NULL),
(368, 'TASK-943537-D4K', 'desalite time table fix', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 9, 'InProgress', '2026-04-06 05:01:00', '2026-04-08 13:01:00', NULL, 8.00, NULL, 1, NULL, NULL, NULL, 9, NULL, NULL, NULL, '2026-04-06 05:39:26', '2026-04-06 05:39:32', NULL),
(369, 'TASK-154700-QYZ', 'RPS Consolidated Report Logic Changes', 'RPS Consolidated Report Logic Changes for Admission and Fees', NULL, NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-06 05:42:00', '2026-04-06 08:42:00', '2026-04-06 11:22:00', 3.00, '[]', 1, '[]', NULL, NULL, 14, NULL, NULL, NULL, '2026-04-06 05:43:20', '2026-04-06 11:22:00', NULL),
(370, 'TASK-110354-C4E', 'Desalite connect Notification count issue', 'Desalite connect Notification count issue solution', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Done', '2026-04-06 04:30:00', '2026-04-06 10:30:00', '2026-04-06 12:39:14', 6.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-06 06:16:27', '2026-04-06 12:39:14', NULL),
(371, 'TASK-878956-FRU', 'MSFS FAST web application documentation and structuring', 'MSFS FAST web application documentation and structuring', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'InProgress', '2026-04-06 06:28:00', '2026-04-06 10:28:00', NULL, 4.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-06 06:45:42', '2026-04-07 03:57:34', NULL),
(372, 'TASK-571526-68X', 'Time-Table/Time Slot ~ MHS', 'Need to add the time slot concept in the Current Time-table.\r\nFollowings time\r\n1st period  8:20 to 9:05\r\n2nd period 9:05 to 9:50\r\n3rd period  9:50 to 10:35\r\n4th period  10:35 to 11:15\r\nTiffin break 11:15 to 11:30\r\n5th period  11:30 to 12 :10 pm\r\n6th period  12:10pm to 12:50 pm\r\n7th period 12:50pm to 1:25 pm', 3, 10, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-06 06:39:00', '2026-04-20 12:30:00', NULL, 72.00, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 06:55:23', '2026-04-06 06:55:23', NULL),
(373, 'TASK-512194-0RX', 'SFS GHYprincipal Id Card Sign', NULL, 2, 5, NULL, NULL, NULL, 'USER', 14, 'Done', '2026-04-06 05:44:00', '2026-04-06 06:04:00', '2026-04-06 07:10:03', 0.33, NULL, 1, NULL, NULL, NULL, 14, NULL, NULL, NULL, '2026-04-06 06:56:01', '2026-04-06 07:10:03', NULL),
(374, 'TASK-192399-EAL', 'TIme-Table issue ~mhs', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 03:30:00', '2026-04-06 03:40:00', '2026-04-06 09:54:10', 0.17, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 09:54:05', '2026-04-06 09:54:10', NULL),
(375, 'TASK-254638-28F', 'Employee leave Config ~HPS', NULL, NULL, NULL, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 02:35:00', '2026-04-06 03:50:00', '2026-04-06 09:56:43', 0.33, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 09:56:38', '2026-04-06 09:56:43', NULL),
(376, 'TASK-842782-WEJ', 'Leave Apply issue', 'Unable to apply leave', 3, 9, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 06:30:00', '2026-04-06 10:40:00', '2026-04-06 10:22:05', 0.33, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 10:22:00', '2026-04-06 10:22:05', NULL),
(377, 'TASK-149357-XLF', 'Training session for new employee~Telam', NULL, 3, 10, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 07:30:00', '2026-04-06 09:23:00', '2026-04-06 10:32:12', 1.00, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 10:32:06', '2026-04-06 10:32:12', NULL),
(378, 'TASK-573571-5YH', 'Student Login issue ~RPS', 'Update the password', 4, 11, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 10:49:00', '2026-04-06 10:59:00', '2026-04-06 10:52:18', 0.17, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 10:52:12', '2026-04-06 10:52:18', NULL),
(379, 'TASK-752586-N8B', 'Promotion Process', 'Promoting students from 2025 to 20026', 4, 11, NULL, NULL, NULL, 'USER', 12, 'InProgress', '2026-04-06 09:30:00', '2026-04-06 11:30:00', NULL, 2.00, '[]', 2, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 10:54:31', '2026-04-06 11:22:26', NULL),
(380, 'TASK-244549-UAQ', 'Double Name issue ~HPSB', 'Following Students showing double name while collecting fee.\r\n1. KINJAL SHARMA  - HPSB121333\r\n2. OJASWI SARAWAGI - HPSB121591\r\n3. SAMRIDDHI SHARMA -  HPSB121304\r\n4. YUG JAIN - HPSB121313\r\n5. YASH JAIN - HPSB121312', 3, 10, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Done', '2026-04-06 11:00:00', '2026-04-06 12:00:00', '2026-04-06 11:25:12', 1.00, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 11:02:59', '2026-04-06 11:25:12', NULL),
(381, 'TASK-693653-JB4', 'Razor pay ~Holy Child', 'Explain the process of *connect with agent* And proceed with video varification', 4, 12, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 11:04:00', '2026-04-06 11:09:00', '2026-04-06 11:09:45', 0.08, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 11:09:36', '2026-04-06 11:09:45', NULL),
(382, 'TASK-985922-DMF', 'Class Teacher Assign issue ~My Three Jey', NULL, 3, 10, NULL, NULL, NULL, 'USER', 12, 'Done', '2026-04-06 11:09:00', '2026-04-06 11:14:00', '2026-04-06 11:14:48', 0.08, NULL, 1, NULL, NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 11:14:41', '2026-04-06 11:14:48', NULL),
(383, 'TASK-159480-8JT', 'Leave Count Issue ~Dhemaji', 'Unable to apply leave', 3, 9, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-06 11:15:00', '2026-04-06 11:15:00', NULL, NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 11:17:43', '2026-04-06 11:17:43', NULL),
(384, 'TASK-858198-KQV', 'RPS Fee Collection Report', 'Need to correct the Old Class 10 Student in Class XI in next year', NULL, NULL, NULL, NULL, NULL, 'USER', 14, 'InProgress', '2026-04-06 11:27:00', '2026-04-06 11:27:00', NULL, 0.33, NULL, 1, NULL, NULL, NULL, 14, NULL, NULL, NULL, '2026-04-06 11:28:23', '2026-04-06 11:28:28', NULL),
(385, 'TASK-427036-1AV', 'Holychild App Need to Live', NULL, 4, 11, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-06 11:37:00', '2026-04-22 06:37:00', NULL, 96.00, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-06 11:38:06', '2026-04-06 11:38:06', NULL),
(386, 'TASK-783588-L7P', 'Interview calls for today', '20+ calls made for the positions of .NET/SEO/IT Support/BDA', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-06 05:00:00', '2026-04-07 12:42:00', '2026-04-06 11:51:53', 6.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-06 11:46:34', '2026-04-06 11:51:53', NULL),
(387, 'TASK-002428-R38', 'Job postings', 'Job postings are done the portals of Naukri and LinkedIn, Employee referrals, Naukri, and social media platforms.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-06 09:34:00', '2026-04-07 11:50:00', '2026-04-06 11:51:47', 3.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-06 11:49:40', '2026-04-06 11:51:47', NULL),
(388, 'TASK-190137-1HC', 'Bootcamp training for today', '3 hours training of Bootcamp given in 1st half', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-06 04:49:00', '2026-04-07 07:30:00', '2026-04-06 11:51:35', 3.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-06 11:50:53', '2026-04-06 11:51:35', NULL),
(389, 'TASK-317511-02D', 'Interview status of BDA', 'Interview taken for BDA has been confirmed the joining on 21st April and have asked to submit all the documents.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-06 04:00:00', '2026-04-06 06:00:00', '2026-04-06 11:57:00', 2.00, '[]', 3, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-06 11:53:37', '2026-04-06 11:57:00', NULL),
(390, 'TASK-479288-UJF', 'Interview scheduled for .NET', 'Interview has been scheduled for 8th April of .NET with Bhanu Sir.', NULL, NULL, NULL, NULL, NULL, 'USER', 15, 'Done', '2026-04-06 07:54:00', '2026-04-06 11:54:00', '2026-04-06 11:57:08', 4.00, NULL, 1, NULL, NULL, NULL, 15, NULL, NULL, NULL, '2026-04-06 11:56:39', '2026-04-06 11:57:08', NULL),
(391, 'TASK-763976-TOM', 'Unable add the student ~Burburia', 'Unable to save the Admission Form', 3, 9, NULL, NULL, NULL, 'UNASSIGNED', NULL, 'Assigned', '2026-04-07 02:42:00', '2026-04-07 02:42:00', NULL, NULL, '[]', 1, '[]', NULL, NULL, 12, NULL, NULL, NULL, '2026-04-07 02:43:51', '2026-04-07 02:43:51', NULL),
(392, 'TASK-568149-YE7', 'SFS bolg wordpress site migration to sfsguwahati', 'SFS bolg wordpress site migration to sfsguwahati', NULL, NULL, NULL, NULL, NULL, 'USER', 13, 'Draft', '2026-04-07 04:01:00', '2026-04-13 06:31:00', NULL, 48.00, NULL, 1, NULL, NULL, NULL, 13, NULL, NULL, NULL, '2026-04-07 04:03:32', '2026-04-07 04:03:32', NULL),
(393, 'TASK-583272-U8N', 'Create a release build for Desalite connect and Gogamukh', 'Create a release for both android and ios of Desalite connect and Gogamukh with updated timetable functionality.', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'Draft', '2026-04-07 04:19:00', '2026-04-07 10:19:00', NULL, 6.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-07 04:24:54', '2026-04-07 04:24:54', NULL),
(394, 'TASK-901107-Y1Z', 'Optimise the notification counter icon SFS Guwahati', 'Optimise the notification icon counter to disappear after seen in SFS Guwahati.', NULL, NULL, NULL, NULL, NULL, 'USER', 10, 'InProgress', '2026-04-07 04:24:00', '2026-04-07 10:24:00', NULL, 4.00, NULL, 1, NULL, NULL, NULL, 10, NULL, NULL, NULL, '2026-04-07 04:27:07', '2026-04-07 04:27:12', NULL),
(395, 'TASK-302326-HBD', 'Gogamukh Communication', 'Comminication and Whatsapp group Option', NULL, NULL, NULL, NULL, NULL, 'USER', 14, 'InProgress', '2026-04-07 04:29:00', '2026-04-07 05:29:00', NULL, 1.00, NULL, 1, NULL, NULL, NULL, 14, NULL, NULL, NULL, '2026-04-07 04:32:12', '2026-04-07 04:32:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint(20) UNSIGNED DEFAULT NULL,
  `assignment_notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `estimated_time` decimal(8,2) DEFAULT NULL,
  `state` enum('pending','accepted','in_progress','completed','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`id`, `task_id`, `user_id`, `assigned_at`, `assigned_by`, `assignment_notes`, `is_active`, `accepted_at`, `completed_at`, `metadata`, `estimated_time`, `state`, `created_at`, `updated_at`, `deleted_at`) VALUES
(265, 258, 11, '2026-03-31 11:12:31', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:12:31', '2026-03-31 11:12:31', NULL),
(266, 259, 11, '2026-03-31 11:17:27', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:17:27', '2026-03-31 11:17:27', NULL),
(267, 260, 11, '2026-03-31 11:26:25', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:26:25', '2026-03-31 11:26:25', NULL),
(268, 261, 11, '2026-03-31 11:28:49', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:28:49', '2026-03-31 11:28:49', NULL),
(269, 262, 11, '2026-03-31 11:31:31', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:31:31', '2026-03-31 11:31:31', NULL),
(270, 263, 11, '2026-03-31 11:53:51', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:53:51', '2026-03-31 11:53:51', NULL),
(271, 264, 10, '2026-03-31 11:56:05', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 11:56:05', '2026-03-31 11:56:05', NULL),
(272, 265, 11, '2026-03-31 12:04:36', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 12:04:36', '2026-03-31 12:04:36', NULL),
(273, 266, 9, '2026-03-31 12:29:07', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 12:29:07', '2026-03-31 12:29:07', NULL),
(274, 267, 7, '2026-03-31 12:35:31', 7, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 12:35:31', '2026-03-31 12:35:31', NULL),
(275, 268, 8, '2026-03-31 12:42:17', 8, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 12:42:17', '2026-03-31 12:42:17', NULL),
(276, 269, 5, '2026-03-31 12:42:20', 5, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-03-31 12:42:20', '2026-03-31 12:42:20', NULL),
(277, 270, 7, '2026-04-01 03:54:11', 7, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 03:54:11', '2026-04-01 03:54:11', NULL),
(278, 271, 11, '2026-04-01 04:07:31', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 04:07:31', '2026-04-01 04:07:31', NULL),
(279, 272, 9, '2026-04-01 04:09:27', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 04:09:27', '2026-04-01 04:09:27', NULL),
(280, 273, 10, '2026-04-01 04:10:34', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 04:10:34', '2026-04-01 04:10:34', NULL),
(281, 274, 7, '2026-04-01 05:30:23', 7, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 05:30:23', '2026-04-01 05:30:23', NULL),
(282, 275, 11, '2026-04-01 06:11:07', 1, 'Please update ASAP', 1, NULL, NULL, '[]', 8.00, 'pending', '2026-04-01 06:11:07', '2026-04-01 06:11:07', NULL),
(284, 277, 11, '2026-04-01 08:40:09', 1, 'Assigned via task manager', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 08:40:09', '2026-04-01 08:40:09', NULL),
(285, 278, 5, '2026-04-01 09:54:46', 5, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 09:54:46', '2026-04-01 09:54:46', NULL),
(286, 279, 11, '2026-04-01 10:49:04', 11, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 10:49:04', '2026-04-01 10:49:04', NULL),
(287, 280, 8, '2026-04-01 11:00:12', 8, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-01 11:00:12', '2026-04-01 11:00:12', NULL),
(288, 281, 10, '2026-04-02 03:58:11', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 03:58:11', '2026-04-02 03:58:11', NULL),
(289, 282, 9, '2026-04-02 04:54:02', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 04:54:02', '2026-04-02 04:54:02', NULL),
(290, 283, 13, '2026-04-02 05:04:18', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 05:04:18', '2026-04-02 05:04:18', NULL),
(291, 284, 13, '2026-04-02 05:05:17', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 05:05:17', '2026-04-02 05:05:17', NULL),
(292, 285, 9, '2026-04-02 05:29:28', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 05:29:28', '2026-04-02 05:29:28', NULL),
(293, 286, 13, '2026-04-02 05:42:53', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 05:42:53', '2026-04-02 05:42:53', NULL),
(294, 287, 12, '2026-04-02 07:04:57', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 07:04:57', '2026-04-02 07:04:57', NULL),
(295, 288, 13, '2026-04-02 07:13:08', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 07:13:08', '2026-04-02 07:13:08', NULL),
(296, 289, 12, '2026-04-02 07:36:29', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 07:36:29', '2026-04-02 07:36:29', NULL),
(297, 290, 14, '2026-04-02 10:01:35', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:01:35', '2026-04-02 10:01:35', NULL),
(298, 291, 10, '2026-04-02 10:08:49', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:08:49', '2026-04-02 10:08:49', NULL),
(299, 292, 12, '2026-04-02 10:15:16', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:15:16', '2026-04-02 10:15:16', NULL),
(300, 293, 12, '2026-04-02 10:17:11', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:17:11', '2026-04-02 10:17:11', NULL),
(301, 294, 12, '2026-04-02 10:19:42', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:19:42', '2026-04-02 10:19:42', NULL),
(303, 296, 12, '2026-04-02 10:27:19', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 10:27:19', '2026-04-02 10:27:19', NULL),
(306, 297, 19, '2026-04-02 11:04:44', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:04:44', '2026-04-02 11:04:44', NULL),
(307, 298, 19, '2026-04-02 11:09:00', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:09:00', '2026-04-02 11:09:00', NULL),
(308, 299, 15, '2026-04-02 11:20:57', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:20:57', '2026-04-02 11:20:57', NULL),
(310, 301, 18, '2026-04-02 11:37:54', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:37:54', '2026-04-02 11:37:54', NULL),
(311, 302, 18, '2026-04-02 11:42:31', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:42:31', '2026-04-02 11:42:31', NULL),
(312, 303, 18, '2026-04-02 11:44:57', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-02 11:44:57', '2026-04-02 11:44:57', NULL),
(317, 306, 13, '2026-04-03 03:53:46', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 03:53:46', '2026-04-03 03:53:46', NULL),
(318, 307, 10, '2026-04-03 04:08:21', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 04:08:21', '2026-04-03 04:08:21', NULL),
(319, 308, 9, '2026-04-03 04:11:54', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 04:11:54', '2026-04-03 04:11:54', NULL),
(321, 310, 12, '2026-04-03 05:14:00', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 05:14:00', '2026-04-03 05:14:00', NULL),
(322, 311, 14, '2026-04-03 05:23:33', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 05:23:33', '2026-04-03 05:23:33', NULL),
(323, 312, 7, '2026-04-03 05:29:03', 7, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 05:29:03', '2026-04-03 05:29:03', NULL),
(324, 313, 11, '2026-04-03 05:35:26', 1, 'Assigned via task manager', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 05:35:26', '2026-04-03 05:35:26', NULL),
(325, 314, 12, '2026-04-03 06:34:29', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 06:34:29', '2026-04-03 06:34:29', NULL),
(326, 315, 18, '2026-04-03 06:46:30', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 06:46:30', '2026-04-03 06:46:30', NULL),
(327, 316, 18, '2026-04-03 06:50:04', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 06:50:04', '2026-04-03 06:50:04', NULL),
(328, 317, 14, '2026-04-03 07:36:24', 14, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 07:36:24', '2026-04-03 07:36:24', NULL),
(329, 318, 8, '2026-04-03 08:26:16', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 08:26:16', '2026-04-03 08:26:16', NULL),
(330, 320, 14, '2026-04-03 08:57:16', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 08:57:16', '2026-04-03 08:57:16', NULL),
(331, 322, 14, '2026-04-03 10:10:07', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 10:10:07', '2026-04-03 10:10:07', NULL),
(332, 309, 5, '2026-04-03 10:29:36', 16, 'Assigned via task manager', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 10:29:36', '2026-04-03 10:29:36', NULL),
(333, 324, 12, '2026-04-03 11:16:44', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 11:16:44', '2026-04-03 11:16:44', NULL),
(334, 325, 10, '2026-04-03 11:52:43', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 11:52:43', '2026-04-03 11:52:43', NULL),
(335, 326, 19, '2026-04-03 12:10:43', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 12:10:43', '2026-04-03 12:10:43', NULL),
(336, 327, 19, '2026-04-03 12:15:12', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 12:15:12', '2026-04-03 12:15:12', NULL),
(337, 328, 19, '2026-04-03 12:21:06', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-03 12:21:06', '2026-04-03 12:21:06', NULL),
(338, 329, 13, '2026-04-04 03:54:39', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 03:54:39', '2026-04-04 03:54:39', NULL),
(339, 330, 13, '2026-04-04 03:58:25', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 03:58:25', '2026-04-04 03:58:25', NULL),
(340, 331, 13, '2026-04-04 04:00:24', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:00:24', '2026-04-04 04:00:24', NULL),
(341, 332, 13, '2026-04-04 04:01:50', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:01:50', '2026-04-04 04:01:50', NULL),
(342, 333, 13, '2026-04-04 04:03:00', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:03:00', '2026-04-04 04:03:00', NULL),
(343, 334, 13, '2026-04-04 04:06:14', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:06:14', '2026-04-04 04:06:14', NULL),
(344, 335, 8, '2026-04-04 04:10:58', 8, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:10:58', '2026-04-04 04:10:58', NULL),
(345, 334, 7, '2026-04-04 04:17:02', 13, 'Module 4', 1, NULL, NULL, '[]', 80.00, 'pending', '2026-04-04 04:17:02', '2026-04-04 04:17:02', NULL),
(346, 334, 5, '2026-04-04 04:17:24', 13, 'Module 3', 1, NULL, NULL, '[]', 80.00, 'pending', '2026-04-04 04:17:24', '2026-04-04 04:17:24', NULL),
(347, 336, 10, '2026-04-04 04:18:04', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:18:04', '2026-04-04 04:18:04', NULL),
(348, 337, 11, '2026-04-04 04:21:16', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:21:16', '2026-04-04 04:21:16', NULL),
(349, 341, 14, '2026-04-04 04:25:21', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:25:21', '2026-04-04 04:25:21', NULL),
(350, 342, 14, '2026-04-04 04:35:17', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 04:35:17', '2026-04-04 04:35:17', NULL),
(351, 343, 5, '2026-04-04 05:31:50', 5, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 05:31:50', '2026-04-04 05:31:50', NULL),
(352, 344, 15, '2026-04-04 06:58:08', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 06:58:08', '2026-04-04 06:58:08', NULL),
(353, 345, 18, '2026-04-04 07:10:57', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:10:57', '2026-04-04 07:10:57', NULL),
(354, 346, 18, '2026-04-04 07:13:10', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:13:10', '2026-04-04 07:13:10', NULL),
(355, 347, 15, '2026-04-04 07:15:11', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:15:11', '2026-04-04 07:15:11', NULL),
(356, 348, 18, '2026-04-04 07:22:55', 18, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:22:55', '2026-04-04 07:22:55', NULL),
(357, 349, 15, '2026-04-04 07:25:04', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:25:04', '2026-04-04 07:25:04', NULL),
(358, 350, 15, '2026-04-04 07:27:42', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:27:42', '2026-04-04 07:27:42', NULL),
(359, 351, 15, '2026-04-04 07:33:08', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:33:08', '2026-04-04 07:33:08', NULL),
(360, 352, 12, '2026-04-04 07:33:25', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:33:25', '2026-04-04 07:33:25', NULL),
(361, 353, 12, '2026-04-04 07:35:37', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:35:37', '2026-04-04 07:35:37', NULL),
(362, 354, 15, '2026-04-04 07:35:38', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 07:35:38', '2026-04-04 07:35:38', NULL),
(363, 355, 15, '2026-04-04 08:10:46', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 08:10:46', '2026-04-04 08:10:46', NULL),
(364, 356, 19, '2026-04-04 08:16:30', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 08:16:30', '2026-04-04 08:16:30', NULL),
(365, 357, 19, '2026-04-04 08:18:21', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-04 08:18:21', '2026-04-04 08:18:21', NULL),
(366, 358, 14, '2026-04-06 03:02:17', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:02:17', '2026-04-06 03:02:17', NULL),
(367, 359, 14, '2026-04-06 03:45:19', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:45:19', '2026-04-06 03:45:19', NULL),
(368, 360, 13, '2026-04-06 03:51:20', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:51:20', '2026-04-06 03:51:20', NULL),
(369, 361, 19, '2026-04-06 03:51:53', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:51:53', '2026-04-06 03:51:53', NULL),
(370, 362, 19, '2026-04-06 03:56:28', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:56:28', '2026-04-06 03:56:28', NULL),
(371, 363, 19, '2026-04-06 03:57:26', 19, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 03:57:26', '2026-04-06 03:57:26', NULL),
(372, 364, 13, '2026-04-06 04:04:06', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 04:04:06', '2026-04-06 04:04:06', NULL),
(373, 365, 10, '2026-04-06 04:30:59', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 04:30:59', '2026-04-06 04:30:59', NULL),
(374, 366, 14, '2026-04-06 04:52:38', 14, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 04:52:38', '2026-04-06 04:52:38', NULL),
(375, 367, 9, '2026-04-06 05:00:59', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 05:00:59', '2026-04-06 05:00:59', NULL),
(376, 368, 9, '2026-04-06 05:39:26', 9, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 05:39:26', '2026-04-06 05:39:26', NULL),
(377, 369, 14, '2026-04-06 05:43:20', 14, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 05:43:20', '2026-04-06 05:43:20', NULL),
(378, 370, 10, '2026-04-06 06:16:27', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 06:16:27', '2026-04-06 06:16:27', NULL),
(379, 371, 13, '2026-04-06 06:45:42', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 06:45:42', '2026-04-06 06:45:42', NULL),
(380, 372, 11, '2026-04-06 06:55:23', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 06:55:23', '2026-04-06 06:55:23', NULL),
(381, 373, 14, '2026-04-06 06:56:01', 14, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 06:56:01', '2026-04-06 06:56:01', NULL),
(382, 374, 12, '2026-04-06 09:54:05', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 09:54:05', '2026-04-06 09:54:05', NULL),
(383, 375, 12, '2026-04-06 09:56:38', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 09:56:38', '2026-04-06 09:56:38', NULL),
(384, 376, 12, '2026-04-06 10:22:00', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 10:22:00', '2026-04-06 10:22:00', NULL),
(385, 377, 12, '2026-04-06 10:32:06', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 10:32:06', '2026-04-06 10:32:06', NULL),
(386, 378, 12, '2026-04-06 10:52:12', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 10:52:12', '2026-04-06 10:52:12', NULL),
(387, 379, 12, '2026-04-06 10:54:31', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 10:54:31', '2026-04-06 10:54:31', NULL),
(388, 380, 14, '2026-04-06 11:02:59', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:02:59', '2026-04-06 11:02:59', NULL),
(389, 381, 12, '2026-04-06 11:09:36', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:09:36', '2026-04-06 11:09:36', NULL),
(390, 382, 12, '2026-04-06 11:14:41', 12, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:14:41', '2026-04-06 11:14:41', NULL),
(391, 383, 14, '2026-04-06 11:17:43', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:17:43', '2026-04-06 11:17:43', NULL),
(392, 384, 14, '2026-04-06 11:28:23', 14, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:28:23', '2026-04-06 11:28:23', NULL),
(393, 385, 11, '2026-04-06 11:38:06', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:38:06', '2026-04-06 11:38:06', NULL),
(394, 386, 15, '2026-04-06 11:46:34', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:46:34', '2026-04-06 11:46:34', NULL),
(395, 387, 15, '2026-04-06 11:49:40', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:49:40', '2026-04-06 11:49:40', NULL),
(396, 388, 15, '2026-04-06 11:50:53', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:50:53', '2026-04-06 11:50:53', NULL),
(397, 389, 15, '2026-04-06 11:53:37', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:53:37', '2026-04-06 11:53:37', NULL),
(398, 390, 15, '2026-04-06 11:56:39', 15, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-06 11:56:39', '2026-04-06 11:56:39', NULL),
(399, 391, 14, '2026-04-07 02:43:51', 12, 'Assigned during task creation', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-07 02:43:51', '2026-04-07 02:43:51', NULL),
(400, 392, 13, '2026-04-07 04:03:32', 13, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-07 04:03:32', '2026-04-07 04:03:32', NULL),
(401, 393, 10, '2026-04-07 04:24:54', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-07 04:24:54', '2026-04-07 04:24:54', NULL),
(402, 394, 10, '2026-04-07 04:27:07', 10, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-07 04:27:07', '2026-04-07 04:27:07', NULL),
(403, 395, 14, '2026-04-07 04:32:12', 14, 'Self-assigned task', 1, NULL, NULL, '[]', NULL, 'pending', '2026-04-07 04:32:12', '2026-04-07 04:32:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_attachments`
--

CREATE TABLE `task_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_attachments`
--

INSERT INTO `task_attachments` (`id`, `task_id`, `file_path`, `file_type`, `uploaded_by`, `created_at`, `updated_at`) VALUES
(1, 275, 'task_attachments/TASK-633426-LFV_20260401_113958_1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1, '2026-04-01 06:09:58', '2026-04-01 06:09:58'),
(2, 277, 'task_attachments/TASK-740573-P29_20260401_140951_1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, '2026-04-01 08:39:51', '2026-04-01 08:39:51'),
(3, 277, 'task_attachments/TASK-740573-P29_20260401_140951_2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, '2026-04-01 08:39:51', '2026-04-01 08:39:51'),
(4, 341, 'task_attachments/TASK-537021-4E1_20260404_095523_1.png', 'image/png', 12, '2026-04-04 04:25:23', '2026-04-04 04:25:23'),
(5, 341, 'task_attachments/TASK-537021-4E1_20260404_095523_2.png', 'image/png', 12, '2026-04-04 04:25:23', '2026-04-04 04:25:23'),
(6, 342, 'task_attachments/TASK-053048-ZFW_20260404_100523_1.jpeg', 'image/jpeg', 12, '2026-04-04 04:35:23', '2026-04-04 04:35:23'),
(7, 358, 'task_attachments/TASK-349517-UA4_20260406_083219_1.png', 'image/png', 12, '2026-04-06 03:02:19', '2026-04-06 03:02:19'),
(8, 359, 'task_attachments/TASK-985154-008_20260406_091521_1.png', 'image/png', 12, '2026-04-06 03:45:21', '2026-04-06 03:45:21'),
(9, 383, 'task_attachments/TASK-159480-8JT_20260406_164745_1.png', 'image/png', 12, '2026-04-06 11:17:45', '2026-04-06 11:17:45'),
(10, 383, 'task_attachments/TASK-159480-8JT_20260406_164745_2.png', 'image/png', 12, '2026-04-06 11:17:45', '2026-04-06 11:17:45');

-- --------------------------------------------------------

--
-- Table structure for table `task_audit_events`
--

CREATE TABLE `task_audit_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `occurred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actor_user_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_owner_kind` enum('USER','DEPARTMENT','UNASSIGNED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_owner_id` bigint(20) DEFAULT NULL,
  `to_owner_kind` enum('USER','DEPARTMENT','UNASSIGNED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_owner_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `sla_snapshot` json DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_audit_events`
--

INSERT INTO `task_audit_events` (`id`, `task_id`, `occurred_at`, `actor_user_id`, `action`, `from_state`, `to_state`, `from_owner_kind`, `from_owner_id`, `to_owner_kind`, `to_owner_id`, `created_at`, `updated_at`, `deleted_at`, `sla_snapshot`, `reason`, `metadata`) VALUES
(14, 275, '2026-04-01 06:09:58', 1, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-01 06:09:58', '2026-04-01 06:09:58', NULL, NULL, 'Task created by Administrator', NULL),
(16, 277, '2026-04-01 08:39:51', 1, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-01 08:39:51', '2026-04-01 08:39:51', NULL, NULL, 'Task created by Administrator', NULL),
(17, 278, '2026-04-01 14:07:51', 5, 'STATE_CHANGE', 'InProgress', 'InReview', 'USER', 5, 'USER', 5, '2026-04-01 14:07:51', '2026-04-01 14:07:51', NULL, NULL, 'Status changed from InProgress to InReview', NULL),
(18, 278, '2026-04-01 14:07:55', 5, 'STATE_CHANGE', 'InReview', 'Done', 'USER', 5, 'USER', 5, '2026-04-01 14:07:55', '2026-04-01 14:07:55', NULL, NULL, 'Status changed from InReview to Done', NULL),
(19, 290, '2026-04-02 10:01:36', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-02 10:01:36', '2026-04-02 10:01:36', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(24, 311, '2026-04-03 05:23:35', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-03 05:23:35', '2026-04-03 05:23:35', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(25, 313, '2026-04-03 05:35:13', 1, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-03 05:35:13', '2026-04-03 05:35:13', NULL, NULL, 'Task created by Administrator', NULL),
(26, 318, '2026-04-03 08:26:22', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-03 08:26:22', '2026-04-03 08:26:22', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(27, 320, '2026-04-03 08:57:22', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-03 08:57:22', '2026-04-03 08:57:22', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(28, 322, '2026-04-03 10:10:12', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-03 10:10:12', '2026-04-03 10:10:12', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(29, 337, '2026-04-04 04:21:18', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-04 04:21:18', '2026-04-04 04:21:18', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(30, 341, '2026-04-04 04:25:23', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-04 04:25:23', '2026-04-04 04:25:23', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(31, 342, '2026-04-04 04:35:23', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-04 04:35:23', '2026-04-04 04:35:23', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(32, 358, '2026-04-06 03:02:19', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 03:02:19', '2026-04-06 03:02:19', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(33, 359, '2026-04-06 03:45:21', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 03:45:21', '2026-04-06 03:45:21', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(34, 366, '2026-04-06 04:52:38', 14, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 04:52:38', '2026-04-06 04:52:38', NULL, NULL, 'Task created by Bhanu Pratap Mourya', NULL),
(35, 369, '2026-04-06 05:43:20', 14, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 05:43:20', '2026-04-06 05:43:20', NULL, NULL, 'Task created by Bhanu Pratap Mourya', NULL),
(36, 372, '2026-04-06 06:55:26', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 06:55:26', '2026-04-06 06:55:26', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(37, 380, '2026-04-06 11:03:04', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 11:03:04', '2026-04-06 11:03:04', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(38, 383, '2026-04-06 11:17:45', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 11:17:45', '2026-04-06 11:17:45', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(39, 385, '2026-04-06 11:38:08', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-06 11:38:08', '2026-04-06 11:38:08', NULL, NULL, 'Task created by Pranadeep Sinha', NULL),
(40, 391, '2026-04-07 02:43:57', 12, 'TASK_CREATED', NULL, NULL, NULL, NULL, 'UNASSIGNED', NULL, '2026-04-07 02:43:57', '2026-04-07 02:43:57', NULL, NULL, 'Task created by Pranadeep Sinha', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `commented_by_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commented_by_id` bigint(20) UNSIGNED NOT NULL,
  `comment_text` text COLLATE utf8mb4_unicode_ci,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_comments`
--

INSERT INTO `task_comments` (`id`, `task_id`, `commented_by_type`, `commented_by_id`, `comment_text`, `is_internal`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`) VALUES
(14, 263, 'user', 11, 'FOR RUHUL AMIN (ADMISSION NO-36/2015 & ADMISSION DATE- 22/12/2014 AND FOR SUHANA YASMIN(ADMISSION NO.- 66/2015 & ADMISSION DATE- 06/01/2015', 0, '2026-03-31 11:59:38', '2026-03-31 11:59:38', NULL, NULL),
(15, 263, 'user', 11, NULL, 0, '2026-03-31 12:00:36', '2026-03-31 12:00:36', NULL, NULL),
(16, 290, 'user', 12, 'Please Look into the screenshot', 0, '2026-04-02 10:02:11', '2026-04-02 10:02:11', NULL, NULL),
(17, 318, 'user', 12, 'Please look into the attached screenshot', 0, '2026-04-03 08:28:07', '2026-04-03 08:28:07', NULL, NULL),
(18, 275, 'user', 11, 'Data', 0, '2026-04-04 07:47:30', '2026-04-04 07:47:30', NULL, NULL),
(19, 380, 'user', 12, 'Sir it also create loading issue while collecting Fee', 0, '2026-04-06 11:03:53', '2026-04-06 11:03:53', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_comment_attachments`
--

CREATE TABLE `task_comment_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `comment_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment_id` bigint(20) UNSIGNED NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_by_type` enum('user','organization_user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_comment_attachments`
--

INSERT INTO `task_comment_attachments` (`id`, `comment_type`, `comment_id`, `file_path`, `file_url`, `file_type`, `original_filename`, `file_size`, `uploaded_by_type`, `uploaded_by`, `created_at`, `updated_at`) VALUES
(2, 'App\\Models\\TaskComment', 15, 'task-attachments/69cbb76416ccb_1774958436.xlsx', NULL, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Updated data New admission-2026-27 (2).xlsx', 29840, 'user', 11, '2026-03-31 12:00:36', '2026-03-31 12:00:36'),
(3, 'App\\Models\\TaskComment', 16, 'task-attachments/69ce3ea3afa0a_1775124131.jpeg', NULL, 'image/jpeg', 'Galsi admission Form.jpeg', 140648, 'user', 12, '2026-04-02 10:02:11', '2026-04-02 10:02:11'),
(4, 'App\\Models\\TaskComment', 17, 'task-attachments/69cf7a1781a0e_1775204887.jpeg', NULL, 'image/jpeg', 'mirai admission form.jpeg', 129387, 'user', 12, '2026-04-03 08:28:07', '2026-04-03 08:28:07'),
(5, 'App\\Models\\TaskComment', 18, 'task-attachments/69d0c21300b6f_1775288851.xlsx', NULL, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Student\'s Data manikbond 26 04-04-2026.xlsx', 158061, 'user', 11, '2026-04-04 07:47:31', '2026-04-04 07:47:31');

-- --------------------------------------------------------

--
-- Table structure for table `task_dependencies`
--

CREATE TABLE `task_dependencies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `depends_on_task_id` bigint(20) UNSIGNED NOT NULL,
  `dependency_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_forwardings`
--

CREATE TABLE `task_forwardings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `from_user_id` bigint(20) UNSIGNED NOT NULL,
  `from_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `forwarded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `accepted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `rejected_by` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `accepted_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `forwarded_at` date DEFAULT NULL,
  `is_end_user` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_histories`
--

CREATE TABLE `task_histories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_histories`
--

INSERT INTO `task_histories` (`id`, `task_id`, `old_status`, `new_status`, `changed_by`, `created_at`, `updated_at`) VALUES
(14, 275, NULL, 'Draft', 1, '2026-04-01 06:09:58', '2026-04-01 06:09:58'),
(16, 277, NULL, 'Draft', 1, '2026-04-01 08:39:51', '2026-04-01 08:39:51'),
(17, 278, 'InProgress', 'InReview', 5, '2026-04-01 14:07:51', '2026-04-01 14:07:51'),
(18, 278, 'InReview', 'Done', 5, '2026-04-01 14:07:55', '2026-04-01 14:07:55'),
(19, 290, NULL, 'Assigned', 12, '2026-04-02 10:01:36', '2026-04-02 10:01:36'),
(24, 311, NULL, 'Assigned', 12, '2026-04-03 05:23:35', '2026-04-03 05:23:35'),
(25, 313, NULL, 'Draft', 1, '2026-04-03 05:35:13', '2026-04-03 05:35:13'),
(26, 318, NULL, 'Assigned', 12, '2026-04-03 08:26:22', '2026-04-03 08:26:22'),
(27, 320, NULL, 'Assigned', 12, '2026-04-03 08:57:22', '2026-04-03 08:57:22'),
(28, 322, NULL, 'Assigned', 12, '2026-04-03 10:10:12', '2026-04-03 10:10:12'),
(29, 337, NULL, 'Assigned', 12, '2026-04-04 04:21:18', '2026-04-04 04:21:18'),
(30, 341, NULL, 'Assigned', 12, '2026-04-04 04:25:23', '2026-04-04 04:25:23'),
(31, 342, NULL, 'Assigned', 12, '2026-04-04 04:35:23', '2026-04-04 04:35:23'),
(32, 358, NULL, 'Assigned', 12, '2026-04-06 03:02:19', '2026-04-06 03:02:19'),
(33, 359, NULL, 'Assigned', 12, '2026-04-06 03:45:21', '2026-04-06 03:45:21'),
(34, 366, NULL, 'Assigned', 14, '2026-04-06 04:52:38', '2026-04-06 04:52:38'),
(35, 369, NULL, 'Assigned', 14, '2026-04-06 05:43:20', '2026-04-06 05:43:20'),
(36, 372, NULL, 'Assigned', 12, '2026-04-06 06:55:26', '2026-04-06 06:55:26'),
(37, 380, NULL, 'Assigned', 12, '2026-04-06 11:03:04', '2026-04-06 11:03:04'),
(38, 383, NULL, 'Assigned', 12, '2026-04-06 11:17:45', '2026-04-06 11:17:45'),
(39, 385, NULL, 'Assigned', 12, '2026-04-06 11:38:08', '2026-04-06 11:38:08'),
(40, 391, NULL, 'Assigned', 12, '2026-04-07 02:43:57', '2026-04-07 02:43:57');

-- --------------------------------------------------------

--
-- Table structure for table `task_time_entries`
--

CREATE TABLE `task_time_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_time_entries`
--

INSERT INTO `task_time_entries` (`id`, `task_id`, `user_id`, `start_time`, `end_time`, `description`, `is_active`, `metadata`, `created_at`, `updated_at`, `deleted_at`) VALUES
(563, 258, 11, '2026-03-31 11:29:41', '2026-03-31 11:29:55', NULL, 0, NULL, '2026-03-31 11:29:41', '2026-03-31 11:29:55', NULL),
(564, 264, 10, '2026-03-31 11:56:07', '2026-03-31 12:36:15', NULL, 0, NULL, '2026-03-31 11:56:07', '2026-03-31 12:36:15', NULL),
(565, 266, 9, '2026-03-31 12:29:11', '2026-03-31 12:29:16', NULL, 0, NULL, '2026-03-31 12:29:11', '2026-03-31 12:29:16', NULL),
(566, 267, 7, '2026-03-31 12:35:34', '2026-03-31 12:35:40', NULL, 0, NULL, '2026-03-31 12:35:34', '2026-03-31 12:35:40', NULL),
(567, 267, 7, '2026-03-31 12:36:15', '2026-03-31 12:36:18', NULL, 0, NULL, '2026-03-31 12:36:15', '2026-03-31 12:36:18', NULL),
(568, 268, 8, '2026-03-31 12:42:19', '2026-03-31 12:42:25', NULL, 0, NULL, '2026-03-31 12:42:19', '2026-03-31 12:42:25', NULL),
(569, 269, 5, '2026-03-31 03:55:24', '2026-03-31 07:42:29', NULL, 0, NULL, '2026-03-31 12:42:24', '2026-03-31 12:42:29', NULL),
(570, 269, 5, '2026-03-31 08:43:45', '2026-03-31 12:43:53', NULL, 0, NULL, '2026-03-31 12:43:45', '2026-03-31 12:43:53', NULL),
(571, 270, 7, '2026-04-01 03:54:13', '2026-04-01 05:30:29', NULL, 0, NULL, '2026-04-01 03:54:13', '2026-04-01 05:30:29', NULL),
(572, 268, 8, '2026-04-01 03:54:45', '2026-04-01 10:58:47', NULL, 0, NULL, '2026-04-01 03:54:45', '2026-04-01 10:58:47', NULL),
(573, 271, 11, '2026-04-01 04:07:45', '2026-04-01 04:40:03', NULL, 0, NULL, '2026-04-01 04:07:45', '2026-04-01 04:40:03', NULL),
(574, 272, 9, '2026-04-01 04:09:34', '2026-04-01 05:10:41', NULL, 0, NULL, '2026-04-01 04:09:34', '2026-04-01 05:10:41', NULL),
(575, 273, 10, '2026-04-01 04:10:37', '2026-04-01 12:25:02', NULL, 0, NULL, '2026-04-01 04:10:37', '2026-04-01 12:25:02', NULL),
(576, 258, 11, '2026-04-01 04:50:18', '2026-04-01 04:50:40', NULL, 0, NULL, '2026-04-01 04:50:18', '2026-04-01 04:50:40', NULL),
(577, 266, 9, '2026-04-01 05:10:43', '2026-04-01 05:39:29', NULL, 0, NULL, '2026-04-01 05:10:43', '2026-04-01 05:39:29', NULL),
(578, 274, 7, '2026-04-01 05:30:30', '2026-04-01 12:29:46', NULL, 0, NULL, '2026-04-01 05:30:30', '2026-04-01 12:29:46', NULL),
(579, 258, 11, '2026-04-01 05:33:27', '2026-04-01 05:34:23', NULL, 0, NULL, '2026-04-01 05:33:27', '2026-04-01 05:34:23', NULL),
(580, 269, 5, '2026-04-01 04:15:55', '2026-04-01 05:54:51', NULL, 0, NULL, '2026-04-01 05:35:55', '2026-04-01 09:54:51', NULL),
(581, 272, 9, '2026-04-01 05:39:32', '2026-04-01 10:15:06', NULL, 0, NULL, '2026-04-01 05:39:32', '2026-04-01 10:15:06', NULL),
(582, 258, 11, '2026-04-01 05:44:30', '2026-04-01 10:35:10', NULL, 0, NULL, '2026-04-01 05:44:30', '2026-04-01 10:35:10', NULL),
(583, 278, 5, '2026-04-01 04:54:51', '2026-04-01 06:54:59', NULL, 0, NULL, '2026-04-01 09:54:51', '2026-04-01 09:54:59', NULL),
(584, 269, 5, '2026-04-01 08:57:44', '2026-04-01 09:57:52', NULL, 0, NULL, '2026-04-01 09:57:44', '2026-04-01 09:57:52', NULL),
(585, 269, 5, '2026-04-01 10:00:01', '2026-04-01 12:32:07', NULL, 0, NULL, '2026-04-01 10:00:01', '2026-04-01 12:32:07', NULL),
(586, 266, 9, '2026-04-01 10:15:17', '2026-04-01 12:23:05', NULL, 0, NULL, '2026-04-01 10:15:17', '2026-04-01 12:23:05', NULL),
(587, 279, 11, '2026-04-01 10:50:32', '2026-04-01 10:50:38', NULL, 0, NULL, '2026-04-01 10:50:32', '2026-04-01 10:50:38', NULL),
(588, 258, 11, '2026-04-01 10:50:42', '2026-04-01 11:13:49', NULL, 0, NULL, '2026-04-01 10:50:42', '2026-04-01 11:13:49', NULL),
(589, 280, 8, '2026-04-01 11:00:15', '2026-04-01 13:24:43', NULL, 0, NULL, '2026-04-01 11:00:15', '2026-04-01 13:24:43', NULL),
(590, 279, 11, '2026-04-01 11:13:51', '2026-04-02 08:31:03', NULL, 0, NULL, '2026-04-01 11:13:51', '2026-04-02 08:31:03', NULL),
(591, 278, 5, '2026-04-01 12:32:37', '2026-04-01 12:32:44', NULL, 0, NULL, '2026-04-01 12:32:37', '2026-04-01 12:32:44', NULL),
(592, 274, 7, '2026-04-02 03:57:11', '2026-04-02 12:23:35', NULL, 0, NULL, '2026-04-02 03:57:11', '2026-04-02 12:23:35', NULL),
(593, 281, 10, '2026-04-02 03:58:16', '2026-04-02 10:54:22', NULL, 0, NULL, '2026-04-02 03:58:16', '2026-04-02 10:54:22', NULL),
(594, 268, 8, '2026-04-02 04:07:56', '2026-04-02 12:40:36', NULL, 0, NULL, '2026-04-02 04:07:56', '2026-04-02 12:40:36', NULL),
(595, 266, 9, '2026-04-02 04:49:41', '2026-04-02 04:49:50', NULL, 0, NULL, '2026-04-02 04:49:41', '2026-04-02 04:49:50', NULL),
(596, 266, 9, '2026-04-02 04:49:55', '2026-04-02 04:52:48', NULL, 0, NULL, '2026-04-02 04:49:55', '2026-04-02 04:52:48', NULL),
(597, 284, 13, '2026-04-02 05:05:39', '2026-04-02 06:09:58', NULL, 0, NULL, '2026-04-02 05:05:39', '2026-04-02 06:09:58', NULL),
(598, 285, 9, '2026-04-02 05:29:34', '2026-04-02 12:18:35', NULL, 0, NULL, '2026-04-02 05:29:34', '2026-04-02 12:18:35', NULL),
(599, 286, 13, '2026-04-02 06:10:09', '2026-04-02 06:36:09', NULL, 0, NULL, '2026-04-02 06:10:09', '2026-04-02 06:36:09', NULL),
(600, 283, 13, '2026-04-02 06:36:16', '2026-04-02 07:13:12', NULL, 0, NULL, '2026-04-02 06:36:16', '2026-04-02 07:13:12', NULL),
(601, 287, 12, '2026-04-02 07:05:05', '2026-04-02 07:05:09', NULL, 0, NULL, '2026-04-02 07:05:05', '2026-04-02 07:05:09', NULL),
(602, 287, 12, '2026-04-02 07:05:17', '2026-04-02 07:05:23', NULL, 0, NULL, '2026-04-02 07:05:17', '2026-04-02 07:05:23', NULL),
(603, 288, 13, '2026-04-02 07:13:13', '2026-04-02 07:24:19', NULL, 0, NULL, '2026-04-02 07:13:13', '2026-04-02 07:24:19', NULL),
(604, 283, 13, '2026-04-02 07:25:52', '2026-04-02 15:05:19', NULL, 0, NULL, '2026-04-02 07:25:52', '2026-04-02 15:05:19', NULL),
(605, 289, 12, '2026-04-02 07:36:42', '2026-04-02 07:36:46', NULL, 0, NULL, '2026-04-02 07:36:42', '2026-04-02 07:36:46', NULL),
(606, 292, 12, '2026-04-02 10:15:20', '2026-04-02 10:15:25', NULL, 0, NULL, '2026-04-02 10:15:21', '2026-04-02 10:15:25', NULL),
(607, 293, 12, '2026-04-02 10:17:15', '2026-04-02 10:17:17', NULL, 0, NULL, '2026-04-02 10:17:15', '2026-04-02 10:17:17', NULL),
(608, 296, 12, '2026-04-02 10:27:22', '2026-04-02 10:27:24', NULL, 0, NULL, '2026-04-02 10:27:22', '2026-04-02 10:27:24', NULL),
(609, 269, 5, '2026-04-02 10:49:46', '2026-04-02 10:50:00', NULL, 0, NULL, '2026-04-02 10:49:46', '2026-04-02 10:50:00', NULL),
(611, 291, 10, '2026-04-02 10:54:25', '2026-04-02 12:23:04', NULL, 0, NULL, '2026-04-02 10:54:25', '2026-04-02 12:23:04', NULL),
(612, 297, 19, '2026-04-02 11:04:59', '2026-04-02 11:05:05', NULL, 0, NULL, '2026-04-02 11:04:59', '2026-04-02 11:05:05', NULL),
(613, 298, 19, '2026-04-02 11:09:03', '2026-04-02 11:09:06', NULL, 0, NULL, '2026-04-02 11:09:03', '2026-04-02 11:09:06', NULL),
(614, 301, 18, '2026-04-02 11:38:04', '2026-04-02 11:38:07', NULL, 0, NULL, '2026-04-02 11:38:04', '2026-04-02 11:38:07', NULL),
(615, 302, 18, '2026-04-02 11:42:34', '2026-04-02 11:42:36', NULL, 0, NULL, '2026-04-02 11:42:34', '2026-04-02 11:42:36', NULL),
(616, 303, 18, '2026-04-02 11:45:00', '2026-04-02 11:45:03', NULL, 0, NULL, '2026-04-02 11:45:00', '2026-04-02 11:45:03', NULL),
(617, 269, 5, '2026-04-02 12:22:23', '2026-04-02 12:46:00', NULL, 0, NULL, '2026-04-02 12:22:23', '2026-04-02 12:46:00', NULL),
(619, 258, 11, '2026-04-03 04:52:12', '2026-04-03 07:49:09', NULL, 0, NULL, '2026-04-03 04:52:12', '2026-04-03 07:49:09', NULL),
(620, 310, 12, '2026-04-03 05:14:02', '2026-04-03 05:14:05', NULL, 0, NULL, '2026-04-03 05:14:02', '2026-04-03 05:14:05', NULL),
(621, 274, 7, '2026-04-03 05:14:11', '2026-04-03 07:14:14', NULL, 0, NULL, '2026-04-03 05:14:11', '2026-04-03 07:14:14', NULL),
(622, 268, 8, '2026-04-03 05:14:18', '2026-04-03 09:32:57', NULL, 0, NULL, '2026-04-03 05:14:18', '2026-04-03 09:32:57', NULL),
(623, 306, 13, '2026-04-03 06:06:48', '2026-04-04 04:44:37', NULL, 0, NULL, '2026-04-03 06:06:48', '2026-04-04 04:44:37', NULL),
(624, 314, 12, '2026-04-03 06:44:16', '2026-04-03 06:44:18', NULL, 0, NULL, '2026-04-03 06:44:16', '2026-04-03 06:44:18', NULL),
(625, 315, 18, '2026-04-03 06:46:32', '2026-04-03 06:46:35', NULL, 0, NULL, '2026-04-03 06:46:32', '2026-04-03 06:46:35', NULL),
(626, 316, 18, '2026-04-03 06:50:07', '2026-04-03 09:34:10', NULL, 0, NULL, '2026-04-03 06:50:07', '2026-04-03 09:34:10', NULL),
(627, 312, 7, '2026-04-03 07:14:14', '2026-04-03 08:22:55', NULL, 0, NULL, '2026-04-03 07:14:14', '2026-04-03 08:22:55', NULL),
(628, 311, 14, '2026-04-03 07:18:43', '2026-04-03 07:18:47', NULL, 0, NULL, '2026-04-03 07:18:43', '2026-04-03 07:18:47', NULL),
(629, 317, 14, '2026-04-03 07:36:28', '2026-04-03 09:07:33', NULL, 0, NULL, '2026-04-03 07:36:28', '2026-04-03 09:07:33', NULL),
(630, 313, 11, '2026-04-03 07:49:14', '2026-04-03 09:07:46', NULL, 0, NULL, '2026-04-03 07:49:14', '2026-04-03 09:07:46', NULL),
(631, 308, 9, '2026-04-03 08:22:42', '2026-04-03 12:19:41', NULL, 0, NULL, '2026-04-03 08:22:42', '2026-04-03 12:19:41', NULL),
(632, 274, 7, '2026-04-03 08:22:57', '2026-04-03 12:16:58', NULL, 0, NULL, '2026-04-03 08:22:57', '2026-04-03 12:16:58', NULL),
(633, 320, 14, '2026-04-03 09:07:43', '2026-04-03 13:02:43', NULL, 0, NULL, '2026-04-03 09:07:43', '2026-04-03 13:02:43', NULL),
(634, 318, 8, '2026-04-03 09:32:58', '2026-04-03 11:39:27', NULL, 0, NULL, '2026-04-03 09:32:58', '2026-04-03 11:39:27', NULL),
(635, 258, 11, '2026-04-03 09:51:13', '2026-04-04 04:08:34', NULL, 0, NULL, '2026-04-03 09:51:13', '2026-04-04 04:08:34', NULL),
(636, 324, 12, '2026-04-03 11:22:16', '2026-04-03 11:22:19', NULL, 0, NULL, '2026-04-03 11:22:16', '2026-04-03 11:22:19', NULL),
(637, 268, 8, '2026-04-03 11:39:32', '2026-04-03 12:46:28', NULL, 0, NULL, '2026-04-03 11:39:32', '2026-04-03 12:46:28', NULL),
(638, 307, 10, '2026-04-03 11:47:02', '2026-04-03 12:18:37', NULL, 0, NULL, '2026-04-03 11:47:02', '2026-04-03 12:18:37', NULL),
(639, 309, 5, '2026-04-03 09:49:38', '2026-04-03 12:19:56', NULL, 0, NULL, '2026-04-03 11:49:38', '2026-04-03 12:19:56', NULL),
(640, 326, 19, '2026-04-03 12:10:50', '2026-04-03 12:13:26', NULL, 0, NULL, '2026-04-03 12:10:50', '2026-04-03 12:13:26', NULL),
(641, 325, 10, '2026-04-03 12:18:38', '2026-04-03 12:18:47', NULL, 0, NULL, '2026-04-03 12:18:38', '2026-04-03 12:18:47', NULL),
(642, 309, 5, '2026-04-03 12:19:58', '2026-04-03 12:20:00', NULL, 0, NULL, '2026-04-03 12:19:58', '2026-04-03 12:20:00', NULL),
(643, 269, 5, '2026-04-03 04:24:16', '2026-04-03 06:40:32', NULL, 0, NULL, '2026-04-03 12:20:16', '2026-04-03 12:40:32', NULL),
(644, 327, 19, '2026-04-03 12:22:57', '2026-04-03 12:22:59', NULL, 0, NULL, '2026-04-03 12:22:57', '2026-04-03 12:22:59', NULL),
(645, 328, 19, '2026-04-03 12:23:00', '2026-04-03 12:23:04', NULL, 0, NULL, '2026-04-03 12:23:00', '2026-04-03 12:23:04', NULL),
(646, 327, 19, '2026-04-03 12:23:13', '2026-04-03 12:23:15', NULL, 0, NULL, '2026-04-03 12:23:13', '2026-04-03 12:23:15', NULL),
(647, 317, 14, '2026-04-04 03:47:15', '2026-04-04 04:50:22', NULL, 0, NULL, '2026-04-04 03:47:15', '2026-04-04 04:50:22', NULL),
(648, 274, 7, '2026-04-04 03:58:14', '2026-04-04 08:29:39', NULL, 0, NULL, '2026-04-04 03:58:14', '2026-04-04 08:29:39', NULL),
(649, 275, 11, '2026-04-04 04:08:42', '2026-04-04 04:17:35', NULL, 0, NULL, '2026-04-04 04:08:42', '2026-04-04 04:17:35', NULL),
(650, 268, 8, '2026-04-04 04:09:42', '2026-04-04 04:09:44', NULL, 0, NULL, '2026-04-04 04:09:42', '2026-04-04 04:09:44', NULL),
(651, 335, 8, '2026-04-04 04:11:00', '2026-04-04 09:14:46', NULL, 0, NULL, '2026-04-04 04:11:00', '2026-04-04 09:14:46', NULL),
(652, 336, 10, '2026-04-04 04:18:07', '2026-04-04 08:16:51', NULL, 0, NULL, '2026-04-04 04:18:07', '2026-04-04 08:16:51', NULL),
(653, 337, 11, '2026-04-04 04:22:22', '2026-04-04 04:22:35', NULL, 0, NULL, '2026-04-04 04:22:22', '2026-04-04 04:22:35', NULL),
(654, 337, 11, '2026-04-04 04:22:54', '2026-04-04 05:13:02', NULL, 0, NULL, '2026-04-04 04:22:54', '2026-04-04 05:13:02', NULL),
(655, 269, 5, '2026-04-04 04:31:16', '2026-04-04 05:31:54', NULL, 0, NULL, '2026-04-04 04:31:16', '2026-04-04 05:31:54', NULL),
(656, 329, 13, '2026-04-04 04:44:49', '2026-04-04 08:29:39', NULL, 0, NULL, '2026-04-04 04:44:49', '2026-04-04 08:29:39', NULL),
(657, 320, 14, '2026-04-04 04:50:26', '2026-04-04 04:50:27', NULL, 0, NULL, '2026-04-04 04:50:26', '2026-04-04 04:50:27', NULL),
(658, 275, 11, '2026-04-04 05:16:02', '2026-04-04 08:30:33', NULL, 0, NULL, '2026-04-04 05:16:02', '2026-04-04 08:30:33', NULL),
(659, 343, 5, '2026-04-04 05:31:55', '2026-04-04 05:33:20', NULL, 0, NULL, '2026-04-04 05:31:55', '2026-04-04 05:33:20', NULL),
(660, 269, 5, '2026-04-04 05:33:25', '2026-04-04 08:50:39', NULL, 0, NULL, '2026-04-04 05:33:25', '2026-04-04 08:50:39', NULL),
(661, 299, 15, '2026-04-04 06:56:16', '2026-04-04 06:58:17', NULL, 0, NULL, '2026-04-04 06:56:16', '2026-04-04 06:58:17', NULL),
(662, 344, 15, '2026-04-04 06:58:18', '2026-04-04 06:58:26', NULL, 0, NULL, '2026-04-04 06:58:18', '2026-04-04 06:58:26', NULL),
(663, 299, 15, '2026-04-04 06:58:27', '2026-04-04 06:58:35', NULL, 0, NULL, '2026-04-04 06:58:27', '2026-04-04 06:58:35', NULL),
(664, 344, 15, '2026-04-04 06:58:36', '2026-04-04 06:58:56', NULL, 0, NULL, '2026-04-04 06:58:36', '2026-04-04 06:58:56', NULL),
(665, 345, 18, '2026-04-04 07:11:01', '2026-04-04 07:11:06', NULL, 0, NULL, '2026-04-04 07:11:01', '2026-04-04 07:11:06', NULL),
(666, 344, 15, '2026-04-04 07:12:24', '2026-04-04 07:12:27', NULL, 0, NULL, '2026-04-04 07:12:24', '2026-04-04 07:12:27', NULL),
(667, 346, 18, '2026-04-04 07:13:16', '2026-04-04 07:13:55', NULL, 0, NULL, '2026-04-04 07:13:16', '2026-04-04 07:13:55', NULL),
(668, 347, 15, '2026-04-04 07:16:08', '2026-04-04 07:16:11', NULL, 0, NULL, '2026-04-04 07:16:08', '2026-04-04 07:16:11', NULL),
(669, 348, 18, '2026-04-04 07:23:00', '2026-04-04 08:02:28', NULL, 0, NULL, '2026-04-04 07:23:00', '2026-04-04 08:02:28', NULL),
(670, 350, 15, '2026-04-04 07:27:52', '2026-04-04 07:33:14', NULL, 0, NULL, '2026-04-04 07:27:52', '2026-04-04 07:33:14', NULL),
(671, 351, 15, '2026-04-04 07:33:15', '2026-04-04 07:35:42', NULL, 0, NULL, '2026-04-04 07:33:15', '2026-04-04 07:35:42', NULL),
(672, 352, 12, '2026-04-04 07:33:28', '2026-04-04 07:33:31', NULL, 0, NULL, '2026-04-04 07:33:28', '2026-04-04 07:33:31', NULL),
(673, 352, 12, '2026-04-04 07:33:32', '2026-04-04 07:33:37', NULL, 0, NULL, '2026-04-04 07:33:32', '2026-04-04 07:33:37', NULL),
(674, 353, 12, '2026-04-04 07:35:40', '2026-04-04 07:35:43', NULL, 0, NULL, '2026-04-04 07:35:40', '2026-04-04 07:35:43', NULL),
(675, 354, 15, '2026-04-04 07:35:43', '2026-04-04 07:35:46', NULL, 0, NULL, '2026-04-04 07:35:43', '2026-04-04 07:35:46', NULL),
(676, 308, 9, '2026-04-04 08:09:16', '2026-04-04 08:09:35', NULL, 0, NULL, '2026-04-04 08:09:16', '2026-04-04 08:09:35', NULL),
(677, 355, 15, '2026-04-04 08:13:49', '2026-04-04 08:37:48', NULL, 0, NULL, '2026-04-04 08:13:49', '2026-04-04 08:37:48', NULL),
(678, 356, 19, '2026-04-04 08:18:32', '2026-04-04 08:18:36', NULL, 0, NULL, '2026-04-04 08:18:32', '2026-04-04 08:18:36', NULL),
(679, 357, 19, '2026-04-04 08:18:39', '2026-04-04 08:18:41', NULL, 0, NULL, '2026-04-04 08:18:39', '2026-04-04 08:18:41', NULL),
(680, 360, 13, '2026-04-06 03:51:25', '2026-04-06 04:04:11', NULL, 0, NULL, '2026-04-06 03:51:25', '2026-04-06 04:04:11', NULL),
(681, 361, 19, '2026-04-06 03:57:34', '2026-04-06 05:13:35', NULL, 0, NULL, '2026-04-06 03:57:34', '2026-04-06 05:13:35', NULL),
(682, 364, 13, '2026-04-06 04:04:12', '2026-04-06 06:28:49', NULL, 0, NULL, '2026-04-06 04:04:12', '2026-04-06 06:28:49', NULL),
(683, 365, 10, '2026-04-06 04:31:01', '2026-04-06 06:15:07', NULL, 0, NULL, '2026-04-06 04:31:01', '2026-04-06 06:15:07', NULL),
(684, 358, 14, '2026-04-06 04:51:32', '2026-04-06 04:51:38', NULL, 0, NULL, '2026-04-06 04:51:32', '2026-04-06 04:51:38', NULL),
(685, 359, 14, '2026-04-06 04:51:39', '2026-04-06 04:51:45', NULL, 0, NULL, '2026-04-06 04:51:39', '2026-04-06 04:51:45', NULL),
(686, 358, 14, '2026-04-06 04:51:48', '2026-04-06 04:51:51', NULL, 0, NULL, '2026-04-06 04:51:48', '2026-04-06 04:51:51', NULL),
(687, 366, 14, '2026-04-06 04:52:48', '2026-04-06 05:41:54', NULL, 0, NULL, '2026-04-06 04:52:48', '2026-04-06 05:41:54', NULL),
(688, 367, 9, '2026-04-06 05:01:02', '2026-04-06 05:38:56', NULL, 0, NULL, '2026-04-06 05:01:02', '2026-04-06 05:38:56', NULL),
(689, 362, 19, '2026-04-06 05:13:40', '2026-04-06 09:26:31', NULL, 0, NULL, '2026-04-06 05:13:40', '2026-04-06 09:26:31', NULL),
(690, 368, 9, '2026-04-06 05:39:37', '2026-04-06 11:45:00', NULL, 0, NULL, '2026-04-06 05:39:37', '2026-04-06 11:45:00', NULL),
(691, 366, 14, '2026-04-06 05:41:57', '2026-04-06 05:41:59', NULL, 0, NULL, '2026-04-06 05:41:57', '2026-04-06 05:41:59', NULL),
(692, 369, 14, '2026-04-06 05:43:37', '2026-04-06 05:43:41', NULL, 0, NULL, '2026-04-06 05:43:37', '2026-04-06 05:43:41', NULL),
(693, 370, 10, '2026-04-06 06:16:30', '2026-04-06 12:39:13', NULL, 0, NULL, '2026-04-06 06:16:30', '2026-04-06 12:39:13', NULL),
(694, 369, 14, '2026-04-06 06:25:06', '2026-04-06 06:55:07', NULL, 0, NULL, '2026-04-06 06:25:06', '2026-04-06 06:55:07', NULL),
(695, 373, 14, '2026-04-06 06:56:03', '2026-04-06 07:09:57', NULL, 0, NULL, '2026-04-06 06:56:03', '2026-04-06 07:09:57', NULL),
(696, 373, 14, '2026-04-06 07:10:01', '2026-04-06 07:10:03', NULL, 0, NULL, '2026-04-06 07:10:01', '2026-04-06 07:10:03', NULL),
(697, 369, 14, '2026-04-06 07:10:06', '2026-04-06 07:26:59', NULL, 0, NULL, '2026-04-06 07:10:06', '2026-04-06 07:26:59', NULL),
(698, 269, 5, '2026-04-06 07:21:59', '2026-04-06 12:00:56', NULL, 0, NULL, '2026-04-06 07:21:59', '2026-04-06 12:00:56', NULL),
(699, 369, 14, '2026-04-06 08:27:33', '2026-04-06 11:21:14', NULL, 0, NULL, '2026-04-06 08:27:33', '2026-04-06 11:21:14', NULL),
(700, 363, 19, '2026-04-06 09:26:35', '2026-04-06 11:28:59', NULL, 0, NULL, '2026-04-06 09:26:35', '2026-04-06 11:28:59', NULL),
(701, 374, 12, '2026-04-06 09:54:07', '2026-04-06 09:54:10', NULL, 0, NULL, '2026-04-06 09:54:07', '2026-04-06 09:54:10', NULL),
(702, 375, 12, '2026-04-06 09:56:40', '2026-04-06 09:56:43', NULL, 0, NULL, '2026-04-06 09:56:40', '2026-04-06 09:56:43', NULL),
(703, 376, 12, '2026-04-06 10:22:03', '2026-04-06 10:22:05', NULL, 0, NULL, '2026-04-06 10:22:03', '2026-04-06 10:22:05', NULL),
(704, 377, 12, '2026-04-06 10:32:09', '2026-04-06 10:32:12', NULL, 0, NULL, '2026-04-06 10:32:09', '2026-04-06 10:32:12', NULL),
(705, 378, 12, '2026-04-06 10:52:16', '2026-04-06 10:52:18', NULL, 0, NULL, '2026-04-06 10:52:16', '2026-04-06 10:52:18', NULL),
(706, 379, 12, '2026-04-06 10:54:36', '2026-04-06 11:09:38', NULL, 0, NULL, '2026-04-06 10:54:36', '2026-04-06 11:09:38', NULL),
(707, 381, 12, '2026-04-06 11:09:39', '2026-04-06 11:09:45', NULL, 0, NULL, '2026-04-06 11:09:39', '2026-04-06 11:09:45', NULL),
(708, 382, 12, '2026-04-06 11:14:45', '2026-04-06 11:14:48', NULL, 0, NULL, '2026-04-06 11:14:45', '2026-04-06 11:14:48', NULL),
(709, 380, 14, '2026-04-06 11:21:14', '2026-04-06 11:21:57', NULL, 0, NULL, '2026-04-06 11:21:14', '2026-04-06 11:21:57', NULL),
(710, 369, 14, '2026-04-06 11:21:58', '2026-04-06 11:22:00', NULL, 0, NULL, '2026-04-06 11:21:58', '2026-04-06 11:22:00', NULL),
(711, 380, 14, '2026-04-06 11:22:04', '2026-04-06 11:25:12', NULL, 0, NULL, '2026-04-06 11:22:04', '2026-04-06 11:25:12', NULL),
(712, 379, 12, '2026-04-06 11:22:30', '2026-04-06 11:22:32', NULL, 0, NULL, '2026-04-06 11:22:30', '2026-04-06 11:22:32', NULL),
(713, 384, 14, '2026-04-06 11:28:28', '2026-04-06 12:57:15', NULL, 0, NULL, '2026-04-06 11:28:28', '2026-04-06 12:57:15', NULL),
(714, 379, 12, '2026-04-06 11:29:02', '2026-04-07 02:52:40', NULL, 0, NULL, '2026-04-06 11:29:02', '2026-04-07 02:52:40', NULL),
(715, 308, 9, '2026-04-06 11:45:03', '2026-04-06 12:35:04', NULL, 0, NULL, '2026-04-06 11:45:03', '2026-04-06 12:35:04', NULL),
(716, 388, 15, '2026-04-06 11:51:32', '2026-04-06 11:51:35', NULL, 0, NULL, '2026-04-06 11:51:32', '2026-04-06 11:51:35', NULL),
(717, 387, 15, '2026-04-06 11:51:44', '2026-04-06 11:51:47', NULL, 0, NULL, '2026-04-06 11:51:44', '2026-04-06 11:51:47', NULL),
(718, 386, 15, '2026-04-06 11:51:49', '2026-04-06 11:51:53', NULL, 0, NULL, '2026-04-06 11:51:49', '2026-04-06 11:51:53', NULL),
(719, 389, 15, '2026-04-06 11:56:56', '2026-04-06 11:57:00', NULL, 0, NULL, '2026-04-06 11:56:56', '2026-04-06 11:57:00', NULL),
(720, 390, 15, '2026-04-06 11:57:05', '2026-04-06 11:57:08', NULL, 0, NULL, '2026-04-06 11:57:05', '2026-04-06 11:57:08', NULL),
(721, 269, 5, '2026-04-06 12:01:17', '2026-04-06 12:09:41', NULL, 0, NULL, '2026-04-06 12:01:17', '2026-04-06 12:09:41', NULL),
(722, 334, 5, '2026-04-06 12:09:42', '2026-04-06 12:09:50', NULL, 0, NULL, '2026-04-06 12:09:42', '2026-04-06 12:09:50', NULL),
(723, 335, 8, '2026-04-06 12:44:11', '2026-04-06 14:11:30', NULL, 0, NULL, '2026-04-06 12:44:11', '2026-04-06 14:11:30', NULL),
(724, 274, 7, '2026-04-07 03:49:11', NULL, NULL, 1, NULL, '2026-04-07 03:49:11', '2026-04-07 03:49:11', NULL),
(725, 371, 13, '2026-04-07 03:57:34', NULL, NULL, 1, NULL, '2026-04-07 03:57:34', '2026-04-07 03:57:34', NULL),
(726, 368, 9, '2026-04-07 03:59:14', '2026-04-07 03:59:19', NULL, 0, NULL, '2026-04-07 03:59:14', '2026-04-07 03:59:19', NULL),
(727, 368, 9, '2026-04-07 03:59:22', NULL, NULL, 1, NULL, '2026-04-07 03:59:22', '2026-04-07 03:59:22', NULL),
(728, 275, 11, '2026-04-07 04:17:18', '2026-04-07 04:17:21', NULL, 0, NULL, '2026-04-07 04:17:18', '2026-04-07 04:17:21', NULL),
(729, 394, 10, '2026-04-07 04:27:12', NULL, NULL, 1, NULL, '2026-04-07 04:27:12', '2026-04-07 04:27:12', NULL),
(730, 395, 14, '2026-04-07 04:32:15', NULL, NULL, 1, NULL, '2026-04-07 04:32:15', '2026-04-07 04:32:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_types`
--

CREATE TABLE `task_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `default_priority` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `requires_sla` tinyint(1) NOT NULL DEFAULT '1',
  `requires_project` tinyint(1) NOT NULL DEFAULT '0',
  `requires_department` tinyint(1) NOT NULL DEFAULT '0',
  `workflow_definition` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_types`
--

INSERT INTO `task_types` (`id`, `code`, `name`, `description`, `default_priority`, `requires_sla`, `requires_project`, `requires_department`, `workflow_definition`, `is_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Bugfix', 'Bug Fix', 'Fix software bugs and issues', 'P3', 1, 0, 0, '{\"states\": [\"Draft\", \"Assigned\", \"InProgress\", \"Blocked\", \"InReview\", \"Done\", \"Cancelled\"], \"transitions\": {\"Done\": [], \"Draft\": [\"Assigned\", \"Cancelled\"], \"Blocked\": [\"InProgress\", \"Cancelled\"], \"Assigned\": [\"InProgress\", \"Blocked\", \"Reassigned\", \"Cancelled\"], \"InReview\": [\"InProgress\", \"Done\", \"Cancelled\"], \"Cancelled\": [], \"InProgress\": [\"Blocked\", \"InReview\", \"Cancelled\"]}}', 1, NULL, NULL, NULL),
(2, 'ProjectWork', 'Project Work', 'Development tasks for projects', 'P2', 1, 1, 0, '{\"states\": [\"Draft\", \"Assigned\", \"InProgress\", \"Blocked\", \"InReview\", \"Done\", \"Cancelled\"], \"transitions\": {\"Done\": [], \"Draft\": [\"Assigned\", \"Cancelled\"], \"Blocked\": [\"InProgress\", \"Cancelled\"], \"Assigned\": [\"InProgress\", \"Blocked\", \"Reassigned\", \"Cancelled\"], \"InReview\": [\"InProgress\", \"Done\", \"Cancelled\"], \"Cancelled\": [], \"InProgress\": [\"Blocked\", \"InReview\", \"Cancelled\"]}}', 1, NULL, NULL, NULL),
(3, 'Support', 'Support Request', 'Customer support and assistance', 'P2', 1, 0, 1, '{\"states\": [\"Draft\", \"Assigned\", \"InProgress\", \"Blocked\", \"InReview\", \"Done\", \"Cancelled\"], \"transitions\": {\"Done\": [], \"Draft\": [\"Assigned\", \"Cancelled\"], \"Blocked\": [\"InProgress\", \"Cancelled\"], \"Assigned\": [\"InProgress\", \"Blocked\", \"Reassigned\", \"Cancelled\"], \"InReview\": [\"InProgress\", \"Done\", \"Cancelled\"], \"Cancelled\": [], \"InProgress\": [\"Blocked\", \"InReview\", \"Cancelled\"]}}', 1, NULL, NULL, NULL),
(4, 'InternalRequest', 'Internal Request', 'Internal company requests', 'P3', 1, 0, 1, '{\"states\": [\"Draft\", \"Assigned\", \"InProgress\", \"Blocked\", \"InReview\", \"Done\", \"Cancelled\"], \"transitions\": {\"Done\": [], \"Draft\": [\"Assigned\", \"Cancelled\"], \"Blocked\": [\"InProgress\", \"Cancelled\"], \"Assigned\": [\"InProgress\", \"Blocked\", \"Reassigned\", \"Cancelled\"], \"InReview\": [\"InProgress\", \"Done\", \"Cancelled\"], \"Cancelled\": [], \"InProgress\": [\"Blocked\", \"InReview\", \"Cancelled\"]}}', 1, NULL, NULL, NULL),
(5, 'Inspection', 'Inspection', 'Quality inspections and audits', 'P2', 1, 0, 0, '{\"states\": [\"Draft\", \"Assigned\", \"InProgress\", \"Blocked\", \"InReview\", \"Done\", \"Cancelled\"], \"transitions\": {\"Done\": [], \"Draft\": [\"Assigned\", \"Cancelled\"], \"Blocked\": [\"InProgress\", \"Cancelled\"], \"Assigned\": [\"InProgress\", \"Blocked\", \"Reassigned\", \"Cancelled\"], \"InReview\": [\"InProgress\", \"Done\", \"Cancelled\"], \"Cancelled\": [], \"InProgress\": [\"Blocked\", \"InReview\", \"Cancelled\"]}}', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `organization_user_id` bigint(20) UNSIGNED NOT NULL,
  `ticket_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('technical','billing','general','support') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `status` enum('open','approved','in-progress','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `rejected_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_attachments`
--

CREATE TABLE `ticket_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by_type` enum('user','organization_user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_comments`
--

CREATE TABLE `ticket_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `comment_text` text COLLATE utf8mb4_unicode_ci,
  `commented_by_type` enum('user','organization_user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `commented_by` bigint(20) UNSIGNED DEFAULT NULL,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_histories`
--

CREATE TABLE `ticket_histories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `timeline_events`
--

CREATE TABLE `timeline_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_description` text COLLATE utf8mb4_unicode_ci,
  `event_date` datetime NOT NULL,
  `is_milestone` tinyint(1) NOT NULL DEFAULT '0',
  `milestone_type` enum('start','checkpoint','completion','deadline') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type of milestone: start, checkpoint, completion, or deadline',
  `target_date` datetime DEFAULT NULL COMMENT 'Expected date for milestone completion',
  `is_completed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the milestone has been completed',
  `completed_at` datetime DEFAULT NULL COMMENT 'Actual completion date of the milestone',
  `progress_percentage` int(11) NOT NULL DEFAULT '0' COMMENT 'Progress percentage at this milestone (0-100)',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timeline_events`
--

INSERT INTO `timeline_events` (`id`, `task_id`, `user_id`, `event_type`, `event_name`, `event_description`, `event_date`, `is_milestone`, `milestone_type`, `target_date`, `is_completed`, `completed_at`, `progress_percentage`, `metadata`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 258, 11, 'milestone', 'Marking Scheme Optimization', 'Redesign Marking Scheme logic, UI Optimization', '2026-04-01 11:05:00', 1, 'checkpoint', '2026-04-01 16:15:00', 1, '2026-04-01 16:07:20', 100, NULL, '2026-04-01 05:36:02', '2026-04-01 10:37:20', NULL),
(2, 269, 5, 'milestone', 'Test milestone', NULL, '2026-04-01 11:20:00', 1, 'checkpoint', '2026-04-01 12:25:00', 0, NULL, 50, NULL, '2026-04-01 05:47:05', '2026-04-01 07:47:53', '2026-04-01 07:47:53'),
(3, 258, 11, 'milestone', 'Redesign Complete Logic and UI of Add Question Page', NULL, '2026-04-01 16:15:00', 1, 'checkpoint', '2026-04-03 13:00:00', 0, NULL, 0, NULL, '2026-04-01 10:39:35', '2026-04-01 10:39:35', NULL),
(4, 334, 13, 'milestone', 'Milestone 1: Foundation + Auth [Estimated 7 days]', '-> System – Setup with compatability\n-> Module/Pages - Initial blank page\n-> Dashboard template design for super admin/parish admin/parish staff\n-> Role Management\n-> Middleware/Authenticaation\n-> Database design\n-> Schema/Tables (.approx 24-30 tables)', '2026-04-04 09:40:00', 1, 'checkpoint', '2026-04-11 09:45:00', 0, NULL, 5, NULL, '2026-04-04 04:07:45', '2026-04-04 04:07:45', NULL),
(5, 334, 13, 'milestone', 'Milestone 2: Modules + Table’s Relation’s [Estimated 20-40 days]', '1. Parishioner Management\n1. Comprehensive family and individual profiles capturing personal, contact,\nand household details.\n2. Streamlined member registration with flexible categorisation by age, status,\nand role.\n3. Complex: Real-time attendance tracking for Masses, events, and parish\nactivities.\n4. Organised community grouping across zones, units, and ministries for better\npastoral outreach.\n2. Sacrament Management\n1. Complete records management for Baptism, Confirmation, First\nCommunion, and Marriage sacraments.\n2. Automated certificate generation with secure digital archiving for easy\nretrieval.\n3. Sacrament scheduling with automated reminders for participants and clergy.\n3. Donation & Finance Management\n1. Accurate tracking of tithes, regular offerings, and special campaign\ndonations.Vasp Technologies Pvt. Ltd.\n2. Seamless online donation integration supporting UPI, credit/debit cards, and\nnet banking.\n3. Instant automated receipts issued to donors upon every contribution.\n4. Detailed financial reports and audit-ready statements to ensure full\ntransparency and accountability (FAST).\n4. Event & Mass Management\n1. Organised Mass schedules with the ability to record and manage Mass\nintentions on behalf of parishioners.\n2. End-to-end event planning with online registration and attendance\nmanagement.\n3. Dedicated tools for planning and managing feast days and parish festivals.\n4. Efficient volunteer coordination with role assignments and availability\ntracking.\n5. Communication Module\n1. Multi-channel notifications via SMS, Email, and WhatsApp to keep\nparishioners informed.\n2. Parish-wide announcements and newsletters are distributed digitally with\nease.\n3. Platform for sharing prayer requests, spiritual reflections, and community\nupdates.\n6. Cemetery Management\n1. Detailed burial records with systematic cemetery plot allocation and\nmanagement.\n2. Complex: Precise grave location tracking with mapped cemetery layouts for\neasy navigation.\n3. Scheduled renewal notices and maintenance tracking to preserve cemetery\ngrounds.\n7. Education & Catechism\n1. Centralised Sunday school and catechism student database with enrolment\nrecords.\n2. Student attendance and academic performance tracking tailored for\ncatechism classes and programmes.\n3. Comprehensive teacher profiles and class management tools for catechism\ncoordinators.Vasp Technologies Pvt. Ltd.\n8. Reports & Analytics\n1. Consolidated financial summaries covering income, expenditure, and\ndonation trends.\n2. Detailed participation reports measuring engagement across Masses, events,\nand ministries.\n3. Configurable custom dashboards giving administrators a real-time overview\nof parish operations.', '2026-04-11 09:45:00', 1, 'checkpoint', '2026-04-30 09:50:00', 0, NULL, 0, NULL, '2026-04-04 04:09:04', '2026-04-04 04:09:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `timeline_event_attachments`
--

CREATE TABLE `timeline_event_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `timeline_event_id` bigint(20) UNSIGNED NOT NULL,
  `file_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_recovery_codes` text COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `session_id`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `phone`, `avatar`, `status`, `last_login_at`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Administrator', 'admin@example.com', NULL, '$2y$12$5gK8N6MpMI3Ca41HHtuoDe4Fb0bcU.4fATOpGJZRXIyk/xQkQ7dXK', 'S65LiBzS3xX7bv78WqPZqYlH5tauEzJQB0eV0ONX', NULL, NULL, NULL, '8811047292', NULL, 'active', NULL, NULL, '2026-03-17 07:56:43', '2026-04-06 10:58:32', NULL),
(5, 'Sarowar Alam', 'sarowar@vasp.com', NULL, '$2y$12$uaZu61dpo8t648hAd6HuGOupsiKYfllWwMa/y47vZQ1O9bciq322i', 'ZsHbnPoNLhiggUhWsgEmB3j3ImSxWgMGaSlO74Mi', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-01-08 13:41:33', '2026-04-06 12:00:29', NULL),
(7, 'Ritupan Deka', 'ritupan@vasp.com', NULL, '$2y$12$PXX5zVRZOobI/ScyXgddt.LoCrEUCd34nGkJyfb021gFNFl45K/.u', 'V70BOYfarIFpP0E5KE74VqlDeCC9t9Xfj9pWCz40', NULL, NULL, NULL, NULL, NULL, 'active', NULL, '49iAiD2pFSI87C6j2V8UvWZ596Gc3OyHOggaSZ5qBmOhuY8RMbqYGp9dLtDQ', '2026-01-09 07:18:21', '2026-04-07 03:47:07', NULL),
(8, 'Md. Shad Alam', 'shad@vasp.com', NULL, '$2y$12$TvQw2MTcG1ugBHSl8tWzKu16K7YX2zCIbBuq3JHvU8uF.9.Q7Q11O', 'xAjAedULpxJdPrNitmg5BvRcQAs8C9qLFxGCOkIc', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-01-09 09:29:09', '2026-04-06 14:11:07', NULL),
(9, 'Meraj Alam', 'meraj@vasp.com', NULL, '$2y$12$CLpg68m91OfxBUu.lIuuo.opE6TG8T4R/4q5RrYnwGFxEE/b9KmKW', 'p2n0QopAYtXeDQy2PWaRzaVpKnj7zl984ecvCZFW', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'Ad4t2xAsvfBavofTC4IBX8IilXcaX38CgCPGSkL5TuOJogAZdC70wdj3olnu', '2026-01-11 07:02:54', '2026-04-07 03:44:49', NULL),
(10, 'Aditya Kumar', 'aditya@vasp.com', NULL, '$2y$12$K91j6mEpzcgn9K.uhy3VFe60Vb.JFDeh16E9LngtXEZO8es9KokUq', 'uQMoutBBOQqASPKIWL5XHb20QGCxq6trOThkpggz', NULL, NULL, NULL, NULL, NULL, 'active', NULL, '5DMYOElvhledTPmtlVbiyVfy2DyVzsOe55ZLgXwYtSLDrQE5fMMLA4zb7yfp', '2026-01-11 07:14:29', '2026-04-06 12:44:24', NULL),
(11, 'Gautam Das', 'gautamdas@vasp.com', NULL, '$2y$12$WJL.tvkqvo5lyxl3dX/DiebuNjOA5N4fC6WiBn/xbZ63QRL/iTGxC', 'JcFMfwR6qSHJ4Xo7v8rKJbrAewKKALLxZzVwolmr', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'EUOpR5HGz3Wku757FjoA8P8YFhGAmvmwbpG9TgzRiBNmNYwiM5tqeQDl60O4', '2026-01-11 07:27:36', '2026-04-07 04:15:43', NULL),
(12, 'Pranadeep Sinha', 'pranadeep@vasptechnologies.co.in', NULL, '$2y$12$MIDWr5QtWvqNpM6vnDQ0BeH99a.Vlp11slF.QkIOEJltdPvikOzXq', 'j5ceM2QBCXMKjRkc5rOkWvLrLHcom9CGXi8Hv5Os', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-02-20 02:32:41', '2026-04-07 02:41:30', NULL),
(13, 'Badal', 'badal@vasptechnologies.co.in', NULL, '$2y$12$ECmNwElKDrrQZCH7R1KvAeOkBYcVBOsJl0wCKJnzH/G1mGZ76q1Bm', 'tPKt1qFpDhXWl22B1vDYqS6A289rGnS9PDaIuG08', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'n4PZYi7qt8LypeDvj4jw3A8swhlecMcCutRQ5WY7oedQjX71llh9Hvygz5ZR', '2026-02-20 02:58:16', '2026-04-07 03:54:59', NULL),
(14, 'Bhanu Pratap Mourya', 'bhanu@vasptechnologies.com', NULL, '$2y$12$.a5aYUANswICW5HfKp7ol.g/W7b6TsRn6svcsI6BpwZchgx4f1EBm', 'sr8Hv0Y2NEd3vG3ZGaY5ZcQorlo0fSg1x3AG5kAW', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'cYOluqKMmU7y1zyYcI6YdGiMeEa4RKtgUC83tRU2rqpY5RcLnZHBOnOkBwge', '2026-03-02 03:10:42', '2026-04-07 04:29:09', NULL),
(15, 'Neha Bansal', 'neha@vasptechnologies.co.in', NULL, '$2y$12$9SaUFHjE5rFCqgwNtpYM0eKR3tRv8RWelUgUNESuSLj5LLxR.x1Bi', '5ezeCMY5QlURied3RCV0Z5Zj5i43EfHEj3Kh3aAm', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-04-01 08:36:00', '2026-04-06 11:42:42', NULL),
(16, 'Superadmin', 'super@vasp.com', NULL, '$2y$12$OT0F0XeJr3kCGyUBTpcLteQEbpMMlwVX3o7LyfUECus4IAWaCSHDq', 'gzKess1DBcCV2JFp8rKGXcHYye72ts48YQRAJAWM', NULL, NULL, NULL, '8638733589', NULL, 'active', NULL, NULL, NULL, '2026-04-03 10:27:58', NULL),
(17, 'Anurag Maurya', 'anurag@vasptechnologies.co.in', NULL, '$2y$12$WFW05ckHqWKMmY723Jy.B..aL6HiqxvNmYCbGxgUp6h2NBnfStOKy', NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-04-01 11:55:14', '2026-04-01 11:55:14', NULL),
(18, 'Harshit Bora', 'harshit@vasptechnologies.co.in', NULL, '$2y$12$Bl8R8KKfNGF.5wdHNIru4e22d.cH/fCIebE1S2LHp.e1enCg72btu', 'HqGrvEEJ8nyM0DhsN0PAjDZT0gDdLSyTnG5Ilx4n', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'IzgHRkzLoNKh5BYrf3XvMy81b9HcyqRSuOLYQfTaB9hkRHPbQI1tVOYqFiA7', '2026-04-01 11:58:41', '2026-04-04 14:28:46', NULL),
(19, 'Khimjali Maibangsa', 'khimjali@vasptechnologies.co.in', NULL, '$2y$12$W0.RglXvTzLPjbG0M5SSS.KjazKEBxKb7zWyTdvNErFg80IyptP7G', 'aqA2et4DbqUzgPjJydUEcK3xM8RHAaUbCWIfrxHS', NULL, NULL, NULL, NULL, NULL, 'active', NULL, 'AnEOUOydOiqestdXI79OxCvog4UyrnoQSrDcS75UVf5o22wSOTQOGqzvfGtD', '2026-04-01 12:00:30', '2026-04-06 03:42:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users_notifications`
--

CREATE TABLE `users_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `notification_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users_notifications`
--

INSERT INTO `users_notifications` (`id`, `user_id`, `notification_id`, `read`, `read_at`, `created_at`, `updated_at`) VALUES
(10, 11, 'd065f703-4711-401c-800e-0c9a9f667ca7', 1, '2026-04-04 08:33:24', '2026-04-01 06:11:07', '2026-04-04 08:33:24'),
(12, 11, '6c2b323f-2ff1-4610-b00c-07e230ae96d0', 1, '2026-04-04 08:33:18', '2026-04-01 08:40:09', '2026-04-04 08:33:18'),
(13, 14, '79775782-937d-4361-93db-576292f19f30', 0, NULL, '2026-04-02 10:01:35', '2026-04-02 10:01:35'),
(14, 14, '7e8cda8f-b0c6-4f59-90fd-b73dcdefef89', 0, NULL, '2026-04-02 10:02:11', '2026-04-02 10:02:11'),
(19, 8, 'e84dbfc8-9c2a-471e-bac0-717a543bfbd5', 0, NULL, '2026-04-02 12:15:40', '2026-04-02 12:15:40'),
(21, 17, '9a80bf4b-85da-4f6b-b165-f41d6a00e7cb', 0, NULL, '2026-04-02 12:36:30', '2026-04-02 12:36:30'),
(22, 5, '9c24650b-51a5-4840-9e66-f1cbbf5c7800', 1, '2026-04-03 10:26:26', '2026-04-02 12:42:00', '2026-04-03 10:26:26'),
(23, 14, 'bca5d2d8-9bc5-4ab5-942c-33c4a261f2c7', 0, NULL, '2026-04-03 05:23:33', '2026-04-03 05:23:33'),
(24, 11, 'a6bdc2ae-91d2-4ff8-8d84-bf8b2495b7f9', 1, '2026-04-04 08:33:15', '2026-04-03 05:35:26', '2026-04-04 08:33:15'),
(25, 8, '10be77d3-690f-4280-87b8-c870bc31381e', 0, NULL, '2026-04-03 08:26:16', '2026-04-03 08:26:16'),
(26, 8, 'a4a34a5f-2e1f-47f3-b327-b9622d6cb3d0', 0, NULL, '2026-04-03 08:28:07', '2026-04-03 08:28:07'),
(27, 14, '56a88a48-a8db-48df-80e0-353214695674', 0, NULL, '2026-04-03 08:57:16', '2026-04-03 08:57:16'),
(28, 14, 'c1cd58cb-81f9-460b-86ff-3f2a2f2c14ec', 0, NULL, '2026-04-03 10:10:07', '2026-04-03 10:10:07'),
(29, 5, '4f92db9e-9e5d-4002-8629-61e2c87f41cd', 1, '2026-04-03 11:50:37', '2026-04-03 10:29:36', '2026-04-03 11:50:37'),
(30, 7, '328b1717-ec1a-45a7-90a4-34d17489e83e', 0, NULL, '2026-04-04 04:17:02', '2026-04-04 04:17:02'),
(31, 5, '53b22fc8-5a76-43e5-b234-320bca0fc056', 1, '2026-04-04 09:05:35', '2026-04-04 04:17:24', '2026-04-04 09:05:35'),
(32, 11, '74ed8677-6559-4584-8e7d-1a15c365a234', 1, '2026-04-04 08:33:04', '2026-04-04 04:21:16', '2026-04-04 08:33:04'),
(33, 14, 'ef518f06-7053-4fd7-a1a6-8637539834cb', 0, NULL, '2026-04-04 04:25:21', '2026-04-04 04:25:21'),
(34, 14, '9fcea4cf-62be-48b1-a28e-6abde4d0ef77', 0, NULL, '2026-04-04 04:35:17', '2026-04-04 04:35:17'),
(35, 14, '47d7b6c9-8750-412d-ba87-0acd9da244ca', 0, NULL, '2026-04-06 03:02:17', '2026-04-06 03:02:17'),
(36, 14, 'c75c2169-604f-47ce-8009-86269d738294', 0, NULL, '2026-04-06 03:45:19', '2026-04-06 03:45:19'),
(37, 11, '99f20cb4-3a87-4c27-9556-282160f36f9b', 0, NULL, '2026-04-06 06:55:23', '2026-04-06 06:55:23'),
(38, 14, '9dd97cab-98dd-478b-8f8f-0e715ea3dc0b', 0, NULL, '2026-04-06 11:02:59', '2026-04-06 11:02:59'),
(39, 14, 'b515e66a-9793-46b5-b9b6-976732051730', 0, NULL, '2026-04-06 11:03:53', '2026-04-06 11:03:53'),
(40, 14, 'ee48f604-fcdb-459a-952a-05356a5cd389', 0, NULL, '2026-04-06 11:17:43', '2026-04-06 11:17:43'),
(41, 11, '9fa78ed0-983a-4d32-9af8-2e05cfeffc52', 0, NULL, '2026-04-06 11:38:06', '2026-04-06 11:38:06'),
(42, 14, '28383d35-5c92-474e-8019-aa2bccef2118', 0, NULL, '2026-04-07 02:43:52', '2026-04-07 02:43:52');

-- --------------------------------------------------------

--
-- Table structure for table `user_notification_preferences`
--

CREATE TABLE `user_notification_preferences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `notify_via_pusher` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'In-app real-time notifications',
  `notify_via_whatsapp` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Send via WhatsApp',
  `notify_via_sms` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Send via SMS',
  `notify_via_email` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Send via email',
  `whatsapp_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'WhatsApp phone number for notifications',
  `sms_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SMS phone number for notifications',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `granted` enum('granted','denied') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'granted',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`id`, `user_id`, `permission_id`, `granted`, `created_at`, `updated_at`) VALUES
(1460, 17, 1, 'granted', NULL, NULL),
(1461, 17, 2, 'granted', NULL, NULL),
(1462, 17, 3, 'granted', NULL, NULL),
(1463, 17, 4, 'granted', NULL, NULL),
(1464, 17, 5, 'granted', NULL, NULL),
(1465, 17, 6, 'granted', NULL, NULL),
(1466, 17, 8, 'granted', NULL, NULL),
(1467, 17, 13, 'granted', NULL, NULL),
(1468, 17, 14, 'granted', NULL, NULL),
(1469, 17, 15, 'granted', NULL, NULL),
(1470, 17, 16, 'granted', NULL, NULL),
(1471, 17, 17, 'granted', NULL, NULL),
(1472, 17, 18, 'granted', NULL, NULL),
(1473, 17, 20, 'granted', NULL, NULL),
(1474, 17, 32, 'granted', NULL, NULL),
(1475, 17, 37, 'granted', NULL, NULL),
(1476, 17, 38, 'granted', NULL, NULL),
(1477, 17, 39, 'granted', NULL, NULL),
(1478, 17, 40, 'granted', NULL, NULL),
(1479, 17, 41, 'granted', NULL, NULL),
(1480, 17, 42, 'granted', NULL, NULL),
(1481, 17, 56, 'granted', NULL, NULL),
(1482, 17, 62, 'granted', NULL, NULL),
(1483, 17, 91, 'granted', NULL, NULL),
(1484, 17, 92, 'granted', NULL, NULL),
(1485, 17, 93, 'granted', NULL, NULL),
(1486, 17, 94, 'granted', NULL, NULL),
(1487, 17, 95, 'granted', NULL, NULL),
(1488, 17, 96, 'granted', NULL, NULL),
(1489, 17, 97, 'granted', NULL, NULL),
(1490, 17, 98, 'granted', NULL, NULL),
(1491, 17, 99, 'granted', NULL, NULL),
(1492, 17, 100, 'granted', NULL, NULL),
(1493, 17, 101, 'granted', NULL, NULL),
(1494, 17, 102, 'granted', NULL, NULL),
(1495, 17, 103, 'granted', NULL, NULL),
(1496, 17, 104, 'granted', NULL, NULL),
(1497, 17, 105, 'granted', NULL, NULL),
(1498, 17, 106, 'granted', NULL, NULL),
(1499, 17, 107, 'granted', NULL, NULL),
(1500, 17, 108, 'granted', NULL, NULL),
(1501, 17, 121, 'granted', NULL, NULL),
(1502, 17, 122, 'granted', NULL, NULL),
(1503, 17, 123, 'granted', NULL, NULL),
(1504, 17, 124, 'granted', NULL, NULL),
(1505, 17, 125, 'granted', NULL, NULL),
(1506, 17, 126, 'granted', NULL, NULL),
(1507, 17, 127, 'granted', NULL, NULL),
(1508, 17, 128, 'granted', NULL, NULL),
(1509, 17, 129, 'granted', NULL, NULL),
(1510, 17, 130, 'granted', NULL, NULL),
(1511, 17, 131, 'granted', NULL, NULL),
(1512, 17, 132, 'granted', NULL, NULL),
(1513, 17, 133, 'granted', NULL, NULL),
(1514, 17, 134, 'granted', NULL, NULL),
(1515, 17, 135, 'granted', NULL, NULL),
(1516, 17, 136, 'granted', NULL, NULL),
(1517, 17, 137, 'granted', NULL, NULL),
(1518, 17, 138, 'granted', NULL, NULL),
(1519, 17, 139, 'granted', NULL, NULL),
(1520, 17, 140, 'granted', NULL, NULL),
(1521, 17, 141, 'granted', NULL, NULL),
(1522, 17, 142, 'granted', NULL, NULL),
(1523, 17, 143, 'granted', NULL, NULL),
(1524, 17, 144, 'granted', NULL, NULL),
(1525, 17, 145, 'granted', NULL, NULL),
(1526, 17, 146, 'granted', NULL, NULL),
(1527, 17, 147, 'granted', NULL, NULL),
(1528, 17, 148, 'granted', NULL, NULL),
(1529, 17, 149, 'granted', NULL, NULL),
(1530, 17, 150, 'granted', NULL, NULL),
(1531, 17, 151, 'granted', NULL, NULL),
(1532, 17, 152, 'granted', NULL, NULL),
(1533, 17, 153, 'granted', NULL, NULL),
(1534, 17, 154, 'granted', NULL, NULL),
(1535, 17, 155, 'granted', NULL, NULL),
(1536, 17, 156, 'granted', NULL, NULL),
(1537, 17, 157, 'granted', NULL, NULL),
(1538, 17, 158, 'granted', NULL, NULL),
(1539, 17, 159, 'granted', NULL, NULL),
(1540, 17, 160, 'granted', NULL, NULL),
(1541, 17, 161, 'granted', NULL, NULL),
(1542, 17, 162, 'granted', NULL, NULL),
(1543, 17, 163, 'granted', NULL, NULL),
(1544, 17, 164, 'granted', NULL, NULL),
(1545, 17, 165, 'granted', NULL, NULL),
(1546, 17, 166, 'granted', NULL, NULL),
(1547, 17, 167, 'granted', NULL, NULL),
(1548, 17, 168, 'granted', NULL, NULL),
(1549, 17, 169, 'granted', NULL, NULL),
(1550, 17, 170, 'granted', NULL, NULL),
(1551, 17, 171, 'granted', NULL, NULL),
(1552, 17, 172, 'granted', NULL, NULL),
(1553, 17, 173, 'granted', NULL, NULL),
(1554, 17, 174, 'granted', NULL, NULL),
(1555, 17, 175, 'granted', NULL, NULL),
(1556, 17, 176, 'granted', NULL, NULL),
(1557, 17, 177, 'granted', NULL, NULL),
(1558, 17, 178, 'granted', NULL, NULL),
(1559, 17, 179, 'granted', NULL, NULL),
(1560, 17, 180, 'granted', NULL, NULL),
(1561, 17, 181, 'granted', NULL, NULL),
(1562, 17, 182, 'granted', NULL, NULL),
(1563, 17, 183, 'granted', NULL, NULL),
(1564, 17, 184, 'granted', NULL, NULL),
(1565, 17, 185, 'granted', NULL, NULL),
(1566, 17, 186, 'granted', NULL, NULL),
(1567, 17, 187, 'granted', NULL, NULL),
(1568, 17, 188, 'granted', NULL, NULL),
(1569, 17, 189, 'granted', NULL, NULL),
(1570, 17, 190, 'granted', NULL, NULL),
(1571, 17, 191, 'granted', NULL, NULL),
(1572, 17, 192, 'granted', NULL, NULL),
(1573, 17, 193, 'granted', NULL, NULL),
(1574, 17, 194, 'granted', NULL, NULL),
(1575, 17, 195, 'granted', NULL, NULL),
(1576, 17, 196, 'granted', NULL, NULL),
(1577, 17, 197, 'granted', NULL, NULL),
(1578, 17, 198, 'granted', NULL, NULL),
(1579, 17, 199, 'granted', NULL, NULL),
(1580, 17, 200, 'granted', NULL, NULL),
(1581, 17, 201, 'granted', NULL, NULL),
(1582, 17, 202, 'granted', NULL, NULL),
(1583, 17, 203, 'granted', NULL, NULL),
(1584, 17, 204, 'granted', NULL, NULL),
(1585, 17, 205, 'granted', NULL, NULL),
(1586, 17, 206, 'granted', NULL, NULL),
(1587, 17, 207, 'granted', NULL, NULL),
(1588, 17, 208, 'granted', NULL, NULL),
(1589, 17, 209, 'granted', NULL, NULL),
(1590, 17, 210, 'granted', NULL, NULL),
(1591, 17, 211, 'granted', NULL, NULL),
(1592, 17, 212, 'granted', NULL, NULL),
(1593, 17, 213, 'granted', NULL, NULL),
(1594, 17, 214, 'granted', NULL, NULL),
(1595, 17, 215, 'granted', NULL, NULL),
(1596, 17, 216, 'granted', NULL, NULL),
(1597, 17, 217, 'granted', NULL, NULL),
(1598, 17, 218, 'granted', NULL, NULL),
(1599, 17, 219, 'granted', NULL, NULL),
(1600, 17, 220, 'granted', NULL, NULL),
(1601, 17, 221, 'granted', NULL, NULL),
(1602, 17, 222, 'granted', NULL, NULL),
(1603, 17, 224, 'granted', NULL, NULL),
(1604, 17, 225, 'granted', NULL, NULL),
(1605, 17, 228, 'granted', NULL, NULL),
(1606, 17, 235, 'granted', NULL, NULL),
(1607, 17, 236, 'granted', NULL, NULL),
(1608, 17, 237, 'granted', NULL, NULL),
(1609, 17, 238, 'granted', NULL, NULL),
(1610, 17, 239, 'granted', NULL, NULL),
(1611, 17, 240, 'granted', NULL, NULL),
(1612, 17, 242, 'granted', NULL, NULL),
(1613, 17, 243, 'granted', NULL, NULL),
(1614, 17, 256, 'granted', NULL, NULL),
(1615, 17, 257, 'granted', NULL, NULL),
(1616, 17, 258, 'granted', NULL, NULL),
(1617, 17, 259, 'granted', NULL, NULL),
(1618, 17, 260, 'granted', NULL, NULL),
(1619, 17, 261, 'granted', NULL, NULL),
(1620, 17, 262, 'granted', NULL, NULL),
(1621, 17, 263, 'granted', NULL, NULL),
(1622, 17, 264, 'granted', NULL, NULL),
(1623, 17, 265, 'granted', NULL, NULL),
(1624, 17, 266, 'granted', NULL, NULL),
(1625, 17, 267, 'granted', NULL, NULL),
(1626, 17, 268, 'granted', NULL, NULL),
(1627, 17, 269, 'granted', NULL, NULL),
(1628, 17, 270, 'granted', NULL, NULL),
(1629, 17, 271, 'granted', NULL, NULL),
(1630, 17, 274, 'granted', NULL, NULL),
(1631, 17, 275, 'granted', NULL, NULL),
(1632, 17, 277, 'granted', NULL, NULL),
(1633, 17, 286, 'granted', NULL, NULL),
(1634, 17, 287, 'granted', NULL, NULL),
(1635, 17, 288, 'granted', NULL, NULL),
(1636, 17, 289, 'granted', NULL, NULL),
(1637, 17, 290, 'granted', NULL, NULL),
(1638, 17, 291, 'granted', NULL, NULL),
(1639, 17, 292, 'granted', NULL, NULL),
(1640, 17, 293, 'granted', NULL, NULL),
(1641, 17, 294, 'granted', NULL, NULL),
(1642, 17, 295, 'granted', NULL, NULL),
(1643, 17, 296, 'granted', NULL, NULL),
(1644, 17, 297, 'granted', NULL, NULL),
(1645, 17, 298, 'granted', NULL, NULL),
(1646, 17, 299, 'granted', NULL, NULL),
(1647, 17, 300, 'granted', NULL, NULL),
(1648, 17, 301, 'granted', NULL, NULL),
(1649, 17, 302, 'granted', NULL, NULL),
(1650, 17, 303, 'granted', NULL, NULL),
(1651, 17, 304, 'granted', NULL, NULL),
(1652, 17, 305, 'granted', NULL, NULL),
(1653, 17, 314, 'granted', NULL, NULL),
(1654, 17, 315, 'granted', NULL, NULL),
(1655, 17, 316, 'granted', NULL, NULL),
(1656, 17, 317, 'granted', NULL, NULL),
(1657, 17, 318, 'granted', NULL, NULL),
(1658, 17, 319, 'granted', NULL, NULL),
(1659, 17, 320, 'granted', NULL, NULL),
(1660, 17, 322, 'granted', NULL, NULL),
(1661, 17, 323, 'granted', NULL, NULL),
(1662, 17, 324, 'granted', NULL, NULL),
(1663, 17, 326, 'granted', NULL, NULL),
(1664, 17, 327, 'granted', NULL, NULL),
(1665, 17, 328, 'granted', NULL, NULL),
(1666, 17, 330, 'granted', NULL, NULL),
(1667, 17, 331, 'granted', NULL, NULL),
(1668, 17, 332, 'granted', NULL, NULL),
(1669, 17, 334, 'granted', NULL, NULL),
(1670, 17, 335, 'granted', NULL, NULL),
(1671, 17, 336, 'granted', NULL, NULL),
(1672, 18, 1, 'granted', NULL, NULL),
(1673, 18, 2, 'granted', NULL, NULL),
(1674, 18, 3, 'granted', NULL, NULL),
(1675, 18, 4, 'granted', NULL, NULL),
(1676, 18, 5, 'granted', NULL, NULL),
(1677, 18, 6, 'granted', NULL, NULL),
(1678, 18, 13, 'granted', NULL, NULL),
(1679, 18, 14, 'granted', NULL, NULL),
(1680, 18, 15, 'granted', NULL, NULL),
(1681, 18, 16, 'granted', NULL, NULL),
(1682, 18, 17, 'granted', NULL, NULL),
(1683, 18, 18, 'granted', NULL, NULL),
(1684, 18, 37, 'granted', NULL, NULL),
(1685, 18, 38, 'granted', NULL, NULL),
(1686, 18, 39, 'granted', NULL, NULL),
(1687, 18, 40, 'granted', NULL, NULL),
(1688, 18, 41, 'granted', NULL, NULL),
(1689, 18, 42, 'granted', NULL, NULL),
(1690, 18, 97, 'granted', NULL, NULL),
(1691, 18, 98, 'granted', NULL, NULL),
(1692, 18, 99, 'granted', NULL, NULL),
(1693, 18, 100, 'granted', NULL, NULL),
(1694, 18, 101, 'granted', NULL, NULL),
(1695, 18, 102, 'granted', NULL, NULL),
(1696, 18, 103, 'granted', NULL, NULL),
(1697, 18, 104, 'granted', NULL, NULL),
(1698, 18, 105, 'granted', NULL, NULL),
(1699, 18, 106, 'granted', NULL, NULL),
(1700, 18, 107, 'granted', NULL, NULL),
(1701, 18, 108, 'granted', NULL, NULL),
(1702, 18, 121, 'granted', NULL, NULL),
(1703, 18, 122, 'granted', NULL, NULL),
(1704, 18, 123, 'granted', NULL, NULL),
(1705, 18, 124, 'granted', NULL, NULL),
(1706, 18, 125, 'granted', NULL, NULL),
(1707, 18, 126, 'granted', NULL, NULL),
(1708, 18, 127, 'granted', NULL, NULL),
(1709, 18, 128, 'granted', NULL, NULL),
(1710, 18, 129, 'granted', NULL, NULL),
(1711, 18, 130, 'granted', NULL, NULL),
(1712, 18, 131, 'granted', NULL, NULL),
(1713, 18, 132, 'granted', NULL, NULL),
(1714, 18, 133, 'granted', NULL, NULL),
(1715, 18, 134, 'granted', NULL, NULL),
(1716, 18, 135, 'granted', NULL, NULL),
(1717, 18, 136, 'granted', NULL, NULL),
(1718, 18, 137, 'granted', NULL, NULL),
(1719, 18, 138, 'granted', NULL, NULL),
(1720, 18, 139, 'granted', NULL, NULL),
(1721, 18, 140, 'granted', NULL, NULL),
(1722, 18, 141, 'granted', NULL, NULL),
(1723, 18, 142, 'granted', NULL, NULL),
(1724, 18, 143, 'granted', NULL, NULL),
(1725, 18, 144, 'granted', NULL, NULL),
(1726, 18, 145, 'granted', NULL, NULL),
(1727, 18, 146, 'granted', NULL, NULL),
(1728, 18, 147, 'granted', NULL, NULL),
(1729, 18, 148, 'granted', NULL, NULL),
(1730, 18, 149, 'granted', NULL, NULL),
(1731, 18, 150, 'granted', NULL, NULL),
(1732, 18, 151, 'granted', NULL, NULL),
(1733, 18, 152, 'granted', NULL, NULL),
(1734, 18, 153, 'granted', NULL, NULL),
(1735, 18, 154, 'granted', NULL, NULL),
(1736, 18, 155, 'granted', NULL, NULL),
(1737, 18, 156, 'granted', NULL, NULL),
(1738, 18, 157, 'granted', NULL, NULL),
(1739, 18, 158, 'granted', NULL, NULL),
(1740, 18, 159, 'granted', NULL, NULL),
(1741, 18, 160, 'granted', NULL, NULL),
(1742, 18, 161, 'granted', NULL, NULL),
(1743, 18, 162, 'granted', NULL, NULL),
(1744, 18, 163, 'granted', NULL, NULL),
(1745, 18, 164, 'granted', NULL, NULL),
(1746, 18, 165, 'granted', NULL, NULL),
(1747, 18, 166, 'granted', NULL, NULL),
(1748, 18, 167, 'granted', NULL, NULL),
(1749, 18, 168, 'granted', NULL, NULL),
(1750, 18, 169, 'granted', NULL, NULL),
(1751, 18, 170, 'granted', NULL, NULL),
(1752, 18, 171, 'granted', NULL, NULL),
(1753, 18, 172, 'granted', NULL, NULL),
(1754, 18, 173, 'granted', NULL, NULL),
(1755, 18, 174, 'granted', NULL, NULL),
(1756, 18, 175, 'granted', NULL, NULL),
(1757, 18, 176, 'granted', NULL, NULL),
(1758, 18, 177, 'granted', NULL, NULL),
(1759, 18, 178, 'granted', NULL, NULL),
(1760, 18, 179, 'granted', NULL, NULL),
(1761, 18, 180, 'granted', NULL, NULL),
(1762, 18, 181, 'granted', NULL, NULL),
(1763, 18, 182, 'granted', NULL, NULL),
(1764, 18, 183, 'granted', NULL, NULL),
(1765, 18, 184, 'granted', NULL, NULL),
(1766, 18, 185, 'granted', NULL, NULL),
(1767, 18, 186, 'granted', NULL, NULL),
(1768, 18, 235, 'granted', NULL, NULL),
(1769, 18, 236, 'granted', NULL, NULL),
(1770, 18, 237, 'granted', NULL, NULL),
(1771, 18, 238, 'granted', NULL, NULL),
(1772, 18, 239, 'granted', NULL, NULL),
(1773, 18, 240, 'granted', NULL, NULL),
(1774, 18, 241, 'granted', NULL, NULL),
(1775, 18, 242, 'granted', NULL, NULL),
(1776, 18, 243, 'granted', NULL, NULL),
(1777, 18, 245, 'granted', NULL, NULL),
(1778, 18, 246, 'granted', NULL, NULL),
(1779, 18, 247, 'granted', NULL, NULL),
(1780, 18, 267, 'granted', NULL, NULL),
(1781, 18, 268, 'granted', NULL, NULL),
(1782, 18, 269, 'granted', NULL, NULL),
(1783, 18, 270, 'granted', NULL, NULL),
(1784, 18, 271, 'granted', NULL, NULL),
(1785, 18, 275, 'granted', NULL, NULL),
(1786, 18, 276, 'granted', NULL, NULL),
(1787, 18, 286, 'granted', NULL, NULL),
(1788, 18, 287, 'granted', NULL, NULL),
(1789, 18, 288, 'granted', NULL, NULL),
(1790, 18, 289, 'granted', NULL, NULL),
(1791, 18, 290, 'granted', NULL, NULL),
(1792, 18, 291, 'granted', NULL, NULL),
(1793, 18, 292, 'granted', NULL, NULL),
(1794, 18, 293, 'granted', NULL, NULL),
(1795, 18, 294, 'granted', NULL, NULL),
(1796, 18, 295, 'granted', NULL, NULL),
(1797, 18, 296, 'granted', NULL, NULL),
(1798, 18, 297, 'granted', NULL, NULL),
(1799, 18, 298, 'granted', NULL, NULL),
(1800, 18, 299, 'granted', NULL, NULL),
(1801, 18, 300, 'granted', NULL, NULL),
(1802, 18, 301, 'granted', NULL, NULL),
(1803, 18, 330, 'granted', NULL, NULL),
(1804, 18, 331, 'granted', NULL, NULL),
(1805, 18, 332, 'granted', NULL, NULL),
(1806, 18, 333, 'granted', NULL, NULL),
(1807, 18, 334, 'granted', NULL, NULL),
(1808, 18, 335, 'granted', NULL, NULL),
(1809, 18, 336, 'granted', NULL, NULL),
(1810, 18, 337, 'granted', NULL, NULL),
(1811, 19, 1, 'granted', NULL, NULL),
(1812, 19, 2, 'granted', NULL, NULL),
(1813, 19, 3, 'granted', NULL, NULL),
(1814, 19, 4, 'granted', NULL, NULL),
(1815, 19, 5, 'granted', NULL, NULL),
(1816, 19, 6, 'granted', NULL, NULL),
(1817, 19, 13, 'granted', NULL, NULL),
(1818, 19, 14, 'granted', NULL, NULL),
(1819, 19, 15, 'granted', NULL, NULL),
(1820, 19, 16, 'granted', NULL, NULL),
(1821, 19, 17, 'granted', NULL, NULL),
(1822, 19, 18, 'granted', NULL, NULL),
(1823, 19, 37, 'granted', NULL, NULL),
(1824, 19, 38, 'granted', NULL, NULL),
(1825, 19, 39, 'granted', NULL, NULL),
(1826, 19, 40, 'granted', NULL, NULL),
(1827, 19, 41, 'granted', NULL, NULL),
(1828, 19, 42, 'granted', NULL, NULL),
(1829, 19, 97, 'granted', NULL, NULL),
(1830, 19, 98, 'granted', NULL, NULL),
(1831, 19, 99, 'granted', NULL, NULL),
(1832, 19, 100, 'granted', NULL, NULL),
(1833, 19, 101, 'granted', NULL, NULL),
(1834, 19, 102, 'granted', NULL, NULL),
(1835, 19, 103, 'granted', NULL, NULL),
(1836, 19, 104, 'granted', NULL, NULL),
(1837, 19, 105, 'granted', NULL, NULL),
(1838, 19, 106, 'granted', NULL, NULL),
(1839, 19, 107, 'granted', NULL, NULL),
(1840, 19, 108, 'granted', NULL, NULL),
(1841, 19, 121, 'granted', NULL, NULL),
(1842, 19, 122, 'granted', NULL, NULL),
(1843, 19, 123, 'granted', NULL, NULL),
(1844, 19, 124, 'granted', NULL, NULL),
(1845, 19, 125, 'granted', NULL, NULL),
(1846, 19, 126, 'granted', NULL, NULL),
(1847, 19, 127, 'granted', NULL, NULL),
(1848, 19, 128, 'granted', NULL, NULL),
(1849, 19, 129, 'granted', NULL, NULL),
(1850, 19, 130, 'granted', NULL, NULL),
(1851, 19, 131, 'granted', NULL, NULL),
(1852, 19, 132, 'granted', NULL, NULL),
(1853, 19, 133, 'granted', NULL, NULL),
(1854, 19, 134, 'granted', NULL, NULL),
(1855, 19, 135, 'granted', NULL, NULL),
(1856, 19, 136, 'granted', NULL, NULL),
(1857, 19, 137, 'granted', NULL, NULL),
(1858, 19, 138, 'granted', NULL, NULL),
(1859, 19, 139, 'granted', NULL, NULL),
(1860, 19, 140, 'granted', NULL, NULL),
(1861, 19, 141, 'granted', NULL, NULL),
(1862, 19, 142, 'granted', NULL, NULL),
(1863, 19, 143, 'granted', NULL, NULL),
(1864, 19, 144, 'granted', NULL, NULL),
(1865, 19, 145, 'granted', NULL, NULL),
(1866, 19, 146, 'granted', NULL, NULL),
(1867, 19, 147, 'granted', NULL, NULL),
(1868, 19, 148, 'granted', NULL, NULL),
(1869, 19, 149, 'granted', NULL, NULL),
(1870, 19, 150, 'granted', NULL, NULL),
(1871, 19, 151, 'granted', NULL, NULL),
(1872, 19, 152, 'granted', NULL, NULL),
(1873, 19, 153, 'granted', NULL, NULL),
(1874, 19, 154, 'granted', NULL, NULL),
(1875, 19, 155, 'granted', NULL, NULL),
(1876, 19, 156, 'granted', NULL, NULL),
(1877, 19, 157, 'granted', NULL, NULL),
(1878, 19, 158, 'granted', NULL, NULL),
(1879, 19, 159, 'granted', NULL, NULL),
(1880, 19, 160, 'granted', NULL, NULL),
(1881, 19, 161, 'granted', NULL, NULL),
(1882, 19, 162, 'granted', NULL, NULL),
(1883, 19, 163, 'granted', NULL, NULL),
(1884, 19, 164, 'granted', NULL, NULL),
(1885, 19, 165, 'granted', NULL, NULL),
(1886, 19, 166, 'granted', NULL, NULL),
(1887, 19, 167, 'granted', NULL, NULL),
(1888, 19, 168, 'granted', NULL, NULL),
(1889, 19, 169, 'granted', NULL, NULL),
(1890, 19, 170, 'granted', NULL, NULL),
(1891, 19, 171, 'granted', NULL, NULL),
(1892, 19, 172, 'granted', NULL, NULL),
(1893, 19, 173, 'granted', NULL, NULL),
(1894, 19, 174, 'granted', NULL, NULL),
(1895, 19, 175, 'granted', NULL, NULL),
(1896, 19, 176, 'granted', NULL, NULL),
(1897, 19, 177, 'granted', NULL, NULL),
(1898, 19, 178, 'granted', NULL, NULL),
(1899, 19, 179, 'granted', NULL, NULL),
(1900, 19, 180, 'granted', NULL, NULL),
(1901, 19, 181, 'granted', NULL, NULL),
(1902, 19, 182, 'granted', NULL, NULL),
(1903, 19, 183, 'granted', NULL, NULL),
(1904, 19, 184, 'granted', NULL, NULL),
(1905, 19, 185, 'granted', NULL, NULL),
(1906, 19, 186, 'granted', NULL, NULL),
(1907, 19, 235, 'granted', NULL, NULL),
(1908, 19, 236, 'granted', NULL, NULL),
(1909, 19, 237, 'granted', NULL, NULL),
(1910, 19, 238, 'granted', NULL, NULL),
(1911, 19, 239, 'granted', NULL, NULL),
(1912, 19, 240, 'granted', NULL, NULL),
(1913, 19, 241, 'granted', NULL, NULL),
(1914, 19, 242, 'granted', NULL, NULL),
(1915, 19, 243, 'granted', NULL, NULL),
(1916, 19, 245, 'granted', NULL, NULL),
(1917, 19, 246, 'granted', NULL, NULL),
(1918, 19, 247, 'granted', NULL, NULL),
(1919, 19, 267, 'granted', NULL, NULL),
(1920, 19, 268, 'granted', NULL, NULL),
(1921, 19, 269, 'granted', NULL, NULL),
(1922, 19, 270, 'granted', NULL, NULL),
(1923, 19, 271, 'granted', NULL, NULL),
(1924, 19, 275, 'granted', NULL, NULL),
(1925, 19, 276, 'granted', NULL, NULL),
(1926, 19, 286, 'granted', NULL, NULL),
(1927, 19, 287, 'granted', NULL, NULL),
(1928, 19, 288, 'granted', NULL, NULL),
(1929, 19, 289, 'granted', NULL, NULL),
(1930, 19, 290, 'granted', NULL, NULL),
(1931, 19, 291, 'granted', NULL, NULL),
(1932, 19, 292, 'granted', NULL, NULL),
(1933, 19, 293, 'granted', NULL, NULL),
(1934, 19, 294, 'granted', NULL, NULL),
(1935, 19, 295, 'granted', NULL, NULL),
(1936, 19, 296, 'granted', NULL, NULL),
(1937, 19, 297, 'granted', NULL, NULL),
(1938, 19, 298, 'granted', NULL, NULL),
(1939, 19, 299, 'granted', NULL, NULL),
(1940, 19, 300, 'granted', NULL, NULL),
(1941, 19, 301, 'granted', NULL, NULL),
(1942, 19, 330, 'granted', NULL, NULL),
(1943, 19, 331, 'granted', NULL, NULL),
(1944, 19, 332, 'granted', NULL, NULL),
(1945, 19, 333, 'granted', NULL, NULL),
(1946, 19, 334, 'granted', NULL, NULL),
(1947, 19, 335, 'granted', NULL, NULL),
(1948, 19, 336, 'granted', NULL, NULL),
(1949, 19, 337, 'granted', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_skills`
--

CREATE TABLE `user_skills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `skill_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proficiency_level` int(11) NOT NULL DEFAULT '1',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workload_metrics`
--

CREATE TABLE `workload_metrics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `metric_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric_value` decimal(10,2) NOT NULL,
  `metric_unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `period_end` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `calculated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject` (`subject_type`,`subject_id`),
  ADD KEY `causer` (`causer_type`,`causer_id`),
  ADD KEY `activity_logs_log_name_index` (`log_name`),
  ADD KEY `activity_logs_subject_id_subject_type_index` (`subject_id`,`subject_type`),
  ADD KEY `activity_logs_causer_id_causer_type_index` (`causer_id`,`causer_type`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `client-code-unique` (`code`),
  ADD KEY `clients_product_id_foreign` (`product_id`);

--
-- Indexes for table `comment_attachments`
--
ALTER TABLE `comment_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comment_attachments_comment_type_comment_id_index` (`comment_type`,`comment_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_slug_unique` (`slug`);

--
-- Indexes for table `department_users`
--
ALTER TABLE `department_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `department_users_department_id_user_id_unique` (`department_id`,`user_id`),
  ADD KEY `department_users_user_department_idx` (`user_id`,`department_id`),
  ADD KEY `department_users_assigned_at_idx` (`assigned_at`),
  ADD KEY `department_users_assigned_by_idx` (`assigned_by`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employees_code_unique` (`code`),
  ADD KEY `employees_user_id_foreign` (`user_id`),
  ADD KEY `employees_department_id_foreign` (`department_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `organization_users`
--
ALTER TABLE `organization_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organization_users_client_name_unique` (`client_id`,`name`),
  ADD KEY `organization_users_client_id_foreign` (`client_id`),
  ADD KEY `organization_users_client_id_index` (`client_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`),
  ADD UNIQUE KEY `permissions_slug_unique` (`slug`),
  ADD KEY `permissions_module_action_index` (`module`,`action`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `projects_code_unique` (`code`),
  ADD KEY `projects_manager_id_foreign` (`manager_id`),
  ADD KEY `projects_department_id_foreign` (`department_id`),
  ADD KEY `projects_created_by_foreign` (`created_by`);

--
-- Indexes for table `project_attachments`
--
ALTER TABLE `project_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_attachments_uploaded_by_foreign` (`uploaded_by`),
  ADD KEY `project_attachments_project_id_created_at_index` (`project_id`,`created_at`);

--
-- Indexes for table `project_milestones`
--
ALTER TABLE `project_milestones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_milestones_project_id_status_index` (`project_id`,`status`),
  ADD KEY `project_milestones_project_id_target_date_index` (`project_id`,`target_date`);

--
-- Indexes for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_phases_project_id_sort_order_index` (`project_id`,`sort_order`),
  ADD KEY `project_phases_project_id_status_index` (`project_id`,`status`);

--
-- Indexes for table `project_teams`
--
ALTER TABLE `project_teams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_teams_project_id_user_id_unique` (`project_id`,`user_id`),
  ADD KEY `project_teams_user_id_foreign` (`user_id`);

--
-- Indexes for table `project_timeline_events`
--
ALTER TABLE `project_timeline_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_timeline_events_phase_id_foreign` (`phase_id`),
  ADD KEY `project_timeline_events_user_id_foreign` (`user_id`),
  ADD KEY `project_timeline_events_project_id_event_date_index` (`project_id`,`event_date`),
  ADD KEY `project_timeline_events_project_id_event_type_index` (`project_id`,`event_type`),
  ADD KEY `project_timeline_events_project_id_is_milestone_index` (`project_id`,`is_milestone`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reports_user_id_foreign` (`user_id`);

--
-- Indexes for table `report_attachments`
--
ALTER TABLE `report_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `report_attachments_report_id_foreign` (`report_id`);

--
-- Indexes for table `report_tasks`
--
ALTER TABLE `report_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `report_tasks_report_id_foreign` (`report_id`),
  ADD KEY `report_tasks_task_id_foreign` (`task_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Indexes for table `role_menu_items`
--
ALTER TABLE `role_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_menu_items_role_id_menu_key_unique` (`role_id`,`menu_key`),
  ADD KEY `role_menu_items_menu_key_index` (`menu_key`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_user_role_id_user_id_unique` (`role_id`,`user_id`),
  ADD KEY `role_user_user_id_foreign` (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `sla_policies`
--
ALTER TABLE `sla_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sla_policies_task_type_id_foreign` (`task_type_id`);

--
-- Indexes for table `sso_login_tokens`
--
ALTER TABLE `sso_login_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sso_login_tokens_client_id_jti_unique` (`client_id`,`jti`),
  ADD KEY `sso_login_tokens_organization_user_id_foreign` (`organization_user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tasks_task_code_unique` (`task_code`),
  ADD KEY `tasks_task_type_id_foreign` (`task_type_id`),
  ADD KEY `tasks_sla_policy_id_foreign` (`sla_policy_id`),
  ADD KEY `tasks_parent_task_id_foreign` (`parent_task_id`),
  ADD KEY `tasks_created_by_foreign` (`created_by`),
  ADD KEY `tasks_state_index` (`state`),
  ADD KEY `tasks_current_owner_kind_current_owner_id_index` (`current_owner_kind`,`current_owner_id`),
  ADD KEY `tasks_due_at_index` (`due_at`),
  ADD KEY `tasks_project_id_index` (`project_id`),
  ADD KEY `tasks_department_id_index` (`department_id`),
  ADD KEY `tasks_assigned_department_state_idx` (`assigned_department_id`,`state`),
  ADD KEY `tasks_assigned_to_state_idx` (`assigned_to`,`state`),
  ADD KEY `tasks_ticket_id_idx` (`ticket_id`),
  ADD KEY `tasks_phase_id_foreign` (`phase_id`),
  ADD KEY `tasks_project_id_phase_id_index` (`project_id`,`phase_id`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `task_assignments_task_id_user_id_unique` (`task_id`,`user_id`),
  ADD KEY `task_assignments_assigned_by_foreign` (`assigned_by`),
  ADD KEY `task_assignments_task_id_index` (`task_id`),
  ADD KEY `task_assignments_user_id_index` (`user_id`),
  ADD KEY `task_assignments_is_active_index` (`is_active`),
  ADD KEY `task_assignments_assigned_at_index` (`assigned_at`),
  ADD KEY `task_assignments_state_index` (`state`);

--
-- Indexes for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_attachments_task_id_foreign` (`task_id`),
  ADD KEY `task_attachments_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `task_audit_events`
--
ALTER TABLE `task_audit_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_audit_events_task_id_occurred_at_index` (`task_id`,`occurred_at`),
  ADD KEY `task_audit_events_actor_user_id_index` (`actor_user_id`),
  ADD KEY `task_audit_events_action_index` (`action`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_comments_task_id_foreign` (`task_id`),
  ADD KEY `task_comments_commented_by_type_commented_by_id_index` (`commented_by_type`,`commented_by_id`),
  ADD KEY `task_comments_deleted_by_foreign` (`deleted_by`);

--
-- Indexes for table `task_comment_attachments`
--
ALTER TABLE `task_comment_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_comment_attachments_comment_type_comment_id_index` (`comment_type`,`comment_id`);

--
-- Indexes for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_dependencies_task_id_foreign` (`task_id`),
  ADD KEY `task_dependencies_depends_on_task_id_foreign` (`depends_on_task_id`);

--
-- Indexes for table `task_forwardings`
--
ALTER TABLE `task_forwardings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_forwardings_task_id_foreign` (`task_id`),
  ADD KEY `task_forwardings_from_user_id_foreign` (`from_user_id`),
  ADD KEY `task_forwardings_from_department_id_foreign` (`from_department_id`),
  ADD KEY `task_forwardings_to_user_id_foreign` (`to_user_id`),
  ADD KEY `task_forwardings_to_department_id_foreign` (`to_department_id`),
  ADD KEY `task_forwardings_forwarded_by_foreign` (`forwarded_by`),
  ADD KEY `task_forwardings_accepted_by_foreign` (`accepted_by`),
  ADD KEY `task_forwardings_rejected_by_foreign` (`rejected_by`);

--
-- Indexes for table `task_histories`
--
ALTER TABLE `task_histories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_histories_task_id_foreign` (`task_id`),
  ADD KEY `task_histories_changed_by_foreign` (`changed_by`);

--
-- Indexes for table `task_time_entries`
--
ALTER TABLE `task_time_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_time_entries_task_id_user_id_index` (`task_id`,`user_id`),
  ADD KEY `task_time_entries_user_id_is_active_index` (`user_id`,`is_active`),
  ADD KEY `task_time_entries_task_id_is_active_index` (`task_id`,`is_active`);

--
-- Indexes for table `task_types`
--
ALTER TABLE `task_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `task_types_code_unique` (`code`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tickets_ticket_number_unique` (`ticket_number`),
  ADD KEY `tickets_organization_user_id_foreign` (`organization_user_id`),
  ADD KEY `tickets_assigned_to_foreign` (`assigned_to`),
  ADD KEY `tickets_status_priority_idx` (`status`,`priority`),
  ADD KEY `tickets_client_status_idx` (`client_id`,`status`),
  ADD KEY `tickets_approved_by_idx` (`approved_by`),
  ADD KEY `tickets_rejected_by_idx` (`rejected_by`);

--
-- Indexes for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_attachments_ticket_id_foreign` (`ticket_id`);

--
-- Indexes for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_comments_ticket_id_foreign` (`ticket_id`),
  ADD KEY `ticket_comments_deleted_by_foreign` (`deleted_by`);

--
-- Indexes for table `ticket_histories`
--
ALTER TABLE `ticket_histories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_histories_ticket_id_foreign` (`ticket_id`),
  ADD KEY `ticket_histories_changed_by_foreign` (`changed_by`);

--
-- Indexes for table `timeline_events`
--
ALTER TABLE `timeline_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `timeline_events_task_id_foreign` (`task_id`),
  ADD KEY `timeline_events_user_id_index` (`user_id`),
  ADD KEY `timeline_events_milestone_status_idx` (`is_milestone`,`is_completed`),
  ADD KEY `timeline_events_target_date_idx` (`target_date`);

--
-- Indexes for table `timeline_event_attachments`
--
ALTER TABLE `timeline_event_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `timeline_event_attachments_timeline_event_id_foreign` (`timeline_event_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_status_idx` (`status`),
  ADD KEY `users_last_login_at_idx` (`last_login_at`);

--
-- Indexes for table `users_notifications`
--
ALTER TABLE `users_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_notifications_user_id_notification_id_unique` (`user_id`,`notification_id`),
  ADD KEY `users_notifications_user_id_read_index` (`user_id`,`read`),
  ADD KEY `users_notifications_notification_id_index` (`notification_id`);

--
-- Indexes for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_notification_preferences_user_id_unique` (`user_id`),
  ADD KEY `user_notification_preferences_user_id_index` (`user_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_permissions_user_id_permission_id_unique` (`user_id`,`permission_id`),
  ADD KEY `user_permissions_permission_id_foreign` (`permission_id`),
  ADD KEY `user_permissions_user_id_granted_index` (`user_id`,`granted`);

--
-- Indexes for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_skills_user_id_skill_name_unique` (`user_id`,`skill_name`);

--
-- Indexes for table `workload_metrics`
--
ALTER TABLE `workload_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `workload_metrics_unique` (`user_id`,`metric_type`,`period_start`,`period_end`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `comment_attachments`
--
ALTER TABLE `comment_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `department_users`
--
ALTER TABLE `department_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `organization_users`
--
ALTER TABLE `organization_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=341;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_attachments`
--
ALTER TABLE `project_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_milestones`
--
ALTER TABLE `project_milestones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_phases`
--
ALTER TABLE `project_phases`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_teams`
--
ALTER TABLE `project_teams`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_timeline_events`
--
ALTER TABLE `project_timeline_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=291;

--
-- AUTO_INCREMENT for table `report_attachments`
--
ALTER TABLE `report_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `report_tasks`
--
ALTER TABLE `report_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=493;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `role_menu_items`
--
ALTER TABLE `role_menu_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=361;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1907;

--
-- AUTO_INCREMENT for table `role_user`
--
ALTER TABLE `role_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `sla_policies`
--
ALTER TABLE `sla_policies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `sso_login_tokens`
--
ALTER TABLE `sso_login_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=396;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=404;

--
-- AUTO_INCREMENT for table `task_attachments`
--
ALTER TABLE `task_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `task_audit_events`
--
ALTER TABLE `task_audit_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `task_comments`
--
ALTER TABLE `task_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `task_comment_attachments`
--
ALTER TABLE `task_comment_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_forwardings`
--
ALTER TABLE `task_forwardings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_histories`
--
ALTER TABLE `task_histories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `task_time_entries`
--
ALTER TABLE `task_time_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=731;

--
-- AUTO_INCREMENT for table `task_types`
--
ALTER TABLE `task_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `ticket_histories`
--
ALTER TABLE `ticket_histories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `timeline_events`
--
ALTER TABLE `timeline_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `timeline_event_attachments`
--
ALTER TABLE `timeline_event_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `users_notifications`
--
ALTER TABLE `users_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1950;

--
-- AUTO_INCREMENT for table `user_skills`
--
ALTER TABLE `user_skills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workload_metrics`
--
ALTER TABLE `workload_metrics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `department_users`
--
ALTER TABLE `department_users`
  ADD CONSTRAINT `department_users_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `organization_users`
--
ALTER TABLE `organization_users`
  ADD CONSTRAINT `organization_users_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `projects_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `projects_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_attachments`
--
ALTER TABLE `project_attachments`
  ADD CONSTRAINT `project_attachments_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_attachments_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_milestones`
--
ALTER TABLE `project_milestones`
  ADD CONSTRAINT `project_milestones_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD CONSTRAINT `project_phases_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_teams`
--
ALTER TABLE `project_teams`
  ADD CONSTRAINT `project_teams_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_teams_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_timeline_events`
--
ALTER TABLE `project_timeline_events`
  ADD CONSTRAINT `project_timeline_events_phase_id_foreign` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `project_timeline_events_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_timeline_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_attachments`
--
ALTER TABLE `report_attachments`
  ADD CONSTRAINT `report_attachments_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_tasks`
--
ALTER TABLE `report_tasks`
  ADD CONSTRAINT `report_tasks_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `report_tasks_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_menu_items`
--
ALTER TABLE `role_menu_items`
  ADD CONSTRAINT `role_menu_items_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sla_policies`
--
ALTER TABLE `sla_policies`
  ADD CONSTRAINT `sla_policies_task_type_id_foreign` FOREIGN KEY (`task_type_id`) REFERENCES `task_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sso_login_tokens`
--
ALTER TABLE `sso_login_tokens`
  ADD CONSTRAINT `sso_login_tokens_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sso_login_tokens_organization_user_id_foreign` FOREIGN KEY (`organization_user_id`) REFERENCES `organization_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_assigned_department_id_foreign` FOREIGN KEY (`assigned_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_parent_task_id_foreign` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_phase_id_foreign` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_sla_policy_id_foreign` FOREIGN KEY (`sla_policy_id`) REFERENCES `sla_policies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_task_type_id_foreign` FOREIGN KEY (`task_type_id`) REFERENCES `task_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_assignments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD CONSTRAINT `task_attachments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_attachments_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_audit_events`
--
ALTER TABLE `task_audit_events`
  ADD CONSTRAINT `task_audit_events_actor_user_id_foreign` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_audit_events_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `task_comments_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_comments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD CONSTRAINT `task_dependencies_depends_on_task_id_foreign` FOREIGN KEY (`depends_on_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_dependencies_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_forwardings`
--
ALTER TABLE `task_forwardings`
  ADD CONSTRAINT `task_forwardings_accepted_by_foreign` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_forwardings_forwarded_by_foreign` FOREIGN KEY (`forwarded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_forwardings_from_department_id_foreign` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_forwardings_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_forwardings_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_forwardings_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_forwardings_to_department_id_foreign` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_forwardings_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_histories`
--
ALTER TABLE `task_histories`
  ADD CONSTRAINT `task_histories_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `task_histories_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_time_entries`
--
ALTER TABLE `task_time_entries`
  ADD CONSTRAINT `task_time_entries_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_time_entries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_organization_user_id_foreign` FOREIGN KEY (`organization_user_id`) REFERENCES `organization_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD CONSTRAINT `ticket_attachments_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD CONSTRAINT `ticket_comments_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ticket_comments_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_histories`
--
ALTER TABLE `ticket_histories`
  ADD CONSTRAINT `ticket_histories_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ticket_histories_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `timeline_events`
--
ALTER TABLE `timeline_events`
  ADD CONSTRAINT `timeline_events_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `timeline_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `timeline_event_attachments`
--
ALTER TABLE `timeline_event_attachments`
  ADD CONSTRAINT `timeline_event_attachments_timeline_event_id_foreign` FOREIGN KEY (`timeline_event_id`) REFERENCES `timeline_events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users_notifications`
--
ALTER TABLE `users_notifications`
  ADD CONSTRAINT `users_notifications_notification_id_foreign` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD CONSTRAINT `user_notification_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_permissions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workload_metrics`
--
ALTER TABLE `workload_metrics`
  ADD CONSTRAINT `workload_metrics_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
