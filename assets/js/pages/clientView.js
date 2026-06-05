/**
 * Client View — Pure CSS modal (no Bootstrap)
 */
import { loadHTML, today } from '../utils/helpers.js';
import { getSession } from '../utils/session.js';
import { guardRoute } from '../middleware/authMiddleware.js';
import { ticketCard } from '../components/ticketCard.js';
import { getTicketsByUser, createTicket, updateTicket } from '../services/jsonserver.js';

let myTickets = [];
let editingId = null;

function openModal()  { document.getElementById('clientTicketModal').classList.add('open'); }
function closeModal() { document.getElementById('clientTicketModal').classList.remove('open'); }

// ============================
// RENDER
// ============================
export async function renderClient() {
    const status  = guardRoute('cliente');
    const content = document.getElementById('content');

    if (status === 'unauthenticated') {
        content.innerHTML = '<div class="alert alert-warning">Sesión expirada. Por favor inicia sesión.</div>';
        return;
    }
    if (status === 'unauthorized') {
        content.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-shield-x"></i>
                <h4>Acceso Denegado</h4>
                <p>No tienes permisos para acceder al panel de cliente.</p>
            </div>`;
        return;
    }

    const session = getSession();
    content.innerHTML = await loadHTML('./assets/js/views/client.html');

    myTickets = await getTicketsByUser(session.id, 'cliente');

    renderClientStats();
    renderMyTickets();
    initClientEvents(session);
}

// ============================
// STATS
// ============================
function renderClientStats() {
    const c = {
        total:       myTickets.length,
        pendiente:   myTickets.filter(t => t.estado === 'pendiente').length,
        enproceso:   myTickets.filter(t => t.estado === 'en proceso').length,
        solucionado: myTickets.filter(t => t.estado === 'solucionado').length
    };

    document.getElementById('clientStats').innerHTML = `
        ${stat('Mis Tickets',  c.total,       '#2563eb')}
        ${stat('Pendientes',   c.pendiente,   '#6c757d')}
        ${stat('En Proceso',   c.enproceso,   '#e6a817')}
        ${stat('Solucionados', c.solucionado, '#198754')}
    `;
}

function stat(label, value, color) {
    return `
        <div class="stat-pill" style="border-left-color:${color}">
            <span class="stat-pill-value" style="color:${color}">${value}</span>
            <span class="stat-pill-label">${label}</span>
        </div>`;
}

// ============================
// RENDER TICKET LIST
// ============================
function renderMyTickets() {
    const container = document.getElementById('clientTicketsList');

    if (myTickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>Aún no has creado ningún ticket.</p>
                <p class="small">Haz clic en "Nueva Solicitud" para empezar.</p>
            </div>`;
        return;
    }

    container.innerHTML = myTickets.map(t => ticketCard(t)).join('');
}

// ============================
// EVENTS
// ============================
function initClientEvents(session) {
    document.getElementById('btnNuevoTicket').addEventListener('click', () => openEditModal(null));
    document.getElementById('btnGuardarClientTicket').addEventListener('click', () => saveTicket(session));

    // Cerrar modal
    document.getElementById('clientModalClose').addEventListener('click', closeModal);
    document.getElementById('clientModalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('clientTicketModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('clientTicketsList').addEventListener('click', event => {
        const btn = event.target.closest('[data-action]');
        if (!btn) return;
        const id     = parseInt(btn.dataset.id);
        const ticket = myTickets.find(t => t.id === id);
        if (btn.dataset.action === 'edit' && ticket) openEditModal(ticket);
    });
}

// ============================
// MODAL
// ============================
function openEditModal(ticket) {
    editingId = ticket ? ticket.id : null;

    document.getElementById('clientModalTitle').innerHTML =
        `<i class="bi bi-ticket me-2"></i>${ticket ? 'Editar Ticket' : 'Nueva Solicitud'}`;
    document.getElementById('clientTicketId').value          = ticket?.id           || '';
    document.getElementById('clientTicketNombre').value      = ticket?.nombre       || '';
    document.getElementById('clientTicketTipo').value        = ticket?.tipo         || '';
    document.getElementById('clientTicketDescripcion').value = ticket?.descripcion  || '';

    const alertEl = document.getElementById('clientModalAlert');
    alertEl.className = 'alert hidden';

    openModal();
}

// ============================
// SAVE
// ============================
async function saveTicket(session) {
    const nombre      = document.getElementById('clientTicketNombre').value.trim();
    const tipo        = document.getElementById('clientTicketTipo').value;
    const descripcion = document.getElementById('clientTicketDescripcion').value.trim();
    const alertEl     = document.getElementById('clientModalAlert');

    if (!nombre || !tipo || !descripcion) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Todos los campos son obligatorios.';
        alertEl.classList.remove('hidden');
        return;
    }

    try {
        if (editingId) {
            const updated = await updateTicket(editingId, { nombre, tipo, descripcion });
            myTickets = myTickets.map(t => t.id === editingId ? { ...t, ...updated } : t);
        } else {
            const ticketData = {
                nombre, tipo, descripcion,
                tecnicoId: null, tecnicoNombre: null,
                clienteId:     session.id,
                clienteNombre: session.name,
                estado:        'pendiente',
                fechaCreacion: today()
            };
            const created = await createTicket(ticketData);
            myTickets.push(created);
        }

        closeModal();
        renderClientStats();
        renderMyTickets();

    } catch (error) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Error al guardar el ticket.';
        alertEl.classList.remove('hidden');
        console.error('[clientView:saveTicket]', error);
    }
}
