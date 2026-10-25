/**
 * Service Booking Page Logic
 */

Auth.requireAuth();

let userVehicles = [];
let availableServices = [];
let selectedVehicle = null;
let selectedService = null;
let selectedSlot = '09:00 AM - 11:00 AM';

async function initBookingPage() {
  // Set minimum date to tomorrow (or today)
  const dateInput = document.getElementById('booking-date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;

  try {
    const [vehRes, srvRes] = await Promise.all([
      API.get('/vehicles'),
      API.get('/services')
    ]);

    userVehicles = vehRes.vehicles || [];
    availableServices = srvRes.services || [];

    populateVehicleSelect();
    populateServiceSelect();

    // Check URL parameters for pre-selected vehicleId or serviceId
    const urlParams = new URLSearchParams(window.location.search);
    const preVehicleId = urlParams.get('vehicleId');
    const preServiceId = urlParams.get('serviceId');

    if (preVehicleId && userVehicles.some(v => v._id === preVehicleId)) {
      document.getElementById('vehicle-select').value = preVehicleId;
      onVehicleChange(preVehicleId);
    } else if (userVehicles.length > 0) {
      document.getElementById('vehicle-select').value = userVehicles[0]._id;
      onVehicleChange(userVehicles[0]._id);
    }

    if (preServiceId && availableServices.some(s => s._id === preServiceId)) {
      document.getElementById('service-select').value = preServiceId;
      onServiceChange(preServiceId);
    } else if (availableServices.length > 0) {
      document.getElementById('service-select').value = availableServices[0]._id;
      onServiceChange(availableServices[0]._id);
    }

    updateSummary();

  } catch (err) {
    showToast('Failed to load booking resources: ' + err.message, 'error');
  }
}

function populateVehicleSelect() {
  const select = document.getElementById('vehicle-select');
  const noVehiclesNotice = document.getElementById('no-vehicles-notice');

  if (userVehicles.length === 0) {
    select.innerHTML = '<option value="">-- No registered vehicles found --</option>';
    select.disabled = true;
    if (noVehiclesNotice) noVehiclesNotice.style.display = 'block';
    return;
  }

  if (noVehiclesNotice) noVehiclesNotice.style.display = 'none';
  select.disabled = false;
  select.innerHTML = userVehicles.map(v => `
    <option value="${v._id}">
      ${v.make} ${v.model} (${v.licensePlate}) - ${v.vehicleType}
    </option>
  `).join('');
}

function populateServiceSelect() {
  const select = document.getElementById('service-select');

  if (availableServices.length === 0) {
    select.innerHTML = '<option value="">-- No services available --</option>';
    return;
  }

  select.innerHTML = availableServices.map(s => `
    <option value="${s._id}">
      ${s.name} - ${formatCurrency(s.basePrice)} (${s.estimatedTime})
    </option>
  `).join('');
}

function onVehicleChange(vehicleId) {
  selectedVehicle = userVehicles.find(v => v._id === vehicleId) || null;
  updateSummary();
}

function onServiceChange(serviceId) {
  selectedService = availableServices.find(s => s._id === serviceId) || null;
  updateSummary();
}

// Time Slot Chip Selection
document.querySelectorAll('.slot-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedSlot = chip.dataset.slot;
    updateSummary();
  });
});

// Event Listeners for Select Dropdowns
document.getElementById('vehicle-select').addEventListener('change', (e) => {
  onVehicleChange(e.target.value);
});

document.getElementById('service-select').addEventListener('change', (e) => {
  onServiceChange(e.target.value);
});

document.getElementById('booking-date').addEventListener('change', () => {
  updateSummary();
});

function updateSummary() {
  const dateVal = document.getElementById('booking-date').value;

  // Vehicle summary preview
  const summaryVeh = document.getElementById('summary-vehicle');
  if (selectedVehicle) {
    summaryVeh.innerHTML = `
      <div style="font-weight: 700; color: #fff;">${selectedVehicle.make} ${selectedVehicle.model}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${selectedVehicle.licensePlate} &bull; ${selectedVehicle.vehicleType}</div>
    `;
  } else {
    summaryVeh.innerHTML = '<span style="color: var(--text-dim);">No vehicle selected</span>';
  }

  // Service summary preview
  const summarySrv = document.getElementById('summary-service');
  const summaryPrice = document.getElementById('summary-base-price');
  const summaryTotal = document.getElementById('summary-total');

  if (selectedService) {
    summarySrv.innerHTML = `
      <div style="font-weight: 700; color: #fff;">${selectedService.name}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> Est. Time: ${selectedService.estimatedTime}</div>
    `;
    summaryPrice.textContent = formatCurrency(selectedService.basePrice);
    summaryTotal.textContent = formatCurrency(selectedService.basePrice);
  } else {
    summarySrv.innerHTML = '<span style="color: var(--text-dim);">No service package chosen</span>';
    summaryPrice.textContent = '₹0';
    summaryTotal.textContent = '₹0';
  }

  // Date and slot preview
  const summarySchedule = document.getElementById('summary-schedule');
  if (dateVal) {
    summarySchedule.innerHTML = `
      <div style="font-weight: 600; color: #fff;">${formatDate(dateVal)}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-clock text-blue"></i> ${selectedSlot}</div>
    `;
  } else {
    summarySchedule.innerHTML = '<span style="color: var(--text-dim);">Please choose a date</span>';
  }
}

// Add Vehicle Modal Form inside booking page
document.getElementById('modal-add-vehicle-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-modal-save-vehicle');

  const make = document.getElementById('quick-make').value.trim();
  const model = document.getElementById('quick-model').value.trim();
  const year = document.getElementById('quick-year').value;
  const licensePlate = document.getElementById('quick-plate').value.trim().toUpperCase();
  const vehicleType = document.getElementById('quick-type').value;
  const fuelType = document.getElementById('quick-fuel').value;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    const res = await API.post('/vehicles', {
      make,
      model,
      year,
      licensePlate,
      vehicleType,
      fuelType
    });

    showToast('Vehicle added successfully!', 'success');
    closeModal('modal-add-vehicle');
    document.getElementById('modal-add-vehicle-form').reset();

    // Reload vehicles and select the newly created one
    const vehRes = await API.get('/vehicles');
    userVehicles = vehRes.vehicles || [];
    populateVehicleSelect();

    document.getElementById('vehicle-select').value = res.vehicle._id;
    onVehicleChange(res.vehicle._id);

  } catch (err) {
    showToast(err.message || 'Failed to add vehicle', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Add Vehicle';
  }
});

// Final Submit Booking Form
document.getElementById('booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('confirm-booking-btn');

  const vehicleId = document.getElementById('vehicle-select').value;
  const serviceId = document.getElementById('service-select').value;
  const bookingDate = document.getElementById('booking-date').value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';
  const customerNotes = document.getElementById('customer-notes').value.trim();

  if (!vehicleId) {
    showToast('Please select or register a vehicle first', 'error');
    return;
  }

  if (!serviceId) {
    showToast('Please select a service package', 'error');
    return;
  }

  if (!bookingDate) {
    showToast('Please select an appointment date', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Confirming Appointment...';

    const res = await API.post('/bookings', {
      vehicleId,
      serviceId,
      bookingDate,
      timeSlot: selectedSlot,
      paymentMethod,
      customerNotes
    });

    showToast('Service appointment booked successfully!', 'success');

    setTimeout(() => {
      window.location.href = `my-bookings.html?bookedId=${res.booking._id}`;
    }, 1000);

  } catch (err) {
    showToast(err.message || 'Booking submission failed', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirm & Book Appointment';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initBookingPage();
});
