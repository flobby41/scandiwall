const express = require('express');
const router = express.Router();
const path = require('path')
const db = require('../../db/db');
const { checkAuthenticated } = require('../../middleware/auth'); // Assurez-vous d'avoir un middleware d'authentification

//user
router.get('/orders', (req, res) => {
  res.render('orders', { userId: req.user?._id || req.user?.id || null });
});

// Route dynamique pour /orders/confirmation
router.get('/orders/confirmation', (req, res) => {
  const orderId = req.query.orderId; // Récupère orderId depuis la chaîne de requête
  if (!orderId) {
      return res.status(400).send('Order ID manquant.'); // Gère le cas où orderId est absent
  }
  res.render('confirmation', { userId: req.user?._id || req.user?.id || null });
});

//json products
router.get('/api/orders', async (req, res) => {
  try {
    // Nous devons ajouter cette méthode à notre interface unifiée
    let orders;
    if (db.useMongo) {
      orders = await db.getAllOrders();
    } else {
      orders = await db.query('SELECT * FROM orders');
    }
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id; // Récupérer l'ID depuis l'URL
  
  try {
    // Nous devons ajouter cette méthode à notre interface unifiée
    let order;
    if (db.useMongo) {
      order = await db.getOrder(orderId);
    } else {
      const results = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      order = results[0];
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Erreur lors de la récupération de la commande :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
});

// Route POST pour confirmer une commande
router.post('/api/orders', async (req, res) => {
  try {
    const user_id = req.session.userId ? req.session.userId : 0; // 0 pour les invités
    const { cartItems, total_price } = req.body;

    if (!cartItems || cartItems.length === 0 || typeof total_price !== 'number') {
      console.error('Erreur : Paramètres manquants ou invalides.');
      return res.status(400).json({ error: 'Paramètres manquants ou invalides.' });
    }

    // Créer une commande en utilisant notre interface unifiée
    const orderData = {
      user_id: user_id,
      total_price: total_price,
      status: 'pending',
      items: cartItems
    };

    const order = await db.createOrder(orderData);
    const orderId = db.useMongo ? order._id : order.id;

    // Vider le panier
    if (user_id === 0) {
      // Pour les invités : vider uniquement le panier en session
      console.log('Panier en session avant suppression (invité) :', req.session.cart);
      req.session.cart = [];
      console.log('Panier en session après suppression (invité) :', req.session.cart);
      console.log('Panier invité vidé avec succès.');
    } else {
      // Pour les utilisateurs connectés : vider le panier en session et dans la base de données
      console.log('Panier en session avant suppression (utilisateur) :', req.session.cart);
      
      // Nous devons ajouter une méthode pour vider le panier de l'utilisateur
      if (db.useMongo) {
        await db.clearCart(user_id);
      } else {
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
      }
      
      req.session.cart = [];
      console.log('Panier en session après suppression (utilisateur) :', req.session.cart);
      console.log(`Panier vidé dans la base de données pour l'utilisateur ${user_id}`);
    }

    res.status(201).json({
      message: 'Commande confirmée avec succès !',
      orderId: orderId,
    });
  } catch (err) {
    console.error('Erreur lors de la création de la commande :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;
