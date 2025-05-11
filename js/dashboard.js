// Dashboard y estadísticas para el panel de administración

// Elementos DOM para el dashboard
const dashboardContainer = document.getElementById('dashboard-container');
const dashboardCardsContainer = document.getElementById('dashboard-cards');
const chartsContainer = document.getElementById('charts-container');
const timeRangeSelect = document.getElementById('time-range-select');

// Configuración inicial y mapeo de estados para estadísticas
const estadosConfig = {
    'Solicitud enviada por bodega': { color: '#3498db', bgColor: '#ebf5fb' },
    'En fabricación': { color: '#f39c12', bgColor: '#fef5e7' },
    'Entregado': { color: '#2ecc71', bgColor: '#e9f7ef' }
};

// Inicializar el dashboard
function initDashboard() {
    if (!dashboardContainer) return;
    
    // Configurar eventos
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            cargarEstadisticas();
        });
    }
    
    // Mostrar estadísticas iniciales
    cargarEstadisticas();
    
    // Configurar actualizaciones automáticas cada 5 minutos
    setInterval(() => {
        cargarEstadisticas(true); // silencioso = true para no mostrar alertas
    }, 300000); // 5 minutos
}

// Cargar estadísticas y actualizar el dashboard
function cargarEstadisticas(silencioso = false) {
    if (!dashboardContainer) return;
    
    if (!silencioso) {
        mostrarSincronizacion('Calculando estadísticas...');
    }
    
    // Obtener rango de tiempo seleccionado
    const timeRange = timeRangeSelect ? timeRangeSelect.value : '30'; // 30 días por defecto
    const rangoFecha = obtenerRangoFecha(parseInt(timeRange));
    
    // Filtrar solicitudes basado en el rango de fechas
    const solicitudesFiltradas = filtrarSolicitudesPorFecha(solicitudes, rangoFecha);
    
    // Calcular estadísticas
    const estadisticas = calcularEstadisticas(solicitudesFiltradas);
    
    // Actualizar la interfaz de usuario con las estadísticas
    actualizarKPIsCards(estadisticas);
    actualizarGraficos(estadisticas);
    
    if (!silencioso) {
        ocultarSincronizacion();
    }
}

// Obtener rango de fecha basado en la selección
function obtenerRangoFecha(dias) {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    
    return {
        inicio: fechaInicio,
        fin: fechaFin
    };
}

// Filtrar solicitudes por fecha
function filtrarSolicitudesPorFecha(solicitudes, rango) {
    return solicitudes.filter(solicitud => {
        const fechaSolicitud = new Date(solicitud.fechaSolicitud);
        return fechaSolicitud >= rango.inicio && fechaSolicitud <= rango.fin;
    });
}

// Calcular estadísticas
function calcularEstadisticas(solicitudes) {
    // Estadísticas generales
    const totalSolicitudes = solicitudes.length;
    const solicitudesPorEstado = {};
    const productosSolicitados = {};
    const productosPorEstado = {
        'Solicitud enviada por bodega': {},
        'En fabricación': {},
        'Entregado': {}
    };
    
    // Para gráficos de tendencia
    const solicitudesPorDia = {};
    const ultimosDias = 30;
    
    // Inicializar contadores de estado
    Object.keys(estadosConfig).forEach(estado => {
        solicitudesPorEstado[estado] = 0;
    });
    
    // Inicializar fechas para gráfico de tendencia
    for (let i = 0; i < ultimosDias; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaKey = formatFechaKey(fecha);
        solicitudesPorDia[fechaKey] = {
            'Solicitud enviada por bodega': 0,
            'En fabricación': 0,
            'Entregado': 0
        };
    }
    
    // Procesar cada solicitud
    solicitudes.forEach(solicitud => {
        // Contar por estado
        if (solicitudesPorEstado.hasOwnProperty(solicitud.estado)) {
            solicitudesPorEstado[solicitud.estado]++;
        }
        
        // Procesar productos
        solicitud.items.forEach(item => {
            if (!productosSolicitados[item.producto]) {
                productosSolicitados[item.producto] = 0;
            }
            productosSolicitados[item.producto] += item.cantidad;
            
            // Productos por estado
            if (productosPorEstado[solicitud.estado]) {
                if (!productosPorEstado[solicitud.estado][item.producto]) {
                    productosPorEstado[solicitud.estado][item.producto] = 0;
                }
                productosPorEstado[solicitud.estado][item.producto] += item.cantidad;
            }
        });
        
        // Agregar a tendencia por día
        const fechaSolicitud = new Date(solicitud.fechaSolicitud);
        const fechaKey = formatFechaKey(fechaSolicitud);
        
        if (solicitudesPorDia[fechaKey] && solicitudesPorDia[fechaKey][solicitud.estado] !== undefined) {
            solicitudesPorDia[fechaKey][solicitud.estado]++;
        }
    });
    
    // Calcular tiempo promedio de procesamiento
    const tiempoPromedio = calcularTiempoPromedioProcesamiento(solicitudes);
    
    // Ordenar productos más solicitados
    const productosMasSolicitados = Object.entries(productosSolicitados)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10
    
    // Preparar datos para gráficos de tendencia
    const tendenciaData = prepararDatosTendencia(solicitudesPorDia);
    
    return {
        totalSolicitudes,
        solicitudesPorEstado,
        tiempoPromedio,
        productosMasSolicitados,
        productosPorEstado,
        tendenciaData
    };
}

// Calcular tiempo promedio de procesamiento (desde solicitud hasta entrega)
function calcularTiempoPromedioProcesamiento(solicitudes) {
    const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Entregado');
    
    if (solicitudesCompletadas.length === 0) {
        return { dias: 0, horas: 0 };
    }
    
    let tiempoTotalMs = 0;
    
    solicitudesCompletadas.forEach(solicitud => {
        // Buscar la fecha de creación y la fecha de entrega en el historial
        const fechaCreacion = new Date(solicitud.historial[0].fecha);
        
        // Encontrar la primera entrada de historial con estado "Entregado"
        const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
        
        if (entregaHistorial) {
            const fechaEntrega = new Date(entregaHistorial.fecha);
            tiempoTotalMs += fechaEntrega - fechaCreacion;
        }
    });
    
    // Calcular promedio en milisegundos
    const promedioMs = tiempoTotalMs / solicitudesCompletadas.length;
    
    // Convertir a días y horas
    const dias = Math.floor(promedioMs / (1000 * 60 * 60 * 24));
    const horasRestantes = Math.floor((promedioMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { dias, horas: horasRestantes };
}

// Formatear fecha para clave en objeto de tendencia (formato: YYYY-MM-DD)
function formatFechaKey(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

// Preparar datos para gráfico de tendencia
function prepararDatosTendencia(solicitudesPorDia) {
    // Convertir objeto a array para gráficos
    const tendenciaData = Object.keys(solicitudesPorDia)
        .sort() // Ordenar fechas
        .map(fecha => {
            const [year, month, day] = fecha.split('-');
            const fechaFormateada = `${day}/${month}`;
            
            return {
                fecha: fechaFormateada,
                pendientes: solicitudesPorDia[fecha]['Solicitud enviada por bodega'],
                fabricacion: solicitudesPorDia[fecha]['En fabricación'],
                entregadas: solicitudesPorDia[fecha]['Entregado'],
                total: solicitudesPorDia[fecha]['Solicitud enviada por bodega'] + 
                       solicitudesPorDia[fecha]['En fabricación'] + 
                       solicitudesPorDia[fecha]['Entregado']
            };
        });
    
    return tendenciaData;
}

// Actualizar las tarjetas de KPIs
function actualizarKPIsCards(estadisticas) {
    if (!dashboardCardsContainer) return;
    
    // Limpiar contenido anterior
    dashboardCardsContainer.innerHTML = '';
    
    // Crear tarjeta de total de solicitudes
    const totalCard = createKPICard(
        'Total de Solicitudes',
        estadisticas.totalSolicitudes,
        'fas fa-file-alt',
        'primary'
    );
    
    // Crear tarjetas para cada estado
    const estadoCards = Object.keys(estadisticas.solicitudesPorEstado).map(estado => {
        const count = estadisticas.solicitudesPorEstado[estado];
        const percent = estadisticas.totalSolicitudes > 0 
            ? Math.round((count / estadisticas.totalSolicitudes) * 100) 
            : 0;
        
        let iconClass, colorClass;
        
        switch (estado) {
            case 'Solicitud enviada por bodega':
                iconClass = 'fas fa-hourglass-start';
                colorClass = 'info';
                break;
            case 'En fabricación':
                iconClass = 'fas fa-cogs';
                colorClass = 'warning';
                break;
            case 'Entregado':
                iconClass = 'fas fa-check-circle';
                colorClass = 'success';
                break;
            default:
                iconClass = 'fas fa-circle';
                colorClass = 'secondary';
        }
        
        return createKPICard(
            estado,
            count,
            iconClass,
            colorClass,
            `${percent}% del total`
        );
    });
    
    // Crear tarjeta de tiempo promedio
    const tiempoCard = createKPICard(
        'Tiempo Prom. de Fabricación',
        `${estadisticas.tiempoPromedio.dias}d ${estadisticas.tiempoPromedio.horas}h`,
        'fas fa-clock',
        'dark'
    );
    
    // Añadir todas las tarjetas al contenedor
    dashboardCardsContainer.appendChild(totalCard);
    estadoCards.forEach(card => dashboardCardsContainer.appendChild(card));
    dashboardCardsContainer.appendChild(tiempoCard);
}

// Crear una tarjeta de KPI
function createKPICard(title, value, iconClass, colorClass, subtitle = '') {
    const card = document.createElement('div');
    card.className = 'col-md-4 col-lg-3 mb-4';
    
    card.innerHTML = `
        <div class="card border-${colorClass} h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="text-muted mb-1 text-truncate">${title}</h6>
                        <h3 class="mb-0 fw-bold">${value}</h3>
                        ${subtitle ? `<small class="text-muted">${subtitle}</small>` : ''}
                    </div>
                    <div class="icon-bg bg-light-${colorClass} rounded p-3">
                        <i class="${iconClass} text-${colorClass}"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Actualizar los gráficos del dashboard
function actualizarGraficos(estadisticas) {
    if (!chartsContainer) return;
    
    // Limpiar contenido anterior
    chartsContainer.innerHTML = '';
    
    // Estructura para los gráficos
    chartsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Distribución por Estado</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item download-chart" href="#" data-chart="chart-estados">Exportar PNG</a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.print()">Imprimir</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="chart-estados" height="260"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Tendencia de Solicitudes</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item download-chart" href="#" data-chart="chart-tendencia">Exportar PNG</a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.print()">Imprimir</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="chart-tendencia" height="260"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Top Productos Solicitados</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item download-chart" href="#" data-chart="chart-productos">Exportar PNG</a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.print()">Imprimir</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="chart-productos" height="260"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Tasa de Completitud</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item download-chart" href="#" data-chart="chart-completitud">Exportar PNG</a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.print()">Imprimir</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body d-flex align-items-center justify-content-center">
                        <canvas id="chart-completitud" height="260"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar gráficos
    renderizarGraficoEstados(estadisticas);
    renderizarGraficoTendencia(estadisticas);
    renderizarGraficoProductos(estadisticas);
    renderizarGraficoCompletitud(estadisticas);
    
    // Configurar eventos para exportar gráficos
    document.querySelectorAll('.download-chart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const chartId = btn.getAttribute('data-chart');
            downloadChart(chartId);
        });
    });
}

// Renderizar gráfico de distribución por estado
function renderizarGraficoEstados(estadisticas) {
    const ctx = document.getElementById('chart-estados');
    if (!ctx) return;
    
    const estados = Object.keys(estadisticas.solicitudesPorEstado);
    const datos = estados.map(estado => estadisticas.solicitudesPorEstado[estado]);
    const colores = estados.map(estado => estadosConfig[estado]?.color || '#777');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: estados,
            datasets: [{
                data: datos,
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de tendencia
function renderizarGraficoTendencia(estadisticas) {
    const ctx = document.getElementById('chart-tendencia');
    if (!ctx) return;
    
    // Tomamos los últimos 14 días para el gráfico de tendencia
    const data = estadisticas.tendenciaData.slice(-14);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.fecha),
            datasets: [
                {
                    label: 'Total',
                    data: data.map(item => item.total),
                    borderColor: '#6c757d',
                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Pendientes',
                    data: data.map(item => item.pendientes),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'En Fabricación',
                    data: data.map(item => item.fabricacion),
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Entregadas',
                    data: data.map(item => item.entregadas),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de productos más solicitados
function renderizarGraficoProductos(estadisticas) {
    const ctx = document.getElementById('chart-productos');
    if (!ctx) return;
    
    // Tomar solo los 7 productos más solicitados
    const topProductos = estadisticas.productosMasSolicitados.slice(0, 7);
    
    // Generar colores para cada barra
    const colores = [
        '#3498db', '#2ecc71', '#f39c12', '#e74c3c', 
        '#9b59b6', '#1abc9c', '#34495e'
    ];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProductos.map(p => p[0]),
            datasets: [{
                label: 'Cantidad',
                data: topProductos.map(p => p[1]),
                backgroundColor: colores,
                borderColor: colores.map(c => c),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Renderizar gráfico de tasa de completitud
function renderizarGraficoCompletitud(estadisticas) {
    const ctx = document.getElementById('chart-completitud');
    if (!ctx) return;
    
    // Calcular porcentaje de solicitudes entregadas
    const totalSolicitudes = estadisticas.totalSolicitudes;
    const entregadas = estadisticas.solicitudesPorEstado['Entregado'] || 0;
    const porcentajeCompletitud = totalSolicitudes > 0 ? Math.round((entregadas / totalSolicitudes) * 100) : 0;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completadas', 'Pendientes'],
            datasets: [{
                data: [porcentajeCompletitud, 100 - porcentajeCompletitud],
                backgroundColor: ['#2ecc71', '#ecf0f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Añadir texto en el centro del donut
    const completitudElement = document.createElement('div');
    completitudElement.className = 'completitud-info position-absolute top-50 start-50 translate-middle text-center';
    completitudElement.innerHTML = `
        <h3 class="mb-0 fw-bold">${porcentajeCompletitud}%</h3>
        <p class="mb-0 text-muted">Completitud</p>
    `;
    
    // Buscar el contenedor del gráfico y añadir el elemento con posicionamiento relativo
    const chartContainer = ctx.parentElement;
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(completitudElement);
}

// Descargar gráfico como imagen PNG
function downloadChart(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // Crear un enlace temporal
    const link = document.createElement('a');
    link.download = `grafico-${chartId}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Exportar gráficos para el Dashboard
function exportarDashboard() {
    html2canvas(dashboardContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Exponer funciones al ámbito global
window.dashboard = {
    init: initDashboard,
    cargarEstadisticas,
    exportarDashboard
};
