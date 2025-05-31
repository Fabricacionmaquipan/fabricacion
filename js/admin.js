// Generador de reporte: Reporte Personalizado
function generarReportePersonalizado(params) {
    // Filtrar solicitudes por rango de fechas y estado
    let solicitudesFiltradas = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin);
    });
    
    // Filtrar por estado si se especificó
    if (params.filtroEstado) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => s.estado === params.filtroEstado);
    }
    
    // Ordenar solicitudes según criterio
    const [campoOrden, direccion] = params.ordenarPor.split('_');
    
    solicitudesFiltradas.sort((a, b) => {
        let valorA, valorB;
        
        // Manejar diferentes tipos de campos
        if (campoOrden === 'fechaSolicitud') {
            valorA = new Date(a.fechaSolicitud);
            valorB = new Date(b.fechaSolicitud);
        } else {
            valorA = a[campoOrden];
            valorB = b[campoOrden];
            
            // Convertir a string para comparación (si no son fechas)
            if (valorA !== undefined && valorA !== null) valorA = valorA.toString().toLowerCase();
            if (valorB !== undefined && valorB !== null) valorB = valorB.toString().toLowerCase();
        }
        
        // Ordenar en dirección adecuada
        if (direccion === 'asc') {
            return valorA > valorB ? 1 : -1;
        } else {
            return valorA < valorB ? 1 : -1;
        }
    });
    
    // Generar resultado
    if (!reporteResult) return;
    
    // Limpiar contenedor
    reporteResult.innerHTML = '';
    
    // Título del reporte
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `
        <i class="fas fa-clipboard-list me-2"></i>
        Reporte Personalizado
        <small class="d-block text-muted">
            Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}
            ${params.filtroEstado ? ` | Estado: ${params.filtroEstado}` : ''}
        </small>
    `;
    reporteResult.appendChild(titulo);
    
    // Acciones para el reporte
    const accionesDiv = document.createElement('div');
    accionesDiv.className = 'reporte-acciones d-flex justify-content-end gap-2 mb-3';
    accionesDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="csv">
            <i class="fas fa-file-csv me-1"></i> CSV
        </button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="excel">
            <i class="fas fa-file-excel me-1"></i> Excel
        </button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="pdf">
            <i class="fas fa-file-pdf me-1"></i> PDF
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.print()">
            <i class="fas fa-print me-1"></i> Imprimir
        </button>
    `;
    reporteResult.appendChild(accionesDiv);
    
    // Verificar si hay datos
    if (solicitudesFiltradas.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'alert alert-info';
        noDataDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>No hay datos</strong>
            <p>No se encontraron solicitudes para los criterios seleccionados.</p>
        `;
        reporteResult.appendChild(noDataDiv);
        return;
    }
    
    // Crear tabla
    const tablaContainer = document.createElement('div');
    tablaContainer.className = 'table-responsive mb-4';
    
    const tabla = document.createElement('table');
    tabla.className = 'table table-bordered table-hover table-sm';
    
    // Construir encabezado basado en campos seleccionados
    let thead = '<thead><tr>';
    
    // Mapeo de nombres de campos a nombres amigables
    const nombresCampos = {
        'id': 'ID',
        'notaVenta': 'Nota de Venta',
        'fechaSolicitud': 'Fecha',
        'estado': 'Estado',
        'observaciones': 'Observaciones',
        'items': 'Productos',
        'creadoPor': 'Creado Por',
        'historial': 'Historial',
        'tiempoFabricacion': 'Tiempo (días)'
    };
    
    params.campos.forEach(campo => {
        thead += `<th>${nombresCampos[campo] || campo}</th>`;
    });
    
    thead += '</tr></thead>';
    
    // Cuerpo
    let tbody = '<tbody>';
    
    solicitudesFiltradas.forEach(solicitud => {
        tbody += '<tr>';
        
        params.campos.forEach(campo => {
            let contenido = '';
            
            // Formatear contenido según el tipo de campo
            switch (campo) {
                case 'id':
                    contenido = solicitud.id;
                    break;
                    
                case 'notaVenta':
                    contenido = solicitud.notaVenta;
                    break;
                    
                case 'fechaSolicitud':
                    contenido = formatDate(solicitud.fechaSolicitud);
                    break;
                    
                case 'estado':
                    // Agregar clase para colorear según estado
                    let estadoClase;
                    
                    switch (solicitud.estado) {
                        case 'Solicitud enviada por bodega':
                            estadoClase = 'primary';
                            break;
                        case 'En fabricación':
                            estadoClase = 'warning';
                            break;
                        case 'Entregado':
                            estadoClase = 'success';
                            break;
                        default:
                            estadoClase = 'secondary';
                    }
                    
                    contenido = `<span class="badge bg-${estadoClase}">${solicitud.estado}</span>`;
                    break;
                    
                case 'observaciones':
                    contenido = solicitud.observaciones || '<span class="text-muted">Sin observaciones</span>';
                    break;
                    
                case 'items':
                    // Mostrar los productos como lista
                    if (solicitud.items && solicitud.items.length > 0) {
                        contenido = '<ul class="mb-0 ps-3">';
                        solicitud.items.forEach(item => {
                            contenido += `<li>${item.producto} (${item.cantidad})</li>`;
                        });
                        contenido += '</ul>';
                    } else {
                        contenido = '<span class="text-muted">Sin productos</span>';
                    }
                    break;
                    
                case 'creadoPor':
                    contenido = solicitud.creadoPor ? solicitud.creadoPor.displayName : 'Desconocido';
                    break;
                    
                case 'historial':
                    // Mostrar último cambio de estado
                    if (solicitud.historial && solicitud.historial.length > 0) {
                        const ultimoHistorial = solicitud.historial[solicitud.historial.length - 1];
                        const fechaUltimo = new Date(ultimoHistorial.fecha);
                        
                        contenido = `
                            <div class="small">
                                <div><strong>${ultimoHistorial.estado}</strong></div>
                                <div>${fechaUltimo.toLocaleDateString()}</div>
                                <div class="text-muted">${ultimoHistorial.usuario || 'N/A'}</div>
                            </div>
                        `;
                    } else {
                        contenido = '<span class="text-muted">Sin historial</span>';
                    }
                    break;
                    
                case 'tiempoFabricacion':
                    // Calcular tiempo de fabricación
                    if (solicitud.estado === 'Entregado' && solicitud.historial && solicitud.historial.length >= 2) {
                        const fechaCreacion = new Date(solicitud.historial[0].fecha);
                        const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
                        
                        if (entregaHistorial) {
                            const fechaEntrega = new Date(entregaHistorial.fecha);
                            const tiempoFabricacionMs = fechaEntrega - fechaCreacion;
                            const diasFabricacion = tiempoFabricacionMs / (1000 * 60 * 60 * 24);
                            
                            contenido = diasFabricacion.toFixed(1);
                        } else {
                            contenido = 'N/A';
                        }
                    } else {
                        contenido = 'En proceso';
                    }
                    break;
                    
                default:
                    contenido = solicitud[campo] !== undefined ? solicitud[campo] : 'N/A';
            }
            
            tbody += `<td>${contenido}</td>`;
        });
        
        tbody += '</tr>';
    });
    
    tbody += '</tbody>';
    
    tabla.innerHTML = thead + tbody;
    tablaContainer.appendChild(tabla);
    reporteResult.appendChild(tablaContainer);
    
    // Añadir resumen
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'alert alert-info mt-3';
    
    const solicitudesPendientes = solicitudesFiltradas.filter(s => s.estado === 'Solicitud enviada por bodega').length;
    const solicitudesFabricacion = solicitudesFiltradas.filter(s => s.estado === 'En fabricación').length;
    const solicitudesEntregadas = solicitudesFiltradas.filter(s => s.estado === 'Entregado').length;
    
    resumenDiv.innerHTML = `
        <h5><i class="fas fa-info-circle me-2"></i>Resumen</h5>
        <p>Total de solicitudes: <strong>${solicitudesFiltradas.length}</strong></p>
        <p>Distribución por estado:</p>
        <ul>
            <li>Pendientes: ${solicitudesPendientes}</li>
            <li>En fabricación: ${solicitudesFabricacion}</li>
            <li>Entregadas: ${solicitudesEntregadas}</li>
        </ul>
    `;
    
    reporteResult.appendChild(resumenDiv);
    
    // Configurar eventos de exportación
    reporteResult.querySelectorAll('.exportar-reporte').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            exportarReporte('Reporte Personalizado', solicitudesFiltradas, formato);
        });
    });
    
    // Si se solicitó un formato específico, realizar la exportación automáticamente
    if (params.formatoSalida && params.formatoSalida !== 'html') {
        setTimeout(() => {
            // Asegurarse que exportarReporte esté definida
            if (typeof exportarReporte === 'function') {
                exportarReporte('Reporte Personalizado', solicitudesFiltradas, params.formatoSalida);
            } else {
                console.error("La función exportarReporte no está definida.");
            }
        }, 1000);
    }
} // Generador de reporte: Rendimiento Mensual
function generarReporteRendimientoMensual(params) {
    // Obtener todas las solicitudes del año seleccionado
    const anio = params.anio;
    
    const solicitudesAnio = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud.getFullYear().toString() === anio;
    });
    
    // Inicializar datos mensuales
    const datosMensuales = [];
    const nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Obtener mes actual para proyecciones
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth(); // 0-11
    const anioActual = fechaActual.getFullYear();
    
    // Determinar si el año seleccionado es el actual
    const esAnioActual = parseInt(anio) === anioActual;
    
    // Procesar datos para cada mes
    for (let mes = 0; mes < 12; mes++) {
        const solicitudesMes = solicitudesAnio.filter(s => {
            const fechaSolicitud = new Date(s.fechaSolicitud);
            return fechaSolicitud.getMonth() === mes;
        });
        
        const solicitudesCompletadas = solicitudesMes.filter(s => s.estado === 'Entregado');
        
        // Calcular tiempo promedio de fabricación
        let tiempoTotalMs = 0;
        
        solicitudesCompletadas.forEach(solicitud => {
            if (solicitud.historial && solicitud.historial.length >= 2) {
                const fechaCreacion = new Date(solicitud.historial[0].fecha);
                const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
                
                if (entregaHistorial) {
                    const fechaEntrega = new Date(entregaHistorial.fecha);
                    tiempoTotalMs += fechaEntrega - fechaCreacion;
                }
            }
        });
        
        const tiempoPromedioMs = solicitudesCompletadas.length > 0 ? tiempoTotalMs / solicitudesCompletadas.length : 0;
        const diasPromedio = tiempoPromedioMs / (1000 * 60 * 60 * 24);
        
        // Determinar si este mes es futuro respecto al mes actual
        const esMesFuturo = esAnioActual && mes > mesActual;
        
        // Añadir datos del mes
        datosMensuales.push({
            mes: mes + 1, // 1-12
            nombreMes: nombresMes[mes],
            solicitudes: solicitudesMes.length,
            completadas: solicitudesCompletadas.length,
            diasPromedio: diasPromedio,
            proyeccion: esMesFuturo
        });
    }
    
    // Si se solicita proyección, calcularla para meses futuros
    if (params.incluirProyeccion && esAnioActual) {
        // Calcular promedio de los últimos 3 meses para proyección
        const mesesDisponibles = datosMensuales.filter(d => !d.proyeccion);
        
        if (mesesDisponibles.length > 0) {
            // Usar los últimos tres meses o todos si hay menos
            const ultimosMeses = mesesDisponibles.slice(-3);
            
            const promedioSolicitudes = ultimosMeses.reduce((sum, m) => sum + m.solicitudes, 0) / ultimosMeses.length;
            const promedioCompletadas = ultimosMeses.reduce((sum, m) => sum + m.completadas, 0) / ultimosMeses.length;
            const promedioDias = ultimosMeses.reduce((sum, m) => sum + m.diasPromedio, 0) / ultimosMeses.length;
            
            // Aplicar proyección a meses futuros
            datosMensuales.forEach(mes => {
                if (mes.proyeccion) {
                    mes.solicitudes = Math.round(promedioSolicitudes);
                    mes.completadas = Math.round(promedioCompletadas);
                    mes.diasPromedio = promedioDias;
                }
            });
        }
    }
    
    // Determinar qué métrica mostrar como principal
    const metricaTitulo = {
        'solicitudes': 'Total de Solicitudes',
        'completadas': 'Solicitudes Completadas',
        'tiempo': 'Tiempo Promedio de Fabricación (días)'
    };
    
    // Generar resultado
    if (!reporteResult) return;
    
    // Limpiar contenedor
    reporteResult.innerHTML = '';
    
    // Título del reporte
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `
        <i class="fas fa-chart-line me-2"></i>
        Reporte de Rendimiento Mensual ${anio}
        <small class="d-block text-muted">
            Métrica principal: ${metricaTitulo[params.metrica] || 'Total de Solicitudes'}
            ${params.incluirProyeccion && esAnioActual ? ' (incluye proyección)' : ''}
        </small>
    `;
    reporteResult.appendChild(titulo);
    
    // Acciones para el reporte
    const accionesDiv = document.createElement('div');
    accionesDiv.className = 'reporte-acciones d-flex justify-content-end gap-2 mb-3';
    accionesDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="csv">
            <i class="fas fa-file-csv me-1"></i> CSV
        </button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="excel">
            <i class="fas fa-file-excel me-1"></i> Excel
        </button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte" data-formato="pdf">
            <i class="fas fa-file-pdf me-1"></i> PDF
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.print()">
            <i class="fas fa-print me-1"></i> Imprimir
        </button>
    `;
    reporteResult.appendChild(accionesDiv);
    
    // Resumen anual
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'card mb-4';
    
    // Calcular totales anuales (excluyendo proyecciones)
    const datosSinProyeccion = datosMensuales.filter(d => !d.proyeccion);
    
    const totalSolicitudes = datosSinProyeccion.reduce((sum, m) => sum + m.solicitudes, 0);
    const totalCompletadas = datosSinProyeccion.reduce((sum, m) => sum + m.completadas, 0);
    
    // Calcular tasa de completitud y promedio de días
    const tasaCompletitud = totalSolicitudes > 0 ? (totalCompletadas / totalSolicitudes) * 100 : 0;
    const diasPromedioAnual = datosSinProyeccion.reduce((sum, m) => sum + (m.diasPromedio * m.completadas), 0) / 
                             (totalCompletadas > 0 ? totalCompletadas : 1);
    
    resumenDiv.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Resumen Anual ${anio} ${esAnioActual ? '(Hasta la fecha)' : ''}</h5>
            <div class="row">
                <div class="col-md-3">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${totalSolicitudes}</span>
                        <span class="metric-label">Solicitudes Totales</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${totalCompletadas}</span>
                        <span class="metric-label">Solicitudes Completadas</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${tasaCompletitud.toFixed(1)}%</span>
                        <span class="metric-label">Tasa de Completitud</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${diasPromedioAnual.toFixed(1)}</span>
                        <span class="metric-label">Días Promedio</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reporteResult.appendChild(resumenDiv);
    
    // Mostrar resultados según formato seleccionado
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        // Crear tabla
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'table-responsive mb-4';
        
        const tabla = document.createElement('table');
        tabla.className = 'table table-bordered table-hover';
        
        // Encabezado
        let thead = `<thead><tr>
            <th>Mes</th>
            <th>Solicitudes</th>
            <th>Completadas</th>
            <th>Completitud</th>
            <th>Días Promedio</th>
        </tr></thead>`;
        
        // Cuerpo
        let tbody = '<tbody>';
        
        datosMensuales.forEach(mes => {
            const tasaCompletitudMes = mes.solicitudes > 0 ? (mes.completadas / mes.solicitudes) * 100 : 0;
            
            const rowClass = mes.proyeccion ? 'table-light text-muted' : '';
            const proyeccionLabel = mes.proyeccion ? ' <small>(Proyección)</small>' : '';
            
            tbody += `<tr class="${rowClass}">
                <td>${mes.nombreMes}${proyeccionLabel}</td>
                <td>${mes.solicitudes}</td>
                <td>${mes.completadas}</td>
                <td>${tasaCompletitudMes.toFixed(1)}%</td>
                <td>${mes.diasPromedio.toFixed(1)}</td>
            </tr>`;
        });
        
        tbody += '</tbody>';
        
        tabla.innerHTML = thead + tbody;
        tablaContainer.appendChild(tabla);
        reporteResult.appendChild(tablaContainer);
    }
    
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        // Crear contenedor para el gráfico principal
        const graficoContainer = document.createElement('div');
        graficoContainer.className = 'grafico-container mb-4';
        graficoContainer.style.height = '400px';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'grafico-rendimiento-mensual';
        graficoContainer.appendChild(canvas);
        
        reporteResult.appendChild(graficoContainer);
        
        // Obtener la métrica según el parámetro
        const metrica = params.metrica || 'solicitudes';
        let datos, labelY, color;
        
        switch (metrica) {
            case 'completadas':
                datos = datosMensuales.map(m => m.completadas);
                labelY = 'Solicitudes Completadas';
                color = '#2ecc71';
                break;
            case 'tiempo':
                datos = datosMensuales.map(m => m.diasPromedio);
                labelY = 'Días Promedio';
                color = '#f39c12';
                break;
            default: // solicitudes
                datos = datosMensuales.map(m => m.solicitudes);
                labelY = 'Total de Solicitudes';
                color = '#3498db';
        }
        
        // Separar datos reales y proyecciones para diferentes estilos
        const labels = datosMensuales.map(m => m.nombreMes);
        const datosReales = [];
        const datosProyectados = [];
        
        datosMensuales.forEach((mes, index) => {
            if (mes.proyeccion) {
                datosReales.push(null); // Dejar espacio vacío para reales
                datosProyectados.push(datos[index]);
            } else {
                datosReales.push(datos[index]);
                datosProyectados.push(null); // Dejar espacio vacío para proyecciones
            }
        });
        
        // Crear gráfico
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `${labelY} (Real)`,
                        data: datosReales,
                        borderColor: color,
                        backgroundColor: `${color}20`, // Usar una versión más transparente del color
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: `${labelY} (Proyección)`,
                        data: datosProyectados,
                        borderColor: `${color}80`, // Usar una versión más transparente del color para la línea
                        backgroundColor: `${color}10`, // Usar una versión aún más transparente para el relleno
                        borderWidth: 2,
                        borderDash: [5, 5], // Línea punteada para proyecciones
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${metricaTitulo[metrica]} por Mes`
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: labelY
                        }
                    }
                }
            }
        });
        
        // Crear gráfico comparativo con todas las métricas
        const graficoComparativoContainer = document.createElement('div');
        graficoComparativoContainer.className = 'grafico-container mt-4 mb-4';
        graficoComparativoContainer.style.height = '400px';
        
        const canvasComparativo = document.createElement('canvas');
        canvasComparativo.id = 'grafico-comparativo-mensual';
        graficoComparativoContainer.appendChild(canvasComparativo);
        
        // Título del segundo gráfico
        const tituloGrafico2 = document.createElement('h5');
        tituloGrafico2.className = 'mb-3 mt-4';
        tituloGrafico2.textContent = 'Comparativa de Métricas';
        
        reporteResult.appendChild(tituloGrafico2);
        reporteResult.appendChild(graficoComparativoContainer);
        
        // Crear datasets para el gráfico comparativo
        const solicitudesDataset = {
            label: 'Solicitudes',
            data: datosMensuales.map(m => m.solicitudes),
            backgroundColor: '#3498db',
            borderWidth: 1,
            yAxisID: 'y' // Asociar al eje Y principal
        };
        
        const completadasDataset = {
            label: 'Completadas',
            data: datosMensuales.map(m => m.completadas),
            backgroundColor: '#2ecc71',
            borderWidth: 1,
            yAxisID: 'y' // Asociar al eje Y principal
        };
        
        const diasPromedioDataset = {
            label: 'Días Promedio',
            data: datosMensuales.map(m => m.diasPromedio.toFixed(1)), // Asegurar que sea número
            type: 'line', // Mostrar como línea
            borderColor: '#e74c3c',
            backgroundColor: 'transparent', // Línea sin relleno
            borderWidth: 2,
            yAxisID: 'y1', // Asociar a un segundo eje Y
            tension: 0.3
        };
        
        new Chart(canvasComparativo, {
            type: 'bar', // Gráfico de barras como base
            data: {
                labels: labels,
                datasets: [solicitudesDataset, completadasDataset, diasPromedioDataset]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: { // Eje Y principal (izquierda) para cantidades
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    },
                    y1: { // Eje Y secundario (derecha) para días
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Días'
                        },
                        grid: {
                            drawOnChartArea: false // No dibujar cuadrícula para este eje
                        }
                    }
                }
            }
        });
    }
    
    // Configurar eventos de exportación
    reporteResult.querySelectorAll('.exportar-reporte').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            // Asegurarse que exportarReporte esté definida
            if (typeof exportarReporte === 'function') {
                exportarReporte('Rendimiento Mensual', datosMensuales, formato);
            } else {
                console.error("La función exportarReporte no está definida.");
            }
        });
    });
}
// Sistema de reportes avanzados y personalizables

// Variables y elementos del DOM
const reporteFormElem = document.getElementById('reporte-form'); // Renombrado para evitar conflicto con la variable global
const reporteResultElem = document.getElementById('reporte-result'); // Renombrado

// Tipos de reportes disponibles (ya definidos, asegurarse que estén accesibles o re-definirlos aquí si es un módulo aislado)
// const TIPOS_REPORTE = { ... }; // Asumiendo que ya existe globalmente

// ==================== FUNCIONES DE INICIALIZACIÓN Y UI ====================

// Inicializar sistema de reportes
function initReportesModule() { // Renombrada para evitar conflicto
    console.log("Inicializando sistema de reportes...");
    
    if (!reporteFormElem) {
        console.error("Formulario de reportes no encontrado");
        return;
    }
    
    // Configurar evento de envío del formulario
    reporteFormElem.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Formulario enviado, generando reporte...");
        generarReporte(); // Esta función debe estar definida
    });
    
    // Configurar eventos de cambio en el tipo de reporte
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    if (tipoReporteSelect) {
        tipoReporteSelect.addEventListener('change', actualizarFormularioReporte); // Esta función debe estar definida
        actualizarFormularioReporte(); // Inicializar el formulario
    }
    
    console.log("Sistema de reportes inicializado correctamente");
}

// Actualizar formulario según el tipo de reporte seleccionado
function actualizarFormularioReporte() { // Esta función ya existe, solo asegúrate que use los elementos correctos
    const tipoReporte = document.getElementById('tipo-reporte').value;
    const opcionesContainer = document.getElementById('opciones-reporte');
    
    console.log("Actualizando formulario para tipo:", tipoReporte);
    
    if (!opcionesContainer) return;
    
    // Limpiar opciones anteriores
    opcionesContainer.innerHTML = '';
    
    // Obtener usuarios para el select (asumiendo que 'usuarios' está disponible globalmente o se carga)
    let usuariosOptions = '';
    if (typeof usuarios !== 'undefined' && Array.isArray(usuarios)) {
        usuariosOptions = usuarios.map(u => `<option value="${u.id || u.username}">${u.displayName} (${u.username})</option>`).join('');
    } else {
        console.warn("La variable 'usuarios' no está disponible para el filtro de reportes.");
    }

    // Mostrar opciones según el tipo de reporte (tu lógica existente para cada case)
    switch (tipoReporte) {
        case 'solicitudes_por_estado': // Usar TIPOS_REPORTE.SOLICITUDES_POR_ESTADO si está definido globalmente
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
                        <label class="form-label">Agrupar por</label>
                        <select class="form-select" name="agrupar_por">
                            <option value="dia">Día</option>
                            <option value="semana">Semana</option>
                            <option value="mes" selected>Mes</option>
                        </select>
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
            break;
            
        case 'tiempo_fabricacion': // Usar TIPOS_REPORTE.TIEMPO_FABRICACION
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
                        <label class="form-label">Agrupar por producto</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="agrupar_producto" checked>
                            <label class="form-check-label">Mostrar desglose por producto</label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Formato</label>
                        <select class="form-select" name="formato">
                            <option value="tabla">Tabla</option>
                            <option value="grafico">Gráfico</option>
                            <option value="ambos" selected>Ambos</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 'productos_mas_solicitados': // Usar TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS
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
                        <label class="form-label">Cantidad de productos</label>
                        <input type="number" class="form-control" name="limite" value="10" min="1" max="50">
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
            break;
            
        case 'actividad_usuarios': // Usar TIPOS_REPORTE.ACTIVIDAD_USUARIOS
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
                        <label class="form-label">Usuario</label>
                        <select class="form-select" name="usuario_id">
                            <option value="">Todos los usuarios</option>
                            ${usuariosOptions}
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Formato</label>
                        <select class="form-select" name="formato">
                            <option value="tabla" selected>Tabla</option>
                            <option value="grafico">Gráfico</option>
                            <option value="ambos">Ambos</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 'rendimiento_mensual': // Usar TIPOS_REPORTE.RENDIMIENTO_MENSUAL
            opcionesContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Año</label>
                        <select class="form-select" name="anio">
                            <option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>
                            <option value="${new Date().getFullYear()-1}">${new Date().getFullYear()-1}</option>
                            <option value="${new Date().getFullYear()-2}">${new Date().getFullYear()-2}</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Métrica principal</label>
                        <select class="form-select" name="metrica">
                            <option value="solicitudes">Total de solicitudes</option>
                            <option value="completadas">Solicitudes completadas</option>
                            <option value="tiempo">Tiempo promedio de fabricación</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Incluir proyección</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="incluir_proyeccion" checked>
                            <label class="form-check-label">Mostrar proyección para meses futuros</label>
                        </div>
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
            break;
            
        case 'reporte_personalizado': // Usar TIPOS_REPORTE.REPORTE_PERSONALIZADO
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
                    
                    <div class="col-md-12">
                        <label class="form-label">Campos a incluir</label>
                        <div class="row g-2">
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="id" checked>
                                    <label class="form-check-label">ID</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="notaVenta" checked>
                                    <label class="form-check-label">Nota de Venta</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="fechaSolicitud" checked>
                                    <label class="form-check-label">Fecha de Solicitud</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="estado" checked>
                                    <label class="form-check-label">Estado</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="observaciones" checked>
                                    <label class="form-check-label">Observaciones</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="items" checked>
                                    <label class="form-check-label">Productos</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="creadoPor" checked>
                                    <label class="form-check-label">Creado Por</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="historial" checked>
                                    <label class="form-check-label">Historial</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="campos" value="tiempoFabricacion">
                                    <label class="form-check-label">Tiempo de Fabricación</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <label class="form-label">Filtrar por estado</label>
                        <select class="form-select" name="filtro_estado">
                            <option value="">Todos los estados</option>
                            <option value="Solicitud enviada por bodega">Solicitud enviada por bodega</option>
                            <option value="En fabricación">En fabricación</option>
                            <option value="Entregado">Entregado</option>
                        </select>
                    </div>
                    
                    <div class="col-md-6">
                        <label class="form-label">Ordenar por</label>
                        <select class="form-select" name="ordenar_por">
                            <option value="fechaSolicitud_desc">Fecha (más recientes primero)</option>
                            <option value="fechaSolicitud_asc">Fecha (más antiguas primero)</option>
                            <option value="notaVenta_asc">Nota de Venta (A-Z)</option>
                            <option value="estado_asc">Estado (A-Z)</option>
                        </select>
                    </div>
                    
                    <div class="col-md-6">
                        <label class="form-label">Formato de Salida</label>
                        <select class="form-select" name="formato_salida">
                            <option value="html" selected>HTML (en pantalla)</option>
                            <option value="csv">CSV</option>
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel (XLSX)</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        default:
            opcionesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>Por favor, selecciona un tipo de reporte
                </div>
            `;
    }
    
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
        if (!input.value) input.value = formatoFecha(fechaInicio);
    });
    
    fechaFinInputs.forEach(input => {
        if (!input.value) input.value = formatoFecha(fechaActual);
    });
}

// ==================== FUNCIONES DE CONTROL PRINCIPAL ====================

// Generar reporte según los parámetros
function generarReporte() { // Esta función ya existe
    console.log("Generando reporte...");
    // mostrarSincronizacion('Generando reporte...'); // Asegúrate que esta función esté definida globalmente o aquí
    
    try {
        // Obtener valores del formulario
        const tipoReporte = document.getElementById('tipo-reporte').value;
        
        // Validar tipo de reporte
        if (!tipoReporte) {
            throw new Error('Debe seleccionar un tipo de reporte');
        }
        
        // Obtener parámetros según tipo de reporte
        const params = obtenerParametrosReporte(tipoReporte); // Esta función debe estar definida
        
        // Definiciones de TIPOS_REPORTE si no están globales
        const TIPOS_REPORTE_LOCAL = {
            SOLICITUDES_POR_ESTADO: 'solicitudes_por_estado',
            TIEMPO_FABRICACION: 'tiempo_fabricacion',
            PRODUCTOS_MAS_SOLICITADOS: 'productos_mas_solicitados',
            ACTIVIDAD_USUARIOS: 'actividad_usuarios',
            RENDIMIENTO_MENSUAL: 'rendimiento_mensual',
            REPORTE_PERSONALIZADO: 'reporte_personalizado'
        };

        // Generar reporte
        switch (tipoReporte) {
            case TIPOS_REPORTE_LOCAL.SOLICITUDES_POR_ESTADO:
                generarReporteSolicitudesPorEstado(params); // Esta función debe estar definida
                break;
                
            case TIPOS_REPORTE_LOCAL.TIEMPO_FABRICACION:
                // generarReporteTiempoFabricacion(params); // Implementar esta función
                if (reporteResultElem) reporteResultElem.innerHTML = `<div class="alert alert-warning">Reporte de Tiempo de Fabricación no implementado aún.</div>`;
                break;
                
            case TIPOS_REPORTE_LOCAL.PRODUCTOS_MAS_SOLICITADOS:
                // generarReporteProductosMasSolicitados(params); // Implementar esta función
                if (reporteResultElem) reporteResultElem.innerHTML = `<div class="alert alert-warning">Reporte de Productos Más Solicitados no implementado aún.</div>`;
                break;
                
            case TIPOS_REPORTE_LOCAL.ACTIVIDAD_USUARIOS:
                // generarReporteActividadUsuarios(params); // Implementar esta función
                if (reporteResultElem) reporteResultElem.innerHTML = `<div class="alert alert-warning">Reporte de Actividad de Usuarios no implementado aún.</div>`;
                break;
                
            case TIPOS_REPORTE_LOCAL.RENDIMIENTO_MENSUAL:
                generarReporteRendimientoMensual(params); // Esta función debe estar definida
                break;
                
            case TIPOS_REPORTE_LOCAL.REPORTE_PERSONALIZADO:
                generarReportePersonalizado(params); // Esta función debe estar definida
                break;
                
            default:
                throw new Error('Tipo de reporte no válido');
        }
        
        // Registrar en sistema de auditoría si está disponible
        if (window.auditoria && typeof window.auditoria.registrarEvento === 'function') {
            window.auditoria.registrarEvento(
                window.auditoria.TIPO_EVENTO.EXPORTAR, // O VER, según la acción
                window.auditoria.ENTIDAD.REPORTE,
                null,
                `Generación de reporte: ${tipoReporte}`,
                params
            );
        }
        
        // ocultarSincronizacion(); // Asegúrate que esta función esté definida
        
    } catch (error) {
        // mostrarAlerta(`Error al generar reporte: ${error.message}`, 'danger'); // Asegúrate que esta función esté definida
        console.error('Error al generar reporte:', error);
        
        // Limpiar contenedor
        if (reporteResultElem) {
            reporteResultElem.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>${error.message}
                </div>
            `;
        }
        
        // ocultarSincronizacion(); // Asegúrate que esta función esté definida
    }
}

// Obtener parámetros del formulario según tipo de reporte
function obtenerParametrosReporte(tipoReporte) { // Esta función ya existe
    const params = {};
    const form = reporteFormElem; // Usar la variable renombrada

    // Parámetros comunes
    const fechaInicioEl = form.querySelector('input[name="fecha_inicio"]');
    const fechaFinEl = form.querySelector('input[name="fecha_fin"]');
    
    if (fechaInicioEl && fechaFinEl) {
        params.fechaInicio = fechaInicioEl.value;
        params.fechaFin = fechaFinEl.value;
        if (!params.fechaInicio || !params.fechaFin) {
            // No lanzar error aquí si el reporte no usa fechas (ej. rendimiento mensual solo usa año)
            if (['solicitudes_por_estado', 'tiempo_fabricacion', 'productos_mas_solicitados', 'actividad_usuarios', 'reporte_personalizado'].includes(tipoReporte)) {
                 throw new Error('Las fechas de inicio y fin son requeridas para este reporte');
            }
        }
        if (params.fechaInicio && params.fechaFin && new Date(params.fechaInicio) > new Date(params.fechaFin)) {
            throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
        }
    }
    
    // Parámetros específicos
    switch (tipoReporte) {
        case 'solicitudes_por_estado':
            params.agruparPor = form.querySelector('select[name="agrupar_por"]').value;
            params.formato = form.querySelector('select[name="formato"]').value;
            break;
        case 'tiempo_fabricacion':
            params.agruparPorProducto = form.querySelector('input[name="agrupar_producto"]').checked;
            params.formato = form.querySelector('select[name="formato"]').value;
            break;
        case 'productos_mas_solicitados':
            params.limite = parseInt(form.querySelector('input[name="limite"]').value);
            params.formato = form.querySelector('select[name="formato"]').value;
            break;
        case 'actividad_usuarios':
            params.usuarioId = form.querySelector('select[name="usuario_id"]').value;
            params.formato = form.querySelector('select[name="formato"]').value;
            break;
        case 'rendimiento_mensual':
            params.anio = form.querySelector('select[name="anio"]').value;
            params.incluirProyeccion = form.querySelector('input[name="incluir_proyeccion"]').checked;
            params.metrica = form.querySelector('select[name="metrica"]').value;
            params.formato = form.querySelector('select[name="formato"]').value;
            break;
        case 'reporte_personalizado':
            params.campos = Array.from(form.querySelectorAll('input[name="campos"]:checked')).map(c => c.value);
            params.filtroEstado = form.querySelector('select[name="filtro_estado"]').value;
            params.ordenarPor = form.querySelector('select[name="ordenar_por"]').value;
            params.formatoSalida = form.querySelector('select[name="formato_salida"]').value;
            break;
    }
    return params;
}


// ==================== FUNCIONES DE GENERACIÓN DE REPORTES (IMPLEMENTACIONES) ====================
// (generarReporteSolicitudesPorEstado, generarReporteTiempoFabricacion, etc. ya existentes)
// ... Tu lógica de generación para cada reporte va aquí ...
// Las funciones generarReportePersonalizado y generarReporteRendimientoMensual ya están arriba.
// La función generarReporteSolicitudesPorEstado también está arriba.

// ==================== FUNCIONES AUXILIARES ====================
// (formatDate, mostrarSincronizacion, ocultarSincronizacion, mostrarAlerta ya existentes)
// ...
// Necesitarás una función exportarReporte(nombreReporte, datos, formato)
// Por ahora, un placeholder:
function exportarReporte(nombreReporte, datos, formato) {
    console.log(`Exportando ${nombreReporte} a ${formato}...`, datos);
    // Aquí iría la lógica para convertir 'datos' a CSV, Excel (usando una librería como SheetJS), o PDF (jsPDF + html2pdf o similar)
    // y luego disparar la descarga.
    alert(`Funcionalidad de exportar a ${formato} no implementada completamente.`);
}


// ==================== INICIALIZACIÓN DEL MÓDULO ====================
// Exponer el módulo globalmente
window.reportes = {
    init: initReportesModule, // Renombrada
    generarReporte,
    actualizarFormularioReporte
    // Podrías exponer otras funciones si son llamadas desde fuera
};

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la pestaña de reportes o si el formulario de reportes existe
    if (document.getElementById('reportes-content') || reporteFormElem) {
        window.reportes.init();
    }
});

// Añadir la llave de cierre que faltaba
// (Esta es la llave que cierra la función generarReporteSolicitudesPorEstado)
// } // <--- ESTA LLAVE PARECE SER LA QUE CAUSA EL ERROR SI ESTÁ MAL COLOCADA O FALTA SU CORRESPONDIENTE CIERRE DE FUNCIÓN MÁS ARRIBA.
// El error "Unexpected end of input" suele significar que falta un cierre } en algún lugar ANTES del final del archivo.
// La corrección que haré será asegurar que todas las funciones definidas tengan su cierre.
// El problema está en la última línea del archivo que me pasaste, que era parte de una función.
// Ahora he reestructurado para que todas las funciones estén completas y luego se inicialice el módulo.
// La última llave que cerraba "generarReporteSolicitudesPorEstado" estaba al final del todo,
// pero esa función ya estaba completa más arriba. La reestructuración debería ayudar.
// La clave es que la línea 1525 (el final del archivo) no debe ser el final abrupto de una estructura de código.
