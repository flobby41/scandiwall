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
      cart = backendCart.map((item) => ({
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

  const showNotification = (productName) => {
    notificationText.textContent = `${productName} har lagts till i varukorgen!`;

    // Ajoute les classes pour afficher la notification
    notification.classList.remove("opacity-0", "invisible");
    notification.classList.add("opacity-100", "visible");

    // Masque la notification après 5 secondes
    setTimeout(() => {
      notification.classList.remove("opacity-100", "visible");
      notification.classList.add("opacity-0", "invisible");
    }, 5000);
  };

  const addToCart = (product) => {
    const existingProduct = cart.find((item) => item.product_id === product.id);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
      });
    }


    localStorage.setItem("cart", JSON.stringify(cart));

    // Skicka till backend (lägg till produkt i varukorgen på servern)
    fetch(cartAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        user_id: userId,
        quantity: 1,
        price: product.price,
      }),
    }).catch((err) => console.error("Erreur ajout backend:", err));

    showNotification(product.name);
    updateCartBadge();
  };

 

  
  fetch("/api/products")
    .then((resp) => resp.json())
    .then((data) => {
      const productCard = document.getElementById("wesh");


      productCard.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("add-to-cart-btn")) {
          // Förhindra att länken följer sin standardbeteende (om användaren klickar på en knapp inom en länk)
          e.preventDefault();
          e.stopPropagation(); // Förhindra att eventet bubbla upp till förälderelementet

          const el = e.target.closest(".product-card"),
            product = {
              id: el.dataset.id,
              name: el.querySelector(".nameF").textContent.trim(),
              price: parseFloat(
                el
                  .querySelector(".priceF")
                  .textContent.replace("SEK", "")
                  .trim()
              ),
              image: el.querySelector("img").getAttribute("src"), // Om du behöver bild också
            };

          addToCart(product);
        }
      });
    })
    .catch((err) => console.error("Erreur produits:", err));

  syncCartWithBackend();
  closeNotification.addEventListener("click", () => {
    notification.classList.remove("opacity-100", "visible");
    notification.classList.add("opacity-0", "invisible");
  });
});
