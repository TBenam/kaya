import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_jmysMG0YAU28Zr0gE46BtNDm1gUPc0g",
  authDomain: "kaya-Cannabis-11161.firebaseapp.com",
  projectId: "kaya-Cannabis-11161",
  storageBucket: "kaya-Cannabis-11161.firebasestorage.app",
  messagingSenderId: "837432075418",
  appId: "1:837432075418:web:e34f812b517d56d4d36b23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];

// MENU MOBILE
window.toggleMenu = function () {
  document.getElementById('nav').classList.toggle('open');
};
window.closeMenu = function () {
  document.getElementById('nav').classList.remove('open');
};

// Liens de paiement par variante pour le Pochon Fleurs
const fleurPaymentLinks = {
  '5g': 'https://payme.neero.io/payment?token=5304de6e-6b81-40f1-98db-c08de145ad5d', // 8 000F
  '10g': 'https://payme.neero.io/payment?token=e747bef7-d76d-416c-b2ec-2d917e67a24b', // 40 000F → pas de lien 10g, on utilise le plus proche
  '3g': 'https://payme.neero.io/payment?token=797a3ce7-c7a6-4a3e-8d89-869cb1eb31ff'  // 5 000F
};

// MISE À JOUR DU PRIX QUAND LE DROPDOWN CHANGE
window.updateCardPrice = function (selectElement) {
  if (!selectElement) return;
  const card = selectElement.closest('.card-product') || selectElement.closest('.product-info') || selectElement.closest('.product-detail-info') || document;
  const priceDisplay = card.querySelector('.price-amount') || card.querySelector('.card-price-display .price-amount');
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const price = parseInt(selectedOption.getAttribute('data-price'), 10);
  if (priceDisplay && !isNaN(price)) {
    priceDisplay.innerText = price.toLocaleString('fr-FR');
  }

  // Mise à jour dynamique du lien ACHETER pour le Pochon Fleurs (data-id="fleur")
  const dataId = selectElement.getAttribute('data-id');
  if (dataId === 'fleur') {
    const buyBtn = card.querySelector('#buy-fleur') || document.getElementById('buy-fleur');
    if (buyBtn && fleurPaymentLinks[selectedOption.value]) {
      buyBtn.href = fleurPaymentLinks[selectedOption.value];
    }
  }
};

// AJOUT AU PANIER DEPUIS LA CARTE
window.addFromCard = function (idPrefix, baseName, buttonElement) {
  const card = buttonElement.closest('.card-product') || buttonElement.closest('.product-info') || buttonElement.closest('.product-detail-info');
  const select = card.querySelector('.variant-select');

  const selectedOption = select.options[select.selectedIndex];
  const price = parseInt(selectedOption.getAttribute('data-price'), 10);

  const fullId = idPrefix + '-' + selectedOption.value;
  const fullName = baseName + ' (' + selectedOption.value + ')';

  addToCart(fullId, fullName, price);
};

// LOGIQUE DU PANIER
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  const cartBtn = document.getElementById('cartBtn');
  cartBtn.style.transform = 'scale(1.2)';
  setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);

  updateCartUI();
  window.toggleCart(true);
}

window.removeFromCart = function (id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
};

function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.innerText = totalQty;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
    totalEl.innerText = '0 FCFA';
    return;
  }

  let html = '';
  let total = 0;

  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;

    html += `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-price">${item.price} FCFA x ${item.qty}</span>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✖</button>
      </div>
    `;
  });

  itemsEl.innerHTML = html;
  totalEl.innerText = total.toLocaleString('fr-FR') + ' FCFA';
}

window.toggleCart = function (forceOpen = false) {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');

  if (forceOpen === true) {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  } else {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }
};

// CHECKOUT LOGIC
window.checkout = function () {
  if (cart.length === 0) {
    alert("Votre panier est vide !");
    return;
  }

  // Fermer le panier
  window.toggleCart();

  // Ouvrir le modal de checkout form
  document.getElementById('checkoutError').style.display = 'none';
  document.getElementById('checkoutForm').reset();
  document.getElementById('checkoutModalOverlay').classList.add('open');
};

window.closeCheckoutModal = function () {
  document.getElementById('checkoutModalOverlay').classList.remove('open');
};

window.submitOrder = async function (event) {
  event.preventDefault();

  const errorEl = document.getElementById('checkoutError');
  errorEl.style.display = 'none';

  const location = document.getElementById('deliveryLocation').value.trim();
  let whatsapp = document.getElementById('contactWhatsApp').value.trim();
  let telegram = document.getElementById('contactTelegram').value.trim();

  if (!whatsapp && !telegram) {
    errorEl.innerText = "Erreur : Veuillez remplir au moins le numéro WhatsApp ou le @Telegram.";
    errorEl.style.display = 'block';
    return;
  }

  // Validate phone number format (9 digits starting with 6) if whatsapp is provided
  if (whatsapp) {
    // Remove spaces from user input
    const cleanWhatsapp = whatsapp.replace(/\s+/g, '');
    if (!/^6\d{8}$/.test(cleanWhatsapp)) {
      errorEl.innerText = "Erreur : Le numéro WhatsApp doit contenir exactement 9 chiffres et commencer par 6.";
      errorEl.style.display = 'block';
      return;
    }
  }

  // Disable button to prevent double submission
  const btn = document.getElementById('submitOrderBtn');
  btn.innerText = "TRAITEMENT...";
  btn.disabled = true;

  let total = 0;
  cart.forEach(item => total += (item.price * item.qty));

  try {
    const docRef = await addDoc(collection(db, "orders"), {
      items: cart,
      totalAmount: total,
      location: location,
      whatsapp: whatsapp,
      telegram: telegram,
      status: "pending",
      createdAt: serverTimestamp()
    });

    // Success
    window.closeCheckoutModal();
    document.getElementById('successModalOverlay').classList.add('open');

    // Clear cart
    cart = [];
    updateCartUI();

  } catch (e) {
    console.error("Error adding document: ", e);
    errorEl.innerText = "Une erreur est survenue. Veuillez réessayer.";
    errorEl.style.display = 'block';
  } finally {
    btn.innerText = "CONFIRMER MA COMMANDE";
    btn.disabled = false;
  }
};

window.closeSuccessModal = function () {
  document.getElementById('successModalOverlay').classList.remove('open');
};

// DYNAMIC COUNTDOWN TIMER
function initCountdown() {
  const countdownEl = document.querySelector('.countdown');
  if (!countdownEl) return;

  function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    let diff = midnight - now;
    if (diff < 0) {
      diff = 0;
    }

    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const cdBoxes = countdownEl.querySelectorAll('.cd-box');
    if (cdBoxes.length >= 4) {
      cdBoxes[0].innerHTML = `00 <small>JOURS</small>`;
      cdBoxes[1].innerHTML = `${String(hours).padStart(2, '0')} <small>HEURES</small>`;
      cdBoxes[2].innerHTML = `${String(minutes).padStart(2, '0')} <small>MINUTES</small>`;
      cdBoxes[3].innerHTML = `${String(seconds).padStart(2, '0')} <small>SECONDES</small>`;
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// DYNAMIC RECENT PURCHASES POPUP
function initRecentPurchases() {
  let container = document.querySelector('.purchase-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'purchase-toast-container';
    document.body.appendChild(container);
  }

  const cities = ["Douala (Bonapriso)", "Yaoundé (Bastos)", "Douala (Kribi Road)", "Yaoundé (Mvan)", "Douala (Akwa)", "Yaoundé (Omnisports)", "Limbe", "Kribi", "Bafoussam", "Garoua"];
  const products = [
    { name: "Pack Semaine KAYA", price: "9 000 FCFA" },
    { name: "Pochon Fleurs Premium (5g)", price: "8 000 FCFA" },
    { name: "Pack Chill KAYA", price: "17 000 FCFA" },
    { name: "Party Pack KAYA", price: "40 000 FCFA" },
    { name: "Pochon Fleurs Premium (10g)", price: "15 000 FCFA" },
    { name: "Pack Start KAYA", price: "5 000 FCFA" }
  ];

  function showToast() {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomTime = Math.floor(Math.random() * 15) + 2; // 2 à 17 minutes

    const toast = document.createElement('div');
    toast.className = 'purchase-toast';
    toast.innerHTML = `
      <div class="purchase-toast-icon">🔥</div>
      <div class="purchase-toast-content">
        <span class="purchase-toast-title">Nouvelle commande !</span>
        <span class="purchase-toast-desc">Un client à <strong>${randomCity}</strong> a acheté un <strong>${randomProduct.name}</strong> (${randomProduct.price}) il y a ${randomTime} min.</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 6000);
  }

  // Premier toast après 4 secondes
  setTimeout(showToast, 4000);

  // Répéter à intervalles réguliers (toutes les 25 à 45 secondes)
  setInterval(() => {
    showToast();
  }, Math.random() * 20000 + 25000);
}

// Initialisations automatiques
initCountdown();
initRecentPurchases();
window.updateCardPrice(document.querySelector('.variant-select'));

