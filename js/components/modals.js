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
    // Evento para actualizar estado
    if (actualizarEstadoForm) {
        actualizarEstadoForm.addEventListener('submit', handleActualizarEstado);
    }
    
    // Delegación de eventos para botones de modales
    document.addEventListener('click', (e) => {
        // Evento para mostrar detalle
        if (e.target.classList.contains('btn-detalle')) {
            const solicitudId = e.target.getAttribute('data-id');
            showDetalleSolicitud(solicitudId);
        }
        
        // Evento para cambiar estado
        if (e.target.classList.contains('btn-cambiar-estado')) {
            const solicitudId = e.target.getAttribute('data-id');
            showActualizarEstadoModal(solicitudId);
        }
    });
}

// Mostrar el detalle de una solicitud
function showDetalleSolicitud(solicitudId) {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        // Llenar el modal con los detalles
        detalleModalBody.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>ID:</strong> ${solicitud.id}
                </div>
                <div class="col-md-6">
                    <strong>Nota de Venta:</strong> ${solicitud.notaVenta}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Fecha de Solicitud:</strong> ${formatDate(solicitud.fechaSolicitud)}
                </div>
                <div class="col-md-6">
                    <strong>Estado:</strong> 
                    <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <strong>Observaciones:</strong> 
                    <p>${solicitud.observaciones || 'Sin observaciones'}</p>
                </div>
            </div>
            
            <h5 class="mt-4">Productos Solicitados</h5>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
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
            
            <h5 class="mt-4">Historial de Cambios</h5>
            <div class="history-container">
                ${solicitud.historial.map(hist => `
                    <div class="history-item">
                        <div class="history-date">${formatDateTime(hist.fecha)}</div>
                        <div><strong>Estado:</strong> ${hist.estado}</div>
                        ${hist.observaciones ? `<div><strong>Observaciones:</strong> ${hist.observaciones}</div>` : ''}
                        <div><strong>Usuario:</strong> ${hist.usuario}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(detalleModal);
        modal.show();
    } else {
        alert('No se encontró la solicitud.');
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
        
        observacionesText.value = solicitud.observaciones || '';
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(actualizarEstadoModal);
        modal.show();
    } else {
        alert('No se encontró la solicitud.');
    }
}

// Manejar la actualización de estado
async function handleActualizarEstado(e) {
    e.preventDefault();
    
    mostrarSincronizacion('Actualizando estado...');
    
    const solicitudId = solicitudIdInput.value;
    const nuevoEstado = nuevoEstadoSelect.value;
    const observaciones = observacionesText.value;
    
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
                usuario: currentRole === 'admin' ? 'usuario_admin' : 'usuario_fabricacion'
            });
            
            // Guardar en Firebase
            await solicitudesRef.child(solicitudId).update(solicitudActualizada);
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(actualizarEstadoModal);
            modal.hide();
            
            alert('Estado actualizado correctamente.');
            ocultarSincronizacion();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            alert('Error al actualizar el estado. Por favor, inténtalo de nuevo.');
            ocultarSincronizacion();
        }
    } else {
        alert('No se encontró la solicitud.');
        ocultarSincronizacion();
    }
}
