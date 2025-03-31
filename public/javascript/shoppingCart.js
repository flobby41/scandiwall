const cartItemsContainer = document.getElementById("cart-items");
const subtotalElement = document.getElementById("subtotal");
const openSidebarBtn = document.getElementById("open-sidebar");
const closeSidebarBtn = document.getElementById("close-sidebar");
const sidebar = document.getElementById("sidebar");
const loginBtn = document.getElementById("login-btn");
const guestBtn = document.getElementById("guest-btn");
const cartApi = "/api/cart";

document.addEventListener("DOMContentLoaded", () => {
  const cartBadge = document.getElementById("cart-badge");

  const syncCartWithBackend = async () => {
    try {
      const res = await fetch(cartApi),
        backendCart = await res.json();
      cart = backendCart.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
      }));
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartBadge();
    } catch (e) {
      console.error("Fel vid synkronisering:", e);
    }
  };
  // Synkronisera vid öppning eller vid bakåtnavigering
  window.addEventListener("pageshow", syncCartWithBackend);

  const updateCartBadge = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  };
});

// Kontrollerar om användaren är inloggad
async function checkAuthentication() {
  try {
    const response = await fetch("/profile/api/isAuthenticated");
    const data = await response.json();
    console.log("Autentisering:", data.authenticated);
    return data.authenticated;
  } catch (error) {
    console.error(
      "Fel vid kontroll av autentisering:",
      error
    );
    return false;
  }
}

// Hanterar klick på "fortsätt till kassan"
openSidebarBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // Förhindrar standardbeteende för länken
  const isAuthenticated = await checkAuthentication();

  if (isAuthenticated) {
    // Omdirigerar direkt till ordersidan om inloggad
    window.location.href = "/orders";
  } else {
    // Visar sidopanelen om inte inloggad
    sidebar.classList.add("open");
  }
});

// Knapp "gå med eller logga in"
loginBtn.addEventListener("click", () => {
  window.location.href = "/profile/login";
});

async function getCartItems() {
  try {
    const response = await fetch("/api/cart"); // Endpoint för att hämta varukorgen
    if (!response.ok) throw new Error("Det går inte att hämta varukorgen.");
    return await response.json();
  } catch (error) {
    console.error("Fel vid hämtning av varukorgen:", error);
    return [];
  }
}
function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
// Knapp "fortsätt som gäst"
guestBtn.addEventListener("click", async () => {
  try {
    const cartItems = await getCartItems(); // Hämtar varukorgen via API
    const total_price = calculateTotal(cartItems); // Beräknar totalbeloppet utifrån hämtade data

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItems, total_price }), // Använder hämtade data
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Beställning lagd som gäst:", result);
      window.location.href = "/orders"; // Omdirigerar till /orders
    } else {
      console.error("Fel vid beställning som gäst.");
    }
  } catch (error) {
    console.error("Nätverksfel:", error);
  }
});

// Knapp "gå med eller logga in"
guestBtn.addEventListener("click", () => {
  window.location.href = "/orders";
});

// Stänger sidopanelen
closeSidebarBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

// Stänger sidopanelen om användaren klickar utanför
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// Hämtar och visar varukorgens artiklar
async function fetchCartItems() {
  try {
    const response = await fetch(cartApi);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const cartItems = await response.json();
    console.log("Éléments du panier récupérés:", cartItems);
    renderCart(cartItems);
  } catch (error) {
    console.error("Fel vid hämtning av varukorgens artiklar:", error);
  }
}

// Visar varukorgens artiklar
function renderCart(cart) {
  cartItemsContainer.innerHTML = "";
  let subtotal = 0;

  if (!cart || cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Din varukorg är tom</p>";
    subtotalElement.textContent = "0:-";
    return;
  }

  cart.forEach((item) => {
    if (!item) return; // Ignorer les éléments nuls
    
    try {
      // Vérifier que toutes les propriétés nécessaires sont présentes
      if (!item.cart_id) {
        console.error("Élément du panier sans ID:", item);
        return;
      }
      
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      
      subtotal += itemPrice * itemQuantity;

      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");
      cartItem.innerHTML = `
        <img src="${item.image || '/images/poster.png'}" alt="${item.name || 'Produit'}">
        <div class="item-details">
          <h3>${item.name || 'Produit inconnu'}</h3>
          <p>${itemPrice}:- /st</p>
        </div>
        <div class="quantity-controls">
          <button onclick="updateQuantity('${item.cart_id}', -1)">−</button>
          <span>${itemQuantity}</span>
          <button onclick="updateQuantity('${item.cart_id}', 1)">+</button>
        </div>
        <div class="icon-button" onclick="removeItem('${item.cart_id}')"><i class="bi bi-trash3"></i></div>
      `;
      cartItemsContainer.appendChild(cartItem);
    } catch (error) {
      console.error("Erreur lors du rendu d'un élément du panier:", error, item);
    }
  });

  subtotalElement.textContent = `${subtotal}:-`;
}

// Uppdaterar en artikels kvantitet
async function updateQuantity(id, change) {
  try {
    console.log(`Mise à jour de la quantité: ID=${id}, changement=${change}`);
    const response = await fetch(`${cartApi}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    // Recharger les articles après la mise à jour
    fetchCartItems();
  } catch (error) {
    console.error("Fel vid uppdatering av kvantitet:", error);
    alert("Une erreur s'est produite lors de la mise à jour du panier. Veuillez réessayer.");
  }
}

// Tar bort en artikel från varukorgen
async function removeItem(id) {
  try {
    console.log(`Suppression de l'élément: ID=${id}`);
    const response = await fetch(`${cartApi}/${id}`, { method: "DELETE" });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    // Recharger les articles après la suppression
    fetchCartItems();
  } catch (error) {
    console.error("Fel vid borttagning av en artikel:", error);
    alert("Une erreur s'est produite lors de la suppression de l'article. Veuillez réessayer.");
  }
}

// Laddar varukorgens artiklar vid sidans öppning
fetchCartItems();
