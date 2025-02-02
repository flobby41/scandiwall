document.addEventListener("DOMContentLoaded", () => {
  const cartBadge = document.getElementById("cart-badge"),
    notification = document.getElementById("notification"),
    notificationText = document.getElementById("notification-text"),
    closeNotification = document.getElementById("close-notification"),
    cartAPI = "/api/cart";
  let cart = [];

  const syncCartWithBackend = async () => {
    try {
      const res = await fetch(cartAPI),
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

  const showNotification = productName => {
    notificationText.textContent = `${productName} has been added to your cart!`;
  
    // Ajoute les classes pour afficher la notification
    notification.classList.remove("opacity-0", "invisible");
    notification.classList.add("opacity-100", "visible");
  
    // Masque la notification après 5 secondes
    setTimeout(() => {
      notification.classList.remove("opacity-100", "visible");
      notification.classList.add("opacity-0", "invisible");
    }, 5000);
  };

  const addToCart = product => {
    const existingProduct = cart.find(item => item.product_id === product.id);
    existingProduct ? existingProduct.quantity++ : cart.push({ product_id: product.id, name: product.name, quantity: 1 });
    console.log('cart ', cart  )

    localStorage.setItem("cart", JSON.stringify(cart));
    fetch(cartAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, user_id: userId, quantity: 1, price: product.price }),
    }).catch(err => console.error("Erreur ajout backend:", err));
    showNotification(product.name);
    updateCartBadge();
  };

  const generateProductHTML = (products, category) =>
    `

  <section class="product-section">
    <h2>${category}</h2>
    <div class="product-grid">
      ${products
        .filter(product => product.category === category)
        .map(
          product => `
          <div class="produkt-card" data-id="${product.id}">
            <div class="product-grid-container">
              <a href="/products/${product.slugs}">
                <img 
                src="${product.image}"
                alt=" ${product.name} produktbild"
                class="rounded-lg"
                />
              </a>
              <div class="icon-container">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="add-to-cart-btn size-6 stroke-white"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </div>
            </div>
            <div class="product-information text-left">
             <h2 class="name text-base text-left font-normal normal-case"> 
             ${product.name}
              </h2>
            <p class="price text-gray-600">${product.price} SEK
            </p>
            </div>
            </div>
            
          
        `
        )
        .join("")}
        </div>
        <button class="primary-button lg:self-center">
          <a href="/category/${category}">Se fler</a>
        </button>
    </section>

  `;

  fetch("/api/products")
    .then(resp => resp.json())
    .then(data => {
      const productCard = document.getElementById("data-output");
      productCard.innerHTML =
        generateProductHTML(data, "Nyheter") + generateProductHTML(data, "Vinter")+ generateProductHTML(data, "Landskap");

      productCard.addEventListener("click", e => {
        if (e.target && e.target.classList.contains("add-to-cart-btn")) {
          const el = e.target.closest(".produkt-card"),
            product = {
              id: el.dataset.id,
              name: el.querySelector(".name").textContent.trim(),
              price: parseFloat(el.querySelector(".price").textContent.replace("SEK", "").trim()),
            };
          addToCart(product);
        }
      });
    })
    .catch(err => console.error("Erreur produits:", err));

  syncCartWithBackend();
  closeNotification.addEventListener("click", () => {
    notification.classList.remove("opacity-100", "visible");
    notification.classList.add("opacity-0", "invisible")});


  
});