// Función para implementar en admin-repuestos.js
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

// Actualizar el listener para el botón de importar
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
    
    // Botón para importar repuestos - ACTUALIZADO
    const btnImportarRepuestos = document.getElementById('btn-importar-repuestos');
    if (btnImportarRepuestos) {
        btnImportarRepuestos.addEventListener('click', function() {
            importarRepuestosCSV();
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

// Exponer las nuevas funciones al ámbito global
window.adminRepuestos = {
    initAdminRepuestos,
    cargarTablaRepuestos,
    mostrarModalRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    exportarRepuestosCSV,
    importarRepuestosCSV  // Agregar nueva función
};
