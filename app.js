// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_jmysMG0YAU28Zr0gE46BtNDm1gUPc0g",
  authDomain: "kaya-Cannabis-11161.firebaseapp.com",
  projectId: "kaya-Cannabis-11161",
  storageBucket: "kaya-Cannabis-11161.firebasestorage.app",
  messagingSenderId: "837432075418",
  appId: "1:837432075418:web:e34f812b517d56d4d36b23"
};

// Initialisation de Firebase via la version Compat globale
let db;
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } else {
    console.error("Firebase SDK non chargé");
  }
} catch (e) {
  console.error("Erreur d'initialisation Firebase:", e);
}

// ──────────────────────────────────────────────────────────────────
// LIENS DE PAIEMENT PAR PRODUIT
// ──────────────────────────────────────────────────────────────────
const paymentLinks = {
  'start':   'https://payme.neero.io/payment?token=797a3ce7-c7a6-4a3e-8d89-869cb1eb31ff',  // 5 000F
  'semaine': 'https://payme.neero.io/payment?token=09d92378-44ff-4fae-90ac-200eb0077b1c',  // 9 000F
  'fleur':   'https://payme.neero.io/payment?token=5304de6e-6b81-40f1-98db-c08de145ad5d',  // 8 000F (5g)
  'chill':   'https://payme.neero.io/payment?token=0075606e-4a01-46f6-bd57-04abc31bd82a',  // 17 000F
  'party':   'https://payme.neero.io/payment?token=e747bef7-d76d-416c-b2ec-2d917e67a24b',  // 40 000F
};

// Liens par variante pour le Pochon Fleurs
const fleurPaymentLinks = {
  '5g':  'https://payme.neero.io/payment?token=5304de6e-6b81-40f1-98db-c08de145ad5d', // 8 000F
  '10g': 'https://payme.neero.io/payment?token=e747bef7-d76d-416c-b2ec-2d917e67a24b', // 40 000F
  '3g':  'https://payme.neero.io/payment?token=797a3ce7-c7a6-4a3e-8d89-869cb1eb31ff'  // 5 000F
};

// Produit en cours d'achat (rempli lors du clic ACHETER)
let currentOrder = {
  name: '',
  price: 0,
  productId: '',
  paymentUrl: ''
};

// ──────────────────────────────────────────────────────────────────
// MENU MOBILE
// ──────────────────────────────────────────────────────────────────
window.toggleMenu = function () {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('open');
};
window.closeMenu = function () {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.remove('open');
};

// ──────────────────────────────────────────────────────────────────
// MISE À JOUR DU PRIX QUAND LE DROPDOWN CHANGE
// ──────────────────────────────────────────────────────────────────
window.updateCardPrice = function (selectElement) {
  if (!selectElement) return;
  const card = selectElement.closest('.card-product')
    || selectElement.closest('.product-info')
    || selectElement.closest('.product-detail-info')
    || document;
  const priceDisplay = card.querySelector('.price-amount')
    || card.querySelector('.card-price-display .price-amount');
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const price = parseInt(selectedOption.getAttribute('data-price'), 10);
  if (priceDisplay && !isNaN(price)) {
    priceDisplay.innerText = price.toLocaleString('fr-FR');
  }

  // Mise à jour dynamique du lien ACHETER pour le Pochon Fleurs
  const dataId = selectElement.getAttribute('data-id');
  if (dataId === 'fleur') {
    const buyBtn = card.querySelector('[data-product-id="fleur"]')
      || card.querySelector('#buy-fleur');
    if (buyBtn && fleurPaymentLinks[selectedOption.value]) {
      buyBtn.setAttribute('data-payment-url', fleurPaymentLinks[selectedOption.value]);
      buyBtn.setAttribute('data-price', price);
    }
  }
};

// ──────────────────────────────────────────────────────────────────
// OUVERTURE DU FORMULAIRE CRM (appelé par le bouton ⚡ ACHETER)
// ──────────────────────────────────────────────────────────────────
window.openCheckout = function (productName, price, productId) {
  // Récupérer le lien de paiement
  let paymentUrl = paymentLinks[productId] || '';

  // Cas spécial : fleur avec variante
  if (productId === 'fleur') {
    const select = document.querySelector('.variant-select[data-id="fleur"]');
    if (select) {
      const variant = select.options[select.selectedIndex].value;
      paymentUrl = fleurPaymentLinks[variant] || paymentUrl;
      price = parseInt(select.options[select.selectedIndex].getAttribute('data-price'), 10) || price;
    }
  }

  // Stocker le contexte de la commande
  currentOrder = { name: productName, price, productId, paymentUrl };

  // Préparer et ouvrir le modal
  const errorEl = document.getElementById('checkoutError');
  if (errorEl) errorEl.style.display = 'none';
  
  const form = document.getElementById('checkoutForm');
  if (form) form.reset();

  // Afficher le produit dans le modal
  const titleEl = document.getElementById('checkoutProductName');
  const priceEl = document.getElementById('checkoutProductPrice');
  if (titleEl) titleEl.innerText = productName;
  if (priceEl) priceEl.innerText = price.toLocaleString('fr-FR') + ' FCFA';

  const modal = document.getElementById('checkoutModalOverlay');
  if (modal) modal.classList.add('open');
};

window.closeCheckoutModal = function () {
  const modal = document.getElementById('checkoutModalOverlay');
  if (modal) modal.classList.remove('open');
};

// ──────────────────────────────────────────────────────────────────
// SOUMISSION DU FORMULAIRE → FIREBASE (RÉSILIENT) → REDIRECTION NEERO
// ──────────────────────────────────────────────────────────────────
window.submitOrder = async function (event) {
  event.preventDefault();

  const errorEl = document.getElementById('checkoutError');
  if (errorEl) errorEl.style.display = 'none';

  const location = document.getElementById('deliveryLocation').value.trim();
  let whatsapp = document.getElementById('contactWhatsApp').value.trim();
  let telegram = document.getElementById('contactTelegram').value.trim();

  if (!whatsapp && !telegram) {
    if (errorEl) {
      errorEl.innerText = "Veuillez remplir au moins le numéro WhatsApp ou le @Telegram.";
      errorEl.style.display = 'block';
    }
    return;
  }

  if (whatsapp) {
    const cleanWhatsapp = whatsapp.replace(/\s+/g, '');
    if (!/^6\d{8}$/.test(cleanWhatsapp)) {
      if (errorEl) {
        errorEl.innerText = "Le numéro WhatsApp doit contenir 9 chiffres et commencer par 6.";
        errorEl.style.display = 'block';
      }
      return;
    }
    whatsapp = cleanWhatsapp;
  }

  const btn = document.getElementById('submitOrderBtn');
  if (btn) {
    btn.innerText = "TRAITEMENT...";
    btn.disabled = true;
  }

  // Fonction de redirection
  const redirectToPayment = () => {
    window.closeCheckoutModal();
    if (currentOrder.paymentUrl) {
      window.location.href = currentOrder.paymentUrl;
    } else {
      const successModal = document.getElementById('successModalOverlay');
      if (successModal) successModal.classList.add('open');
    }
  };

  // On encapsule l'écriture Firebase dans un timeout de 1.2s max pour ne jamais bloquer l'utilisateur
  const firebasePromise = new Promise(async (resolve, reject) => {
    try {
      if (db) {
        await db.collection("orders").add({
          product: currentOrder.name,
          totalAmount: currentOrder.price,
          location: location,
          whatsapp: whatsapp,
          telegram: telegram || '@Kayablackhat',
          paymentUrl: currentOrder.paymentUrl,
          status: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        resolve();
      } else {
        reject(new Error("Database not initialized"));
      }
    } catch (e) {
      reject(e);
    }
  });

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.warn("Firebase écriture expirée (timeout) - Redirection forcée");
      resolve();
    }, 1200); // 1.2 secondes maximum d'attente
  });

  try {
    // On attend soit l'enregistrement Firebase soit le timeout de 1.2s
    await Promise.race([firebasePromise, timeoutPromise]);
  } catch (e) {
    console.error("Erreur Firebase ignorée pour redirection rapide:", e);
  } finally {
    // Quoi qu'il arrive, on redirige pour procéder au paiement
    redirectToPayment();
  }
};

window.closeSuccessModal = function () {
  const successModal = document.getElementById('successModalOverlay');
  if (successModal) successModal.classList.remove('open');
};

// ──────────────────────────────────────────────────────────────────
// DYNAMIC COUNTDOWN TIMER
// ──────────────────────────────────────────────────────────────────
function initCountdown() {
  const countdownEl = document.querySelector('.countdown');
  if (!countdownEl) return;

  function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    let diff = midnight - now;
    if (diff < 0) diff = 0;

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

// ──────────────────────────────────────────────────────────────────
// DYNAMIC RECENT PURCHASES POPUP
// ──────────────────────────────────────────────────────────────────
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
    { name: "Pack Start KAYA", price: "5 000 FCFA" }
  ];

  function showToast() {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomTime = Math.floor(Math.random() * 15) + 2;

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
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  }

  setTimeout(showToast, 4000);
  setInterval(() => showToast(), Math.random() * 20000 + 25000);
}

// Initialisations
initCountdown();
initRecentPurchases();
window.updateCardPrice(document.querySelector('.variant-select'));
