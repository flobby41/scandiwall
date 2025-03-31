# Migration from SQLite to MongoDB

This document explains the migration from SQLite database to MongoDB and how to use the new database system.

## Structure

- `db.js`: Main entry point that provides a unified interface to access data
- `mongodb.js`: MongoDB connection configuration
- `config.js`: Configuration allowing to choose between SQLite and MongoDB
- `models/`: Mongoose models for MongoDB
  - `userModel.js`: User model
  - `productModel.js`: Product model
  - `orderModel.js`: Model for orders and their items
  - `cartItemModel.js`: Model for cart items

## Configuration

Configuration is done via the `.env` file at the root of the project:

```
MONGO_URI=mongodb+srv://...
USE_MONGODB=true  # true to use MongoDB, false for SQLite
```

## Scripts

- `scripts/migrate-to-mongodb.js`: Script to migrate data from SQLite to MongoDB
- `scripts/test-db-connection.js`: Script to test database connection

## How to Use

The database interface is designed to be transparent for the application. The same methods work whether you use SQLite or MongoDB. For example:

```javascript
const db = require('./db/db');

// Get all products
const products = await db.getAllProducts();

// Get a user by email
const user = await db.getUserByEmail('user@example.com');

// Create a new product
const newProduct = await db.createProduct({
  name: 'Product name',
  description: 'Product description',
  price: 199,
  stock_quantity: 30,
  image: 'path/to/image.jpg',
  category: 'Category',
  slugs: 'product-name'
});
```

## Data Migration

To migrate data from SQLite to MongoDB, run:

```
node scripts/migrate-to-mongodb.js
```

This script:
1. Deletes all existing MongoDB collections
2. Migrates users
3. Migrates products
4. Migrates orders and their items
5. Migrates cart items

## MongoDB Schema

The MongoDB schema corresponds to the SQLite structure but with some differences:
- IDs are MongoDB ObjectIds
- Relations use references (for example, `user` refers to a `User` document)
- Dates use the native MongoDB format 