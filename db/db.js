const path = require('path'); // Hanterar fil- och katalogvägar
const config = require('./config'); // Importer la configuration
const { connectToMongoDB, mongoose } = require('./mongodb'); // Importer la connexion MongoDB
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const CartItem = require('./models/cartItemModel');

// Chargement conditionnel de SQLite
let sqlite3 = null;
if (!config.useMongoDb) {
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (error) {
    console.warn('SQLite3 non disponible. Seul MongoDB sera utilisé.');
  }
}

// Chemin vers la base de données SQLite
const dbFilePath = path.resolve(process.cwd(), './db/skandiWall.db');

// Classe qui fournit une interface unifiée pour accéder aux données
class Database {
  constructor() {
    this.useMongo = config.useMongoDb;
    
    if (this.useMongo) {
      // Connecter à MongoDB
      connectToMongoDB()
        .then(() => {
          console.log('Base de données MongoDB initialisée');
        })
        .catch(err => {
          console.error('Erreur lors de l\'initialisation de MongoDB:', err);
          process.exit(1);
        });
    } else {
      // Vérifier si SQLite est disponible
      if (!sqlite3) {
        console.error('SQLite3 est requis mais n\'est pas disponible. Configuration incorrecte.');
        process.exit(1);
      }
      
      // Connecter à SQLite
      this.sqlite = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
          console.error('Erreur lors de la connexion à SQLite:', err.message);
          process.exit(1);
        } else {
          console.log('Base de données SQLite initialisée');
        }
      });
    }
  }
  
  // Méthodes génériques pour récupérer des données
  
  // Utilisateurs
  async getUser(id) {
    if (this.useMongo) {
      return await User.findById(id);
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }
  
  async getUserByEmail(email) {
    if (this.useMongo) {
      return await User.findOne({ email });
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }
  
  async createUser(userData) {
    if (this.useMongo) {
      const user = new User(userData);
      return await user.save();
    } else {
      const { first_name, last_name, email, password, phone, address, role } = userData;
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          `INSERT INTO users (first_name, last_name, email, password, phone, address, role) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [first_name, last_name, email, password, phone, address, role || 'customer'],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, ...userData });
          }
        );
      });
    }
  }
  
  async updateUser(id, userData) {
    if (this.useMongo) {
      return await User.findByIdAndUpdate(id, userData, { new: true });
    } else {
      const fields = Object.keys(userData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(userData);
      
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...values, id],
          function(err) {
            if (err) reject(err);
            else resolve({ id, ...userData });
          }
        );
      });
    }
  }
  
  // Produits
  async getAllProducts() {
    if (this.useMongo) {
      return await Product.find();
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all('SELECT * FROM products', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }
  
  async getProduct(id) {
    if (this.useMongo) {
      return await Product.findById(id);
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }
  
  async getProductBySlug(slug) {
    if (this.useMongo) {
      return await Product.findOne({ slugs: slug });
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get('SELECT * FROM products WHERE slugs = ?', [slug], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }
  
  async getProductsByCategory(category) {
    if (this.useMongo) {
      return await Product.find({ category });
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all('SELECT * FROM products WHERE category = ?', [category], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }
  
  async createProduct(productData) {
    if (this.useMongo) {
      const product = new Product(productData);
      return await product.save();
    } else {
      const { name, description, price, stock_quantity, image, category, slugs } = productData;
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          `INSERT INTO products (name, description, price, stock_quantity, image, category, slugs) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, description, price, stock_quantity, image, category, slugs],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, ...productData });
          }
        );
      });
    }
  }
  
  async updateProduct(id, productData) {
    if (this.useMongo) {
      return await Product.findByIdAndUpdate(id, productData, { new: true });
    } else {
      const fields = Object.keys(productData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(productData);
      
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          `UPDATE products SET ${fields} WHERE id = ?`,
          [...values, id],
          function(err) {
            if (err) reject(err);
            else resolve({ id, ...productData });
          }
        );
      });
    }
  }
  
  async deleteProduct(id) {
    if (this.useMongo) {
      return await Product.findByIdAndDelete(id);
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          `DELETE FROM products WHERE id = ?`,
          [id],
          function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
          }
        );
      });
    }
  }
  
  // Panier
  async getCartItems(userId) {
    if (this.useMongo) {
      try {
        // Convertir en ObjectId si c'est une chaîne
        const userObjectId = typeof userId === 'string' && userId.length === 24 
          ? new mongoose.Types.ObjectId(userId) 
          : userId;
          
        // Récupérer les éléments du panier de cet utilisateur
        const items = await CartItem.find({ user: userObjectId })
          .populate({
            path: 'product',
            select: 'name image price'
          });
        
        // Transformer les données pour correspondre au format attendu par le frontend
        return items.map(item => {
          return {
            cart_id: item._id,
            quantity: item.quantity,
            product_id: item.product && item.product._id ? item.product._id : item.product,
            price: item.price,
            user_id: userId,
            name: item.product ? item.product.name : 'Produit inconnu',
            image: item.product ? item.product.image : ''
          };
        });
      } catch (err) {
        console.error(`Erreur lors de la récupération des éléments du panier pour l'utilisateur ${userId}:`, err);
        return [];
      }
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all(
          `SELECT ci.*, p.name, p.price as product_price, p.image, p.slugs
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           WHERE ci.user_id = ?`,
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }
  }
  
  async getAllCartItems() {
    if (this.useMongo) {
      try {
        // Récupérer tous les éléments du panier et peupler les références aux produits et utilisateurs
        const items = await CartItem.find()
          .populate({
            path: 'product',
            select: 'name image price'
          })
          .populate({
            path: 'user',
            select: 'first_name last_name'
          });
        
        return items;
      } catch (err) {
        console.error('Erreur lors de la récupération de tous les éléments du panier:', err);
        return [];
      }
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all(
          `SELECT 
            cart_items.id AS cart_id,
            cart_items.quantity,
            cart_items.product_id,
            cart_items.price,
            cart_items.user_id,
            products.name,
            products.image
          FROM 
            cart_items
          INNER JOIN 
            products
          ON 
            cart_items.product_id = products.id`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }
  }
  
  async getCartItem(id) {
    if (this.useMongo) {
      const item = await CartItem.findById(id).populate('product');
      
      if (!item) return null;
      
      // Formater pour correspondre au format attendu
      return {
        cart_id: item._id,
        quantity: item.quantity,
        product_id: item.product._id || item.product,
        price: item.price,
        user_id: item.user,
        name: item.product ? item.product.name : 'Produit inconnu',
        image: item.product ? item.product.image : ''
      };
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get(
          `SELECT 
            ci.id AS cart_id,
            ci.quantity,
            ci.product_id,
            ci.price,
            ci.user_id,
            p.name,
            p.image
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           WHERE ci.id = ?`,
          [id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }
  }
  
  async addToCart(userId, productId, quantity, price) {
    console.log(`Ajout au panier - userId: ${userId}, productId: ${productId}, quantity: ${quantity}, price: ${price}`);
    
    if (!productId) {
      console.error('productId est requis pour ajouter un produit au panier');
      throw new Error('productId est requis pour ajouter un produit au panier');
    }
    
    if (this.useMongo) {
      try {
        // Définir un ObjectId par défaut pour les utilisateurs invités
        const defaultUserId = '000000000000000000000001'; // Un ID MongoDB valide pour les invités
        
        // Utiliser l'ID par défaut si userId est non défini, égal à 1, ou non valide
        const finalUserId = !userId || userId === 1 ? defaultUserId : userId;
        
        // Convertir en ObjectId si c'est une chaîne
        const userObjectId = typeof finalUserId === 'string' && finalUserId.length === 24 
          ? new mongoose.Types.ObjectId(finalUserId) 
          : finalUserId;
          
        const productObjectId = typeof productId === 'string' && productId.length === 24 
          ? new mongoose.Types.ObjectId(productId) 
          : productId;
        
        // Vérifier si l'élément existe déjà
        const existingItem = await CartItem.findOne({ 
          user: userObjectId, 
          product: productObjectId 
        });
        
        if (existingItem) {
          // Mettre à jour la quantité
          console.log(`Élément existant trouvé, mise à jour de la quantité: ${existingItem.quantity} + ${quantity}`);
          existingItem.quantity += quantity;
          const result = await existingItem.save();
          return result;
        } else {
          // Créer un nouvel élément
          console.log(`Création d'un nouvel élément de panier`);
          const cartItem = new CartItem({
            user: userObjectId,
            product: productObjectId,
            quantity,
            price
          });
          const result = await cartItem.save();
          return result;
        }
      } catch (err) {
        console.error(`Erreur lors de l'ajout au panier:`, err);
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        // Utiliser un ID par défaut pour les utilisateurs non connectés
        const finalUserId = userId || 1;
        
        // Vérifier le productId
        if (!productId) {
          console.error('productId est requis pour ajouter un produit au panier');
          return reject(new Error('productId est requis pour ajouter un produit au panier'));
        }
        
        // Vérifier si l'élément existe déjà
        this.sqlite.get(
          'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
          [finalUserId, productId],
          (err, row) => {
            if (err) {
              reject(err);
            } else if (row) {
              // Mettre à jour la quantité
              this.sqlite.run(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, row.id],
                function(err) {
                  if (err) reject(err);
                  else resolve({ ...row, quantity: row.quantity + quantity });
                }
              );
            } else {
              // Insérer un nouvel élément
              this.sqlite.run(
                'INSERT INTO cart_items (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [finalUserId, productId, quantity, price],
                function(err) {
                  if (err) reject(err);
                  else resolve({ id: this.lastID, user_id: finalUserId, product_id: productId, quantity, price });
                }
              );
            }
          }
        );
      });
    }
  }
  
  async removeFromCart(cartItemId) {
    console.log(`Suppression de l'élément du panier: ${cartItemId}`);
    
    if (this.useMongo) {
      try {
        const result = await CartItem.findByIdAndDelete(cartItemId);
        console.log('Résultat de la suppression:', result);
        return { deleted: result !== null };
      } catch (err) {
        console.error(`Erreur lors de la suppression de l'élément du panier ${cartItemId}:`, err);
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          'DELETE FROM cart_items WHERE id = ?',
          [cartItemId],
          function(err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0 });
          }
        );
      });
    }
  }
  
  async updateCartItemQuantity(cartItemId, quantity) {
    console.log(`Mise à jour de la quantité de l'élément du panier: ${cartItemId} => ${quantity}`);
    
    if (this.useMongo) {
      try {
        const result = await CartItem.findByIdAndUpdate(
          cartItemId, 
          { quantity }, 
          { new: true }
        );
        console.log('Résultat de la mise à jour:', result);
        return { updated: result !== null };
      } catch (err) {
        console.error(`Erreur lors de la mise à jour de l'élément du panier ${cartItemId}:`, err);
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [quantity, cartItemId],
          function(err) {
            if (err) reject(err);
            else resolve({ updated: this.changes > 0 });
          }
        );
      });
    }
  }
  
  async clearCart(userId) {
    if (this.useMongo) {
      return await CartItem.deleteMany({ user: userId });
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.run(
          'DELETE FROM cart_items WHERE user_id = ?',
          [userId],
          function(err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes });
          }
        );
      });
    }
  }
  
  // Commandes
  async getOrders(userId) {
    if (this.useMongo) {
      return await Order.find({ user: userId }).populate('items.product');
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all(
          'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
          (err, orders) => {
            if (err) {
              reject(err);
            } else {
              // Pour chaque commande, récupérer ses éléments
              const promises = orders.map(order => {
                return new Promise((resolve, reject) => {
                  this.sqlite.all(
                    `SELECT oi.*, p.name, p.image, p.slugs
                     FROM order_items oi
                     JOIN products p ON oi.product_id = p.id
                     WHERE oi.order_id = ?`,
                    [order.id],
                    (err, items) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({
                          ...order,
                          items
                        });
                      }
                    }
                  );
                });
              });
              
              Promise.all(promises)
                .then(results => resolve(results))
                .catch(err => reject(err));
            }
          }
        );
      });
    }
  }
  
  async getAllOrders() {
    if (this.useMongo) {
      return await Order.find().populate('user').populate('items.product');
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.all(
          'SELECT * FROM orders ORDER BY created_at DESC',
          [],
          (err, orders) => {
            if (err) {
              reject(err);
            } else {
              resolve(orders);
            }
          }
        );
      });
    }
  }
  
  async getOrder(id) {
    if (this.useMongo) {
      return await Order.findById(id).populate('user').populate('items.product');
    } else {
      return new Promise((resolve, reject) => {
        this.sqlite.get(
          'SELECT * FROM orders WHERE id = ?',
          [id],
          (err, order) => {
            if (err) {
              reject(err);
            } else if (!order) {
              resolve(null);
            } else {
              // Récupérer les éléments de la commande
              this.sqlite.all(
                `SELECT oi.*, p.name, p.image, p.slugs
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [id],
                (err, items) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({
                      ...order,
                      items
                    });
                  }
                }
              );
            }
          }
        );
      });
    }
  }
  
  async createOrder(orderData) {
    if (this.useMongo) {
      const order = new Order(orderData);
      return await order.save();
    } else {
      const { user_id, total_price, status, items } = orderData;
      
      return new Promise((resolve, reject) => {
        // Transaction pour garantir que tout est inséré ou rien
        this.sqlite.run('BEGIN TRANSACTION', err => {
          if (err) {
            reject(err);
            return;
          }
          
          this.sqlite.run(
            'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
            [user_id, total_price, status || 'pending'],
            function(err) {
              if (err) {
                this.sqlite.run('ROLLBACK');
                reject(err);
                return;
              }
              
              const orderId = this.lastID;
              const itemPromises = items.map(item => {
                return new Promise((resolve, reject) => {
                  this.sqlite.run(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price],
                    err => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });
              
              Promise.all(itemPromises)
                .then(() => {
                  this.sqlite.run('COMMIT', err => {
                    if (err) {
                      this.sqlite.run('ROLLBACK');
                      reject(err);
                    } else {
                      resolve({
                        id: orderId,
                        user_id,
                        total_price,
                        status: status || 'pending',
                        items
                      });
                    }
                  });
                })
                .catch(err => {
                  this.sqlite.run('ROLLBACK');
                  reject(err);
                });
            }
          );
        });
      });
    }
  }
  
  // Méthode générique pour exécuter des requêtes SQL brutes (utilisé pour les requêtes complexes ou spécifiques en mode SQLite)
  async query(sql, params = []) {
    if (this.useMongo) {
      throw new Error('La méthode query() n\'est disponible qu\'en mode SQLite');
    }
    
    return new Promise((resolve, reject) => {
      this.sqlite.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // Méthode pour fermer la connexion à la base de données
  async close() {
    if (!this.useMongo && this.sqlite) {
      return new Promise((resolve, reject) => {
        this.sqlite.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

// Créer et exporter une instance unique de la base de données
const db = new Database();
module.exports = db;