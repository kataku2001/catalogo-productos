const products = [
  { id: 1, name: "Laptop Gamer", category: "Electrónica", price: 1299.99, emoji: "💻", desc: "Laptop de alto rendimiento con RTX 4070" },
  { id: 2, name: "Mouse Inalámbrico", category: "Electrónica", price: 29.99, emoji: "🖱️", desc: "Mouse ergonómico con DPI ajustable" },
  { id: 3, name: "Teclado Mecánico", category: "Electrónica", price: 89.99, emoji: "⌨️", desc: "Switches Cherry MX, retroiluminado RGB" },
  { id: 4, name: "Monitor 27\"", category: "Electrónica", price: 349.99, emoji: "🖥️", desc: "Monitor IPS 144Hz, 1ms respuesta" },
  { id: 5, name: "Auriculares Pro", category: "Electrónica", price: 149.99, emoji: "🎧", desc: "Cancelación de ruido activa, Bluetooth 5.0" },
  { id: 6, name: "Camiseta Básica", category: "Ropa", price: 19.99, emoji: "👕", desc: "Algodón 100%, disponible en varios colores" },
  { id: 7, name: "Jeans Clásicos", category: "Ropa", price: 49.99, emoji: "👖", desc: "Jeans rectos, denim de alta calidad" },
  { id: 8, name: "Zapatillas Deportivas", category: "Ropa", price: 79.99, emoji: "👟", desc: "Amortiguación Air, ideales para correr" },
  { id: 9, name: "Chaqueta Impermeable", category: "Ropa", price: 119.99, emoji: "🧥", desc: "Protección contra lluvia, ligera y transpirable" },
  { id: 10, name: "Reloj Inteligente", category: "Electrónica", price: 199.99, emoji: "⌚", desc: "GPS, monitor de ritmo cardíaco, agua resistente" },
  { id: 11, name: "Café Orgánico 1kg", category: "Alimentos", price: 24.99, emoji: "☕", desc: "Café de origen único, tueste medio" },
  { id: 12, name: "Aceite de Oliva Extra Virgen", category: "Alimentos", price: 15.99, emoji: "🫒", desc: "500ml, prensado en frío, sabor suave" },
  { id: 13, name: "Chocolate Negro 85%", category: "Alimentos", price: 5.99, emoji: "🍫", desc: "Chocolate artesanal, 100g" },
  { id: 14, name: "Miel Natural 500g", category: "Alimentos", price: 12.99, emoji: "🍯", desc: "Miel pura de flores silvestres" },
  { id: 15, name: "Mochila Aventura", category: "Hogar", price: 59.99, emoji: "🎒", desc: "40L, resistente al agua, múltiples compartimentos" },
  { id: 16, name: "Lámpara LED Escritorio", category: "Hogar", price: 34.99, emoji: "💡", desc: "5 niveles de brillo, temperatura ajustable" },
  { id: 17, name: "Set de Sartenes", category: "Hogar", price: 89.99, emoji: "🍳", desc: "3 piezas antiadherentes, apta lavavajillas" },
  { id: 18, name: "Almohada Ergonómica", category: "Hogar", price: 44.99, emoji: "🛏️", desc: "Memoria de espuma, cervical, con funda lavable" },
  { id: 19, name: "Botella Térmica 750ml", category: "Hogar", price: 22.99, emoji: "🫗", desc: "Acero inoxidable, mantiene temperatura 12h" },
  { id: 20, name: "Libro: Clean Code", category: "Libros", price: 39.99, emoji: "📖", desc: "Guía de buenas prácticas en programación" },
];

let cart = [];

const catalog = document.getElementById("catalog");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const modalFooter = document.getElementById("modalFooter");
const btnViewCart = document.getElementById("btnViewCart");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnClearCart = document.getElementById("btnClearCart");
const btnConfirmOrder = document.getElementById("btnConfirmOrder");
const cartCount = document.getElementById("cartCount");
const totalPrice = document.getElementById("totalPrice");
const notification = document.getElementById("notification");

function init() {
  loadCategories();
  renderCatalog(products);
  bindEvents();
}

function loadCategories() {
  const categories = [...new Set(products.map(p => p.category))];
  categories.sort().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function renderCatalog(items) {
  catalog.innerHTML = "";
  if (items.length === 0) {
    catalog.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;padding:3rem;">No se encontraron productos.</p>';
    return;
  }
  items.forEach(product => {
    const cartItem = cart.find(c => c.id === product.id);
    const qty = cartItem ? cartItem.qty : 1;
    const isInCart = !!cartItem;

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img">${product.emoji}</div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.desc}</p>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-actions">
          <div class="quantity-control">
            <button onclick="changeQty(${product.id}, -1)">−</button>
            <input type="number" id="qty-${product.id}" value="${qty}" min="1" max="99" onchange="validateQty(${product.id})" />
            <button onclick="changeQty(${product.id}, 1)">+</button>
          </div>
          <button class="btn-add ${isInCart ? 'added' : ''}" id="btn-add-${product.id}" onclick="addToCart(${product.id})">
            ${isInCart ? '✓ En carrito' : 'Agregar'}
          </button>
        </div>
      </div>
    `;
    catalog.appendChild(card);
  });
}

function changeQty(productId, delta) {
  const input = document.getElementById(`qty-${productId}`);
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(99, val + delta));
  input.value = val;
}

function validateQty(productId) {
  const input = document.getElementById(`qty-${productId}`);
  let val = parseInt(input.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 99) val = 99;
  input.value = val;
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = parseInt(qtyInput.value) || 1;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty = qty;
    showNotification(`${product.name} actualizado (${qty} uds)`);
  } else {
    cart.push({ ...product, qty });
    showNotification(`${product.name} agregado al carrito`);
  }

  updateCartUI();
  filterAndSort();
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  updateCartUI();
  filterAndSort();
  renderCartModal();
}

function updateCartItemQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, item.qty + delta));
  updateCartUI();
  renderCartModal();
  filterAndSort();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  cartCount.textContent = totalItems;
}

function getCartTotal() {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}

function renderCartModal() {
  if (cart.length === 0) {
    modalBody.innerHTML = '<p class="empty-msg">No has seleccionado ningún producto aún.</p>';
    modalFooter.style.display = "none";
    return;
  }

  modalFooter.style.display = "flex";

  let html = "";
  cart.forEach(item => {
    html += `
      <div class="cart-item">
        <div class="cart-item-emoji">${item.emoji}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="updateCartItemQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartItemQty(${item.id}, 1)">+</button>
        </div>
        <div class="cart-item-subtotal">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">×</button>
      </div>
    `;
  });

  modalBody.innerHTML = html;
  totalPrice.textContent = getCartTotal().toFixed(2);
}

function filterAndSort() {
  let filtered = [...products];

  // Filtro por búsqueda
  const search = searchInput.value.toLowerCase().trim();
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.desc.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }

  // Filtro por categoría
  if (categoryFilter.value !== "all") {
    filtered = filtered.filter(p => p.category === categoryFilter.value);
  }

  // Ordenamiento
  switch (sortSelect.value) {
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
  }

  renderCatalog(filtered);
}

function showNotification(msg) {
  notification.textContent = msg;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 2000);
}

function bindEvents() {
  searchInput.addEventListener("input", filterAndSort);
  categoryFilter.addEventListener("change", filterAndSort);
  sortSelect.addEventListener("change", filterAndSort);

  btnViewCart.addEventListener("click", () => {
    renderCartModal();
    modalOverlay.classList.add("active");
  });

  btnCloseModal.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("active");
    }
  });

  btnClearCart.addEventListener("click", () => {
    if (cart.length === 0) return;
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
      cart = [];
      updateCartUI();
      renderCartModal();
      filterAndSort();
      showNotification("Carrito vaciado");
    }
  });

  btnConfirmOrder.addEventListener("click", () => {
    if (cart.length === 0) return;

    const lineas = cart.map(c => `${c.emoji} ${c.name} x${c.qty} = $${(c.price * c.qty).toFixed(2)}`);
    const total = getCartTotal().toFixed(2);

    let mensaje = `🛒 *Nuevo Pedido*\n\n`;
    mensaje += lineas.join("\n");
    mensaje += `\n\n💰 *Total: $${total}*`;
    mensaje += `\n\n📞 Contactar al cliente para confirmar entrega.`;

    const encoded = encodeURIComponent(mensaje);
    const phone = "54363041";
    const url = `https://wa.me/${phone}?text=${encoded}`;

    window.open(url, "_blank");

    cart = [];
    updateCartUI();
    modalOverlay.classList.remove("active");
    filterAndSort();
    showNotification("¡Pedido enviado por WhatsApp!");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modalOverlay.classList.remove("active");
    }
  });
}

init();
