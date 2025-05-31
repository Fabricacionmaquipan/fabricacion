// =====================================================
// ARCHIVO UNIFICADO: ADMIN + ADMIN-PRODUCTOS + ADMIN-REPUESTOS
// =====================================================

// Variables globales para el módulo Admin (declaradas con let para evitar redeclaraciones si este script se carga múltiples veces en algunos entornos de desarrollo, aunque no debería)
let tablaSolicitudesAdmin;
let currentPageAdmin = 1;
const ITEMS_PER_PAGE_ADMIN = 10;
let filterTermAdmin = '';
let filterStatusAdmin = 'all';

let tablaRepuestos;
let currentPageRepuestos = 1;
const ITEMS_PER_PAGE_REPUESTOS = 10;
let filterTermRepuestos = '';

// (Variables para Productos si se reintegran)
// let tablaProductos;
// let currentPageProductos = 1;
// let filterTermProductos = '';

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
    
    const searchInputAdminSolicitudes = document.querySelector('#admin-panel #solicitudes-content .input-group input[type="text"]'); // Más específico
    if (searchInputAdminSolicitudes) {
        searchInputAdminSolicitudes.addEventListener('input', (e) => {
            filterTermAdmin = e.target.value.toLowerCase();
            currentPageAdmin = 1; 
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
        });
    }
    
    setupAdminButtonListeners(); 
    
    const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
    if (confirmarEliminacionBtn) {
        confirmarEliminacionBtn.addEventListener('click', () => {
            const user = getCurrentUser(); 
            if (user && user.role === 'visualizador') {
                mostrarAlerta('No tienes permisos para eliminar solicitudes.', 'danger');
                const modalEl = document.getElementById('confirmar-eliminacion-modal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                return;
            }
            eliminarSolicitudConfirmado(); 
        });
    }

    // Listeners para la pestaña de usuarios (delegación)
    const tablaUsuariosEl = document.getElementById('tabla-usuarios');
    if (tablaUsuariosEl) {
        tablaUsuariosEl.addEventListener('click', (e) => {
            const user = getCurrentUser(); 
            if (user && user.role === 'visualizador') return; 

            const editButton = e.target.closest('.btn-editar-usuario'); 
            const deleteButton = e.target.closest('.btn-eliminar-usuario'); 

            if (editButton) {
                const userId = editButton.dataset.id;
                console.log("Editar usuario (admin.js):", userId);
                // Aquí iría la lógica para abrir el modal de edición de usuario
                // if (typeof window.userManagement !== 'undefined' && typeof window.userManagement.abrirModalEditarUsuario === 'function') {
                //     window.userManagement.abrirModalEditarUsuario(userId);
                // }
            }
            if (deleteButton) {
                const userId = deleteButton.dataset.id;
                console.log("Eliminar usuario (admin.js):", userId);
                // Aquí iría la lógica para confirmar y eliminar usuario
                // if (typeof window.userManagement !== 'undefined' && typeof window.userManagement.confirmarEliminarUsuario === 'function') {
                //     window.userManagement.confirmarEliminarUsuario(userId);
                // }
            }
        });
    }
}

function setupAdminButtonListeners() {
    const tablaSolicitudesAdminElem = document.getElementById('tabla-solicitudes-admin');
    if (tablaSolicitudesAdminElem) {
        tablaSolicitudesAdminElem.addEventListener('click', (e) => {
            let targetButton = null;
            const user = getCurrentUser(); 

            if (e.target.classList.contains('btn-detalle') || e.target.closest('.btn-detalle')) {
                targetButton = e.target.classList.contains('btn-detalle') ? e.target : e.target.closest('.btn-detalle');
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                }
            } 
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
            if (targetButton) e.stopPropagation();
        });
    }
}

function showConfirmarEliminacionModal(solicitudId, notaVenta) {
    const user = getCurrentUser(); 
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

function eliminarSolicitudConfirmado() {
    const solicitudId = document.getElementById('eliminar-solicitud-id').value;
    if (!solicitudId) {
        mostrarAlerta('Error: No se pudo identificar la solicitud a eliminar.', 'danger');
        return;
    }

    const user = getCurrentUser(); 
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para eliminar solicitudes.', 'danger');
        return;
    }

    mostrarSincronizacion('Eliminando solicitud...');
    
    const refSolicitudes = (typeof firebase !== 'undefined' && firebase.database) ? firebase.database().ref('solicitudes') : null;

    if (refSolicitudes) {
         refSolicitudes.child(solicitudId).remove()
        .then(() => handleEliminacionExitosa(solicitudId))
        .catch(error => handleEliminacionError(error));
    } else {
        handleEliminacionError({ message: "Referencia a Firebase (solicitudesRef) no disponible." });
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

    let itemsFiltrados = solicitudes; 
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
            return true; // si filterStatusAdmin es 'all' u otro valor no manejado, no filtrar por estado
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

    const user = getCurrentUser(); 
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
            window.handlePageChange, 
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
    const user = getCurrentUser(); 
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
        const commonData = `"${sol.id || ''}","${sol.notaVenta || ''}","${sol.cliente || ''}","${sol.local || ''}","${sol.fechaSolicitud || ''}","${sol.estado || ''}","${(sol.observaciones || '').replace(/"/g, '""')}"`;
        if (sol.items && sol.items.length > 0) {
            sol.items.forEach(item => {
                csvContent += `${commonData},"${item.sku || ''}","${item.producto || ''}","${item.cantidad || 0}"\n`;
            });
        } else {
            csvContent += `${commonData},,,, \n`; 
        }
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Añadir BOM para Excel
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
    const user = getCurrentUser(); 
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para generar estadísticas.', 'danger');
        return;
    }
    if (typeof solicitudes === 'undefined' || solicitudes.length === 0) {
        mostrarAlerta('No hay datos para generar estadísticas.', 'info');
        return;
    }
    const stats = solicitudes.reduce((acc, sol) => {
        acc[sol.estado] = (acc[sol.estado] || 0) + 1;
        return acc;
    }, {});

    alert("Estadísticas de Solicitudes:\n" + JSON.stringify(stats, null, 2));
}

function initAdminRepuestos() {
    tablaRepuestos = document.getElementById('tabla-repuestos');
    if (!tablaRepuestos) {
        console.warn("Elemento tabla-repuestos no encontrado.");
    }

    const user = getCurrentUser(); 
    const esVisualizador = user && user.role === 'visualizador';

    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    const btnCargaMasiva = document.getElementById('btn-carga-masiva');

    // Ocultar botones si es visualizador Y la pestaña de repuestos estuviera visible para él
    // (configureAppForRole en app.js ya oculta la pestaña completa para el visualizador en la configuración actual)
    if (esVisualizador) {
        if (btnNuevoRepuesto) btnNuevoRepuesto.style.display = 'none';
        if (btnCargaMasiva) btnCargaMasiva.style.display = 'none';
    } else {
        if (btnNuevoRepuesto) btnNuevoRepuesto.style.display = ''; 
        if (btnCargaMasiva) btnCargaMasiva.style.display = '';   
    }

    if (!window.repuestosModule) {
        console.error("Módulo de repuestos (window.repuestosModule) no disponible.");
    }
    
    setupRepuestosListeners(); 
    
    if (typeof cargarTablaRepuestos === "function") {
        cargarTablaRepuestos(); 
    }
}

function setupRepuestosListeners() {
    const user = getCurrentUser(); 
    const esVisualizador = user && user.role === 'visualizador';

    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    if (btnNuevoRepuesto) {
        if (esVisualizador) {
            btnNuevoRepuesto.style.display = 'none';
        } else {
            btnNuevoRepuesto.style.display = '';
            const newBtnNuevoRepuesto = btnNuevoRepuesto.cloneNode(true); // Clonar para limpiar listeners viejos
            btnNuevoRepuesto.parentNode.replaceChild(newBtnNuevoRepuesto, btnNuevoRepuesto);
            newBtnNuevoRepuesto.addEventListener('click', () => {
                if (window.adminRepuestos && typeof window.adminRepuestos.mostrarModalRepuesto === 'function') {
                    window.adminRepuestos.mostrarModalRepuesto(); 
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
            const newBtnCargaMasiva = btnCargaMasiva.cloneNode(true);
            btnCargaMasiva.parentNode.replaceChild(newBtnCargaMasiva, btnCargaMasiva);
            newBtnCargaMasiva.addEventListener('click', importarRepuestosCSV);
        }
    }

    const buscarRepuestoInput = document.getElementById('buscar-repuesto');
    if (buscarRepuestoInput) {
        if (!buscarRepuestoInput.dataset.listenerAttachedRep) { // Evitar duplicar listener
            buscarRepuestoInput.addEventListener('input', (e) => {
                filterTermRepuestos = e.target.value.toLowerCase();
                currentPageRepuestos = 1;
                if (typeof cargarTablaRepuestos === "function") {
                    cargarTablaRepuestos();
                }
            });
            buscarRepuestoInput.dataset.listenerAttachedRep = 'true';
        }
    }

    if (tablaRepuestos) {
        // Usar un clon para limpiar listeners si setupRepuestosListeners se llama múltiples veces.
        // O añadir un listener una sola vez.
        // Por ahora, asumimos que el listener se añade una vez o no causa problemas.
        tablaRepuestos.addEventListener('click', (e) => {
            if (esVisualizador) return; 

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
    const todosLosRepuestos = window.repuestosModule.getRepuestos(); 

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
        const user = getCurrentUser(); 
        const userRole = user ? user.role : '';

        repuestosPaginados.forEach(repuesto => {
            const tr = document.createElement('tr');
            let accionesRepuestoHTML = '<span class="text-muted small">Sin acciones</span>'; 
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

function updateRepuestosPagination(totalItems) {
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#repuestos-content .card-footer #repuestos-pagination', 
            totalItems,
            currentPageRepuestos,
            window.handlePageChange, 
            'admin_repuestos', 
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

function importarRepuestosCSV() {
    const user = getCurrentUser(); 
    if (user && user.role === 'visualizador') {
        mostrarAlerta('No tienes permisos para importar repuestos.', 'danger');
        return;
    }
    if (typeof mostrarModalImportarRepuestos === 'function') { // Asumiendo que esta función existe
        mostrarModalImportarRepuestos();
    } else {
        console.error("mostrarModalImportarRepuestos no está definida.");
        mostrarAlerta("Función de importación no disponible.", "warning");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin'); // Asignar aquí
    
    if (document.getElementById('admin-panel')) {
      setupAdminListeners(); 
    }
    
    // Inicialización de Pestañas del Admin (ej. Repuestos) se maneja con el evento 'shown.bs.tab'
    const adminTabs = document.querySelectorAll('#adminTabs .nav-link');
    adminTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('data-bs-target');
            const user = getCurrentUser(); 

            if (user && user.role === 'visualizador' && targetTabId !== '#solicitudes-content') {
                console.warn("Visualizador intentó cambiar a una pestaña no permitida (ya debería estar oculta):", targetTabId);
                return; 
            }

            if (targetTabId === '#solicitudes-content' && typeof cargarDatosAdmin === 'function') {
                cargarDatosAdmin(); 
            } else if (targetTabId === '#repuestos-content') {
                // Solo inicializar si la pestaña es visible (controlado por configureAppForRole)
                // y el rol no es visualizador (o si visualizador tuviera permiso de ver repuestos)
                const repuestosTabItem = document.getElementById('repuestos-tab-item');
                if (repuestosTabItem && repuestosTabItem.style.display !== 'none') {
                    if (typeof initAdminRepuestos === 'function') initAdminRepuestos(); 
                }
            } else if (targetTabId === '#usuarios-content') {
                const usuariosTabItem = document.getElementById('usuarios-tab-item');
                 if (usuariosTabItem && usuariosTabItem.style.display !== 'none') {
                    // if (typeof cargarTablaUsuarios === 'function') cargarTablaUsuarios(); 
                    console.log("Pestaña Usuarios activada. Implementar carga de datos si es necesario.");
                 }
            }
            // Implementar lógica para otras pestañas: dashboard, reportes, auditoria
            // asegurándose de que se inicialicen solo si son visibles para el rol actual.
        });
    });

    // Configuración del formulario de repuestos (asegurarse que se hace una vez)
    const formRepuesto = document.getElementById('repuesto-form');
    if (formRepuesto && !formRepuesto.dataset.listenerAttached) { // Evitar duplicar listener
        formRepuesto.addEventListener('submit', async function(event) {
            event.preventDefault();
            const user = getCurrentUser(); 
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

                if (repuestoId) { 
                    repuestoData.id = repuestoId;
                    if (typeof window.repuestosModule.actualizarRepuesto !== 'function') throw new Error("actualizarRepuesto no disponible");
                    await window.repuestosModule.actualizarRepuesto(repuestoData);
                    mostrarAlerta('Repuesto actualizado con éxito.', 'success');
                    operationSuccess = true;
                } else { 
                    if (typeof window.repuestosModule.buscarRepuestoPorSku !== 'function') throw new Error("buscarRepuestoPorSku no disponible");
                    if (window.repuestosModule.buscarRepuestoPorSku(sku)) {
                        mostrarAlerta('El SKU ya existe. No se puede crear el repuesto.', 'danger');
                        return; 
                    }
                    if (typeof window.repuestosModule.agregarRepuesto !== 'function') throw new Error("agregarRepuesto no disponible");
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
        formRepuesto.dataset.listenerAttached = 'true';
    }
});

// Exponer funciones/objetos al ámbito global
window.showConfirmarEliminacionModal = showConfirmarEliminacionModal;
window.cargarDatosAdmin = cargarDatosAdmin; 
window.exportarSolicitudesCSV = exportarSolicitudesCSV;
window.generarEstadisticas = generarEstadisticas;

window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos,
    mostrarModalRepuesto: function(repuestoId) {
        const user = getCurrentUser(); 
        if (user && user.role === 'visualizador') {
            mostrarAlerta("Acción no permitida.", "danger"); return;
        }
        
        const modalEl = document.getElementById('repuesto-modal');
        if (!modalEl) { console.error("Modal 'repuesto-modal' no encontrado."); return; }

        const modalTitle = modalEl.querySelector('.modal-title');
        const form = document.getElementById('repuesto-form');
        const repuestoIdEl = document.getElementById('repuesto-id');
        const repuestoSkuEl = document.getElementById('repuesto-sku');
        const repuestoNombreEl = document.getElementById('repuesto-nombre');
        const repuestoCategoriaEl = document.getElementById('repuesto-categoria');
        const repuestoStockEl = document.getElementById('repuesto-stock');

        if(form) form.reset();
        if(repuestoIdEl) repuestoIdEl.value = '';
        if(repuestoSkuEl) repuestoSkuEl.readOnly = false;

        if (repuestoId && window.repuestosModule && typeof window.repuestosModule.getRepuestoById === 'function') {
            const repuesto = window.repuestosModule.getRepuestoById(repuestoId);
            if (repuesto) {
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Repuesto';
                if(repuestoIdEl) repuestoIdEl.value = repuesto.id;
                if(repuestoSkuEl) repuestoSkuEl.value = repuesto.sku;
                if(repuestoNombreEl) repuestoNombreEl.value = repuesto.nombre;
                if(repuestoCategoriaEl) repuestoCategoriaEl.value = repuesto.categoria;
                if(repuestoStockEl) repuestoStockEl.value = repuesto.stock;
                if(repuestoSkuEl) repuestoSkuEl.readOnly = true; 
            } else { 
                if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto (ID no encontrado)';
            }
        } else { 
            if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto';
        }

        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.dispose(); 
        modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    },
    eliminarRepuesto: function(repuestoId) {
        const user = getCurrentUser(); 
        if (user && user.role === 'visualizador') {
            mostrarAlerta("Acción no permitida.", "danger"); return;
        }
        
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
    },
    importarRepuestosCSV 
};
