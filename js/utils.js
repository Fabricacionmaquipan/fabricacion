// utils.js - Utilidades globales

// Variables para paginación
const ITEMS_PER_PAGE = 10; // Solicitudes por página

// Mostrar estado de sincronización
function mostrarSincronizacion(mensaje, isError = false) {
    const syncStatus = document.getElementById('sync-status');
    const syncMessage = document.getElementById('sync-message');
    
    if (!syncStatus || !syncMessage) {
        // Si no existen los elementos, crear un indicador temporal
        const tempStatus = document.createElement('div');
        tempStatus.className = 'alert alert-' + (isError ? 'danger' : 'info') + ' position-fixed';
        tempStatus.style.top = '20px';
        tempStatus.style.right = '20px';
        tempStatus.style.zIndex = '9999';
        tempStatus.innerHTML = `
            <div class="d-flex align-items-center">
                ${!isError ? '<div class="spinner-border spinner-border-sm me-2"></div>' : ''}
                <span>${mensaje}</span>
            </div>
        `;
        document.body.appendChild(tempStatus);
        
        // Guardar referencia para poder eliminarla después
        window._tempSyncStatus = tempStatus;
        return;
    }
    
    syncMessage.textContent = mensaje;
    syncStatus.classList.add('active');
    
    if (isError) {
        syncStatus.classList.add('error');
    } else {
        syncStatus.classList.remove('error');
    }
}

// Ocultar estado de sincronización
function ocultarSincronizacion() {
    const syncStatus = document.getElementById('sync-status');
    
    // Si se usó el indicador temporal, eliminarlo
    if (window._tempSyncStatus) {
        setTimeout(() => {
            window._tempSyncStatus.remove();
            delete window._tempSyncStatus;
        }, 500);
        return;
    }
    
    if (!syncStatus) return;
    
    // Animación suave de desaparición
    syncStatus.style.opacity = '0';
    
    setTimeout(() => {
        syncStatus.classList.remove('active');
        syncStatus.style.opacity = '1';
    }, 300);
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
    
    try {
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {
        return dateString; // Si hay un error, devolver el string original
    }
}

// Formatear fecha y hora
function formatDateTime(isoString) {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        
        // Formatear fecha con hora en formato legible
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        };
        
        return date.toLocaleString(undefined, options);
    } catch (e) {
        return isoString; // Si hay un error, devolver el string original
    }
}

// Generar un ID único
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Mostrar alerta (Toast)
function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertContainer.style.top = '15px';
    alertContainer.style.right = '15px';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.maxWidth = '300px';
    alertContainer.style.boxShadow = '0 0.25rem 0.5rem rgba(0, 0, 0, 0.15)';
    
    alertContainer.innerHTML = `
        ${tipo === 'success' ? '<i class="fas fa-check-circle me-2"></i>' : 
          tipo === 'danger' ? '<i class="fas fa-exclamation-circle me-2"></i>' : 
          tipo === 'warning' ? '<i class="fas fa-exclamation-triangle me-2"></i>' : 
          '<i class="fas fa-info-circle me-2"></i>'}
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Añadir al body
    document.body.appendChild(alertContainer);
    
    // Animación de entrada
    setTimeout(() => {
        alertContainer.style.transition = 'all 0.3s ease';
        alertContainer.style.transform = 'translateX(0)';
        alertContainer.style.opacity = '1';
    }, 10);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        alertContainer.style.opacity = '0';
        alertContainer.style.transform = 'translateX(50px)';
        
        setTimeout(() => {
            alertContainer.remove();
        }, 300);
    }, 3000);
}

// Funciones de paginación
// -----------------------

// Crear controles de paginación
function createPaginationControls(containerSelector, totalItems, currentPage, onPageChange, panelName) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Calcular páginas totales
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // No mostrar paginación si hay solo una página
    if (totalPages <= 1) {
        container.innerHTML = `<small class="text-muted">Mostrando ${totalItems} solicitudes</small>`;
        return;
    }
    
    // Crear elementos de paginación
    const paginationEl = document.createElement('div');
    paginationEl.className = 'd-flex justify-content-between align-items-center w-100';
    
    // Información de página
    const infoEl = document.createElement('small');
    infoEl.className = 'text-muted';
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    infoEl.textContent = `Mostrando ${start}-${end} de ${totalItems} solicitudes`;
    
    // Controles de navegación
    const navEl = document.createElement('div');
    navEl.className = 'btn-group btn-group-sm';
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn btn-outline-secondary';
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1, panelName);
        }
    });
    
    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-outline-secondary';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1, panelName);
        }
    });
    
    // Crear selector de página para saltos directos
    const pageSelector = document.createElement('select');
    pageSelector.className = 'form-select form-select-sm mx-2';
    pageSelector.style.width = 'auto';
    
    for (let i = 1; i <= totalPages; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Página ${i}`;
        option.selected = i === currentPage;
        pageSelector.appendChild(option);
    }
    
    pageSelector.addEventListener('change', (e) => {
        onPageChange(parseInt(e.target.value), panelName);
    });
    
    // Añadir elementos al contenedor
    navEl.appendChild(prevBtn);
    navEl.appendChild(pageSelector);
    navEl.appendChild(nextBtn);
    
    paginationEl.appendChild(infoEl);
    paginationEl.appendChild(navEl);
    
    container.appendChild(paginationEl);
}

// Paginar y filtrar solicitudes
function paginateAndFilterItems(items, currentPage, filterTerm = '', filterStatus = 'all') {
    // Ordenar por fecha (más recientes primero)
    let filteredItems = [...items].sort((a, b) => {
        return new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud);
    });
    
    // Aplicar filtro de texto si existe
    if (filterTerm) {
        const term = filterTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => {
            return (
                (item.id && item.id.toLowerCase().includes(term)) ||
                (item.notaVenta && item.notaVenta.toLowerCase().includes(term)) ||
                (item.cliente && item.cliente.toLowerCase().includes(term)) ||
                (item.local && item.local.toLowerCase().includes(term)) ||
                (item.fechaSolicitud && item.fechaSolicitud.includes(term)) ||
                (item.estado && item.estado.toLowerCase().includes(term)) ||
                (item.observaciones && item.observaciones.toLowerCase().includes(term)) ||
                // Buscar en productos
                (item.items && item.items.some(prod => 
                    (prod.producto && prod.producto.toLowerCase().includes(term)) ||
                    (prod.sku && prod.sku.toLowerCase().includes(term))
                ))
            );
        });
    }
    
    // Aplicar filtro por estado
    if (filterStatus !== 'all') {
        filteredItems = filteredItems.filter(item => {
            switch (filterStatus) {
                case 'pendientes':
                    return item.estado === 'Solicitud enviada por bodega';
                case 'fabricacion':
                    return item.estado === 'En fabricación';
                case 'entregadas':
                    return item.estado === 'Entregado';
                default:
                    return true;
            }
        });
    }
    
    // Calcular total de ítems filtrados
    const totalFilteredItems = filteredItems.length;
    
    // Obtener ítems de la página actual
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return {
        items: paginatedItems,
        totalItems: totalFilteredItems
    };
}

// Función para limpiar modales bloqueados
function limpiarModalesBloqueados() {
    // Eliminar todos los backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Limpiar clases y estilos del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Asegurarse de que todos los modales estén ocultos
    document.querySelectorAll('.modal').forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            try {
                modalInstance.hide();
                modalInstance.dispose();
            } catch (error) {
                console.error("Error al limpiar modal:", error);
            }
        }
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
    });
}

// Handler genérico para manejo de cambios de página
function handlePageChange(newPage, panelName) {
    switch (panelName) {
        case 'bodega':
            if (typeof currentPageBodega !== 'undefined') {
                currentPageBodega = newPage;
                if (typeof cargarDatosBodega === 'function') {
                    cargarDatosBodega();
                }
            }
            break;
        case 'fabricacion':
            if (typeof currentPageFabricacion !== 'undefined') {
                currentPageFabricacion = newPage;
                if (typeof cargarDatosFabricacion === 'function') {
                    cargarDatosFabricacion();
                }
            }
            break;
        case 'admin':
            if (typeof currentPageAdmin !== 'undefined') {
                currentPageAdmin = newPage;
                if (typeof cargarDatosAdmin === 'function') {
                    cargarDatosAdmin();
                }
            }
            break;
        case 'repuestos':
            if (typeof currentPageRepuestos !== 'undefined') {
                currentPageRepuestos = newPage;
                if (typeof cargarTablaRepuestos === 'function') {
                    cargarTablaRepuestos();
                }
            }
            break;
    }
}

// Agregar manejador para tecla ESC global
document.addEventListener('keydown', function(e) {
    // Si se presiona ESC (código 27)
    if (e.keyCode === 27 || e.key === 'Escape') {
        setTimeout(limpiarModalesBloqueados, 300);
    }
});

// Agregar manejador para clicks fuera de los modales
document.addEventListener('click', function(e) {
    // Si se hizo clic en un backdrop
    if (e.target.classList.contains('modal-backdrop')) {
        setTimeout(limpiarModalesBloqueados, 300);
    }
});

// Exponer funciones globalmente
window.mostrarSincronizacion = mostrarSincronizacion;
window.ocultarSincronizacion = ocultarSincronizacion;
window.getStatusBadgeClass = getStatusBadgeClass;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.generateUniqueId = generateUniqueId;
window.mostrarAlerta = mostrarAlerta;
window.createPaginationControls = createPaginationControls;
window.paginateAndFilterItems = paginateAndFilterItems;
window.limpiarModalesBloqueados = limpiarModalesBloqueados;
window.handlePageChange = handlePageChange;
