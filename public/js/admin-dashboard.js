/**
 * Admin Console & Workshop Management Logic
 */

// Route Guard: Admin only
Auth.requireAuth(true);

let allAdminBookings = [];
let allAdminServices = [];
let currentAdminFilter = 'All';
let currentSearchTerm = '';
let activeEditingBookingId = null;

async function loadAdminDashboard() {
  try {
    const [statsRes, bookingsRes, servicesRes] = await Promise.all([
      API.get('/bookings/admin/stats'),
      API.get('/bookings'),
      API.get('/services')
    ]);

    renderAdminStats(statsRes.stats);
    allAdminBookings = bookingsRes.bookings || [];
    allAdminServices = servicesRes.services || [];

    renderAdminBookingsTable();
    renderAdminServicesTable();

  } catch (err) {
    showToast('Failed to load admin console data: ' + err.message, 'error');
  }
}

function renderAdminStats(stats) {
  if (!stats) return;

  document.getElementById('stat-admin-total').textContent = stats.totalBookings || 0;
  document.getElementById('stat-admin-pending').textContent = stats.pendingBookings || 0;
  document.getElementById('stat-admin-inprogress').textContent = stats.inProgressBookings || 0;
  document.getElementById('stat-admin-completed').textContent = stats.completedBookings || 0;
  document.getElementById('stat-admin-revenue').textContent = formatCurrency(stats.totalRevenue || 0);
  document.getElementById('stat-admin-users').textContent = `${stats.totalCustomers || 0} Users / ${stats.totalVehicles || 0} Vehicles`;
}

function renderAdminBookingsTable() {
  const tbody = document.getElementById('admin-bookings-tbody');
  const countBadge = document.getElementById('booking-count-badge');

  let list = allAdminBookings;

  if (currentAdminFilter !== 'All') {
    list = list.filter(b => b.status === currentAdminFilter);
  }

  if (currentSearchTerm.trim() !== '') {
    const term = currentSearchTerm.toLowerCase().trim();
    list = list.filter(b => {
      const cName = b.user?.name?.toLowerCase() || '';
      const cEmail = b.user?.email?.toLowerCase() || '';
      const cPhone = b.user?.phone?.toLowerCase() || '';
      const plate = b.vehicle?.licensePlate?.toLowerCase() || '';
      const model = b.vehicle?.model?.toLowerCase() || '';
      const sName = b.service?.name?.toLowerCase() || '';
      return cName.includes(term) || cEmail.includes(term) || cPhone.includes(term) || plate.includes(term) || model.includes(term) || sName.includes(term);
    });
  }

  if (countBadge) {
    countBadge.textContent = `${list.length} Records`;
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-magnifying-glass fa-2x" style="color: var(--text-dim); margin-bottom: 0.5rem; display: block;"></i>
          No bookings match the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td>
        <span style="font-family: monospace; font-size: 0.85rem; color: #38bdf8; font-weight: 700;">#${b._id.slice(-6).toUpperCase()}</span>
      </td>
      <td>
        <strong>${b.user?.name || 'Customer'}</strong>
        <span style="font-size: 0.78rem; color: var(--text-muted); display: block;"><i class="fa-solid fa-phone"></i> ${b.user?.phone || 'N/A'}</span>
      </td>
      <td>
        <strong>${b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'N/A'}</strong>
        <span style="font-family: monospace; font-size: 0.78rem; color: #38bdf8; display: block;">${b.vehicle?.licensePlate || ''}</span>
      </td>
      <td>
        <span style="font-weight: 600;">${b.service?.name || 'Service Package'}</span>
      </td>
      <td>
        <strong>${formatDate(b.bookingDate)}</strong>
        <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${b.timeSlot}</span>
      </td>
      <td>
        <strong>${formatCurrency(b.totalAmount)}</strong>
        <span style="font-size: 0.75rem; color: ${b.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24'}; display: block;">
          ${b.paymentStatus} (${b.paymentMethod || 'COD'})
        </span>
      </td>
      <td>
        ${getStatusBadge(b.status)}
      </td>
      <td>
        <button onclick="openStatusModal('${b._id}')" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-pen-to-square"></i> Status
        </button>
      </td>
    </tr>
  `).join('');
}

function renderAdminServicesTable() {
  const tbody = document.getElementById('admin-services-tbody');
  if (!tbody) return;

  tbody.innerHTML = allAdminServices.map(s => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: rgba(37,99,235,0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center;">
            <i class="fa-solid ${s.icon || 'fa-wrench'}"></i>
          </div>
          <div>
            <strong>${s.name}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${s.description.slice(0, 50)}...</span>
          </div>
        </div>
      </td>
      <td><span class="badge badge-customer">${s.category}</span></td>
      <td>${s.estimatedTime}</td>
      <td style="font-weight: 700; color: #38bdf8;">${formatCurrency(s.basePrice)}</td>
      <td>
        <span class="badge ${s.isActive ? 'badge-completed' : 'badge-cancelled'}">
          ${s.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button onclick="deleteServicePkg('${s._id}')" class="btn btn-danger btn-sm" title="Deactivate">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Search and Filter Listeners
document.getElementById('admin-search-input').addEventListener('input', (e) => {
  currentSearchTerm = e.target.value;
  renderAdminBookingsTable();
});

document.getElementById('admin-status-filter').addEventListener('change', (e) => {
  currentAdminFilter = e.target.value;
  renderAdminBookingsTable();
});

// Update Status Modal Handler
function openStatusModal(bookingId) {
  const booking = allAdminBookings.find(b => b._id === bookingId);
  if (!booking) return;

  activeEditingBookingId = bookingId;

  document.getElementById('modal-booking-ref').textContent = `#${booking._id.slice(-6).toUpperCase()} - ${booking.vehicle?.make || ''} ${booking.vehicle?.model || ''} (${booking.vehicle?.licensePlate || ''})`;
  document.getElementById('edit-status').value = booking.status;
  document.getElementById('edit-payment-status').value = booking.paymentStatus;
  document.getElementById('edit-admin-notes').value = booking.adminNotes || '';

  openModal('modal-update-status');
}

document.getElementById('form-update-status').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-save-status');

  const status = document.getElementById('edit-status').value;
  const paymentStatus = document.getElementById('edit-payment-status').value;
  const adminNotes = document.getElementById('edit-admin-notes').value.trim();

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';

    const res = await API.put(`/bookings/${activeEditingBookingId}/status`, {
      status,
      paymentStatus,
      adminNotes
    });

    showToast('Booking status updated successfully!', 'success');
    closeModal('modal-update-status');

    await loadAdminDashboard();

  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Status Updates';
  }
});

// Add Service Package Form Handler
document.getElementById('form-add-service').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-save-service');

  const name = document.getElementById('pkg-name').value.trim();
  const description = document.getElementById('pkg-desc').value.trim();
  const category = document.getElementById('pkg-cat').value;
  const basePrice = document.getElementById('pkg-price').value;
  const estimatedTime = document.getElementById('pkg-time').value.trim();
  const icon = document.getElementById('pkg-icon').value.trim();

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    const res = await API.post('/services', {
      name,
      description,
      category,
      basePrice,
      estimatedTime,
      icon
    });

    showToast('New service package created successfully!', 'success');
    closeModal('modal-add-service');
    document.getElementById('form-add-service').reset();

    const servicesRes = await API.get('/services');
    allAdminServices = servicesRes.services || [];
    renderAdminServicesTable();

  } catch (err) {
    showToast(err.message || 'Failed to create service', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Create Package';
  }
});

// Deactivate Service Handler
async function deleteServicePkg(serviceId) {
  if (!confirm('Are you sure you want to deactivate this service package?')) return;

  try {
    await API.delete(`/services/${serviceId}`);
    showToast('Service deactivated successfully', 'success');
    const servicesRes = await API.get('/services');
    allAdminServices = servicesRes.services || [];
    renderAdminServicesTable();
  } catch (err) {
    showToast(err.message || 'Failed to deactivate service', 'error');
  }
}

// Switch Admin Section Tabs
function switchAdminTab(tabName) {
  document.getElementById('tab-bookings-section').style.display = tabName === 'bookings' ? 'block' : 'none';
  document.getElementById('tab-services-section').style.display = tabName === 'services' ? 'block' : 'none';

  document.getElementById('btn-tab-bookings').classList.toggle('btn-primary', tabName === 'bookings');
  document.getElementById('btn-tab-bookings').classList.toggle('btn-secondary', tabName !== 'bookings');

  document.getElementById('btn-tab-services').classList.toggle('btn-primary', tabName === 'services');
  document.getElementById('btn-tab-services').classList.toggle('btn-secondary', tabName !== 'services');
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();
});
