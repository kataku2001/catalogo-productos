const ADMIN_USER = "didi";
const ADMIN_PASS = "123456";

const defaultProducts = [];

let customProducts = JSON.parse(localStorage.getItem("customProducts")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let isLoggedIn = false;

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
const btnAdmin = document.getElementById("btnAdmin");

const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginError = document.getElementById("loginError");
const btnCloseLogin = document.getElementById("btnCloseLogin");

const adminOverlay = document.getElementById("adminOverlay");
const btnCloseAdmin = document.getElementById("btnCloseAdmin");
const btnLogout = document.getElementById("btnLogout");
const adminUserLabel = document.getElementById("adminUserLabel");
const productForm = document.getElementById("productForm");
const adminProductList = document.getElementById("adminProductList");
const customCount = document.getElementById("customCount");

function getAllProducts() {
  return [...defaultProducts, ...customProducts];
}

function saveCustomProducts() {
  localStorage.setItem("customProducts", JSON.stringify(customProducts));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function init() {
  loadCategories();
  renderCatalog(getAllProducts());
  renderAdminList();
  bindEvents();
}

function loadCategories() {
  categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
  const categories = [...new Set(getAllProducts().map(p => p.category))];
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
    const isCustom = customProducts.some(p => p.id === product.id);

    const card = document.createElement("div");
    card.className = "product-card" + (isCustom ? " custom-product" : "");
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
  const product = getAllProducts().find(p => p.id === productId);
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

  saveCart();
  updateCartUI();
  filterAndSort();
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  saveCart();
  updateCartUI();
  filterAndSort();
  renderCartModal();
}

function updateCartItemQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, item.qty + delta));
  saveCart();
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
  let filtered = [...getAllProducts()];

  const search = searchInput.value.toLowerCase().trim();
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.desc.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }

  if (categoryFilter.value !== "all") {
    filtered = filtered.filter(p => p.category === categoryFilter.value);
  }

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

// Admin: agregar producto
function addProduct(e) {
  e.preventDefault();

  const name = document.getElementById("prodName").value.trim();
  const emoji = document.getElementById("prodEmoji").value.trim();
  const category = document.getElementById("prodCategory").value.trim();
  const price = parseFloat(document.getElementById("prodPrice").value);
  const desc = document.getElementById("prodDesc").value.trim() || "Sin descripción";

  if (!name || !emoji || !category || isNaN(price) || price <= 0) {
    showNotification("Completa todos los campos obligatorios");
    return;
  }

  const maxId = Math.max(0, ...defaultProducts.map(p => p.id), ...customProducts.map(p => p.id));
  const newProduct = { id: maxId + 1, name, category, price, emoji, desc };

  customProducts.push(newProduct);
  saveCustomProducts();

  productForm.reset();
  loadCategories();
  renderAdminList();
  filterAndSort();
  showNotification(`${emoji} ${name} agregado al catálogo`);
}

function deleteCustomProduct(productId) {
  if (!confirm("¿Eliminar este producto del catálogo?")) return;
  customProducts = customProducts.filter(p => p.id !== productId);
  saveCustomProducts();

  cart = cart.filter(c => c.id !== productId);
  saveCart();
  updateCartUI();

  loadCategories();
  renderAdminList();
  filterAndSort();
  showNotification("Producto eliminado");
}

function renderAdminList() {
  customCount.textContent = customProducts.length;

  if (customProducts.length === 0) {
    adminProductList.innerHTML = '<p class="empty-msg">No has agregado productos aún.</p>';
    return;
  }

  let html = "";
  customProducts.forEach(p => {
    html += `
      <div class="admin-product-item">
        <div class="item-emoji">${p.emoji}</div>
        <div class="item-info">
          <div class="item-name">${p.name}</div>
          <div class="item-meta">${p.category} · $${p.price.toFixed(2)}</div>
        </div>
        <button class="btn btn-danger" style="padding:0.3rem 0.6rem;font-size:0.8rem;" onclick="deleteCustomProduct(${p.id})">Eliminar</button>
      </div>
    `;
  });

  adminProductList.innerHTML = html;
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
      saveCart();
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
    saveCart();
    updateCartUI();
    modalOverlay.classList.remove("active");
    filterAndSort();
    showNotification("¡Pedido enviado por WhatsApp!");
  });

  // Login
  btnAdmin.addEventListener("click", () => {
    if (isLoggedIn) {
      openAdmin();
    } else {
      loginOverlay.classList.add("active");
    }
  });

  btnCloseLogin.addEventListener("click", () => {
    loginOverlay.classList.remove("active");
    loginError.classList.remove("visible");
    loginForm.reset();
  });

  loginOverlay.addEventListener("click", (e) => {
    if (e.target === loginOverlay) {
      loginOverlay.classList.remove("active");
      loginError.classList.remove("visible");
      loginForm.reset();
    }
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = loginUser.value.trim();
    const pass = loginPass.value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      isLoggedIn = true;
      loginOverlay.classList.remove("active");
      loginError.classList.remove("visible");
      loginForm.reset();
      openAdmin();
      showNotification("Bienvenido, " + user);
    } else {
      loginError.classList.add("visible");
    }
  });

  // Admin
  btnCloseAdmin.addEventListener("click", () => {
    adminOverlay.classList.remove("active");
  });

  adminOverlay.addEventListener("click", (e) => {
    if (e.target === adminOverlay) {
      adminOverlay.classList.remove("active");
    }
  });

  btnLogout.addEventListener("click", () => {
    isLoggedIn = false;
    adminOverlay.classList.remove("active");
    showNotification("Sesión cerrada");
  });

  productForm.addEventListener("submit", addProduct);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modalOverlay.classList.remove("active");
      loginOverlay.classList.remove("active");
      adminOverlay.classList.remove("active");
    }
  });
}

function openAdmin() {
  adminUserLabel.textContent = `👤 ${ADMIN_USER}`;
  renderAdminList();
  adminOverlay.classList.add("active");
}

init();
