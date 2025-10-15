CREATE DATABASE IF NOT EXISTS `food_beverage_db`;

USE `food_beverage_db`;

-- Create Customers Table
CREATE TABLE `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Staff Table
-- UPDATED: Changed 'username' to 'email' for standardized login
CREATE TABLE `staff` (
  `staff_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'waiter', 'cashier') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Menu Items Table
CREATE TABLE `menu_items` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100),
  `price` DECIMAL(10, 2) NOT NULL,
  `availability` BOOLEAN DEFAULT TRUE
);

-- Create Orders Table
CREATE TABLE `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('placed', 'preparing', 'completed', 'paid', 'cancelled') DEFAULT 'placed',
  `total_amount` DECIMAL(10, 2),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE SET NULL
);

-- Create Order Details Table
CREATE TABLE `order_details` (
  `order_detail_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT,
  `item_id` INT,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `menu_items`(`item_id`)
);

-- Create Payments Table
CREATE TABLE `payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT,
  `payment_method` VARCHAR(50),
  `amount` DECIMAL(10, 2),
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE
);

-- Insert some sample data for initial testing
INSERT INTO `menu_items` (`item_name`, `category`, `price`, `availability`) VALUES
('Cheeseburger', 'Main Course', 250.00, TRUE),
('French Fries', 'Side Dish', 80.00, TRUE),
('Iced Tea', 'Beverage', 60.00, TRUE),
('Carbonara', 'Pasta', 320.00, FALSE);

-- This script safely adds the 'shift_schedule' column to the existing 'staff' table

ALTER TABLE `staff`
ADD COLUMN `shift_schedule` VARCHAR(255) DEFAULT NULL;