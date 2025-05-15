// Utilidades globales

// Variables para paginación
const ITEMS_PER_PAGE = 10; // Solicitudes por página (o ítems por página en general)

/**
 * Muestra un indicador de estado/sincronización.
 * @param {string} mensaje - El mensaje a mostrar.
 * @param {boolean} [isError=false] - True si es un mensaje de error.
 */
function mostrarSincronizacion(mensaje, isError = false) {
    const syncStatus = document.getElementById('sync-status');
    const syncMessage = document.getElementById('sync-message');

    if (syncStatus && syncMessage) {
        syncMessage.textContent = mensaje;
        syncStatus.classList.add('active');
        syncStatus.style.opacity = '1'; // Asegurar que sea visible

        if (isError) {
            syncStatus.classList.add('error');
        } else {
            syncStatus.classList.remove('error');
        }
    } else {
        console.warn("Elementos de UI para 'mostrarSincronizacion' (sync-status, sync-message) no encontrados.");
    }
}

/**
 * Oculta el indicador de estado/sincronización.
 */
function ocultarSincronizacion() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.style.opacity = '0';
        setTimeout(() => {
            syncStatus.classList.remove('active', 'error'); // Quitar también 'error'
        }, 300); // Coincidir con la duración de la transición CSS si la hay
    }
}

/**
 * Obtiene la clase CSS para la insignia de estado de una solicitud.
 * @param {string} estado - El estado de la solicitud.
 * @returns {string} La clase CSS para la insignia.
 */
function getStatusBadgeClass(estado) {
    switch (String(estado).toLowerCase()) { // Convertir a minúsculas para comparación robusta
        case 'solicitud enviada por bodega':
            return 'bg-primary';
        case 'en fabricación':
            return 'bg-warning text-dark';
        case 'entregado':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

/**
 * Formatea una cadena de fecha de YYYY-MM-DD a DD/MM/YYYY.
 * @param {string} dateString - La cadena de fecha en formato YYYY-MM-DD.
 * @returns {string} La fecha formateada o la cadena original si el formato es incorrecto.
 */
function formatDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) { // YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString; // Devuelve original si no coincide
}

/**
 * Formatea una cadena de fecha y hora ISO a un formato legible local.
 * @param {string} isoString - La cadena de fecha y hora en formato ISO.
 * @returns {string} La fecha y hora formateada o la cadena original si es inválida.
 */
function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    try {
        return date.toLocaleString(navigator.language || 'es-CL', options);
    } catch (e) { // Fallback por si navigator.language no es válido para toLocaleString
        return date.toLocaleString('es-CL', options);
    }
}

/**
 * Genera un ID único simple (no usado para solicitudes principales).
 * @returns {string} Un ID único.
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Genera un ID único para solicitudes basado en la fecha y hora actuales.
 * Formato: SOL-YYYYMMDD-HHMMSS-XXX (XXX son 3 caracteres aleatorios)
 * @returns {string} El ID generado.
 */
function generarIdSolicitud() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minuto = ahora.getMinutes().toString().padStart(2, '0');
    const segundo = ahora.getSeconds().toString().padStart(2, '0');
    const aleatorio = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SOL-${año}${mes}${dia}-${hora}${minuto}${segundo}-${aleatorio}`;
}

/**
 * Muestra una alerta/toast flotante.
 * @param {string} mensaje - El mensaje a mostrar.
 * @param {string} [tipo='info'] - Tipo de alerta ('info', 'success', 'warning', 'danger').
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${tipo} alert-dismissible fade`; // Quitar 'show' inicialmente
    alertContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1056;
        max-width: 350px;
        box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    alertContainer.setAttribute('role', 'alert');

    let iconClass = 'fas fa-info-circle';
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

    // Forzar reflow y luego animar la entrada
    setTimeout(() => {
        alertContainer.classList.add('show');
        alertContainer.style.opacity = '1';
        alertContainer.style.transform = 'translateX(0)';
    }, 10); // Un pequeño delay para asegurar que la transición ocurra

    const tiempoCierre = (tipo === 'danger' || tipo === 'warning') ? 7000 : 4000; // Más tiempo para errores
    setTimeout(() => {
        alertContainer.style.opacity = '0';
        alertContainer.style.transform = 'translateX(100%)';
        alertContainer.addEventListener('transitionend', () => alertContainer.remove(), { once: true });
    }, tiempoCierre);
}

/**
 * Crea controles de paginación para una tabla.
 * @param {string} containerSelector - Selector CSS del contenedor de paginación.
 * @param {number} totalItems - Número total de ítems a paginar.
 * @param {number} currentPage - La página actual.
 * @param {function} onPageChange - Función callback para manejar el cambio de página (recibe newPage, panelName).
 * @param {string} panelName - Nombre del panel, para pasar a onPageChange.
 */
function createPaginationControls(containerSelector, totalItems, currentPage, onPageChange, panelName) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Contenedor de paginación no encontrado: ${containerSelector}`);
        return;
    }
    container.innerHTML = '';

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems === 0) {
        container.innerHTML = `<small class="text-muted">No hay ${panelName} para mostrar.</small>`;
        return;
    }
    if (totalPages <= 1) {
        container.innerHTML = `<small class="text-muted">Mostrando ${totalItems} ${panelName}${totalItems !== 1 ? 's' : ''}.</small>`;
        return;
    }

    const paginationEl = document.createElement('div');
    paginationEl.className = 'd-flex justify-content-between align-items-center w-100 flex-wrap gap-2';

    const infoEl = document.createElement('small');
    infoEl.className = 'text-muted order-md-1';
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    infoEl.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems}`;

    const navEl = document.createElement('nav');
    navEl.setAttribute('aria-label', `Paginación de ${panelName}`);
    navEl.className = 'order-md-2';
    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm mb-0';

    const createPageItem = (pageNumber, text, isActive = false, isDisabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.innerHTML = text;
        if (!isDisabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                onPageChange(pageNumber, panelName);
            });
        }
        li.appendChild(a);
        return li;
    };

    ul.appendChild(createPageItem(currentPage - 1, '<i class="fas fa-chevron-left"></i>', false, currentPage === 1));

    const maxPagesToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (totalPages > maxPagesToShow && endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        ul.appendChild(createPageItem(1, '1'));
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(ellipsisLi);
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        ul.appendChild(createPageItem(i, i.toString(), i === currentPage));
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(ellipsisLi);
        }
        ul.appendChild(createPageItem(totalPages, totalPages.toString()));
    }

    ul.appendChild(createPageItem(currentPage + 1, '<i class="fas fa-chevron-right"></i>', false, currentPage === totalPages));

    navEl.appendChild(ul);
    paginationEl.appendChild(infoEl);
    paginationEl.appendChild(navEl);
    container.appendChild(paginationEl);
}

/**
 * Filtra y pagina un array de ítems.
 * @param {Array} items - El array completo de ítems.
 * @param {number} currentPage - La página actual solicitada.
 * @param {string} [filterTerm=''] - Término de búsqueda.
 * @param {string} [filterStatus='all'] - Estado para filtrar (específico para solicitudes).
 * @returns {object} Objeto con { items: arrayPaginado, totalItems: totalFiltrados }.
 */
function paginateAndFilterItems(items, currentPage, filterTerm = '', filterStatus = 'all') {
    let filteredItems = [...items];

    // Ordenar (opcional, si los items tienen una propiedad de fecha común)
    if (filteredItems.length > 0 && filteredItems[0] && filteredItems[0].hasOwnProperty('fechaSolicitud')) {
        filteredItems.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    } else if (filteredItems.length > 0 && filteredItems[0] && filteredItems[0].hasOwnProperty('fecha')) { // Para historial, etc.
        filteredItems.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }


    if (filterTerm) {
        const term = filterTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => {
            return Object.values(item).some(value =>
                String(value).toLowerCase().includes(term)
            ) || (item.items && Array.isArray(item.items) && item.items.some(prod =>
                (prod.producto && String(prod.producto).toLowerCase().includes(term)) ||
                (prod.sku && String(prod.sku).toLowerCase().includes(term))
            ));
        });
    }

    if (filterStatus !== 'all' && filteredItems.length > 0 && filteredItems[0] && filteredItems[0].hasOwnProperty('estado')) {
        filteredItems = filteredItems.filter(item => {
            const itemEstado = String(item.estado).toLowerCase();
            const filtroEstado = String(filterStatus).toLowerCase();
            if (filtroEstado === 'pendientes') return itemEstado === 'solicitud enviada por bodega';
            if (filtroEstado === 'fabricacion') return itemEstado === 'en fabricación';
            if (filtroEstado === 'entregadas') return itemEstado === 'entregado';
            return itemEstado.includes(filtroEstado); // Fallback más general
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

/**
 * Limpia modales que puedan haber quedado bloqueados o con backdrops persistentes.
 */
function limpiarModalesBloqueados() {
    console.log("Utils: Intentando limpiar modales y backdrops...");
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    document.querySelectorAll('.modal.show').forEach(modalEl => {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            try {
                modalInstance.hide(); // Intenta ocultar con la API de Bootstrap
                // No llamar a dispose() aquí inmediatamente, Bootstrap debería manejarlo al ocultar.
                // Si sigue habiendo problemas, se puede considerar dispose() pero con cuidado.
            } catch (error) {
                console.warn("Utils: Error al intentar ocultar modal:", modalEl.id, error);
            }
        }
        // Forzar remoción de clases si Bootstrap no lo hizo
        modalEl.classList.remove('show');
        modalEl.style.display = 'none'; // Ocultar visualmente
        modalEl.setAttribute('aria-hidden', 'true');
    });

    // Asegurar que el body no quede bloqueado
    // Esto se debe hacer después de que todos los modales se hayan ocultado
    setTimeout(() => {
        if (document.querySelectorAll('.modal.show').length === 0 && document.querySelectorAll('.modal-backdrop').length === 0) {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }, 350); // Un pequeño delay para dar tiempo a las transiciones de Bootstrap
}


document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
        // console.log("Utils: Tecla ESC presionada, intentando limpiar modales.");
        setTimeout(limpiarModalesBloqueados, 50); // Dar un respiro
    }
});

// Exponer las funciones de utilidad globalmente
window.utils = {
    mostrarSincronizacion,
    ocultarSincronizacion,
    getStatusBadgeClass,
    formatDate,
    formatDateTime,
    generateUniqueId, // La antigua
    generarIdSolicitud, // La nueva para solicitudes
    mostrarAlerta,
    createPaginationControls,
    paginateAndFilterItems,
    limpiarModalesBloqueados,
    ITEMS_PER_PAGE // Exponer constante si es útil
};

// Para mantener compatibilidad con código antiguo que llama a funciones directamente en window
window.mostrarSincronizacion = mostrarSincronizacion;
window.ocultarSincronizacion = ocultarSincronizacion;
window.getStatusBadgeClass = getStatusBadgeClass;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.generateUniqueId = generateUniqueId;
window.generarIdSolicitud = generarIdSolicitud;
window.mostrarAlerta = mostrarAlerta;
window.createPaginationControls = createPaginationControls;
window.paginateAndFilterItems = paginateAndFilterItems;
window.limpiarModalesBloqueados = limpiarModalesBloqueados;


console.log("utils.js cargado y funciones utilitarias expuestas.");
