# Local Borga Database Schema (Draft 1.0)

This document outlines the core tables and relationships for the application, based on the three-part service model (Retail, Production, User).

## A. Core Tables

### 1. Users (Identity & Roles)

| Field | Data Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `username` | VARCHAR(50) | Unique login identifier |
| `email` | VARCHAR(100) | Unique, for communication |
| `role` | ENUM | `customer`, `admin`, `milling_staff` |
| `address` | TEXT | Delivery/Shipping location |

### 2. Products (Retail Stock)

| Field | Data Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR(100) | e.g., 'Gari (Fine)', 'Red Oil' |
| `category` | VARCHAR(50) | e.g., 'Produce', 'Oil', 'Milled Goods' |
| `retail_price` | DECIMAL(10, 2) | Price per unit (e.g., GHS per KG) |
| `stock_quantity` | INTEGER | Current stock count |

### 3. Orders (Purchase History)

| Field | Data Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key to `Users` table |
| `order_date` | TIMESTAMP | When the order was placed |
| `status` | ENUM | `pending`, `processing`, `shipped`, `delivered` |
| `total_amount` | DECIMAL(10, 2) | Final cost of the order |

## B. Production Tables (The Unique Service)

### 4. ProductionQueue (Custom Milling Requests)

| Field | Data Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Customer requesting the service |
| `raw_material` | VARCHAR(100) | e.g., 'Cassava', 'Maize' |
| `output_product` | VARCHAR(100) | e.g., 'Gari', 'Flour' |
| `desired_quantity_kg` | DECIMAL(10, 2) | Target output weight |
| `is_completed` | BOOLEAN | Tracking production status |