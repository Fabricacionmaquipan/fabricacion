// Gestión de modales

// --- TUS ELEMENTOS Y FUNCIONES EXISTENTES ---
const detalleModal = document.getElementById('detalle-modal');
const detalleModalBody = document.getElementById('detalle-modal-body');
const actualizarEstadoModal = document.getElementById('actualizar-estado-modal');
const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
const solicitudIdInput = document.getElementById('solicitud-id');
const nuevoEstadoSelect = document.getElementById('nuevo-estado');
const observacionesText = document.getElementById('observaciones');

// Configurar event listeners para modales específicos (si aún los necesitas aquí)
function setupModalsListeners() {
    if (actualizarEstadoForm) {
        // Considera si este listener debe estar en app.js o ser más específico
        // para evitar colisiones si se llama setupModalsListeners varias veces.
        // Por ahora, lo dejamos como estaba.
        actualizarEstadoForm.addEventListener('submit', handleActualizarEstado);
    }
}

// Mostrar el detalle de una solicitud (tu función existente)
function showDetalleSolicitud(solicitudId) {
    console.log("Mostrando detalle de solicitud ID:", solicitudId);
    // Asumimos que 'solicitudes' es una variable global accesible que contiene el array de solicitudes.
    // Es mejor pasar 'solicitudes' como parámetro o acceder a ella desde un módulo de datos.
    if (typeof solicitudes === 'undefined') {
        console.error("La variable 'solicitudes' no está definida. No se puede mostrar el detalle.");
        if(typeof mostrarAlerta === 'function') mostrarAlerta('Error: Datos de solicitudes no disponibles.', 'danger');
        return;
    }
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud) {
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        if (!detalleModalBody) {
            console.error("Elemento 'detalle-modal-body' no encontrado.");
            return;
        }
        detalleModalBody.innerHTML = ''; // Limpiar

        // ... (resto de tu lógica para llenar detalleModalBody) ...
        // Asegúrate que formatDate, formatDateTime, getStatusBadgeClass, getStatusCardClass
        // y mostrarAlerta estén disponibles globalmente o importadas si usas módulos ES6.

        // Ejemplo de cómo asegurar que las funciones de formato están disponibles
        const safeFormatDate = (dateStr) => typeof formatDate === 'function' ? formatDate(dateStr) : dateStr;
        const safeFormatDateTime = (dateStr) => typeof formatDateTime === 'function' ? formatDateTime(dateStr) : dateStr;


        detalleModalBody.innerHTML = `
            <div class="card status-card mb-3 ${typeof getStatusCardClass === 'function' ? getStatusCardClass(solicitud.estado) : ''}">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">ID:</span><span class="detail-value">${solicitud.id}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Nota de Venta:</span><span class="detail-value">${solicitud.notaVenta}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Cliente:</span><span class="detail-value">${solicitud.cliente || 'No especificado'}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Local:</span><span class="detail-value">${solicitud.local || 'No especificado'}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha de Solicitud:</span><span class="detail-value">${safeFormatDate(solicitud.fechaSolicitud)}</span></div></div>
                        <div class="col-md-6"><div class="detail-item"><span class="detail-label">Estado:</span><span class="badge ${typeof getStatusBadgeClass === 'function' ? getStatusBadgeClass(solicitud.estado) : ''}">${solicitud.estado}</span></div></div>
                        ${solicitud.creadoPor ? `<div class="col-md-6"><div class="detail-item"><span class="detail-label">Creado por:</span><span class="detail-value">${solicitud.creadoPor.displayName}</span></div></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-comment-alt me-2"></i>Observaciones</h6></div>
                <div class="detail-section-content"><p>${solicitud.observaciones || 'Sin observaciones'}</p></div>
            </div>
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-boxes me-2"></i>Productos Solicitados</h6></div>
                <div class="detail-section-content"><div class="table-responsive"><table class="table table-sm table-striped mb-0">
                    <thead><tr><th>SKU</th><th>Producto</th><th style="width: 20%">Cantidad</th></tr></thead>
                    <tbody>${solicitud.items.map(item => `<tr><td>${item.sku || 'N/A'}</td><td>${item.producto}</td><td>${item.cantidad}</td></tr>`).join('')}</tbody>
                </table></div></div>
            </div>
            <div class="detail-section">
                <div class="detail-section-header mb-2"><h6 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Cambios</h6></div>
                <div class="detail-section-content"><div class="history-container">
                    ${(solicitud.historial || []).map(hist => `
                        <div class="history-item">
                            <div class="history-date">${safeFormatDateTime(hist.fecha)}</div>
                            <div class="history-content">
                                <div><strong>Estado:</strong> <span class="badge ${typeof getStatusBadgeClass === 'function' ? getStatusBadgeClass(hist.estado) : ''}">${hist.estado}</span></div>
                                ${hist.observaciones ? `<div><strong>Observaciones:</strong> ${hist.observaciones}</div>` : ''}
                                <div><strong>Usuario:</strong> <span class="text-primary">${hist.usuario}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div></div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `/* ... tus estilos para .detail-item, etc. ... */`;
        detalleModalBody.appendChild(style);

        if (!detalleModal) {
            console.error("Elemento 'detalle-modal' no encontrado para instanciar Bootstrap Modal.");
            return;
        }
        let modalInstance = bootstrap.Modal.getInstance(detalleModal);
        if (modalInstance) {
            modalInstance.dispose();
        }
        modalInstance = new bootstrap.Modal(detalleModal, { backdrop: 'static', keyboard: true });
        detalleModal.addEventListener('hidden.bs.modal', function() { /* ... tu lógica de limpieza ... */ }, { once: true });
        modalInstance.show();
    } else {
        if(typeof mostrarAlerta === 'function') mostrarAlerta('No se encontró la solicitud.', 'danger');
        else alert('No se encontró la solicitud.');
    }
}

// Obtener clase para tarjeta según estado (tu función existente)
function getStatusCardClass(estado) {
    // ... tu lógica ...
    switch (estado) {
        case 'Solicitud enviada por bodega': return 'pending';
        case 'En fabricación': return 'processing';
        case 'Entregado': return 'completed';
        default: return '';
    }
}

// Mostrar el modal para actualizar estado (tu función existente)
function showActualizarEstadoModal(solicitudId) {
    console.log("Mostrando modal de actualización para ID:", solicitudId);
    // ... (resto de tu lógica) ...
    // Asegúrate que 'solicitudes', 'formatDate', 'mostrarAlerta' estén disponibles.
    // Y que los elementos como 'fecha-estimada-container', etc., existan en el HTML del modal 'actualizar-estado-modal'.

    if (typeof solicitudes === 'undefined') {
        console.error("La variable 'solicitudes' no está definida. No se puede mostrar el modal de actualización.");
        if(typeof mostrarAlerta === 'function') mostrarAlerta('Error: Datos de solicitudes no disponibles.', 'danger');
        return;
    }
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud && actualizarEstadoModal && solicitudIdInput && nuevoEstadoSelect && observacionesText) {
        // ... (tu lógica existente para llenar y mostrar el modal 'actualizar-estado-modal')
        // Limpieza de backdrop
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) existingBackdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        solicitudIdInput.value = solicitudId;
        // ... resto de tu lógica ...

        let modalInstance = bootstrap.Modal.getInstance(actualizarEstadoModal);
        if (modalInstance) modalInstance.dispose();
        modalInstance = new bootstrap.Modal(actualizarEstadoModal, { backdrop: true, keyboard: true });
        actualizarEstadoModal.addEventListener('hidden.bs.modal', function() { /* ... tu lógica de limpieza ... */ }, { once: true });
        modalInstance.show();
    } else {
        if (!solicitud) {
            if(typeof mostrarAlerta === 'function') mostrarAlerta('No se encontró la solicitud.', 'danger');
            else alert('No se encontró la solicitud.');
        } else {
            console.error("Faltan elementos del DOM para el modal de actualizar estado.");
        }
    }
}

// Manejar la actualización de estado (tu función existente)
function handleActualizarEstado(e) {
    e.preventDefault();
    console.log("Manejando actualización de estado");
    // ... (resto de tu lógica) ...
    // Asegúrate que 'solicitudesRef', 'getCurrentUser', 'handleActualizarEstadoConUsuario',
    // 'mostrarSincronizacion', 'ocultarSincronizacion', 'mostrarAlerta' estén disponibles.
    // Esta función parece depender mucho de variables y funciones globales o de otros módulos.
}

// Exponer funciones al ámbito global (como ya lo haces)
window.showDetalleSolicitud = showDetalleSolicitud;
window.showActualizarEstadoModal = showActualizarEstadoModal;

// --- FIN DE TUS FUNCIONES EXISTENTES ---


// --- INICIO: NUEVO componentesModule ---
(function() {
    /**
     * Función interna para crear y mostrar un modal de Bootstrap dinámicamente.
     * @param {string} modalId - ID único para el elemento del modal.
     * @param {string} titulo - Título del modal.
     * @param {string} contenidoHtml - Contenido HTML para el cuerpo del modal.
     * @param {string} tamaño - Tamaño del modal ('sm', 'md', 'lg', 'xl'). Por defecto 'md'.
     * @param {string|null} pieDeModalHtml - HTML para el pie del modal. Si es null, usa un botón "Cerrar" por defecto.
     * @returns {object} La instancia del modal de Bootstrap.
     */
    function _crearYMostrarModalBootstrap(modalId, titulo, contenidoHtml, tamaño = 'md', pieDeModalHtml = null) {
        // Remover cualquier modal existente con el mismo ID para evitar duplicados o estados conflictivos
        let modalElement = document.getElementById(modalId);
        if (modalElement) {
            // Si existe una instancia de Bootstrap asociada, deshazte de ella primero
            const existingBsModal = bootstrap.Modal.getInstance(modalElement);
            if (existingBsModal) {
                existingBsModal.hide(); // Oculta antes de desechar para evitar problemas con el backdrop
                existingBsModal.dispose();
            }
            modalElement.remove(); // Elimina el elemento del DOM
        }

        // Crear el nuevo elemento del modal
        modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = modalId;
        modalElement.setAttribute('tabindex', '-1');
        modalElement.setAttribute('aria-labelledby', modalId + 'Label');
        modalElement.setAttribute('aria-hidden', 'true');
        document.body.appendChild(modalElement);

        const defaultFooter = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>';
        const footerHtml = pieDeModalHtml !== null ? pieDeModalHtml : defaultFooter;

        modalElement.innerHTML = `
            <div class="modal-dialog modal-${tamaño} modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${contenidoHtml}
                    </div>
                    <div class="modal-footer">
                         ${footerHtml}
                    </div>
                </div>
            </div>
        `;

        // Crear y mostrar la nueva instancia del modal de Bootstrap
        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.show();

        // Limpiar el modal del DOM cuando se oculte para evitar acumulación
        modalElement.addEventListener('hidden.bs.modal', function onModalHidden() {
            bsModal.dispose(); // Importante para limpiar la instancia de Bootstrap
            modalElement.remove();
            // Remover cualquier backdrop que haya quedado huérfano
            const orphanBackdrop = document.querySelector('.modal-backdrop');
            if(orphanBackdrop) {
                orphanBackdrop.remove();
            }
            // Asegurarse de que el body recupera el scroll si es necesario
            if (document.querySelectorAll('.modal.show').length === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.paddingRight = '';
                document.body.style.overflow = '';
            }
        }, { once: true });

        return bsModal; // Devuelve la instancia por si se necesita
    }

    // Definir y exponer el componentesModule
    window.componentesModule = {
        /**
         * Muestra un modal genérico con el título y contenido especificados.
         * @param {string} titulo - Título del modal.
         * @param {string} contenidoHtml - Contenido HTML para el cuerpo del modal.
         * @param {string} [tamaño='md'] - Tamaño del modal ('sm', 'md', 'lg', 'xl').
         * @param {string|null} [pieDeModalHtml=null] - HTML para el pie del modal. Si es null, usa un botón "Cerrar".
         * @returns {object} La instancia del modal de Bootstrap.
         */
        mostrarModal: function(titulo, contenidoHtml, tamaño = 'md', pieDeModalHtml = null) {
            const idUnicoParaModal = 'app-dynamic-modal-' + Date.now() + Math.random().toString(36).substr(2, 5);
            console.log(`componentesModule.mostrarModal: Creando modal con ID ${idUnicoParaModal}`);
            return _crearYMostrarModalBootstrap(idUnicoParaModal, titulo, contenidoHtml, tamaño, pieDeModalHtml);
        }
        // Aquí podrías agregar otras funciones de componentes comunes en el futuro,
        // por ejemplo, para mostrar alertas/notificaciones, etc.
    };

    // Log para confirmar que el módulo se ha cargado y definido
    console.log('Módulo componentesModule (con mostrarModal genérico) inicializado y asignado a window.');

})(); // IIFE para encapsular y ejecutar inmediatamente

// Llamar a setupModalsListeners si es necesario al cargar este script
// o asegurarse de que se llama desde app.js o un punto de entrada principal.
// document.addEventListener('DOMContentLoaded', setupModalsListeners);
// Es mejor que la inicialización de listeners se maneje desde un punto central (ej. app.js)
// para controlar el orden y evitar múltiples adjunciones.
