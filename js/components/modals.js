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
}

// Mostrar el detalle de una solicitud
function showDetalleSolicitud(solicitudId) {
    console.log("Mostrando detalle de solicitud ID:", solicitudId);
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        // Limpiar cualquier modal o backdrop existente que pueda estar causando problemas
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Limpiar el contenido anterior del modal
        detalleModalBody.innerHTML = '';
        
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
                        <!-- Campos Cliente y Local -->
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Cliente:</span>
                                <span class="detail-value">${solicitud.cliente || 'No especificado'}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-item">
                                <span class="detail-label">Local:</span>
                                <span class="detail-value">${solicitud.local || 'No especificado'}</span>
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
                                    <th>SKU</th>
                                    <th>Producto</th>
                                    <th style="width: 20%">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${solicitud.items.map(item => `
                                    <tr>
                                        <td>${item.sku || 'N/A'}</td>
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
        
        // Asegurarse de que no hay una instancia previa del modal
        let modalInstance = bootstrap.Modal.getInstance(detalleModal);
        if (modalInstance) {
            modalInstance.dispose();
        }
        
        // Inicializar y mostrar el modal con opciones específicas
        modalInstance = new bootstrap.Modal(detalleModal, {
            backdrop: 'static',  // Evita cerrar al hacer clic fuera
            keyboard: true       // Permite cerrar con Esc
        });
        
        // Agregar evento para limpiar correctamente al cerrar
        detalleModal.addEventListener('hidden.bs.modal', function() {
            // Limpiar cualquier backdrop que haya quedado
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, { once: true }); // El evento se elimina después de ejecutarse una vez
        
        modalInstance.show();
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
    console.log("Mostrando modal de actualización para ID:", solicitudId);
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        // Limpiar cualquier modal o backdrop existente
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        solicitudIdInput.value = solicitudId;
        
        // Establecer el estado actual
        for (let i = 0; i < nuevoEstadoSelect.options.length; i++) {
            if (nuevoEstadoSelect.options[i].value === solicitud.estado) {
                nuevoEstadoSelect.selectedIndex = i;
                break;
            }
        }
        
        // Manejar visibilidad del campo fecha de entrega
        const fechaEntregaContainer = document.getElementById('fecha-entrega-container');
        const fechaEntregaInput = document.getElementById('fecha-entrega');
        
        if (fechaEntregaContainer && fechaEntregaInput) {
            // Mostrar el campo si el estado actual o seleccionado es "Entregado"
            if (nuevoEstadoSelect.value === 'Entregado') {
                fechaEntregaContainer.style.display = 'block';
                
                // Si ya tiene fechaEntrega, establecerla
                if (solicitud.fechaEntrega) {
                    fechaEntregaInput.value = solicitud.fechaEntrega;
                } else {
                    // Por defecto, establecer fecha actual
                    const hoy = new Date();
                    const fechaActual = hoy.toISOString().split('T')[0];
                    fechaEntregaInput.value = fechaActual;
                }
            } else {
                fechaEntregaContainer.style.display = 'none';
            }
            
            // Configurar evento para mostrar/ocultar fecha de entrega según el estado seleccionado
            const handleEstadoChange = function() {
                if (this.value === 'Entregado') {
                    fechaEntregaContainer.style.display = 'block';
                    // Si el campo está vacío, establecer fecha actual
                    if (!fechaEntregaInput.value) {
                        const hoy = new Date();
                        const fechaActual = hoy.toISOString().split('T')[0];
                        fechaEntregaInput.value = fechaActual;
                    }
                } else {
                    fechaEntregaContainer.style.display = 'none';
                }
            };
            
            // Remover listener anterior (para evitar múltiples handlers)
            nuevoEstadoSelect.removeEventListener('change', handleEstadoChange);
            // Añadir el listener
            nuevoEstadoSelect.addEventListener('change', handleEstadoChange);
        }
        
        // Establecer observaciones
        observacionesText.value = solicitud.observaciones || '';
        
        // Preparar el modal con info adicional
        const modalTitle = actualizarEstadoModal.querySelector('.modal-title');
        if (modalTitle) {
            // Incluir información de Cliente y Nota de Venta
            modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>Actualizar Estado 
                <small class="text-muted">
                    (Nota: ${solicitud.notaVenta}${solicitud.cliente ? ` | Cliente: ${solicitud.cliente}` : ''})
                </small>`;
        }
        
        // Asegurarse de que no hay una instancia previa del modal
        let modalInstance = bootstrap.Modal.getInstance(actualizarEstadoModal);
        if (modalInstance) {
            modalInstance.dispose();
        }
        
        // Inicializar y mostrar el modal con opciones específicas
        modalInstance = new bootstrap.Modal(actualizarEstadoModal, {
            backdrop: true,
            keyboard: true
        });
        
        // Agregar evento para limpiar correctamente al cerrar
        actualizarEstadoModal.addEventListener('hidden.bs.modal', function() {
            // Limpiar cualquier backdrop que haya quedado
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, { once: true });
        
        modalInstance.show();
        
        // Focus en el selector de estado
        setTimeout(() => {
            nuevoEstadoSelect.focus();
        }, 500);
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
    }
}

// Manejar la actualización de estado
function handleActualizarEstado(e) {
    e.preventDefault();
    console.log("Manejando actualización de estado");
    
    const solicitudId = solicitudIdInput.value;
    const nuevoEstado = nuevoEstadoSelect.value;
    const observaciones = observacionesText.value;
    
    // Obtener fecha de entrega si el estado es "Entregado"
    const fechaEntrega = nuevoEstado === 'Entregado' 
        ? document.getElementById('fecha-entrega').value 
        : null;
    
    // Verificar si tenemos el usuario actual y la función de actualización
    if (typeof getCurrentUser === 'function' && typeof handleActualizarEstadoConUsuario === 'function') {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Si no hay un ID de usuario, intentamos crear uno provisional
            if (!currentUser.id) {
                currentUser.id = 'user_' + new Date().getTime();
                console.warn("Usuario sin ID: se creó un ID provisional", currentUser.id);
            }
            
            // Llamar a la función con información de usuario y fecha de entrega
            console.log("Llamando a handleActualizarEstadoConUsuario");
            handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, currentUser, fechaEntrega);
            return;
        } else {
            mostrarAlerta('Error: Debes iniciar sesión para actualizar estados', 'warning');
            return;
        }
    }
    
    // Si no se pudo obtener el usuario o no existe la función con usuario,
    // intentemos usar alguna alternativa simple para que siga funcionando
    mostrarSincronizacion('Actualizando estado...');
    
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        try {
            // Crear una copia de la solicitud para actualizar
            const solicitudActualizada = {...solicitud};
            
            // Actualizar estado y observaciones
            solicitudActualizada.estado = nuevoEstado;
            solicitudActualizada.observaciones = observaciones;
            
            // Añadir fecha de entrega si corresponde
            if (nuevoEstado === 'Entregado' && fechaEntrega) {
                solicitudActualizada.fechaEntrega = fechaEntrega;
            }
            
            // Crear un usuario genérico como último recurso
            const usuarioGenerico = {
                id: 'sistema_' + new Date().getTime(),
                displayName: 'Sistema'
            };
            
            // Agregar al historial
            solicitudActualizada.historial.push({
                fecha: new Date().toISOString(),
                estado: nuevoEstado,
                observaciones: observaciones,
                usuario: usuarioGenerico.displayName,
                userId: usuarioGenerico.id,
                fechaEntrega: fechaEntrega // Añadir al historial también
            });
            
            // Guardar en Firebase
            solicitudesRef.child(solicitudId).update(solicitudActualizada)
                .then(() => {
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(actualizarEstadoModal);
                    if (modal) modal.hide();
                    
                    // Limpiar backdrop manualmente
                    setTimeout(() => {
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 300);
                    
                    mostrarAlerta('Estado actualizado correctamente.', 'success');
                    ocultarSincronizacion();
                })
                .catch(error => {
                    console.error('Error al actualizar el estado:', error);
                    mostrarAlerta('Error al actualizar el estado: ' + error.message, 'danger');
                    ocultarSincronizacion();
                });
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            mostrarAlerta('Error al actualizar el estado: ' + error.message, 'danger');
            ocultarSincronizacion();
        }
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
        ocultarSincronizacion();
    }
}

// Exponer funciones al ámbito global para que puedan ser llamadas desde delegación de eventos
window.showDetalleSolicitud = showDetalleSolicitud;
window.showActualizarEstadoModal = showActualizarEstadoModal;
