/**
 * Customer Dashboard Logic
 */

// Route Guard
Auth.requireAuth();

let myVehicles = [];
let myBookings = [];

async function loadDashboardData() {
  const user = Auth.getUser();
  if (user && document.getElementById('user-greeting')) {
    document.getElementById('user-greeting').textContent = user.name || 'Valued Customer';
  }

  try {
    // Fetch vehicles and bookings in parallel
    const [vehiclesRes, bookingsRes] = await Promise.all([
      API.get('/vehicles'),
      API.get('/bookings/my')
    ]);

    myVehicles = vehiclesRes.vehicles || [];
    myBookings = bookingsRes.bookings || [];

    renderMetrics();
    renderUpcomingBookings();
    renderVehicles();
  } catch (error) {
    showToast('Failed to load dashboard metrics: ' + error.message, 'error');
  }
}

function renderMetrics() {
  const totalBookings = myBookings.length;
  const activeBookings = myBookings.filter(b => ['Pending', 'Confirmed', 'In Progress'].includes(b.status)).length;
  const completedBookings = myBookings.filter(b => b.status === 'Completed').length;
  const totalVehicles = myVehicles.length;

  document.getElementById('metric-total-bookings').textContent = totalBookings;
  document.getElementById('metric-active-bookings').textContent = activeBookings;
  document.getElementById('metric-completed-bookings').textContent = completedBookings;
  document.getElementById('metric-total-vehicles').textContent = totalVehicles;
}

function renderUpcomingBookings() {
  const container = document.getElementById('upcoming-bookings-list');
  const activeList = myBookings.filter(b => ['Pending', 'Confirmed', 'In Progress'].includes(b.status));

  if (activeList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-calendar-xmark fa-2x" style="color: var(--text-dim); margin-bottom: 0.75rem;"></i>
        <p>No active service bookings currently scheduled.</p>
        <a href="book-service.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
          <i class="fa-solid fa-plus"></i> Book a Service Now
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = activeList.map(b => `
    <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(37,99,235,0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
          <i class="fa-solid ${b.service?.icon || 'fa-wrench'}"></i>
        </div>
        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;">${b.service?.name || 'Vehicle Service'}</h4>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 1rem; flex-wrap: wrap;">
            <span><i class="fa-solid fa-car"></i> ${b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.licensePlate})` : 'Vehicle'}</span>
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(b.bookingDate)} (${b.timeSlot})</span>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <div>
          ${getStatusBadge(b.status)}
        </div>
        <div style="font-weight: 700; font-size: 1.1rem; color: #38bdf8;">
          ${formatCurrency(b.totalAmount)}
        </div>
        <a href="my-bookings.html?view=${b._id}" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-eye"></i> Details
        </a>
      </div>
    </div>
  `).join('');
}

function renderVehicles() {
  const container = document.getElementById('vehicles-grid');

  if (myVehicles.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-car-side fa-2x" style="color: var(--text-dim); margin-bottom: 0.75rem;"></i>
        <p>You haven't registered any vehicles yet.</p>
        <button onclick="openModal('modal-add-vehicle')" class="btn btn-primary btn-sm" style="margin-top: 0.75rem;">
          <i class="fa-solid fa-plus"></i> Register Your First Vehicle
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myVehicles.map(v => {
    let typeIcon = 'fa-car';
    if (v.vehicleType === 'Bike') typeIcon = 'fa-motorcycle';
    if (v.vehicleType === 'Truck') typeIcon = 'fa-truck';

    return `
      <div class="card" style="padding: 1.4rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="width: 38px; height: 38px; border-radius: var(--radius-sm); background: rgba(37,99,235,0.12); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
              <i class="fa-solid ${typeIcon}"></i>
            </div>
            <div>
              <h4 style="font-size: 1.1rem;">${v.make} ${v.model}</h4>
              <span style="font-size: 0.78rem; color: var(--text-dim);">${v.year} &bull; ${v.fuelType}</span>
            </div>
          </div>
          <button onclick="deleteVehicle('${v._id}')" class="btn btn-danger btn-sm" title="Remove Vehicle" style="padding: 0.3rem 0.6rem;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>

        <div style="background: rgba(15, 23, 42, 0.7); border: 1px dashed var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-family: monospace; font-size: 0.95rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em; display: inline-block; margin-bottom: 0.75rem;">
          ${v.licensePlate}
        </div>

        ${v.notes ? `<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">"${v.notes}"</p>` : ''}

        <div style="margin-top: 1rem; pt: 0.75rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
          <a href="book-service.html?vehicleId=${v._id}" class="btn btn-primary btn-sm" style="width: 100%;">
            <i class="fa-solid fa-calendar-plus"></i> Schedule Service
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Add Vehicle Handler
document.getElementById('add-vehicle-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('save-vehicle-btn');

  const make = document.getElementById('v-make').value.trim();
  const model = document.getElementById('v-model').value.trim();
  const year = document.getElementById('v-year').value;
  const licensePlate = document.getElementById('v-plate').value.trim().toUpperCase();
  const vehicleType = document.getElementById('v-type').value;
  const fuelType = document.getElementById('v-fuel').value;
  const notes = document.getElementById('v-notes').value.trim();

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    const res = await API.post('/vehicles', {
      make,
      model,
      year,
      licensePlate,
      vehicleType,
      fuelType,
      notes
    });

    showToast('Vehicle registered successfully!', 'success');
    closeModal('modal-add-vehicle');
    document.getElementById('add-vehicle-form').reset();
    await loadDashboardData();

  } catch (err) {
    showToast(err.message || 'Failed to add vehicle', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Register Vehicle';
  }
});

// Delete Vehicle Handler
async function deleteVehicle(vehicleId) {
  if (!confirm('Are you sure you want to remove this vehicle? This action cannot be undone.')) {
    return;
  }

  try {
    await API.delete(`/vehicles/${vehicleId}`);
    showToast('Vehicle removed successfully', 'success');
    await loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Failed to remove vehicle', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});
