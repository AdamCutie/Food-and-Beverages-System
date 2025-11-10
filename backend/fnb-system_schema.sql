-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 08, 2025 at 07:44 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `food_beverage_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`) VALUES
(1, 'Appetizer'),
(2, 'Main Dish'),
(3, 'Desserts'),
(4, 'Beverages'),
(5, 'Kids Menu');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `first_name`, `last_name`, `email`, `password`, `phone`, `created_at`) VALUES
(1, 'Ran', 'Ran', 'ranran@example.com', '$2a$10$jgYuAa.n3i3LKGNSn14vjO7q5bczEf6WvlAFI.j0tsw86wIX2hg9u', NULL, '2025-10-17 16:00:25'),
(2, 'Franc Randell', 'Coton', 'nishidell04@gmail.com', '$2a$10$cK4DB.hGuNt0P1ZmCNy/puo50bZYfzyJH9upptLmkdCznE2hRMvJC', '09350756012', '2025-10-28 01:19:47'),
(3, 'Rylei', 'Abellera', 'rylei123@gmail.com', '$2a$10$IGwgnzzf1aXMqGfKgJdXg.0O1zZYo/ie3yXEhZAHYDCJv.cOgwxoq', NULL, '2025-11-01 05:41:56'),
(4, 'Roronoa', 'Zoro', 'roronoa123@gmail.com', '$2a$10$wrCcNC5UVfeT6IUfrHjvQOjU.2.RDZg2.a9ILwyBeA2OCa57AAcLG', NULL, '2025-11-01 11:13:24'),
(5, 'Crystal', 'Torio', 'crystal@example.com', '$2a$10$oBj84L6oe7bkbIMIs4GjU.hx3y9k77x5wTVF2QDyieZvXMzESA.de', '9171234567', '2025-11-02 16:24:24'),
(6, 'Hezel', 'Joy', 'hezel@example.com', '$2a$10$WOLN6WQlu9L5TIlJ0nQjreihh7jf.aZjiCPaOV8V8gHNqYP9.nCoa', '9283617283', '2025-11-05 18:20:13');

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `ingredient_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `stock_level` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_of_measurement` varchar(50) NOT NULL COMMENT 'e.g., g, ml, pcs',
  `reorder_point` decimal(10,2) NOT NULL DEFAULT 10.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`ingredient_id`, `name`, `stock_level`, `unit_of_measurement`, `reorder_point`, `created_at`) VALUES
(1, 'Beef', 7510.00, 'g', 10.00, '2025-11-01 03:45:10'),
(2, 'Bread', 9981.00, 'pcs', 10.00, '2025-11-01 11:32:01'),
(3, 'Cheese', 9707.00, 'g', 10.00, '2025-11-01 11:32:52'),
(4, 'Chicken', 954.00, 'g', 10.00, '2025-11-02 00:00:53'),
(5, 'Pork', 2000.00, 'g', 10.00, '2025-11-02 00:12:38'),
(6, 'Potato', 8.00, 'pcs', 10.00, '2025-11-02 00:19:30'),
(7, 'Tomato', 6.00, 'pcs', 10.00, '2025-11-02 00:20:53'),
(8, 'Fish', 10010.00, 'g', 10.00, '2025-11-02 00:24:58'),
(9, 'Lettuce', 10008.00, 'pcs', 10.00, '2025-11-02 00:29:37'),
(10, 'Onion', 107.00, 'pcs', 10.00, '2025-11-02 00:34:54'),
(11, 'mango', 1000.00, 'pcs', 10.00, '2025-11-06 15:48:41');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `log_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `action_type` enum('RESTOCK','WASTE','ADJUST_ADD','ADJUST_SUBTRACT','INITIAL','ORDER_DEDUCT','ORDER_RESTORE') NOT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `new_stock_level` decimal(10,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_logs`
--

INSERT INTO `inventory_logs` (`log_id`, `ingredient_id`, `staff_id`, `action_type`, `quantity_change`, `new_stock_level`, `reason`, `timestamp`) VALUES
(1, 1, NULL, 'INITIAL', 5000.00, 5000.00, 'Ingredient created', '2025-11-01 03:45:10'),
(2, 1, NULL, 'ORDER_DEDUCT', 150.00, 4850.00, 'Order ID: 1', '2025-11-01 04:13:09'),
(3, 1, NULL, 'ORDER_DEDUCT', 300.00, 4550.00, 'Order ID: 2', '2025-11-01 04:18:34'),
(4, 1, NULL, 'ORDER_DEDUCT', 450.00, 4100.00, 'Order ID: 3', '2025-11-01 04:30:23'),
(5, 1, NULL, 'ORDER_DEDUCT', 600.00, 3500.00, 'Order ID: 4', '2025-11-01 05:43:18'),
(6, 1, NULL, 'ORDER_DEDUCT', 300.00, 3200.00, 'Order ID: 5', '2025-11-01 10:50:39'),
(7, 1, NULL, 'ORDER_DEDUCT', 300.00, 2900.00, 'Order ID: 6', '2025-11-01 10:51:09'),
(8, 1, NULL, 'ORDER_DEDUCT', 300.00, 2600.00, 'Order ID: 7', '2025-11-01 10:55:17'),
(9, 1, NULL, 'ORDER_DEDUCT', 450.00, 2150.00, 'Order ID: 8', '2025-11-01 11:14:39'),
(10, 2, 2, 'INITIAL', 100.00, 100.00, 'Ingredient created', '2025-11-01 11:32:01'),
(11, 3, 2, 'INITIAL', 1000.00, 1000.00, 'Ingredient created', '2025-11-01 11:32:52'),
(12, 1, NULL, 'ORDER_DEDUCT', 200.00, 1950.00, 'Order ID: 9', '2025-11-01 11:37:32'),
(13, 2, NULL, 'ORDER_DEDUCT', 2.00, 98.00, 'Order ID: 9', '2025-11-01 11:37:32'),
(14, 3, NULL, 'ORDER_DEDUCT', 100.00, 900.00, 'Order ID: 9', '2025-11-01 11:37:32'),
(15, 1, NULL, 'ORDER_DEDUCT', 150.00, 1700.00, 'Order ID: 10', '2025-11-01 16:23:38'),
(16, 1, NULL, 'ORDER_DEDUCT', 100.00, 1700.00, 'Order ID: 10', '2025-11-01 16:23:38'),
(17, 2, NULL, 'ORDER_DEDUCT', 1.00, 97.00, 'Order ID: 10', '2025-11-01 16:23:38'),
(18, 3, NULL, 'ORDER_DEDUCT', 50.00, 850.00, 'Order ID: 10', '2025-11-01 16:23:38'),
(19, 1, NULL, 'ORDER_DEDUCT', 450.00, 1250.00, 'Order ID: 3', '2025-11-01 16:26:10'),
(20, 1, NULL, 'ORDER_DEDUCT', 300.00, 950.00, 'Order ID: 2', '2025-11-01 16:37:09'),
(21, 1, NULL, 'ORDER_DEDUCT', 600.00, 350.00, 'Order ID: 4', '2025-11-01 16:37:10'),
(22, 1, NULL, 'ORDER_DEDUCT', 300.00, 50.00, 'Order ID: 5', '2025-11-01 16:37:11'),
(23, 1, NULL, 'RESTOCK', 3000.00, 3050.00, 'New Delivery', '2025-11-01 16:37:49'),
(24, 1, NULL, 'ORDER_DEDUCT', 300.00, 2750.00, 'Order ID: 7', '2025-11-01 16:39:29'),
(25, 1, NULL, 'ORDER_DEDUCT', 300.00, 2450.00, 'Order ID: 6', '2025-11-01 16:39:30'),
(26, 1, NULL, 'ORDER_DEDUCT', 450.00, 1700.00, 'Order ID: 11', '2025-11-01 16:41:11'),
(27, 1, NULL, 'ORDER_DEDUCT', 300.00, 1700.00, 'Order ID: 11', '2025-11-01 16:41:11'),
(28, 2, NULL, 'ORDER_DEDUCT', 3.00, 94.00, 'Order ID: 11', '2025-11-01 16:41:11'),
(29, 3, NULL, 'ORDER_DEDUCT', 150.00, 700.00, 'Order ID: 11', '2025-11-01 16:41:11'),
(30, 1, NULL, 'ORDER_DEDUCT', 300.00, 1400.00, 'Order ID: 12', '2025-11-01 17:02:05'),
(31, 2, NULL, 'ORDER_DEDUCT', 3.00, 91.00, 'Order ID: 12', '2025-11-01 17:02:05'),
(32, 3, NULL, 'ORDER_DEDUCT', 150.00, 550.00, 'Order ID: 12', '2025-11-01 17:02:05'),
(33, 1, NULL, 'ORDER_DEDUCT', 100.00, 1300.00, 'Order ID: 13', '2025-11-01 23:54:12'),
(34, 2, NULL, 'ORDER_DEDUCT', 1.00, 90.00, 'Order ID: 13', '2025-11-01 23:54:12'),
(35, 3, NULL, 'ORDER_DEDUCT', 50.00, 500.00, 'Order ID: 13', '2025-11-01 23:54:12'),
(36, 4, 2, 'INITIAL', 3000.00, 3000.00, 'Ingredient created', '2025-11-02 00:00:53'),
(37, 5, 2, 'INITIAL', 2000.00, 2000.00, 'Ingredient created', '2025-11-02 00:12:38'),
(38, 6, 2, 'INITIAL', 100.00, 100.00, 'Ingredient created', '2025-11-02 00:19:30'),
(39, 6, 2, 'RESTOCK', 10.00, 110.00, 'New Delivery', '2025-11-02 00:19:54'),
(40, 7, 2, 'INITIAL', 50.00, 50.00, 'Ingredient created', '2025-11-02 00:20:53'),
(41, 8, 2, 'INITIAL', 2000.00, 2000.00, 'Ingredient created', '2025-11-02 00:24:58'),
(42, 9, 2, 'INITIAL', 20.00, 20.00, 'Ingredient created', '2025-11-02 00:29:37'),
(43, 10, NULL, 'INITIAL', 20.00, 20.00, 'Ingredient created', '2025-11-02 00:34:54'),
(44, 7, 2, 'WASTE', -20.00, 30.00, 'Rotten', '2025-11-02 00:51:06'),
(45, 10, NULL, 'ORDER_DEDUCT', 5.00, 15.00, 'Order ID: 14', '2025-11-02 16:34:57'),
(46, 4, NULL, 'ORDER_DEDUCT', 3.00, 2997.00, 'Order ID: 14', '2025-11-02 16:34:57'),
(47, 10, NULL, 'ORDER_DEDUCT', 5.00, 10.00, 'Order ID: 16', '2025-11-03 00:59:57'),
(48, 4, NULL, 'ORDER_DEDUCT', 3.00, 2994.00, 'Order ID: 16', '2025-11-03 00:59:57'),
(49, 1, NULL, 'ORDER_DEDUCT', 100.00, 1200.00, 'Order ID: 16', '2025-11-03 00:59:57'),
(50, 2, NULL, 'ORDER_DEDUCT', 1.00, 89.00, 'Order ID: 16', '2025-11-03 00:59:57'),
(51, 3, NULL, 'ORDER_DEDUCT', 50.00, 450.00, 'Order ID: 16', '2025-11-03 00:59:57'),
(52, 1, NULL, 'ORDER_DEDUCT', 150.00, 950.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(53, 1, NULL, 'ORDER_DEDUCT', 100.00, 950.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(54, 2, NULL, 'ORDER_DEDUCT', 1.00, 88.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(55, 3, NULL, 'ORDER_DEDUCT', 50.00, 400.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(56, 10, NULL, 'ORDER_DEDUCT', 5.00, 5.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(57, 4, NULL, 'ORDER_DEDUCT', 3.00, 2991.00, 'Order ID: 18', '2025-11-03 02:00:26'),
(58, 1, NULL, 'ORDER_RESTORE', 450.00, 1700.00, 'Order ID: 11', '2025-11-03 02:05:52'),
(59, 1, NULL, 'ORDER_RESTORE', 300.00, 1700.00, 'Order ID: 11', '2025-11-03 02:05:52'),
(60, 2, NULL, 'ORDER_RESTORE', 3.00, 91.00, 'Order ID: 11', '2025-11-03 02:05:52'),
(61, 3, NULL, 'ORDER_RESTORE', 150.00, 550.00, 'Order ID: 11', '2025-11-03 02:05:52'),
(62, 10, NULL, 'ORDER_DEDUCT', 5.00, 0.00, 'Order ID: 19', '2025-11-03 02:08:56'),
(63, 4, NULL, 'ORDER_DEDUCT', 3.00, 2988.00, 'Order ID: 19', '2025-11-03 02:08:56'),
(64, 10, 6, 'RESTOCK', 99.00, 99.00, NULL, '2025-11-03 02:13:58'),
(65, 1, NULL, 'ORDER_DEDUCT', 200.00, 1500.00, 'Order ID: 21', '2025-11-03 02:14:20'),
(66, 2, NULL, 'ORDER_DEDUCT', 2.00, 89.00, 'Order ID: 21', '2025-11-03 02:14:20'),
(67, 3, NULL, 'ORDER_DEDUCT', 100.00, 450.00, 'Order ID: 21', '2025-11-03 02:14:20'),
(68, 1, NULL, 'ORDER_DEDUCT', 200.00, 1300.00, 'Order ID: 20', '2025-11-03 02:23:20'),
(69, 2, NULL, 'ORDER_DEDUCT', 2.00, 87.00, 'Order ID: 20', '2025-11-03 02:23:20'),
(70, 3, NULL, 'ORDER_DEDUCT', 100.00, 350.00, 'Order ID: 20', '2025-11-03 02:23:20'),
(71, 1, NULL, 'ORDER_DEDUCT', 300.00, 1000.00, 'Order ID: 23', '2025-11-03 02:33:09'),
(72, 10, NULL, 'ORDER_DEDUCT', 5.00, 94.00, 'Order ID: 25', '2025-11-03 03:14:37'),
(73, 4, NULL, 'ORDER_DEDUCT', 3.00, 2985.00, 'Order ID: 25', '2025-11-03 03:14:37'),
(74, 10, NULL, 'ORDER_DEDUCT', 5.00, 89.00, 'Order ID: 26', '2025-11-03 03:24:04'),
(75, 4, NULL, 'ORDER_DEDUCT', 3.00, 2982.00, 'Order ID: 26', '2025-11-03 03:24:04'),
(76, 1, NULL, 'ORDER_DEDUCT', 100.00, 900.00, 'Order ID: 26', '2025-11-03 03:24:04'),
(77, 2, NULL, 'ORDER_DEDUCT', 1.00, 86.00, 'Order ID: 26', '2025-11-03 03:24:04'),
(78, 3, NULL, 'ORDER_DEDUCT', 50.00, 300.00, 'Order ID: 26', '2025-11-03 03:24:04'),
(79, 10, NULL, 'ORDER_DEDUCT', 5.00, 84.00, 'Order ID: 29', '2025-11-03 03:38:48'),
(80, 4, NULL, 'ORDER_DEDUCT', 3.00, 2979.00, 'Order ID: 29', '2025-11-03 03:38:48'),
(81, 10, NULL, 'ORDER_DEDUCT', 5.00, 79.00, 'Order ID: 29', '2025-11-03 03:46:47'),
(82, 4, NULL, 'ORDER_DEDUCT', 3.00, 2976.00, 'Order ID: 29', '2025-11-03 03:46:47'),
(83, 1, NULL, 'ORDER_DEDUCT', 150.00, 750.00, 'Order ID: 30', '2025-11-03 03:50:05'),
(84, 10, NULL, 'ORDER_DEDUCT', 5.00, 74.00, 'Order ID: 32', '2025-11-03 03:57:14'),
(85, 4, NULL, 'ORDER_DEDUCT', 3.00, 2973.00, 'Order ID: 32', '2025-11-03 03:57:14'),
(86, 1, NULL, 'ORDER_DEDUCT', 150.00, 600.00, 'Order ID: 30', '2025-11-03 03:59:41'),
(87, 1, NULL, 'ORDER_DEDUCT', 150.00, 350.00, 'Order ID: 33', '2025-11-05 04:54:02'),
(88, 1, NULL, 'ORDER_DEDUCT', 100.00, 350.00, 'Order ID: 33', '2025-11-05 04:54:02'),
(89, 2, NULL, 'ORDER_DEDUCT', 1.00, 85.00, 'Order ID: 33', '2025-11-05 04:54:02'),
(90, 3, NULL, 'ORDER_DEDUCT', 50.00, 250.00, 'Order ID: 33', '2025-11-05 04:54:02'),
(91, 1, NULL, 'ORDER_DEDUCT', 300.00, -50.00, 'Order ID: 35', '2025-11-05 05:11:22'),
(92, 1, NULL, 'ORDER_DEDUCT', 100.00, -50.00, 'Order ID: 35', '2025-11-05 05:11:22'),
(93, 2, NULL, 'ORDER_DEDUCT', 1.00, 84.00, 'Order ID: 35', '2025-11-05 05:11:22'),
(94, 3, NULL, 'ORDER_DEDUCT', 50.00, 200.00, 'Order ID: 35', '2025-11-05 05:11:22'),
(95, 1, 5, 'RESTOCK', 999.00, 949.00, NULL, '2025-11-05 05:12:00'),
(96, 1, NULL, 'ORDER_DEDUCT', 300.00, 549.00, 'Order ID: 35', '2025-11-05 05:12:07'),
(97, 1, NULL, 'ORDER_DEDUCT', 100.00, 549.00, 'Order ID: 35', '2025-11-05 05:12:07'),
(98, 2, NULL, 'ORDER_DEDUCT', 1.00, 83.00, 'Order ID: 35', '2025-11-05 05:12:07'),
(99, 3, NULL, 'ORDER_DEDUCT', 50.00, 150.00, 'Order ID: 35', '2025-11-05 05:12:07'),
(100, 1, NULL, 'ORDER_DEDUCT', 150.00, 299.00, 'Order ID: 36', '2025-11-05 05:42:47'),
(101, 1, NULL, 'ORDER_DEDUCT', 100.00, 299.00, 'Order ID: 36', '2025-11-05 05:42:47'),
(102, 2, NULL, 'ORDER_DEDUCT', 1.00, 82.00, 'Order ID: 36', '2025-11-05 05:42:47'),
(103, 3, NULL, 'ORDER_DEDUCT', 50.00, 100.00, 'Order ID: 36', '2025-11-05 05:42:47'),
(104, 1, 6, 'ADJUST_SUBTRACT', 9.00, 290.00, NULL, '2025-11-05 06:00:21'),
(105, 1, 6, 'ADJUST_SUBTRACT', 281.00, 9.00, NULL, '2025-11-05 06:00:55'),
(106, 10, NULL, 'ORDER_DEDUCT', 5.00, 69.00, 'Order ID: 38', '2025-11-05 06:58:35'),
(107, 4, NULL, 'ORDER_DEDUCT', 3.00, 2970.00, 'Order ID: 38', '2025-11-05 06:58:35'),
(108, 10, NULL, 'ORDER_DEDUCT', 5.00, 64.00, 'Order ID: 39', '2025-11-05 07:01:37'),
(109, 4, NULL, 'ORDER_DEDUCT', 3.00, 2967.00, 'Order ID: 39', '2025-11-05 07:01:37'),
(110, 10, NULL, 'ORDER_DEDUCT', 10.00, 54.00, 'Order ID: 42', '2025-11-05 07:19:31'),
(111, 4, NULL, 'ORDER_DEDUCT', 6.00, 2961.00, 'Order ID: 42', '2025-11-05 07:19:31'),
(112, 10, NULL, 'ORDER_DEDUCT', 5.00, 49.00, 'Order ID: 39', '2025-11-05 07:26:23'),
(113, 4, NULL, 'ORDER_DEDUCT', 3.00, 2958.00, 'Order ID: 39', '2025-11-05 07:26:23'),
(114, 2, 6, 'ADJUST_SUBTRACT', 70.00, 12.00, NULL, '2025-11-05 07:35:41'),
(115, 3, 6, 'ADJUST_SUBTRACT', 90.00, 10.00, NULL, '2025-11-05 07:35:49'),
(116, 4, 6, 'ADJUST_SUBTRACT', 2940.00, 18.00, NULL, '2025-11-05 07:36:04'),
(117, 8, 6, 'ADJUST_SUBTRACT', 1990.00, 10.00, NULL, '2025-11-05 07:36:16'),
(118, 2, 6, 'ADJUST_SUBTRACT', 3.00, 9.00, NULL, '2025-11-05 07:36:48'),
(119, 3, 6, 'ADJUST_SUBTRACT', 3.00, 7.00, NULL, '2025-11-05 07:37:00'),
(120, 4, 6, 'ADJUST_SUBTRACT', 9.00, 9.00, NULL, '2025-11-05 07:37:08'),
(121, 1, 6, 'RESTOCK', 20.00, 29.00, NULL, '2025-11-05 18:11:10'),
(122, 1, 6, 'RESTOCK', 500.00, 529.00, NULL, '2025-11-05 18:11:43'),
(123, 1, NULL, 'ORDER_DEDUCT', 150.00, 379.00, 'Order ID: 45', '2025-11-05 18:11:48'),
(124, 1, NULL, 'ORDER_DEDUCT', 300.00, 79.00, 'Order ID: 46', '2025-11-05 18:17:30'),
(125, 1, 6, 'RESTOCK', 1000.00, 1079.00, NULL, '2025-11-05 18:18:02'),
(126, 1, NULL, 'ORDER_DEDUCT', 300.00, 779.00, 'Order ID: 46', '2025-11-05 18:18:06'),
(127, 2, 6, 'RESTOCK', 100.00, 109.00, NULL, '2025-11-05 18:19:01'),
(128, 3, 6, 'RESTOCK', 1000.00, 1007.00, NULL, '2025-11-05 18:19:10'),
(129, 4, 6, 'RESTOCK', 1000.00, 1009.00, NULL, '2025-11-05 18:19:18'),
(130, 2, 6, 'ADJUST_SUBTRACT', 100.00, 9.00, NULL, '2025-11-05 18:55:34'),
(131, 9, 6, 'ADJUST_SUBTRACT', 11.00, 9.00, NULL, '2025-11-05 18:56:03'),
(132, 10, 6, 'ADJUST_SUBTRACT', 40.00, 9.00, NULL, '2025-11-05 18:56:14'),
(133, 10, NULL, 'ORDER_DEDUCT', 5.00, 4.00, 'Order ID: 38', '2025-11-06 01:54:47'),
(134, 4, NULL, 'ORDER_DEDUCT', 3.00, 1006.00, 'Order ID: 38', '2025-11-06 01:54:47'),
(135, 10, 6, 'RESTOCK', 100.00, 104.00, NULL, '2025-11-06 01:56:52'),
(136, 1, NULL, 'ORDER_DEDUCT', 100.00, 679.00, 'Order ID: 48', '2025-11-06 01:57:30'),
(137, 2, NULL, 'ORDER_DEDUCT', 1.00, 8.00, 'Order ID: 48', '2025-11-06 01:57:30'),
(138, 3, NULL, 'ORDER_DEDUCT', 50.00, 957.00, 'Order ID: 48', '2025-11-06 01:57:30'),
(139, 10, NULL, 'ORDER_DEDUCT', 5.00, 99.00, 'Order ID: 48', '2025-11-06 01:57:30'),
(140, 4, NULL, 'ORDER_DEDUCT', 3.00, 1003.00, 'Order ID: 48', '2025-11-06 01:57:30'),
(141, 1, NULL, 'ORDER_DEDUCT', 100.00, 579.00, 'Order ID: 49', '2025-11-06 02:00:28'),
(142, 2, NULL, 'ORDER_DEDUCT', 1.00, 7.00, 'Order ID: 49', '2025-11-06 02:00:28'),
(143, 3, NULL, 'ORDER_DEDUCT', 50.00, 907.00, 'Order ID: 49', '2025-11-06 02:00:28'),
(144, 10, NULL, 'ORDER_DEDUCT', 5.00, 94.00, 'Order ID: 49', '2025-11-06 02:00:28'),
(145, 4, NULL, 'ORDER_DEDUCT', 3.00, 1000.00, 'Order ID: 49', '2025-11-06 02:00:28'),
(146, 1, NULL, 'ORDER_DEDUCT', 100.00, 479.00, 'Order ID: 49', '2025-11-06 02:01:38'),
(147, 2, NULL, 'ORDER_DEDUCT', 1.00, 6.00, 'Order ID: 49', '2025-11-06 02:01:38'),
(148, 3, NULL, 'ORDER_DEDUCT', 50.00, 857.00, 'Order ID: 49', '2025-11-06 02:01:38'),
(149, 10, NULL, 'ORDER_DEDUCT', 5.00, 89.00, 'Order ID: 49', '2025-11-06 02:01:38'),
(150, 4, NULL, 'ORDER_DEDUCT', 3.00, 997.00, 'Order ID: 49', '2025-11-06 02:01:38'),
(151, 1, NULL, 'ORDER_DEDUCT', 150.00, 229.00, 'Order ID: 50', '2025-11-06 02:21:13'),
(152, 1, NULL, 'ORDER_DEDUCT', 100.00, 229.00, 'Order ID: 50', '2025-11-06 02:21:13'),
(153, 2, NULL, 'ORDER_DEDUCT', 1.00, 5.00, 'Order ID: 50', '2025-11-06 02:21:13'),
(154, 3, NULL, 'ORDER_DEDUCT', 50.00, 807.00, 'Order ID: 50', '2025-11-06 02:21:13'),
(155, 1, NULL, 'ORDER_DEDUCT', 100.00, 129.00, 'Order ID: 51', '2025-11-06 02:30:35'),
(156, 2, NULL, 'ORDER_DEDUCT', 1.00, 4.00, 'Order ID: 51', '2025-11-06 02:30:35'),
(157, 3, NULL, 'ORDER_DEDUCT', 50.00, 757.00, 'Order ID: 51', '2025-11-06 02:30:35'),
(158, 10, NULL, 'ORDER_DEDUCT', 5.00, 84.00, 'Order ID: 51', '2025-11-06 02:30:35'),
(159, 4, NULL, 'ORDER_DEDUCT', 3.00, 994.00, 'Order ID: 51', '2025-11-06 02:30:35'),
(160, 1, 6, 'RESTOCK', 10000.00, 10129.00, NULL, '2025-11-06 03:17:41'),
(161, 1, NULL, 'ORDER_DEDUCT', 150.00, 9879.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(162, 1, NULL, 'ORDER_DEDUCT', 100.00, 9879.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(163, 2, NULL, 'ORDER_DEDUCT', 1.00, 3.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(164, 3, NULL, 'ORDER_DEDUCT', 50.00, 707.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(165, 10, NULL, 'ORDER_DEDUCT', 5.00, 79.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(166, 4, NULL, 'ORDER_DEDUCT', 3.00, 991.00, 'Order ID: 52', '2025-11-06 03:17:53'),
(167, 1, NULL, 'ORDER_DEDUCT', 100.00, 9779.00, 'Order ID: 13', '2025-11-06 03:18:37'),
(168, 2, NULL, 'ORDER_DEDUCT', 1.00, 2.00, 'Order ID: 13', '2025-11-06 03:18:37'),
(169, 3, NULL, 'ORDER_DEDUCT', 50.00, 657.00, 'Order ID: 13', '2025-11-06 03:18:37'),
(170, 10, NULL, 'ORDER_DEDUCT', 5.00, 74.00, 'Order ID: 16', '2025-11-06 03:18:38'),
(171, 4, NULL, 'ORDER_DEDUCT', 3.00, 988.00, 'Order ID: 16', '2025-11-06 03:18:38'),
(172, 1, NULL, 'ORDER_DEDUCT', 100.00, 9679.00, 'Order ID: 16', '2025-11-06 03:18:38'),
(173, 2, NULL, 'ORDER_DEDUCT', 1.00, 1.00, 'Order ID: 16', '2025-11-06 03:18:38'),
(174, 3, NULL, 'ORDER_DEDUCT', 50.00, 607.00, 'Order ID: 16', '2025-11-06 03:18:38'),
(175, 10, NULL, 'ORDER_DEDUCT', 5.00, 69.00, 'Order ID: 19', '2025-11-06 03:18:39'),
(176, 4, NULL, 'ORDER_DEDUCT', 3.00, 985.00, 'Order ID: 19', '2025-11-06 03:18:39'),
(177, 2, 6, 'RESTOCK', 10000.00, 10001.00, NULL, '2025-11-06 03:19:00'),
(178, 8, 6, 'RESTOCK', 10000.00, 10010.00, NULL, '2025-11-06 03:19:07'),
(179, 9, 6, 'RESTOCK', 10000.00, 10009.00, NULL, '2025-11-06 03:19:16'),
(180, 1, NULL, 'ORDER_DEDUCT', 200.00, 9479.00, 'Order ID: 21', '2025-11-06 03:19:24'),
(181, 2, NULL, 'ORDER_DEDUCT', 2.00, 9999.00, 'Order ID: 21', '2025-11-06 03:19:24'),
(182, 3, NULL, 'ORDER_DEDUCT', 100.00, 507.00, 'Order ID: 21', '2025-11-06 03:19:24'),
(183, 1, NULL, 'ORDER_DEDUCT', 100.00, 9379.00, 'Order ID: 22', '2025-11-06 03:19:25'),
(184, 2, NULL, 'ORDER_DEDUCT', 1.00, 9998.00, 'Order ID: 22', '2025-11-06 03:19:25'),
(185, 3, NULL, 'ORDER_DEDUCT', 50.00, 457.00, 'Order ID: 22', '2025-11-06 03:19:25'),
(186, 1, NULL, 'ORDER_DEDUCT', 100.00, 9279.00, 'Order ID: 24', '2025-11-06 03:19:26'),
(187, 2, NULL, 'ORDER_DEDUCT', 1.00, 9997.00, 'Order ID: 24', '2025-11-06 03:19:26'),
(188, 3, NULL, 'ORDER_DEDUCT', 50.00, 407.00, 'Order ID: 24', '2025-11-06 03:19:26'),
(189, 1, NULL, 'ORDER_DEDUCT', 100.00, 9179.00, 'Order ID: 27', '2025-11-06 03:19:27'),
(190, 2, NULL, 'ORDER_DEDUCT', 1.00, 9996.00, 'Order ID: 27', '2025-11-06 03:19:27'),
(191, 3, NULL, 'ORDER_DEDUCT', 50.00, 357.00, 'Order ID: 27', '2025-11-06 03:19:27'),
(192, 10, NULL, 'ORDER_DEDUCT', 5.00, 64.00, 'Order ID: 28', '2025-11-06 03:19:27'),
(193, 4, NULL, 'ORDER_DEDUCT', 3.00, 982.00, 'Order ID: 28', '2025-11-06 03:19:27'),
(194, 1, NULL, 'ORDER_DEDUCT', 150.00, 9029.00, 'Order ID: 31', '2025-11-06 03:19:28'),
(195, 10, NULL, 'ORDER_DEDUCT', 5.00, 59.00, 'Order ID: 32', '2025-11-06 03:19:28'),
(196, 4, NULL, 'ORDER_DEDUCT', 3.00, 979.00, 'Order ID: 32', '2025-11-06 03:19:28'),
(197, 1, NULL, 'ORDER_DEDUCT', 150.00, 8779.00, 'Order ID: 34', '2025-11-06 03:19:29'),
(198, 1, NULL, 'ORDER_DEDUCT', 100.00, 8779.00, 'Order ID: 34', '2025-11-06 03:19:29'),
(199, 2, NULL, 'ORDER_DEDUCT', 1.00, 9995.00, 'Order ID: 34', '2025-11-06 03:19:29'),
(200, 3, NULL, 'ORDER_DEDUCT', 50.00, 307.00, 'Order ID: 34', '2025-11-06 03:19:29'),
(201, 1, NULL, 'ORDER_DEDUCT', 200.00, 8579.00, 'Order ID: 53', '2025-11-06 03:19:55'),
(202, 2, NULL, 'ORDER_DEDUCT', 2.00, 9993.00, 'Order ID: 53', '2025-11-06 03:19:55'),
(203, 3, NULL, 'ORDER_DEDUCT', 100.00, 207.00, 'Order ID: 53', '2025-11-06 03:19:55'),
(204, 10, NULL, 'ORDER_DEDUCT', 5.00, 54.00, 'Order ID: 53', '2025-11-06 03:19:55'),
(205, 4, NULL, 'ORDER_DEDUCT', 3.00, 976.00, 'Order ID: 53', '2025-11-06 03:19:55'),
(206, 1, NULL, 'ORDER_DEDUCT', 100.00, 8479.00, 'Order ID: 54', '2025-11-06 03:20:04'),
(207, 2, NULL, 'ORDER_DEDUCT', 1.00, 9992.00, 'Order ID: 54', '2025-11-06 03:20:04'),
(208, 3, NULL, 'ORDER_DEDUCT', 50.00, 157.00, 'Order ID: 54', '2025-11-06 03:20:04'),
(209, 10, NULL, 'ORDER_DEDUCT', 5.00, 49.00, 'Order ID: 54', '2025-11-06 03:20:04'),
(210, 4, NULL, 'ORDER_DEDUCT', 3.00, 973.00, 'Order ID: 54', '2025-11-06 03:20:04'),
(211, 10, NULL, 'ORDER_DEDUCT', 5.00, 44.00, 'Order ID: 55', '2025-11-06 03:20:16'),
(212, 4, NULL, 'ORDER_DEDUCT', 3.00, 970.00, 'Order ID: 55', '2025-11-06 03:20:16'),
(213, 1, NULL, 'ORDER_DEDUCT', 200.00, 8279.00, 'Order ID: 55', '2025-11-06 03:20:16'),
(214, 2, NULL, 'ORDER_DEDUCT', 2.00, 9990.00, 'Order ID: 55', '2025-11-06 03:20:16'),
(215, 3, NULL, 'ORDER_DEDUCT', 100.00, 57.00, 'Order ID: 55', '2025-11-06 03:20:16'),
(216, 3, 6, 'RESTOCK', 10000.00, 10057.00, NULL, '2025-11-06 03:20:44'),
(217, 10, NULL, 'ORDER_DEDUCT', 5.00, 39.00, 'Order ID: 56', '2025-11-06 03:20:57'),
(218, 4, NULL, 'ORDER_DEDUCT', 3.00, 967.00, 'Order ID: 56', '2025-11-06 03:20:57'),
(219, 1, NULL, 'ORDER_DEDUCT', 100.00, 8179.00, 'Order ID: 56', '2025-11-06 03:20:57'),
(220, 2, NULL, 'ORDER_DEDUCT', 1.00, 9989.00, 'Order ID: 56', '2025-11-06 03:20:57'),
(221, 3, NULL, 'ORDER_DEDUCT', 50.00, 10007.00, 'Order ID: 56', '2025-11-06 03:20:57'),
(222, 1, NULL, 'ORDER_DEDUCT', 200.00, 7979.00, 'Order ID: 53', '2025-11-06 03:21:49'),
(223, 2, NULL, 'ORDER_DEDUCT', 2.00, 9987.00, 'Order ID: 53', '2025-11-06 03:21:49'),
(224, 3, NULL, 'ORDER_DEDUCT', 100.00, 9907.00, 'Order ID: 53', '2025-11-06 03:21:49'),
(225, 10, NULL, 'ORDER_DEDUCT', 5.00, 34.00, 'Order ID: 53', '2025-11-06 03:21:49'),
(226, 4, NULL, 'ORDER_DEDUCT', 3.00, 964.00, 'Order ID: 53', '2025-11-06 03:21:49'),
(227, 1, NULL, 'ORDER_DEDUCT', 100.00, 7879.00, 'Order ID: 54', '2025-11-06 03:21:50'),
(228, 2, NULL, 'ORDER_DEDUCT', 1.00, 9986.00, 'Order ID: 54', '2025-11-06 03:21:50'),
(229, 3, NULL, 'ORDER_DEDUCT', 50.00, 9857.00, 'Order ID: 54', '2025-11-06 03:21:50'),
(230, 10, NULL, 'ORDER_DEDUCT', 5.00, 29.00, 'Order ID: 54', '2025-11-06 03:21:50'),
(231, 4, NULL, 'ORDER_DEDUCT', 3.00, 961.00, 'Order ID: 54', '2025-11-06 03:21:50'),
(232, 10, NULL, 'ORDER_DEDUCT', 5.00, 24.00, 'Order ID: 55', '2025-11-06 03:21:50'),
(233, 4, NULL, 'ORDER_DEDUCT', 3.00, 958.00, 'Order ID: 55', '2025-11-06 03:21:50'),
(234, 1, NULL, 'ORDER_DEDUCT', 200.00, 7679.00, 'Order ID: 55', '2025-11-06 03:21:50'),
(235, 2, NULL, 'ORDER_DEDUCT', 2.00, 9984.00, 'Order ID: 55', '2025-11-06 03:21:50'),
(236, 3, NULL, 'ORDER_DEDUCT', 100.00, 9757.00, 'Order ID: 55', '2025-11-06 03:21:50'),
(237, 10, NULL, 'ORDER_DEDUCT', 5.00, 19.00, 'Order ID: 56', '2025-11-06 03:21:51'),
(238, 4, NULL, 'ORDER_DEDUCT', 3.00, 955.00, 'Order ID: 56', '2025-11-06 03:21:51'),
(239, 1, NULL, 'ORDER_DEDUCT', 100.00, 7579.00, 'Order ID: 56', '2025-11-06 03:21:51'),
(240, 2, NULL, 'ORDER_DEDUCT', 1.00, 9983.00, 'Order ID: 56', '2025-11-06 03:21:51'),
(241, 3, NULL, 'ORDER_DEDUCT', 50.00, 9707.00, 'Order ID: 56', '2025-11-06 03:21:51'),
(242, 11, 6, 'INITIAL', 1000.00, 1000.00, 'Ingredient created', '2025-11-06 15:48:41'),
(243, 10, 5, 'ADJUST_SUBTRACT', 11.00, 8.00, NULL, '2025-11-07 07:00:29'),
(244, 7, 5, 'ADJUST_SUBTRACT', 21.00, 9.00, NULL, '2025-11-07 07:00:44'),
(245, 6, 5, 'ADJUST_SUBTRACT', 101.00, 9.00, NULL, '2025-11-07 07:01:21'),
(246, 10, 6, 'RESTOCK', 100.00, 108.00, 'New Delivery', '2025-11-08 03:17:12'),
(247, 1, NULL, 'ORDER_DEDUCT', 23.00, 7556.00, 'Order ID: 62', '2025-11-08 03:26:53'),
(248, 2, NULL, 'ORDER_DEDUCT', 1.00, 9982.00, 'Order ID: 61', '2025-11-08 03:38:34'),
(249, 7, NULL, 'ORDER_DEDUCT', 1.00, 8.00, 'Order ID: 61', '2025-11-08 03:38:34'),
(250, 1, NULL, 'ORDER_DEDUCT', 23.00, 7533.00, 'Order ID: 61', '2025-11-08 03:38:34'),
(251, 10, 6, 'ADJUST_SUBTRACT', 100.00, 8.00, NULL, '2025-11-08 03:42:24'),
(252, 10, 6, 'RESTOCK', 100.00, 108.00, NULL, '2025-11-08 03:44:17'),
(253, 10, 6, 'ADJUST_SUBTRACT', 100.00, 8.00, NULL, '2025-11-08 03:45:21'),
(254, 10, 6, 'RESTOCK', 100.00, 108.00, NULL, '2025-11-08 08:16:12'),
(255, 9, NULL, 'ORDER_DEDUCT', 1.00, 10008.00, 'Order ID: 92', '2025-11-08 14:10:19'),
(256, 10, NULL, 'ORDER_DEDUCT', 1.00, 107.00, 'Order ID: 92', '2025-11-08 14:10:19'),
(257, 6, NULL, 'ORDER_DEDUCT', 1.00, 8.00, 'Order ID: 92', '2025-11-08 14:10:19'),
(258, 7, NULL, 'ORDER_DEDUCT', 1.00, 7.00, 'Order ID: 92', '2025-11-08 14:10:19'),
(259, 4, NULL, 'ORDER_DEDUCT', 1.00, 954.00, 'Order ID: 92', '2025-11-08 14:10:19'),
(260, 2, NULL, 'ORDER_DEDUCT', 1.00, 9981.00, 'Order ID: 93', '2025-11-08 14:36:11'),
(261, 7, NULL, 'ORDER_DEDUCT', 1.00, 6.00, 'Order ID: 93', '2025-11-08 14:36:11'),
(262, 1, NULL, 'ORDER_DEDUCT', 23.00, 7510.00, 'Order ID: 93', '2025-11-08 14:36:11');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_promo` tinyint(1) NOT NULL DEFAULT 0,
  `promo_discount_percentage` int(11) DEFAULT NULL,
  `promo_expiry_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `item_name`, `category_id`, `price`, `image_url`, `description`, `is_promo`, `promo_discount_percentage`, `promo_expiry_date`) VALUES
(1, 'Beef Steak', 2, 789.00, '/uploads\\image-1761969784106.jpg', 'Juicy Steak in the house!', 1, 10, '2025-11-09'),
(2, 'Cheese Burger', 1, 220.00, '/uploads\\image-1761996893473.jpg', 'A slice of cheese melted on top of the ground meat patty', 0, NULL, NULL),
(4, 'Bruschetta Trio', 1, 350.00, '/uploads\\image-1762442483719.jpeg', 'Toasted bread with tomato basil, mushroom, and tapenade.', 0, NULL, NULL),
(5, 'Classic Caesar Salad', 1, 380.00, '/uploads\\image-1762442760130.jpg', 'Romaine lettuce, parmesan, croutons, Caesar dressing', 0, NULL, NULL),
(6, 'Crispy Calamari', 1, 380.00, '/uploads\\image-1762443670734.jpeg', 'Lightly breaded squid rings with marinara sauce', 0, NULL, NULL),
(7, 'Buffalo Wings', 1, 360.00, '/uploads\\image-1762443753401.jpeg', '8 pieces of spicy chicken wings with blue cheese dip', 0, NULL, NULL),
(8, 'Spring Rolls', 1, 320.00, '/uploads\\image-1762443810407.jpeg', '6 pieces vegetable spring rolls with sweet chili sauce', 0, NULL, NULL),
(9, 'Mango shake', 4, 180.00, '/uploads\\image-1762444176596.jpg', 'Refreshing mango juice', 0, NULL, NULL),
(10, 'Lemon juice', 4, 180.00, '/uploads\\image-1762444258424.jpg', 'Refreshing lemon juice', 0, NULL, NULL),
(11, 'Watermelon Juice', 4, 170.00, '/uploads\\image-1762444340048.jpg', 'Fresh watermelon juice with mint', 0, NULL, NULL),
(12, 'Bubble Tea', 4, 195.00, '/uploads\\image-1762444399414.jpg', 'Milk tea with tapioca pearls', 0, NULL, NULL),
(13, 'Cappuccino', 4, 185.00, '/uploads\\image-1762444462113.jpeg', 'Espresso with steamed milk and foam', 0, NULL, NULL),
(14, 'Hot chocolate', 4, 190.00, '/uploads\\image-1762444509441.jpeg', 'Rich chocolate drink topped with marshmallows', 0, NULL, NULL),
(15, 'Chocolate Milkshake', 4, 196.00, '/uploads\\image-1762444576990.jpeg', 'Thick chocolate milkshake with whipped cream', 0, NULL, NULL),
(16, 'Grilled Salmon Steak', 2, 723.00, '/uploads\\image-1762444668183.jpeg', 'Fresh Atlantic salmon with herb butter and seasonal vegetables', 0, NULL, NULL),
(17, 'Wagyu Beef Burger', 2, 550.00, '/uploads\\image-1762444730701.jpg', 'Premium wagyu patty with caramelized onions and truffle aioli', 0, NULL, NULL),
(18, 'Pork Cordon Bleu', 2, 620.00, '/uploads\\image-1762444932219.jpg', 'Breaded Pork stuffed with ham and cheese', 0, NULL, NULL),
(19, 'Truffle Pasta', 2, 345.00, '/uploads\\image-1762445028588.jpg', 'Homemade pasta with black truffle and wild mushrooms', 0, NULL, NULL),
(20, 'Seafood Paella', 2, 749.00, '/uploads\\image-1762445105671.jpg', 'panish rice with assorted seafood and saffron', 0, NULL, NULL),
(21, 'Mango Cheesecake', 3, 280.00, '/uploads\\image-1762445289118.jpg', 'Creamy cheesecake with fresh mango compote', 0, NULL, NULL),
(22, 'Chocolate Lava Cake', 3, 180.00, '/uploads\\image-1762445355610.png', 'Warm chocolate cake with molten center and vanilla ice cream', 0, NULL, NULL),
(23, 'Tiramisu', 3, 130.00, '/uploads\\image-1762445416324.jpeg', 'Italian coffee-flavored dessert with mascarpone', 0, NULL, NULL),
(24, 'French Macarons', 3, 380.00, '/uploads\\image-1762445489084.jpg', 'Assorted flavors of delicate French macarons (6 pieces)', 0, NULL, NULL),
(25, 'Lemon Tart', 3, 285.00, '/uploads\\image-1762445537036.jpeg', 'Tangy lemon curd in a buttery pastry shell', 0, NULL, NULL),
(26, 'Chicken nuggets', 5, 247.00, '/uploads\\image-1762445654119.jpeg', 'Golden crispy chicken nuggets with fries', 0, NULL, NULL),
(27, 'French Fries', 5, 138.00, '/uploads\\image-1762445717744.jpg', 'Crispy golden french fries', 0, NULL, NULL),
(28, 'Mini Sliders', 5, 236.00, '/uploads\\image-1762445774757.jpeg', 'Three mini beef sliders with cheese', 0, NULL, NULL),
(29, 'Fluffy Pancakes', 5, 125.00, '/uploads\\image-1762445850625.jpeg', 'Three fluffy pancakes with syrup and butter', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `menu_item_ingredients`
--

CREATE TABLE `menu_item_ingredients` (
  `recipe_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity_consumed` decimal(10,2) NOT NULL COMMENT 'Amount of ingredient used per 1 menu item'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_item_ingredients`
--

INSERT INTO `menu_item_ingredients` (`recipe_id`, `menu_item_id`, `ingredient_id`, `quantity_consumed`) VALUES
(2, 2, 1, 100.00),
(3, 2, 2, 1.00),
(4, 2, 3, 50.00),
(10, 4, 2, 1.00),
(11, 4, 7, 1.00),
(12, 4, 1, 23.00),
(13, 5, 9, 1.00),
(14, 5, 10, 1.00),
(15, 5, 6, 1.00),
(16, 5, 7, 1.00),
(17, 5, 4, 1.00),
(20, 6, 8, 4.00),
(21, 7, 4, 8.00),
(22, 7, 3, 4.00),
(23, 8, 6, 6.00),
(24, 8, 7, 6.00),
(25, 9, 11, 2.00),
(26, 10, 11, 2.00),
(27, 11, 11, 2.00),
(28, 12, 11, 2.00),
(29, 13, 11, 2.00),
(30, 14, 11, 2.00),
(31, 15, 11, 1.00),
(32, 16, 8, 6.00),
(33, 17, 1, 3.00),
(34, 17, 2, 2.00),
(35, 18, 5, 6.00),
(36, 18, 3, 4.00),
(37, 19, 1, 3.00),
(38, 19, 10, 4.00),
(39, 19, 9, 2.00),
(40, 20, 8, 5.00),
(41, 20, 10, 4.00),
(42, 20, 9, 2.00),
(43, 20, 6, 4.00),
(44, 21, 11, 4.00),
(45, 21, 2, 2.00),
(46, 22, 2, 4.00),
(47, 23, 2, 2.00),
(48, 24, 2, 6.00),
(49, 25, 11, 3.00),
(50, 25, 3, 3.00),
(51, 25, 2, 2.00),
(52, 26, 4, 5.00),
(53, 26, 7, 5.00),
(54, 27, 2, 6.00),
(55, 28, 5, 4.00),
(56, 28, 2, 4.00),
(57, 28, 7, 5.00),
(58, 29, 2, 7.00),
(63, 1, 1, 33.00);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `customer_id`, `order_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(4, 5, 62, 'Order On Its Way!', 'Your order #62 is on its way for delivery!', 1, '2025-11-08 03:27:18'),
(7, 5, 61, 'Order On Its Way!', 'Your order #61 is on its way for delivery!', 1, '2025-11-08 03:38:34'),
(8, 5, 63, 'Order Placed!', 'Your order #63 is now pending.', 1, '2025-11-08 03:40:21'),
(10, 5, 64, 'Order Cancelled', 'Your order #64 has been cancelled.', 1, '2025-11-08 08:17:25'),
(11, 5, 65, 'Order Placed!', 'Your order #65 is now pending.', 1, '2025-11-08 10:59:57'),
(12, 5, 66, 'Order Placed!', 'Your order #66 is now pending.', 1, '2025-11-08 11:54:58'),
(13, 5, 67, 'Order Placed!', 'Your order #67 is now pending.', 1, '2025-11-08 12:05:50'),
(14, 5, 68, 'Order Placed!', 'Your order #68 is now pending.', 1, '2025-11-08 12:08:05'),
(15, 5, 69, 'Order Placed!', 'Your order #69 is now pending.', 1, '2025-11-08 12:14:01'),
(16, 5, 70, 'Order Placed!', 'Your order #70 is now pending.', 1, '2025-11-08 12:17:31'),
(17, 5, 71, 'Order Placed!', 'Your order #71 is now pending.', 1, '2025-11-08 12:22:55'),
(18, 5, 72, 'Order Placed!', 'Your order #72 is now pending.', 1, '2025-11-08 12:24:19'),
(19, 5, 73, 'Order Placed!', 'Your order #73 is now pending.', 1, '2025-11-08 12:33:57'),
(20, 5, 74, 'Order Placed!', 'Your order #74 is now pending.', 1, '2025-11-08 12:36:53'),
(21, 5, 75, 'Order Placed!', 'Your order #75 is now pending.', 1, '2025-11-08 12:39:15'),
(22, 5, 76, 'Order Placed!', 'Your order #76 is now pending.', 1, '2025-11-08 12:41:26'),
(23, 5, 77, 'Order Placed!', 'Your order #77 is now pending.', 1, '2025-11-08 12:50:07'),
(24, 5, 78, 'Order Placed!', 'Your order #78 is now pending.', 1, '2025-11-08 13:14:43'),
(25, 5, 79, 'Order Placed!', 'Your order #79 is now pending.', 0, '2025-11-08 13:20:05'),
(26, 5, 80, 'Order Placed!', 'Your order #80 is now pending.', 0, '2025-11-08 13:28:06'),
(27, 5, 81, 'Order Placed!', 'Your order #81 is now pending.', 0, '2025-11-08 13:30:16'),
(28, 5, 82, 'Order Placed!', 'Your order #82 is now pending.', 0, '2025-11-08 13:31:23'),
(29, 5, 83, 'Order Placed!', 'Your order #83 is now pending.', 0, '2025-11-08 13:32:00'),
(30, 5, 84, 'Order Placed!', 'Your order #84 is now pending.', 0, '2025-11-08 13:38:42'),
(31, 5, 85, 'Order Placed!', 'Your order #85 is now pending.', 0, '2025-11-08 13:41:03'),
(32, 5, 86, 'Order Placed!', 'Your order #86 is now pending.', 0, '2025-11-08 13:41:44'),
(33, 5, 87, 'Order Placed!', 'Your order #87 is now pending.', 0, '2025-11-08 13:42:59'),
(34, 5, 88, 'Order Placed!', 'Your order #88 is now pending.', 0, '2025-11-08 13:44:05'),
(35, 5, 89, 'Order Placed!', 'Your order #89 is now pending.', 0, '2025-11-08 13:59:35'),
(36, 5, 90, 'Order Placed!', 'Your order #90 is now pending.', 0, '2025-11-08 14:02:32'),
(37, 5, 91, 'Order Placed!', 'Your order #91 is now pending.', 0, '2025-11-08 14:03:21'),
(41, 5, 92, 'Order On Its Way!', 'Your order #92 is on its way for delivery!', 0, '2025-11-08 14:10:19'),
(45, 5, 93, 'Order On Its Way!', 'Your order #93 is on its way for delivery!', 0, '2025-11-08 14:36:12'),
(46, 5, 94, 'Order Placed!', 'Your order #94 is now pending.', 0, '2025-11-08 14:40:01'),
(47, 5, 95, 'Order Placed!', 'Your order #95 is now pending.', 0, '2025-11-08 14:43:57'),
(48, 5, 96, 'Order Placed!', 'Your order #96 is now pending.', 0, '2025-11-08 14:46:05'),
(49, 5, 97, 'Order Placed!', 'Your order #97 is now pending.', 0, '2025-11-08 17:31:42'),
(50, 5, 98, 'Order Placed!', 'Your order #98 is now pending.', 0, '2025-11-08 18:03:22');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `items_total` decimal(10,2) DEFAULT 0.00,
  `service_charge_amount` decimal(10,2) DEFAULT 0.00,
  `vat_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','preparing','ready','served','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `order_type` varchar(50) DEFAULT 'Dine-in',
  `delivery_location` varchar(100) DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `staff_id`, `items_total`, `service_charge_amount`, `vat_amount`, `status`, `total_amount`, `order_type`, `delivery_location`, `order_date`) VALUES
(1, 2, NULL, 0.00, 0.00, 0.00, 'served', 1218.78, 'Dine-in', '1', '2025-11-01 04:13:09'),
(2, 2, NULL, 0.00, 0.00, 0.00, 'served', 2437.56, 'Dine-in', '2', '2025-11-01 04:18:34'),
(3, 2, NULL, 0.00, 0.00, 0.00, 'served', 3656.34, 'Dine-in', '3', '2025-11-01 04:30:23'),
(4, 3, NULL, 0.00, 0.00, 0.00, 'served', 4875.12, 'Room Service', '101', '2025-11-01 05:43:18'),
(5, 3, NULL, 0.00, 0.00, 0.00, 'served', NULL, 'Room Service', '102', '2025-11-01 10:50:39'),
(6, 3, NULL, 0.00, 0.00, 0.00, 'served', NULL, 'Room Service', '102', '2025-11-01 10:51:09'),
(7, 3, NULL, 1998.00, 199.80, 263.74, 'served', 2461.54, 'Room Service', '102', '2025-11-01 10:55:17'),
(8, 4, NULL, 2997.00, 299.70, 395.60, 'served', 3692.30, 'Room Service', '103', '2025-11-01 11:13:50'),
(9, 4, NULL, 440.00, 44.00, 58.08, 'served', 542.08, 'Room Service', '105', '2025-11-01 11:36:41'),
(10, NULL, 4, 1219.00, 121.90, 160.91, 'served', 1501.81, 'Walk-in', 'Counter', '2025-11-01 16:23:38'),
(11, 3, NULL, 3657.00, 365.70, 482.72, '', 4505.42, 'Room Service', '106', '2025-11-01 16:40:37'),
(12, NULL, 6, 660.00, 66.00, 87.12, 'served', 813.12, 'Walk-in', 'Counter', '2025-11-01 17:02:05'),
(13, NULL, 6, 220.00, 22.00, 29.04, 'served', 271.04, 'Walk-in', 'Counter', '2025-11-01 23:54:12'),
(14, 5, 2, 150.00, 15.00, 19.80, 'served', 184.80, 'Dine-in', '5', '2025-11-02 16:31:38'),
(15, 5, NULL, 590.00, 59.00, 77.88, '', 726.88, 'Dine-in', '5', '2025-11-03 00:49:50'),
(16, NULL, 6, 370.00, 37.00, 48.84, 'served', 455.84, 'Walk-in', 'Counter', '2025-11-03 00:59:56'),
(17, 5, NULL, 220.00, 22.00, 29.04, '', 271.04, 'Dine-in', '5', '2025-11-03 01:31:10'),
(18, 5, 6, 1369.00, 136.90, 180.71, 'served', 1686.61, 'Room Service', '101', '2025-11-03 01:58:40'),
(19, NULL, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Walk-in', 'Counter', '2025-11-03 02:08:56'),
(20, 5, 6, 440.00, 44.00, 58.08, 'served', 542.08, 'Dine-in', '1', '2025-11-03 02:11:01'),
(21, NULL, 6, 440.00, 44.00, 58.08, 'served', 542.08, 'Walk-in', 'John', '2025-11-03 02:14:20'),
(22, 5, 6, 220.00, 22.00, 29.04, 'served', 271.04, 'Dine-in', '3', '2025-11-03 02:21:11'),
(23, 5, 6, 1998.00, 199.80, 263.74, 'served', 2461.54, 'Room Service', '101', '2025-11-03 02:32:01'),
(24, 5, 6, 220.00, 22.00, 29.04, 'served', 271.04, 'Dine-in', '5', '2025-11-03 02:53:13'),
(25, 5, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Dine-in', '2', '2025-11-03 03:09:29'),
(26, 5, 6, 370.00, 37.00, 48.84, 'served', 455.84, 'Dine-in', '69', '2025-11-03 03:23:34'),
(27, 5, 6, 220.00, 22.00, 29.04, 'served', 271.04, 'Room Service', '101', '2025-11-03 03:32:31'),
(28, 5, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Dine-in', '3', '2025-11-03 03:36:29'),
(29, NULL, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Walk-in', 'Hezel', '2025-11-03 03:38:48'),
(30, NULL, 6, 999.00, 99.90, 131.87, 'served', 1230.77, 'Walk-in', 'Hezel', '2025-11-03 03:50:05'),
(31, 5, 6, 999.00, 99.90, 131.87, 'served', 1230.77, 'Dine-in', '101', '2025-11-03 03:51:39'),
(32, NULL, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Walk-in', 'Hezel', '2025-11-03 03:57:14'),
(33, 5, 5, 1219.00, 121.90, 160.91, 'served', 1501.81, 'Room Service', '101', '2025-11-05 04:53:21'),
(34, 5, 6, 1219.00, 121.90, 160.91, 'served', 1501.81, 'Dine-in', '5', '2025-11-05 05:10:35'),
(35, NULL, 5, 2218.00, 221.80, 292.78, 'served', 2732.58, 'Walk-in', 'Hezel', '2025-11-05 05:11:22'),
(36, 5, 6, 1219.00, 121.90, 160.91, 'served', 1501.81, 'Dine-in', '5', '2025-11-05 05:41:18'),
(37, 5, NULL, 370.00, 37.00, 48.84, '', 455.84, 'Dine-in', '4', '2025-11-05 06:54:30'),
(38, NULL, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Walk-in', 'John', '2025-11-05 06:58:35'),
(39, NULL, 6, 150.00, 15.00, 19.80, 'served', 184.80, 'Walk-in', 'sample', '2025-11-05 07:01:37'),
(41, 5, NULL, 300.00, 30.00, 39.60, '', 369.60, 'Dine-in', '4', '2025-11-05 07:12:13'),
(42, NULL, 6, 300.00, 30.00, 39.60, '', 369.60, 'Walk-in', 'kurt', '2025-11-05 07:19:31'),
(43, 5, NULL, 150.00, 15.00, 19.80, 'cancelled', 184.80, 'Dine-in', '9', '2025-11-05 07:29:27'),
(44, 5, NULL, 150.00, 15.00, 19.80, 'cancelled', 184.80, 'Dine-in', '9', '2025-11-05 07:31:30'),
(45, 5, 6, 999.00, 99.90, 131.87, 'served', 1230.77, 'Room Service', '12', '2025-11-05 18:09:09'),
(46, NULL, 6, 1998.00, 199.80, 263.74, 'served', 2461.54, 'Walk-in', 'Hezel', '2025-11-05 18:17:30'),
(47, 5, NULL, 999.00, 99.90, 131.87, 'cancelled', 1230.77, 'Room Service', '101', '2025-11-06 01:18:24'),
(48, 5, 6, 370.00, 37.00, 48.84, 'served', 455.84, 'Room Service', '101', '2025-11-06 01:56:18'),
(49, NULL, 6, 370.00, 37.00, 48.84, 'served', 455.84, 'Walk-in', 'Hezel', '2025-11-06 02:00:28'),
(50, NULL, 6, 1219.00, 121.90, 160.91, 'cancelled', 1501.81, 'Walk-in', 'Kurt', '2025-11-06 02:21:13'),
(51, 5, 6, 370.00, 37.00, 48.84, 'served', 455.84, 'Dine-in', '6', '2025-11-06 02:30:05'),
(52, 5, 6, 1369.00, 136.90, 180.71, 'served', 1686.61, 'Dine-in', '69', '2025-11-06 03:17:01'),
(53, NULL, 5, 590.00, 59.00, 77.88, 'served', 726.88, 'Walk-in', 'Counter', '2025-11-06 03:19:55'),
(54, NULL, 5, 370.00, 37.00, 48.84, 'served', 455.84, 'Walk-in', 'Counter', '2025-11-06 03:20:04'),
(55, NULL, 5, 590.00, 59.00, 77.88, 'served', 726.88, 'Walk-in', 'Counter', '2025-11-06 03:20:16'),
(56, NULL, 5, 370.00, 37.00, 48.84, 'served', 455.84, 'Walk-in', 'Counter', '2025-11-06 03:20:57'),
(57, 5, 6, 1369.00, 136.90, 180.71, 'cancelled', 1686.61, 'Room Service', '69', '2025-11-06 04:00:23'),
(58, 5, NULL, 2311.00, 231.10, 305.05, 'pending', 2847.15, 'Dine-in', '97', '2025-11-06 16:21:08'),
(59, 5, NULL, 570.00, 57.00, 75.24, 'pending', 702.24, 'Dine-in', '6', '2025-11-07 07:06:19'),
(60, 5, NULL, 740.00, 74.00, 97.68, 'pending', 911.68, 'Dine-in', '69', '2025-11-07 07:09:54'),
(61, 5, 6, 350.00, 35.00, 46.20, 'served', 431.20, 'Room Service', '27', '2025-11-07 07:19:46'),
(62, 5, 6, 280.00, 28.00, 36.96, 'served', 344.96, 'Dine-in', '9', '2025-11-08 03:25:42'),
(63, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Room Dining', '2', '2025-11-08 03:40:21'),
(64, 5, 6, 789.00, 78.90, 104.15, 'cancelled', 972.05, 'Dine-in', '2', '2025-11-08 03:40:35'),
(65, 5, NULL, 789.00, 78.90, 104.15, 'pending', 972.05, 'Dine-in', '1', '2025-11-08 10:59:57'),
(66, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '5', '2025-11-08 11:54:58'),
(67, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '5', '2025-11-08 12:05:50'),
(68, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 12:08:05'),
(69, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '5', '2025-11-08 12:14:01'),
(70, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '6', '2025-11-08 12:17:31'),
(71, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 12:22:55'),
(72, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '5', '2025-11-08 12:24:19'),
(73, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 12:33:57'),
(74, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 12:36:53'),
(75, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '6', '2025-11-08 12:39:15'),
(76, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '6', '2025-11-08 12:41:26'),
(77, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '6', '2025-11-08 12:50:07'),
(78, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 13:14:43'),
(79, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '6', '2025-11-08 13:20:05'),
(80, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 13:28:06'),
(81, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '9', '2025-11-08 13:30:16'),
(82, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '9', '2025-11-08 13:31:23'),
(83, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '2', '2025-11-08 13:32:00'),
(84, 5, NULL, 1009.00, 100.90, 133.19, 'pending', 1243.09, 'Room Dining', '101', '2025-11-08 13:38:42'),
(85, 5, NULL, 730.00, 73.00, 96.36, 'pending', 899.36, 'Dine-in', '65', '2025-11-08 13:41:03'),
(86, 5, NULL, 730.00, 73.00, 96.36, 'pending', 899.36, 'Dine-in', '65', '2025-11-08 13:41:44'),
(87, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '3', '2025-11-08 13:42:59'),
(88, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '23', '2025-11-08 13:44:05'),
(89, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '2', '2025-11-08 13:59:35'),
(90, 5, NULL, 380.00, 38.00, 50.16, 'pending', 468.16, 'Dine-in', '23', '2025-11-08 14:02:32'),
(91, 5, NULL, 380.00, 38.00, 50.16, 'pending', 468.16, 'Dine-in', '23', '2025-11-08 14:03:21'),
(92, 5, 6, 380.00, 38.00, 50.16, 'served', 468.16, 'Dine-in', '23', '2025-11-08 14:08:25'),
(93, 5, 6, 350.00, 35.00, 46.20, 'served', 431.20, 'Dine-in', '3', '2025-11-08 14:33:24'),
(94, 5, NULL, 360.00, 36.00, 47.52, 'pending', 443.52, 'Dine-in', '23', '2025-11-08 14:40:01'),
(95, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '23', '2025-11-08 14:43:57'),
(96, 5, NULL, 350.00, 35.00, 46.20, 'pending', 431.20, 'Dine-in', '23', '2025-11-08 14:46:05'),
(97, 5, NULL, 220.00, 22.00, 29.04, 'pending', 271.04, 'Dine-in', '6', '2025-11-08 17:31:42'),
(98, 5, NULL, 1009.00, 100.90, 133.19, 'pending', 1243.09, 'Dine-in', '6', '2025-11-08 18:03:22');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `order_detail_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `instructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`order_detail_id`, `order_id`, `item_id`, `quantity`, `subtotal`, `instructions`) VALUES
(1, 1, 1, 1, 999.00, ''),
(2, 2, 1, 2, 1998.00, ''),
(3, 3, 1, 3, 2997.00, ''),
(4, 4, 1, 4, 3996.00, ''),
(5, 5, 1, 2, 1998.00, ''),
(6, 6, 1, 2, 1998.00, ''),
(7, 7, 1, 2, 1998.00, ''),
(8, 8, 1, 3, 2997.00, ''),
(9, 9, 2, 2, 440.00, ''),
(10, 10, 1, 1, 999.00, ''),
(11, 10, 2, 1, 220.00, ''),
(12, 11, 1, 3, 2997.00, ''),
(13, 11, 2, 3, 660.00, ''),
(14, 12, 2, 3, 660.00, ''),
(15, 13, 2, 1, 220.00, ''),
(17, 15, 2, 2, 440.00, ''),
(20, 16, 2, 1, 220.00, ''),
(21, 17, 2, 1, 220.00, ''),
(22, 18, 1, 1, 999.00, 'extra garlic plsss'),
(23, 18, 2, 1, 220.00, 'extra garlic plsss'),
(26, 20, 2, 2, 440.00, ''),
(27, 21, 2, 2, 440.00, ''),
(28, 22, 2, 1, 220.00, 'xample'),
(29, 23, 1, 2, 1998.00, ''),
(30, 24, 2, 1, 220.00, 'alsd;ajwpodjaskjdwalkdnlaskw'),
(33, 26, 2, 1, 220.00, ''),
(34, 27, 2, 1, 220.00, 'xample'),
(37, 30, 1, 1, 999.00, 'do not overcooked'),
(38, 31, 1, 1, 999.00, ''),
(40, 33, 1, 1, 999.00, ''),
(41, 33, 2, 1, 220.00, ''),
(42, 34, 1, 1, 999.00, ''),
(43, 34, 2, 1, 220.00, ''),
(44, 35, 1, 2, 1998.00, ''),
(45, 35, 2, 1, 220.00, ''),
(46, 36, 1, 1, 999.00, ''),
(47, 36, 2, 1, 220.00, ''),
(48, 37, 2, 1, 220.00, ''),
(57, 45, 1, 1, 999.00, ''),
(58, 46, 1, 2, 1998.00, ''),
(59, 47, 1, 1, 999.00, ''),
(60, 48, 2, 1, 220.00, 'hi.example'),
(62, 49, 2, 1, 220.00, ''),
(64, 50, 1, 1, 999.00, ''),
(65, 50, 2, 1, 220.00, ''),
(66, 51, 2, 1, 220.00, ''),
(68, 52, 1, 1, 999.00, ''),
(69, 52, 2, 1, 220.00, ''),
(71, 53, 2, 2, 440.00, ''),
(73, 54, 2, 1, 220.00, ''),
(76, 55, 2, 2, 440.00, ''),
(78, 56, 2, 1, 220.00, ''),
(79, 57, 1, 1, 999.00, ''),
(80, 57, 2, 1, 220.00, ''),
(82, 58, 2, 1, 220.00, ''),
(83, 58, 17, 1, 550.00, ''),
(84, 58, 7, 1, 360.00, ''),
(85, 58, 16, 1, 723.00, ''),
(86, 58, 23, 1, 130.00, ''),
(87, 58, 14, 1, 190.00, ''),
(88, 58, 27, 1, 138.00, ''),
(89, 59, 2, 1, 220.00, ''),
(90, 59, 4, 1, 350.00, ''),
(91, 60, 7, 1, 360.00, ''),
(92, 60, 6, 1, 380.00, ''),
(93, 61, 4, 1, 350.00, ''),
(95, 63, 2, 1, 220.00, ''),
(96, 64, 1, 1, 789.00, ''),
(97, 65, 1, 1, 789.00, ''),
(98, 66, 2, 1, 220.00, ''),
(99, 67, 2, 1, 220.00, ''),
(100, 68, 2, 1, 220.00, ''),
(101, 69, 2, 1, 220.00, ''),
(102, 70, 4, 1, 350.00, ''),
(103, 71, 2, 1, 220.00, ''),
(104, 72, 2, 1, 220.00, ''),
(105, 73, 2, 1, 220.00, ''),
(106, 74, 2, 1, 220.00, ''),
(107, 75, 4, 1, 350.00, ''),
(108, 76, 4, 1, 350.00, ''),
(109, 77, 4, 1, 350.00, ''),
(110, 78, 2, 1, 220.00, ''),
(111, 79, 4, 1, 350.00, ''),
(112, 80, 2, 1, 220.00, ''),
(113, 81, 2, 1, 220.00, ''),
(114, 82, 2, 1, 220.00, ''),
(115, 83, 2, 1, 220.00, ''),
(116, 84, 2, 1, 220.00, ''),
(117, 84, 1, 1, 789.00, ''),
(118, 85, 4, 1, 350.00, ''),
(119, 85, 5, 1, 380.00, ''),
(120, 86, 4, 1, 350.00, ''),
(121, 86, 5, 1, 380.00, ''),
(122, 87, 4, 1, 350.00, ''),
(123, 88, 2, 1, 220.00, ''),
(124, 89, 2, 1, 220.00, ''),
(125, 90, 5, 1, 380.00, ''),
(126, 91, 5, 1, 380.00, ''),
(127, 92, 5, 1, 380.00, ''),
(128, 93, 4, 1, 350.00, ''),
(129, 94, 7, 1, 360.00, ''),
(130, 95, 4, 1, 350.00, ''),
(131, 96, 4, 1, 350.00, ''),
(132, 97, 2, 1, 220.00, ''),
(133, 98, 1, 1, 789.00, ''),
(134, 98, 2, 1, 220.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `change_amount` decimal(10,2) DEFAULT 0.00,
  `payment_status` varchar(50) DEFAULT 'paid',
  `paymongo_payment_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `order_id`, `payment_method`, `amount`, `payment_date`, `change_amount`, `payment_status`, `paymongo_payment_id`) VALUES
(1, 1, 'GCash', 1218.78, '2025-11-01 04:13:09', 0.00, 'pending', NULL),
(2, 2, 'Debit Card', 2437.56, '2025-11-01 04:18:34', 0.00, 'pending', NULL),
(3, 3, 'GCash', 3656.34, '2025-11-01 04:30:24', 0.00, 'pending', NULL),
(4, 4, 'GCash', 4875.12, '2025-11-01 05:43:18', 0.00, 'pending', NULL),
(5, 7, 'GCash', 2461.54, '2025-11-01 10:55:18', 0.00, 'pending', NULL),
(6, 8, 'GCash', 3692.30, '2025-11-01 11:13:50', 0.00, 'pending', NULL),
(7, 9, 'GCash', 542.08, '2025-11-01 11:36:42', 0.00, 'pending', NULL),
(8, 10, 'Cash', 1501.81, '2025-11-01 16:23:38', 0.00, 'paid', NULL),
(9, 11, 'GCash', 4505.42, '2025-11-01 16:40:38', 0.00, 'pending', NULL),
(10, 12, 'Cash', 1000.00, '2025-11-01 17:02:05', 186.88, 'paid', NULL),
(11, 13, 'Cash', 500.00, '2025-11-01 23:54:12', 228.96, 'paid', NULL),
(12, 14, 'GCash', 184.80, '2025-11-02 16:31:38', 0.00, 'pending', NULL),
(13, 15, 'Credit Card', 726.88, '2025-11-03 00:49:50', 0.00, 'pending', NULL),
(14, 16, 'Cash', 500.00, '2025-11-03 00:59:57', 44.16, 'paid', NULL),
(15, 17, 'GCash', 271.04, '2025-11-03 01:31:10', 0.00, 'pending', NULL),
(16, 18, 'GCash', 1686.61, '2025-11-03 01:58:40', 0.00, 'pending', NULL),
(17, 19, 'Cash', 200.00, '2025-11-03 02:08:56', 15.20, 'paid', NULL),
(18, 20, 'GCash', 542.08, '2025-11-03 02:11:01', 0.00, 'pending', NULL),
(19, 21, 'Cash', 600.00, '2025-11-03 02:14:20', 57.92, 'paid', NULL),
(20, 22, 'GCash', 271.04, '2025-11-03 02:21:13', 0.00, 'pending', NULL),
(21, 23, 'GCash', 2461.54, '2025-11-03 02:32:01', 0.00, 'pending', NULL),
(22, 24, 'GCash', 271.04, '2025-11-03 02:53:13', 0.00, 'pending', NULL),
(23, 25, 'GCash', 184.80, '2025-11-03 03:09:30', 0.00, 'pending', NULL),
(24, 26, 'GCash', 455.84, '2025-11-03 03:23:34', 0.00, 'pending', NULL),
(25, 27, 'GCash', 271.04, '2025-11-03 03:32:31', 0.00, 'pending', NULL),
(26, 28, 'GCash', 184.80, '2025-11-03 03:36:29', 0.00, 'pending', NULL),
(27, 29, 'Cash', 200.00, '2025-11-03 03:38:48', 15.20, 'paid', NULL),
(28, 30, 'Cash', 1300.00, '2025-11-03 03:50:05', 69.23, 'paid', NULL),
(29, 31, 'GCash', 1230.77, '2025-11-03 03:51:39', 0.00, 'pending', NULL),
(30, 32, 'Cash', 200.00, '2025-11-03 03:57:14', 15.20, 'paid', NULL),
(31, 33, 'GCash', 1501.81, '2025-11-05 04:53:21', 0.00, 'pending', NULL),
(32, 35, 'Cash', 3000.00, '2025-11-05 05:11:22', 267.42, 'paid', NULL),
(33, 36, 'GCash', 1501.81, '2025-11-05 05:41:27', 0.00, 'pending', NULL),
(34, 37, 'Online', 455.84, '2025-11-05 06:54:30', 0.00, 'pending', NULL),
(35, 38, 'Cash', 200.00, '2025-11-05 06:58:35', 15.20, 'paid', NULL),
(36, 39, 'Cash', 184.80, '2025-11-05 07:01:37', NULL, 'paid', NULL),
(37, 41, 'Online', 369.60, '2025-11-05 07:12:13', 0.00, 'pending', NULL),
(38, 42, 'Cash', 400.00, '2025-11-05 07:19:31', 30.40, 'paid', NULL),
(39, 43, 'GCash', 184.80, '2025-11-05 07:29:28', 0.00, 'pending', NULL),
(40, 45, 'GCash', 1230.77, '2025-11-05 18:09:09', 0.00, 'pending', NULL),
(41, 46, 'Cash', 2461.54, '2025-11-05 18:17:30', 0.00, 'paid', NULL),
(42, 47, 'GCash', 1230.77, '2025-11-06 01:18:24', 0.00, 'pending', NULL),
(43, 48, 'GCash', 455.84, '2025-11-06 01:56:19', 0.00, 'pending', NULL),
(44, 49, 'Cash', 500.00, '2025-11-06 02:00:28', 44.16, 'paid', NULL),
(45, 50, 'Cash', 1600.00, '2025-11-06 02:21:13', 98.19, 'paid', NULL),
(46, 51, 'GCash', 455.84, '2025-11-06 02:30:05', 0.00, 'pending', NULL),
(47, 52, 'GCash', 1686.61, '2025-11-06 03:17:01', 0.00, 'pending', NULL),
(48, 53, 'Cash', 800.00, '2025-11-06 03:19:55', 73.12, 'paid', NULL),
(49, 54, 'Cash', 500.00, '2025-11-06 03:20:04', 44.16, 'paid', NULL),
(50, 55, 'Cash', 900.00, '2025-11-06 03:20:16', 173.12, 'paid', NULL),
(51, 56, 'Cash', 500.00, '2025-11-06 03:20:57', 44.16, 'paid', NULL),
(52, 57, 'GCash', 1686.61, '2025-11-06 04:00:24', 0.00, 'pending', NULL),
(53, 58, 'GCash', 2847.15, '2025-11-06 16:21:08', 0.00, 'pending', NULL),
(54, 59, 'Credit Card', 702.24, '2025-11-07 07:06:20', 0.00, 'pending', NULL),
(55, 60, 'Debit Card', 911.68, '2025-11-07 07:09:57', 0.00, 'pending', NULL),
(56, 61, 'GCash', 431.20, '2025-11-07 07:19:59', 0.00, 'pending', NULL),
(57, 62, 'GCash', 344.96, '2025-11-08 03:25:43', 0.00, 'pending', NULL),
(58, 63, 'GCash', 271.04, '2025-11-08 03:40:21', 0.00, 'pending', NULL),
(59, 64, 'GCash', 972.05, '2025-11-08 03:40:35', 0.00, 'pending', NULL),
(60, 65, 'GCash', 972.05, '2025-11-08 10:59:57', 0.00, 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','waiter','cashier') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `shift_schedule` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `email`, `password`, `role`, `created_at`, `shift_schedule`) VALUES
(2, 'Wena', 'Cutie', 'wena123@gmail.com', '$2a$10$Mjh7DnsCAw5vL88cMpGS7ubGbkC.6zuqP2nZEFBJT6IFJI1UgP6Mm', 'admin', '2025-10-28 02:31:40', NULL),
(4, 'Nico', 'Robin', 'robin123@gmail.com', '$2a$10$N/vBRaRs6lpUjSnmb1ekZuZwKmwM8HfpwawSsTJAYgnuAUKye8cTS', 'cashier', '2025-11-01 15:57:00', NULL),
(5, 'vincent', 'torio', 'vincent@example.com', '$2a$10$e0moOTJ0aDFYDea9s27YTu4Uttw9KIX1sa/5N3OF..ukpCRTTjQMi', 'admin', '2025-11-02 16:40:08', NULL),
(6, 'kurt', 'mateo', 'kurt@example.com', '$2a$10$qChqvUv/NIJp3S6X4WbE3.LiCj/hH1ekBTPLPlEHDDKeybqYqhHt2', 'waiter', '2025-11-02 16:53:10', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`ingredient_id`);

--
-- Indexes for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `fk_menu_category` (`category_id`);

--
-- Indexes for table `menu_item_ingredients`
--
ALTER TABLE `menu_item_ingredients`
  ADD PRIMARY KEY (`recipe_id`),
  ADD KEY `menu_item_id` (`menu_item_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_order_id` (`order_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `fk_order_staff` (`staff_id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`order_detail_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `ingredient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=263;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `menu_item_ingredients`
--
ALTER TABLE `menu_item_ingredients`
  MODIFY `recipe_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `fk_log_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_log_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `menu_item_ingredients`
--
ALTER TABLE `menu_item_ingredients`
  ADD CONSTRAINT `fk_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notification_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
