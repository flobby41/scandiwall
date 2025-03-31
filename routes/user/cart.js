const express = require('express');
const router = express.Router();
const db = require('../../db/db');


// Route pour afficher le panier de l'utilisateur
router.get('/shoppingCart', (req, res) => {
  res.render('shoppingCart', { userId: req.user?._id || req.user?.id || null});
});

router.get('/api/cart', async (req, res) => {
  try {
    // Nous avons besoin de cette méthode dans notre classe Database
    let cartItems;
    if (db.useMongo) {
      // Version MongoDB (avec populate pour obtenir les détails du produit)
      const items = await db.getAllCartItems();
      
      // Transformer les données pour correspondre au format attendu par le frontend
      cartItems = items.map(item => {
        return {
          cart_id: item._id, // Utiliser _id comme cart_id pour MongoDB
          quantity: item.quantity,
          product_id: item.product && item.product._id ? item.product._id : item.product,
          price: item.price,
          user_id: item.user && item.user._id ? item.user._id : item.user,
          name: item.product ? item.product.name : 'Produit inconnu',
          image: item.product ? item.product.image : ''
        };
      });
    } else {
      // Version SQLite
      cartItems = await db.query(`
        SELECT 
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
          cart_items.product_id = products.id;
      `);
    }
    
    res.json(cartItems);
  } catch (err) {
    console.error('Erreur lors de la récupération des produits :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// GET /admin/cart/:id : Récupère un produit spécifique
router.get('/api/cart/:id', async (req, res) => {
  const cartItemId = req.params.id;
  
  try {
    // Nous avons besoin de cette méthode
    let cartItem;
    if (db.useMongo) {
      cartItem = await db.getCartItem(cartItemId);
    } else {
      const items = await db.query('SELECT * FROM cart_items WHERE id = ?', [cartItemId]);
      cartItem = items[0];
    }
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    
    res.json(cartItem);
  } catch (err) {
    console.error('Erreur lors de la récupération du produit :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Add product to cart
router.post('/api/cart', async (req, res) => {
  try {
    const { product_id, user_id, quantity, price } = req.body;

    console.log('Requête d\'ajout au panier reçue:', {
      product_id,
      user_id,
      quantity,
      price
    });

    // Vérifications des paramètres
    if (!product_id) {
      return res.status(400).json({ error: 'product_id est requis' });
    }

    if (!quantity || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'quantity doit être un nombre valide' });
    }

    if (!price || typeof price !== 'number') {
      return res.status(400).json({ error: 'price doit être un nombre valide' });
    }

    // Use default user_id if not provided
    const defaultUserId = 1; // Replace with a valid ID for testing
    const finalUserId = user_id || defaultUserId;

    // Utiliser notre méthode existante
    const result = await db.addToCart(finalUserId, product_id, quantity, price);
    
    return res.status(200).json({
      message: 'Product successfully added/updated in the cart.',
      result
    });
  } catch (err) {
    console.error('Error adding/updating product in cart:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /admin/cart/:id : Supprime un produit du panier
router.delete('/api/cart/:id', async (req, res) => {
  try {
    const cartItemId = req.params.id;
    
    // Nous avons besoin de cette méthode
    if (db.useMongo) {
      await db.removeFromCart(cartItemId);
    } else {
      await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    }
    
    res.status(200).json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression du produit :", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// PUT /admin/cart/:id : Met à jour la quantité d'un produit
router.put('/api/cart/:id', async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { change } = req.body;

    if (change === undefined || typeof change !== 'number') {
      return res.status(400).json({ error: 'Invalid quantity change' });
    }

    console.log(`Mise à jour du panier - ID: ${cartItemId}, Changement: ${change}`);

    // Récupérer l'élément du panier
    let cartItem;
    if (db.useMongo) {
      cartItem = await db.getCartItem(cartItemId);
    } else {
      const items = await db.query('SELECT * FROM cart_items WHERE id = ?', [cartItemId]);
      cartItem = items[0];
    }
    
    if (!cartItem) {
      console.error(`Élément de panier introuvable: ${cartItemId}`);
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    console.log('Élément de panier trouvé:', cartItem);
    
    const updatedQuantity = cartItem.quantity + change;
    console.log(`Nouvelle quantité: ${updatedQuantity}`);

    if (updatedQuantity <= 0) {
      // Supprimer le produit si la quantité est <= 0
      console.log(`Suppression de l'élément de panier: ${cartItemId}`);
      if (db.useMongo) {
        await db.removeFromCart(cartItemId);
      } else {
        await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
      }
      return res.status(200).json({ message: 'Produit supprimé du panier' });
    } else {
      // Mettre à jour la quantité si elle est > 0
      console.log(`Mise à jour de la quantité: ${cartItemId} => ${updatedQuantity}`);
      if (db.useMongo) {
        await db.updateCartItemQuantity(cartItemId, updatedQuantity);
      } else {
        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [updatedQuantity, cartItemId]);
      }
      
      res.status(200).json({ message: 'Quantité mise à jour avec succès', updatedQuantity });
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la quantité :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
