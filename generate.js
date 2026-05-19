const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const products = [
  { id: 'start', slug: 'pack-start', name: 'Pack "Start" – 5 joints', price: 5000, oldPrice: '', img: 'images/pack_start.png', badge: 'Entrée de Gamme', stars: '★★★★★', specs: ['🍀 CBD : 12%', '🏡 Culture : GreenHouse', '✨ Effet : Chill'], desc: `Découvrez notre pack d'initiation. 5 joints de qualité pré-roulés avec amour. Idéal pour une première expérience douce et agréable.`, unit: '1 000F / joint' },
  { id: 'semaine', slug: 'pack-semaine', name: 'Pack "Semaine" – 10 joints', price: 9000, oldPrice: '10 000F', img: 'images/pack_semaine.png', badge: 'Best Seller', stars: '★★★★★', specs: ['🍀 CBD : 15%', '🏡 Culture : Mix Indoor', '⚡ Effet : Équilibre'], desc: `Le pack idéal pour votre semaine. 10 joints de CBD Premium à un prix avantageux. L'équilibre parfait entre détente et énergie.`, unit: 'old-price' },
  { id: 'chill', slug: 'pack-chill', name: 'Pack "Chill" – 20 joints', price: 17000, oldPrice: '20 000F', img: 'images/pack_chill.png', badge: 'Haute Qualité', stars: '★★★★★', specs: ['🍀 CBD : 18%', '💎 Culture : Indoor', '🌙 Effet : Relax'], desc: `Une sélection haut de gamme pour des moments de relaxation profonde. 20 joints de pure qualité Indoor, riches en saveurs et en effets apaisants.`, unit: 'old-price' },
  { id: 'party', slug: 'party-pack', name: 'Party Pack – 50 joints', price: 40000, oldPrice: '50 000F', img: 'images/pack_party.png', badge: 'Gros Volume', stars: '★★★★★', specs: ['🍀 CBD : 20%', '👑 Culture : Premium Indoor', '🎉 Effet : Social / Party'], desc: `Parfait pour vos événements ou pour faire des réserves. 50 joints Premium, roulés à la perfection, offrant un effet festif et convivial exceptionnel.`, unit: 'old-price' },
  { id: 'fleur3g', slug: 'fleur-3g', name: 'Pochon Fleurs – 3 Grammes', price: 5000, oldPrice: '', img: 'images/fleur_3g.png', badge: 'Découverte', stars: '★★★★★', specs: ['🍀 CBD : 22%', '💎 Variété : Lemon Haze (Sativa)', '⚡ Effet : Énergie'], desc: `Un pochon de 3 grammes pour découvrir nos fleurs brutes. Des têtes denses, manucurées avec soin, parfaites pour les puristes qui aiment rouler eux-mêmes.`, unit: '≈ 1 666F / g' },
  { id: 'fleur5g', slug: 'fleur-5g', name: 'Pochon Fleurs – 5 Grammes', price: 8000, oldPrice: '', img: 'images/fleur_5g.png', badge: 'Le Choix des Connaisseurs', stars: '★★★★★', specs: ['🍀 CBD : 24%', '💎 Variété : Purple Punch (Indica)', '🌙 Effet : Détente Intense'], desc: `Le format préféré de nos clients réguliers. 5 grammes de fleurs Indoor aux arômes puissants et à l'effet profondément relaxant.`, unit: '1 600F / g' },
  { id: 'fleur10g', slug: 'fleur-10g', name: 'Pochon Fleurs – 10 Grammes', price: 15000, oldPrice: '', img: 'images/fleur_10g.png', badge: 'Premium Collection', stars: '★★★★★', specs: ['🍀 CBD : 25%', '💎 Variété : OG Kush / Kaya Special', '☯️ Effet : Harmonie'], desc: `Notre offre la plus généreuse pour les vrais connaisseurs. 10 grammes de notre meilleure récolte, affinée pour développer un profil terpénique exceptionnel.`, unit: '1 500F / g' }
];

const header = indexHtml.split('<!-- HERO -->')[0];
const footer = '<!-- FOOTER -->' + indexHtml.split('<!-- FOOTER -->')[1];

products.forEach(p => {
  const oldPriceHtml = p.oldPrice ? `<span class="product-unit old-price">${p.oldPrice}</span>` : `<span class="product-unit">${p.unit}</span>`;
  
  const content = `
<!-- PRODUCT DETAIL -->
<section class="product-detail-section" style="padding: 120px 0 80px; min-height: 80vh;">
  <div class="container">
    <a href="index.html" style="color: var(--gold); text-decoration: none; font-weight: 700; display: inline-block; margin-bottom: 30px;">← Retour à la boutique</a>
    <div class="product-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 50px; align-items: center;">
      
      <div class="product-detail-img-wrap" style="background: var(--dark2); border-radius: 12px; border: 1px solid rgba(255,209,1,0.2); padding: 40px; text-align: center; position: relative;">
        <div class="product-badge" style="position: absolute; top: 20px; left: 20px; background: var(--gold); color: #000; padding: 6px 12px; border-radius: 4px; font-weight: 900;">${p.badge}</div>
        <img src="${p.img}" alt="${p.name}" style="width: 100%; max-width: 400px; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
        <div class="fallback-product-img" style="display: none; height: 300px; background: linear-gradient(135deg, #121212, #242422); align-items: center; justify-content: center; font-size: 4rem; color: rgba(255,255,255,0.8); border-radius: 8px; flex-direction: column;">📦<span style="font-size: 1rem; color: var(--gold); margin-top: 10px; font-weight: 900;">KAYA PREMIUM</span></div>
      </div>
      
      <div class="product-detail-info">
        <h1 style="font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 2.8rem); color: #fff; margin-bottom: 15px;">${p.name}</h1>
        <div class="product-stars" style="color: var(--gold); font-size: 1.2rem; margin-bottom: 20px;">${p.stars} <span style="color: var(--text2); font-size: 0.9rem;">(120+ avis)</span></div>
        
        <div class="product-price-row" style="display: flex; align-items: baseline; gap: 15px; margin-bottom: 30px;">
          <span class="product-price" style="font-size: 2.2rem; font-weight: 900; color: var(--gold);">${p.price.toLocaleString('fr-FR')} <small style="font-size: 1rem;">FCFA</small></span>
          ${oldPriceHtml}
        </div>
        
        <p style="color: var(--text2); font-size: 1.05rem; line-height: 1.7; margin-bottom: 30px;">${p.desc}</p>
        
        <div class="product-spec-badges" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 40px;">
          ${p.specs.map(s => `<span class="spec-badge" style="font-size: 0.85rem; padding: 8px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text);">${s}</span>`).join('')}
        </div>
        
        <button class="btn-add" style="font-size: 1.1rem; padding: 18px; width: 100%; max-width: 400px; background: var(--gold); color: #000; border: none; border-radius: 6px; font-weight: 900; cursor: pointer; text-transform: uppercase;" onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price})">🛒 Ajouter au Panier</button>
        
        <div style="margin-top: 30px; padding: 20px; background: rgba(255,209,1,0.05); border: 1px solid rgba(255,209,1,0.1); border-radius: 8px;">
          <p style="font-size: 0.9rem; color: var(--text2); display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">🛵 <strong>Livraison Express :</strong> Moins de 2H à Douala et Yaoundé</p>
          <p style="font-size: 0.9rem; color: var(--text2); display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">🤐 <strong>Discrétion 100% :</strong> Colis scellé, sans odeur, livreur anonyme</p>
          <p style="font-size: 0.9rem; color: var(--text2); display: flex; align-items: center; gap: 10px;">🔒 <strong>Paiement Sécurisé :</strong> MTN MoMo & Orange Money</p>
        </div>
      </div>
      
    </div>
  </div>
</section>
  `;
  
  // replace nav links in header to use absolute 'index.html#...'
  let headerHtml = header.replace(/href="#/g, 'href="index.html#');
  
  // Update the title
  headerHtml = headerHtml.replace(/<title>.*?<\/title>/, `<title>${p.name} - KAYA Premium CBD</title>`);
  
  const pageContent = headerHtml + content + footer;
  fs.writeFileSync(`produit-${p.slug}.html`, pageContent);
  console.log('Created produit-' + p.slug + '.html');
});
