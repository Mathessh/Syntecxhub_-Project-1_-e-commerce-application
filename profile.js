/* ============================================
   CHANDRA BAZZAR — Profile & Account Settings
   ============================================ */

if (!isLoggedIn()) {
  window.location.href = '/login.html';
}

document.getElementById('navbar').innerHTML = renderNavbar('profile');
document.getElementById('footer').innerHTML = renderFooter();

let currentUserData = null;

// Tab switcher
function switchProfileTab(tab) {
  document.querySelectorAll('.profile-menu-link').forEach(link => link.classList.remove('active'));
  document.getElementById('tabGeneral').style.display = 'none';
  document.getElementById('tabAddress').style.display = 'none';
  document.getElementById('tabSecurity').style.display = 'none';

  if (tab === 'general') {
    document.getElementById('tabGeneral').style.display = 'block';
  } else if (tab === 'address') {
    document.getElementById('tabAddress').style.display = 'block';
  } else if (tab === 'security') {
    document.getElementById('tabSecurity').style.display = 'block';
  }

  // Find matching menu item
  const links = document.querySelectorAll('.profile-menu-link');
  if (tab === 'general' && links[0]) links[0].classList.add('active');
  if (tab === 'address' && links[1]) links[1].classList.add('active');
  if (tab === 'security' && links[2]) links[2].classList.add('active');
}

// Load profile data from API
async function loadProfile() {
  try {
    showSpinner();
    const res = await apiCall('/auth/me');
    currentUserData = res.user;

    // Update sidebar
    document.getElementById('avatarInitial').textContent = (currentUserData.name || 'U')[0].toUpperCase();
    document.getElementById('sidebarUserName').textContent = currentUserData.name;
    document.getElementById('sidebarUserEmail').textContent = currentUserData.email;
    document.getElementById('sidebarUserRole').textContent = currentUserData.role === 'admin' ? 'Store Administrator' : 'Verified Customer';

    // Populate general form
    document.getElementById('profName').value = currentUserData.name || '';
    document.getElementById('profEmail').value = currentUserData.email || '';
    document.getElementById('profPhone').value = currentUserData.phone || '';

    // Populate address form
    const addr = currentUserData.defaultAddress || {};
    document.getElementById('addrFullName').value = addr.fullName || currentUserData.name || '';
    document.getElementById('addrPhone').value = addr.phone || currentUserData.phone || '';
    document.getElementById('addrStreet').value = addr.street || '';
    document.getElementById('addrCity').value = addr.city || '';
    document.getElementById('addrState').value = addr.state || '';
    document.getElementById('addrPincode').value = addr.pincode || '';

    hideSpinner();
  } catch (err) {
    hideSpinner();
    showToast(err.message, 'error');
  }
}

// Save profile form
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('profName').value.trim();
  const phone = document.getElementById('profPhone').value.trim();

  try {
    showSpinner();
    const res = await apiCall('/auth/profile', 'PUT', { name, phone });
    // Update local stored user
    const existing = getUser() || {};
    existing.name = res.user.name;
    existing.phone = res.user.phone;
    localStorage.setItem('user', JSON.stringify(existing));

    showToast('Profile updated successfully!', 'success');
    hideSpinner();
    loadProfile();
  } catch (err) {
    hideSpinner();
    showToast(err.message, 'error');
  }
});

// Save address form
document.getElementById('addressForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const defaultAddress = {
    fullName: document.getElementById('addrFullName').value.trim(),
    phone: document.getElementById('addrPhone').value.trim(),
    street: document.getElementById('addrStreet').value.trim(),
    city: document.getElementById('addrCity').value.trim(),
    state: document.getElementById('addrState').value.trim(),
    pincode: document.getElementById('addrPincode').value.trim()
  };

  try {
    showSpinner();
    await apiCall('/auth/profile', 'PUT', { defaultAddress });
    showToast('Default delivery address saved!', 'success');
    hideSpinner();
  } catch (err) {
    hideSpinner();
    showToast(err.message, 'error');
  }
});

// Change password form
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  try {
    showSpinner();
    await apiCall('/auth/change-password', 'PUT', { currentPassword, newPassword });
    showToast('Password changed successfully!', 'success');
    document.getElementById('passwordForm').reset();
    hideSpinner();
  } catch (err) {
    hideSpinner();
    showToast(err.message, 'error');
  }
});

// Initialize
loadProfile();
