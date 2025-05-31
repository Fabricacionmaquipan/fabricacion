// =====================================================
// ARCHIVO UNIFICADO: ADMIN + ADMIN-PRODUCTOS + ADMIN-REPUESTOS
// =====================================================

// Elementos DOM compartidos
let tablaSolicitudesAdmin;

// Variables para módulo principal de Admin (Solicitudes)
let currentPageAdmin = 1;
const ITEMS_PER_PAGE_ADMIN = 10; // Definir cuántos items por página para admin
let filterTermAdmin = '';
let filterStatusAdmin = 'all'; // Puede ser 'all', 'pendientes', 'fabricacion', 'entregadas'


// Variables para módulo de Productos (si se usa por admin)
// let tablaProductos;
// let currentPageProductos = 1;
// let filterTermProductos = '';

// Variables para módulo de Repuestos (si admin los gestiona)
let tablaRepuestos; // Se asigna en initAdminRepuestos
let currentPageRepuestos = 1;
const ITEMS_PER_PAGE_REPUESTOS = 10; // Definir items por página para repuestos
let filterTermRepuestos = '';


function setupAdminListeners() {
    // Listeners para la pestaña de Solicitudes
    const filtroDropdownItemsSolicitudes = document.querySelectorAll('#admin-panel #solicitudes-content .dropdown-item');
    if (filtroDropdownItemsSolicitudes) {
        filtroDropdownItemsSolicitudes.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                filtroDropdownItemsSolicitudes.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                const filterTextContent = item.textContent.trim();
                const filterButton = item.closest('.dropdown').querySelector('.dropdown-toggle');

                switch (filterTextContent) {
                    case 'Pendientes':
                        filterStatusAdmin = 'pendientes';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Pendientes`;
                        break;
                    case 'En Fabricación':
                        filterStatusAdmin = 'fabricacion';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> En Fabricación`;
                        break;
                    case 'Entregadas':
                        filterStatusAdmin = 'entregadas';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Entregadas`;
                        break;
                    default: // 'Todas'
                        filterStatusAdmin = 'all';
                        if (filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Todas`;
                }
                currentPageAdmin = 1;
                if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
            });
        });
    }
    
    const searchInputAdminSolicitudes = document.querySelector('#admin-panel #solicitudes-content .input-group input');
    if (searchInputAdminSolicitudes) {
        searchInputAdminSolicitudes.addEventListener('input', (e) => {
            filterTermAdmin = e.target.value.toLowerCase();
            currentPageAdmin = 1; 
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
        });
    }
    
    // Listeners para botones de acción en la tabla de solicitudes
    setupAdminButtonListeners(); 
    
    // Listener para el botón de confirmación de eliminación (en el modal)
    const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
    if (confirmarEliminacionBtn) {
        confirmarEliminacionBtn.addEventListener('click', () => {
            const user = getCurrentUser(); // auth.js
            if (user && user.role === 'visualizador') {
                mostrarAlerta('No tienes permisos para eliminar solicitudes.', 'danger');
                const modalEl = document.getElementById('confirmar-eliminacion-modal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                return;
            }
            eliminarSolicitudConfirmado(); // Llama a la función que realmente elimina
        });
    }

    // Listeners para la pestaña de usuarios (si el admin la usa)
    // El botón de "Nuevo Usuario" ya tiene un listener en el script global de index.html
    // Aquí podríamos añadir listeners para la tabla de usuarios si es necesario para editar/eliminar
    const tablaUsuariosEl = document.getElementById('tabla-usuarios');
    if (tablaUsuariosEl) {
        tablaUsuariosEl.addEventListener('click', (e) => {
            const user = getCurrentUser(); // auth.js
            if (user && user.role === 'visualizador') return; // Visualizador no interactúa con esta tabla

            const editButton = e.target.closest('.btn-editar-usuario'); // Asume clase .btn-editar-usuario
            const deleteButton = e.target.closest('.btn-eliminar-usuario'); // Asume clase .btn-eliminar-usuario

            if (editButton) {
                const userId = editButton.dataset.id;
                // Lógica para editar usuario (ej. abrir modal con datos)
                console.log("Editar usuario:", userId);
            }
            if (deleteButton) {
                const userId = deleteButton.dataset.id;
                // Lógica para eliminar usuario (con confirmación)
                console.log("Eliminar usuario:", userId);
            }
        });
    }

    // Los listeners para Repuestos se configuran en initAdminRepuestos -> setupRepuestosListeners
}

function setupAdminButtonListeners() {
    const tablaSolicitudesAdminElem = document.getElementById('tabla-solicitudes-admin');
    if (tablaSolicitudesAdminElem) {
        tablaSolicitudesAdminElem.addEventListener('click', (e) => {
            let targetButton = null;
            const user = getCurrentUser(); // auth.js

            // Botón de Detalle (permitido para todos, incluyendo visualizador)
            if (e.target.classList.contains('btn-detalle') || e.target.closest('.btn-detalle')) {
                targetButton = e.target.classList.contains('btn-detalle') ? e.target : e.target.closest('.btn-detalle');
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                }
            } 
            // Otros botones solo si el usuario NO es visualizador
            else if (user && user.role !== 'visualizador') {
                if (e.target.classList.contains('btn-cambiar-estado') || e.target.closest('.btn-cambiar-estado')) {
                    targetButton = e.target.classList.contains('btn-cambiar-estado') ? e.target : e.target.closest('.btn-cambiar-estado');
                    const solicitudId = targetButton.getAttribute('data-id');
                    if (solicitudId && typeof window.showActualizarEstadoModal === 'function') {
                        window.showActualizarEstadoModal(solicitudId);
                    }
                } else if (e.target.classList.contains('btn-eliminar') || e.target.closest('.btn-eliminar')) {
                    targetButton = e.target.classList.contains('btn-eliminar') ? e.target : e.target.closest('.btn-eliminar');
                    const solicitudId = targetButton.getAttribute('data-id');
                    const notaVenta = targetButton.getAttribute('data-nota');
                    if (solicitudId && typeof showConfirmarEliminacionModal === 'function') {
                        showConfirmarEliminacionModal(solicitudId, notaVenta);
                    }
                }
            }
            if (targetButton) e.stopPropagation(); // Detener propagación si un botón fue manejado
        });
    }
}

function showConfirmarEliminacionModal(solicitudId, notaVenta) {
    const user = getCurrentUser(); // auth.js
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para eliminar solicitudes.', 'danger');
        return;
    }

    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    const solicitudIdInput = document.getElementById('eliminar-solicitud-id');
    const notaVentaDisplay = document.getElementById('eliminar-nota-venta');
    if (solicitudIdInput) solicitudIdInput.value = solicitudId;
    if (notaVentaDisplay) notaVentaDisplay.textContent = notaVenta || `ID: ${solicitudId ? solicitudId.slice(-6) : 'N/A'}`;
    
    const confirmarModalEl = document.getElementById('confirmar-eliminacion-modal');
    if (!confirmarModalEl) return;

    let modalInstance = bootstrap.Modal.getInstance(confirmarModalEl);
    if (modalInstance) modalInstance.dispose();
    modalInstance = new bootstrap.Modal(confirmarModalEl);

    confirmarModalEl.addEventListener('hidden.bs.modal', function onModalHidden() {
        const currentBackdrop = document.querySelector('.modal-backdrop');
        if (currentBackdrop) currentBackdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        confirmarModalEl.removeEventListener('hidden.bs.modal', onModalHidden);
    }, { once: true });
    
    modalInstance.show();
}

// Renombrada de eliminarSolicitud para diferenciarla de la que llama el botón de confirmación
function eliminarSolicitudConfirmado() {
    const solicitudId = document.getElementById('eliminar-solicitud-id').value;
    if (!solicitudId) {
        mostrarAlerta('Error: No se pudo identificar la solicitud a eliminar.', 'danger');
        return;
    }

    // Doble chequeo de rol, aunque el botón del modal ya lo hace.
    const user = getCurrentUser(); // auth.js
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para eliminar solicitudes.', 'danger');
        return;
    }

    mostrarSincronizacion('Eliminando solicitud...');
    
    // Asumiendo que solicitudesRef está definido globalmente o accesible (desde config.js o app.js)
    if (typeof solicitudesRef === 'undefined' && typeof firebase !== 'undefined') {
        // Si no está global, definirla aquí para esta operación puntual.
        // Esto es menos ideal que tenerla consistentemente disponible.
        const tempSolicitudesRef = firebase.database().ref('solicitudes');
        tempSolicitudesRef.child(solicitudId).remove()
        .then(() => handleEliminacionExitosa(solicitudId))
        .catch(error => handleEliminacionError(error));
    } else if (typeof solicitudesRef !== 'undefined') {
         solicitudesRef.child(solicitudId).remove()
        .then(() => handleEliminacionExitosa(solicitudId))
        .catch(error => handleEliminacionError(error));
    } else {
        handleEliminacionError({ message: "Referencia a Firebase no disponible." });
    }
}

function handleEliminacionExitosa(solicitudId) {
    const modalEl = document.getElementById('confirmar-eliminacion-modal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    mostrarAlerta('Solicitud eliminada correctamente.', 'success');
    currentPageAdmin = 1; 
    if (typeof cargarDatosAdmin === 'function') {
        setTimeout(() => { cargarDatosAdmin(); }, 300); 
    }
    ocultarSincronizacion();
}

function handleEliminacionError(error) {
    console.error('Error al eliminar solicitud de Firebase:', error);
    mostrarAlerta('Error al eliminar la solicitud: ' + error.message, 'danger');
    ocultarSincronizacion();
}


function cargarDatosAdmin() {
    if (!tablaSolicitudesAdmin) {
        tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');
        if (!tablaSolicitudesAdmin) {
            console.error("Elemento tabla-solicitudes-admin no encontrado.");
            return;
        }
    }
    
    tablaSolicitudesAdmin.innerHTML = '<tr><td colspan="7" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Cargando solicitudes...</td></tr>';
    
    // 'solicitudes' es la variable global de app.js
    if (typeof solicitudes === 'undefined' || !Array.isArray(solicitudes)) {
        tablaSolicitudesAdmin.innerHTML = `<tr><td colspan="7" class="text-center py-4">Error: No se pudieron cargar los datos de solicitudes.</td></tr>`;
        if (typeof updateAdminPagination === 'function') updateAdminPagination(0);
        return;
    }
    
    if (solicitudes.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `<tr><td colspan="7" class="text-center py-4">No hay solicitudes para mostrar.</td></tr>`;
        if (typeof updateAdminPagination === 'function') updateAdminPagination(0);
        return;
    }

    let itemsFiltrados = solicitudes; // Usar la variable global 'solicitudes' de app.js
    if (filterTermAdmin) {
        itemsFiltrados = itemsFiltrados.filter(sol =>
            (sol.notaVenta && sol.notaVenta.toLowerCase().includes(filterTermAdmin)) ||
            (sol.id && sol.id.toLowerCase().includes(filterTermAdmin)) ||
            (sol.cliente && sol.cliente.toLowerCase().includes(filterTermAdmin)) ||
            (sol.local && sol.local.toLowerCase().includes(filterTermAdmin)) ||
            (sol.items && sol.items.some(item => 
                (item.producto && item.producto.toLowerCase().includes(filterTermAdmin)) || 
                (item.sku && item.sku.toLowerCase().includes(filterTermAdmin)) 
            )) ||
            (sol.estado && sol.estado.toLowerCase().includes(filterTermAdmin))
        );
    }

    if (filterStatusAdmin !== 'all') {
        itemsFiltrados = itemsFiltrados.filter(sol => {
            if (filterStatusAdmin === 'pendientes') return sol.estado === 'Solicitud enviada por bodega';
            if (filterStatusAdmin === 'fabricacion') return sol.estado === 'En fabricación';
            if (filterStatusAdmin === 'entregadas') return sol.estado === 'Entregado';
            return false; 
        });
    }
    
    const totalItemsFiltrados = itemsFiltrados.length;
    const startIndex = (currentPageAdmin - 1) * ITEMS_PER_PAGE_ADMIN;
    const endIndex = startIndex + ITEMS_PER_PAGE_ADMIN;
    const solicitudesPaginadas = itemsFiltrados.slice(startIndex, endIndex);
    
    if (typeof updateAdminPagination === 'function') updateAdminPagination(totalItemsFiltrados);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `<tr><td colspan="7" class="text-center py-4">No se encontraron solicitudes con los filtros aplicados.</td></tr>`;
        return;
    }
    
    tablaSolicitudesAdmin.innerHTML = ''; 

    const user = getCurrentUser(); // auth.js
    const userRole = user ? user.role : '';

    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        const detalleProductos = solicitud.items && solicitud.items.length > 0 
            ? solicitud.items.map(item => `<div><strong>${item.producto || 'N/A'}</strong> (SKU: ${item.sku || 'N/A'}): ${item.cantidad || 0}</div>`).join('')
            : 'Sin detalle de productos.';
        const idCorto = solicitud.id ? solicitud.id.substring(solicitud.id.length - 6) : 'N/A';
        
        let accionesHTML = '';
        if (userRole === 'visualizador') {
            accionesHTML = `<button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}"><i class="fas fa-eye me-1"></i>Ver</button>`;
        } else if (userRole === 'admin') { 
            accionesHTML = `
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}"><i class="fas fa-eye me-1"></i>Ver</button>
                    <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}"><i class="fas fa-edit me-1"></i>Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${solicitud.id}" data-nota="${solicitud.notaVenta || ''}"><i class="fas fa-trash-alt me-1"></i>Eliminar</button>
                </div>`;
        }

        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta || 'N/A'}</td>
            <td data-label="Fecha">${ typeof formatDate === 'function' ? formatDate(solicitud.fechaSolicitud) : (solicitud.fechaSolicitud || 'N/A')}</td>
            <td data-label="Detalle">${detalleProductos}</td>
            <td data-label="Estado"><span class="badge ${typeof getStatusBadgeClass === 'function' ? getStatusBadgeClass(solicitud.estado) : 'bg-secondary'}">${solicitud.estado || 'Sin estado'}</span></td>
            <td data-label="Observaciones">${solicitud.observaciones || '<span class="text-muted small">Sin observaciones</span>'}</td>
            <td data-label="Acciones">${accionesHTML}</td>
        `;
        tablaSolicitudesAdmin.appendChild(tr);
    });
}

function updateAdminPagination(totalItems) {
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#admin-panel #solicitudes-content .card-footer', 
            totalItems,
            currentPageAdmin,
            window.handlePageChange, // app.js
            'admin', 
            ITEMS_PER_PAGE_ADMIN
        );
    } else {
        console.warn("createPaginationControls no está definida. La paginación del admin no funcionará.");
        const footer = document.querySelector('#admin-panel #solicitudes-content .card-footer');
        if (footer) footer.innerHTML = ''; 
    }
}


function exportarSolicitudesCSV() {
    const user = getCurrentUser(); // auth.js
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para exportar datos.', 'danger');
        return;
    }
    if (typeof solicitudes === 'undefined' || solicitudes.length === 0) {
        mostrarAlerta('No hay solicitudes para exportar.', 'warning');
        return;
    }
    
    let csvContent = "ID Solicitud,Nota Venta,Cliente,Local,Fecha Solicitud,Estado,Observaciones,SKU,Producto,Cantidad\n";
    solicitudes.forEach(sol => {
        const commonData = `"${sol.id}","${sol.notaVenta || ''}","${sol.cliente || ''}","${sol.local || ''}","${sol.fechaSolicitud || ''}","${sol.estado || ''}","${(sol.observaciones || '').replace(/"/g, '""')}"`;
        if (sol.items && sol.items.length > 0) {
            sol.items.forEach(item => {
                csvContent += `${commonData},"${item.sku || ''}","${item.producto || ''}","${item.cantidad || 0}"\n`;
            });
        } else {
            csvContent += `${commonData},,,, \n`; // Sin items
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "solicitudes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        mostrarAlerta('Solicitudes exportadas a CSV.', 'success');
    } else {
        mostrarAlerta('La exportación CSV no es compatible con tu navegador.', 'warning');
    }
}

function generarEstadisticas() {
    const user = getCurrentUser(); // auth.js
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para generar estadísticas.', 'danger');
        return;
    }
    // Lógica para generar estadísticas (ejemplo: contar solicitudes por estado)
    if (typeof solicitudes === 'undefined' || solicitudes.length === 0) {
        mostrarAlerta('No hay datos para generar estadísticas.', 'info');
        return;
    }
    const stats = solicitudes.reduce((acc, sol) => {
        acc[sol.estado] = (acc[sol.estado] || 0) + 1;
        return acc;
    }, {});

    alert("Estadísticas de Solicitudes:\n" + JSON.stringify(stats, null, 2));
    console.warn("generarEstadisticas es una implementación de ejemplo.");
}

// --- Funciones de Administración de Productos (si se usan por admin) ---
// initAdminProductos, cargarTablaProductos, setupProductosListeners
// Estas funciones necesitarían lógica similar para ocultar/deshabilitar acciones
// si el rol 'visualizador' tuviera acceso a una pestaña de productos.

// --- Funciones de Administración de Repuestos ---
function initAdminRepuestos() {
    tablaRepuestos = document.getElementById('tabla-repuestos');
    if (!tablaRepuestos) {
        console.warn("Elemento tabla-repuestos no encontrado. La pestaña de repuestos podría no funcionar.");
    }

    const user = getCurrentUser(); // auth.js
    const esVisualizador = user && user.role === 'visualizador';

    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    const btnCargaMasiva = document.getElementById('btn-carga-masiva');

    if (esVisualizador) {
        if (btnNuevoRepuesto) btnNuevoRepuesto.style.display = 'none';
        if (btnCargaMasiva) btnCargaMasiva.style.display = 'none';
    } else {
        if (btnNuevoRepuesto) btnNuevoRepuesto.style.display = ''; // Mostrar para admin
        if (btnCargaMasiva) btnCargaMasiva.style.display = '';   // Mostrar para admin
    }

    if (!window.repuestosModule) {
        console.error("Módulo de repuestos (window.repuestosModule) no disponible. La administración de repuestos no funcionará completamente.");
    }
    
    setupRepuestosListeners(); // Configura listeners de búsqueda, etc.
    
    if (typeof cargarTablaRepuestos === "function") {
        cargarTablaRepuestos(); // Carga inicial de la tabla
    }
}

function setupRepuestosListeners() {
    const user = getCurrentUser(); // auth.js
    const esVisualizador = user && user.role === 'visualizador';

    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    if (btnNuevoRepuesto) {
        if (esVisualizador) {
            btnNuevoRepuesto.style.display = 'none';
        } else {
            btnNuevoRepuesto.style.display = '';
            // Remover listener anterior para evitar duplicados si se llama múltiples veces
            btnNuevoRepuesto.replaceWith(btnNuevoRepuesto.cloneNode(true)); // Clonar para limpiar listeners
            document.getElementById('btn-nuevo-repuesto').addEventListener('click', () => {
                if (window.adminRepuestos && typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
                    window.adminRepuestos.mostrarModalRepuesto(); // Sin ID para nuevo repuesto
                }
            });
        }
    }

    const btnCargaMasiva = document.getElementById('btn-carga-masiva');
    if (btnCargaMasiva) {
         if (esVisualizador) {
            btnCargaMasiva.style.display = 'none';
        } else {
            btnCargaMasiva.style.display = '';
            btnCargaMasiva.replaceWith(btnCargaMasiva.cloneNode(true));
            document.getElementById('btn-carga-masiva').addEventListener('click', importarRepuestosCSV);
        }
    }

    const buscarRepuestoInput = document.getElementById('buscar-repuesto');
    if (buscarRepuestoInput) {
        // Limpiar listeners anteriores si es necesario o usar una bandera
        if (!buscarRepuestoInput.dataset.listenerAttached) {
            buscarRepuestoInput.addEventListener('input', (e) => {
                filterTermRepuestos = e.target.value.toLowerCase();
                currentPageRepuestos = 1;
                if (typeof cargarTablaRepuestos === "function") {
                    cargarTablaRepuestos();
                }
            });
            buscarRepuestoInput.dataset.listenerAttached = 'true';
        }
    }

    if (tablaRepuestos) {
        // Delegación de eventos para botones de editar/eliminar en la tabla
        // Limpiar listeners anteriores clonando la tabla es una opción drástica,
        // mejor sería guardar referencia al handler y removerlo, o usar una bandera.
        // Por simplicidad, asumimos que este setup se llama una vez o los eventos no se duplican problemáticamente.
        tablaRepuestos.addEventListener('click', (e) => {
            if (esVisualizador) return; // Visualizador no puede hacer click en acciones

            const target = e.target;
            const btnEditar = target.closest('.btn-editar-repuesto');
            const btnEliminar = target.closest('.btn-eliminar-repuesto');

            if (btnEditar) {
                const repuestoId = btnEditar.dataset.id;
                if (window.adminRepuestos && typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
                    window.adminRepuestos.mostrarModalRepuesto(repuestoId);
                }
            }

            if (btnEliminar) {
                const repuestoId = btnEliminar.dataset.id;
                if (window.adminRepuestos && typeof window.adminRepuestos.eliminarRepuesto === 'function') {
                    window.adminRepuestos.eliminarRepuesto(repuestoId);
                }
            }
        });
    }
}

function cargarTablaRepuestos() {
    if (!tablaRepuestos) {
        console.error("Elemento tablaRepuestos no encontrado.");
        return;
    }
    if (!window.repuestosModule || typeof window.repuestosModule.getRepuestos !== 'function') {
        tablaRepuestos.innerHTML = `<tr><td colspan="5" class="text-center">Error: Módulo de repuestos no disponible.</td></tr>`;
        if (typeof updateRepuestosPagination === 'function') updateRepuestosPagination(0);
        return;
    }

    tablaRepuestos.innerHTML = '<tr><td colspan="5" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Cargando repuestos...</td></tr>';
    const todosLosRepuestos = window.repuestosModule.getRepuestos(); // Asume que esto devuelve un array

    let repuestosFiltrados = todosLosRepuestos;
    if (filterTermRepuestos) {
        repuestosFiltrados = todosLosRepuestos.filter(r =>
            (r.sku && r.sku.toLowerCase().includes(filterTermRepuestos)) ||
            (r.nombre && r.nombre.toLowerCase().includes(filterTermRepuestos)) ||
            (r.categoria && r.categoria.toLowerCase().includes(filterTermRepuestos))
        );
    }
    
    const totalItemsFiltrados = repuestosFiltrados.length;
    const startIndex = (currentPageRepuestos - 1) * ITEMS_PER_PAGE_REPUESTOS;
    const repuestosPaginados = repuestosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE_REPUESTOS);

    if (typeof updateRepuestosPagination === 'function') updateRepuestosPagination(totalItemsFiltrados);
    tablaRepuestos.innerHTML = ''; 

    if (repuestosPaginados.length === 0) {
        tablaRepuestos.innerHTML = `<tr><td colspan="5" class="text-center py-4">No se encontraron repuestos.</td></tr>`;
    } else {
        const user = getCurrentUser(); // auth.js
        const userRole = user ? user.role : '';

        repuestosPaginados.forEach(repuesto => {
            const tr = document.createElement('tr');
            let accionesRepuestoHTML = '<span class="text-muted small">Sin acciones</span>'; // Default para visualizador o si no hay acciones
            if (userRole === 'admin') { 
                accionesRepuestoHTML = `
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-warning btn-editar-repuesto" data-id="${repuesto.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger btn-eliminar-repuesto" data-id="${repuesto.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>`;
            }

            tr.innerHTML = `
                <td data-label="SKU">${repuesto.sku || 'N/A'}</td>
                <td data-label="Nombre">${repuesto.nombre || 'N/A'}</td>
                <td data-label="Categoría">${repuesto.categoria || 'N/A'}</td>
                <td data-label="Stock">${repuesto.stock !== undefined ? repuesto.stock : 'N/A'}</td>
                <td data-label="Acciones">${accionesRepuestoHTML}</td>
            `;
            tablaRepuestos.appendChild(tr);
        });
    }
}

// Wrapper para paginación de repuestos
function updateRepuestosPagination(totalItems) {
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#repuestos-content .card-footer #repuestos-pagination', 
            totalItems,
            currentPageRepuestos,
            window.handlePageChange, // app.js
            'admin_repuestos', // panelName específico para repuestos
            ITEMS_PER_PAGE_REPUESTOS
        );
    }
    const repuestosInfoEl = document.getElementById('repuestos-info');
    if (repuestosInfoEl) {
        if (totalItems > 0) {
            const startItem = (currentPageRepuestos - 1) * ITEMS_PER_PAGE_REPUESTOS + 1;
            const endItem = Math.min(startItem + ITEMS_PER_PAGE_REPUESTOS - 1, totalItems);
            repuestosInfoEl.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems} repuestos.`;
        } else {
            repuestosInfoEl.textContent = 'No hay repuestos para mostrar.';
        }
    }
}


// --- Funciones de Carga Masiva de Repuestos ---
function importarRepuestosCSV() {
    const user = getCurrentUser(); // auth.js
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para importar repuestos.', 'danger');
        return;
    }
    if (typeof mostrarModalImportarRepuestos === 'function') {
        mostrarModalImportarRepuestos();
    } else {
        console.error("mostrarModalImportarRepuestos no está definida.");
    }
}
// Las funciones mostrarModalImportarRepuestos, configurarEventosImportacion, mostrarVistaPrevia, procesarImportacionCSV
// no necesitan chequeo de rol directo si la entrada (importarRepuestosCSV) ya está protegida.

// (Asegúrate que las funciones de carga masiva como `mostrarModalImportarRepuestos` estén definidas,
//  ya sea en este archivo o importadas correctamente si están en `carga-masiva-repuestos.js` o similar)


// --- Inicialización y Exportación ---
document.addEventListener('DOMContentLoaded', function() {
    // Asignar elemento tablaSolicitudesAdmin una vez que el DOM está listo
    tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');
    
    // Configurar listeners generales para el panel de admin (siempre que el panel exista)
    if (document.getElementById('admin-panel')) {
      setupAdminListeners(); 
    }
    
    // Inicializar otras pestañas del admin si existen y son relevantes
    // La visibilidad para el rol 'visualizador' es controlada por configureAppForRole en app.js
    if (document.getElementById('repuestos-content')) {
        // No llamar a initAdminRepuestos aquí directamente si la pestaña puede estar oculta.
        // Se llamará cuando la pestaña se active (ver listener de 'shown.bs.tab')
        // o si 'admin-panel' es el panel por defecto para el admin y repuestos es la pestaña activa.
    }
    // Similar para usuarios, dashboard, etc.

    // Listener para cambio de pestañas en el panel de admin
    const adminTabs = document.querySelectorAll('#adminTabs .nav-link');
    adminTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('data-bs-target');
            const user = getCurrentUser(); // auth.js

            // Si el rol es visualizador, no debería poder cambiar a tabs no permitidas,
            // ya que estarían ocultas por configureAppForRole.
            // Este código es más para roles con acceso completo.
            if (user && user.role === 'visualizador' && targetTabId !== '#solicitudes-content') {
                // Esta situación no debería ocurrir si configureAppForRole funciona bien.
                console.warn("Visualizador intentó cambiar a una pestaña no permitida:", targetTabId);
                // Si es necesario, forzar de vuelta a la pestaña de solicitudes:
                // const solicitudesTabBtn = document.getElementById('solicitudes-tab');
                // if (solicitudesTabBtn) bootstrap.Tab.getOrCreateInstance(solicitudesTabBtn).show();
                return; 
            }

            // Cargar datos o inicializar la pestaña activa
            if (targetTabId === '#solicitudes-content' && typeof cargarDatosAdmin === 'function') {
                cargarDatosAdmin(); 
            } else if (targetTabId === '#repuestos-content') {
                // La pestaña de repuestos está oculta para 'visualizador' por configureAppForRole.
                // Si se decide mostrarla en modo lectura, aquí se llamaría initAdminRepuestos()
                // y cargarTablaRepuestos() se aseguraría de no mostrar botones de acción.
                if ((!user || user.role !== 'visualizador') && typeof initAdminRepuestos === 'function') {
                     initAdminRepuestos(); 
                }
            } else if (targetTabId === '#usuarios-content' && typeof cargarTablaUsuarios === 'function') {
                 if ((!user || user.role !== 'visualizador')) { // Asumiendo que cargarTablaUsuarios es para admin
                    // cargarTablaUsuarios(); // Debes tener esta función definida para la pestaña de usuarios
                 }
            }
            // Añadir lógica similar para dashboard-content, reportes-content, auditoria-content
            // siempre verificando el rol si es necesario.
        });
    });
});

// Exponer funciones al ámbito global para ser llamadas desde HTML (onclick) o otros scripts
window.showConfirmarEliminacionModal = showConfirmarEliminacionModal;
// La función eliminarSolicitudConfirmado es interna, llamada por el listener del botón del modal.
window.cargarDatosAdmin = cargarDatosAdmin; // Para actualizar la tabla desde otros lugares si es necesario
window.exportarSolicitudesCSV = exportarSolicitudesCSV;
window.generarEstadisticas = generarEstadisticas;

// Objeto global para adminRepuestos
window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos,
    mostrarModalRepuesto: function(repuestoId) {
        const user = getCurrentUser(); // auth.js
        if (user && user.role === 'visualizador') {
            mostrarAlerta("Acción no permitida.", "danger"); return;
        }
        
        console.log(`Solicitado modal para repuesto ID: ${repuestoId || '(Nuevo repuesto)'}`);
        const modalEl = document.getElementById('repuesto-modal');
        if (!modalEl) {
            console.error("Modal 'repuesto-modal' no encontrado.");
            return;
        }

        const modalTitle = modalEl.querySelector('.modal-title');
        const form = document.getElementById('repuesto-form');
        const repuestoIdEl = document.getElementById('repuesto-id');
        const repuestoSkuEl = document.getElementById('repuesto-sku');
        const repuestoNombreEl = document.getElementById('repuesto-nombre');
        const repuestoCategoriaEl = document.getElementById('repuesto-categoria');
        const repuestoStockEl = document.getElementById('repuesto-stock');

        if(form) form.reset();
        if(repuestoIdEl) repuestoIdEl.value = '';
        if(repuestoSkuEl) repuestoSkuEl.readOnly = false; // Por defecto editable para nuevo

        if (repuestoId && window.repuestosModule && typeof window.repuestosModule.getRepuestoById === 'function') {
            const repuesto = window.repuestosModule.getRepuestoById(repuestoId);
            if (repuesto) {
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Repuesto';
                if(repuestoIdEl) repuestoIdEl.value = repuesto.id;
                if(repuestoSkuEl) repuestoSkuEl.value = repuesto.sku;
                if(repuestoNombreEl) repuestoNombreEl.value = repuesto.nombre;
                if(repuestoCategoriaEl) repuestoCategoriaEl.value = repuesto.categoria;
                if(repuestoStockEl) repuestoStockEl.value = repuesto.stock;
                if(repuestoSkuEl) repuestoSkuEl.readOnly = true; // SKU no editable al editar
            } else { // ID provisto pero repuesto no encontrado
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto (ID no encontrado)';
            }
        } else { // Nuevo repuesto
            if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto';
        }

        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.dispose(); // Desechar instancia vieja para evitar problemas
        modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    },
    eliminarRepuesto: function(repuestoId) {
        const user = getCurrentUser(); // auth.js
        if (user && user.role === 'visualizador') {
            mostrarAlerta("Acción no permitida.", "danger"); return;
        }
        
        if (confirm(`¿Estás seguro de que deseas eliminar el repuesto ID: ${repuestoId}?`)) {
            if (window.repuestosModule && typeof window.repuestosModule.eliminarRepuesto === 'function') {
                window.repuestosModule.eliminarRepuesto(repuestoId) // Asume que esto es una Promise
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
    },
    importarRepuestosCSV // Ya definida y protegida por rol más arriba
};

// Listener para el formulario de repuestos (el submit)
// Debe estar después de la definición de window.adminRepuestos
const repuestoForm = document.getElementById('repuesto-form');
if (repuestoForm) {
    // Asegurar que no se añadan múltiples listeners si este script se carga o ejecuta varias veces.
    // Una forma es clonar el nodo y reemplazarlo, o usar una bandera.
    const newRepuestoForm = repuestoForm.cloneNode(true);
    repuestoForm.parentNode.replaceChild(newRepuestoForm, repuestoForm);

    newRepuestoForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const user = getCurrentUser(); // auth.js
        if (user && user.role === 'visualizador') {
            mostrarAlerta("Acción no permitida.", "danger");
            const modalEl = document.getElementById('repuesto-modal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            return;
        }
        
        const repuestoId = document.getElementById('repuesto-id').value;
        const sku = document.getElementById('repuesto-sku').value.trim();
        const nombre = document.getElementById('repuesto-nombre').value.trim();
        const categoria = document.getElementById('repuesto-categoria').value.trim();
        const stock = parseInt(document.getElementById('repuesto-stock').value) || 0;

        if (!sku || !nombre) {
            mostrarAlerta('SKU y Nombre son requeridos.', 'warning');
            return;
        }

        const repuestoData = { sku, nombre, categoria, stock };
        let operationSuccess = false;

        try {
            if (!window.repuestosModule) throw new Error("Módulo de repuestos no disponible.");

            if (repuestoId) { // Actualizar
                repuestoData.id = repuestoId;
                if (typeof window.repuestosModule.actualizarRepuesto !== 'function') throw new Error("actualizarRepuesto no disponible");
                await window.repuestosModule.actualizarRepuesto(repuestoData);
                mostrarAlerta('Repuesto actualizado con éxito.', 'success');
                operationSuccess = true;
            } else { // Crear
                if (typeof window.repuestosModule.buscarRepuestoPorSku !== 'function') throw new Error("buscarRepuestoPorSku no disponible");
                if (window.repuestosModule.buscarRepuestoPorSku(sku)) {
                    mostrarAlerta('El SKU ya existe. No se puede crear el repuesto.', 'danger');
                    return; // No cerrar modal, permitir corrección
                }
                if (typeof window.repuestosModule.agregarRepuesto !== 'function') throw new Error("agregarRepuesto no disponible");
                // ID se genera dentro de agregarRepuesto en el módulo repuestos.js si es necesario
                await window.repuestosModule.agregarRepuesto(repuestoData);
                mostrarAlerta('Repuesto agregado con éxito.', 'success');
                operationSuccess = true;
            }

            if (operationSuccess) {
                if (typeof cargarTablaRepuestos === 'function') cargarTablaRepuestos();
                const modalEl = document.getElementById('repuesto-modal');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }
            }
        } catch (error) {
            console.error("Error guardando repuesto:", error);
            mostrarAlerta(`Error guardando repuesto: ${error.message}`, 'danger');
        }
    });
}

// (Estilos CSS para carga masiva y otras funciones auxiliares se asume que están en sus respectivos lugares o utils.js)
