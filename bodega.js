// Elementos DOM
const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const tablaSolicitudesBodega = document.getElementById('tabla-solicitudes-bodega');
const detalleModal = document.getElementById('detalle-modal');
const detalleModalBody = document.getElementById('detalle-modal-body');

// Inicializar las funciones de bodega
function initBodega() {
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', handleNuevaSolicitud);
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }
    
    // Agregar listener para botones de eliminar item
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-item')) {
            removeItem(e.target);
        }
    });
    
    // Agregar listener para botones de detalle
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-detalle')) {
            const solicitudId = e.target.getAttribute('data-id');
            showDetalle(solicitudId);
        }
    });
}

// Cargar datos para el panel de bodega
async function loadBodegaData() {
    try {
        const solicitudes = await window.db.loadSolicitudes();
        renderTablaSolicitudes(solicitudes);
    } catch (error) {
        console.error('Error al cargar datos de bodega:', error);
        alert('Error al cargar los datos. Por favor, inténtalo de nuevo.');
    }
}

// Renderizar la tabla de solicitudes
function renderTablaSolicitudes(solicitudes) {
    if (!tablaSolicitudesBodega) return;
    
    tablaSolicitudesBodega.innerHTML = '';
    
    solicitudes.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        tr.innerHTML = `
            <td>${solicitud.id.substring(solicitud.id.length - 6)}</td>
            <td>${solicitud.notaVenta}</td>
            <td>${formatDate(solicitud.fechaSolicitud)}</td>
            <td><span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-info btn-detalle" data-id="${solicitud.id}">Ver Detalle</button>
            </td>
        `;
        
        tablaSolicitudesBodega.appendChild(tr);
    });
}

// Manejar el envío del formulario de nueva solicitud
async function handleNuevaSolicitud(e) {
    e.preventDefault();
    
    try {
        const notaVenta = document.getElementById('nota-venta').value;
        const fechaSolicitud = document.getElementById('fecha-solicitud').value;
        
        // Obtener productos y cantidades
        const productos = [];
        const cantidades = [];
        
        const productosInputs = document.querySelectorAll('input[name="producto[]"]');
        const cantidadesInputs = document.querySelectorAll('input[name="cantidad[]"]');
        
        for (let i = 0; i < productosInputs.length; i++) {
            const producto = productosInputs[i].value.trim();
            const cantidad = parseInt(cantidadesInputs[i].value);
            
            if (producto && !isNaN(cantidad) && cantidad > 0) {
                productos.push(producto);
                cantidades.push(cantidad);
            }
        }
        
        if (productos.length === 0) {
            alert('Debe agregar al menos un producto.');
            return;
        }
        
        // Crear la solicitud
        const nuevaSolicitud = await window.db.crearSolicitud(notaVenta, fechaSolicitud, productos, cantidades);
        
        if (nuevaSolicitud) {
            alert('Solicitud creada correctamente.');
            nuevaSolicitudForm.reset();
            
            // Limpiar los items excepto el primero
            const items = document.querySelectorAll('.item-row');
            for (let i = 1; i < items.length; i++) {
                items[i].remove();
            }
            
            // Recargar los datos
            loadBodegaData();
        } else {
            alert('Error al crear la solicitud. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error('Error al manejar nueva solicitud:', error);
        alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.');
    }
}

// Agregar un nuevo item al formulario
function addItem() {
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control" placeholder="Nombre del producto" name="producto[]" required>
            </div>
            <div class="col-md-4 mb-2">
                <input type="number" class="form-control" placeholder="Cantidad" name="cantidad[]" required>
            </div>
            <div class="col-md-2 mb-2">
                <button type="button" class="btn btn-danger remove-item">Eliminar</button>
            </div>
        </div>
    `;
    
    itemsContainer.appendChild(newRow);
}

// Eliminar un item del formulario
function removeItem(button) {
    const row = button.closest('.item-row');
    
    // No eliminar si es el único item
    const items = document.querySelectorAll('.item-row');
    if (items.length > 1) {
        row.remove();
    } else {
        alert('Debe haber al menos un producto.');
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
window.bodega = {
    init: initBodega,
    loadData: loadBodegaData
};

// Cuando se carga el panel de bodega
function loadBodegaPanel() {
    initBodega();
    loadBodegaData();
}