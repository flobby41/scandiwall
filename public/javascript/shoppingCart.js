const cartItemsContainer = document.getElementById('cart-items');
const subtotalElement = document.getElementById('subtotal');
const cartApi = '/api/cart';

// GET
async function fetchCartItems() {
  try {
    const response = await fetch(cartApi);
    const cartItems = await response.json();
    console.log("Données reçues :", cartItems); // Log des données

    renderCart(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
  }
}

// Render cart items on the page
function renderCart(cart) {
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');

    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>${item.price}:- / piece</p>
      </div>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${item.cart_id}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.cart_id}, 1)">+</button>
      </div>
      <span class="delete-btn" onclick="removeItem(${item.cart_id})">🗑</span>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  subtotalElement.textContent = `${subtotal}:-`;
}

// Update quantity in the database
async function updateQuantity(id, change) {
  try {
    await fetch(`${cartApi}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ change }),
    });
    fetchCartItems(); // Refresh the cart after update
  } catch (error) {
    console.error('Error updating quantity:', error);
  }
}

// Remove item from the cart in the database
async function removeItem(id) {
  try {
    await fetch(`${cartApi}/${id}`, {
      method: 'DELETE',
    });
    fetchCartItems(); // Refresh the cart after removal
  } catch (error) {
    console.error('Error removing item:', error);
  }
}

// Fetch cart items on page load
fetchCartItems();