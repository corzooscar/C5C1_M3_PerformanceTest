/**
 * Tech View — Pure CSS modal (no Bootstrap)
 */
import { loadHTML, today } from '../utils/helpers.js';
import { getSession } from '../utils/session.js';
import { guardRoute } from '../middleware/authMiddleware.js';
import { ticketCard } from '../components/ticketCard.js';
import { getTicketsByUser, createTicket, updateTicket } from '../services/jsonserver.js';

let myTickets = [];
let editingId = null;

function openModal()  { document.getElementById('techTicketModal').classList.add('open'); }
function closeModal() { document.getElementById('techTicketModal').classList.remove('open'); }

export async function renderTech() {
    const status  = guardRoute('tecnico');
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
            </div>`;
        return;
    }

    const session = getSession();
    content.innerHTML = await loadHTML('./assets/js/views/tech.html');
    myTickets = await getTicketsByUser(session.id, 'tecnico');

    renderTechStats();
    renderMyTickets();
    initTechEvents(session);
}

function renderTechStats() {
    const c = {
        total:       myTickets.length,
        enproceso:   myTickets.filter(t => t.estado === 'en proceso').length,
        asignado:    myTickets.filter(t => t.estado === 'asignado').length,
        solucionado: myTickets.filter(t => t.estado === 'solucionado').length
    };

    document.getElementById('techStats').innerHTML = `
        ${stat('Mis Tickets', c.total,       '#2563eb')}
        ${stat('En Proceso',  c.enproceso,   '#e6a817')}
        ${stat('Asignados',   c.asignado,    '#0aa8c7')}
        ${stat('Solucionados',c.solucionado, '#198754')}
    `;
}

function stat(label, value, color) {
    return `
        <div class="stat-pill" style="border-left-color:${color}">
            <span class="stat-pill-value" style="color:${color}">${value}</span>
            <span class="stat-pill-label">${label}</span>
        </div>`;
}

function renderMyTickets() {
    const container = document.getElementById('techTicketsList');
    if (myTickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>No tienes tickets asignados aún.</p>
            </div>`;
        return;
    }
    container.innerHTML = myTickets.map(t => ticketCard(t)).join('');
}

function initTechEvents(session) {
    document.getElementById('btnNuevoTicket').addEventListener('click', () => openEditModal(null));
    document.getElementById('btnGuardarTechTicket').addEventListener('click', () => saveTicket(session));

    document.getElementById('techModalClose').addEventListener('click', closeModal);
    document.getElementById('techModalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('techTicketModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('techTicketsList').addEventListener('click', event => {
        const btn = event.target.closest('[data-action]');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        const ticket = myTickets.find(t => t.id === id);
        if (btn.dataset.action === 'edit' && ticket) openEditModal(ticket);
    });
}

function openEditModal(ticket) {
    editingId = ticket ? ticket.id : null;

    document.getElementById('techModalTitle').innerHTML =
        `<i class="bi bi-ticket me-2"></i>${ticket ? 'Editar Ticket' : 'Nuevo Ticket'}`;
    document.getElementById('techTicketId').value          = ticket?.id           || '';
    document.getElementById('techTicketNombre').value      = ticket?.nombre       || '';
    document.getElementById('techTicketTipo').value        = ticket?.tipo         || '';
    document.getElementById('techTicketDescripcion').value = ticket?.descripcion  || '';
    document.getElementById('techTicketEstado').value      = ticket?.estado       || 'en proceso';

    const alertEl = document.getElementById('techModalAlert');
    alertEl.className = 'alert hidden';

    openModal();
}

async function saveTicket(session) {
    const nombre      = document.getElementById('techTicketNombre').value.trim();
    const tipo        = document.getElementById('techTicketTipo').value;
    const descripcion = document.getElementById('techTicketDescripcion').value.trim();
    const estado      = document.getElementById('techTicketEstado').value;
    const alertEl     = document.getElementById('techModalAlert');

    if (!nombre || !tipo || !descripcion) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Todos los campos son obligatorios.';
        alertEl.classList.remove('hidden');
        return;
    }

    try {
        if (editingId) {
            const updated = await updateTicket(editingId, { nombre, tipo, descripcion, estado });
            myTickets = myTickets.map(t => t.id === editingId ? { ...t, ...updated } : t);
        } else {
            const created = await createTicket({
                nombre, tipo, descripcion, estado,
                tecnicoId: session.id, tecnicoNombre: session.name,
                clienteId: session.id, clienteNombre: session.name,
                fechaCreacion: today()
            });
            myTickets.push(created);
        }

        closeModal();
        renderTechStats();
        renderMyTickets();

    } catch (error) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Error al guardar el ticket.';
        alertEl.classList.remove('hidden');
        console.error('[techView:saveTicket]', error);
    }
}
