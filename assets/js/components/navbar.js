/**
 * Navbar Component
 * Renders a role-aware navbar. Shows nothing when not logged in.
 */
import { getSession, clearSession } from '../utils/session.js';

const ROLE_LABELS = { admin: 'Administrador', tecnico: 'Técnico', cliente: 'Cliente' };
const ROLE_CSS    = { admin: 'badge-admin',   tecnico: 'badge-primary', cliente: 'badge-user' };

export function loadNavbar() {
    const navbar = document.getElementById('navbar');
    const session = getSession();

    if (!session) { navbar.innerHTML = ''; return; }

    const label = ROLE_LABELS[session.rol] || session.rol;
    const css   = ROLE_CSS[session.rol]    || 'badge-muted';

    navbar.innerHTML = `
        <nav class="navbar">
            <a class="navbar-brand" href="/${session.rol}" data-link>
                <i class="bi bi-ticket-detailed-fill"></i>
                <span>TMS</span>
            </a>
            <div class="navbar-end">
                <div class="navbar-user">
                    <i class="bi bi-person-circle"></i>
                    <span>${session.name}</span>
                    <span class="badge ${css}">${label}</span>
                </div>
                <button id="logoutBtn" class="btn btn-outline-light btn-sm">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </nav>
    `;

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

function handleLogout() {
    if (!confirm('¿Deseas cerrar sesión?')) return;
    clearSession();
    loadNavbar();
    history.pushState(null, null, '/login');
    import('../pages/loginView.js').then(m => m.renderLogin());
}
