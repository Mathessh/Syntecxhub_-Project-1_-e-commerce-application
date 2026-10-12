document.getElementById('navbar').innerHTML = renderNavbar('home');
document.getElementById('footer').innerHTML = renderFooter();

function renderProductCard(p) {
  const outOfStock = p.stock <= 0;
  return `
    <div class="product-card">
      <div class="image-wrapper">
        <img src="${p.image || 'https://via.placeholder.com/400x300?text=Product'}" alt="${p.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x300?text=Product'">
        <span class="category-tag">${p.category}</span>
        ${getStockBadge(p.stock)}
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ''}</p>
        <div class="product-bottom">
          <div class="product-price">${formatPrice(p.price)}</div>
          <button class="add-to-cart-btn" onclick='addToCart(${JSON.stringify({_id:p._id,name:p.name,price:p.price,image:p.image,stock:p.stock})})' ${outOfStock?'disabled':''} title="${outOfStock?'Out of stock':'Add to cart'}">+</button>
        </div>
      </div>
    </div>`;
}

async function loadFeatured() {
  try {
    const products = await apiCall('/products/featured');
    document.getElementById('featuredProducts').innerHTML = products.length
      ? products.map(renderProductCard).join('')
      : '<p class="text-center" style="grid-column:1/-1;color:var(--gray-500)">No products available yet.</p>';
  } catch (e) {
    document.getElementById('featuredProducts').innerHTML = '<p class="text-center" style="grid-column:1/-1;color:var(--danger)">Failed to load products.</p>';
  }
}

async function loadBestSellers() {
  try {
    const products = await apiCall('/products/bestsellers');
    document.getElementById('bestSellers').innerHTML = products.length
      ? products.map(renderProductCard).join('')
      : '<p class="text-center" style="grid-column:1/-1;color:var(--gray-500)">No best sellers yet.</p>';
  } catch (e) {
    document.getElementById('bestSellers').innerHTML = '<p class="text-center" style="grid-column:1/-1;color:var(--danger)">Failed to load best sellers.</p>';
  }
}

loadFeatured();
loadBestSellers();
