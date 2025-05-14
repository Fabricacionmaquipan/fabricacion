// =====================================================
// ARCHIVO UNIFICADO: ADMIN + ADMIN-PRODUCTOS + ADMIN-REPUESTOS
// =====================================================

// =====================================================
// SECCIÓN 1: VARIABLES Y CONFIGURACIÓN GENERAL
// =====================================================

// Elementos DOM compartidos
const tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');

// Variables para módulo principal de Admin
let currentPageAdmin = 1;
let filterTermAdmin = '';
let filterStatusAdmin = 'all';

// Variables para módulo de Productos
let tablaProductos;
let currentPageProductos = 1;
let filterTermProductos = '';

// Variables para módulo de Repuestos
let tablaRepuestos;
let currentPageRepuestos = 1;
let filterTermRepuestos = '';

// =====================================================
// SECCIÓN 2: FUNCIONES PRINCIPALES DE ADMINISTRACIÓN
// =====================================================

// Configurar event listeners específicos de admin
function setupAdminListeners() {
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#admin-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Filtrar según el valor seleccionado
                const filterText = item.textContent.trim().toLowerCase();
                switch (filterText) {
                    case 'pendientes':
                        filterStatusAdmin = 'pendientes';
                        break;
                    case 'en fabricación':
                        filterStatusAdmin = 'fabricacion';
                        break;
                    case 'entregadas':
                        filterStatusAdmin = 'entregadas';
                        break;
                    default:
                        filterStatusAdmin = 'all';
                }
                
                // Actualizar texto del botón de filtro
                const filterButton = document.querySelector('#admin-panel .dropdown-toggle');
                if (filterButton) {
                    filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${item.textContent.trim()}`;
                }
                
                currentPageAdmin = 1; // Reiniciar a primera página al filtrar
                cargarDatosAdmin();
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#admin-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTermAdmin = e.target.value.toLowerCase();
            currentPageAdmin = 1; // Reiniciar a primera página al buscar
            cargarDatosAdmin();
        });
    }
    
    // Botones de exportación y estadísticas (ya existentes)
    const exportBtn = document.querySelector('#admin-panel .btn-outline-info');
    if (exportBtn && typeof exportarSolicitudesCSV === 'function') {
        exportBtn.addEventListener('click', exportarSolicitudesCSV);
    }
    
    const statsBtn = document.querySelector('#admin-panel .btn-outline-success');
    if (statsBtn && typeof generarEstadisticas === 'function') {
        statsBtn.addEventListener('click', generarEstadisticas);
    }
    
    // Configurar listeners para botones en la tabla
    setupAdminButtonListeners();
    
    // Configurar listener para el botón de confirmar eliminación
    const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
    if (confirmarEliminacionBtn) {
        confirmarEliminacionBtn.addEventListener('click', eliminarSolicitud);
    }
}

// Asegurar que los botones funcionan en admin
function setupAdminButtonListeners() {
    // Delegar eventos para los botones en la tabla
    const tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');
    if (tablaSolicitudesAdmin) {
        tablaSolicitudesAdmin.addEventListener('click', (e) => {
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
                return;
            }
            
            // Detectar botón de eliminar
            if (e.target.classList.contains('btn-eliminar')) {
                targetButton = e.target;
            } else if (e.target.closest('.btn-eliminar')) {
                targetButton = e.target.closest('.btn-eliminar');
            }
            
            if (targetButton) {
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

// Mostrar modal de confirmación de eliminación
function showConfirmarEliminacionModal(solicitudId, notaVenta) {
    console.log("Mostrando modal de confirmación de eliminación para ID:", solicitudId);
    
    // Limpiar cualquier modal o backdrop existente
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Establecer los valores en el modal
    document.getElementById('eliminar-solicitud-id').value = solicitudId;
    document.getElementById('eliminar-nota-venta').textContent = notaVenta || solicitudId;
    
    // Asegurarse de que no hay una instancia previa del modal
    const confirmarModal = document.getElementById('confirmar-eliminacion-modal');
    let modalInstance = bootstrap.Modal.getInstance(confirmarModal);
    if (modalInstance) {
        modalInstance.dispose();
    }
    
    // Inicializar y mostrar el modal
    modalInstance = new bootstrap.Modal(confirmarModal, {
        backdrop: true,
        keyboard: true
    });
    
    // Agregar evento para limpiar correctamente al cerrar
    confirmarModal.addEventListener('hidden.bs.modal', function() {
        // Limpiar cualquier backdrop que haya quedado
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

// Función para eliminar una solicitud
function eliminarSolicitud() {
    const solicitudId = document.getElementById('eliminar-solicitud-id').value;
    
    if (!solicitudId) {
        mostrarAlerta('Error: No se pudo identificar la solicitud a eliminar', 'danger');
        return;
    }
    
    // Mostrar indicador de carga
    mostrarSincronizacion('Eliminando solicitud...');
    
    // Eliminar de Firebase
    solicitudesRef.child(solicitudId).remove()
        .then(() => {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmar-eliminacion-modal'));
            if (modal) {
                modal.hide();
                
                // Limpiar backdrop manualmente
                setTimeout(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 300);
            }
            
            // Mostrar mensaje de éxito
            mostrarAlerta('Solicitud eliminada correctamente', 'success');
            
            // Recargar los datos
            currentPageAdmin = 1; // Volver a la primera página
            setTimeout(() => {
                cargarDatosAdmin();
            }, 500);
            
            ocultarSincronizacion();
        })
        .catch(error => {
            console.error('Error al eliminar solicitud:', error);
            mostrarAlerta('Error al eliminar la solicitud: ' + error.message, 'danger');
            ocultarSincronizacion();
        });
}

// Cargar datos para el panel de Admin
function cargarDatosAdmin() {
    if (!tablaSolicitudesAdmin) return;
    
    tablaSolicitudesAdmin.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay solicitudes en el sistema</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Ocultar paginación
        updateAdminPagination(0);
        return;
    }
    
    // Paginar y filtrar solicitudes
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes, 
        currentPageAdmin,
        filterTermAdmin,
        filterStatusAdmin
    );
    
    // Actualizar paginación
    updateAdminPagination(totalItems);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
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
        const detalleProductos = solicitud.items.map(item => 
            `<div><strong>${item.producto}:</strong> ${item.cantidad}</div>`
        ).join('');
        
        // Crear ID corto para mejor visualización
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Fecha">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Detalle">${detalleProductos}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
            </td>
            <td data-label="Observaciones">${solicitud.observaciones || '<span class="text-muted">Sin observaciones</span>'}</td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                        <i class="fas fa-eye me-1"></i>Ver
                    </button>
                    <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}">
                        <i class="fas fa-edit me-1"></i>Editar
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${solicitud.id}" data-nota="${solicitud.notaVenta}">
                        <i class="fas fa-trash-alt me-1"></i>Eliminar
                    </button>
                </div>
            </td>
        `;
        
        tablaSolicitudesAdmin.appendChild(tr);
    });
}

// Actualizar controles de paginación para admin
function updateAdminPagination(totalItems) {
    createPaginationControls(
        '#admin-panel .card-footer',
        totalItems,
        currentPageAdmin,
        handlePageChange,
        'admin'
    );
}

// Manejar cambio de página
function handlePageChange(newPage, panelName) {
    if (panelName === 'admin') {
        currentPageAdmin = newPage;
        cargarDatosAdmin();
    } else if (panelName === 'productos') {
        currentPageProductos = newPage;
        cargarTablaProductos();
    } else if (panelName === 'repuestos') {
        currentPageRepuestos = newPage;
        cargarTablaRepuestos();
    }
}

// Exportar solicitudes a CSV 
function exportarSolicitudesCSV() {
    if (solicitudes.length === 0) {
        mostrarAlerta('No hay solicitudes para exportar', 'warning');
        return;
    }
    
    // Crear cabeceras del CSV
    let csvContent = 'ID,Nota Venta,Fecha,Estado,Observaciones,Productos\n';
    
    // Añadir filas de datos
    solicitudes.forEach(solicitud => {
        const productos = solicitud.items.map(item => `${item.producto} (${item.cantidad})`).join(' | ');
        
        // Escapar comillas y otros caracteres problemáticos
        const escaparCSV = (texto) => {
            if (!texto) return '';
            return `"${texto.replace(/"/g, '""')}"`;
        };
        
        const fila = [
            solicitud.id,
            escaparCSV(solicitud.notaVenta),
            solicitud.fechaSolicitud,
            escaparCSV(solicitud.estado),
            escaparCSV(solicitud.observaciones || ''),
            escaparCSV(productos)
        ].join(',');
        
        csvContent += fila + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solicitudes_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('Solicitudes exportadas correctamente', 'success');
}

// Función para generar estadísticas
function generarEstadisticas() {
    if (solicitudes.length === 0) {
        mostrarAlerta('No hay datos para generar estadísticas', 'warning');
        return;
    }
    
    // Contar solicitudes por estado
    const estadosCounts = solicitudes.reduce((acc, sol) => {
        acc[sol.estado] = (acc[sol.estado] || 0) + 1;
        return acc;
    }, {});
    
    // Productos más solicitados
    const productosCounts = {};
    solicitudes.forEach(sol => {
        sol.items.forEach(item => {
            const producto = item.producto;
            productosCounts[producto] = (productosCounts[producto] || 0) + parseInt(item.cantidad);
        });
    });
    
    // Ordenar productos por cantidad
    const productosOrdenados = Object.entries(productosCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    
    // Solicitudes por mes
    const solicitudesPorMes = solicitudes.reduce((acc, sol) => {
        const fecha = new Date(sol.fechaSolicitud);
        const mes = fecha.toLocaleString('default', { month: 'long' });
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
    }, {});
    
    // Mostrar estadísticas en un modal
    let estadisticasHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0">Solicitudes por Estado</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${Object.entries(estadosCounts).map(([estado, count]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${estado}
                                    <span class="badge bg-primary rounded-pill">${count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0">Productos más Solicitados</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${productosOrdenados.map(([producto, cantidad]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${producto}
                                    <span class="badge bg-info rounded-pill">${cantidad}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Solicitudes por Mes</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${Object.entries(solicitudesPorMes).map(([mes, count]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${mes}
                                    <span class="badge bg-success rounded-pill">${count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Crear y mostrar el modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    modalContainer.id = 'estadisticasModal';
    modalContainer.setAttribute('tabindex', '-1');
    
    modalContainer.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-chart-bar me-2"></i>Estadísticas del Sistema</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${estadisticasHTML}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="exportarEstadisticas()">
                        <i class="fas fa-download me-1"></i>Exportar
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Limpiar cualquier modal o backdrop existente
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Asegurarse de que no hay una instancia previa del modal
    let modalInstance = bootstrap.Modal.getInstance(modalContainer);
    if (modalInstance) {
        modalInstance.dispose();
    }
    
    modalInstance = new bootstrap.Modal(modalContainer);
    
    // Agregar evento para limpiar correctamente al cerrar
    modalContainer.addEventListener('hidden.bs.modal', function() {
        // Limpiar cualquier backdrop que haya quedado
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Eliminar el modal del DOM después de cerrarse
        setTimeout(() => {
            document.body.removeChild(modalContainer);
            delete window.exportarEstadisticas;
        }, 300);
    }, { once: true });
    
    modalInstance.show();
    
    // Función para exportar estadísticas
    window.exportarEstadisticas = function() {
        const contenido = `
            ESTADÍSTICAS DEL SISTEMA DE SOLICITUDES
            Fecha de generación: ${new Date().toLocaleString()}
            
            SOLICITUDES POR ESTADO:
            ${Object.entries(estadosCounts).map(([estado, count]) => `${estado}: ${count}`).join('\n')}
            
            PRODUCTOS MÁS SOLICITADOS:
            ${productosOrdenados.map(([producto, cantidad]) => `${producto}: ${cantidad}`).join('\n')}
            
            SOLICITUDES POR MES:
            ${Object.entries(solicitudesPorMes).map(([mes, count]) => `${mes}: ${count}`).join('\n')}
        `;
        
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'estadisticas_solicitudes.txt';
        link.click();
        
        URL.revokeObjectURL(url);
        
        mostrarAlerta('Estadísticas exportadas correctamente', 'success');
    };
}

// =====================================================
// SECCIÓN 3: FUNCIONES DE ADMINISTRACIÓN DE PRODUCTOS
// =====================================================

// Inicializar módulo de admin-productos
function initAdminProductos() {
    console.log("Inicializando panel de administración de productos...");
    tablaProductos = document.getElementById('tabla-productos');
    setupProductosListeners();
    console.log("Panel de administración de productos inicializado");
}

// Cargar tabla de productos
function cargarTablaProductos() {
    if (!tablaProductos || !window.productosModule) return;
    
    // Obtener productos
    const productosLista = window.productosModule.getProductos();
    
    // Filtrar productos
    let productosFiltrados = productosLista;
    if (filterTermProductos) {
        productosFiltrados = productosLista.filter(p => 
            (p.sku && p.sku.toLowerCase().includes(filterTermProductos)) ||
            (p.nombre && p.nombre.toLowerCase().includes(filterTermProductos)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(filterTermProductos))
        );
    }
    
    // Paginar productos
    const ITEMS_PER_PAGE = 10;
    const startIndex = (currentPageProductos - 1) * ITEMS_PER_PAGE;
    const productosPaginados = productosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalItems = productosFiltrados.length;
    
    // Limpiar tabla
    tablaProductos.innerHTML = '';
    
    // Verificar si hay productos
    if (productosPaginados.length === 0) {
        tablaProductos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-box-open text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay productos disponibles</p>
                        ${filterTermProductos ? '<small class="text-muted">Intenta con otra búsqueda</small>' : ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Mostrar productos
    productosPaginados.forEach(producto => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td data-label="SKU">${producto.sku}</td>
            <td data-label="Nombre">${producto.nombre}</td>
            <td data-label="Descripción">${producto.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-warning btn-editar-producto" data-id="${producto.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar-producto" data-id="${producto.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tablaProductos.appendChild(tr);
    });
    
    // Actualizar paginación
    createPaginationControls(
        '#productos-content .card-footer',
        totalItems,
        currentPageProductos,
        handlePageChange,
        'productos'
    );
}

// Configurar listeners para productos
function setupProductosListeners() {
    // Implementar según sea necesario
    console.log("Listeners de productos configurados");
}

// =====================================================
// SECCIÓN 4: FUNCIONES DE ADMINISTRACIÓN DE REPUESTOS
// =====================================================

// Inicializar módulo de admin-repuestos
function initAdminRepuestos() {
    console.log("Inicializando panel de administración de repuestos...");
    
    // Verificar que el módulo de repuestos esté disponible
    if (!window.repuestosModule) {
        console.error("Módulo de repuestos no disponible. La administración de repuestos no funcionará correctamente.");
        return;
    }
    
    // Añadir pestaña de repuestos al panel de administración
    agregarPestañaRepuestos();
    
    // Configurar listeners
    setupRepuestosListeners();
    
    console.log("Panel de administración de repuestos inicializado");
}

// Añadir pestaña de repuestos al panel de admin
function agregarPestañaRepuestos() {
    console.log("Agregando pestaña de repuestos al panel de administración...");
    
    // Obtener el contenedor de pestañas
    const adminTabs = document.getElementById('adminTabs');
    const adminTabContent = document.getElementById('adminTabContent');
    
    if (!adminTabs || !adminTabContent) {
        console.error("No se encontraron los contenedores de pestañas de administración");
        return;
    }
    
    // Añadir pestaña de repuestos
    const repuestosTab = document.createElement('li');
    repuestosTab.className = 'nav-item';
    repuestosTab.setAttribute('role', 'presentation');
    repuestosTab.innerHTML = `
        <button class="nav-link" id="repuestos-tab" data-bs-toggle="tab" data-bs-target="#repuestos-content" 
                type="button" role="tab" aria-controls="repuestos-content" aria-selected="false">
            <i class="fas fa-tools me-1"></i> Repuestos
        </button>
    `;
    
    // Insertar después de la pestaña de usuarios
    const usuariosTab = document.getElementById('usuarios-tab');
    if (usuariosTab) {
        adminTabs.insertBefore(repuestosTab, usuariosTab.parentNode.nextSibling);
    } else {
        adminTabs.appendChild(repuestosTab);
    }
    
    // Añadir contenido de la pestaña
    const repuestosContent = document.createElement('div');
    repuestosContent.className = 'tab-pane fade';
    repuestosContent.id = 'repuestos-content';
    repuestosContent.setAttribute('role', 'tabpanel');
    repuestosContent.setAttribute('aria-labelledby', 'repuestos-tab');
    
    repuestosContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-tools me-2"></i>Gestión de Repuestos</h5>
                    <div class="d-flex gap-2">
                        <div class="input-group input-group-sm" style="width: 200px;">
                            <input type="text" class="form-control" placeholder="Buscar..." id="buscar-repuesto">
                            <button class="btn btn-outline-secondary" type="button">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                        <button class="btn btn-sm btn-primary" id="btn-nuevo-repuesto">
                            <i class="fas fa-plus me-1"></i> Nuevo Repuesto
                        </button>
                        <button class="btn btn-sm btn-outline-primary" id="btn-importar-repuestos">
                            <i class="fas fa-file-import me-1"></i> Importar
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" id="btn-exportar-repuestos">
                            <i class="fas fa-file-export me-1"></i> Exportar
                        </button>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-repuestos">
                        <!-- Se llenará con JavaScript -->
                    </tbody>
                </table>
            </div>
            <div class="card-footer p-2">
                <!-- Aquí se insertarán los controles de paginación -->
            </div>
        </div>
    `;
    
    adminTabContent.appendChild(repuestosContent);
    
    // Actualizar referencia a la tabla de repuestos
    tablaRepuestos = document.getElementById('tabla-repuestos');
