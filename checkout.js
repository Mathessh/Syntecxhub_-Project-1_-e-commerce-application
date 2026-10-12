document.getElementById('navbar').innerHTML = renderNavbar('');
document.getElementById('footer').innerHTML = renderFooter();

if (!isLoggedIn()) {
  window.location.href = '/login.html';
}

let selectedPaymentMethod = 'card';
let selectedDeliveryType = 'standard';
let userProfile = null;
let lastCreatedOrder = null;

async function initCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    document.getElementById('checkoutContent').innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3.5rem; margin-bottom: 14px;">🛒</div>
        <h3>Nothing to checkout</h3>
        <p style="color: var(--gray-500); margin-bottom: 20px;">Your shopping basket is currently empty.</p>
        <a href="/products.html" class="btn btn-primary">Browse Groceries</a>
      </div>`;
    return;
  }

  // Load user profile to prefill address
  try {
    const res = await apiCall('/auth/me');
    userProfile = res.user;
  } catch (e) {
    userProfile = getUser();
  }

  renderCheckoutUI();
}

function renderCheckoutUI() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const coupon = getAppliedCoupon();

  let discount = 0;
  let freeShippingByCoupon = false;
  if (coupon) {
    if (coupon.code === 'CHANDRA10') discount = Math.round(subtotal * 0.10);
    if (coupon.code === 'WELCOME50' && subtotal >= 200) discount = 50;
    if (coupon.code === 'FREESHIP' || coupon.freeShipping) freeShippingByCoupon = true;
  }

  // Delivery fee calculation
  let deliveryFee = 0;
  if (selectedDeliveryType === 'express') {
    deliveryFee = 49;
  } else {
    deliveryFee = (subtotal > 500 || freeShippingByCoupon) ? 0 : 30;
  }

  const codFee = selectedPaymentMethod === 'cod' ? 15 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee + codFee);

  const defAddr = userProfile?.defaultAddress || {};
  const defName = defAddr.fullName || userProfile?.name || '';
  const defPhone = defAddr.phone || userProfile?.phone || '';
  const defStreet = defAddr.street || '';
  const defCity = defAddr.city || 'Bengaluru';
  const defState = defAddr.state || 'Karnataka';
  const defPincode = defAddr.pincode || '560001';

  document.getElementById('checkoutContent').innerHTML = `
    <div class="checkout-container">
      <!-- Left Column: Address, Delivery & Payment Method -->
      <div class="checkout-form">
        <!-- 1. Delivery Address -->
        <div style="background: white; border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--gray-200); margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-display); font-size: 1.2rem; margin: 0;">📍 1. Delivery Address</h3>
            ${userProfile?.defaultAddress?.street ? '<span class="badge badge-emerald">Saved Address Applied</span>' : ''}
          </div>

          <form id="checkoutAddressForm">
            <div class="form-row">
              <div class="form-group">
                <label>Recipient Name</label>
                <input type="text" id="chkFullName" required value="${defName}" placeholder="Full Name">
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="tel" id="chkPhone" required value="${defPhone}" placeholder="10-digit mobile">
              </div>
            </div>
            <div class="form-group">
              <label>Street Address / House No / Apartment</label>
              <input type="text" id="chkStreet" required value="${defStreet}" placeholder="e.g. #14, 2nd Cross, Green Meadows">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" id="chkCity" required value="${defCity}">
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" id="chkState" required value="${defState}">
              </div>
            </div>
            <div class="form-group">
              <label>Postal PIN Code</label>
              <input type="text" id="chkPincode" required value="${defPincode}" maxlength="6">
            </div>
            <div class="form-group">
              <label>Delivery Instructions (Optional)</label>
              <input type="text" id="chkInstructions" placeholder="e.g. Leave with security guard or ring twice">
            </div>
          </form>
        </div>

        <!-- 2. Delivery Speed -->
        <div style="background: white; border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--gray-200); margin-bottom: 24px;">
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 16px;">🚚 2. Delivery Speed</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="delivery-option-card ${selectedDeliveryType === 'standard' ? 'selected' : ''}" onclick="setDeliveryType('standard')">
              <div style="font-size: 1.4rem; margin-bottom: 4px;">📦</div>
              <b>Standard Delivery</b>
              <div style="font-size: 0.82rem; color: var(--gray-500); margin-top: 4px;">Delivered today by 8:00 PM</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--primary-700); margin-top: 6px;">
                ${(subtotal > 500 || freeShippingByCoupon) ? 'FREE' : '₹30.00'}
              </div>
            </div>

            <div class="delivery-option-card ${selectedDeliveryType === 'express' ? 'selected' : ''}" onclick="setDeliveryType('express')">
              <div style="font-size: 1.4rem; margin-bottom: 4px;">⚡</div>
              <b>Express 2-Hour</b>
              <div style="font-size: 0.82rem; color: var(--gray-500); margin-top: 4px;">Priority pack & direct rider</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--accent-700); margin-top: 6px;">+₹49.00</div>
            </div>
          </div>
        </div>

        <!-- 3. Payment Method Selection -->
        <div style="background: white; border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--gray-200);">
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 16px;">💳 3. Payment Method</h3>
          <div class="payment-tabs-grid">
            <div class="payment-tab-item ${selectedPaymentMethod === 'card' ? 'active' : ''}" onclick="selectPaymentMethod('card')">
              <span>💳</span> Credit / Debit Card
            </div>
            <div class="payment-tab-item ${selectedPaymentMethod === 'upi' ? 'active' : ''}" onclick="selectPaymentMethod('upi')">
              <span>📱</span> Instant UPI / QR
            </div>
            <div class="payment-tab-item ${selectedPaymentMethod === 'netbanking' ? 'active' : ''}" onclick="selectPaymentMethod('netbanking')">
              <span>🏦</span> Net Banking
            </div>
            <div class="payment-tab-item ${selectedPaymentMethod === 'cod' ? 'active' : ''}" onclick="selectPaymentMethod('cod')">
              <span>💵</span> Cash on Delivery
            </div>
          </div>

          <!-- Dynamic Payment Sub-views -->
          <div id="paymentDetailsPane" style="margin-top: 20px;">
            ${renderPaymentMethodPane(selectedPaymentMethod)}
          </div>
        </div>
      </div>

      <!-- Right Column: Order Summary & Trigger -->
      <div>
        <div class="cart-summary" style="position: sticky; top: 90px;">
          <h3 style="font-family: var(--font-display);">Order Summary</h3>
          <div style="max-height: 220px; overflow-y: auto; margin-bottom: 16px; padding-right: 6px;">
            ${cart.map(i => `
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <img src="${i.image || getFallbackImage(i.name)}" style="width: 42px; height: 42px; border-radius: 8px; object-fit: cover; border: 1px solid var(--gray-200);" onerror="this.onerror=null; this.src=getFallbackImage('${i.name}')">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.name}</div>
                  <div style="font-size: 0.78rem; color: var(--gray-500);">${formatPrice(i.price)} × ${i.quantity}</div>
                </div>
                <div style="font-weight: 700; font-size: 0.88rem;">${formatPrice(i.price * i.quantity)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Coupon Box on Checkout -->
          <div style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px dashed var(--gray-200);">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="chkCouponInput" placeholder="Promo code" value="${coupon?.code || ''}" style="flex: 1; padding: 8px 10px; text-transform: uppercase; font-size: 0.82rem; font-weight: 700; border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);">
              <button type="button" class="btn btn-sm btn-outline" onclick="applyCheckoutCoupon()">Apply</button>
            </div>
            ${coupon ? `
              <div class="coupon-badge-active" style="margin-top: 8px; font-size: 0.8rem;">
                <span>🎟️ ${coupon.code} active</span>
                <button type="button" onclick="removeCheckoutCoupon()">✕</button>
              </div>
            ` : ''}
          </div>

          <div class="summary-row"><span>Items Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          ${discount > 0 ? `<div class="summary-row" style="color:var(--primary-700); font-weight:600;"><span>Promo Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>${deliveryFee === 0 ? '<span style="color:var(--primary-600); font-weight:700;">FREE</span>' : formatPrice(deliveryFee)}</span>
          </div>
          ${codFee > 0 ? `<div class="summary-row"><span>COD Convenience Fee</span><span>${formatPrice(codFee)}</span></div>` : ''}

          <div class="summary-row total" style="margin-top: 14px; padding-top: 14px; border-top: 2px solid var(--gray-200);">
            <span>Grand Total</span>
            <span style="color: var(--primary-900);">${formatPrice(total)}</span>
          </div>

          <button type="button" class="btn btn-accent form-btn btn-lg" style="margin-top: 20px; padding: 16px;" onclick="initiateOrderPlacement()">
            🔒 Place Order (${formatPrice(total)}) ➔
          </button>

          <p style="text-align: center; font-size: 0.75rem; color: var(--gray-400); margin-top: 12px;">
            🛡️ Safe & Secure Checkout with Instant Order Receipt
          </p>
        </div>
      </div>
    </div>
  `;

  // Attach card live typing listeners if card pane is active
  if (selectedPaymentMethod === 'card') {
    setupCardLiveListeners();
  }
}

function setDeliveryType(type) {
  selectedDeliveryType = type;
  renderCheckoutUI();
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  renderCheckoutUI();
}

function renderPaymentMethodPane(method) {
  if (method === 'card') {
    return `
      <div>
        <!-- Live Credit Card Preview Graphic -->
        <div class="live-card-preview">
          <div class="card-chip"></div>
          <div class="card-number-display" id="dispCardNum">•••• •••• •••• ••••</div>
          <div class="card-bottom-row">
            <div>
              <div class="card-lbl">CARD HOLDER</div>
              <div class="card-val" id="dispCardName">YOUR NAME</div>
            </div>
            <div>
              <div class="card-lbl">EXPIRES</div>
              <div class="card-val" id="dispCardExp">MM/YY</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 18px;">
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" id="chkCardNumber" placeholder="4532 •••• •••• 8892" maxlength="19" value="4532 8910 2341 8892">
          </div>
          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" id="chkCardHolder" placeholder="e.g. Rahul Sharma" value="Rahul Sharma">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label>Expiry Date</label>
              <input type="text" id="chkCardExpiry" placeholder="MM/YY" maxlength="5" value="08/28">
            </div>
            <div class="form-group">
              <label>CVV / CVC</label>
              <input type="password" id="chkCardCvv" placeholder="•••" maxlength="4" value="882">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (method === 'upi') {
    return `
      <div style="text-align: center; padding: 14px 0;">
        <div style="display: inline-block; background: white; padding: 14px; border: 2px dashed var(--primary-400); border-radius: var(--radius-lg); margin-bottom: 14px;">
          <!-- High-res crisp SVG QR Code for simulated UPI -->
          <svg width="140" height="140" viewBox="0 0 140 140">
            <rect width="140" height="140" fill="#ffffff"/>
            <!-- Corner marker TL -->
            <rect x="10" y="10" width="35" height="35" fill="#047857" rx="6"/>
            <rect x="17" y="17" width="21" height="21" fill="#ffffff" rx="3"/>
            <rect x="22" y="22" width="11" height="11" fill="#047857" rx="2"/>
            <!-- Corner marker TR -->
            <rect x="95" y="10" width="35" height="35" fill="#047857" rx="6"/>
            <rect x="102" y="17" width="21" height="21" fill="#ffffff" rx="3"/>
            <rect x="107" y="22" width="11" height="11" fill="#047857" rx="2"/>
            <!-- Corner marker BL -->
            <rect x="10" y="95" width="35" height="35" fill="#047857" rx="6"/>
            <rect x="17" y="102" width="21" height="21" fill="#ffffff" rx="3"/>
            <rect x="22" y="107" width="11" height="11" fill="#047857" rx="2"/>
            <!-- QR grid dots -->
            <rect x="55" y="15" width="10" height="10" fill="#1e293b"/>
            <rect x="70" y="25" width="10" height="10" fill="#1e293b"/>
            <rect x="55" y="45" width="10" height="10" fill="#1e293b"/>
            <rect x="20" y="55" width="10" height="10" fill="#1e293b"/>
            <rect x="35" y="70" width="10" height="10" fill="#1e293b"/>
            <rect x="60" y="70" width="20" height="20" fill="#047857" rx="4"/>
            <rect x="95" y="55" width="10" height="10" fill="#1e293b"/>
            <rect x="115" y="75" width="10" height="10" fill="#1e293b"/>
            <rect x="65" y="100" width="10" height="10" fill="#1e293b"/>
            <rect x="85" y="115" width="10" height="10" fill="#1e293b"/>
            <rect x="110" y="105" width="15" height="15" fill="#1e293b"/>
          </svg>
        </div>
        <p style="font-size: 0.88rem; font-weight: 600; color: var(--gray-700); margin-bottom: 4px;">
          Scan with Google Pay, PhonePe, or Paytm
        </p>
        <p style="font-size: 0.78rem; color: var(--gray-400); margin-bottom: 14px;">OR Enter your Virtual Payment Address (VPA)</p>
        <div class="form-group" style="max-width: 380px; margin: 0 auto; text-align: left;">
          <input type="text" id="chkUpiId" placeholder="e.g. yourname@okaxis" value="rahul@okhdfcbank" style="text-align: center;">
        </div>
      </div>
    `;
  }

  if (method === 'netbanking') {
    return `
      <div>
        <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 12px;">Select your bank to redirect to secure netbanking:</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          <label class="bank-pill"><input type="radio" name="nbBank" value="HDFC" checked> 🏦 HDFC Bank</label>
          <label class="bank-pill"><input type="radio" name="nbBank" value="SBI"> 🏛️ SBI</label>
          <label class="bank-pill"><input type="radio" name="nbBank" value="ICICI"> 💳 ICICI Bank</label>
          <label class="bank-pill"><input type="radio" name="nbBank" value="Axis"> 🏦 Axis Bank</label>
          <label class="bank-pill"><input type="radio" name="nbBank" value="Kotak"> 🏢 Kotak Bank</label>
          <label class="bank-pill"><input type="radio" name="nbBank" value="PNB"> 🏛️ PNB</label>
        </div>
      </div>
    `;
  }

  // COD
  return `
    <div style="background: var(--primary-50); border: 1px solid var(--primary-200); padding: 18px; border-radius: var(--radius-md); text-align: center;">
      <div style="font-size: 2.2rem; margin-bottom: 8px;">💵</div>
      <h4 style="color: var(--primary-900); margin-bottom: 4px;">Pay with Cash upon Doorstep Delivery</h4>
      <p style="font-size: 0.84rem; color: var(--gray-600); max-width: 440px; margin: 0 auto;">
        Our delivery partner will carry an exact change receipt. You can also pay via UPI QR to the delivery agent at your door.
      </p>
    </div>
  `;
}

function setupCardLiveListeners() {
  const numInput = document.getElementById('chkCardNumber');
  const nameInput = document.getElementById('chkCardHolder');
  const expInput = document.getElementById('chkCardExpiry');

  if (numInput) {
    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(.{4})/g, '$1 ').trim();
      document.getElementById('dispCardNum').textContent = val || '•••• •••• •••• ••••';
    });
  }
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      document.getElementById('dispCardName').textContent = e.target.value.toUpperCase() || 'YOUR NAME';
    });
  }
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      document.getElementById('dispCardExp').textContent = e.target.value || 'MM/YY';
    });
  }
}

function applyCheckoutCoupon() {
  const input = document.getElementById('chkCouponInput');
  const code = input?.value.trim().toUpperCase();
  if (!code) return;

  const subtotal = getCartTotal();
  if (code === 'CHANDRA10') {
    setAppliedCoupon({ code, discountPercent: 10 });
    showToast('Promo code CHANDRA10 applied (10% OFF)!', 'success');
  } else if (code === 'FREESHIP') {
    setAppliedCoupon({ code, freeShipping: true });
    showToast('Promo code FREESHIP applied!', 'success');
  } else if (code === 'WELCOME50') {
    if (subtotal < 200) {
      showToast('WELCOME50 requires minimum ₹200 order', 'warning');
      return;
    }
    setAppliedCoupon({ code, flatDiscount: 50 });
    showToast('Promo code WELCOME50 applied (₹50 OFF)!', 'success');
  } else {
    showToast('Invalid promo code', 'error');
    return;
  }
  renderCheckoutUI();
}

function removeCheckoutCoupon() {
  clearAppliedCoupon();
  showToast('Coupon removed', 'info');
  renderCheckoutUI();
}

async function initiateOrderPlacement() {
  // Validate Address
  const fullName = document.getElementById('chkFullName')?.value.trim();
  const phone = document.getElementById('chkPhone')?.value.trim();
  const street = document.getElementById('chkStreet')?.value.trim();
  const city = document.getElementById('chkCity')?.value.trim();
  const state = document.getElementById('chkState')?.value.trim();
  const pincode = document.getElementById('chkPincode')?.value.trim();
  const instructions = document.getElementById('chkInstructions')?.value.trim();

  if (!fullName || !phone || !street || !city || !state || !pincode) {
    showToast('Please complete all delivery address fields', 'warning');
    return;
  }

  const cart = getCart();
  const coupon = getAppliedCoupon();

  const methodMap = { card: 'Card', upi: 'UPI', netbanking: 'NetBanking', cod: 'COD' };
  const deliveryMap = { standard: 'Standard', express: 'Express' };

  const orderPayload = {
    products: cart.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
    address: { fullName, phone, street, city, state, pincode },
    deliveryType: deliveryMap[selectedDeliveryType] || 'Standard',
    deliveryInstructions: instructions,
    paymentMethod: methodMap[selectedPaymentMethod] || 'Card',
    couponCode: coupon?.code || ''
  };

  // Open simulation modal
  const modal = document.getElementById('paymentModal');
  const content = document.getElementById('paymentModalContent');
  modal.classList.add('active');

  content.innerHTML = `
    <div class="payment-processing" style="padding: 40px 20px;">
      <div class="spinner" style="margin: 0 auto 18px;"></div>
      <h3 style="font-family: var(--font-display); font-size: 1.3rem;">Processing ${selectedPaymentMethod.toUpperCase()} Payment...</h3>
      <p style="color: var(--gray-500); font-size: 0.9rem; margin-top: 6px;">
        Connecting to 256-bit secure gateway. Please do not refresh.
      </p>
    </div>
  `;

  try {
    // Realistic payment delay
    await new Promise(r => setTimeout(r, 1600));

    // Send order to API
    const order = await apiCall('/orders', 'POST', orderPayload);
    lastCreatedOrder = order;

    // Clear cart and coupons
    saveCart([]);
    clearAppliedCoupon();

    showOrderSuccessModal(order);
  } catch (err) {
    content.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">❌</div>
        <h3 style="color: var(--danger); font-family: var(--font-display);">Payment / Order Failed</h3>
        <p style="color: var(--gray-600); margin: 8px 0 24px;">${err.message}</p>
        <button class="btn btn-primary" onclick="closePaymentModal()">Try Again</button>
      </div>
    `;
  }
}

function showOrderSuccessModal(order) {
  const content = document.getElementById('paymentModalContent');
  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  content.innerHTML = `
    <div class="payment-success" style="text-align: center; padding: 20px;">
      <div class="checkmark">✓</div>
      <h2 style="font-family: var(--font-display); color: var(--primary-900); margin-bottom: 6px;">Order Placed Successfully!</h2>
      <p style="color: var(--gray-600); font-size: 0.92rem; margin-bottom: 20px;">
        Thank you for shopping with Chandra Bazzar! Your grocery order has been confirmed.
      </p>

      <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 18px; text-align: left; margin-bottom: 24px; font-size: 0.88rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--gray-500);">Order Number:</span>
          <b>#${order._id.substring(order._id.length - 8).toUpperCase()}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--gray-500);">Payment Ref:</span>
          <span style="font-family:monospace; font-weight:600;">${order.paymentId || 'PAY-CHANDRA-DIRECT'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--gray-500);">Total Amount:</span>
          <b style="color:var(--primary-800);">${formatPrice(order.totalAmount)}</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--gray-500);">Est. Delivery:</span>
          <span style="color:var(--primary-700); font-weight:600;">Today by 8:00 PM</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <button class="btn btn-outline" onclick="printTaxInvoice('${order._id}')">
          🖨️ Print Tax Invoice
        </button>
        <a href="/orders.html" class="btn btn-primary" style="display:flex; align-items:center; justify-content:center;">
          📦 View My Orders
        </a>
      </div>
      <a href="/products.html" class="btn btn-outline" style="width: 100%;" onclick="closePaymentModal()">
        Continue Shopping
      </a>
    </div>
  `;
}

function closePaymentModal() {
  document.getElementById('paymentModal')?.classList.remove('active');
}

// ── Official GST Tax Invoice Generator ──
async function printTaxInvoice(orderId) {
  let order = lastCreatedOrder;
  if (!order || order._id !== orderId) {
    try {
      showSpinner();
      order = await apiCall(`/orders/${orderId}`);
      hideSpinner();
    } catch (e) {
      hideSpinner();
      showToast('Could not fetch order invoice', 'error');
      return;
    }
  }

  const invoiceNum = 'INV-' + (order._id.substring(order._id.length - 8).toUpperCase());
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const subtotal = order.subtotalAmount || order.totalAmount;
  const discount = order.discountAmount || 0;
  const delivery = order.deliveryFee || 0;
  const grandTotal = order.totalAmount;

  const invoiceHTML = `
    <html>
    <head>
      <title>Tax Invoice - ${invoiceNum} - Chandra Bazzar</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
        .inv-header { display: flex; justify-content: space-between; border-bottom: 2px solid #047857; padding-bottom: 20px; }
        .logo-title { font-size: 26px; font-weight: 800; color: #047857; margin: 0; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .meta-box { text-align: right; font-size: 13px; color: #334155; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; font-size: 13px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .info-card h4 { margin: 0 0 8px; color: #047857; font-size: 14px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th { background: #047857; color: #fff; text-align: left; padding: 10px 14px; font-weight: 600; }
        td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
        .totals-box { margin-top: 24px; margin-left: auto; width: 300px; font-size: 13px; }
        .tot-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .tot-row.grand { border-top: 2px solid #047857; font-size: 16px; font-weight: 800; color: #047857; padding-top: 10px; margin-top: 6px; }
        .footer-note { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="inv-header">
        <div>
          <h1 class="logo-title">🛒 CHANDRA BAZZAR</h1>
          <div class="subtitle">Fresh Daily Produce & FMCG Supermarket</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">GSTIN: 29AAAAA0000A1Z5 | FSSAI Lic: 11223344556677</div>
        </div>
        <div class="meta-box">
          <h2 style="margin: 0; color: #0f172a; font-size: 20px;">TAX INVOICE</h2>
          <div style="margin-top: 6px;"><b>Invoice No:</b> ${invoiceNum}</div>
          <div><b>Invoice Date:</b> ${dateStr}</div>
          <div><b>Payment:</b> ${(order.paymentMethod || 'Card').toUpperCase()} (PAID)</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Billed To (Customer)</h4>
          <b>${order.address?.fullName || 'Customer'}</b><br>
          Phone: ${order.address?.phone || ''}<br>
          Address: ${order.address?.street || ''}, ${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}
        </div>
        <div class="info-card">
          <h4>Fulfilled & Dispatched From</h4>
          <b>Chandra Bazzar Fulfillment Hub #01</b><br>
          Main Bazzar Road, Chandra Nagar<br>
          Bengaluru, Karnataka - 560001<br>
          Support: 1800-CHANDRA | support@chandrabazzar.com
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${order.products.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><b>${item.name}</b></td>
              <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="tot-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="tot-row" style="color:#047857;"><span>Discount (${order.couponCode || 'Promo'}):</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
        <div class="tot-row"><span>Delivery Charges:</span><span>${delivery === 0 ? 'FREE' : '₹' + delivery.toFixed(2)}</span></div>
        <div class="tot-row"><span>Taxes (CGST + SGST 5% incl.):</span><span>₹${((grandTotal * 0.05) / 1.05).toFixed(2)}</span></div>
        <div class="tot-row grand"><span>Total Payable:</span><span>₹${grandTotal.toFixed(2)}</span></div>
      </div>

      <div class="footer-note">
        This is a computer-generated tax invoice and does not require a physical signature.<br>
        Thank you for choosing Chandra Bazzar! For returns or fresh guarantee queries, write to support@chandrabazzar.com
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=850,height=900');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(invoiceHTML);
    printWin.document.close();
  } else {
    // Fallback if popup blocked
    showToast('Please allow popups to view printable invoice', 'warning');
  }
}

// Initialize on page load
initCheckout();

