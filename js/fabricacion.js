// Funciones específicas del panel de fabricación

// Elementos DOM de Fabricación
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');

// Variables para paginación y filtrado
let currentPageFabricacion = 1;
let filterTermFabricacion = '';
let filterStatusFabricacion = 'all';

// Configurar event listeners específicos de fabricación
function setupFabricacionListeners() {
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#fabricacion-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Establecer filtro según el texto
                const filterText = item.textContent.trim().toLowerCase();
                switch (filterText) {
                    case 'pendientes':
                        filterStatusFabricacion = 'pendientes';
                        break;
                    case 'en fabricación':
                        filterStatusFabricacion = 'fabricacion';
                        break;
                    case 'entregadas':
                        filterStatusFabricacion = 'entregadas';
                        break;
                    default:
                        filterStatusFabricacion = 'all';
                }
                
                // Actualizar texto del botón de filtro
                const filterButton = document.querySelector('#fabricacion-panel .dropdown-toggle');
                if (filterButton) {
                    filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${item.textContent.trim()}`;
                }
                
                currentPageFabricacion = 1; // Reiniciar a primera página al filtrar
                cargarDatosFabricacion();
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#fabricacion-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTermFabricacion = e.target.value.toLowerCase();
            currentPageFabricacion = 1; // Reiniciar a primera página al buscar
            cargarDatosFabricacion();
        });
    }
    
    // Configurar listeners para botones
    setupFabricacionButtonListeners();
}

// Asegurar que los botones funcionan en fabricación
function setupFabricacionButtonListeners() {
    // Delegar eventos para los botones en la tabla
    const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');
    if (tablaSolicitudesFabricacion) {
        tablaSolicitudesFabricacion.addEventListener('click', (e) => {
            let targetButton = null;
            
            // Detectar botón de detalle
            if (e.target.classList.contains('btn-detalle')) {
                targetButton = e.target;
            } else if (e.target.closest('.btn-detalle')) {
                targetButton = e.target.closest('.btn-detalle');
            }
            
            if (targetButton) {
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                }
                e.stopPropagation();
                return;
            }
            
            // Detectar botón de cambiar estado
            if (e.target.classList.contains('btn-cambiar-estado')) {
                targetButton = e.target;
            } else if (e.target.closest('.btn-cambiar-estado')) {
                targetButton = e.target.closest('.btn-cambiar-estado');
            }
            
            if (targetButton) {
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showActualizarEstadoModal === 'function') {
                    window.showActualizarEstadoModal(solicitudId);
                }
                e.stopPropagation();
            }
        });
    }
}

// Cargar datos para el panel de Fabricación
function cargarDatosFabricacion() {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesFabricacion.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay solicitudes en el sistema</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Ocultar paginación
        updateFabricacionPagination(0);
        return;
    }
    
    // Paginar y filtrar solicitudes
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes, 
        currentPageFabricacion,
        filterTermFabricacion,
        filterStatusFabricacion
    );
    
    // Actualizar paginación
    updateFabricacionPagination(totalItems);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesFabricacion.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-search text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No se encontraron solicitudes</p>
                        <small class="text-muted">Intenta con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear el detalle de productos
        const detalleProductos = solicitud.items.map(item => {
            // Incluir SKU si está disponible
            const skuInfo = item.sku ? `<small class="text-muted">(SKU: ${item.sku})</small> ` : '';
            return `<div><strong>${item.producto}</strong> ${skuInfo}: ${item.cantidad}</div>`;
        }).join('');
        
        // Crear ID corto para mejor visualización
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Cliente">${solicitud.cliente || 'No especificado'}</td>
            <td data-label="Local">${solicitud.local || 'No especificado'}</td>
            <td data-label="Fecha">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Detalle">${detalleProductos}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
            </td>
            <td data-label="Observaciones">${solicitud.observaciones || '<span class="text-muted">Sin observaciones</span>'}</td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                    <i class="fas fa-eye me-1"></i>Ver
                </button>
                ${solicitud.estado !== 'Entregado' ? `
                    <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}">
                        <i class="fas fa-edit me-1"></i>Cambiar
                    </button>
                ` : ''}
            </td>
        `;
        
        tablaSolicitudesFabricacion.appendChild(tr);
    });
}

// Actualizar controles de paginación para fabricación
function updateFabricacionPagination(totalItems) {
    createPaginationControls(
        '#fabricacion-panel .card-footer',
        totalItems,
        currentPageFabricacion,
        handlePageChange,
        'fabricacion'
    );
}

// Manejar cambio de página
function handlePageChange(newPage, panelName) {
    if (panelName === 'fabricacion') {
        currentPageFabricacion = newPage;
        cargarDatosFabricacion();
    }
}

// Actualizar el encabezado de la tabla de fabricación
function actualizarEncabezadoTablaFabricacion() {
    // Buscar la tabla
    const tablaFabricacion = document.querySelector('#fabricacion-panel table thead tr');
    
    if (tablaFabricacion) {
        // Actualizar encabezados
        tablaFabricacion.innerHTML = `
            <th>ID</th>
            <th>Nota Venta</th>
            <th>Cliente</th>
            <th>Local</th>
            <th>Fecha</th>
            <th>Detalle</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th>Acciones</th>
        `;
    }
}

// Asegurarse de que los listeners estén configurados al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setupFabricacionButtonListeners();
    
    // Actualizar encabezado de la tabla
    setTimeout(actualizarEncabezadoTablaFabricacion, 1000);
});
