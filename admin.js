import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_jmysMG0YAU28Zr0gE46BtNDm1gUPc0g",
  authDomain: "kaya-Cannabis-11161.firebaseapp.com",
  projectId: "kaya-Cannabis-11161",
  storageBucket: "kaya-Cannabis-11161.firebasestorage.app",
  messagingSenderId: "837432075418",
  appId: "1:837432075418:web:e34f812b517d56d4d36b23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- STATE ----
let allOrders = [];
let goals = { monthly: 500000, weekly: 100000 };
let unlockedBadges = new Set();
let currentPeriod = 'week';
let currentGoalEdit = null;

// ---- BADGE DEFINITIONS ----
const BADGES = [
  { id: 'first_order', emoji: '🌱', name: 'Premier Pas', desc: 'Première commande enregistrée', check: (o) => o.length >= 1 },
  { id: 'five_today', emoji: '🔥', name: 'En Feu', desc: '5 commandes en un seul jour', check: (o) => maxOrdersInDay(o) >= 5 },
  { id: 'total_500k', emoji: '💰', name: 'Demi-Million', desc: '500 000 FCFA de CA cumulé', check: (o) => totalRevenue(o) >= 500000 },
  { id: 'total_1m', emoji: '💎', name: 'Diamond Dealer', desc: '1 000 000 FCFA de CA cumulé', check: (o) => totalRevenue(o) >= 1000000 },
  { id: 'weekly_goal', emoji: '🚀', name: 'Objectif Hebdo', desc: "Objectif hebdomadaire dépassé", check: (o) => weeklyRevenue(o) >= goals.weekly },
  { id: 'monthly_goal', emoji: '👑', name: 'KAYA King', desc: "Objectif mensuel atteint", check: (o) => monthlyRevenue(o) >= goals.monthly },
  { id: 'ten_orders', emoji: '📦', name: 'Logisticien', desc: '10 commandes livrées', check: (o) => o.filter(x => x.status === 'delivered').length >= 10 },
  { id: 'speed_deliver', emoji: '⚡', name: 'Flash', desc: '3 commandes livrées en un jour', check: (o) => maxDeliveredInDay(o) >= 3 },
];

// ---- AUTH ----
function checkLocalAuth() {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('dashboardView').classList.add('active');
    document.getElementById('loginView').classList.remove('active');
    document.getElementById('adminEmail').innerText = "admin@kaya.local";
    initDashboard();
  } else {
    document.getElementById('loginView').classList.add('active');
    document.getElementById('dashboardView').classList.remove('active');
  }
}

// Check auth state immediately on load
checkLocalAuth();

// LOGIN ACTION
document.getElementById('loginBtn').addEventListener('click', () => {
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');
  if (password === 'kaya-stabak') {
    errorEl.innerText = "";
    sessionStorage.setItem('adminLoggedIn', 'true');
    checkLocalAuth();
  } else {
    errorEl.innerText = "Mot de passe incorrect.";
  }
});

// Bind Enter key to login
document.getElementById('adminPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('loginBtn').click();
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('adminLoggedIn');
  checkLocalAuth();
});

// ---- INIT ----
async function initDashboard() {
  await loadGoals();
  subscribeOrders();
  document.getElementById('dashboardDate').innerText = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function loadGoals() {
  try {
    const snap = await getDoc(doc(db, 'config', 'goals'));
    if (snap.exists()) goals = { ...goals, ...snap.data() };
  } catch (e) { }
}

function subscribeOrders() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  onSnapshot(q, snap => {
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    refreshAll();
  });
}

function refreshAll() {
  const filtered = filterByPeriod(allOrders, currentPeriod);
  renderKPIs(filtered);
  renderChart(filtered);
  renderObjectives();
  renderActivityFeed();
  renderOrdersTable();
  renderProductRanking();
  checkBadges();
  updatePendingBadge();
}

// ---- PERIOD FILTER ----
function filterByPeriod(orders, period) {
  if (period === 'all') return orders;
  const now = Date.now();
  const ms = { today: 86400000, week: 604800000, month: 2592000000 };
  const cutoff = now - (ms[period] || ms.week);
  return orders.filter(o => {
    if (!o.createdAt) return false;
    return o.createdAt.toMillis() >= cutoff;
  });
}

window.onPeriodChange = function () {
  currentPeriod = document.getElementById('periodSelector').value;
  refreshAll();
};

// ---- KPIs ----
function renderKPIs(orders) {
  const rev = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avg = orders.length ? Math.round(rev / orders.length) : 0;
  const delivered = orders.filter(o => o.status === 'delivered').length;

  animateCount('kpiRevenue', rev, ' FCFA');
  animateCount('kpiOrders', orders.length, '');
  animateCount('kpiAvg', avg, ' FCFA');
  animateCount('kpiDelivered', delivered, '');

  setDelta('kpiRevenueDelta', rev, '💰');
  setDelta('kpiOrdersDelta', orders.length, '📦');
  setDelta('kpiAvgDelta', avg, '🔥');
  setDelta('kpiDeliveredDelta', delivered, '✅');
}

function animateCount(id, target, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0, duration = 800, startTime = performance.now();
  function step(now) {
    const pct = Math.min((now - startTime) / duration, 1);
    const val = Math.floor(pct * target);
    el.innerText = val.toLocaleString('fr-FR') + suffix;
    if (pct < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setDelta(id, val, icon) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'kpi-delta neutral';
  el.innerText = val > 0 ? `${icon} Données en cours` : '—';
}

// ---- CHART ----
function renderChart(orders) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.clientWidth - 40;
  const H = 220;
  canvas.width = W; canvas.height = H;

  // Build last 7 days data
  const days = 7;
  const labels = [], values = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    const rev = orders
      .filter(o => o.createdAt && o.createdAt.toMillis() >= dayStart && o.createdAt.toMillis() < dayEnd)
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
    values.push(rev);
  }

  const maxVal = Math.max(...values, 1);
  const padL = 50, padR = 16, padT = 16, padB = 36;
  const cW = W - padL - padR, cH = H - padT - padB;
  const stepX = cW / (days - 1);

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (cH / 4) * i;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '10px Outfit';
    ctx.fillText(((maxVal * (4 - i)) / 4 / 1000).toFixed(0) + 'k', 4, y + 4);
  }

  // Gradient area
  const grad = ctx.createLinearGradient(0, padT, 0, H);
  grad.addColorStop(0, 'rgba(255,204,0,0.3)');
  grad.addColorStop(1, 'rgba(255,204,0,0)');
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + cH - (v / maxVal) * cH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(padL + (days - 1) * stepX, padT + cH);
  ctx.lineTo(padL, padT + cH);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2.5;
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + cH - (v / maxVal) * cH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points + labels
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + cH - (v / maxVal) * cH;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc00'; ctx.fill();
    ctx.fillStyle = '#aaa'; ctx.font = '10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, H - 6);
  });
}

// ---- ACTIVITY FEED ----
function renderActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const recent = allOrders.slice(0, 8);
  if (!recent.length) { feed.innerHTML = '<p class="empty-state">Aucune activité récente.</p>'; return; }
  feed.innerHTML = recent.map(o => {
    const isNew = o.status === 'pending';
    const time = o.createdAt ? timeAgo(o.createdAt.toDate()) : '';
    const label = isNew ? 'Nouvelle commande' : (o.status === 'delivered' ? 'Commande livrée' : 'Commande annulée');
    const dotClass = isNew ? 'new' : 'update';
    return `<div class="activity-item">
      <div class="activity-dot ${dotClass}"></div>
      <div class="activity-info">
        <div class="activity-label">${label}</div>
        <div class="activity-time">${time}</div>
      </div>
      <div class="activity-amount">${(o.totalAmount || 0).toLocaleString('fr-FR')} FCFA</div>
    </div>`;
  }).join('');
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'À l\'instant';
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)}h`;
  return `Il y a ${Math.floor(s / 86400)} jours`;
}

// ---- OBJECTIVES ----
function renderObjectives() {
  const now = Date.now();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const weekStart = now - 604800000;

  const monthlyRev = allOrders.filter(o => o.createdAt && o.createdAt.toMillis() >= monthStart.getTime()).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const weeklyRev = allOrders.filter(o => o.createdAt && o.createdAt.toMillis() >= weekStart).reduce((s, o) => s + (o.totalAmount || 0), 0);

  fillGoal('Monthly', monthlyRev, goals.monthly);
  fillGoal('Weekly', weeklyRev, goals.weekly);

  // Streak
  const streak = computeStreak();
  document.getElementById('streakCount').innerText = streak;
}

function fillGoal(key, actual, target) {
  const pct = Math.min(Math.round((actual / target) * 100), 100);
  const fill = document.getElementById(`goal${key}Fill`);
  const pctEl = document.getElementById(`goal${key}Pct`);
  const hintEl = document.getElementById(`goal${key}Hint`);

  document.getElementById(`goal${key}Actual`).innerText = actual.toLocaleString('fr-FR') + ' FCFA';
  document.getElementById(`goal${key}Target`).innerText = target.toLocaleString('fr-FR') + ' FCFA';
  pctEl.innerText = pct + '%';

  setTimeout(() => { fill.style.width = pct + '%'; }, 100);
  fill.className = 'progress-fill ' + (pct < 30 ? 'low' : pct < 70 ? 'medium' : 'high');

  const remaining = Math.max(target - actual, 0);
  if (remaining > 0) {
    const avgOrder = allOrders.length ? Math.round(allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) / allOrders.length) : 9000;
    const needed = Math.ceil(remaining / avgOrder);
    hintEl.innerText = `Il manque ${remaining.toLocaleString('fr-FR')} FCFA — soit ~${needed} commande(s) de plus !`;
  } else {
    hintEl.innerText = '🎉 Objectif atteint !';
    if (pct === 100) launchConfetti();
  }
}

function computeStreak() {
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
    const dayRev = allOrders.filter(o => o.createdAt && o.createdAt.toMillis() >= d.getTime() && o.createdAt.toMillis() < nextD.getTime()).reduce((s, o) => s + (o.totalAmount || 0), 0);
    const dailyGoal = Math.round(goals.weekly / 7);
    if (dayRev >= dailyGoal) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// ---- ORDERS TABLE ----
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const emptyEl = document.getElementById('ordersEmpty');
  if (!tbody) return;
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  let orders = statusFilter === 'all' ? allOrders : allOrders.filter(o => o.status === statusFilter);

  if (!orders.length) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  tbody.innerHTML = orders.map(o => {
    const date = o.createdAt ? o.createdAt.toDate().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const contact = [o.whatsapp ? `📱 ${o.whatsapp}` : '', o.telegram ? `✈️ ${o.telegram}` : ''].filter(Boolean).join('<br>') || 'N/A';
    const items = (o.items || []).map(i => `${i.qty}× ${i.name}`).join('<br>');
    const badgeClass = o.status === 'delivered' ? 'badge-delivered' : o.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending';
    const statusLabel = o.status === 'delivered' ? 'Livrée' : o.status === 'cancelled' ? 'Annulée' : 'En attente';
    const actions = o.status === 'pending'
      ? `<button class="btn-action" onclick="window.updateStatus('${o.id}','delivered')">✅ Livrer</button>
         <button class="btn-action cancel" onclick="window.updateStatus('${o.id}','cancelled')" style="margin-left:4px">❌</button>`
      : '—';
    return `<tr>
      <td>${date}</td><td>${contact}</td><td>${o.location || 'N/A'}</td>
      <td><div class="items-list">${items}</div></td>
      <td class="total-col">${(o.totalAmount || 0).toLocaleString('fr-FR')} FCFA</td>
      <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

window.filterOrders = renderOrdersTable;

window.updateStatus = async function (id, status) {
  await updateDoc(doc(db, 'orders', id), { status });
};

function updatePendingBadge() {
  const cnt = allOrders.filter(o => o.status === 'pending').length;
  const el = document.getElementById('pendingBadge');
  if (!el) return;
  el.style.display = cnt > 0 ? 'inline-block' : 'none';
  el.innerText = cnt;
}

// ---- PRODUCTS ----
function renderProductRanking() {
  const rankEl = document.getElementById('productRanking');
  if (!rankEl) return;
  const totals = {};
  allOrders.forEach(o => (o.items || []).forEach(item => {
    const key = item.name.split('(')[0].trim();
    totals[key] = (totals[key] || 0) + (item.price * item.qty);
  }));
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const grand = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  rankEl.innerHTML = sorted.map(([name, rev], i) => {
    const pct = Math.round((rev / grand) * 100);
    return `<div class="product-rank-item">
      <div class="rank-num">${medals[i] || '·'}</div>
      <div class="rank-info">
        <div class="rank-name">${name}</div>
        <div class="rank-bar-wrapper">
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%"></div></div>
          <div class="rank-pct">${pct}%</div>
        </div>
      </div>
      <div class="rank-amount">${rev.toLocaleString('fr-FR')} FCFA</div>
    </div>`;
  }).join('');

  renderProductChart(sorted, grand);
}

function renderProductChart(sorted, grand) {
  const canvas = document.getElementById('productChart');
  if (!canvas || !sorted.length) return;
  const W = canvas.parentElement.clientWidth - 48, H = 300;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const colors = ['#ffcc00', '#f97316', '#22c55e', '#3b82f6', '#a855f7'];
  const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 40;
  let angle = -Math.PI / 2;
  sorted.forEach(([name, rev], i) => {
    const slice = (rev / grand) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath(); ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    // Label
    const mid = angle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(mid), ly = cy + (r * 0.65) * Math.sin(mid);
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px Outfit'; ctx.textAlign = 'center';
    ctx.fillText(Math.round((rev / grand) * 100) + '%', lx, ly);
    angle += slice;
  });
  // Center hole
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1c1c'; ctx.fill();
}

// ---- BADGES ----
function checkBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;
  const newly = [];
  BADGES.forEach(b => {
    const unlocked = b.check(allOrders);
    if (unlocked && !unlockedBadges.has(b.id)) {
      unlockedBadges.add(b.id);
      newly.push(b);
    }
  });
  grid.innerHTML = BADGES.map(b => {
    const unlocked = unlockedBadges.has(b.id) || b.check(allOrders);
    return `<div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="badge-emoji">${b.emoji}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      ${unlocked ? '<div class="badge-date">✅ Débloqué</div>' : '<div class="badge-locked-label">🔒 Non débloqué</div>'}
    </div>`;
  }).join('');
  if (newly.length) showBadgeNotif(newly[0]);
}

function showBadgeNotif(b) {
  const el = document.getElementById('badgeNotif');
  document.getElementById('badgeNotifIcon').innerText = b.emoji;
  document.getElementById('badgeNotifName').innerText = b.name;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ---- CONFETTI ----
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: -20,
    vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4 + 2,
    color: ['#ffcc00', '#f97316', '#22c55e', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 5)],
    r: Math.random() * 6 + 3, rot: Math.random() * 360, rSpeed: (Math.random() - 0.5) * 5
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rSpeed;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore();
    });
    frame++;
    if (frame < 150) requestAnimationFrame(draw);
    else canvas.style.display = 'none';
  }
  requestAnimationFrame(draw);
}

// ---- GOAL MODAL ----
window.openGoalModal = function (type) {
  currentGoalEdit = type;
  document.getElementById('goalModalTitle').innerText = type === 'monthly' ? 'Objectif Mensuel' : 'Objectif Hebdomadaire';
  document.getElementById('goalInput').value = goals[type] || '';
  document.getElementById('goalModal').classList.add('open');
};
window.closeGoalModal = function () { document.getElementById('goalModal').classList.remove('open'); };
window.saveGoal = async function () {
  const val = parseInt(document.getElementById('goalInput').value, 10);
  if (!val || val <= 0) return;
  goals[currentGoalEdit] = val;
  try { await setDoc(doc(db, 'config', 'goals'), goals); } catch (e) { }
  window.closeGoalModal();
  renderObjectives();
};

// ---- VIEW SWITCHING ----
window.switchView = function (name, el) {
  document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name)?.classList.add('active');
  el?.classList.add('active');
  if (name === 'products') renderProductRanking();
  if (name === 'badges') checkBadges();
};

// ---- HELPERS ----
function totalRevenue(o) { return o.reduce((s, x) => s + (x.totalAmount || 0), 0); }
function monthlyRevenue(o) {
  const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
  return o.filter(x => x.createdAt && x.createdAt.toMillis() >= ms.getTime()).reduce((s, x) => s + (x.totalAmount || 0), 0);
}
function weeklyRevenue(o) {
  const ws = Date.now() - 604800000;
  return o.filter(x => x.createdAt && x.createdAt.toMillis() >= ws).reduce((s, x) => s + (x.totalAmount || 0), 0);
}
function maxOrdersInDay(o) {
  const map = {};
  o.forEach(x => { if (x.createdAt) { const d = x.createdAt.toDate().toDateString(); map[d] = (map[d] || 0) + 1; } });
  return Math.max(0, ...Object.values(map));
}
function maxDeliveredInDay(o) {
  const map = {};
  o.filter(x => x.status === 'delivered').forEach(x => { if (x.createdAt) { const d = x.createdAt.toDate().toDateString(); map[d] = (map[d] || 0) + 1; } });
  return Math.max(0, ...Object.values(map));
}

// ---- DYNAMIC RESIZE FOR CHARTS ----
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (document.getElementById('view-dashboard').classList.contains('active')) {
      const filtered = filterByPeriod(allOrders, currentPeriod);
      renderChart(filtered);
    } else if (document.getElementById('view-products').classList.contains('active')) {
      renderProductRanking();
    }
  }, 250);
});
