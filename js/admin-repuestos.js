// admin-repuestos.js - Gestión de repuestos en el panel de administración

// Variables y elementos del DOM
let tablaRepuestos;
let currentPageRepuestos = 1;
let filterTermRepuestos = '';

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
}

// Configurar event listeners para la gestión de repuestos
function setupRepuestosListeners() {
    console.log("Configurando event listeners para gestión de repuestos...");
    
    // Botón para añadir nuevo repuesto
    const btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    if (btnNuevoRepuesto) {
        btnNuevoRepuesto.addEventListener('click', function() {
            mostrarModalRepuesto();
        });
    }
    
    // Búsqueda de repuestos
    const buscarRepuestoInput = document.getElementById('buscar-repuesto');
    if (buscarRepuestoInput) {
        buscarRepuestoInput.addEventListener('input', function(e) {
            filterTermRepuestos = e.target.value.toLowerCase();
            currentPageRepuestos = 1; // Reiniciar a primera página al buscar
            cargarTablaRepuestos();
        });
    }
    
    // Botón para importar repuestos
    const btnImportarRepuestos = document.getElementById('btn-importar-repuestos');
    if (btnImportarRepuestos) {
        btnImportarRepuestos.addEventListener('click', function() {
            // Aquí iría la lógica para importar repuestos desde CSV
            mostrarAlerta('Funcionalidad de importación no implementada', 'info');
        });
    }
    
    // Botón para exportar repuestos
    const btnExportarRepuestos = document.getElementById('btn-exportar-repuestos');
    if (btnExportarRepuestos) {
        btnExportarRepuestos.addEventListener('click', function() {
            exportarRepuestosCSV();
        });
    }
    
    // Delegación de eventos para acciones en la tabla
    if (tablaRepuestos) {
        tablaRepuestos.addEventListener('click', function(e) {
            let targetButton = null;
            
            // Detectar botón de editar
            if (e.target.classList.contains('btn-editar-repuesto') || e.target.closest('.btn-editar-repuesto')) {
                targetButton = e.target.classList.contains('btn-editar-repuesto') ? e.target : e.target.closest('.btn-editar-repuesto');
                const repuestoId = targetButton.getAttribute('data-id');
                if (repuestoId) {
                    editarRepuesto(repuestoId);
                }
                e.stopPropagation();
                return;
            }
            
            // Detectar botón de eliminar
            if (e.target.classList.contains('btn-eliminar-repuesto') || e.target.closest('.btn-eliminar-repuesto')) {
                targetButton = e.target.classList.contains('btn-eliminar-repuesto') ? e.target : e.target.closest('.btn-eliminar-repuesto');
                const repuestoId = targetButton.getAttribute('data-id');
                if (repuestoId) {
                    confirmarEliminarRepuesto(repuestoId);
                }
                e.stopPropagation();
                return;
            }
        });
    }
    
    // Escuchar el evento de cambio de pestaña para cargar los datos
    document.querySelector('#repuestos-tab').addEventListener('shown.bs.tab', function() {
        cargarTablaRepuestos();
    });
}

// Cargar tabla de repuestos con paginación y filtrado
function cargarTablaRepuestos() {
    if (!tablaRepuestos || !window.repuestosModule) return;
    
    // Obtener repuestos
    const repuestosLista = window.repuestosModule.getRepuestos();
    
    // Filtrar repuestos
    let repuestosFiltrados = repuestosLista;
    if (filterTermRepuestos) {
        repuestosFiltrados = repuestosLista.filter(r => 
            (r.sku && r.sku.toLowerCase().includes(filterTermRepuestos)) ||
            (r.nombre && r.nombre.toLowerCase().includes(filterTermRepuestos)) ||
            (r.categoria && r.categoria.toLowerCase().includes(filterTermRepuestos))
        );
    }
    
    // Paginar repuestos
    const ITEMS_PER_PAGE = 10;
    const startIndex = (currentPageRepuestos - 1) * ITEMS_PER_PAGE;
    const repuestosPaginados = repuestosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalItems = repuestosFiltrados.length;
    
    // Limpiar tabla
    tablaRepuestos.innerHTML = '';
    
    // Verificar si hay repuestos
    if (repuestosPaginados.length === 0) {
        tablaRepuestos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-tools text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay repuestos disponibles</p>
                        ${filterTermRepuestos ? '<small class="text-muted">Intenta con otra búsqueda</small>' : ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Mostrar repuestos
    repuestosPaginados.forEach(repuesto => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td data-label="SKU">${repuesto.sku}</td>
            <td data-label="Nombre">${repuesto.nombre}</td>
            <td data-label="Categoría">${repuesto.categoria || '<span class="text-muted">Sin categoría</span>'}</td>
            <td data-label="Stock">
                <span class="badge ${repuesto.stock > 20 ? 'bg-success' : repuesto.stock > 5 ? 'bg-warning' : 'bg-danger'}">
                    ${repuesto.stock || 0}
                </span>
            </td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-warning btn-editar-repuesto" data-id="${repuesto.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar-repuesto" data-id="${repuesto.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tablaRepuestos.appendChild(tr);
    });
    
    // Actualizar paginación
    createPaginationControls(
        '#repuestos-content .card-footer',
        totalItems,
        currentPageRepuestos,
        handlePageChangeRepuestos,
        'repuestos'
    );
}

// Manejar cambio de página
function handlePageChangeRepuestos(newPage) {
    currentPageRepuestos = newPage;
    cargarTablaRepuestos();
}

// Mostrar modal para añadir/editar repuesto
function mostrarModalRepuesto(repuestoId = null) {
    console.log("Mostrando modal de repuesto:", repuestoId);
    
    // Verificar si el modal ya existe
    let repuestoModal = document.getElementById('repuesto-modal');
    
    // Si no existe, crearlo
    if (!repuestoModal) {
        // Crear el modal
        repuestoModal = document.createElement('div');
        repuestoModal.className = 'modal fade';
        repuestoModal.id = 'repuesto-modal';
        repuestoModal.setAttribute('tabindex', '-1');
        repuestoModal.setAttribute('aria-hidden', 'true');
        
        repuestoModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="repuesto-modal-title"><i class="fas fa-tools me-2"></i>Nuevo Repuesto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="repuesto-form">
                            <input type="hidden" id="repuesto-id">
                            <div class="mb-3">
                                <label for="repuesto-sku" class="form-label">SKU</label>
                                <input type="text" class="form-control" id="repuesto-sku" required>
                                <small class="form-text text-muted">Código único de identificación del repuesto</small>
                            </div>
                            <div class="mb-3">
                                <label for="repuesto-nombre" class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="repuesto-nombre" required>
                            </div>
                            <div class="mb-3">
                                <label for="repuesto-categoria" class="form-label">Categoría</label>
                                <select class="form-select" id="repuesto-categoria">
                                    <option value="">-- Seleccionar categoría --</option>
                                    <option value="Tornillos">Tornillos</option>
                                    <option value="Tuercas">Tuercas</option>
                                    <option value="Arandelas">Arandelas</option>
                                    <option value="Pasadores">Pasadores</option>
                                    <option value="Rodamientos">Rodamientos</option>
                                    <option value="Transmisión">Transmisión</option>
                                    <option value="Filtros">Filtros</option>
                                    <option value="Juntas">Juntas</option>
                                    <option value="Embrague">Embrague</option>
                                    <option value="Refrigeración">Refrigeración</option>
                                    <option value="Suspensión">Suspensión</option>
                                    <option value="Frenos">Frenos</option>
                                    <option value="Encendido">Encendido</option>
                                    <option value="Eléctrico">Eléctrico</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="repuesto-stock" class="form-label">Stock</label>
                                <input type="number" class="form-control" id="repuesto-stock" min="0" value="0">
                            </div>
                            <div class="text-end">
                                <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar Repuesto</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        document.body.appendChild(repuestoModal);
        
        // Configurar evento para el formulario
        document.getElementById('repuesto-form').addEventListener('submit', function(e) {
            e.preventDefault();
            guardarRepuesto();
        });
    }
    
    // Limpiar cualquier modal o backdrop existente
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Actualizar título del modal
    const modalTitle = document.getElementById('repuesto-modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = repuestoId ? 
            '<i class="fas fa-edit me-2"></i>Editar Repuesto' : 
            '<i class="fas fa-plus me-2"></i>Nuevo Repuesto';
    }
    
    // Limpiar formulario
    document.getElementById('repuesto-id').value = '';
    document.getElementById('repuesto-sku').value = '';
    document.getElementById('repuesto-nombre').value = '';
    document.getElementById('repuesto-categoria').value = '';
    document.getElementById('repuesto-stock').value = '0';
    
    // Si estamos editando, cargar datos del repuesto
    if (repuestoId && window.repuestosModule) {
        const repuesto = window.repuestosModule.getRepuestos().find(r => r.id === repuestoId);
        
        if (repuesto) {
            document.getElementById('repuesto-id').value = repuesto.id;
            document.getElementById('repuesto-sku').value = repuesto.sku;
            document.getElementById('repuesto-nombre').value = repuesto.nombre;
            document.getElementById('repuesto-categoria').value = repuesto.categoria || '';
            document.getElementById('repuesto-stock').value = repuesto.stock || 0;
        }
    }
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(repuestoModal);
    modal.show();
}

// Guardar repuesto (nuevo o edición)
async function guardarRepuesto() {
    try {
        const repuestoId = document.getElementById('repuesto-id').value;
        const sku = document.getElementById('repuesto-sku').value;
        const nombre = document.getElementById('repuesto-nombre').value;
        const categoria = document.getElementById('repuesto-categoria').value;
        const stock = parseInt(document.getElementById('repuesto-stock').value) || 0;
        
        if (!sku || !nombre) {
            mostrarAlerta('El SKU y el nombre son obligatorios', 'warning');
            return;
        }
        
        // Mostrar indicador de carga
        mostrarSincronizacion('Guardando repuesto...');
        
        // Crear objeto de repuesto
        const repuesto = {
            id: repuestoId || 'R' + Date.now().toString(36),
            sku: sku,
            nombre: nombre,
            categoria: categoria,
            stock: stock
        };
        
        // Guardar repuesto
        if (repuestoId) {
            // Editar existente
            await window.repuestosModule.actualizarRepuesto(repuesto);
            mostrarAlerta('Repuesto actualizado correctamente', 'success');
        } else {
            // Añadir nuevo
            await window.repuestosModule.agregarRepuesto(repuesto);
            mostrarAlerta('Repuesto creado correctamente', 'success');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('repuesto-modal'));
        modal.hide();
        
        // Recargar tabla
        cargarTablaRepuestos();
        
        // Ocultar indicador de carga
        ocultarSincronizacion();
        
    } catch (error) {
        console.error('Error al guardar repuesto:', error);
        mostrarAlerta('Error al guardar repuesto: ' + error.message, 'danger');
        ocultarSincronizacion();
    }
}

// Función para editar un repuesto
function editarRepuesto(repuestoId) {
    mostrarModalRepuesto(repuestoId);
}

// Función para confirmar eliminación de un repuesto
function confirmarEliminarRepuesto(repuestoId) {
    console.log("Solicitando confirmación para eliminar repuesto:", repuestoId);
    
    const repuesto = window.repuestosModule.getRepuestos().find(r => r.id === repuestoId);
    
    if (!repuesto) {
        mostrarAlerta('No se encontró el repuesto a eliminar', 'danger');
        return;
    }
    
    // Confirmar antes de eliminar
    if (confirm(`¿Estás seguro de eliminar el repuesto "${repuesto.nombre}" (${repuesto.sku})?`)) {
        eliminarRepuesto(repuestoId);
    }
}

// Función para eliminar un repuesto
async function eliminarRepuesto(repuestoId) {
    try {
        // Mostrar indicador de carga
        mostrarSincronizacion('Eliminando repuesto...');
        
        // Eliminar repuesto
        await window.repuestosModule.eliminarRepuesto(repuestoId);
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Repuesto eliminado correctamente', 'success');
        
        // Recargar tabla
        cargarTablaRepuestos();
        
        // Ocultar indicador de carga
        ocultarSincronizacion();
        
    } catch (error) {
        console.error('Error al eliminar repuesto:', error);
        mostrarAlerta('Error al eliminar repuesto: ' + error.message, 'danger');
        ocultarSincronizacion();
    }
}

// Exportar repuestos a CSV
function exportarRepuestosCSV() {
    try {
        const repuestos = window.repuestosModule.getRepuestos();
        
        if (repuestos.length === 0) {
            mostrarAlerta('No hay repuestos para exportar', 'warning');
            return;
        }
        
        // Crear cabeceras del CSV
        let csvContent = 'SKU,Nombre,Categoría,Stock\n';
        
        // Añadir filas de datos
        repuestos.forEach(repuesto => {
            // Escapar comillas y otros caracteres problemáticos
            const escaparCSV = (texto) => {
                if (!texto && texto !== 0) return '';
                return `"${texto.toString().replace(/"/g, '""')}"`;
            };
            
            const fila = [
                escaparCSV(repuesto.sku),
                escaparCSV(repuesto.nombre),
                escaparCSV(repuesto.categoria || ''),
                escaparCSV(repuesto.stock || 0)
            ].join(',');
            
            csvContent += fila + '\n';
        });
        
        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `repuestos_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarAlerta('Repuestos exportados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar repuestos:', error);
        mostrarAlerta('Error al exportar repuestos: ' + error.message, 'danger');
    }
}

// Inicializar el módulo al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en el panel de administración
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        // Si el módulo de repuestos está disponible, inicializar
        if (window.repuestosModule) {
            initAdminRepuestos();
        } else {
            console.warn("Esperando a que se cargue el módulo de repuestos...");
            // Escuchar el evento personalizado que indica que los repuestos se han cargado
            document.addEventListener('repuestosCargados', function() {
                console.log("Repuestos cargados, inicializando panel de administración...");
                initAdminRepuestos();
            });
        }
    }
});

// Exponer funciones al ámbito global
window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos,
    mostrarModalRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    exportarRepuestosCSV
};
