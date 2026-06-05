/**
 * Ticket Card Component
 * Renders a single ticket card using pure CSS classes.
 */
import { formatDate } from '../utils/helpers.js';
import { getSession } from '../utils/session.js';

const STATUS_LABELS = {
    'pendiente':   'Pendiente',
    'en proceso':  'En Proceso',
    'asignado':    'Asignado',
    'solucionado': 'Solucionado'
};

const STATUS_CSS = {
    'pendiente':   'badge-pending',
    'en proceso':  'badge-pending',
    'asignado':    'badge-confirmed',
    'solucionado': 'badge-done'
};

const TIPO_LABELS = {
    'incidente':     'Incidente',
    'requerimiento': 'Requerimiento',
    'soporte':       'Soporte'
};

export function ticketCard(ticket) {
    const session     = getSession();
    const statusLabel = STATUS_LABELS[ticket.estado] || ticket.estado;
    const statusCss   = STATUS_CSS[ticket.estado]    || 'badge-muted';
    const tipoLabel   = TIPO_LABELS[ticket.tipo]     || ticket.tipo;
    const fecha       = formatDate(ticket.fechaCreacion);
    const techName    = ticket.tecnicoNombre || 'Sin asignar';
    const hasTech     = !!ticket.tecnicoId;

    const canEdit   = canEditTicket(ticket, session);
    const canDelete = session?.rol === 'admin';

    return `
        <div class="reservation-card">
            <div class="card-top">
                <div>
                    <span class="badge badge-muted" style="margin-bottom:4px">${tipoLabel}</span>
                    <div class="card-workspace">${ticket.nombre}</div>
                    <span class="small text-muted">
                        <i class="bi bi-person-fill"></i> ${ticket.clienteNombre || 'N/A'}
                    </span>
                </div>
                <span class="badge ${statusCss}">${statusLabel}</span>
            </div>

            <p class="card-reason">${ticket.descripcion}</p>

            <div class="card-meta">
                <span>
                    <i class="bi bi-person-gear"></i>
                    ${hasTech ? techName : 'Sin asignar'}
                </span>
                <span>
                    <i class="bi bi-calendar3"></i> ${fecha}
                </span>
            </div>

            ${canEdit || canDelete ? `
            <div class="card-actions">
                ${canEdit ? `
                    <button class="btn btn-outline btn-sm" data-action="edit" data-id="${ticket.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>` : ''}
                ${canDelete ? `
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${ticket.id}">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>` : ''}
            </div>` : ''}
        </div>
    `;
}

function canEditTicket(ticket, session) {
    if (!session) return false;
    if (session.rol === 'admin') return true;
    if (session.rol === 'tecnico') return ticket.tecnicoId === session.id;
    if (session.rol === 'cliente') {
        return ticket.clienteId === session.id && !ticket.tecnicoId && ticket.estado !== 'solucionado';
    }
    return false;
}
