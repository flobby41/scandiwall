const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { connectToMongoDB } = require('../db/mongodb');
const User = require('../db/models/userModel');
const Product = require('../db/models/productModel');
const Order = require('../db/models/orderModel');
const CartItem = require('../db/models/cartItemModel');

// Chemin vers la base de données SQLite
const dbFilePath = path.resolve(process.cwd(), './db/skandiWall.db');

// Connexion à la base de données SQLite
const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connecté à la base de données SQLite.');
});

// Fonction pour récupérer des données depuis SQLite en utilisant des promesses
const getAllFromTable = (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

// Fonction principale pour la migration
const migrateData = async () => {
  try {
    // Connexion à MongoDB
    const mongoConnection = await connectToMongoDB();
    
    // Étape préalable : vider toutes les collections existantes
    console.log('Suppression des collections existantes...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await CartItem.deleteMany({});
    console.log('Collections vidées avec succès.');
    
    // 1. Migrer les utilisateurs
    console.log('Migration des utilisateurs...');
    const users = await getAllFromTable('users');
    const userMap = new Map(); // Pour stocker les correspondances d'ID
    
    for (const user of users) {
      const newUser = new User({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: user.password, // Note: les mots de passe sont déjà hachés dans SQLite
        phone: user.phone,
        address: user.address,
        role: user.role,
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at)
      });
      
      const savedUser = await newUser.save();
      userMap.set(user.id, savedUser._id);
    }
    console.log(`${users.length} utilisateurs migrés avec succès.`);
    
    // 2. Migrer les produits
    console.log('Migration des produits...');
    const products = await getAllFromTable('products');
    const productMap = new Map(); // Pour stocker les correspondances d'ID
    
    for (const product of products) {
      const newProduct = new Product({
        name: product.name,
        description: product.description,
        price: product.price,
        stock_quantity: product.stock_quantity,
        image: product.image,
        category: product.category,
        slugs: product.slugs,
        created_at: new Date(product.created_at)
      });
      
      const savedProduct = await newProduct.save();
      productMap.set(product.id, savedProduct._id);
    }
    console.log(`${products.length} produits migrés avec succès.`);
    
    // 3. Migrer les commandes et leurs éléments
    console.log('Migration des commandes...');
    const orders = await getAllFromTable('orders');
    let ordersCount = 0;
    
    for (const order of orders) {
      // Vérifier si l'utilisateur existe dans la carte
      if (!userMap.has(order.user_id)) {
        console.warn(`Commande ignorée: utilisateur ${order.user_id} non trouvé`);
        continue;
      }
      
      // Récupérer tous les éléments de commande pour cette commande
      const orderItems = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        });
      });
      
      // Convertir les éléments de commande au format MongoDB
      const items = [];
      for (const item of orderItems) {
        if (productMap.has(item.product_id)) {
          items.push({
            product: productMap.get(item.product_id),
            quantity: item.quantity,
            price: item.price
          });
        } else {
          console.warn(`Élément de commande ignoré: produit ${item.product_id} non trouvé`);
        }
      }
      
      if (items.length === 0) {
        console.warn(`Commande ${order.id} ignorée: aucun élément valide`);
        continue;
      }
      
      const newOrder = new Order({
        user: userMap.get(order.user_id),
        items: items,
        total_price: order.total_price,
        status: order.status,
        created_at: new Date(order.created_at),
        updated_at: new Date(order.updated_at)
      });
      
      await newOrder.save();
      ordersCount++;
    }
    console.log(`${ordersCount} commandes migrées avec succès.`);
    
    // 4. Migrer les éléments du panier
    console.log('Migration des éléments du panier...');
    const cartItems = await getAllFromTable('cart_items');
    let cartItemsCount = 0;
    
    for (const item of cartItems) {
      // Vérifier que l'utilisateur et le produit existent
      if (!userMap.has(item.user_id)) {
        console.warn(`Élément de panier ignoré: utilisateur ${item.user_id} non trouvé`);
        continue;
      }
      
      if (!productMap.has(item.product_id)) {
        console.warn(`Élément de panier ignoré: produit ${item.product_id} non trouvé`);
        continue;
      }
      
      const newCartItem = new CartItem({
        product: productMap.get(item.product_id),
        user: userMap.get(item.user_id),
        quantity: item.quantity,
        price: item.price
      });
      
      await newCartItem.save();
      cartItemsCount++;
    }
    console.log(`${cartItemsCount} éléments de panier migrés avec succès.`);
    
    console.log('Migration terminée avec succès!');
    
    // Fermer les connexions
    db.close();
    await mongoConnection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
};

// Exécuter la migration
migrateData(); 