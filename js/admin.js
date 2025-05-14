// =====================================================
// SECCIÓN 5: FUNCIONES DE CARGA MASIVA DE REPUESTOS
// =====================================================

// Función para importar repuestos desde CSV
function importarRepuestosCSV() {
    // Crear modal para importación
    mostrarModalImportarRepuestos();
}

// Función para mostrar el modal de importación
function mostrarModalImportarRepuestos() {
    console.log("Mostrando modal de importación de repuestos...");
    
    // Verificar si el modal ya existe
    let importarModal = document.getElementById('importar-repuestos-modal');
    
    // Si no existe, crearlo
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
                                        <thead id="preview-headers">
                                            <!-- Se llenará con JavaScript -->
                                        </thead>
                                        <tbody id="preview-body">
                                            <!-- Se llenará con JavaScript -->
                                        </tbody>
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
        
        // Añadir al DOM
        document.body.appendChild(importarModal);
        
        // Configurar eventos
        configurarEventosImportacion();
    }
    
    // Limpiar cualquier modal o backdrop existente
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(importarModal);
    modal.show();
}

// Configurar eventos para el modal de importación
function configurarEventosImportacion() {
    // Input de archivo
    const archivoInput = document.getElementById('archivo-csv');
    if (archivoInput) {
        archivoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Habilitar botón de importación
                document.getElementById('btn-procesar-importacion').disabled = false;
                
                // Mostrar vista previa
                mostrarVistaPrevia(file);
            } else {
                // Deshabilitar botón si no hay archivo
                document.getElementById('btn-procesar-importacion').disabled = true;
            }
        });
    }
    
    // Botón de procesar importación
    const btnProcesarImportacion = document.getElementById('btn-procesar-importacion');
    if (btnProcesarImportacion) {
        btnProcesarImportacion.addEventListener('click', function() {
            const file = document.getElementById('archivo-csv').files[0];
            const tieneEncabezados = document.getElementById('tiene-encabezados').checked;
            const opcionDuplicados = document.querySelector('input[name="opcion-duplicados"]:checked').value;
            
            if (file) {
                procesarImportacionCSV(file, tieneEncabezados, opcionDuplicados);
            }
        });
    }
}

// Mostrar vista previa del CSV
function mostrarVistaPrevia(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const contenido = e.target.result;
        const tieneEncabezados = document.getElementById('tiene-encabezados').checked;
        const previewContainer = document.getElementById('preview-container');
        const previewHeaders = document.getElementById('preview-headers');
        const previewBody = document.getElementById('preview-body');
        
        // Parsear el CSV
        let lineas = contenido.split(/\r\n|\n/);
        let filas = [];
        
        // Procesar líneas
        for (let i = 0; i < lineas.length; i++) {
            if (lineas[i].trim() === '') continue;
            
            // Manejar campos que contienen comas dentro de comillas
            const campos = [];
            let campo = '';
            let entreComillas = false;
            
            for (let j = 0; j < lineas[i].length; j++) {
                const char = lineas[i][j];
                
                if (char === '"') {
                    entreComillas = !entreComillas;
                } else if (char === ',' && !entreComillas) {
                    campos.push(campo);
                    campo = '';
                } else {
                    campo += char;
                }
            }
            
            // Añadir el último campo
            campos.push(campo);
            
            // Limpiar comillas de los campos
            for (let j = 0; j < campos.length; j++) {
                if (campos[j].startsWith('"') && campos[j].endsWith('"')) {
                    campos[j] = campos[j].slice(1, -1).replace(/""/g, '"');
                }
            }
            
            filas.push(campos);
        }
        
        // Mostrar encabezados
        let encabezados = tieneEncabezados ? filas[0] : ['SKU', 'Nombre', 'Categoría', 'Stock'];
        let headerRow = '<tr>';
        
        encabezados.forEach(encabezado => {
            headerRow += `<th>${encabezado}</th>`;
        });
        
        headerRow += '</tr>';
        previewHeaders.innerHTML = headerRow;
        
        // Mostrar datos (hasta 5 filas)
        previewBody.innerHTML = '';
        const inicioFilas = tieneEncabezados ? 1 : 0;
        const maxFilas = Math.min(inicioFilas + 5, filas.length);
        
        for (let i = inicioFilas; i < maxFilas; i++) {
            let fila = '<tr>';
            filas[i].forEach(campo => {
                fila += `<td>${campo}</td>`;
            });
            fila += '</tr>';
            previewBody.innerHTML += fila;
        }
        
        // Mostrar contenedor de vista previa
        previewContainer.style.display = 'block';
    };
    
    reader.readAsText(file);
}

// Procesar la importación del CSV
async function procesarImportacionCSV(file, tieneEncabezados, opcionDuplicados) {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const contenido = e.target.result;
            let lineas = contenido.split(/\r\n|\n/);
            let repuestosAImportar = [];
            
            // Eliminar líneas vacías
            lineas = lineas.filter(linea => linea.trim() !== '');
            
            // Determinar inicio de datos
            const inicioFilas = tieneEncabezados ? 1 : 0;
            
            // Mostrar barra de progreso
            const progressContainer = document.getElementById('import-progress-container');
            const progressBar = document.getElementById('import-progress-bar');
            progressContainer.style.display = 'flex';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
            
            // Ocultar resultados anteriores
            document.getElementById('import-results').style.display = 'none';
            
            // Procesar cada línea
            for (let i = inicioFilas; i < lineas.length; i++) {
                // Manejar campos que contienen comas dentro de comillas
                const campos = [];
                let campo = '';
                let entreComillas = false;
                
                for (let j = 0; j < lineas[i].length; j++) {
                    const char = lineas[i][j];
                    
                    if (char === '"') {
                        entreComillas = !entreComillas;
                    } else if (char === ',' && !entreComillas) {
                        campos.push(campo);
                        campo = '';
                    } else {
                        campo += char;
                    }
                }
                
                // Añadir el último campo
                campos.push(campo);
                
                // Limpiar comillas de los campos
                for (let j = 0; j < campos.length; j++) {
                    if (campos[j].startsWith('"') && campos[j].endsWith('"')) {
                        campos[j] = campos[j].slice(1, -1).replace(/""/g, '"');
                    }
                }
                
                if (campos.length >= 2) {  // Al menos debe tener SKU y Nombre
                    const repuesto = {
                        id: 'R' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                        sku: campos[0].trim(),
                        nombre: campos[1].trim(),
                        categoria: campos.length > 2 ? campos[2].trim() : '',
                        stock: campos.length > 3 ? parseInt(campos[3].trim()) || 0 : 0
                    };
                    
                    repuestosAImportar.push(repuesto);
                }
                
                // Actualizar progreso de lectura
                const progreso = Math.round(((i - inicioFilas + 1) / (lineas.length - inicioFilas)) * 40);
                progressBar.style.width = `${progreso}%`;
                progressBar.textContent = `${progreso}%`;
                progressBar.setAttribute('aria-valuenow', progreso);
                
                // Dar tiempo para actualizar la UI
                if ((i - inicioFilas) % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            
            // Verificar duplicados y realizar importación
            let importados = 0;
            let actualizados = 0;
            let saltados = 0;
            let errores = 0;
            
            const total = repuestosAImportar.length;
            
            for (let i = 0; i < repuestosAImportar.length; i++) {
                try {
                    const repuesto = repuestosAImportar[i];
                    const repuestoExistente = window.repuestosModule.buscarRepuestoPorSku(repuesto.sku);
                    
                    if (repuestoExistente) {
                        // Existe un repuesto con el mismo SKU
                        if (opcionDuplicados === 'actualizar') {
                            // Actualizar el existente
                            repuesto.id = repuestoExistente.id; // Mantener ID original
                            await window.repuestosModule.actualizarRepuesto(repuesto);
                            actualizados++;
                        } else {
                            // Saltar duplicados
                            saltados++;
                        }
                    } else {
                        // Nuevo repuesto
                        await window.repuestosModule.agregarRepuesto(repuesto);
                        importados++;
                    }
                    
                    // Actualizar progreso de importación
                    const progreso = 40 + Math.round(((i + 1) / total) * 60);
                    progressBar.style.width = `${progreso}%`;
                    progressBar.textContent = `${progreso}%`;
                    progressBar.setAttribute('aria-valuenow', progreso);
                    
                    // Dar tiempo para actualizar la UI
                    if (i % 20 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                } catch (error) {
                    console.error('Error al importar repuesto:', error);
                    errores++;
                }
            }
            
            // Finalizar proceso
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
            progressBar.classList.remove('progress-bar-animated');
            
            // Mostrar resultados
            const resultadosDiv = document.getElementById('import-results');
            resultadosDiv.className = errores > 0 ? 'alert alert-warning' : 'alert alert-success';
            resultadosDiv.innerHTML = `
                <h5><i class="fas ${errores > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2"></i>Resultado de la importación</h5>
                <p class="mb-1">Se procesaron ${total} registros del archivo.</p>
                <ul class="mb-0">
                    <li><strong>Nuevos repuestos:</strong> ${importados}</li>
                    <li><strong>Actualizados:</strong> ${actualizados}</li>
                    <li><strong>Saltados (duplicados):</strong> ${saltados}</li>
                    <li><strong>Errores:</strong> ${errores}</li>
                </ul>
            `;
            resultadosDiv.style.display = 'block';
            
            // Recargar tabla de repuestos
            cargarTablaRepuestos();
            
            // Cambiar texto del botón
            document.getElementById('btn-procesar-importacion').textContent = 'Importación Completada';
            document.getElementById('btn-procesar-importacion').disabled = true;
            
        } catch (error) {
            console.error('Error en proceso de importación:', error);
            
            // Mostrar error
            const resultadosDiv = document.getElementById('import-results');
            resultadosDiv.className = 'alert alert-danger';
            resultadosDiv.innerHTML = `
                <h5><i class="fas fa-exclamation-circle me-2"></i>Error en la importación</h5>
                <p class="mb-0">Se produjo un error durante el proceso: ${error.message}</p>
            `;
            resultadosDiv.style.display = 'block';
            
            // Ocultar progreso
            document.getElementById('import-progress-container').style.display = 'none';
        }
    };
    
    reader.readAsText(file);
}

// =====================================================
// SECCIÓN 6: INICIALIZACIÓN Y EXPORTACIÓN DE FUNCIONES
// =====================================================

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar referencias a elementos DOM
    tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');
    
    // Inicializar panel principal
    setupAdminListeners();
    setupAdminButtonListeners();
    
    // Verificar si estamos en el panel de administración
    if (document.getElementById('admin-panel')) {
        // Configurar listener para el botón de confirmar eliminación
        const confirmarEliminacionBtn = document.getElementById('confirmar-eliminacion-btn');
        if (confirmarEliminacionBtn) {
            confirmarEliminacionBtn.addEventListener('click', eliminarSolicitud);
        }
        
        // Inicializar módulo de productos
        initAdminProductos();
        
        // Inicializar módulo de repuestos
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

// Exponer funciones al ámbito global para admin principal
window.showConfirmarEliminacionModal = showConfirmarEliminacionModal;
window.eliminarSolicitud = eliminarSolicitud;
window.cargarDatosAdmin = cargarDatosAdmin;
window.exportarSolicitudesCSV = exportarSolicitudesCSV;
window.generarEstadisticas = generarEstadisticas;

// Exponer funciones al ámbito global para admin-productos
window.adminProductos = {
    initAdminProductos,
    cargarTablaProductos,
    // Agregar otras funciones específicas de productos si es necesario
};

// Exponer funciones al ámbito global para admin-repuestos
window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos,
    mostrarModalRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    exportarRepuestosCSV,
    importarRepuestosCSV
};

// =====================================================
// SECCIÓN 7: ESTILOS CSS PARA LA CARGA MASIVA
// =====================================================

// Agregar estilos CSS para la importación de repuestos
(function() {
    const style = document.createElement('style');
    style.textContent = `
    /* Estilos para la importación de repuestos */
    .preview-container {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        padding: 0.5rem;
        background-color: #f8f9fa;
    }

    .preview-container table {
        margin-bottom: 0;
    }

    .preview-container thead th {
        position: sticky;
        top: 0;
        background-color: #f8f9fa;
        z-index: 1;
    }

    #import-progress-container {
        height: 20px;
    }

    #import-results {
        margin-bottom: 1rem;
    }

    #import-results ul {
        margin-top: 0.5rem;
        padding-left: 1.5rem;
    }

    /* Estilos para campos de archivo */
    .custom-file-input::-webkit-file-upload-button {
        visibility: hidden;
    }

    .custom-file-input::before {
        content: 'Seleccionar archivo';
        display: inline-block;
        background: linear-gradient(top, #f9f9f9, #e3e3e3);
        border: 1px solid #999;
        border-radius: 3px;
        padding: 5px 8px;
        outline: none;
        white-space: nowrap;
        -webkit-user-select: none;
        cursor: pointer;
        text-shadow: 1px 1px #fff;
        font-weight: 700;
        font-size: 10pt;
    }

    .custom-file-input:hover::before {
        border-color: black;
    }

    .custom-file-input:active::before {
        background: -webkit-linear-gradient(top, #e3e3e3, #f9f9f9);
    }
    `;
    document.head.appendChild(style);
})();// =====================================================
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
