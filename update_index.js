const fs = require('fs');
let html = fs.readFileSync('boutique.html', 'utf8');

const mapping = {
  'start': 'pack-start',
  'semaine': 'pack-semaine',
  'chill': 'pack-chill',
  'party': 'party-pack',
  'fleur3g': 'fleur-3g',
  'fleur5g': 'fleur-5g',
  'fleur10g': 'fleur-10g'
};

for (const [id, slug] of Object.entries(mapping)) {
  const cardRegex = new RegExp(`(<div class="product-card[^>]*data-id="${id}"[^>]*>[\\s\\S]*?<div class="product-img-wrap">)`, 'g');
  html = html.replace(cardRegex, `$1`.replace('<div class="product-img-wrap">', `<a href="produit-${slug}.html" class="product-img-wrap">`));
  
  // Close the a tag
  const imgEndRegex = new RegExp(`(<a href="produit-${slug}.html" class="product-img-wrap">[\\s\\S]*?</div>)\\s*</div>`, 'g');
  html = html.replace(imgEndRegex, `$1</a>`);
  
  // Since the regex might be tricky, let's just do a simpler replace on the file
}

// Simpler replace for each specific product
const manualReplace = [
  { id: 'start', slug: 'pack-start', title: 'Pack "Start" (5 joints)' },
  { id: 'semaine', slug: 'pack-semaine', title: 'Pack "Semaine" (10 joints)' },
  { id: 'chill', slug: 'pack-chill', title: 'Pack "Chill" (20 joints)' },
  { id: 'party', slug: 'party-pack', title: 'Party Pack (50 joints)' },
  { id: 'fleur3g', slug: 'fleur-3g', title: 'Pochon 3 Grammes' },
  { id: 'fleur5g', slug: 'fleur-5g', title: 'Pochon 5 Grammes' },
  { id: 'fleur10g', slug: 'fleur-10g', title: 'Pochon 10 Grammes' }
];

let newHtml = fs.readFileSync('boutique.html', 'utf8');

manualReplace.forEach(p => {
  // Replace <div class="product-img-wrap"> with <a href="..." ...> inside the specific card
  // To be safe, we just find the data-id block and replace
  let parts = newHtml.split(`data-id="${p.id}"`);
  if (parts.length > 1) {
    let block = parts[1];
    block = block.replace('<div class="product-img-wrap">', `<a href="produit-${p.slug}.html" class="product-img-wrap">`);
    block = block.replace('</div>\n        </div>\n        <div class="product-info">', '</div>\n        </a>\n        <div class="product-info">');
    block = block.replace(`<h3>${p.title}</h3>`, `<a href="produit-${p.slug}.html" style="text-decoration:none; color:inherit;"><h3>${p.title}</h3></a>`);
    newHtml = parts[0] + `data-id="${p.id}"` + block;
  }
});

fs.writeFileSync('boutique.html', newHtml);
console.log('index.html updated with links');
