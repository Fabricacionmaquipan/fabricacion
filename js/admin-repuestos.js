// admin-repuestos.js - Gestión del catálogo de repuestos para administración

/**
 * Módulo para la administración de repuestos
 * Este módulo permite visualizar, agregar, editar y eliminar repuestos
 * También incluye la integración con la carga masiva
 */

// Variables locales
let repuestosActuales = [];
let repuestosFiltrados = [];
let paginaActual = 1;
const repuestosPorPagina = 10;

// Referencias a elementos del DOM - se inicializarán después
let tablaRepuestos;
let repuestosInfo;
let repuestosPagination;
let btnNuevoRepuesto;
let btnCargaMasiva;
let buscarRepuesto;

// Referencias a modales y formularios
let repuestoModal;
let repuestoForm;
let repuestoModalTitle;

// Inicializar módulo
function inicializarAdminRepuestos() {
    console.log('Inicializando módulo de administración de repuestos...');
    
    // Inicializar referencias a elementos DOM
    tablaRepuestos = document.getElementById('tabla-repuestos');
    repuestosInfo = document.getElementById('repuestos-info');
    repuestosPagination = document.getElementById('repuestos-pagination');
    btnNuevoRepuesto = document.getElementById('btn-nuevo-repuesto');
    btnCargaMasiva = document.getElementById('btn-carga-masiva');
    buscarRepuesto = document.getElementById('buscar-repuesto');
    
    // Referencias a modales y formularios
    const repuestoModalElement = document.getElementById('repuesto-modal');
    repuestoForm = document.getElementById('repuesto-form');
    repuestoModalTitle = document.getElementById('repuesto-modal-title');
    
    // Verificar que los elementos existan
    if (!tablaRepuestos) {
        console.error('No se encontró el elemento tabla-repuestos');
    }
    if (!btnNuevoRepuesto) {
        console.error('No se encontró el botón btn-nuevo-repuesto');
    }
    if (!btnCargaMasiva) {
        console.error('No se encontró el botón btn-carga-masiva');
    }
    
    // Inicializar modal
    if (repuestoModalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        repuestoModal = new bootstrap.Modal(repuestoModalElement);
    } else {
        console.error('No se pudo inicializar el modal de repuestos. Bootstrap no disponible o modal no encontrado.');
    }
    
    // Registrar eventos si los elementos existen
    if (btnNuevoRepuesto) {
        console.log('Registrando evento click para btn-nuevo-repuesto');
        btnNuevoRepuesto.addEventListener('click', mostrarModalNuevoRepuesto);
    }
    
    if (btnCargaMasiva) {
        console.log('Registrando evento click para btn-carga-masiva');
        btnCargaMasiva.addEventListener('click', mostrarInterfazCargaMasiva);
    }
    
    if (repuestoForm) {
        console.log('Registrando evento submit para repuesto-form');
        repuestoForm.addEventListener('submit', guardarRepuesto);
    }
    
    if (buscarRepuesto) {
        console.log('Registrando evento input para buscar-repuesto');
        buscarRepuesto.addEventListener('input', filtrarRepuestos);
    }
    
    // Escuchar eventos de repuestos
    document.addEventListener('repuestosCargados', cargarRepuestos);
    document.addEventListener('repuestosActualizados', cargarRepuestos);
    
    // Cargar repuestos iniciales
    cargarRepuestos();
    
    console.log('Módulo de administración de repuestos inicializado correctamente');
}

// Cargar repuestos y mostrarlos en la tabla
function cargarRepuestos() {
    console.log('Cargando repuestos...');
    
    if (!tablaRepuestos) {
        console.error('Error: La tabla de repuestos no está disponible');
        return;
    }
    
    // Mostrar indicador de carga
    tablaRepuestos.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Cargando repuestos...
            </td>
        </tr>
    `;
    
    try {
        // Comprobar que el módulo de repuestos esté disponible
        if (!window.repuestosModule || typeof window.repuestosModule.getRepuestos !== 'function') {
            throw new Error('El módulo de repuestos no está disponible o no tiene la función getRepuestos');
        }
        
        // Obtener repuestos del módulo principal
        repuestosActuales = window.repuestosModule.getRepuestos();
        
        // Ordenar por SKU
        repuestosActuales.sort((a, b) => a.sku.localeCompare(b.sku));
        
        console.log(`Se cargaron ${repuestosActuales.length} repuestos`);
        
        // Filtrar si hay término de búsqueda
        filtrarRepuestos();
        
    } catch (error) {
        console.error('Error al cargar repuestos:', error);
        
        if (tablaRepuestos) {
            tablaRepuestos.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-3 text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error al cargar repuestos: ${error.message}
                    </td>
                </tr>
            `;
        }
        
        // Mostrar alerta si el módulo de componentes está disponible
        if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
            window.componentesModule.mostrarAlerta(`Error al cargar repuestos: ${error.message}`, 'danger');
        }
    }
}

// Filtrar repuestos según término de búsqueda
function filtrarRepuestos() {
    if (!buscarRepuesto) {
        console.error('Error: El campo de búsqueda no está disponible');
        repuestosFiltrados = [...repuestosActuales];
    } else {
        const terminoBusqueda = buscarRepuesto.value.toLowerCase().trim();
        
        if (terminoBusqueda === '') {
            repuestosFiltrados = [...repuestosActuales];
        } else {
            repuestosFiltrados = repuestosActuales.filter(repuesto => {
                return (
                    repuesto.sku.toLowerCase().includes(terminoBusqueda) ||
                    repuesto.nombre.toLowerCase().includes(terminoBusqueda) ||
                    (repuesto.categoria && repuesto.categoria.toLowerCase().includes(terminoBusqueda))
                );
            });
        }
    }
    
    // Resetear a primera página
    paginaActual = 1;
    
    // Mostrar repuestos filtrados
    mostrarRepuestos();
}

// Mostrar repuestos en la tabla con paginación
function mostrarRepuestos() {
    if (!tablaRepuestos || !repuestosInfo) {
        console.error('Error: Elementos de UI necesarios no están disponibles');
        return;
    }
    
    // Calcular índices para paginación
    const totalRepuestos = repuestosFiltrados.length;
    const totalPaginas = Math.ceil(totalRepuestos / repuestosPorPagina);
    const inicio = (paginaActual - 1) * repuestosPorPagina;
    const fin = Math.min(inicio + repuestosPorPagina, totalRepuestos);
    
    // Actualizar información
    repuestosInfo.textContent = totalRepuestos === 0
        ? 'No se encontraron repuestos'
        : `Mostrando ${inicio + 1}-${fin} de ${totalRepuestos} repuestos`;
    
    // Si no hay repuestos, mostrar mensaje
    if (totalRepuestos === 0) {
        tablaRepuestos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-3 text-muted">
                    <i class="fas fa-box-open fa-2x mb-2"></i>
                    <p class="mb-0">No se encontraron repuestos</p>
                </td>
            </tr>
        `;
        
        if (repuestosPagination) {
            repuestosPagination.innerHTML = '';
        }
        return;
    }
    
    // Construir filas de la tabla
    let html = '';
    for (let i = inicio; i < fin; i++) {
        const repuesto = repuestosFiltrados[i];
        html += `
            <tr>
                <td><code>${repuesto.sku || ''}</code></td>
                <td>${repuesto.nombre || ''}</td>
                <td>${repuesto.categoria || 'Sin categoría'}</td>
                <td>
                    <span class="badge rounded-pill ${repuesto.stock > 0 ? 'bg-success' : 'bg-danger'}">
                        ${repuesto.stock || 0}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.adminRepuestosModule.editarRepuesto('${repuesto.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="window.adminRepuestosModule.eliminarRepuesto('${repuesto.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Actualizar tabla
    tablaRepuestos.innerHTML = html;
    
    // Generar controles de paginación
    if (repuestosPagination) {
        generarPaginacion(totalPaginas);
    }
}

// Generar controles de paginación
function generarPaginacion(totalPaginas) {
    if (!repuestosPagination) {
        console.error('Error: El contenedor de paginación no está disponible');
        return;
    }
    
    if (totalPaginas <= 1) {
        repuestosPagination.innerHTML = '';
        return;
    }
    
    let html = `
        <nav aria-label="Paginación de repuestos">
            <ul class="pagination pagination-sm mb-0">
                <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="window.adminRepuestosModule.cambiarPagina(${paginaActual - 1}); return false;">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
    `;
    
    // Mostrar hasta 5 páginas
    const maxPaginas = 5;
    const startPage = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
    const endPage = Math.min(totalPaginas, startPage + maxPaginas - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="window.adminRepuestosModule.cambiarPagina(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    html += `
                <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="window.adminRepuestosModule.cambiarPagina(${paginaActual + 1}); return false;">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
    `;
    
    repuestosPagination.innerHTML = html;
}

// Cambiar página
function cambiarPagina(pagina) {
    console.log(`Cambiando a página ${pagina}`);
    paginaActual = pagina;
    mostrarRepuestos();
}

// Mostrar modal para nuevo repuesto
function mostrarModalNuevoRepuesto() {
    console.log('Mostrando modal para nuevo repuesto');
    
    if (!repuestoForm || !repuestoModalTitle || !repuestoModal) {
        console.error('Error: Elementos del modal no disponibles');
        return;
    }
    
    // Limpiar formulario
    repuestoForm.reset();
    
    const repuestoIdInput = document.getElementById('repuesto-id');
    if (repuestoIdInput) {
        repuestoIdInput.value = '';
    }
    
    repuestoModalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Repuesto';
    
    // Mostrar modal
    try {
        repuestoModal.show();
    } catch (error) {
        console.error('Error al mostrar el modal:', error);
        alert('Error al mostrar el formulario de repuesto. Por favor, intente nuevamente.');
    }
}

// Mostrar modal para editar repuesto
function editarRepuesto(id) {
    console.log(`Editando repuesto con ID: ${id}`);
    
    if (!repuestoModal || !repuestoModalTitle || !repuestoForm) {
        console.error('Error: Elementos del modal no disponibles');
        return;
    }
    
    try {
        // Buscar repuesto
        const repuesto = repuestosActuales.find(r => r.id === id);
        if (!repuesto) {
            console.error(`No se encontró el repuesto con ID ${id}`);
            if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                window.componentesModule.mostrarAlerta('No se encontró el repuesto', 'warning');
            } else {
                alert('No se encontró el repuesto');
            }
            return;
        }
        
        // Llenar formulario
        const repuestoIdInput = document.getElementById('repuesto-id');
        const repuestoSkuInput = document.getElementById('repuesto-sku');
        const repuestoNombreInput = document.getElementById('repuesto-nombre');
        const repuestoCategoriaInput = document.getElementById('repuesto-categoria');
        const repuestoStockInput = document.getElementById('repuesto-stock');
        
        if (repuestoIdInput) repuestoIdInput.value = repuesto.id;
        if (repuestoSkuInput) repuestoSkuInput.value = repuesto.sku;
        if (repuestoNombreInput) repuestoNombreInput.value = repuesto.nombre;
        if (repuestoCategoriaInput) repuestoCategoriaInput.value = repuesto.categoria || '';
        if (repuestoStockInput) repuestoStockInput.value = repuesto.stock || 0;
        
        // Actualizar título
        repuestoModalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Repuesto';
        
        // Mostrar modal
        repuestoModal.show();
    } catch (error) {
        console.error('Error al editar repuesto:', error);
        alert(`Error al editar repuesto: ${error.message}`);
    }
}

// Eliminar repuesto
function eliminarRepuesto(id) {
    console.log(`Intentando eliminar repuesto con ID: ${id}`);
    
    try {
        // Buscar repuesto
        const repuesto = repuestosActuales.find(r => r.id === id);
        if (!repuesto) {
            console.error(`No se encontró el repuesto con ID ${id}`);
            if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                window.componentesModule.mostrarAlerta('No se encontró el repuesto', 'warning');
            } else {
                alert('No se encontró el repuesto');
            }
            return;
        }
        
        // Función para ejecutar la eliminación
        const ejecutarEliminacion = () => {
            // Verificar módulo de repuestos
            if (!window.repuestosModule || typeof window.repuestosModule.eliminarRepuesto !== 'function') {
                console.error('El módulo de repuestos no está disponible o no tiene la función eliminarRepuesto');
                alert('Error: No se puede eliminar el repuesto porque el módulo no está disponible');
                return;
            }
            
            // Mostrar indicador de sincronización
            if (window.componentesModule && typeof window.componentesModule.mostrarSincronizacion === 'function') {
                window.componentesModule.mostrarSincronizacion('Eliminando repuesto...');
            }
            
            // Eliminar repuesto
            window.repuestosModule.eliminarRepuesto(id)
                .then(() => {
                    console.log(`Repuesto ${id} eliminado correctamente`);
                    if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                        window.componentesModule.mostrarAlerta('Repuesto eliminado correctamente', 'success');
                    }
                    // Recargar repuestos
                    cargarRepuestos();
                })
                .catch(error => {
                    console.error('Error al eliminar repuesto:', error);
                    if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                        window.componentesModule.mostrarAlerta(`Error al eliminar repuesto: ${error.message}`, 'danger');
                    } else {
                        alert(`Error al eliminar repuesto: ${error.message}`);
                    }
                })
                .finally(() => {
                    if (window.componentesModule && typeof window.componentesModule.ocultarSincronizacion === 'function') {
                        window.componentesModule.ocultarSincronizacion();
                    }
                });
        };
        
        // Confirmar eliminación
        if (window.componentesModule && typeof window.componentesModule.mostrarConfirmacion === 'function') {
            window.componentesModule.mostrarConfirmacion(
                `¿Estás seguro de eliminar el repuesto ${repuesto.sku} - ${repuesto.nombre}?`,
                ejecutarEliminacion
            );
        } else {
            if (confirm(`¿Estás seguro de eliminar el repuesto ${repuesto.sku} - ${repuesto.nombre}?`)) {
                ejecutarEliminacion();
            }
        }
    } catch (error) {
        console.error('Error en proceso de eliminar repuesto:', error);
        alert(`Error al procesar eliminación: ${error.message}`);
    }
}

// Guardar repuesto (nuevo o edición)
function guardarRepuesto(event) {
    event.preventDefault();
    console.log('Guardando repuesto...');
    
    try {
        // Recoger datos del formulario
        const idInput = document.getElementById('repuesto-id');
        const skuInput = document.getElementById('repuesto-sku');
        const nombreInput = document.getElementById('repuesto-nombre');
        const categoriaInput = document.getElementById('repuesto-categoria');
        const stockInput = document.getElementById('repuesto-stock');
        
        if (!skuInput || !nombreInput) {
            throw new Error('Formulario incompleto o inválido');
        }
        
        const id = idInput ? idInput.value.trim() : '';
        const sku = skuInput.value.trim();
        const nombre = nombreInput.value.trim();
        const categoria = categoriaInput ? categoriaInput.value.trim() : '';
        const stock = stockInput ? parseInt(stockInput.value) || 0 : 0;
        
        // Validaciones básicas
        if (!sku) {
            throw new Error('El SKU es obligatorio');
        }
        
        if (!nombre) {
            throw new Error('El nombre es obligatorio');
        }
        
        // Crear objeto repuesto
        const repuesto = {
            sku: sku,
            nombre: nombre,
            categoria: categoria || 'Sin categoría',
            stock: stock
        };
        
        // Verificar módulo de repuestos
        if (!window.repuestosModule) {
            throw new Error('El módulo de repuestos no está disponible');
        }
        
        if (typeof window.repuestosModule.agregarRepuesto !== 'function' || 
            typeof window.repuestosModule.actualizarRepuesto !== 'function') {
            throw new Error('Las funciones del módulo de repuestos no están disponibles');
        }
        
        // Mostrar indicador de sincronización
        if (window.componentesModule && typeof window.componentesModule.mostrarSincronizacion === 'function') {
            window.componentesModule.mostrarSincronizacion('Guardando repuesto...');
        }
        
        let promise;
        
        if (id) {
            // Actualizar repuesto existente
            repuesto.id = id;
            promise = window.repuestosModule.actualizarRepuesto(repuesto);
        } else {
            // Agregar nuevo repuesto
            promise = window.repuestosModule.agregarRepuesto(repuesto);
        }
        
        promise
            .then(() => {
                console.log(`Repuesto ${id ? 'actualizado' : 'agregado'} correctamente`);
                
                if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                    window.componentesModule.mostrarAlerta(
                        `Repuesto ${id ? 'actualizado' : 'agregado'} correctamente`,
                        'success'
                    );
                }
                
                // Cerrar modal
                if (repuestoModal) {
                    repuestoModal.hide();
                }
                
                // Recargar repuestos
                cargarRepuestos();
            })
            .catch(error => {
                console.error(`Error al ${id ? 'actualizar' : 'agregar'} repuesto:`, error);
                
                if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
                    window.componentesModule.mostrarAlerta(error.message, 'danger');
                } else {
                    alert(error.message);
                }
            })
            .finally(() => {
                if (window.componentesModule && typeof window.componentesModule.ocultarSincronizacion === 'function') {
                    window.componentesModule.ocultarSincronizacion();
                }
            });
    } catch (error) {
        console.error(`Error al procesar el formulario:`, error);
        
        if (window.componentesModule && typeof window.componentesModule.mostrarAlerta === 'function') {
            window.componentesModule.mostrarAlerta(error.message, 'danger');
        } else {
            alert(error.message);
        }
        
        if (window.componentesModule && typeof window.componentesModule.ocultarSincronizacion === 'function') {
            window.componentesModule.ocultarSincronizacion();
        }
    }
}

// Mostrar interfaz de carga masiva
function mostrarInterfazCargaMasiva() {
    console.log('Intentando mostrar interfaz de carga masiva...');
    
    // Verificar que el módulo de carga masiva esté disponible
    if (!window.cargaMasivaRepuestosModule) {
        console.error('Error: El módulo de carga masiva no está disponible en window.cargaMasivaRepuestosModule');
        alert('Error: No se pudo cargar el módulo de importación masiva. Asegúrate de que el archivo carga-masiva-repuestos.js está incluido.');
        return;
    }
    
    if (typeof window.cargaMasivaRepuestosModule.mostrarInterfazImportacion !== 'function') {
        console.error('Error: La función mostrarInterfazImportacion no está disponible en el módulo de carga masiva');
        alert('Error: El módulo de importación masiva está incompleto. Contacta con el administrador del sistema.');
        return;
    }
    
    // Todo está correcto, mostrar la interfaz
    console.log('Invocando mostrarInterfazImportacion()...');
    window.cargaMasivaRepuestosModule.mostrarInterfazImportacion();
}

// Exportar funciones públicas
window.adminRepuestosModule = {
    inicializarAdminRepuestos,
    cargarRepuestos,
    cambiarPagina,
    editarRepuesto,
    eliminarRepuesto,
    mostrarInterfazCargaMasiva
};

// Inicializar módulo cuando el contenido esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded en admin-repuestos.js");
    
    // Verificar si estamos en la página de administración
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        console.log("Panel de administración encontrado, inicializando módulo de repuestos...");
        
        // Esperar un poco para asegurarse de que todo esté cargado, incluyendo Bootstrap
        setTimeout(() => {
            inicializarAdminRepuestos();
        }, 500);
    } else {
        console.log("Panel de administración no encontrado, no se inicializa el módulo de repuestos");
    }
});

// También inicializar cuando se haga clic en la pestaña de repuestos
document.addEventListener('DOMContentLoaded', function() {
    const repuestosTab = document.getElementById('repuestos-tab');
    if (repuestosTab) {
        console.log("Pestaña de repuestos encontrada, añadiendo event listener...");
        repuestosTab.addEventListener('shown.bs.tab', function() {
            console.log("Pestaña de repuestos activada, verificando inicialización...");
            if (window.adminRepuestosModule) {
                window.adminRepuestosModule.cargarRepuestos();
            }
        });
    }
});

console.log("Archivo admin-repuestos.js cargado");
