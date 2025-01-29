const orderAPI = '/api/orders'
const cartAPI = '/api/cart'

document.addEventListener('DOMContentLoaded', async () => {
  try {
      // Étape 1 : Récupérer les articles du panier depuis l'API
      const cartResponse = await fetch(cartAPI);
      if (!cartResponse.ok) throw new Error('Erreur lors de la récupération du panier.');
      const cartItems = await cartResponse.json();

      // Étape 2 : Remplir la section "Résumé de la commande"
      const cartItemsContainer = document.getElementById('cart-items');
      let subtotal = 0;

      cartItems.forEach(item => {
          const totalItemPrice = item.price * item.quantity;
          subtotal += totalItemPrice;

          // Ajouter chaque article au DOM
          const itemElement = document.createElement('div');
          itemElement.innerHTML = `
              <p>
                  <strong>${item.name}</strong> - 
                  ${item.quantity} x €${item.price.toFixed(2)} = 
                  €${totalItemPrice.toFixed(2)}
              </p>
          `;
          cartItemsContainer.appendChild(itemElement);
      });

      // Étape 3 : Mettre à jour les totaux
      document.getElementById('subtotal').textContent = `SEK${subtotal.toFixed(2)}`;
      const shippingFee = 5.00; // Exemple de frais d'expédition
      document.getElementById('shipping-fee').textContent = `SEK${shippingFee.toFixed(2)}`;
      document.getElementById('total').textContent = `SEK${(subtotal + shippingFee).toFixed(2)}`;
  } catch (error) {
      console.error('Erreur lors de l\'affichage du résumé de la commande :', error);
  }
});
  fetch(cartAPI)
  .then(response => response.json())
  .then(data => console.log('Données de l\'API cart:', data))
  .catch(error => console.error('Erreur lors de la récupération des données du panier:', error));


document.getElementById('confirmOrderButton').addEventListener('click', async (event) => {
  event.preventDefault(); 

  try {
      // Récupération des articles du panier
      const cartResponse = await fetch(cartAPI);
      if (!cartResponse.ok) throw new Error('Erreur lors de la récupération du panier.');
      const cartItems = await cartResponse.json();
      console.log('Données complètes reçues pour cartItems :', JSON.stringify(cartItems, null, 2));
      const total_price = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

      // Envoi des données au backend
      const orderResponse = await fetch(orderAPI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems, total_price })
      });

      if (!orderResponse.ok) {
          const error = await orderResponse.json();
          throw new Error(error.error || 'Erreur lors de la confirmation de la commande.');
      }

      const jsonResponse = await orderResponse.json();

// Accéder à la clé `orderId`
const orderId = jsonResponse.orderId;
console.log('Order ID :', orderId);

// Réinitialiser l'interface du panier
document.getElementById('cart-items').innerHTML = '';
  document.getElementById('subtotal').textContent = 'SEK 0.00';
  document.getElementById('shipping-fee').textContent = '€5.00';
  document.getElementById('total').textContent = 'SEK 5.00';

// Lire toute la réponse JSON
console.log('Réponse complète de l\'API :', jsonResponse);
      alert(`Commande confirmée ! Numéro de commande : ${orderId}`);
      window.location.href = `/orders/confirmation?orderId=${orderId}`;
  } catch (error) {
      console.error('Erreur lors de la confirmation de la commande :', error);
      alert(`Erreur : ${error.message}`);
  }
});