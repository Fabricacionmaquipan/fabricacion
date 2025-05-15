// =====================================================
// ARCHIVO UNIFICADO: ADMIN + ADMIN-PRODUCTOS + ADMIN-REPUESTOS
// =====================================================

// =====================================================
// SECCIÓN 1: VARIABLES Y CONFIGURACIÓN GENERAL
// =====================================================

// Elementos DOM compartidos
let tablaSolicitudesAdmin;

// Variables para módulo principal de Admin
let currentPageAdmin = 1;
let filterTermAdmin = '';
let filterStatusAdmin = 'all';

// Variables para módulo de Productos
let tablaProductos;
let currentPageProductos = 1;
let filterTermProductos = '';

// Variables para módulo de Repuestos
let tablaRepuestos; // <-- Asegúrate que se define si la usas en cargarTablaRepuestos
let currentPageRepuestos = 1;
let filterTermRepuestos = '';
// FIN SECCIÓN 1

// =====================================================
// SECCIÓN 2: FUNCIONES PRINCIPALES DE ADMINISTRACIÓN
// (Tu código existente para setupAdminListeners, cargarDatosAdmin, etc.)
// ...
// ... (todo tu código de la sección 2) ...
// ...
function setupAdminListeners() {
    // (Tu código existente)
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#admin-panel #solicitudes-content .dropdown-item'); // Más específico para evitar colisiones
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                const filterText = item.textContent.trim().toLowerCase();
                const filterButton = item.closest('.dropdown').querySelector('.dropdown-toggle');

                switch (filterText) {
                    case 'pendientes':
                        filterStatusAdmin = 'pendientes';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Pendientes`;
                        break;
                    case 'en fabricación':
                        filterStatusAdmin = 'fabricacion';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> En Fabricación`;
                        break;
                    case 'entregadas':
                        filterStatusAdmin = 'entregadas';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Entregadas`;
                        break;
                    default:
                        filterStatusAdmin = 'all';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Todas`;
                }
                
                currentPageAdmin = 1;
                cargarDatosAdmin();
            });
        });
    }
    
    // Búsqueda en tiempo real para solicitudes
    const searchInputAdmin = document.querySelector('#admin-panel #solicitudes-content .input-group input');
    if (searchInputAdmin) {
        searchInputAdmin.addEventListener('input', (e) => {
            filterTermAdmin = e.target.value.toLowerCase();
            currentPageAdmin = 1; 
            cargarDatosAdmin();
        });
    }
    
    // Botones de exportación y estadísticas (ya existentes, asegúrate que los selectores sean correctos si están dentro de la pestaña)
    const exportBtn = document.querySelector('#admin-panel #solicitudes-content button[onclick="exportarSolicitudesCSV()"]');
    // if (exportBtn && typeof exportarSolicitudesCSV === 'function') { // El onclick ya lo maneja, no necesita listener adicional a menos que quieras cambiarlo
    //     exportBtn.addEventListener('click', exportarSolicitudesCSV);
    // }
    
    const statsBtn = document.querySelector('#admin-panel #solicitudes-content button[onclick="generarEstadisticas()"]');
    // if (statsBtn && typeof generarEstadisticas === 'function') { // Igual que arriba
    //    statsBtn.addEventListener('click', generarEstadisticas);
    // }
    
    setupAdminButtonListeners();
    
    const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
    if (confirmarEliminacionBtn) {
        confirmarEliminacionBtn.addEventListener('click', eliminarSolicitud);
    }
}

function setupAdminButtonListeners() {
    // (Tu código existente)
    const tablaSolicitudesAdminElem = document.getElementById('tabla-solicitudes-admin'); // Renombrado para evitar conflicto con la variable global
    if (tablaSolicitudesAdminElem) {
        tablaSolicitudesAdminElem.addEventListener('click', (e) => {
            let targetButton = null;
            
            if (e.target.classList.contains('btn-detalle') || e.target.closest('.btn-detalle')) {
                targetButton = e.target.classList.contains('btn-detalle') ? e.target : e.target.closest('.btn-detalle');
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                }
                e.stopPropagation();
                return;
            }
            
            if (e.target.classList.contains('btn-cambiar-estado') || e.target.closest('.btn-cambiar-estado')) {
                targetButton = e.target.classList.contains('btn-cambiar-estado') ? e.target : e.target.closest('.btn-cambiar-estado');
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showActualizarEstadoModal === 'function') {
                    window.showActualizarEstadoModal(solicitudId);
                }
                e.stopPropagation();
                return;
            }
            
            if (e.target.classList.contains('btn-eliminar') || e.target.closest('.btn-eliminar')) {
                targetButton = e.target.classList.contains('btn-eliminar') ? e.target : e.target.closest('.btn-eliminar');
                const solicitudId = targetButton.getAttribute('data-id');
                const notaVenta = targetButton.getAttribute('data-nota');
                if (solicitudId) {
                    showConfirmarEliminacionModal(solicitudId, notaVenta);
                }
                e.stopPropagation();
            }
        });
    }
}

function showConfirmarEliminacionModal(solicitudId, notaVenta) {
    // (Tu código existente)
    console.log("Mostrando modal de confirmación de eliminación para ID:", solicitudId);
    
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    document.getElementById('eliminar-solicitud-id').value = solicitudId;
    document.getElementById('eliminar-nota-venta').textContent = notaVenta || solicitudId;
    
    const confirmarModalEl = document.getElementById('confirmar-eliminacion-modal'); // Renombrado
    let modalInstance = bootstrap.Modal.getInstance(confirmarModalEl);
    if (modalInstance) {
        modalInstance.dispose();
    }
    
    modalInstance = new bootstrap.Modal(confirmarModalEl, {
        backdrop: true,
        keyboard: true
    });
    
    confirmarModalEl.addEventListener('hidden.bs.modal', function() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, { once: true });
    
    modalInstance.show();
}

function eliminarSolicitud() {
    // (Tu código existente)
    const solicitudId = document.getElementById('eliminar-solicitud-id').value;
    
    if (!solicitudId) {
        mostrarAlerta('Error: No se pudo identificar la solicitud a eliminar', 'danger'); // Asumo que tienes mostrarAlerta
        return;
    }
    
    // mostrarSincronizacion('Eliminando solicitud...'); // Asumo que tienes mostrarSincronizacion y ocultarSincronizacion
    
    // solicitudesRef.child(solicitudId).remove() // Asumo que solicitudesRef está definido (Firebase)
    //     .then(() => {
    //         const modalEl = document.getElementById('confirmar-eliminacion-modal');
    //         const modal = bootstrap.Modal.getInstance(modalEl);
    //         if (modal) {
    //             modal.hide();
    //             setTimeout(() => { /* ... limpieza de backdrop ... */ }, 300);
    //         }
    //         mostrarAlerta('Solicitud eliminada correctamente', 'success');
    //         currentPageAdmin = 1; 
    //         setTimeout(() => { cargarDatosAdmin(); }, 500);
    //         // ocultarSincronizacion();
    //     })
    //     .catch(error => {
    //         console.error('Error al eliminar solicitud:', error);
    //         mostrarAlerta('Error al eliminar la solicitud: ' + error.message, 'danger');
    //         // ocultarSincronizacion();
    //     });
    console.warn("eliminarSolicitud necesita implementación de Firebase y funciones auxiliares (mostrarAlerta, mostrarSincronizacion)");
}


function cargarDatosAdmin() {
    // (Tu código existente, asegurándote que `solicitudes`, `paginateAndFilterItems`, `formatDate`, `getStatusBadgeClass` y `updateAdminPagination` están definidas)
    if (!tablaSolicitudesAdmin) { // tablaSolicitudesAdmin es la variable global definida al inicio
        console.error("tablaSolicitudesAdmin no está definida o no se encontró en el DOM.");
        return;
    }
    
    tablaSolicitudesAdmin.innerHTML = '';
    
    // Asumimos que 'solicitudes' es un array global o accesible
    if (typeof solicitudes === 'undefined' || solicitudes.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `<tr><td colspan="7" class="text-center py-4">...No hay solicitudes...</td></tr>`;
        updateAdminPagination(0);
        return;
    }
    
    // Asumimos que paginateAndFilterItems está definida
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes, 
        currentPageAdmin,
        filterTermAdmin,
        filterStatusAdmin
    );
    
    updateAdminPagination(totalItems);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `<tr><td colspan="7" class="text-center py-4">...No se encontraron solicitudes...</td></tr>`;
        return;
    }
    
    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        // (Llenado del tr como en tu código)
        // Asegúrate que formatDate y getStatusBadgeClass estén definidas
        const detalleProductos = solicitud.items.map(item => `<div><strong>${item.producto}:</strong> ${item.cantidad}</div>`).join('');
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Fecha">${ typeof formatDate === 'function' ? formatDate(solicitud.fechaSolicitud) : solicitud.fechaSolicitud}</td>
            <td data-label="Detalle">${detalleProductos}</td>
            <td data-label="Estado"><span class="badge ${typeof getStatusBadgeClass === 'function' ? getStatusBadgeClass(solicitud.estado) : ''}">${solicitud.estado}</span></td>
            <td data-label="Observaciones">${solicitud.observaciones || '<span class="text-muted">Sin observaciones</span>'}</td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}"><i class="fas fa-eye me-1"></i>Ver</button>
                    <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}"><i class="fas fa-edit me-1"></i>Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${solicitud.id}" data-nota="${solicitud.notaVenta}"><i class="fas fa-trash-alt me-1"></i>Eliminar</button>
                </div>
            </td>
        `;
        tablaSolicitudesAdmin.appendChild(tr);
    });
}

function updateAdminPagination(totalItems) {
    // (Tu código existente, asumiendo que createPaginationControls está definida)
    // createPaginationControls( /* ... */ );
    console.warn("updateAdminPagination necesita createPaginationControls");
}

function handlePageChange(newPage, panelName) {
    // (Tu código existente)
    if (panelName === 'admin') {
        currentPageAdmin = newPage;
        cargarDatosAdmin();
    } else if (panelName === 'productos') {
        currentPageProductos = newPage;
        cargarTablaProductos(); // Necesita estar definida
    } else if (panelName === 'repuestos') {
        currentPageRepuestos = newPage;
        cargarTablaRepuestos(); // Necesita estar definida
    }
}

function exportarSolicitudesCSV() {
    // (Tu código existente, asumiendo que `solicitudes` y `mostrarAlerta` están definidas)
    console.warn("exportarSolicitudesCSV necesita 'solicitudes' y 'mostrarAlerta'");
}

function generarEstadisticas() {
    // (Tu código existente, asumiendo que `solicitudes` y `mostrarAlerta` están definidas)
    console.warn("generarEstadisticas necesita 'solicitudes' y 'mostrarAlerta'");
}
// FIN SECCIÓN 2


// =====================================================
// SECCIÓN 3: FUNCIONES DE ADMINISTRACIÓN DE PRODUCTOS
// (Tu código existente para initAdminProductos, cargarTablaProductos, setupProductosListeners)
// ...
function initAdminProductos() {
    console.log("Inicializando panel de administración de productos...");
    tablaProductos = document.getElementById('tabla-productos'); // tablaProductos es global
    setupProductosListeners();
    console.log("Panel de administración de productos inicializado");
}

function cargarTablaProductos() {
    // (Tu código existente)
    if (!tablaProductos || !window.productosModule) return;
    console.warn("cargarTablaProductos necesita window.productosModule y createPaginationControls");
}

function setupProductosListeners() {
    console.log("Listeners de productos configurados (implementar según sea necesario)");
    // Por ejemplo, para la búsqueda en la tabla de productos:
    const buscarProductoInput = document.querySelector('#productos-content #buscar-producto'); // Asegúrate que el ID del input sea 'buscar-producto'
    if (buscarProductoInput) {
        buscarProductoInput.addEventListener('input', (e) => {
            filterTermProductos = e.target.value.toLowerCase();
            currentPageProductos = 1;
            cargarTablaProductos();
        });
    }

    // Listeners para botones de editar/eliminar producto (delegación de eventos)
    if (tablaProductos) {
        tablaProductos.addEventListener('click', (e) => {
            const target = e.target;
            const editarBtn = target.closest('.btn-editar-producto');
            const eliminarBtn = target.closest('.btn-eliminar-producto');

            if (editarBtn) {
                const productoId = editarBtn.dataset.id;
                // Lógica para editar producto, ej: window.productosModule.mostrarModalProducto(productoId);
                console.log('Editar producto ID:', productoId);
            }

            if (eliminarBtn) {
                const productoId = eliminarBtn.dataset.id;
                // Lógica para eliminar producto, ej: window.productosModule.eliminarProducto(productoId);
                console.log('Eliminar producto ID:', productoId);
            }
        });
    }
}
// FIN SECCIÓN 3


// =====================================================
// SECCIÓN 4: FUNCIONES DE ADMINISTRACIÓN DE REPUESTOS
// =====================================================

// Inicializar módulo de admin-repuestos
function initAdminRepuestos() {
    console.log("Inicializando panel de administración de repuestos...");
    tablaRepuestos = document.getElementById('tabla-repuestos'); // tablaRepuestos es global

    if (!window.repuestosModule) {
        console.error("Módulo de repuestos no disponible. La administración de repuestos no funcionará correctamente.");
        // return; // Podrías permitir que continúe para que al menos los listeners básicos se configuren
    }
    
    // La función agregarPestañaRepuestos() no está definida en el código que proporcionaste.
    // Si es necesaria para crear elementos HTML dinámicamente ANTES de setupRepuestosListeners,
    // debe estar aquí o asegurarse que el HTML ya existe.
    // agregarPestañaRepuestos(); 
    console.warn("agregarPestañaRepuestos() no está definida. Asumiendo que el HTML de la pestaña de repuestos ya existe.");
    
    setupRepuestosListeners(); // <-- Llamada crucial
    
    // Cargar la tabla de repuestos al inicializar si es necesario
    if (typeof cargarTablaRepuestos === "function") {
        cargarTablaRepuestos();
    }

    console.log("Panel de administración de repuestos inicializado");
}

// ***** INICIO: CÓDIGO IMPORTANTE A AGREGAR/VERIFICAR *****
// Función para configurar los listeners de la sección de repuestos
function setupRepuestosListeners() {
    console.log("Configurando listeners para la sección de repuestos...");

    // Listener para el botón de "Nuevo Repuesto"
    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    if (btnNuevoRepuesto) {
        btnNuevoRepuesto.addEventListener('click', () => {
            // Asumiendo que tienes una función para mostrar el modal de nuevo/editar repuesto
            // y que está expuesta, por ejemplo, en window.adminRepuestos.mostrarModalRepuesto()
            if (window.adminRepuestos && typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
                window.adminRepuestos.mostrarModalRepuesto(); // Sin ID para un nuevo repuesto
            } else {
                console.warn('La función mostrarModalRepuesto no está disponible en window.adminRepuestos.');
            }
        });
    } else {
        console.warn('Botón "btn-nuevo-repuesto" no encontrado.');
    }

    // Listener para el botón de "Importar Repuestos" (CARGA MASIVA)
    const btnCargaMasiva = document.getElementById('btn-carga-masiva');
    if (btnCargaMasiva) {
        btnCargaMasiva.addEventListener('click', importarRepuestosCSV); // Llama a tu función existente
        console.log('Listener añadido a #btn-carga-masiva');
    } else {
        console.error('El botón con id "btn-carga-masiva" no fue encontrado. Asegúrate que el ID en HTML es correcto.');
    }

    // Listener para el campo de búsqueda de repuestos
    const buscarRepuestoInput = document.getElementById('buscar-repuesto');
    if (buscarRepuestoInput) {
        buscarRepuestoInput.addEventListener('input', (e) => {
            filterTermRepuestos = e.target.value.toLowerCase();
            currentPageRepuestos = 1;
            if (typeof cargarTablaRepuestos === "function") {
                cargarTablaRepuestos();
            }
        });
    } else {
        console.warn('Campo de búsqueda "buscar-repuesto" no encontrado.');
    }

    // Listeners para botones de editar/eliminar en la tabla de repuestos (usando delegación de eventos)
    if (tablaRepuestos) { // tablaRepuestos es la variable global
        tablaRepuestos.addEventListener('click', (e) => {
            const target = e.target;
            const btnEditar = target.closest('.btn-editar-repuesto'); // Asume que los botones de editar tienen esta clase
            const btnEliminar = target.closest('.btn-eliminar-repuesto'); // Asume que los botones de eliminar tienen esta clase

            if (btnEditar) {
                const repuestoId = btnEditar.dataset.id; // Asume data-id="ID_DEL_REPUESTO" en el botón
                if (window.adminRepuestos && typeof window.adminRepuestos.editarRepuesto === 'function') {
                    // editarRepuesto podría ser una alias de mostrarModalRepuesto(id)
                    window.adminRepuestos.mostrarModalRepuesto(repuestoId);
                } else if (window.adminRepuestos && typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
                     window.adminRepuestos.mostrarModalRepuesto(repuestoId);
                }else {
                    console.warn('La función editarRepuesto o mostrarModalRepuesto no está disponible.');
                }
            }

            if (btnEliminar) {
                const repuestoId = btnEliminar.dataset.id;
                if (window.adminRepuestos && typeof window.adminRepuestos.eliminarRepuesto === 'function') {
                    window.adminRepuestos.eliminarRepuesto(repuestoId); // Necesitarás una confirmación aquí
                } else {
                    console.warn('La función eliminarRepuesto no está disponible.');
                }
            }
        });
    }
}
// ***** FIN: CÓDIGO IMPORTANTE A AGREGAR/VERIFICAR *****

// Asumo que tienes una función cargarTablaRepuestos, si no, necesitarás crearla.
// Esta es una estructura básica:
function cargarTablaRepuestos() {
    if (!tablaRepuestos) {
        console.error("Elemento tablaRepuestos no encontrado.");
        return;
    }
    if (!window.repuestosModule || typeof window.repuestosModule.getRepuestos !== 'function') {
        console.error("window.repuestosModule.getRepuestos no está disponible.");
        tablaRepuestos.innerHTML = `<tr><td colspan="5" class="text-center">Error al cargar repuestos.</td></tr>`;
        return;
    }

    const todosLosRepuestos = window.repuestosModule.getRepuestos(); // Obtener todos los repuestos

    let repuestosFiltrados = todosLosRepuestos;
    if (filterTermRepuestos) {
        repuestosFiltrados = todosLosRepuestos.filter(r =>
            (r.sku && r.sku.toLowerCase().includes(filterTermRepuestos)) ||
            (r.nombre && r.nombre.toLowerCase().includes(filterTermRepuestos)) ||
            (r.categoria && r.categoria.toLowerCase().includes(filterTermRepuestos))
        );
    }
    
    // Paginación (simplificada, necesitarías una lógica más robusta o usar tu createPaginationControls)
    const ITEMS_PER_PAGE_REPUESTOS = 10; // O la cantidad que prefieras
    const startIndex = (currentPageRepuestos - 1) * ITEMS_PER_PAGE_REPUESTOS;
    const repuestosPaginados = repuestosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE_REPUESTOS);
    const totalItems = repuestosFiltrados.length;

    tablaRepuestos.innerHTML = ''; // Limpiar tabla

    if (repuestosPaginados.length === 0) {
        tablaRepuestos.innerHTML = `<tr><td colspan="5" class="text-center py-4">
            <i class="fas fa-tools text-muted mb-2" style="font-size: 2rem;"></i>
            <p class="mb-0">No se encontraron repuestos.</p>
            ${filterTermRepuestos ? '<small class="text-muted">Intenta con otra búsqueda.</small>' : ''}
        </td></tr>`;
    } else {
        repuestosPaginados.forEach(repuesto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="SKU">${repuesto.sku || 'N/A'}</td>
                <td data-label="Nombre">${repuesto.nombre || 'N/A'}</td>
                <td data-label="Categoría">${repuesto.categoria || 'N/A'}</td>
                <td data-label="Stock">${repuesto.stock !== undefined ? repuesto.stock : 'N/A'}</td>
                <td data-label="Acciones">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-warning btn-editar-repuesto" data-id="${repuesto.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger btn-eliminar-repuesto" data-id="${repuesto.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tablaRepuestos.appendChild(tr);
        });
    }

    // Actualizar controles de paginación para repuestos
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#repuestos-content .card-footer #repuestos-pagination', // Selector del contenedor de paginación de repuestos
            totalItems,
            currentPageRepuestos,
            handlePageChange, // Tu función existente para manejar el cambio de página
            'repuestos' // Nombre del panel para handlePageChange
        );
    } else {
        console.warn("createPaginationControls no está definida. La paginación de repuestos no funcionará.");
    }
    const repuestosInfo = document.getElementById('repuestos-info');
    if (repuestosInfo) {
        repuestosInfo.textContent = `Mostrando ${repuestosPaginados.length} de ${totalItems} repuestos. Página ${currentPageRepuestos}.`;
    }
}
// FIN SECCIÓN 4


// =====================================================
// SECCIÓN 5: FUNCIONES DE CARGA MASIVA DE REPUESTOS
// (Tu código existente para importarRepuestosCSV, mostrarModalImportarRepuestos, etc.)
// ...
function importarRepuestosCSV() {
    // Crear modal para importación
    console.log("importarRepuestosCSV llamada"); // Para depuración
    mostrarModalImportarRepuestos();
}

function mostrarModalImportarRepuestos() {
    console.log("Mostrando modal de importación de repuestos...");
    
    let importarModal = document.getElementById('importar-repuestos-modal');
    
    if (!importarModal) {
        importarModal = document.createElement('div');
        importarModal.className = 'modal fade';
        importarModal.id = 'importar-repuestos-modal';
        importarModal.setAttribute('tabindex', '-1');
        importarModal.setAttribute('aria-hidden', 'true');
        
        importarModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-file-import me-2"></i>Importar Repuestos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="importar-repuestos-form">
                            <div class="mb-3">
                                <label for="archivo-csv" class="form-label">Archivo CSV</label>
                                <input type="file" class="form-control" id="archivo-csv" accept=".csv" required>
                                <small class="form-text text-muted">
                                    El archivo debe tener el formato: SKU, Nombre, Categoría, Stock
                                </small>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="tiene-encabezados" checked>
                                <label class="form-check-label" for="tiene-encabezados">El archivo tiene encabezados</label>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Opciones de importación</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="opcion-duplicados" id="opcion-saltar" value="saltar" checked>
                                    <label class="form-check-label" for="opcion-saltar">
                                        Saltar registros duplicados
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="opcion-duplicados" id="opcion-actualizar" value="actualizar">
                                    <label class="form-check-label" for="opcion-actualizar">
                                        Actualizar registros duplicados
                                    </label>
                                </div>
                            </div>
                            
                            <div id="preview-container" class="preview-container mb-3" style="display: none;">
                                <label class="form-label">Vista previa</label>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered">
                                        <thead id="preview-headers"></thead>
                                        <tbody id="preview-body"></tbody>
                                    </table>
                                </div>
                                <small class="text-muted">Mostrando los primeros 5 registros</small>
                            </div>
                            
                            <div class="progress mb-3" style="display: none;" id="import-progress-container">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     id="import-progress-bar" role="progressbar" 
                                     aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
                                    0%
                                </div>
                            </div>
                            
                            <div id="import-results" class="alert" style="display: none;"></div>
                            
                            <div class="text-end">
                                <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="btn-procesar-importacion" disabled>
                                    Importar Repuestos
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(importarModal);
        configurarEventosImportacion();
    }
    
    // Limpiar cualquier modal o backdrop existente ANTES de mostrar uno nuevo
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    // Asegurarse que el body no esté bloqueado por un modal anterior
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Obtener la instancia del modal (ya sea existente o recién creado)
    // y asegurarse de que no haya una instancia previa mal gestionada.
    let modalInstance = bootstrap.Modal.getInstance(importarModal);
    if (modalInstance) {
      // Si ya existe una instancia de Bootstrap y el modal está oculto, 
      // podría ser necesario redisponerla si se oculta incorrectamente.
      // Pero usualmente, si el modal existe, solo necesitamos llamarle show.
      // Sin embargo, para modales creados dinámicamente y que pueden ser removidos/re-agregados,
      // es más seguro desechar la instancia vieja y crear una nueva.
      modalInstance.dispose(); 
    }
    
    const modal = new bootstrap.Modal(importarModal); // Crear nueva instancia
    console.log("Intentando mostrar modal:", importarModal.id);
    modal.show();
}

function configurarEventosImportacion() {
    // (Tu código existente)
    const archivoInput = document.getElementById('archivo-csv');
    if (archivoInput) {
        archivoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('btn-procesar-importacion').disabled = false;
                mostrarVistaPrevia(file); // mostrarVistaPrevia necesita estar definida
            } else {
                document.getElementById('btn-procesar-importacion').disabled = true;
                document.getElementById('preview-container').style.display = 'none'; // Ocultar preview si no hay archivo
            }
        });
    }
    
    const btnProcesarImportacion = document.getElementById('btn-procesar-importacion');
    if (btnProcesarImportacion) {
        btnProcesarImportacion.addEventListener('click', function() {
            const file = document.getElementById('archivo-csv').files[0];
            const tieneEncabezados = document.getElementById('tiene-encabezados').checked;
            const opcionDuplicados = document.querySelector('input[name="opcion-duplicados"]:checked').value;
            
            if (file) {
                procesarImportacionCSV(file, tieneEncabezados, opcionDuplicados); // procesarImportacionCSV necesita estar definida
            }
        });
    }
}

function mostrarVistaPrevia(file) {
    // (Tu código existente)
    console.warn("mostrarVistaPrevia implementada superficialmente. Asegúrate que funciona como esperas.");
     const reader = new FileReader();
    
    reader.onload = function(e) {
        const contenido = e.target.result;
        const tieneEncabezados = document.getElementById('tiene-encabezados').checked;
        const previewContainer = document.getElementById('preview-container');
        const previewHeaders = document.getElementById('preview-headers');
        const previewBody = document.getElementById('preview-body');
        
        // Parsear el CSV (tu lógica existente)
        let lineas = contenido.split(/\r\n|\n/);
        // ... (resto de tu lógica de parseo) ...
        previewContainer.style.display = 'block';
    };
    reader.readAsText(file);
}


async function procesarImportacionCSV(file, tieneEncabezados, opcionDuplicados) {
    // (Tu código existente)
    console.warn("procesarImportacionCSV necesita window.repuestosModule.buscarRepuestoPorSku, actualizarRepuesto, agregarRepuesto y cargarTablaRepuestos");
    // ... Asegúrate que todas las dependencias dentro de esta función estén disponibles ...
    // Especialmente:
    // window.repuestosModule.buscarRepuestoPorSku
    // window.repuestosModule.actualizarRepuesto
    // window.repuestosModule.agregarRepuesto
    // cargarTablaRepuestos()
}

// ...
// FIN SECCIÓN 5


// =====================================================
// SECCIÓN 6: INICIALIZACIÓN Y EXPORTACIÓN DE FUNCIONES
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar referencias a elementos DOM
    tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin'); // Global
    // tablaProductos y tablaRepuestos se inicializan en sus respectivas funciones init
    
    // Inicializar panel principal de Admin (solicitudes)
    if (document.getElementById('solicitudes-content')) { // Solo si la pestaña de solicitudes existe
      setupAdminListeners();
      setupAdminButtonListeners(); // Ya llamada dentro de setupAdminListeners si es para la misma sección
      // cargarDatosAdmin(); // Cargar datos iniciales si es necesario al cargar la página
    }
    
    // Verificar si estamos en el panel de administración para otras inicializaciones
    if (document.getElementById('admin-panel')) {
        // El listener para confirmar-eliminacion-btn ya se configura en setupAdminListeners
        // const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
        // if (confirmarEliminacionBtn) {
        //     confirmarEliminacionBtn.addEventListener('click', eliminarSolicitud);
        // }
        
        // Inicializar módulo de productos si la pestaña existe
        if (document.getElementById('productos-content')) {
            initAdminProductos();
        }
        
        // Inicializar módulo de repuestos si la pestaña existe
        if (document.getElementById('repuestos-content')) { // Asegurarse que la pestaña de repuestos existe
            if (window.repuestosModule) {
                initAdminRepuestos();
            } else {
                console.warn("Esperando a que se cargue el módulo de repuestos (evento 'repuestosCargados')...");
                document.addEventListener('repuestosCargados', function handlerRepuestosCargados() {
                    console.log("Evento 'repuestosCargados' recibido, inicializando panel de administración de repuestos...");
                    initAdminRepuestos();
                    document.removeEventListener('repuestosCargados', handlerRepuestosCargados); // Limpiar listener
                });
            }
        }
    }

    // Lógica para cambiar de pestañas en el panel de admin y cargar/inicializar contenido
    const adminTabs = document.querySelectorAll('#adminTabs .nav-link');
    adminTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('data-bs-target');
            console.log(`Pestaña cambiada a: ${targetTabId}`);
            if (targetTabId === '#solicitudes-content' && typeof cargarDatosAdmin === 'function') {
                cargarDatosAdmin(); // Recargar datos de solicitudes al ver la pestaña
            } else if (targetTabId === '#productos-content' && typeof cargarTablaProductos === 'function') {
                initAdminProductos(); // Asegurar inicialización
                cargarTablaProductos(); // Recargar productos
            } else if (targetTabId === '#repuestos-content' && typeof cargarTablaRepuestos === 'function') {
                initAdminRepuestos(); // Asegurar inicialización
                // cargarTablaRepuestos() ya se llama dentro de initAdminRepuestos
            }
            // Añadir lógica similar para otras pestañas (usuarios, dashboard, reportes, auditoria)
        });
    });
    
    // Carga inicial de la primera pestaña activa (si es necesario)
    const activeAdminTab = document.querySelector('#adminTabs .nav-link.active');
    if (activeAdminTab) {
        const activeTabId = activeAdminTab.getAttribute('data-bs-target');
        if (activeTabId === '#solicitudes-content' && typeof cargarDatosAdmin === 'function') {
            // cargarDatosAdmin(); // Puede que ya se llame si 'admin-panel' existe
        } 
        // Añadir lógica para otras pestañas si pueden ser la activa por defecto
    }

});

// Exponer funciones al ámbito global (tu código existente)
window.showConfirmarEliminacionModal = showConfirmarEliminacionModal;
window.eliminarSolicitud = eliminarSolicitud;
window.cargarDatosAdmin = cargarDatosAdmin;
window.exportarSolicitudesCSV = exportarSolicitudesCSV;
window.generarEstadisticas = generarEstadisticas;

window.adminProductos = {
    initAdminProductos,
    cargarTablaProductos,
    // ...
};

window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos, // Asegúrate que esta función esté bien definida
    mostrarModalRepuesto, // Necesitarás definir esta función para el CRUD de repuestos
    editarRepuesto: (id) => { // Alias simple
        if(typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
            window.adminRepuestos.mostrarModalRepuesto(id);
        }
    },
    eliminarRepuesto, // Necesitarás definir esta función
    exportarRepuestosCSV: () => { console.warn("exportarRepuestosCSV para repuestos no implementado"); }, // Placeholder
    importarRepuestosCSV // Ya la tienes
};

// Placeholder para mostrarModalRepuesto y eliminarRepuesto (necesitarás implementarlos)
function mostrarModalRepuesto(repuestoId) {
    console.log(`Solicitado modal para repuesto ID: ${repuestoId || '(Nuevo repuesto)'}`);
    // Aquí iría la lógica para mostrar el modal 'repuesto-modal' del index.html
    // Si es para editar, cargarías los datos del repuestoId.
    // Si repuestoId es undefined/null, es para un nuevo repuesto.
    const modalEl = document.getElementById('repuesto-modal');
    if (modalEl) {
        const modalTitle = modalEl.querySelector('.modal-title');
        const form = document.getElementById('repuesto-form');
        form.reset(); // Limpiar formulario
        document.getElementById('repuesto-id').value = ''; // Limpiar ID oculto

        if (repuestoId && window.repuestosModule && typeof window.repuestosModule.getRepuestoById === 'function') {
            const repuesto = window.repuestosModule.getRepuestoById(repuestoId);
            if (repuesto) {
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Repuesto';
                document.getElementById('repuesto-id').value = repuesto.id;
                document.getElementById('repuesto-sku').value = repuesto.sku;
                document.getElementById('repuesto-nombre').value = repuesto.nombre;
                document.getElementById('repuesto-categoria').value = repuesto.categoria;
                document.getElementById('repuesto-stock').value = repuesto.stock;
                // Hacer SKU no editable si ya existe el repuesto
                 document.getElementById('repuesto-sku').readOnly = true;
            } else {
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto';
                 document.getElementById('repuesto-sku').readOnly = false;
            }
        } else {
            if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto';
            document.getElementById('repuesto-sku').readOnly = false;
        }

        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.dispose();
        modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    } else {
        console.error("Modal 'repuesto-modal' no encontrado.");
    }
}

// Listener para el formulario de repuestos
const repuestoForm = document.getElementById('repuesto-form');
if (repuestoForm) {
    repuestoForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const repuestoId = document.getElementById('repuesto-id').value;
        const sku = document.getElementById('repuesto-sku').value.trim();
        const nombre = document.getElementById('repuesto-nombre').value.trim();
        const categoria = document.getElementById('repuesto-categoria').value.trim();
        const stock = parseInt(document.getElementById('repuesto-stock').value) || 0;

        if (!sku || !nombre) {
            // Asumo que tienes una función mostrarAlerta
            if(typeof mostrarAlerta === 'function') mostrarAlerta('SKU y Nombre son requeridos.', 'warning');
            else alert('SKU y Nombre son requeridos.');
            return;
        }

        const repuestoData = { sku, nombre, categoria, stock };

        try {
            if (repuestoId) { // Actualizar
                repuestoData.id = repuestoId;
                if (window.repuestosModule && typeof window.repuestosModule.actualizarRepuesto === 'function') {
                    await window.repuestosModule.actualizarRepuesto(repuestoData);
                    if(typeof mostrarAlerta === 'function') mostrarAlerta('Repuesto actualizado con éxito.', 'success');
                } else { throw new Error("actualizarRepuesto no disponible");}
            } else { // Crear
                 // Verificar si el SKU ya existe para nuevos repuestos
                if (window.repuestosModule && typeof window.repuestosModule.buscarRepuestoPorSku === 'function') {
                    if (window.repuestosModule.buscarRepuestoPorSku(sku)) {
                        if(typeof mostrarAlerta === 'function') mostrarAlerta('El SKU ya existe. No se puede crear el repuesto.', 'danger');
                        else alert('El SKU ya existe. No se puede crear el repuesto.');
                        return;
                    }
                }
                if (window.repuestosModule && typeof window.repuestosModule.agregarRepuesto === 'function') {
                    repuestoData.id = 'R' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); // Generar ID
                    await window.repuestosModule.agregarRepuesto(repuestoData);
                    if(typeof mostrarAlerta === 'function') mostrarAlerta('Repuesto agregado con éxito.', 'success');
                } else { throw new Error("agregarRepuesto no disponible");}
            }
            if (typeof cargarTablaRepuestos === 'function') cargarTablaRepuestos();
            const modalEl = document.getElementById('repuesto-modal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        } catch (error) {
            console.error("Error guardando repuesto:", error);
            if(typeof mostrarAlerta === 'function') mostrarAlerta(`Error guardando repuesto: ${error.message}`, 'danger');
            else alert(`Error guardando repuesto: ${error.message}`);
        }
    });
}


function eliminarRepuesto(repuestoId) {
    // Implementar confirmación antes de eliminar
    if (confirm(`¿Estás seguro de que deseas eliminar el repuesto ID: ${repuestoId}?`)) {
        if (window.repuestosModule && typeof window.repuestosModule.eliminarRepuesto === 'function') {
            window.repuestosModule.eliminarRepuesto(repuestoId)
                .then(() => {
                    if(typeof mostrarAlerta === 'function') mostrarAlerta('Repuesto eliminado con éxito.', 'success');
                    if (typeof cargarTablaRepuestos === 'function') cargarTablaRepuestos();
                })
                .catch(error => {
                    console.error("Error eliminando repuesto:", error);
                    if(typeof mostrarAlerta === 'function') mostrarAlerta(`Error eliminando repuesto: ${error.message}`, 'danger');
                });
        } else {
            console.error("window.repuestosModule.eliminarRepuesto no disponible.");
        }
    }
}

// FIN SECCIÓN 6

// =====================================================
// SECCIÓN 7: ESTILOS CSS PARA LA CARGA MASIVA
// (Tu código existente)
// ...
(function() {
    const style = document.createElement('style');
    style.textContent = `
    /* Estilos para la importación de repuestos */
    .preview-container { /* ...tus estilos... */ }
    /* ...más estilos... */
    `;
    document.head.appendChild(style);
})();
// FIN SECCIÓN 7

// Asegúrate que las funciones auxiliares como mostrarAlerta, createPaginationControls, 
// paginateAndFilterItems, formatDate, getStatusBadgeClass, y el módulo window.repuestosModule
// (con getRepuestos, buscarRepuestoPorSku, agregarRepuesto, actualizarRepuesto, eliminarRepuesto, getRepuestoById)
// y window.productosModule (con getProductos) estén definidas en otros archivos (utils.js, repuestos.js, productos.js)
// y cargadas ANTES que admin.js, o al menos que estén disponibles cuando se llamen.
