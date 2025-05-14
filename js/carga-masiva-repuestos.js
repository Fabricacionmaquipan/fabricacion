// carga-masiva-repuestos.js - Módulo para importación masiva de repuestos

/**
 * Módulo para la carga masiva de repuestos
 * Este módulo permite importar repuestos desde un archivo CSV
 * Integrado con el sistema de repuestos existente
 */

// Referencia al módulo de repuestos
const repuestosModule = window.repuestosModule;

// Función para procesar la importación de repuestos desde CSV
async function importarRepuestosDesdeCSV(archivo) {
    return new Promise((resolve, reject) => {
        if (!archivo || !(archivo instanceof File)) {
            reject(new Error('Se requiere un archivo válido'));
            return;
        }

        // Verificar la extensión del archivo
        const extension = archivo.name.split('.').pop().toLowerCase();
        if (extension !== 'csv') {
            reject(new Error('El archivo debe ser de tipo CSV'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const contenido = e.target.result;
                const lineas = contenido.split('\n');
                
                // Extraer encabezados (primera línea)
                const encabezados = lineas[0].split(',').map(h => h.trim());
                
                // Verificar que al menos contenga sku y nombre
                const skuIndex = encabezados.findIndex(h => h.toLowerCase() === 'sku');
                const nombreIndex = encabezados.findIndex(h => h.toLowerCase() === 'nombre');
                
                if (skuIndex === -1 || nombreIndex === -1) {
                    reject(new Error('El CSV debe contener al menos las columnas "sku" y "nombre"'));
                    return;
                }
                
                // Procesar líneas (omitiendo la primera que son los encabezados)
                const resultados = {
                    total: lineas.length - 1,
                    procesados: 0,
                    exitosos: 0,
                    fallidos: 0,
                    errores: []
                };
                
                // Obtener índices de columnas opcionales
                const categoriaIndex = encabezados.findIndex(h => h.toLowerCase() === 'categoria');
                const stockIndex = encabezados.findIndex(h => h.toLowerCase() === 'stock');
                
                // Procesar cada línea (excepto la primera que son los encabezados)
                for (let i = 1; i < lineas.length; i++) {
                    const linea = lineas[i].trim();
                    if (!linea) continue; // Ignorar líneas vacías
                    
                    resultados.procesados++;
                    
                    try {
                        const valores = linea.split(',').map(v => v.trim());
                        
                        // Extraer valores
                        const sku = valores[skuIndex];
                        const nombre = valores[nombreIndex];
                        
                        // Valores opcionales
                        const categoria = categoriaIndex !== -1 ? valores[categoriaIndex] : 'Sin categoría';
                        const stock = stockIndex !== -1 ? parseInt(valores[stockIndex], 10) || 0 : 0;
                        
                        // Validar datos mínimos requeridos
                        if (!sku || !nombre) {
                            throw new Error(`Línea ${i}: SKU y nombre son obligatorios`);
                        }
                        
                        // Verificar si el repuesto ya existe
                        const repuestoExistente = repuestosModule.buscarRepuestoPorSku(sku);
                        
                        // Preparar objeto de repuesto
                        const repuesto = {
                            sku: sku,
                            nombre: nombre,
                            categoria: categoria,
                            stock: stock
                        };
                        
                        if (repuestoExistente) {
                            // Actualizar repuesto existente
                            repuesto.id = repuestoExistente.id;
                            await repuestosModule.actualizarRepuesto(repuesto);
                        } else {
                            // Agregar nuevo repuesto
                            repuesto.id = 'R' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                            await repuestosModule.agregarRepuesto(repuesto);
                        }
                        
                        resultados.exitosos++;
                    } catch (error) {
                        resultados.fallidos++;
                        resultados.errores.push({
                            linea: i,
                            mensaje: error.message
                        });
                    }
                }
                
                resolve(resultados);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsText(archivo);
    });
}

// Función para exportar plantilla CSV
function generarPlantillaCSV() {
    const encabezados = ['sku', 'nombre', 'categoria', 'stock'];
    const contenido = encabezados.join(',') + '\n';
    
    // Crear el enlace de descarga
    const enlace = document.createElement('a');
    enlace.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(contenido);
    enlace.download = 'plantilla_repuestos.csv';
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

// Función para generar informe detallado de la importación
function generarInformeImportacion(resultados) {
    let informe = `
        <div class="import-report">
            <h3>Informe de importación</h3>
            <div class="report-summary">
                <p><strong>Total de registros procesados:</strong> ${resultados.procesados}</p>
                <p><strong>Registros exitosos:</strong> ${resultados.exitosos}</p>
                <p><strong>Registros fallidos:</strong> ${resultados.fallidos}</p>
            </div>
    `;
    
    if (resultados.errores.length > 0) {
        informe += `
            <div class="report-errors">
                <h4>Errores encontrados</h4>
                <table class="error-table">
                    <thead>
                        <tr>
                            <th>Línea</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        resultados.errores.forEach(error => {
            informe += `
                <tr>
                    <td>${error.linea}</td>
                    <td>${error.mensaje}</td>
                </tr>
            `;
        });
        
        informe += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    informe += `</div>`;
    
    return informe;
}

// Mostrar la interfaz de importación en un modal
function mostrarInterfazImportacion() {
    // Crear contenido del modal
    const modalContent = `
        <div class="import-container">
            <div class="import-instructions">
                <h3>Importación masiva de repuestos</h3>
                <p>Siga los siguientes pasos para importar repuestos desde un archivo CSV:</p>
                <ol>
                    <li>Descargue la plantilla CSV</li>
                    <li>Complete la información requerida (SKU y nombre son obligatorios)</li>
                    <li>Guarde el archivo y súbalo utilizando el formulario</li>
                </ol>
                <button id="btn-descargar-plantilla" class="btn btn-secondary">Descargar plantilla</button>
            </div>
            
            <div class="import-form mt-4">
                <h4>Seleccionar archivo</h4>
                <form id="form-importar-repuestos">
                    <div class="form-group">
                        <input type="file" id="archivo-csv" accept=".csv" class="form-control" required>
                    </div>
                    <div class="form-group mt-3">
                        <button type="submit" id="btn-importar" class="btn btn-primary">Importar repuestos</button>
                    </div>
                </form>
            </div>
            
            <div id="resultado-importacion" class="mt-4"></div>
        </div>
    `;
    
    // Mostrar el modal
    const modal = window.componentesModule.mostrarModal(
        'Importación de repuestos',
        modalContent,
        'lg'
    );
    
    // Configurar eventos
    document.getElementById('btn-descargar-plantilla').addEventListener('click', () => {
        generarPlantillaCSV();
    });
    
    document.getElementById('form-importar-repuestos').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const archivoInput = document.getElementById('archivo-csv');
        const archivo = archivoInput.files[0];
        
        if (!archivo) {
            alert('Debe seleccionar un archivo CSV');
            return;
        }
        
        // Mostrar indicador de carga
        document.getElementById('btn-importar').disabled = true;
        document.getElementById('btn-importar').textContent = 'Procesando...';
        
        try {
            const resultados = await importarRepuestosDesdeCSV(archivo);
            
            // Mostrar resultados
            document.getElementById('resultado-importacion').innerHTML = generarInformeImportacion(resultados);
            
            // Notificar que se han actualizado los repuestos
            document.dispatchEvent(new CustomEvent('repuestosActualizados'));
            
        } catch (error) {
            document.getElementById('resultado-importacion').innerHTML = `
                <div class="alert alert-danger">${error.message}</div>
            `;
        } finally {
            // Restaurar el botón
            document.getElementById('btn-importar').disabled = false;
            document.getElementById('btn-importar').textContent = 'Importar repuestos';
        }
    });
}

// Exportar funciones para uso en otros módulos
window.cargaMasivaRepuestosModule = {
    importarRepuestosDesdeCSV,
    generarPlantillaCSV,
    mostrarInterfazImportacion
};

// Añadir script a la página después de cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log("Módulo de carga masiva de repuestos inicializado");
});
