const fs = require('fs');
let indexHtml = fs.readFileSync('boutique.html', 'utf8');

const products = [
  { id: 'start', slug: 'pack-start', title: 'PACK START KAYA', img: 'images/imagespack_start.png', badge: 'DECOUVERTE', tags: ['Cannabis 12%', 'GreenHouse', 'Initiation'], desc: `Découvrez notre pack d'initiation. 5 joints de qualité pré-roulés avec amour. Idéal pour une première expérience douce et agréable.`, price: 5000, options: '<option value="5" data-price="5000">5 joints (1000F/u) - 5 000F</option>' },
  { id: 'semaine', slug: 'semaine', title: 'PACK SEMAINE KAYA', img: 'images/imagespack_semaine.png', badge: 'BESTSELLER', tags: ['Cannabis 15%', 'Indoor', 'Chill'], desc: `Le pack idéal pour votre semaine. 10 joints de Cannabis Premium à un prix avantageux. L'équilibre parfait entre détente et énergie.`, price: 9000, options: '<option value="10" data-price="9000">10 joints (900F/u) - 9 000F</option><option value="15" data-price="13000">15 joints (866F/u) - 13 000F</option>' },
  { id: 'fleur', slug: 'fleur', title: 'POCHON FLEURS PREMIUM', img: 'images/imagesfleur_5g.png', badge: 'BESTSELLER', tags: ['Cannabis 24%', 'Purple Punch'], desc: `Le format préféré de nos clients réguliers. 5 grammes de fleurs Indoor aux arômes puissants et à l'effet profondément relaxant.`, price: 8000, options: '<option value="5g" data-price="8000">5g (1600F/g) - 8 000F</option><option value="10g" data-price="15000">10g (1500F/g) - 15 000F</option><option value="3g" data-price="5000">3g (1666F/g) - 5 000F</option>' },
  { id: 'chill', slug: 'chill', title: 'PACK CHILL KAYA', img: 'images/imagespack_chill.png', badge: 'BESTSELLER', tags: ['Cannabis 18%', 'Relax'], desc: `Une sélection haut de gamme pour des moments de relaxation profonde. 20 joints de pure qualité Indoor, riches en saveurs et en effets apaisants.`, price: 17000, options: '<option value="20" data-price="17000">20 joints (850F/u) - 17 000F</option>' },
  { id: 'party', slug: 'party', title: 'PARTY PACK KAYA', img: 'images/imagespack_party.png', badge: 'PROMO', tags: ['Cannabis 20%', 'Gros Volume'], desc: `Parfait pour vos événements ou pour faire des réserves. 50 joints Premium, roulés à la perfection, offrant un effet festif et convivial exceptionnel.`, price: 40000, options: '<option value="50" data-price="40000">50 joints (800F/u) - 40 000F</option>' }
];

const header = indexHtml.split('<section class="hero-banner"')[0];
let headerHtml = header.replace(/href="#/g, 'href="boutique.html#');

const footer = '<section class="footer-reviews">' + indexHtml.split('<section class="footer-reviews">')[1];

products.forEach(p => {
  const content = `
<!-- PRODUCT DETAIL SECTION -->
<section class="tops-ventes" style="padding: 150px 0 80px;">
  <div class="container">
    <a href="boutique.html" class="yellow" style="text-decoration: none; font-weight: 700; display: inline-block; margin-bottom: 30px;">← Retour à la boutique</a>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 50px; align-items: start;">
      
      <!-- Product Image -->
      <div class="card-product" style="max-width: 500px; margin: 0; cursor: default;">
        <div class="card-badge">${p.badge}</div>
        <div class="card-image-box" style="height: 400px;">
          <img src="${p.img}" alt="${p.title}" class="card-img" style="object-fit: cover; height: 100%;">
        </div>
      </div>
      
      <!-- Product Info -->
      <div class="product-info">
        <h1 class="section-title" style="text-align: left; margin-bottom: 20px;">${p.title}</h1>
        <div class="card-rating" style="margin-bottom: 20px;">
          <span class="stars" style="font-size: 1.2rem;">★★★★★</span> <span class="rating-note" style="font-size: 1rem;">5.0/5</span>
        </div>
        
        <p class="section-desc" style="text-align: left; margin-bottom: 30px; font-size: 1.1rem; color: #eee;">${p.desc}</p>
        
        <div class="card-tags" style="margin-bottom: 20px; justify-content: flex-start;">
          ${p.tags.map(t => `<span class="tag" style="font-size: 0.9rem; padding: 6px 12px;">${t}</span>`).join('')}
        </div>

        <div class="card-price-row" style="margin-bottom: 25px; margin-top: 0; justify-content: flex-start; gap: 15px; align-items: baseline;">
          <span class="card-price-label" style="font-size: 1rem; color: var(--text-muted);">Prix :</span>
          <span class="card-price-display" style="font-size: 2.2rem; font-weight: 900; color: var(--gold);"><span class="price-amount">${p.price.toLocaleString('fr-FR')}</span> <span class="card-price-currency" style="font-size: 1.2rem; color: #fff;">FCFA</span></span>
        </div>
        
        <div class="card-selector" style="margin-bottom: 30px;">
          <select class="variant-select" data-id="${p.id}" onchange="updateCardPrice(this)" style="font-size: 1rem; padding: 15px; width: 100%;">
            ${p.options}
          </select>
        </div>
        
        <button class="btn-yellow-solid" style="width: 100%; justify-content: center; padding: 18px; font-size: 1.1rem;" onclick="openCheckout('${p.title}', ${p.price}, '${p.id}')">⚡ ACHETER</button>
        
        <div style="margin-top: 30px; padding: 20px; background: rgba(255,209,1,0.05); border: 1px solid rgba(255,209,1,0.1); border-radius: 8px;">
          <p style="font-size: 0.95rem; color: #ccc; margin-bottom: 12px;">🛵 <strong>Livraison Express :</strong> Anonyme sous 2-3H (Douala/Yaoundé)</p>
          <p style="font-size: 0.95rem; color: #ccc; margin-bottom: 12px;">🤐 <strong>Discrétion 100% :</strong> Colis scellé, sans odeur</p>
          <p style="font-size: 0.95rem; color: #ccc; margin: 0;">🔒 <strong>Paiement Sécurisé :</strong> MTN MoMo & Orange Money</p>
        </div>
      </div>
      
    </div>
  </div>
</section>
`;

  const pageHtml = headerHtml.replace(/<title>.*?<\/title>/, `<title>${p.title} - KAYA Premium Cannabis</title>`) + content + footer;
  fs.writeFileSync(`produit-${p.slug}.html`, pageHtml);
  console.log(`Generated produit-${p.slug}.html`);
});

console.log('Generation completed.');
