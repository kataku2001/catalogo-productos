import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArbbTZPcp_kofiO8q8A5PlRafvRLGnsFM",
  authDomain: "catalogo-730f3.firebaseapp.com",
  projectId: "catalogo-730f3",
  storageBucket: "catalogo-730f3.firebasestorage.app",
  messagingSenderId: "785266147642",
  appId: "1:785266147642:web:9145cbdb0d542ed70bd003",
  measurementId: "G-MEYHEZFZQT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_USER = "didi";
const ADMIN_PASS = "123456";

let customProducts = [];
let cart = [];
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

// --- Firestore ---

async function fetchProducts() {
  const snap = await getDocs(collection(db, "products"));
  customProducts = snap.docs.map(d => ({ id: parseInt(d.id), ...d.data() }));
}

async function addProductToDB(product) {
  const docRef = await addDoc(collection(db, "products"), product);
  return docRef.id;
}

async function deleteProductFromDB(id) {
  await deleteDoc(doc(db, "products", String(id)));
}

async function fetchCart() {
  const snap = await getDocs(collection(db, "cart"));
  if (snap.docs.length > 0) {
    cart = snap.docs[0].data().items || [];
  } else {
    cart = [];
  }
}

async function saveCartToDB() {
  const cartRef = doc(db, "cart", "current");
  await setDoc(cartRef, { items: cart });
}

// --- Init ---

async function init() {
  await fetchProducts();
  await fetchCart();
  loadCategories();
  renderCatalog(customProducts);
  renderAdminList();
  bindEvents();
}

// --- Categories ---

function loadCategories() {
  categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
  const categories = [...new Set(customProducts.map(p => p.category))];
  categories.sort().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// --- Render Catalog ---

function renderCatalog(items) {
  catalog.innerHTML = "";
  if (items.length === 0) {
    catalog.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#aaa;padding:3rem;">No hay productos aún. Agrega desde el panel de administración.</p>';
    return;
  }
  items.forEach(product => {
    const cartItem = cart.find(c => c.id === product.id);
    const qty = cartItem ? cartItem.qty : 1;
    const isInCart = !!cartItem;

    const card = document.createElement("div");
    card.className = "product-card";
    const imgContent = product.photo
      ? `<img src="${product.photo}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" />`
      : product.emoji;
    card.innerHTML = `
      <div class="product-img">${imgContent}</div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.desc}</p>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-actions">
          <div class="quantity-control">
            <button onclick="window.changeQty(${product.id}, -1)">−</button>
            <input type="number" id="qty-${product.id}" value="${qty}" min="1" max="99" onchange="window.validateQty(${product.id})" />
            <button onclick="window.changeQty(${product.id}, 1)">+</button>
          </div>
          <button class="btn-add ${isInCart ? 'added' : ''}" id="btn-add-${product.id}" onclick="window.addToCart(${product.id})">
            ${isInCart ? '✓ En carrito' : 'Agregar'}
          </button>
        </div>
      </div>
    `;
    catalog.appendChild(card);
  });
}

window.changeQty = function(productId, delta) {
  const input = document.getElementById(`qty-${productId}`);
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(99, val + delta));
  input.value = val;
};

window.validateQty = function(productId) {
  const input = document.getElementById(`qty-${productId}`);
  let val = parseInt(input.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 99) val = 99;
  input.value = val;
};

// --- Cart ---

window.addToCart = async function(productId) {
  const product = customProducts.find(p => p.id === productId);
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

  await saveCartToDB();
  updateCartUI();
  filterAndSort();
};

window.removeFromCart = async function(productId) {
  cart = cart.filter(c => c.id !== productId);
  await saveCartToDB();
  updateCartUI();
  filterAndSort();
  renderCartModal();
};

window.updateCartItemQty = async function(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, item.qty + delta));
  await saveCartToDB();
  updateCartUI();
  renderCartModal();
  filterAndSort();
};

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
    const cartImg = item.photo
      ? `<img src="${item.photo}" style="width:50px;height:50px;border-radius:8px;object-fit:cover;" />`
      : `<div class="cart-item-emoji">${item.emoji}</div>`;
    html += `
      <div class="cart-item">
        ${cartImg}
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="window.updateCartItemQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="window.updateCartItemQty(${item.id}, 1)">+</button>
        </div>
        <div class="cart-item-subtotal">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="cart-item-remove" onclick="window.removeFromCart(${item.id})" title="Eliminar">×</button>
      </div>
    `;
  });

  modalBody.innerHTML = html;
  totalPrice.textContent = getCartTotal().toFixed(2);
}

// --- Filter & Sort ---

function filterAndSort() {
  let filtered = [...customProducts];

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

// --- Notifications ---

function showNotification(msg) {
  notification.textContent = msg;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 2000);
}

// --- Admin ---

async function addProduct(e) {
  e.preventDefault();

  const name = document.getElementById("prodName").value.trim();
  const emoji = document.getElementById("prodEmoji").value.trim();
  const category = document.getElementById("prodCategory").value.trim();
  const price = parseFloat(document.getElementById("prodPrice").value);
  const desc = document.getElementById("prodDesc").value.trim() || "Sin descripción";
  const photoInput = document.getElementById("prodPhoto");

  if (!name || !emoji || !category || isNaN(price) || price <= 0) {
    showNotification("Completa todos los campos obligatorios");
    return;
  }

  const newProduct = { name, category, price, emoji, desc, photo: null };

  function afterSave() {
    productForm.reset();
    document.getElementById("photoPreview").innerHTML = "📷 Seleccionar imagen";
    loadCategories();
    renderAdminList();
    filterAndSort();
    showNotification(`${emoji} ${name} agregado al catálogo`);
  }

  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async () => {
      newProduct.photo = reader.result;
      await addProductToDB(newProduct);
      await fetchProducts();
      afterSave();
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    await addProductToDB(newProduct);
    await fetchProducts();
    afterSave();
  }
}

async function deleteCustomProduct(productId) {
  if (!confirm("¿Eliminar este producto del catálogo?")) return;
  await deleteProductFromDB(productId);
  await fetchProducts();

  cart = cart.filter(c => c.id !== productId);
  await saveCartToDB();
  updateCartUI();

  loadCategories();
  renderAdminList();
  filterAndSort();
  showNotification("Producto eliminado");
}
window.deleteCustomProduct = deleteCustomProduct;

function renderAdminList() {
  customCount.textContent = customProducts.length;

  if (customProducts.length === 0) {
    adminProductList.innerHTML = '<p class="empty-msg">No has agregado productos aún.</p>';
    return;
  }

  let html = "";
  customProducts.forEach(p => {
    const thumb = p.photo
      ? `<img src="${p.photo}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;" />`
      : `<div class="item-emoji">${p.emoji}</div>`;
    html += `
      <div class="admin-product-item">
        ${thumb}
        <div class="item-info">
          <div class="item-name">${p.name}</div>
          <div class="item-meta">${p.category} · $${p.price.toFixed(2)}</div>
        </div>
        <button class="btn btn-danger" style="padding:0.3rem 0.6rem;font-size:0.8rem;" onclick="window.deleteCustomProduct(${p.id})">Eliminar</button>
      </div>
    `;
  });

  adminProductList.innerHTML = html;
}

// --- Events ---

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

  btnClearCart.addEventListener("click", async () => {
    if (cart.length === 0) return;
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
      cart = [];
      await saveCartToDB();
      updateCartUI();
      renderCartModal();
      filterAndSort();
      showNotification("Carrito vaciado");
    }
  });

  btnConfirmOrder.addEventListener("click", async () => {
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
    await saveCartToDB();
    updateCartUI();
    modalOverlay.classList.remove("active");
    filterAndSort();
    showNotification("¡Pedido enviado por WhatsApp!");
  });

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

  const prodPhoto = document.getElementById("prodPhoto");
  const photoPreview = document.getElementById("photoPreview");
  prodPhoto.addEventListener("change", () => {
    if (prodPhoto.files && prodPhoto.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoPreview.innerHTML = `<img src="${ev.target.result}" style="max-height:100%;max-width:100%;border-radius:6px;object-fit:cover;" />`;
      };
      reader.readAsDataURL(prodPhoto.files[0]);
    } else {
      photoPreview.innerHTML = "📷 Seleccionar imagen";
    }
  });

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
