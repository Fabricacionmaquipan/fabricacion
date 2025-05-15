<!-- Solución completa para el problema de carga masiva de repuestos -->
<!-- Guardar estos scripts en archivo carga-masiva-solucion.js y agregarlo al final de index.html -->

<script>
// Parte 1: Función simplificada para mostrar la interfaz de importación
function mostrarInterfazImportacionSimplificada() {
    console.log("Ejecutando mostrarInterfazImportacionSimplificada...");
    
    try {
        // Crear contenido del modal sin depender de otros módulos
        const modalHTML = `
            <div class="modal fade" id="modal-carga-masiva" tabindex="-1" aria-labelledby="modal-carga-masiva-label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modal-carga-masiva-label">
                                <i class="fas fa-file-import me-2"></i>Importación de Repuestos
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="import-container">
                                <div class="import-instructions">
                                    <h3>Importación masiva de repuestos</h3>
                                    <p>Siga los siguientes pasos para importar repuestos desde un archivo CSV:</p>
                                    <ol>
                                        <li>Descargue la plantilla CSV</li>
                                        <li>Complete la información requerida (SKU y nombre son obligatorios)</li>
                                        <li>Guarde el archivo y súbalo utilizando el formulario</li>
                                    </ol>
                                    <button id="btn-descargar-plantilla" class="btn btn-secondary">
                                        <i class="fas fa-download me-1"></i> Descargar plantilla
                                    </button>
                                </div>
                                
                                <div class="import-form mt-4">
                                    <h4>Seleccionar archivo</h4>
                                    <form id="form-importar-repuestos">
                                        <div class="form-group">
                                            <input type="file" id="archivo-csv" accept=".csv" class="form-control" required>
                                        </div>
                                        <div class="form-group mt-3">
                                            <button type="submit" id="btn-importar" class="btn btn-primary">
                                                <i class="fas fa-file-import me-1"></i> Importar repuestos
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                
                                <div id="resultado-importacion" class="mt-4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Obtener el elemento modal
        const modalElement = document.getElementById('modal-carga-masiva');
        if (!modalElement) {
            throw new Error("No se pudo crear el elemento modal");
        }
        
        // Crear la instancia del modal
        const bsModal = new bootstrap.Modal(modalElement);
        
        // Configurar el evento para eliminar el modal cuando se cierre
        modalElement.addEventListener('hidden.bs.modal', function() {
            if (modalContainer && modalContainer.parentNode) {
                document.body.removeChild(modalContainer);
            }
        });
        
        // Mostrar el modal
        bsModal.show();
        
        // Configurar eventos de los botones
        setTimeout(() => {
            const btnDescargarPlantilla = document.getElementById('btn-descargar-plantilla');
            const formImportarRepuestos = document.getElementById('form-importar-repuestos');
            
            if (btnDescargarPlantilla) {
                btnDescargarPlantilla.addEventListener('click', () => {
                    console.log("Descargando plantilla CSV...");
                    // Verificar si está disponible la función original
                    if (window.cargaMasivaRepuestosModule && typeof window.cargaMasivaRepuestosModule.generarPlantillaCSV === 'function') {
                        window.cargaMasivaRepuestosModule.generarPlantillaCSV();
                    } else {
                        // Implementación de respaldo
                        const encabezados = ['sku', 'nombre', 'categoria', 'stock'];
                        const contenido = encabezados.join(',') + '\n';
                        
                        const enlace = document.createElement('a');
                        enlace.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(contenido);
                        enlace.download = 'plantilla_repuestos.csv';
                        enlace.style.display = 'none';
                        document.body.appendChild(enlace);
                        enlace.click();
                        document.body.removeChild(enlace);
                    }
                });
            }
            
            if (formImportarRepuestos) {
                formImportarRepuestos.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    console.log("Formulario de importación enviado");
                    
                    const archivoInput = document.getElementById('archivo-csv');
                    const archivo = archivoInput.files[0];
                    
                    if (!archivo) {
                        alert('Debe seleccionar un archivo CSV');
                        return;
                    }
                    
                    // Mostrar indicador de carga
                    const btnImportar = document.getElementById('btn-importar');
                    if (btnImportar) {
                        btnImportar.disabled = true;
                        btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Procesando...';
                    }
                    
                    try {
                        const resultadoImportacion = document.getElementById('resultado-importacion');
                        
                        // Verificar si está disponible la función original
                        if (window.cargaMasivaRepuestosModule && typeof window.cargaMasivaRepuestosModule.importarRepuestosDesdeCSV === 'function') {
                            const resultados = await window.cargaMasivaRepuestosModule.importarRepuestosDesdeCSV(archivo);
                            
                            if (resultadoImportacion && typeof window.cargaMasivaRepuestosModule.generarInformeImportacion === 'function') {
                                resultadoImportacion.innerHTML = window.cargaMasivaRepuestosModule.generarInformeImportacion(resultados);
                            } else {
                                // Implementación de respaldo
                                resultadoImportacion.innerHTML = `
                                    <div class="alert alert-success">
                                        <p><strong>Importación completada</strong></p>
                                        <p>Se procesaron ${resultados.procesados} registros.</p>
                                        <p>Exitosos: ${resultados.exitosos}</p>
                                        <p>Fallidos: ${resultados.fallidos}</p>
                                    </div>
                                `;
                            }
                            
                            // Notificar que se han actualizado los repuestos
                            document.dispatchEvent(new CustomEvent('repuestosActualizados'));
                        } else {
                            if (resultadoImportacion) {
                                resultadoImportacion.innerHTML = `
                                    <div class="alert alert-danger">
                                        <i class="fas fa-exclamation-circle me-2"></i>
                                        El módulo de importación no está completamente disponible. Por favor, recargue la página.
                                    </div>
                                `;
                            }
                        }
                    } catch (error) {
                        console.error("Error en la importación:", error);
                        
                        const resultadoImportacion = document.getElementById('resultado-importacion');
                        if (resultadoImportacion) {
                            resultadoImportacion.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    ${error.message}
                                </div>
                            `;
                        }
                    } finally {
                        // Restaurar el botón
                        const btnImportar = document.getElementById('btn-importar');
                        if (btnImportar) {
                            btnImportar.disabled = false;
                            btnImportar.innerHTML = '<i class="fas fa-file-import me-1"></i> Importar repuestos';
                        }
                    }
                });
            }
        }, 100);
        
        return bsModal;
    } catch (error) {
        console.error("Error en mostrarInterfazImportacionSimplificada:", error);
        alert("Error al mostrar la interfaz de importación: " + error.message);
        return null;
    }
}

// Exportar la función
window.mostrarInterfazImportacionSimplificada = mostrarInterfazImportacionSimplificada;

// Parte 2: Script de inicialización para registrar el evento del botón
document.addEventListener('DOMContentLoaded', function() {
    console.log("Iniciando script de solución para carga masiva de repuestos...");
    
    // Esperar un poco para asegurarse de que todos los componentes estén cargados
    setTimeout(function() {
        // Intentar registrar el evento en el botón
        const btnCargaMasiva = document.getElementById('btn-carga-masiva');
        
        if (btnCargaMasiva) {
            console.log("Botón de carga masiva encontrado, configurando evento...");
            
            // Eliminar posibles eventos existentes para evitar duplicaciones
            const nuevoBtn = btnCargaMasiva.cloneNode(true);
            btnCargaMasiva.parentNode.replaceChild(nuevoBtn, btnCargaMasiva);
            
            // Registrar el nuevo evento
            nuevoBtn.addEventListener('click', function(event) {
                event.preventDefault();
                console.log("Clic en botón de carga masiva detectado");
                
                // Verificar si el módulo original está disponible
                if (window.cargaMasivaRepuestosModule && 
                    typeof window.cargaMasivaRepuestosModule.mostrarInterfazImportacion === 'function') {
                    
                    console.log("Intentando usar la función original del módulo...");
                    try {
                        window.cargaMasivaRepuestosModule.mostrarInterfazImportacion();
                    } catch (error) {
                        console.error("Error al usar la función original:", error);
                        // Si falla, usar la función simplificada
                        usarFuncionSimplificada();
                    }
                } else {
                    console.log("Módulo original no disponible, usando función simplificada...");
                    usarFuncionSimplificada();
                }
            });
            
            console.log("Evento configurado correctamente en el botón de carga masiva");
        } else {
            console.error("No se encontró el botón de carga masiva (btn-carga-masiva)");
        }
        
        // Función para usar la implementación simplificada
        function usarFuncionSimplificada() {
            // Verificar si la función simplificada está disponible
            if (typeof window.mostrarInterfazImportacionSimplificada === 'function') {
                console.log("Usando función simplificada...");
                window.mostrarInterfazImportacionSimplificada();
            } else {
                console.error("Función simplificada no disponible");
                // Como último recurso, crear un modal básico
                crearModalBasico();
            }
        }
        
        // Función para crear un modal básico como último recurso
        function crearModalBasico() {
            console.log("Creando modal básico como último recurso...");
            
            try {
                const modalHTML = `
                    <div class="modal fade" id="modal-basico" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Importación de Repuestos</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <p>La funcionalidad de importación masiva no está disponible en este momento.</p>
                                    <p>Por favor, verifique la consola para más detalles y recargue la página.</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                const container = document.createElement('div');
                container.innerHTML = modalHTML;
                document.body.appendChild(container);
                
                const modalElement = document.getElementById('modal-basico');
                const modal = new bootstrap.Modal(modalElement);
                
                modalElement.addEventListener('hidden.bs.modal', function() {
                    document.body.removeChild(container);
                });
                
                modal.show();
            } catch (error) {
                console.error("Error al crear modal básico:", error);
                alert("No se pudo mostrar la interfaz de importación. Error: " + error.message);
            }
        }
    }, 1000);
});

// Parte 3: Funcionalidad de importación de respaldo (si el módulo original no está disponible)
// Esta función es un respaldo en caso de que la función original no esté disponible
window.importarRepuestosDesdeCSVSimplificado = async function(archivo) {
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
                
                // Resultado a devolver
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
                
                // Verificar si tenemos acceso al módulo de repuestos
                const repuestosModuleDisponible = window.repuestosModule && 
                    typeof window.repuestosModule.buscarRepuestoPorSku === 'function' &&
                    typeof window.repuestosModule.actualizarRepuesto === 'function' &&
                    typeof window.repuestosModule.agregarRepuesto === 'function';
                
                if (!repuestosModuleDisponible) {
                    reject(new Error('No se puede acceder al módulo de repuestos para procesar el archivo'));
                    return;
                }
                
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
                        
                        // Preparar objeto de repuesto
                        const repuesto = {
                            sku: sku,
                            nombre: nombre,
                            categoria: categoria,
                            stock: stock
                        };
                        
                        // Verificar si el repuesto ya existe
                        const repuestoExistente = window.repuestosModule.buscarRepuestoPorSku(sku);
                        
                        if (repuestoExistente) {
                            // Actualizar repuesto existente
                            repuesto.id = repuestoExistente.id;
                            await window.repuestosModule.actualizarRepuesto(repuesto);
                        } else {
                            // Agregar nuevo repuesto
                            repuesto.id = 'R' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                            await window.repuestosModule.agregarRepuesto(repuesto);
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
};
</script>
