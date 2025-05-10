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
    // Evento para actualizar estado - este será sobreescrito en app.js
    if (actualizarEstadoForm) {
        actualizarEstadoForm.addEventListener('submit', handleActualizarEstado);
    }
    
    // Delegación de eventos para botones de modales
    document.addEventListener('click', (e) => {
        // Evento para mostrar detalle
        if (e.target.classList.contains('btn-detalle') || e.target.closest('.btn-detalle')) {
            const button = e.target.classList.contains('btn-detalle') ? e.target : e.target.closest('.btn-detalle');
            const solicitudId = button.getAttribute('data-id');
            showDetalleSolicitud(solicitudId);
        }
        
        // Evento para cambiar estado
        if (e.target.classList.contains('btn-cambiar-estado') || e.target.closest('.btn-cambiar-estado')) {
            // Verificar permisos
            if (!hasPermission('cambiar_estado')) {
                mostrarAlerta('No tienes permisos para cambiar el estado de las solicitudes', 'warning');
                return;
            }
            
            const button = e.target.classList.contains('btn-cambiar-estado') ? e.target : e.target.closest('.btn-cambiar-estado');
            const solicitudId = button.getAttribute('data-id');
            showActualizarEstadoModal(solicitudId);
        }
    });
}

// Verificar permisos del usuario actual
function hasPermission(action) {
    // Si no hay sistema de autenticación implementado, permitir todo
    if (typeof getCurrentUser !== 'function') return true;
    
    // Si hay función de verificación de permisos, usarla
    if (typeof window.hasPermission === 'function') {
        return window.hasPermission(action);
    }
    
    // Verificación básica basada en roles
    const user = getCurrentUser();
    if (!user) return false;
    
    // Permisos por rol
    const permisos = {
        'bodega': ['crear_solicitud', 'ver_solicitudes_bodega'],
        'fabricacion': ['ver_solicitudes', 'cambiar_estado'],
        'admin': ['ver_solicitudes', 'cambiar_estado', 'eliminar_solicitud', 'exportar_datos', 'ver_estadisticas']
    };
    
    const permisosUsuario = permisos[user.role] || [];
    return permisosUsuario.includes(action);
}

// Mostrar el detalle de una solicitud
function showDetalleSolicitud(solicitudId) {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        // Llenar el modal con los detalles
        detalleModalBody.innerHTML = `
            <div class="card status-card mb-3 ${getStatusCardClass(solicitud.estado)}">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">ID:</span>
                                <span class="detail-value">${solicitud.id}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Nota de Venta:</span>
                                <span class="detail-value">${solicitud.notaVenta}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Fecha de Solicitud:</span>
                                <span class="detail-value">${formatDate(solicitud.fechaSolicitud)}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Estado:</span>
                                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
                            </div>
                        </div>
                        ${solicitud.creadoPor ? `
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Creado por:</span>
                                <span class="detail-value">${solicitud.creadoPor.displayName}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2">
                    <h6 class="mb-0"><i class="fas fa-comment-alt me-2"></i>Observaciones</h6>
                </div>
                <div class="detail-section-content">
                    <p>${solicitud.observaciones || 'Sin observaciones'}</p>
                </div>
            </div>
            
            <div class="detail-section mb-3">
                <div class="detail-section-header mb-2">
                    <h6 class="mb-0"><i class="fas fa-boxes me-2"></i>Productos Solicitados</h6>
                </div>
                <div class="detail-section-content">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th style="width: 30%">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${solicitud.items.map(item => `
                                    <tr>
                                        <td>${item.producto}</td>
                                        <td>${item.cantidad}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-header mb-2">
                    <h6 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Cambios</h6>
                </div>
                <div class="detail-section-content">
                    <div class="history-container">
                        ${solicitud.historial.map(hist => `
                            <div class="history-item">
                                <div class="history-date">${formatDateTime(hist.fecha)}</div>
                                <div class="history-content">
                                    <div><strong>Estado:</strong> 
                                        <span class="badge ${getStatusBadgeClass(hist.estado)}">${hist.estado}</span>
                                    </div>
                                    ${hist.observaciones ? `<div><strong>Observaciones:</strong> ${hist.observaciones}</div>` : ''}
                                    <div><strong>Usuario:</strong> <span class="text-primary">${hist.usuario}</span></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Aplicar estilos CSS adicionales
        const style = document.createElement('style');
        style.textContent = `
            .detail-item {
                margin-bottom: 0.5rem;
            }
            .detail-label {
                font-weight: 500;
                color: #495057;
                display: block;
                font-size: 0.8rem;
            }
            .detail-value {
                font-size: 1rem;
            }
            .detail-section {
                border: 1px solid #dee2e6;
                border-radius: 0.375rem;
                overflow: hidden;
            }
            .detail-section-header {
                padding: 0.75rem;
                background-color: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
            }
            .detail-section-content {
                padding: 0.75rem;
            }
        `;
        detalleModalBody.appendChild(style);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(detalleModal);
        modal.show();
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
    }
}

// Obtener clase para tarjeta según estado
function getStatusCardClass(estado) {
    switch (estado) {
        case 'Solicitud enviada por bodega':
            return 'pending';
        case 'En fabricación':
            return 'processing';
        case 'Entregado':
            return 'completed';
        default:
            return '';
    }
}

// Mostrar el modal para actualizar estado
function showActualizarEstadoModal(solicitudId) {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        solicitudIdInput.value = solicitudId;
        
        // Establecer el estado actual
        for (let i = 0; i < nuevoEstadoSelect.options.length; i++) {
            if (nuevoEstadoSelect.options[i].value === solicitud.estado) {
                nuevoEstadoSelect.selectedIndex = i;
                break;
            }
        }
        
        // Establecer observaciones
        observacionesText.value = solicitud.observaciones || '';
        
        // Preparar el modal con info adicional
        const modalTitle = actualizarEstadoModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>Actualizar Estado <small class="text-muted">(Nota: ${solicitud.notaVenta})</small>`;
        }
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(actualizarEstadoModal);
        modal.show();
        
        // Focus en el selector de estado
        setTimeout(() => {
            nuevoEstadoSelect.focus();
        }, 500);
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
    }
}

// Manejar la actualización de estado (será sobreescrito en app.js)
function handleActualizarEstado(e) {
    e.preventDefault();
    
    // Este método es un placeholder y será reemplazado por la versión
    // que incluye información del usuario en app.js
    const solicitudId = solicitudIdInput.value;
    const nuevoEstado = nuevoEstadoSelect.value;
    const observaciones = observacionesText.value;
    
    // Verificar si tenemos el usuario actual
    if (typeof getCurrentUser === 'function') {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Usar la función con información de usuario
            if (typeof handleActualizarEstadoConUsuario === 'function') {
                handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, currentUser);
                return;
            }
        }
    }
    
    // Si no se pudo obtener el usuario o no existe la función con usuario,
    // usar la implementación básica
    mostrarSincronizacion('Actualizando estado...');
    
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        try {
            // Crear una copia de la solicitud para actualizar
            const solicitudActualizada = {...solicitud};
            
            // Actualizar estado y observaciones
            solicitudActualizada.estado = nuevoEstado;
            solicitudActualizada.observaciones = observaciones;
            
            // Agregar al historial
            solicitudActualizada.historial.push({
                fecha: new Date().toISOString(),
                estado: nuevoEstado,
                observaciones: observaciones,
                usuario: 'Usuario del sistema' // Valor genérico sin autenticación
            });
            
            // Guardar en Firebase
            solicitudesRef.child(solicitudId).update(solicitudActualizada)
                .then(() => {
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(actualizarEstadoModal);
                    modal.hide();
                    
                    mostrarAlerta('Estado actualizado correctamente.', 'success');
                    ocultarSincronizacion();
                })
                .catch(error => {
                    console.error('Error al actualizar el estado:', error);
                    mostrarAlerta('Error al actualizar el estado. Por favor, inténtalo de nuevo.', 'danger');
                    ocultarSincronizacion();
                });
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            mostrarAlerta('Error al actualizar el estado. Por favor, inténtalo de nuevo.', 'danger');
            ocultarSincronizacion();
        }
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
        ocultarSincronizacion();
    }
}
