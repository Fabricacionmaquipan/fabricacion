// Utilidades globales

// Variables para paginación
const ITEMS_PER_PAGE = 10; // Solicitudes por página

// Mostrar estado de sincronización
function mostrarSincronizacion(mensaje, isError = false) {
    const syncStatus = document.getElementById('sync-status');
    const syncMessage = document.getElementById('sync-message');

    if (syncStatus && syncMessage) { // Verificar que los elementos existan
        syncMessage.textContent = mensaje;
        syncStatus.classList.add('active');

        if (isError) {
            syncStatus.classList.add('error');
        } else {
            syncStatus.classList.remove('error');
        }
    } else {
        console.warn("Elementos de sincronización no encontrados en el DOM.");
    }
}

// Ocultar estado de sincronización
function ocultarSincronizacion() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) { // Verificar que el elemento exista
        // Animación suave de desaparición
        syncStatus.style.opacity = '0';

        setTimeout(() => {
            syncStatus.classList.remove('active');
            syncStatus.style.opacity = '1'; // Restablecer opacidad para la próxima vez
        }, 300);
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
    if (parts.length === 3) { // Formato YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // Si ya está en formato DD/MM/YYYY o es inválido, devolverlo como está
    return dateString;
}

// Formatear fecha y hora
function formatDateTime(isoString) {
    if (!isoString) return '';

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString; // Si no es una fecha válida, devolver el string original

    // Formatear fecha con hora en formato legible local
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    return date.toLocaleString(navigator.language || 'es-CL', options); // Usar el idioma del navegador o un default
}

// Generar un ID único simple (basado en timestamp y aleatorio)
function generateUniqueId() {
    // Esta función ya existía, la mantenemos por si se usa en otro lado,
    // pero para solicitudes usaremos la nueva generarIdSolicitud.
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Genera un ID único para solicitudes basado en la fecha y hora actuales.
 * Formato: SOL-YYYYMMDD-HHMMSS-XXX (XXX son 3 caracteres aleatorios)
 * @returns {string} El ID generado.
 */
function generarIdSolicitud() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0'); // Meses son 0-indexados
    const dia = ahora.getDate().toString().padStart(2, '0');
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minuto = ahora.getMinutes().toString().padStart(2, '0');
    const segundo = ahora.getSeconds().toString().padStart(2, '0');

    // 3 caracteres alfanuméricos aleatorios para mayor unicidad
    const aleatorio = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `SOL-${año}${mes}${dia}-${hora}${minuto}${segundo}-${aleatorio}`;
}


// Mostrar alerta (Toast)
function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertContainer.style.top = '20px'; // Un poco más de margen
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '1056'; // Asegurar que esté sobre otros elementos (Bootstrap modal z-index es 1050-1055)
    alertContainer.style.maxWidth = '350px'; // Un poco más ancho
    alertContainer.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)';
    alertContainer.setAttribute('role', 'alert');

    let iconClass = 'fas fa-info-circle'; // Icono por defecto para 'info'
    if (tipo === 'success') iconClass = 'fas fa-check-circle';
    else if (tipo === 'danger') iconClass = 'fas fa-exclamation-circle';
    else if (tipo === 'warning') iconClass = 'fas fa-exclamation-triangle';

    alertContainer.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="${iconClass} me-2 fs-5"></i>
            <div class="flex-grow-1">${mensaje}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    document.body.appendChild(alertContainer);

    // Forzar reflow para que la animación de entrada funcione
    void alertContainer.offsetWidth;

    // Auto-cerrar después de 3-5 segundos (más tiempo para errores)
    const tiempoCierre = (tipo === 'danger' || tipo === 'warning') ? 5000 : 3000;
    setTimeout(() => {
        // Iniciar animación de salida
        alertContainer.classList.remove('show');
        // Esperar que termine la animación de fade out de Bootstrap antes de remover
        alertContainer.addEventListener('transitionend', () => {
            alertContainer.remove();
        }, { once: true });

    }, tiempoCierre);
}

// Funciones de paginación
// -----------------------

// Crear controles de paginación
function createPaginationControls(containerSelector, totalItems, currentPage, onPageChange, panelName) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Contenedor de paginación no encontrado: ${containerSelector}`);
        return;
    }

    container.innerHTML = ''; // Limpiar contenedor

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalPages <= 1 && totalItems > 0) {
        container.innerHTML = `<small class="text-muted">Mostrando ${totalItems} registro${totalItems !== 1 ? 's' : ''}</small>`;
        return;
    }
    if (totalItems === 0) {
         container.innerHTML = `<small class="text-muted">No hay registros para mostrar</small>`;
        return;
    }


    const paginationEl = document.createElement('div');
    paginationEl.className = 'd-flex justify-content-between align-items-center w-100 flex-wrap gap-2';

    const infoEl = document.createElement('small');
    infoEl.className = 'text-muted order-md-1';
    const startItem = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems);
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    infoEl.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems}`;

    const navEl = document.createElement('nav');
    navEl.setAttribute('aria-label', `Paginación de ${panelName}`);
    navEl.className = 'order-md-2';

    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm mb-0';

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            onPageChange(currentPage - 1, panelName);
        }
    });
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Números de Página (simplificado para mostrar algunas páginas alrededor de la actual)
    const maxPagesToShow = 3; // Ajusta esto para más/menos números de página
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }


    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        const firstLink = document.createElement('a');
        firstLink.className = 'page-link';
        firstLink.href = '#';
        firstLink.textContent = '1';
        firstLink.addEventListener('click', (e) => { e.preventDefault(); onPageChange(1, panelName); });
        firstLi.appendChild(firstLink);
        ul.appendChild(firstLi);
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(ellipsisLi);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(i, panelName);
        });
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(ellipsisLi);
        }
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        const lastLink = document.createElement('a');
        lastLink.className = 'page-link';
        lastLink.href = '#';
        lastLink.textContent = totalPages;
        lastLink.addEventListener('click', (e) => { e.preventDefault(); onPageChange(totalPages, panelName); });
        lastLi.appendChild(lastLink);
        ul.appendChild(lastLi);
    }


    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1, panelName);
        }
    });
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    navEl.appendChild(ul);

    paginationEl.appendChild(infoEl);
    paginationEl.appendChild(navEl);
    container.appendChild(paginationEl);
}


// Paginar y filtrar solicitudes (o cualquier array de items)
function paginateAndFilterItems(items, currentPage, filterTerm = '', filterStatus = 'all') {
    // Crear una copia para no modificar el array original
    let filteredItems = [...items];

    // Ordenar por fecha de solicitud (más recientes primero), si existe la propiedad
    if (filteredItems.length > 0 && filteredItems[0].hasOwnProperty('fechaSolicitud')) {
        filteredItems.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    }

    // Aplicar filtro de texto si existe
    if (filterTerm) {
        const term = filterTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => {
            // Buscar en todas las propiedades directas del objeto
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key) && item[key]) {
                    if (String(item[key]).toLowerCase().includes(term)) {
                        return true;
                    }
                }
            }
            // Buscar en productos dentro de 'items' (si es una solicitud)
            if (item.items && Array.isArray(item.items)) {
                if (item.items.some(prod =>
                    (prod.producto && prod.producto.toLowerCase().includes(term)) ||
                    (prod.sku && prod.sku.toLowerCase().includes(term))
                )) {
                    return true;
                }
            }
            return false;
        });
    }

    // Aplicar filtro por estado (si la propiedad 'estado' existe)
    if (filterStatus !== 'all' && filteredItems.length > 0 && filteredItems[0].hasOwnProperty('estado')) {
        filteredItems = filteredItems.filter(item => {
            // Normalizar el estado del item para comparación
            const itemEstado = String(item.estado).toLowerCase();
            const filtroEstado = String(filterStatus).toLowerCase();

            if (filtroEstado === 'pendientes') return itemEstado === 'solicitud enviada por bodega';
            if (filtroEstado === 'fabricacion') return itemEstado === 'en fabricación'; // Asegúrate que coincida exactamente
            if (filtroEstado === 'entregadas') return itemEstado === 'entregado';
            // Si filterStatus es un estado específico no listado arriba, buscarlo directamente
            if (filtroEstado !== 'pendientes' && filtroEstado !== 'fabricacion' && filtroEstado !== 'entregadas') {
                return itemEstado === filtroEstado;
            }
            return false; // Si no coincide con ninguna condición de filtro de estado
        });
    }

    const totalFilteredItems = filteredItems.length;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return {
        items: paginatedItems,
        totalItems: totalFilteredItems
    };
}


// Función para limpiar modales bloqueados
function limpiarModalesBloqueados() {
    console.log("Intentando limpiar modales y backdrops...");

    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        console.log("Removiendo backdrop:", backdrop);
        backdrop.remove();
    });

    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    document.querySelectorAll('.modal.show').forEach(modalEl => {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            try {
                console.log("Ocultando y desechando instancia de modal:", modalEl.id);
                modalInstance.hide(); // Intenta ocultar primero
                // Esperar un poco para que se complete la animación de hide antes de dispose
                // Esto es un workaround, Bootstrap debería manejar esto mejor.
                // setTimeout(() => {
                //     if (bootstrap.Modal.getInstance(modalEl)) { // Verificar si todavía existe
                //         bootstrap.Modal.getInstance(modalEl).dispose();
                //     }
                // }, 500); // Ajusta el tiempo si es necesario
            } catch (error) {
                console.error("Error al ocultar/desechar modal:", modalEl.id, error);
            }
        }
        // Forzar el ocultamiento visual si Bootstrap no lo hizo
        modalEl.classList.remove('show');
        modalEl.style.display = 'none';
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.removeAttribute('aria-modal');
        modalEl.removeAttribute('role');
    });
     // Segunda pasada para asegurarse de que body no quede bloqueado
    if (document.querySelectorAll('.modal.show').length === 0 && !document.querySelector('.modal-backdrop')) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
}

// Agregar manejador para tecla ESC global
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") { // Usar e.key para mejor compatibilidad
        console.log("Tecla ESC presionada, intentando limpiar modales.");
        // Dar un pequeño retardo para permitir que el modal maneje el evento ESC primero si es posible
        setTimeout(limpiarModalesBloqueados, 50);
    }
});

// Exponer función globalmente si es necesario para otros módulos o debug
window.limpiarModalesBloqueados = limpiarModalesBloqueados;
window.utils = { // Exponer otras utilidades si se necesitan globalmente
    mostrarSincronizacion,
    ocultarSincronizacion,
    getStatusBadgeClass,
    formatDate,
    formatDateTime,
    generateUniqueId,
    generarIdSolicitud,
    mostrarAlerta,
    createPaginationControls,
    paginateAndFilterItems,
    limpiarModalesBloqueados
};


// Verificar y limpiar modales al cargar la página (puede ser agresivo si hay modales que deban mostrarse al inicio)
// document.addEventListener('DOMContentLoaded', function() {
// setTimeout(limpiarModalesBloqueados, 1000); // Aumentar el tiempo para dar chance a que todo cargue
// });
