/**
 * Main UI Helper Utilities
 * Includes Toast Notifications, Date & Currency Formatters, and Modal Triggers
 */

// Toast Notification Manager
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(60px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// Global shorthand
const showToast = (msg, type, duration) => Toast.show(msg, type, duration);

// Formatters
const formatCurrency = (val) => {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status Badge HTML Helper
const getStatusBadge = (status) => {
  const map = {
    'Pending': 'badge-pending',
    'Confirmed': 'badge-confirmed',
    'In Progress': 'badge-inprogress',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled'
  };

  const icons = {
    'Pending': 'fa-clock',
    'Confirmed': 'fa-check',
    'In Progress': 'fa-wrench',
    'Completed': 'fa-circle-check',
    'Cancelled': 'fa-circle-xmark'
  };

  const className = map[status] || 'badge-pending';
  const icon = icons[status] || 'fa-info-circle';

  return `<span class="badge ${className}"><i class="fa-solid ${icon}"></i> ${status}</span>`;
};

// Modal Utilities
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

// Global modal overlay click to dismiss
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
