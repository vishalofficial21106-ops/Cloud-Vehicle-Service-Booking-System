/**
 * My Bookings Management Page
 */

Auth.requireAuth();

let allBookings = [];
let currentFilter = 'All';

async function loadBookings() {
  const container = document.getElementById('bookings-list-container');
  try {
    const res = await API.get('/bookings/my');
    allBookings = res.bookings || [];
    renderBookingsList();

    // Check if URL has ?view=<bookingId> or ?bookedId=<bookingId>
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view') || urlParams.get('bookedId');
    if (viewId) {
      viewBookingReceipt(viewId);
    }
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #f87171;">
        <p>Failed to load your booking history: ${err.message}</p>
        <button onclick="loadBookings()" class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

function renderBookingsList() {
  const container = document.getElementById('bookings-list-container');

  const filtered = currentFilter === 'All' 
    ? allBookings 
    : allBookings.filter(b => b.status === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open fa-3x" style="color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>No ${currentFilter === 'All' ? '' : currentFilter} Bookings Found</h3>
        <p style="margin-top: 0.5rem;">You do not have any vehicle service appointments matching this criteria.</p>
        <a href="book-service.html" class="btn btn-primary" style="margin-top: 1.25rem;">
          <i class="fa-solid fa-calendar-plus"></i> Schedule New Service
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const canCancel = ['Pending', 'Confirmed'].includes(b.status);

    return `
      <div class="card" style="margin-bottom: 1.25rem; transition: var(--transition);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-family: monospace;">Booking ID: #${b._id.slice(-6).toUpperCase()}</span>
            <h3 style="font-size: 1.25rem; margin-top: 0.2rem;">${b.service?.name || 'Automotive Service'}</h3>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${getStatusBadge(b.status)}
            <span class="badge ${b.paymentStatus === 'Paid' ? 'badge-completed' : 'badge-pending'}">
              <i class="fa-solid ${b.paymentStatus === 'Paid' ? 'fa-check' : 'fa-hourglass'}"></i> ${b.paymentStatus}
            </span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
          <div>
            <span style="color: var(--text-dim); font-size: 0.78rem; text-transform: uppercase; display: block;">Vehicle</span>
            <strong>${b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'N/A'}</strong>
            <span style="color: var(--text-muted); font-size: 0.8rem; display: block; font-family: monospace;">${b.vehicle?.licensePlate || ''}</span>
          </div>

          <div>
            <span style="color: var(--text-dim); font-size: 0.78rem; text-transform: uppercase; display: block;">Appointment Schedule</span>
            <strong>${formatDate(b.bookingDate)}</strong>
            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">${b.timeSlot}</span>
          </div>

          <div>
            <span style="color: var(--text-dim); font-size: 0.78rem; text-transform: uppercase; display: block;">Payment Mode</span>
            <strong>${b.paymentMethod || 'Cash on Delivery'}</strong>
            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Base: ${formatCurrency(b.totalAmount)}</span>
          </div>

          <div>
            <span style="color: var(--text-dim); font-size: 0.78rem; text-transform: uppercase; display: block;">Total Amount</span>
            <div style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 800; color: #38bdf8;">
              ${formatCurrency(b.totalAmount)}
            </div>
          </div>
        </div>

        ${b.adminNotes ? `
          <div style="background: rgba(37, 99, 235, 0.08); border-left: 3px solid var(--primary); padding: 0.6rem 0.9rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 1rem;">
            <strong style="color: #38bdf8;"><i class="fa-solid fa-wrench"></i> Workshop Technician Note:</strong> ${b.adminNotes}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.9rem;">
          <button onclick="viewBookingReceipt('${b._id}')" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-invoice"></i> View Invoice / Job Card
          </button>
          
          ${canCancel ? `
            <button onclick="cancelBooking('${b._id}')" class="btn btn-danger btn-sm">
              <i class="fa-solid fa-ban"></i> Cancel Booking
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Filter Tab Click Handling
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.remove('btn-primary', 'active');
      t.classList.add('btn-secondary');
    });
    tab.classList.add('btn-primary', 'active');
    tab.classList.remove('btn-secondary');
    currentFilter = tab.dataset.status;
    renderBookingsList();
  });
});

// View Receipt Modal
function viewBookingReceipt(bookingId) {
  const booking = allBookings.find(b => b._id === bookingId);
  if (!booking) return;

  const content = document.getElementById('receipt-modal-body');
  content.innerHTML = `
    <div style="border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="font-size: 1.4rem; margin-bottom: 0.2rem;">Service Job Card</h2>
        <span style="color: var(--text-dim); font-size: 0.8rem; font-family: monospace;">Booking Ref: #${booking._id}</span>
      </div>
      <div>
        ${getStatusBadge(booking.status)}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
      <div style="background: var(--surface-alt); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Vehicle Details</span>
        <div style="font-weight: 700; margin-top: 0.2rem;">${booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'N/A'}</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">Plate: ${booking.vehicle?.licensePlate || ''} (${booking.vehicle?.vehicleType || ''})</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">Fuel: ${booking.vehicle?.fuelType || ''} &bull; Year: ${booking.vehicle?.year || ''}</div>
      </div>

      <div style="background: var(--surface-alt); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Appointment Schedule</span>
        <div style="font-weight: 700; margin-top: 0.2rem;">${formatDate(booking.bookingDate)}</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;"><i class="fa-regular fa-clock"></i> ${booking.timeSlot}</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">Payment: ${booking.paymentMethod} (${booking.paymentStatus})</div>
      </div>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;">Service Package Included:</h4>
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem;">
        <div style="display: flex; justify-content: space-between; font-weight: 700;">
          <span>${booking.service?.name || 'Package'}</span>
          <span>${formatCurrency(booking.totalAmount)}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem;">
          ${booking.service?.description || ''}
        </p>
      </div>
    </div>

    ${booking.customerNotes ? `
      <div style="margin-bottom: 1rem; font-size: 0.85rem;">
        <span style="color: var(--text-dim); font-weight: 600;">Customer Request:</span>
        <p style="color: var(--text-muted);">${booking.customerNotes}</p>
      </div>
    ` : ''}

    ${booking.adminNotes ? `
      <div style="margin-bottom: 1rem; font-size: 0.85rem; background: rgba(37,99,235,0.08); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid rgba(56,189,248,0.2);">
        <span style="color: #38bdf8; font-weight: 600;">Workshop Supervisor Notes:</span>
        <p style="color: #fff; margin-top: 0.2rem;">${booking.adminNotes}</p>
      </div>
    ` : ''}

    <div style="border-top: 2px dashed var(--border-color); padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: center; font-size: 1.25rem; font-weight: 800;">
      <span>Total Paid / Payable:</span>
      <span style="color: #38bdf8; font-family: 'Outfit', sans-serif;">${formatCurrency(booking.totalAmount)}</span>
    </div>
  `;

  openModal('modal-receipt');
}

// Cancel Booking Handler
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this service appointment?')) {
    return;
  }

  try {
    const res = await API.put(`/bookings/${bookingId}/cancel`);
    showToast('Booking cancelled successfully', 'success');
    await loadBookings();
  } catch (err) {
    showToast(err.message || 'Failed to cancel booking', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadBookings();
});
