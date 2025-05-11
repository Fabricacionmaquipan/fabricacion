// Sistema de reportes avanzados y personalizables - Versión Simplificada

// Variables y elementos del DOM
const reporteContainer = document.getElementById('reporte-container');
const reporteForm = document.getElementById('reporte-form');
const reporteResult = document.getElementById('reporte-result');

// Tipos de reportes disponibles
const TIPOS_REPORTE = {
    SOLICITUDES_POR_ESTADO: 'solicitudes_por_estado',
    TIEMPO_FABRICACION: 'tiempo_fabricacion',
    PRODUCTOS_MAS_SOLICITADOS: 'productos_mas_solicitados',
    ACTIVIDAD_USUARIOS: 'actividad_usuarios',
    RENDIMIENTO_MENSUAL: 'rendimiento_mensual',
    REPORTE_PERSONALIZADO: 'reporte_personalizado'
};

// Inicializar sistema de reportes
function initReportes() {
    console.log("Inicializando sistema de reportes...");
    
    if (!reporteForm) {
        console.error("Formulario de reportes no encontrado");
        return;
    }
    
    // Configurar evento de envío del formulario
    reporteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Formulario enviado, generando reporte...");
        generarReporte();
    });
    
    // Configurar eventos de cambio en el tipo de reporte
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    if (tipoReporteSelect) {
        tipoReporteSelect.addEventListener('change', actualizarFormularioReporte);
    }
    
    console.log("Sistema de reportes inicializado correctamente");
}

// Actualizar formulario según el tipo de reporte seleccionado
function actualizarFormularioReporte() {
    const tipoReporte = document.getElementById('tipo-reporte').value;
    const opcionesContainer = document.getElementById('opciones-reporte');
    
    console.log("Actualizando formulario para tipo:", tipoReporte);
    
    if (!opcionesContainer) return;
    
    // Limpiar opciones anteriores
    opcionesContainer.innerHTML = '';
    
    // Plantilla básica para todos los tipos de reporte
    opcionesContainer.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Fecha inicio</label>
                <input type="date" class="form-control" name="fecha_inicio" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">Fecha fin</label>
                <input type="date" class="form-control" name="fecha_fin" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">Formato</label>
                <select class="form-select" name="formato">
                    <option value="tabla">Tabla</option>
                    <option value="grafico" selected>Gráfico</option>
                    <option value="ambos">Ambos</option>
                </select>
            </div>
        </div>
    `;
    
    // Establecer fecha actual en los inputs de fecha
    const fechaActual = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Un mes atrás por defecto
    
    const formatoFecha = fecha => {
        return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };
    
    const fechaInicioInputs = document.querySelectorAll('input[name="fecha_inicio"]');
    const fechaFinInputs = document.querySelectorAll('input[name="fecha_fin"]');
    
    fechaInicioInputs.forEach(input => {
        input.value = formatoFecha(fechaInicio);
    });
    
    fechaFinInputs.forEach(input => {
        input.value = formatoFecha(fechaActual);
    });
}

// Generar reporte simple
function generarReporte() {
    console.log("Generando reporte...");
    mostrarSincronizacion('Generando reporte...');
    
    try {
        // Obtener valores del formulario
        const tipoReporte = document.getElementById('tipo-reporte').value;
        
        // Validar tipo de reporte
        if (!tipoReporte) {
            throw new Error('Debe seleccionar un tipo de reporte');
        }
        
        // Obtener elementos de fecha y formato
        const fechaInicio = document.querySelector('input[name="fecha_inicio"]')?.value || '';
        const fechaFin = document.querySelector('input[name="fecha_fin"]')?.value || '';
        const formato = document.querySelector('select[name="formato"]')?.value || 'tabla';
        
        // Validar fechas
        if (!fechaInicio || !fechaFin) {
            throw new Error('Las fechas de inicio y fin son requeridas');
        }
        
        setTimeout(() => {
            generarReporteSimple(tipoReporte, fechaInicio, fechaFin, formato);
            ocultarSincronizacion();
        }, 1000);
        
    } catch (error) {
        mostrarAlerta(`Error al generar reporte: ${error.message}`, 'danger');
        ocultarSincronizacion();
        
        // Limpiar contenedor
        if (reporteResult) {
            reporteResult.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>${error.message}
                </div>
            `;
        }
    }
}

// Generar un reporte simple para demostración
function generarReporteSimple(tipoReporte, fechaInicio, fechaFin, formato) {
    if (!reporteResult) return;
    
    // Crear el contenido del reporte según el tipo
    let reporteHTML = `
        <div class="reporte-header mb-4">
            <h4 class="mb-2">Reporte: ${obtenerNombreReporte(tipoReporte)}</h4>
            <p class="text-muted">Período: ${formatDate(fechaInicio)} al ${formatDate(fechaFin)}</p>
        </div>
    `;
    
    // Añadir contenido según el tipo de reporte
    switch(tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            reporteHTML += generarContenidoSolicitudesPorEstado(formato);
            break;
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            reporteHTML += generarContenidoTiempoFabricacion(formato);
            break;
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            reporteHTML += generarContenidoProductosMasSolicitados(formato);
            break;
        default:
            reporteHTML += `
                <div class="alert alert-info">
                    <p>Se ha generado el reporte "${obtenerNombreReporte(tipoReporte)}" con los siguientes parámetros:</p>
                    <ul>
                        <li>Fecha inicio: ${formatDate(fechaInicio)}</li>
                        <li>Fecha fin: ${formatDate(fechaFin)}</li>
                        <li>Formato: ${formato}</li>
                    </ul>
                </div>
            `;
    }
    
    // Mostrar reporte
    reporteResult.innerHTML = reporteHTML;
    
    // Mostrar alerta de éxito
    mostrarAlerta('Reporte generado correctamente', 'success');
    
    // Inicializar gráficos si es necesario
    if (formato === 'grafico' || formato === 'ambos') {
        inicializarGraficos(tipoReporte);
    }
}

// Obtener nombre amigable del tipo de reporte
function obtenerNombreReporte(tipoReporte) {
    const nombres = {
        'solicitudes_por_estado': 'Solicitudes por Estado',
        'tiempo_fabricacion': 'Tiempo de Fabricación',
        'productos_mas_solicitados': 'Productos más Solicitados',
        'actividad_usuarios': 'Actividad de Usuarios',
        'rendimiento_mensual': 'Rendimiento Mensual',
        'reporte_personalizado': 'Reporte Personalizado'
    };
    
    return nombres[tipoReporte] || tipoReporte;
}

// Formatear fecha YYYY-MM-DD a DD/MM/YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Generar contenido para el reporte de Solicitudes por Estado
function generarContenidoSolicitudesPorEstado(formato) {
    let contenido = '';
    
    // Datos de ejemplo para el reporte
    const datos = {
        'Solicitud enviada por bodega': 12,
        'En fabricación': 8,
        'Entregado': 20
    };
    
    // Generar tabla si es necesario
    if (formato === 'tabla' || formato === 'ambos') {
        contenido += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Solicitudes por Estado</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Solicitud enviada por bodega</td>
                                <td>12</td>
                                <td>30%</td>
                            </tr>
                            <tr>
                                <td>En fabricación</td>
                                <td>8</td>
                                <td>20%</td>
                            </tr>
                            <tr>
                                <td>Entregado</td>
                                <td>20</td>
                                <td>50%</td>
                            </tr>
                            <tr class="table-secondary fw-bold">
                                <td>Total</td>
                                <td>40</td>
                                <td>100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Generar gráfico si es necesario
    if (formato === 'grafico' || formato === 'ambos') {
        contenido += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Distribución por Estado</h5>
                </div>
                <div class="card-body">
                    <div style="height: 300px;">
                        <canvas id="grafico-estados"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    return contenido;
}

// Generar contenido para el reporte de Tiempo de Fabricación
function generarContenidoTiempoFabricacion(formato) {
    let contenido = '';
    
    // Contenido básico para todos los formatos
    contenido += `
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="metric-card">
                    <span class="metric-value">4.5</span>
                    <span class="metric-label">Días promedio de fabricación</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="metric-card">
                    <span class="metric-value">30</span>
                    <span class="metric-label">Solicitudes analizadas</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="metric-card">
                    <span class="metric-value">12</span>
                    <span class="metric-label">Productos diferentes</span>
                </div>
            </div>
        </div>
    `;
    
    // Generar gráfico si es necesario
    if (formato === 'grafico' || formato === 'ambos') {
        contenido += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Tiempo promedio por producto</h5>
                </div>
                <div class="card-body">
                    <div style="height: 300px;">
                        <canvas id="grafico-tiempo"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    return contenido;
}

// Generar contenido para el reporte de Productos más Solicitados
function generarContenidoProductosMasSolicitados(formato) {
    let contenido = '';
    
    // Generar tabla si es necesario
    if (formato === 'tabla' || formato === 'ambos') {
        contenido += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Top 5 Productos más Solicitados</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>% del Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Producto A</td>
                                <td>85</td>
                                <td>32%</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Producto B</td>
                                <td>65</td>
                                <td>24%</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Producto C</td>
                                <td>45</td>
                                <td>17%</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Producto D</td>
                                <td>38</td>
                                <td>14%</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Producto E</td>
                                <td>35</td>
                                <td>13%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Generar gráfico si es necesario
    if (formato === 'grafico' || formato === 'ambos') {
        contenido += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Distribución de Productos</h5>
                </div>
                <div class="card-body">
                    <div style="height: 300px;">
                        <canvas id="grafico-productos"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    return contenido;
}

// Inicializar gráficos en el reporte
function inicializarGraficos(tipoReporte) {
    switch(tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            // Gráfico de dona para distribución de estados
            const ctxEstados = document.getElementById('grafico-estados');
            if (ctxEstados) {
                new Chart(ctxEstados, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pendientes', 'En Fabricación', 'Entregadas'],
                        datasets: [{
                            data: [12, 8, 20],
                            backgroundColor: ['#3498db', '#f39c12', '#2ecc71']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
            break;
            
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            // Gráfico de barras horizontales para tiempo por producto
            const ctxTiempo = document.getElementById('grafico-tiempo');
            if (ctxTiempo) {
                new Chart(ctxTiempo, {
                    type: 'bar',
                    data: {
                        labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E'],
                        datasets: [{
                            label: 'Días promedio',
                            data: [5.2, 4.8, 3.7, 6.1, 2.9],
                            backgroundColor: '#3498db'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y'
                    }
                });
            }
            break;
            
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            // Gráfico de barras para productos más solicitados
            const ctxProductos = document.getElementById('grafico-productos');
            if (ctxProductos) {
                new Chart(ctxProductos, {
                    type: 'bar',
                    data: {
                        labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E'],
                        datasets: [{
                            label: 'Cantidad',
                            data: [85, 65, 45, 38, 35],
                            backgroundColor: [
                                '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
            break;
    }
}

// Exponer funciones al ámbito global
window.reportes = {
    init: initReportes,
    generarReporte,
    TIPOS_REPORTE
};

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.reportes !== 'undefined' && typeof window.reportes.init === 'function') {
        window.reportes.init();
    }
});
