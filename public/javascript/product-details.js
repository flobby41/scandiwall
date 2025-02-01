document.addEventListener('DOMContentLoaded', () => {
  const cartBadge = document.getElementById('cart-badge');
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notification-text');
  const closeNotification = document.getElementById('close-notification');
  const cartAPI = '/api/cart';
  const quantity = 1; // Quantité par défaut
  const userId = 1; // ID utilisateur temporaire pour les tests

  let cart = [];

  // Synchronise le badge du panier avec le backend
  const syncCartWithBackend = async () => {
    try {
      const response = await fetch(cartAPI);
      const backendCart = await response.json();
      cart = backendCart.map(item => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
      }));
      updateCartBadge();
    } catch (error) {
      console.error('Erreur de synchronisation avec le backend:', error);
    }
  };

  // Met à jour le badge du panier
  const updateCartBadge = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  };

  // Affiche une notification
  const showNotification = (productName) => {
    notificationText.textContent = `${productName} har lagts till i varukorgen!`;

    // Ajoute les classes Tailwind pour afficher la notification
    notification.classList.remove('opacity-0', 'invisible');
    notification.classList.add('opacity-100', 'visible');

    // Cache la notification après 5 secondes
    setTimeout(() => {
      notification.classList.remove('opacity-100', 'visible');
      notification.classList.add('opacity-0', 'invisible');
    }, 5000);
  };

  // Ajoute un produit au panier
  const addToCart = async (productId, productName, price) => {
    try {
      const response = await fetch(cartAPI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          user_id: userId,
          quantity: quantity,
          price: price,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout au panier.');
      }

      // Met à jour le badge après ajout
      await syncCartWithBackend();

      // Affiche la notification
      showNotification(productName);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
    }
  };

  // Gestionnaire pour le bouton "Add to Cart"
  document.querySelector('.add-to-cart-btn').addEventListener('click', function () {
    const productId = this.getAttribute('data-product-id');
    const productName = this.getAttribute('data-product-name');
    const price = parseFloat(this.getAttribute('data-product-price'));

    addToCart(productId, productName, price);
  });

  // Synchroniser à l'ouverture ou lors de la navigation arrière
  window.addEventListener('pageshow', syncCartWithBackend);

  // Ferme la notification
  closeNotification.addEventListener('click', () => {
    notification.classList.remove('opacity-100', 'visible');
    notification.classList.add('opacity-0', 'invisible');
  });

  // Charger initialement le badge
  syncCartWithBackend();
});