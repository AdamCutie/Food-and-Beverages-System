-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 23, 2025 at 05:24 AM
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
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `full_name`, `email`, `password`, `phone`, `created_at`) VALUES
(1, 'Ran Ran', 'ranran@example.com', '$2a$10$jgYuAa.n3i3LKGNSn14vjO7q5bczEf6WvlAFI.j0tsw86wIX2hg9u', NULL, '2025-10-17 16:00:25');

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
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `item_name`, `category`, `price`, `stock`, `image_url`) VALUES
(1, 'Cheeseburger', 'Main Course', 250.00, 94, '/uploads\\image-1761092254134.jpg'),
(2, 'French Fries', 'Side Dish', 80.00, 95, NULL),
(3, 'Iced Tea', 'Beverage', 60.00, 95, NULL),
(4, 'Carbonara', 'Pasta', 320.00, 97, NULL),
(8, 'Steak', 'Main Course', 599.00, 99, NULL),
(15, 'Spaghetti', 'Pasta', 33.00, 33, NULL),
(18, 'Chicken Inasal', 'Main Course', 79.00, 76, '/uploads\\image-1761094940899.jpg'),
(19, 'Tortang talong', 'Side Dish', 32.00, 28, '/uploads\\image-1761092233191.jpg'),
(20, 'Matcha Chicken Lugaw', 'Side Dish', 10.00, 10, '/uploads\\image-1761094775432.png'),
(21, 'Milkfish with Tapioca', 'Side Dish', 14.00, 14, '/uploads\\image-1761094916991.png');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('placed','preparing','completed','paid','cancelled') DEFAULT 'placed',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `order_type` varchar(50) DEFAULT 'Dine-in',
  `delivery_location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `order_date`, `status`, `total_amount`, `order_type`, `delivery_location`) VALUES
(3, 1, '2025-10-17 16:15:24', 'paid', 390.00, 'Dine-in', NULL),
(4, 1, '2025-10-20 01:25:05', 'placed', 380.00, 'Dine-in', NULL),
(5, 1, '2025-10-20 01:26:24', 'placed', 710.00, 'Dine-in', NULL),
(6, 1, '2025-10-22 00:18:42', 'placed', 460.00, 'Dine-in', NULL),
(7, 1, '2025-10-22 00:43:16', 'placed', NULL, 'Dine-in', NULL),
(8, 1, '2025-10-22 02:15:56', 'placed', 361.00, 'Dine-in', NULL),
(9, 1, '2025-10-22 02:16:58', 'placed', 250.00, 'Dine-in', NULL),
(10, 1, '2025-10-22 02:17:52', 'placed', 32.00, 'Dine-in', NULL),
(11, 1, '2025-10-22 02:22:41', 'placed', 250.00, 'Room Service', NULL),
(12, 1, '2025-10-22 03:15:51', 'placed', 330.00, 'Room Service', '22'),
(13, 1, '2025-10-23 01:19:11', 'placed', 361.00, 'Room Service', '202'),
(14, 1, '2025-10-23 01:21:02', 'placed', 140.00, 'Dine-in', '69'),
(15, 1, '2025-10-23 01:49:14', 'placed', 129.87, 'Room Service', '402');

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
(1, 3, 1, 1, 250.00, NULL),
(2, 3, 2, 1, 80.00, NULL),
(3, 3, 3, 1, 60.00, NULL),
(4, 4, 3, 1, 60.00, NULL),
(5, 4, 4, 1, 320.00, NULL),
(6, 5, 1, 1, 250.00, NULL),
(7, 5, 2, 1, 80.00, NULL),
(8, 5, 3, 1, 60.00, NULL),
(9, 5, 4, 1, 320.00, NULL),
(10, 6, 3, 1, 60.00, NULL),
(11, 6, 4, 1, 320.00, NULL),
(12, 6, 2, 1, 80.00, NULL),
(13, 7, 3, 1, 60.00, NULL),
(14, 7, 2, 1, 80.00, NULL),
(15, 7, 15, 2, 66.00, NULL),
(16, 8, 1, 1, 250.00, NULL),
(17, 8, 18, 1, 79.00, NULL),
(18, 8, 19, 1, 32.00, NULL),
(19, 9, 1, 1, 250.00, NULL),
(20, 10, 19, 1, 32.00, NULL),
(21, 11, 1, 1, 250.00, 'withou cheese please'),
(22, 12, 1, 1, 250.00, 'Burger no tomato'),
(23, 12, 2, 1, 80.00, 'Burger no tomato'),
(24, 13, 1, 1, 250.00, ''),
(25, 13, 18, 1, 79.00, ''),
(26, 13, 19, 1, 32.00, ''),
(27, 14, 3, 1, 60.00, ''),
(28, 14, 2, 1, 80.00, ''),
(29, 15, 18, 1, 79.00, ''),
(30, 15, 19, 1, 32.00, '');

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
(1, 3, 'cash', 300.00, '2025-10-18 02:08:21', 50.00, 'paid');

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
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
