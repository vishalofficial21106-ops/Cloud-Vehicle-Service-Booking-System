/**
 * Authentication and Session Management Helper
 */

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  logout() {
    this.clearAuth();
    window.location.href = '/login.html';
  },

  /**
   * Route guard: redirect to login if not logged in
   */
  requireAuth(adminOnly = false) {
    if (!this.isLoggedIn()) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (adminOnly && !this.isAdmin()) {
      alert('Access denied: Administrator privileges required.');
      window.location.href = '/customer-dashboard.html';
      return false;
    }

    return true;
  },

  /**
   * Dynamically renders standard navigation bar links based on current user session
   */
  renderNavbar() {
    const navMenu = document.getElementById('nav-menu');
    const navActions = document.getElementById('nav-actions');

    if (!navMenu || !navActions) return;

    const user = this.getUser();
    const loggedIn = this.isLoggedIn();

    if (loggedIn) {
      if (user.role === 'admin') {
        navMenu.innerHTML = `
          <li><a href="/index.html" class="nav-link"><i class="fa-solid fa-home"></i> Home</a></li>
          <li><a href="/admin-dashboard.html" class="nav-link"><i class="fa-solid fa-gauge-high"></i> Admin Console</a></li>
          <li><a href="/admin-dashboard.html#bookings" class="nav-link"><i class="fa-solid fa-calendar-check"></i> Bookings</a></li>
          <li><a href="/admin-dashboard.html#services" class="nav-link"><i class="fa-solid fa-wrench"></i> Services</a></li>
        `;
        navActions.innerHTML = `
          <div class="nav-user-pill">
            <i class="fa-solid fa-shield-halved text-purple"></i>
            <span>${user.name || 'Admin'}</span>
            <span class="badge badge-admin">Admin</span>
          </div>
          <button onclick="Auth.logout()" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        `;
      } else {
        // Customer
        navMenu.innerHTML = `
          <li><a href="/index.html" class="nav-link"><i class="fa-solid fa-home"></i> Home</a></li>
          <li><a href="/customer-dashboard.html" class="nav-link"><i class="fa-solid fa-table-columns"></i> Dashboard</a></li>
          <li><a href="/book-service.html" class="nav-link"><i class="fa-solid fa-calendar-plus"></i> Book Service</a></li>
          <li><a href="/my-bookings.html" class="nav-link"><i class="fa-solid fa-receipt"></i> My Bookings</a></li>
        `;
        navActions.innerHTML = `
          <div class="nav-user-pill">
            <i class="fa-solid fa-circle-user text-blue"></i>
            <span>${user.name || 'Customer'}</span>
            <span class="badge badge-customer">Customer</span>
          </div>
          <button onclick="Auth.logout()" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        `;
      }
    } else {
      // Logged out
      navMenu.innerHTML = `
        <li><a href="/index.html" class="nav-link"><i class="fa-solid fa-home"></i> Home</a></li>
        <li><a href="/index.html#services" class="nav-link"><i class="fa-solid fa-wrench"></i> Services</a></li>
        <li><a href="/index.html#how-it-works" class="nav-link"><i class="fa-solid fa-list-check"></i> How It Works</a></li>
      `;
      navActions.innerHTML = `
        <a href="/login.html" class="btn btn-outline btn-sm">Sign In</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Get Started</a>
      `;
    }
  }
};

// Auto-run renderNavbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.renderNavbar();
});
