document.getElementById('navbar').innerHTML = renderNavbar('cart');
document.getElementById('footer').innerHTML = renderFooter();

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartContent');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 4rem; margin-bottom: 16px;">🛒</div>
        <h2 style="font-family: var(--font-display); margin-bottom: 8px;">Your Shopping Basket is Empty</h2>
        <p style="color: var(--gray-500); max-width: 450px; margin: 0 auto 24px;">
          Looks like you haven't added anything yet. Discover our fresh groceries, grains, and pantry essentials.
        </p>
        <a href="/products.html" class="btn btn-primary btn-lg">Explore Fresh Products</a>
      </div>`;
    return;
  }

  const subtotal = getCartTotal();
  const coupon = getAppliedCoupon();
  let discount = 0;
  let freeShippingByCoupon = false;

  if (coupon) {
    if (coupon.code === 'CHANDRA10') discount = Math.round(subtotal * 0.10);
    if (coupon.code === 'WELCOME50' && subtotal >= 200) discount = 50;
    if (coupon.code === 'FREESHIP' || coupon.freeShipping) freeShippingByCoupon = true;
  }

  const delivery = (subtotal > 500 || freeShippingByCoupon) ? 0 : 30;
  const total = Math.max(0, subtotal - discount + delivery);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Free shipping progress meter
  const neededForFree = Math.max(0, 500 - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / 500) * 100));

  container.innerHTML = `
    <!-- Free delivery progress meter -->
    <div class="free-shipping-bar" style="margin-bottom: 28px; padding: 16px 20px;">
      <div class="free-shipping-text" style="font-size: 0.95rem; justify-content: space-between;">
        <span>🚚 ${neededForFree === 0 || freeShippingByCoupon ? '<b>Congratulations! You unlocked FREE Standard Delivery!</b>' : `Add <b>₹${neededForFree.toFixed(0)}</b> more to qualify for <b>FREE Delivery</b>!`}</span>
        <span style="font-weight: 700; color: var(--primary-700);">${progressPct}%</span>
      </div>
      <div class="free-shipping-progress" style="height: 8px; margin-top: 8px;">
        <div class="free-shipping-fill" style="width: ${freeShippingByCoupon ? 100 : progressPct}%"></div>
      </div>
    </div>

    <div class="cart-container">
      <div class="cart-items">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--gray-200); padding-bottom: 10px;">
          <h3 style="font-size: 1.1rem; font-family: var(--font-display);">Items in Basket (${itemCount})</h3>
          <button class="btn btn-sm btn-outline" onclick="emptyEntireCart()" style="font-size: 0.75rem; color: var(--danger); border-color: var(--danger);">
            🗑️ Clear Basket
          </button>
        </div>

        ${cart.map(item => `
          <div class="cart-item">
            <img src="${item.image || getFallbackImage(item.name, item.category)}" alt="${item.name}" onerror="this.onerror=null; this.src=getFallbackImage('${item.name}')">
            <div class="cart-item-info">
              <h3>${item.name}</h3>
              <div class="price">${formatPrice(item.price)} each</div>
              ${item.stock <= 5 ? `<small style="color:var(--warning); font-weight:600;">Only ${item.stock} left in stock</small>` : ''}
            </div>
            <div class="quantity-controls">
              <button onclick="changeQty('${item.productId}', -1)">−</button>
              <span>${item.quantity}</span>
              <button onclick="changeQty('${item.productId}', 1)">+</button>
            </div>
            <div style="font-weight: 700; min-width: 90px; text-align: right; color: var(--primary-800); font-size: 1.05rem;">
              ${formatPrice(item.price * item.quantity)}
            </div>
            <button class="remove-btn" onclick="removeItem('${item.productId}')" title="Remove item">✕</button>
          </div>
        `).join('')}
      </div>

      <div class="cart-summary">
        <h3>Order Summary</h3>

        <!-- Promo Code Input -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 0.82rem; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; display: block;">Apply Promo Coupon</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="cartPromoInput" placeholder="e.g. CHANDRA10" style="flex: 1; padding: 10px 12px; border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm); text-transform: uppercase; font-weight: 700; font-size: 0.85rem;" value="${coupon?.code || ''}">
            <button class="btn btn-sm btn-primary" onclick="applyCartCoupon()">Apply</button>
          </div>
          ${coupon ? `
            <div class="coupon-badge-active" style="margin-top: 10px;">
              <span>🎟️ Promo <b>${coupon.code}</b> active</span>
              <button onclick="removeCartCoupon()">✕ Remove</button>
            </div>
          ` : `
            <div style="font-size: 0.72rem; color: var(--gray-500); margin-top: 6px;">
              Try: <b style="color:var(--primary-700); cursor:pointer;" onclick="quickApplyCoupon('CHANDRA10')">CHANDRA10</b> (10% off), <b style="color:var(--primary-700); cursor:pointer;" onclick="quickApplyCoupon('FREESHIP')">FREESHIP</b>
            </div>
          `}
        </div>

        <div class="summary-row">
          <span>Items Subtotal (${itemCount})</span>
          <span>${formatPrice(subtotal)}</span>
        </div>

        ${discount > 0 ? `
          <div class="summary-row" style="color: var(--primary-700); font-weight: 600;">
            <span>Coupon Discount</span>
            <span>-${formatPrice(discount)}</span>
          </div>
        ` : ''}

        <div class="summary-row">
          <span>Standard Delivery</span>
          <span>${delivery === 0 ? '<span style="color:var(--primary-600); font-weight:700;">FREE</span>' : formatPrice(delivery)}</span>
        </div>

        <div class="summary-row total" style="margin-top: 14px; padding-top: 14px; border-top: 2px dashed var(--gray-200);">
          <span>Estimated Total</span>
          <span style="color: var(--primary-800);">${formatPrice(total)}</span>
        </div>

        <a href="/checkout.html" class="btn btn-primary form-btn mt-20" style="padding: 14px;">
          Proceed to Checkout ➔
        </a>
        <a href="/products.html" class="btn btn-outline form-btn" style="margin-top: 10px;">
          ← Continue Shopping
        </a>
      </div>
    </div>`;
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    if (item.quantity + delta <= 0) {
      removeItem(productId);
      return;
    }
    item.quantity += delta;
    saveCart(cart);
    renderCart();
  }
}

function removeItem(productId) {
  removeFromCart(productId);
  renderCart();
}

function emptyEntireCart() {
  if (confirm('Are you sure you want to clear your cart?')) {
    saveCart([]);
    renderCart();
    showToast('Shopping cart cleared', 'info');
  }
}

function applyCartCoupon() {
  const input = document.getElementById('cartPromoInput');
  const code = input?.value.trim().toUpperCase();
  if (!code) return;

  const subtotal = getCartTotal();
  if (code === 'CHANDRA10') {
    setAppliedCoupon({ code, discountPercent: 10 });
    showToast('Promo code CHANDRA10 applied (10% OFF)!', 'success');
  } else if (code === 'FREESHIP') {
    setAppliedCoupon({ code, freeShipping: true });
    showToast('Promo code FREESHIP applied (Free Shipping)!', 'success');
  } else if (code === 'WELCOME50') {
    if (subtotal < 200) {
      showToast('WELCOME50 requires minimum ₹200 subtotal', 'warning');
      return;
    }
    setAppliedCoupon({ code, flatDiscount: 50 });
    showToast('Promo code WELCOME50 applied (₹50 OFF)!', 'success');
  } else {
    showToast('Invalid promo code. Valid: CHANDRA10, FREESHIP, WELCOME50', 'error');
    return;
  }
  renderCart();
}

function quickApplyCoupon(code) {
  const input = document.getElementById('cartPromoInput');
  if (input) input.value = code;
  applyCartCoupon();
}

function removeCartCoupon() {
  clearAppliedCoupon();
  showToast('Coupon removed', 'info');
  renderCart();
}

renderCart();

