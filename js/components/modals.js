// Gestión de modales

// Elementos para modales
const detalleModal = document.getElementById('detalle-modal');
const detalleModalBody = document.getElementById('detalle-modal-body');
const actualizarEstadoModal = document.getElementById('actualizar-estado-modal');
const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
const solicitudIdInput = document.getElementById('solicitud-id');
const nuevoEstadoSelect = document.getElementById('nuevo-estado');
const observacionesText = document.getElementById('observaciones');

// Configurar event listeners para modales
function setupModalsListeners() {
    // Evento para actualizar estado - este será sobreescrito o complementado en app.js
    if (actualizarEstadoForm) {
        // Este listener es un fallback o el principal si app.js no lo sobreescribe completamente.
        // Es mejor que la lógica principal de submit esté en un solo lugar (app.js).
        // Por ahora, lo dejamos, pero la idea es que app.js maneje el submit.
        actualizarEstadoForm.addEventListener('submit', handleActualizarEstado);
    }
}

// Mostrar el detalle de una solicitud
function showDetalleSolicitud(solicitudId) {
    console.log("Mostrando detalle de solicitud ID:", solicitudId);
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud) {
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        detalleModalBody.innerHTML = ''; // Limpiar contenido anterior

        let fechaEstimada = 'No establecida';
        if (solicitud.fechaEstimada) {
            fechaEstimada = formatDate(solicitud.fechaEstimada);
        }

        let fechaEntrega = 'Pendiente';
        if (solicitud.fechaEntrega) {
            fechaEntrega = formatDate(solicitud.fechaEntrega);
        } else if (solicitud.estado === 'Entregado' && solicitud.historial) {
            const entregaHistorial = [...solicitud.historial]
                .reverse()
                .find(h => h.estado === 'Entregado' && h.fechaEntrega);
            if (entregaHistorial && entregaHistorial.fechaEntrega) {
                fechaEntrega = formatDate(entregaHistorial.fechaEntrega);
            }
        }

        detalleModalBody.innerHTML = `
            <div class="card status-card mb-3 ${getStatusCardClass(solicitud.estado)}">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">ID:</span><span class="detail-value">${solicitud.id}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Nota de Venta:</span><span class="detail-value">${solicitud.notaVenta}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Cliente:</span><span class="detail-value">${solicitud.cliente || 'No especificado'}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Local:</span><span class="detail-value">${solicitud.local || 'No especificado'}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha de Solicitud:</span><span class="detail-value">${formatDate(solicitud.fechaSolicitud)}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Estado:</span><span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span></div></div>
                        ${solicitud.creadoPor ? `<div class="col-md-6"><div class="detail-item"><span class="detail-label">Creado por:</span><span class="detail-value">${solicitud.creadoPor.displayName}</span></div></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-calendar-alt me-2"></i>Fechas Clave</h6></div>
                <div class="detail-section-content">
                    <div class="row g-3">
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha Estimada Entrega:</span><span class="detail-value">${fechaEstimada}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha Entrega Real:</span><span class="detail-value">${fechaEntrega}</span></div></div>
                    </div>
                </div>
            </div>
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-comment-alt me-2"></i>Observaciones</h6></div>
                <div class="detail-section-content"><p>${solicitud.observaciones || 'Sin observaciones'}</p></div>
            </div>
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-boxes me-2"></i>Productos Solicitados</h6></div>
                <div class="detail-section-content">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped mb-0">
                            <thead><tr><th>SKU</th><th>Producto</th><th style="width: 20%">Cantidad</th></tr></thead>
                            <tbody>${solicitud.items.map(item => `<tr><td>${item.sku || 'N/A'}</td><td>${item.producto}</td><td>${item.cantidad}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Cambios</h6></div>
                <div class="detail-section-content">
                    <div class="history-container">
                        ${(solicitud.historial || []).map(hist => `
                            <div class="history-item">
                                <div class="history-date">${formatDateTime(hist.fecha)}</div>
                                <div class="history-content">
                                    <div><strong>Estado:</strong> <span class="badge ${getStatusBadgeClass(hist.estado)}">${hist.estado}</span></div>
                                    ${hist.observaciones ? `<div><strong>Observaciones:</strong> ${hist.observaciones}</div>` : ''}
                                    ${hist.fechaEstimada ? `<div><strong>Fecha Estimada (en este cambio):</strong> ${formatDate(hist.fechaEstimada)}</div>` : ''}
                                    ${hist.fechaEntrega ? `<div><strong>Fecha Entrega (en este cambio):</strong> ${formatDate(hist.fechaEntrega)}</div>` : ''}
                                    <div><strong>Usuario:</strong> <span class="text-primary">${hist.usuario}</span></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .detail-item { margin-bottom: 0.5rem; }
            .detail-label { font-weight: 500; color: #495057; display: block; font-size: 0.8rem; }
            .detail-value { font-size: 1rem; }
            .detail-section { border: 1px solid #dee2e6; border-radius: 0.375rem; overflow: hidden; }
            .detail-section-header { padding: 0.75rem; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; }
            .detail-section-content { padding: 0.75rem; }
            .history-container .history-item:not(:last-child) { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #eee; }
        `;
        detalleModalBody.appendChild(style);

        let modalInstance = bootstrap.Modal.getInstance(detalleModal);
        if (modalInstance) {
            modalInstance.dispose();
        }
        modalInstance = new bootstrap.Modal(detalleModal, { backdrop: 'static', keyboard: true });
        detalleModal.addEventListener('hidden.bs.modal', function() {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, { once: true });
        modalInstance.show();
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
    }
}

function getStatusCardClass(estado) {
    switch (estado) {
        case 'Solicitud enviada por bodega': return 'pending';
        case 'En fabricación': return 'processing';
        case 'Entregado': return 'completed';
        default: return '';
    }
}

function showActualizarEstadoModal(solicitudId) {
    console.log("Mostrando modal de actualización para ID:", solicitudId);
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud) {
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) existingBackdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        solicitudIdInput.value = solicitudId;
        nuevoEstadoSelect.value = solicitud.estado; // Más directo

        const fechaEstimadaContainer = document.getElementById('fecha-estimada-container');
        const fechaEstimadaInput = document.getElementById('fecha-estimada');
        const fechaEntregaContainer = document.getElementById('fecha-entrega-container');
        const fechaEntregaInput = document.getElementById('fecha-entrega');

        const hoy = new Date();
        const fechaActual = hoy.toISOString().split('T')[0];

        // Función interna para manejar la lógica de visibilidad y valores de fechas
        const actualizarVisibilidadFechas = (estadoSeleccionado) => {
            if (estadoSeleccionado === 'En fabricación') {
                fechaEstimadaContainer.style.display = 'block';
                fechaEntregaContainer.style.display = 'none';
                fechaEstimadaInput.value = solicitud.fechaEstimada || (() => {
                    const fechaFutura = new Date();
                    fechaFutura.setDate(hoy.getDate() + 5);
                    return fechaFutura.toISOString().split('T')[0];
                })();
                fechaEntregaInput.value = ''; // Limpiar por si acaso
            } else if (estadoSeleccionado === 'Entregado') {
                fechaEstimadaContainer.style.display = 'block'; // Mostrarla si existe, aunque no sea editable aquí necesariamente
                fechaEntregaContainer.style.display = 'block';
                fechaEstimadaInput.value = solicitud.fechaEstimada || fechaActual; // Mostrar estimada actual o hoy
                fechaEntregaInput.value = solicitud.fechaEntrega || fechaActual; // Mostrar entrega real o hoy
            } else { // Para 'Solicitud enviada por bodega' u otros
                fechaEstimadaContainer.style.display = 'none';
                fechaEntregaContainer.style.display = 'none';
                fechaEstimadaInput.value = '';
                fechaEntregaInput.value = '';
            }
        };

        // Llamar para el estado inicial
        actualizarVisibilidadFechas(solicitud.estado);

        // Remover listener anterior para evitar duplicados si se abre el modal varias veces
        const oldHandler = nuevoEstadoSelect._handleEstadoChange;
        if (oldHandler) {
            nuevoEstadoSelect.removeEventListener('change', oldHandler);
        }

        // Definir el nuevo handler
        const handleEstadoChange = function() {
            actualizarVisibilidadFechas(this.value);
        };
        nuevoEstadoSelect.addEventListener('change', handleEstadoChange);
        nuevoEstadoSelect._handleEstadoChange = handleEstadoChange; // Guardar referencia para remover después

        observacionesText.value = solicitud.observaciones || '';

        const modalTitle = actualizarEstadoModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>Actualizar Estado 
                <small class="text-muted">(Nota: ${solicitud.notaVenta}${solicitud.cliente ? ` | Cliente: ${solicitud.cliente}` : ''})</small>`;
        }

        let modalInstance = bootstrap.Modal.getInstance(actualizarEstadoModal);
        if (modalInstance) modalInstance.dispose();
        modalInstance = new bootstrap.Modal(actualizarEstadoModal, { backdrop: true, keyboard: true });
        actualizarEstadoModal.addEventListener('hidden.bs.modal', function() {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
             // Remover el listener de cambio de estado para limpiar
            if (nuevoEstadoSelect._handleEstadoChange) {
                nuevoEstadoSelect.removeEventListener('change', nuevoEstadoSelect._handleEstadoChange);
                delete nuevoEstadoSelect._handleEstadoChange;
            }
        }, { once: true });
        modalInstance.show();
        setTimeout(() => nuevoEstadoSelect.focus(), 500);

    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
    }
}

// Esta función será llamada por el event listener en app.js
// Podría simplificarse o eliminarse si app.js toma toda la responsabilidad del submit.
function handleActualizarEstado(e) {
    e.preventDefault();
    console.log("Fallback: handleActualizarEstado en modals.js llamado. Esto debería ser manejado por app.js.");

    // Si app.js no tiene su propio handler para el form (lo cual no debería pasar con overrideUpdateHandlers),
    // esta función actuaría, pero sin la lógica completa de usuario y fechas que está en app.js.
    // Por seguridad, se puede dejar una implementación básica, pero la idea es que no se llegue aquí.

    const solicitudId = solicitudIdInput.value;
    const nuevoEstado = nuevoEstadoSelect.value;
    const observaciones = observacionesText.value;
    const fechaEstimadaInput = document.getElementById('fecha-estimada');
    const fechaEntregaInput = document.getElementById('fecha-entrega');

    let fechaEstimada = null;
    let fechaEntrega = null;

    if (nuevoEstado === 'En fabricación' && fechaEstimadaInput.offsetParent !== null) { // visible
        fechaEstimada = fechaEstimadaInput.value;
    } else if (nuevoEstado === 'Entregado') {
        if (fechaEstimadaInput.offsetParent !== null) fechaEstimada = fechaEstimadaInput.value;
        if (fechaEntregaInput.offsetParent !== null) fechaEntrega = fechaEntregaInput.value;
    }
    
    // Intentar llamar a la función global si existe (desde app.js)
    if (typeof window.handleActualizarEstadoConUsuario === 'function' && typeof window.getCurrentUser === 'function') {
        const user = window.getCurrentUser();
        if (user) {
            window.handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada, fechaEntrega);
        } else {
            mostrarAlerta('Usuario no disponible. Inicie sesión.', 'danger');
        }
    } else {
        mostrarAlerta('Error: Función de actualización principal no disponible.', 'danger');
    }
}

window.showDetalleSolicitud = showDetalleSolicitud;
window.showActualizarEstadoModal = showActualizarEstadoModal;
