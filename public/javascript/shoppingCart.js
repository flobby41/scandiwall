const cartItemsContainer = document.getElementById('cart-items');
const subtotalElement = document.getElementById('subtotal');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const loginBtn = document.getElementById('login-btn');
const guestBtn = document.getElementById('guest-btn');
const cartApi = '/api/cart';

document.addEventListener("DOMContentLoaded", () => {
  const cartBadge = document.getElementById("cart-badge");

const syncCartWithBackend = async () => {
  try {
    const res = await fetch(cartApi),
      backendCart = await res.json();
    cart = backendCart.map(item => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
    }));
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
  } catch (e) {
    console.error("Erreur sync:", e);
  }
};
     // Synchroniser à l'ouverture ou lors de la navigation arrière
     window.addEventListener("pageshow", syncCartWithBackend);

const updateCartBadge = () => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
  cartBadge.style.display = totalItems > 0 ? "flex" : "none";
};
})

// Vérifie si l'utilisateur est connecté
async function checkAuthentication() {
  try {
    const response = await fetch('/profile/api/isAuthenticated');
    const data = await response.json();
    console.log('Authentification :', data.authenticated);
    return data.authenticated;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification :', error);
    return false;
  }
}

// Gère le clic sur "fortsätt till kassan"
openSidebarBtn.addEventListener('click', async (e) => {
  e.preventDefault(); // Empêche le comportement par défaut du lien
  const isAuthenticated = await checkAuthentication();

  if (isAuthenticated) {
    // Redirige directement vers la page des commandes si connecté
    window.location.href = '/orders';
  } else {
    // Affiche la fenêtre latérale si non connecté
    sidebar.classList.add('open');
  }
});

// Bouton "gå med eller logga in"
loginBtn.addEventListener('click', () => {
  window.location.href = '/profile/login';
});

async function getCartItems() {
  try {
      const response = await fetch('/api/cart'); // Endpoint pour récupérer le panier
      if (!response.ok) throw new Error('Impossible de récupérer le panier.');
      return await response.json();
  } catch (error) {
      console.error('Erreur lors de la récupération du panier :', error);
      return [];
  }
}
function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
// Bouton "fortsätt som gäst"
guestBtn.addEventListener('click', async () => {
  try {
      const cartItems = await getCartItems(); // Récupère le panier via l'API
      const total_price = calculateTotal(cartItems); // Calcule le total à partir des données récupérées

      const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems, total_price }), // Utilise les données récupérées
      });

      if (response.ok) {
          const result = await response.json();
          console.log('Commande passée en tant qu\'invité :', result);
          window.location.href = '/orders'; // Redirige vers /orders
        } else {
          console.error('Erreur lors de la commande en tant qu\'invité.');
      }
  } catch (error) {
      console.error('Erreur réseau :', error);
  }
});

// Ferme la fenêtre latérale
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// Ferme la fenêtre latérale si l'utilisateur clique en dehors
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// Récupère et affiche les articles du panier
async function fetchCartItems() {
  try {
    const response = await fetch(cartApi);
    const cartItems = await response.json();
    renderCart(cartItems);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles du panier :', error);
  }
}

// Affiche les articles du panier
function renderCart(cart) {
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item) => {
    subtotal += item.price * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>${item.price}:- /st</p>
      </div>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${item.cart_id}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.cart_id}, 1)">+</button>
      </div>
      <span class="delete-btn" onclick="removeItem(${item.cart_id})"><i class="bi bi-trash3"></i></span>
    `;
    cartItemsContainer.appendChild(cartItem);
  });

  subtotalElement.textContent = `${subtotal}:-`;
}

// Met à jour la quantité d'un article
async function updateQuantity(id, change) {
  try {
    await fetch(`${cartApi}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change }),
    });
    fetchCartItems(); // Recharge les articles après modification
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la quantité :', error);
  }
}

// Supprime un article du panier
async function removeItem(id) {
  try {
    await fetch(`${cartApi}/${id}`, { method: 'DELETE' });
    fetchCartItems(); // Recharge les articles après suppression
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un article :', error);
  }
}

// Charge les articles du panier à l'ouverture de la page
fetchCartItems();