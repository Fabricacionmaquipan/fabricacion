// Elementos DOM
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');
const actualizarEstadoModal = document.getElementById('actualizar-estado-modal');
const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
const solicitudIdInput = document.getElementById('solicitud-id');
const nuevoEstadoSelect = document.getElementById('nuevo-estado');
const observacionesText = document.getElementById('observaciones');
const detalleModal = document.getElementById('detalle-modal');
const detalleModalBody = document.getElementById('detalle-modal-body');

// Inicializar las funciones de fabricación
function initFabricacion() {
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    if (actualizarEstadoForm) {
        actualizarEstadoForm.addEventListener('submit', handleActualizarEstado);
    }
    
    // Listener para botones de cambio de estado
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-cambiar-estado')) {
            const solicitudId = e.target.getAttribute('data-id');
            showActualizarEstadoModal(solicitudId);
        }
    });
    
    // Listener para botones de detalle
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-detalle')) {
            const solicitudId = e.target.getAttribute('data-id');
            showDetalle(solicitudId);
        }
    });
}

// Cargar datos para el panel de fabricación
async function loadFabricacionData() {
    try {
        const solicitudes = await window.db.loadSolicitudes();
        renderTablaSolicitudes(solicitudes);
    } catch (error) {
        console.error('Error al cargar datos de fabricación:', error);
        alert('Error al cargar los datos. Por favor, inténtalo de nuevo.');
    }
}

// Renderizar la tabla de solicitudes
function renderTablaSolicitudes(solicitudes) {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    solicitudes.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear el detalle de productos
        const detalleProductos = solicitud.items.map(item => 
            `${item.producto}: ${item.cantidad}`
        ).join('<br>');
        
        tr.innerHTML = `
            <td>${solicitud.id.substring(solicitud.id.length - 6)}</td>
            <td>${solicitud.notaVenta}</td>
            <td>${formatDate(solicitud.fechaSolicitud)}</td>
            <td>${detalleProductos}</td>
            <td><span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span></td>
            <td>${solicitud.observaciones || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info mb-1 btn-detalle" data-id="${solicitud.id}">
                    <i class="bi bi-eye"></i> Ver
                </button>
                ${solicitud.estado !== 'Entregado' ? `
                    <button class="btn btn-sm btn-warning mb-1 btn-cambiar-estado" data-id="${solicitud.id}">
                        <i class="bi bi-pencil"></i> Cambiar Estado
                    </button>
                ` : ''}
            </td>
        `;
        
        tablaSolicitudesFabricacion.appendChild(tr);
    });
}

// Mostrar el modal para actualizar estado
async function showActualizarEstadoModal(solicitudId) {
    try {
        const solicitudes = await window.db.loadSolicitudes();
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
    } catch (error) {
        console.error('Error al preparar actualización de estado:', error);
        alert('Error al cargar los datos. Por favor, inténtalo de nuevo.');
    }
}

// Manejar la actualización de estado
async function handleActualizarEstado(e) {
    e.preventDefault();
    
    try {
        const solicitudId = solicitudIdInput.value;
        const nuevoEstado = nuevoEstadoSelect.value;
        const observaciones = observacionesText.value;
        
        // Actualizar el estado
        const actualizado = await window.db.actualizarEstadoSolicitud(solicitudId, nuevoEstado, observaciones);
        
        if (actualizado) {
            alert('Estado actualizado correctamente.');
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(actualizarEstadoModal);
            modal.hide();
            
            // Recargar los datos
            loadFabricacionData();
        } else {
            alert('Error al actualizar el estado. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.');
    }
}

// Mostrar detalle de una solicitud
async function showDetalle(solicitudId) {
    try {
        const solicitudes = await window.db.loadSolicitudes();
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
    } catch (error) {
        console.error('Error al mostrar detalle:', error);
        alert('Error al cargar los detalles. Por favor, inténtalo de nuevo.');
    }
}

// Obtener clase para la insignia según el estado
function getStatusBadgeClass(estado) {
    switch (estado) {
        case 'Solicitud enviada por bodega':
            return 'bg-primary';
        case 'En fabricación':
            return 'bg-warning text-dark';
        case 'Entregado':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Formatear fecha (YYYY-MM-DD a DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Formatear fecha y hora
function formatDateTime(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    return date.toLocaleString();
}

// Exportar funciones para su uso en otros archivos
window.fabricacion = {
    init: initFabricacion,
    loadData: loadFabricacionData
};

// Cuando se carga el panel de fabricación
function loadFabricacionPanel() {
    initFabricacion();
    loadFabricacionData();
}