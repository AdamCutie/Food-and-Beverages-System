-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2025 at 11:14 AM
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
(4, 'Roronoa', 'Zoro', 'roronoa123@gmail.com', '$2a$10$wrCcNC5UVfeT6IUfrHjvQOjU.2.RDZg2.a9ILwyBeA2OCa57AAcLG', NULL, '2025-11-01 11:13:24');

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `ingredient_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `stock_level` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_of_measurement` varchar(50) NOT NULL COMMENT 'e.g., g, ml, pcs',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`ingredient_id`, `name`, `stock_level`, `unit_of_measurement`, `created_at`) VALUES
(1, 'Beef', 1300.00, 'g', '2025-11-01 03:45:10'),
(2, 'Bread', 90.00, 'pcs', '2025-11-01 11:32:01'),
(3, 'Cheese', 500.00, 'g', '2025-11-01 11:32:52'),
(4, 'Chicken', 3000.00, 'g', '2025-11-02 00:00:53'),
(5, 'Pork', 2000.00, 'g', '2025-11-02 00:12:38'),
(6, 'Potato', 110.00, 'pcs', '2025-11-02 00:19:30'),
(7, 'Tomato', 30.00, 'pcs', '2025-11-02 00:20:53'),
(8, 'Fish', 2000.00, 'g', '2025-11-02 00:24:58'),
(9, 'Lettuce', 20.00, 'pcs', '2025-11-02 00:29:37'),
(10, 'Onion', 20.00, 'pcs', '2025-11-02 00:34:54');

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
(1, 1, 3, 'INITIAL', 5000.00, 5000.00, 'Ingredient created', '2025-11-01 03:45:10'),
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
(23, 1, 3, 'RESTOCK', 3000.00, 3050.00, 'New Delivery', '2025-11-01 16:37:49'),
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
(43, 10, 3, 'INITIAL', 20.00, 20.00, 'Ingredient created', '2025-11-02 00:34:54'),
(44, 7, 2, 'WASTE', -20.00, 30.00, 'Rotten', '2025-11-02 00:51:06');

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
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `item_name`, `category_id`, `price`, `image_url`, `description`) VALUES
(1, 'Steak', 2, 999.00, '/uploads\\image-1761969784106.jpg', 'Juicy Steak in the house!'),
(2, 'Cheese Burger', 1, 220.00, '/uploads\\image-1761996893473.jpg', 'A slice of cheese melted on top of the ground meat patty');

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
(1, 1, 1, 150.00),
(2, 2, 1, 100.00),
(3, 2, 2, 1.00),
(4, 2, 3, 50.00);

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
  `status` enum('pending','preparing','ready','served') DEFAULT 'pending',
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
(6, 3, 3, 0.00, 0.00, 0.00, 'served', NULL, 'Room Service', '102', '2025-11-01 10:51:09'),
(7, 3, 3, 1998.00, 199.80, 263.74, 'served', 2461.54, 'Room Service', '102', '2025-11-01 10:55:17'),
(8, 4, NULL, 2997.00, 299.70, 395.60, 'served', 3692.30, 'Room Service', '103', '2025-11-01 11:13:50'),
(9, 4, NULL, 440.00, 44.00, 58.08, 'served', 542.08, 'Room Service', '105', '2025-11-01 11:36:41'),
(10, NULL, 4, 1219.00, 121.90, 160.91, 'served', 1501.81, 'Walk-in', 'Counter', '2025-11-01 16:23:38'),
(11, 3, 3, 3657.00, 365.70, 482.72, 'preparing', 4505.42, 'Room Service', '106', '2025-11-01 16:40:37'),
(12, NULL, 3, 660.00, 66.00, 87.12, 'preparing', 813.12, 'Walk-in', 'Counter', '2025-11-01 17:02:05'),
(13, NULL, 2, 220.00, 22.00, 29.04, 'pending', 271.04, 'Walk-in', 'Counter', '2025-11-01 23:54:12');

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
(15, 13, 2, 1, 220.00, '');

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
  `payment_status` varchar(50) DEFAULT 'paid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `order_id`, `payment_method`, `amount`, `payment_date`, `change_amount`, `payment_status`) VALUES
(1, 1, 'GCash', 1218.78, '2025-11-01 04:13:09', 0.00, 'pending'),
(2, 2, 'Debit Card', 2437.56, '2025-11-01 04:18:34', 0.00, 'pending'),
(3, 3, 'GCash', 3656.34, '2025-11-01 04:30:24', 0.00, 'pending'),
(4, 4, 'GCash', 4875.12, '2025-11-01 05:43:18', 0.00, 'pending'),
(5, 7, 'GCash', 2461.54, '2025-11-01 10:55:18', 0.00, 'pending'),
(6, 8, 'GCash', 3692.30, '2025-11-01 11:13:50', 0.00, 'pending'),
(7, 9, 'GCash', 542.08, '2025-11-01 11:36:42', 0.00, 'pending'),
(8, 10, 'Cash', 1501.81, '2025-11-01 16:23:38', 0.00, 'paid'),
(9, 11, 'GCash', 4505.42, '2025-11-01 16:40:38', 0.00, 'pending'),
(10, 12, 'Cash', 1000.00, '2025-11-01 17:02:05', 186.88, 'paid'),
(11, 13, 'Cash', 500.00, '2025-11-01 23:54:12', 228.96, 'paid');

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
(3, 'Kurt', 'Pogi', 'kurt123@gmail.com', '$2a$10$rTQfQULtauR5qdRHI9GgN.3v53RbbhglDfjRdO0N9VWs6L0sJZKe6', 'waiter', '2025-10-31 02:04:00', NULL),
(4, 'Nico', 'Robin', 'robin123@gmail.com', '$2a$10$N/vBRaRs6lpUjSnmb1ekZuZwKmwM8HfpwawSsTJAYgnuAUKye8cTS', 'cashier', '2025-11-01 15:57:00', NULL);

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
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `ingredient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `menu_item_ingredients`
--
ALTER TABLE `menu_item_ingredients`
  MODIFY `recipe_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  ADD CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;
COMMIT;

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

ALTER TABLE `ingredients`
ADD COLUMN `reorder_point` DECIMAL(10, 2) NOT NULL DEFAULT 10.00 AFTER `unit_of_measurement`;

ALTER TABLE `payments`
  ADD COLUMN `paymongo_payment_id` VARCHAR(255) NULL DEFAULT NULL AFTER `payment_status`;