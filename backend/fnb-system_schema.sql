-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 28, 2025 at 01:47 AM
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
(1, 'Ran', 'Ran', 'ranran@example.com', '$2a$10$jgYuAa.n3i3LKGNSn14vjO7q5bczEf6WvlAFI.j0tsw86wIX2hg9u', NULL, '2025-10-17 16:00:25');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(4) NOT NULL DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `item_name`, `category`, `price`, `stock`, `image_url`, `description`) VALUES
(1, 'Steak', 'Main Dish', 999.00, 18, '/uploads\\image-1761356831360.jpg', 'Best steak in the house'),
(2, 'Spaghetti', 'Side Dish', 150.00, 95, '/uploads\\image-1761358879489.jpg', ' A long, thin, solid, cylindrical pasta.'),
(3, 'Cheese Burger', 'Side Dish', 90.00, 64, '/uploads\\image-1761448575569.jpg', 'Chessy burger'),
(4, 'Iced Tea', 'Beverages', 32.00, 62, '/uploads\\image-1761447395391.jpg', 'Refreshing Drink'),
(5, 'Chicken Inasal', 'Main Dish', 110.00, 65, '/uploads\\image-1761571178792.jpg', 'Cripli Enjoyer');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','preparing','ready','served') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `order_type` varchar(50) DEFAULT 'Dine-in',
  `delivery_location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `order_date`, `status`, `total_amount`, `order_type`, `delivery_location`) VALUES
(2, 1, '2025-10-25 02:17:18', '', 2437.56, 'Room Service', '202'),
(3, 1, '2025-10-25 04:53:21', '', 219.60, 'Dine-in', '23'),
(4, 1, '2025-10-26 03:16:30', '', 39.04, 'Dine-in', '23'),
(5, 1, '2025-10-26 05:14:04', '', 109.80, 'Room Service', '101'),
(6, 1, '2025-10-26 06:13:07', '', 78.08, 'Dine-in', '25'),
(7, 1, '2025-10-26 11:47:20', '', 183.00, 'Dine-in', '12'),
(8, 1, '2025-10-26 12:19:52', 'served', 1218.78, 'Dine-in', '1'),
(9, 1, '2025-10-26 12:31:37', 'served', 183.00, 'Dine-in', '2'),
(10, 1, '2025-10-26 12:32:45', 'served', 219.60, 'Dine-in', '3'),
(11, 1, '2025-10-26 12:33:01', 'served', 156.16, 'Dine-in', '7'),
(12, 1, '2025-10-26 12:34:06', 'served', 2437.56, 'Room Service', '101'),
(13, 1, '2025-10-26 13:47:51', 'served', 183.00, 'Room Service', '102'),
(14, 1, '2025-10-26 13:49:35', 'served', 148.84, 'Room Service', '103'),
(15, 1, '2025-10-26 13:52:06', 'served', 1401.78, 'Room Service', '104'),
(16, 1, '2025-10-26 13:52:14', 'served', 148.84, 'Room Service', '202'),
(17, 1, '2025-10-26 13:52:24', 'served', 1550.62, 'Room Service', '303'),
(18, 1, '2025-10-26 13:55:20', 'served', 4875.12, 'Room Service', '606'),
(19, 1, '2025-10-26 14:55:45', 'served', 366.00, 'Room Service', '909'),
(20, 1, '2025-10-27 00:07:18', 'served', 292.80, 'Dine-in', '99'),
(21, 1, '2025-10-27 01:27:34', 'served', 109.80, 'Room Service', '707'),
(22, 1, '2025-10-27 01:45:18', 'served', 2437.56, 'Dine-in', '42'),
(23, 1, '2025-10-27 02:05:20', 'served', 183.00, 'Dine-in', '54'),
(24, 1, '2025-10-27 02:07:06', 'ready', 2769.40, 'Room Service', '505'),
(25, 1, '2025-10-27 02:52:27', 'ready', 183.00, 'Dine-in', '66'),
(26, 1, '2025-10-27 02:58:31', 'preparing', 1550.62, 'Dine-in', '44'),
(27, 1, '2025-10-27 03:04:50', 'pending', 366.00, 'Room Service', '406'),
(28, 1, '2025-10-27 10:24:46', 'pending', 222.04, 'Dine-in', '77'),
(29, 1, '2025-10-27 10:41:39', 'pending', 148.84, 'Dine-in', '75'),
(30, 1, '2025-10-27 10:42:04', 'pending', 109.80, 'Room Service', '808'),
(31, 1, '2025-10-27 10:50:29', 'pending', 109.80, 'Room Service', '808'),
(32, 1, '2025-10-27 10:50:38', 'pending', 109.80, 'Room Service', '808'),
(33, 1, '2025-10-27 10:56:06', 'pending', 109.80, 'Room Service', '808'),
(34, 1, '2025-10-27 11:04:12', 'pending', 109.80, 'Room Service', '808'),
(35, 1, '2025-10-27 11:07:38', 'pending', 134.20, 'Dine-in', '66'),
(36, 1, '2025-10-27 11:07:56', 'pending', 134.20, 'Dine-in', '71'),
(37, 1, '2025-10-27 11:12:23', 'pending', 134.20, 'Dine-in', '71'),
(38, 1, '2025-10-27 11:14:31', 'pending', 134.20, 'Dine-in', '71'),
(39, 1, '2025-10-27 11:42:49', 'pending', 134.20, 'Dine-in', '71'),
(40, 1, '2025-10-27 11:43:08', 'pending', 134.20, 'Room Service', '702'),
(41, 1, '2025-10-27 11:43:35', 'pending', 134.20, 'Room Service', '702'),
(42, 1, '2025-10-27 12:20:08', 'pending', 134.20, 'Room Service', '703'),
(43, 1, '2025-10-27 12:27:35', 'pending', 134.20, 'Room Service', '703'),
(44, 1, '2025-10-27 12:27:38', 'pending', 134.20, 'Room Service', '703'),
(45, 1, '2025-10-27 12:27:39', 'pending', 134.20, 'Room Service', '703'),
(46, 1, '2025-10-27 12:27:59', 'pending', 134.20, 'Dine-in', '27'),
(47, 1, '2025-10-27 12:32:35', 'pending', 134.20, 'Dine-in', '27'),
(48, 1, '2025-10-27 12:34:59', 'pending', 134.20, 'Room Service', '609'),
(49, 1, '2025-10-27 12:39:53', 'pending', 134.20, 'Room Service', '609'),
(50, 1, '2025-10-27 12:44:58', 'pending', 173.24, 'Dine-in', '99'),
(51, 1, '2025-10-27 12:52:43', 'pending', 366.00, 'Dine-in', '24'),
(52, 1, '2025-10-27 12:57:58', 'pending', 500.20, 'Room Service', '309'),
(53, 1, '2025-10-27 13:03:05', 'pending', 1352.98, 'Dine-in', '6'),
(54, 1, '2025-10-27 13:09:45', 'pending', 39.04, 'Room Service', '407'),
(55, 1, '2025-10-27 13:10:53', 'pending', 156.16, 'Room Service', '407'),
(56, 1, '2025-10-27 13:30:30', 'pending', 366.00, 'Dine-in', '85'),
(57, 1, '2025-10-27 13:43:51', 'pending', 39.04, 'Dine-in', '46'),
(58, 1, '2025-10-27 13:44:21', 'pending', 244.00, 'Room Service', '505'),
(59, 1, '2025-10-27 13:49:37', 'pending', 292.80, 'Room Service', '803'),
(60, 1, '2025-10-27 13:55:16', 'pending', 78.08, 'Dine-in', '65'),
(61, 1, '2025-10-27 13:55:41', 'pending', 405.04, 'Dine-in', '64');

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
(1, 2, 1, 2, 1998.00, 'Add Salt'),
(2, 3, 3, 2, 180.00, 'No cheese'),
(3, 4, 4, 1, 32.00, ''),
(4, 5, 3, 1, 90.00, ''),
(5, 6, 4, 2, 64.00, ''),
(6, 7, 2, 1, 150.00, ''),
(7, 8, 1, 1, 999.00, ''),
(8, 9, 2, 1, 150.00, ''),
(9, 10, 3, 2, 180.00, ''),
(10, 11, 4, 4, 128.00, ''),
(11, 12, 1, 2, 1998.00, ''),
(12, 13, 2, 1, 150.00, ''),
(13, 14, 3, 1, 90.00, ''),
(14, 14, 4, 1, 32.00, ''),
(15, 15, 1, 1, 999.00, ''),
(16, 15, 2, 1, 150.00, ''),
(17, 16, 4, 1, 32.00, ''),
(18, 16, 3, 1, 90.00, ''),
(19, 17, 3, 1, 90.00, ''),
(20, 17, 4, 1, 32.00, ''),
(21, 17, 2, 1, 150.00, ''),
(22, 17, 1, 1, 999.00, ''),
(23, 18, 1, 4, 3996.00, ''),
(24, 19, 2, 2, 300.00, ''),
(25, 20, 2, 1, 150.00, ''),
(26, 20, 3, 1, 90.00, ''),
(27, 21, 3, 1, 90.00, ''),
(28, 22, 1, 2, 1998.00, ''),
(29, 23, 2, 1, 150.00, ''),
(30, 24, 1, 2, 1998.00, ''),
(31, 24, 2, 1, 150.00, ''),
(32, 24, 3, 1, 90.00, ''),
(33, 24, 4, 1, 32.00, ''),
(34, 25, 2, 1, 150.00, ''),
(35, 26, 1, 1, 999.00, ''),
(36, 26, 2, 1, 150.00, ''),
(37, 26, 3, 1, 90.00, ''),
(38, 26, 4, 1, 32.00, ''),
(39, 27, 2, 2, 300.00, ''),
(40, 28, 2, 1, 150.00, ''),
(41, 28, 4, 1, 32.00, ''),
(42, 29, 3, 1, 90.00, ''),
(43, 29, 4, 1, 32.00, ''),
(44, 30, 3, 1, 90.00, ''),
(45, 31, 3, 1, 90.00, ''),
(46, 32, 3, 1, 90.00, ''),
(47, 33, 3, 1, 90.00, ''),
(48, 34, 3, 1, 90.00, ''),
(49, 35, 5, 1, 110.00, ''),
(50, 36, 5, 1, 110.00, ''),
(51, 37, 5, 1, 110.00, ''),
(52, 38, 5, 1, 110.00, ''),
(53, 39, 5, 1, 110.00, ''),
(54, 40, 5, 1, 110.00, ''),
(55, 41, 5, 1, 110.00, ''),
(56, 42, 5, 1, 110.00, ''),
(57, 43, 5, 1, 110.00, ''),
(58, 44, 5, 1, 110.00, ''),
(59, 45, 5, 1, 110.00, ''),
(60, 46, 5, 1, 110.00, ''),
(61, 47, 5, 1, 110.00, ''),
(62, 48, 5, 1, 110.00, ''),
(63, 49, 5, 1, 110.00, ''),
(64, 50, 4, 1, 32.00, ''),
(65, 50, 5, 1, 110.00, ''),
(66, 51, 2, 2, 300.00, ''),
(67, 52, 2, 2, 300.00, ''),
(68, 52, 5, 1, 110.00, ''),
(69, 53, 1, 1, 999.00, ''),
(70, 53, 5, 1, 110.00, ''),
(71, 54, 4, 1, 32.00, ''),
(72, 55, 4, 4, 128.00, ''),
(73, 56, 2, 2, 300.00, ''),
(74, 57, 4, 1, 32.00, ''),
(75, 58, 3, 1, 90.00, ''),
(76, 58, 5, 1, 110.00, ''),
(77, 59, 3, 1, 90.00, ''),
(78, 59, 2, 1, 150.00, ''),
(79, 60, 4, 2, 64.00, ''),
(80, 61, 2, 2, 300.00, ''),
(81, 61, 4, 1, 32.00, '');

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
(2, 56, 'Simulated', 366.00, '2025-10-27 13:30:30', 0.00, 'paid'),
(3, 57, 'Simulated', 39.04, '2025-10-27 13:43:51', 0.00, 'paid'),
(4, 58, 'Simulated', 244.00, '2025-10-27 13:44:21', 0.00, 'paid'),
(5, 59, 'Simulated', 292.80, '2025-10-27 13:49:37', 0.00, 'paid'),
(6, 60, 'Simulated', 78.08, '2025-10-27 13:55:16', 0.00, 'paid'),
(7, 61, 'Simulated', 405.04, '2025-10-27 13:55:41', 0.00, 'paid');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','waiter','cashier') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `shift_schedule` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `full_name`, `email`, `password`, `role`, `created_at`, `shift_schedule`) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$kcAC71tgf405jw89RdxBxOPHyYtBjFv8k4mmgzWZaXuFEfOqZivoa', 'admin', '2025-10-18 01:59:03', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`);

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
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
