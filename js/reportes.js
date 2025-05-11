// Sistema de reportes avanzados y personalizables

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
    if (!reporteForm) return;
    
    // Configurar evento de envío del formulario
    reporteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        generarReporte();
    });
    
    // Configurar eventos de cambio en el tipo de reporte
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    if (tipoReporteSelect) {
        tipoReporteSelect.addEventListener('change', actualizarFormularioReporte);
    }
    
    // Inicializar datepickers si existen
    const datepickers = document.querySelectorAll('.datepicker');
    datepickers.forEach(datepicker => {
        // Aplicar máscara de fecha DD/MM/YYYY
        datepicker.addEventListener('input', formatearFecha);
    });
}

// Formatear input de fecha mientras el usuario escribe
function formatearFecha(e) {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length > 0) {
        // Formatear como DD/MM/YYYY
        if (valor.length <= 2) {
            e.target.value = valor;
        } else if (valor.length <= 4) {
            e.target.value = `${valor.substring(0, 2)}/${valor.substring(2)}`;
        } else {
            e.target.value = `${valor.substring(0, 2)}/${valor.substring(2, 4)}/${valor.substring(4, 8)}`;
        }
    }
}

// Actualizar formulario según el tipo de reporte seleccionado
function actualizarFormularioReporte() {
    const tipoReporte = document.getElementById('tipo-reporte').value;
    const opcionesContainer = document.getElementById('opciones-reporte');
    
    if (!opcionesContainer) return;
    
    // Limpiar opciones anteriores
    opcionesContainer.innerHTML = '';
    
    // Mostrar opciones según el tipo de reporte
    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
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
            
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
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
            
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
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
            
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
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
                            ${usuarios.map(u => `<option value="${u.id}">${u.displayName} (${u.username})</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Tipo de actividad</label>
                        <select class="form-select" name="tipo_actividad">
                            <option value="">Toda la actividad</option>
                            <option value="login">Inicios de sesión</option>
                            <option value="crear">Creación de solicitudes</option>
                            <option value="actualizar">Actualizaciones de estado</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
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
                        <label class="form-label">Incluir proyección</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="incluir_proyeccion" checked>
                            <label class="form-check-label">Mostrar proyección para meses futuros</label>
                        </div>
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
            
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
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
                            <option value="notaVenta">Nota de Venta</option>
                            <option value="estado">Estado</option>
                        </select>
                    </div>
                    
                    <div class="col-md-6">
                        <label class="form-label">Formato</label>
                        <select class="form-select" name="formato_salida">
                            <option value="html">HTML</option>
                            <option value="csv">CSV</option>
                            <option value="excel">Excel</option>
                            <option value="pdf">PDF</option>
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
        input.value = formatoFecha(fechaInicio);
    });
    
    fechaFinInputs.forEach(input => {
        input.value = formatoFecha(fechaActual);
    });
}

// Generar reporte según los parámetros
function generarReporte() {
    mostrarSincronizacion('Generando reporte...');
    
    try {
        // Obtener valores del formulario
        const tipoReporte = document.getElementById('tipo-reporte').value;
        
        // Validar tipo de reporte
        if (!tipoReporte) {
            throw new Error('Debe seleccionar un tipo de reporte');
        }
        
        // Obtener parámetros según tipo de reporte
        const params = obtenerParametrosReporte(tipoReporte);
        
        // Generar reporte
        switch (tipoReporte) {
            case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
                generarReporteSolicitudesPorEstado(params);
                break;
                
            case TIPOS_REPORTE.TIEMPO_FABRICACION:
                generarReporteTiempoFabricacion(params);
                break;
                
            case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
                generarReporteProductosMasSolicitados(params);
                break;
                
            case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
                generarReporteActividadUsuarios(params);
                break;
                
            case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
                generarReporteRendimientoMensual(params);
                break;
                
            case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
                generarReportePersonalizado(params);
                break;
                
            default:
                throw new Error('Tipo de reporte no válido');
        }
        
        // Registrar en sistema de auditoría
        if (window.auditoria && typeof window.auditoria.registrarEvento === 'function') {
            window.auditoria.registrarEvento(
                window.auditoria.TIPO_EVENTO.EXPORTAR,
                window.auditoria.ENTIDAD.REPORTE,
                null,
                `Generación de reporte: ${tipoReporte}`,
                params
            );
        }
    } catch (error) {
        mostrarAlerta(`Error al generar reporte: ${error.message}`, 'danger');
        console.error('Error al generar reporte:', error);
        
        // Limpiar contenedor
        if (reporteResult) {
            reporteResult.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>${error.message}
                </div>
            `;
        }
    } finally {
        ocultarSincronizacion();
    }
}

// Obtener parámetros del formulario según tipo de reporte
function obtenerParametrosReporte(tipoReporte) {
    const params = {};
    
    // Parámetros comunes para la mayoría de reportes
    if (['solicitudes_por_estado', 'tiempo_fabricacion', 'productos_mas_solicitados', 'actividad_usuarios'].includes(tipoReporte)) {
        params.fechaInicio = document.querySelector('input[name="fecha_inicio"]').value;
        params.fechaFin = document.querySelector('input[name="fecha_fin"]').value;
        
        // Validar fechas
        if (!params.fechaInicio || !params.fechaFin) {
            throw new Error('Las fechas de inicio y fin son requeridas');
        }
        
        if (new Date(params.fechaInicio) > new Date(params.fechaFin)) {
            throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
        }
    }
    
    // Parámetros específicos por tipo de reporte
    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            params.agruparPor = document.querySelector('select[name="agrupar_por"]').value;
            params.formato = document.querySelector('select[name="formato"]').value;
            break;
            
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            params.agruparPorProducto = document.querySelector('input[name="agrupar_producto"]').checked;
            params.formato = document.querySelector('select[name="formato"]').value;
            break;
            
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            params.limite = parseInt(document.querySelector('input[name="limite"]').value);
            params.formato = document.querySelector('select[name="formato"]').value;
            break;
            
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
            params.usuarioId = document.querySelector('select[name="usuario_id"]').value;
            params.tipoActividad = document.querySelector('select[name="tipo_actividad"]').value;
            break;
            
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
            params.anio = document.querySelector('select[name="anio"]').value;
            params.incluirProyeccion = document.querySelector('input[name="incluir_proyeccion"]').checked;
            params.metrica = document.querySelector('select[name="metrica"]').value;
            params.formato = document.querySelector('select[name="formato"]').value;
            break;
            
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
            // Obtener campos seleccionados como array
            params.campos = Array.from(document.querySelectorAll('input[name="campos"]:checked')).map(c => c.value);
            params.filtroEstado = document.querySelector('select[name="filtro_estado"]').value;
            params.ordenarPor = document.querySelector('select[name="ordenar_por"]').value;
            params.formatoSalida = document.querySelector('select[name="formato_salida"]').value;
            break;
    }
    
    return params;
}

// Generador de reporte: Solicitudes por Estado
function generarReporteSolicitudesPorEstado(params) {
    // Filtrar solicitudes por rango de fechas
    const solicitudesFiltradas = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin);
    });
    
    // Agrupar solicitudes según parámetro
    const datosPorPeriodo = {};
    const estadosPosibles = ['Solicitud enviada por bodega', 'En fabricación', 'Entregado'];
    
    solicitudesFiltradas.forEach(solicitud => {
        const fecha = new Date(solicitud.fechaSolicitud);
        let periodoKey;
        
        // Determinar la clave del período según la agrupación
        switch (params.agruparPor) {
            case 'dia':
                periodoKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
                break;
                
            case 'semana':
                // Obtener el lunes de la semana correspondiente
                const diaSemana = fecha.getDay(); // 0 = domingo, 1 = lunes, etc.
                const lunes = new Date(fecha);
                lunes.setDate(fecha.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
                periodoKey = lunes.toISOString().split('T')[0];
                break;
                
            case 'mes':
                periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                break;
                
            default:
                periodoKey = fecha.toISOString().split('T')[0];
        }
        
        // Inicializar el período si no existe
        if (!datosPorPeriodo[periodoKey]) {
            datosPorPeriodo[periodoKey] = {
                periodo: periodoKey,
                total: 0
            };
            
            // Inicializar contadores para cada estado
            estadosPosibles.forEach(estado => {
                datosPorPeriodo[periodoKey][estado] = 0;
            });
        }
        
        // Incrementar contadores
        datosPorPeriodo[periodoKey].total++;
        datosPorPeriodo[periodoKey][solicitud.estado]++;
    });
    
    // Convertir a array y ordenar por período
    const datosOrdenados = Object.values(datosPorPeriodo).sort((a, b) => a.periodo.localeCompare(b.periodo));
    
    // Preparar datos para el gráfico
    const labels = [];
    const datasets = [
        {
            label: 'Solicitud enviada por bodega',
            backgroundColor: '#3498db',
            data: []
        },
        {
            label: 'En fabricación',
            backgroundColor: '#f39c12',
            data: []
        },
        {
            label: 'Entregado',
            backgroundColor: '#2ecc71',
            data: []
        }
    ];
    
    // Formatear etiquetas según agrupación
    datosOrdenados.forEach(dato => {
        let etiqueta;
        
        switch (params.agruparPor) {
            case 'dia':
                // Convertir YYYY-MM-DD a DD/MM/YYYY
                const [anio, mes, dia] = dato.periodo.split('-');
                etiqueta = `${dia}/${mes}/${anio}`;
                break;
                
            case 'semana':
                // Mostrar fecha de inicio de semana
                const [anioSem, mesSem, diaSem] = dato.periodo.split('-');
                etiqueta = `Sem: ${diaSem}/${mesSem}`;
                break;
                
            case 'mes':
                // Mostrar mes/año
                const [anioMes, mesMes] = dato.periodo.split('-');
                const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                etiqueta = `${nombresMes[parseInt(mesMes) - 1]}/${anioMes}`;
                break;
                
            default:
                etiqueta = dato.periodo;
        }
        
        labels.push(etiqueta);
        
        // Añadir datos para cada estado
        datasets[0].data.push(dato['Solicitud enviada por bodega']);
        datasets[1].data.push(dato['En fabricación']);
        datasets[2].data.push(dato['Entregado']);
    });
    
    // Generar resultado
    if (!reporteResult) return;
    
    // Limpiar contenedor
    reporteResult.innerHTML = '';
    
    // Título del reporte
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `
        <i class="fas fa-chart-bar me-2"></i>
        Reporte de Solicitudes por Estado
        <small class="d-block text-muted">
            Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}
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
    
    // Mostrar resultados según formato seleccionado
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        // Crear tabla
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'table-responsive mb-4';
        
        const tabla = document.createElement('table');
        tabla.className = 'table table-bordered table-hover';
        
        // Encabezado
        let thead = `<thead><tr>
            <th>Período</th>
            <th>Pendientes</th>
            <th>En Fabricación</th>
            <th>Entregadas</th>
            <th>Total</th>
        </tr></thead>`;
        
        // Cuerpo
        let tbody = '<tbody>';
        
        datosOrdenados.forEach((dato, index) => {
            tbody += `<tr>
                <td>${labels[index]}</td>
                <td>${dato['Solicitud enviada por bodega']}</td>
                <td>${dato['En fabricación']}</td>
                <td>${dato['Entregado']}</td>
                <td>${dato.total}</td>
            </tr>`;
        });
        
        // Si hay datos, agregar una fila de totales
        if (datosOrdenados.length > 0) {
            const totalesPendientes = datosOrdenados.reduce((sum, dato) => sum + dato['Solicitud enviada por bodega'], 0);
            const totalesFabricacion = datosOrdenados.reduce((sum, dato) => sum + dato['En fabricación'], 0);
            const totalesEntregadas = datosOrdenados.reduce((sum, dato) => sum + dato['Entregado'], 0);
            const totalesTotal = totalesPendientes + totalesFabricacion + totalesEntregadas;
            
            tbody += `<tr class="table-secondary fw-bold">
                <td>Totales</td>
                <td>${totalesPendientes}</td>
                <td>${totalesFabricacion}</td>
                <td>${totalesEntregadas}</td>
                <td>${totalesTotal}</td>
            </tr>`;
        }
        
        tbody += '</tbody>';
        
        tabla.innerHTML = thead + tbody;
        tablaContainer.appendChild(tabla);
        reporteResult.appendChild(tablaContainer);
    }
    
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        // Crear contenedor para el gráfico
        const graficoContainer = document.createElement('div');
        graficoContainer.className = 'grafico-container mb-4';
        graficoContainer.style.height = '400px';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'grafico-reporte-estado';
        graficoContainer.appendChild(canvas);
        
        reporteResult.appendChild(graficoContainer);
        
        // Crear gráfico
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Solicitudes por Estado'
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
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Mostrar resumen
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'alert alert-info mt-3';
    
    // Calcular estadísticas básicas
    const totalSolicitudes = solicitudesFiltradas.length;
    const solicitudesPendientes = solicitudesFiltradas.filter(s => s.estado === 'Solicitud enviada por bodega').length;
    const solicitudesFabricacion = solicitudesFiltradas.filter(s => s.estado === 'En fabricación').length;
    const solicitudesEntregadas = solicitudesFiltradas.filter(s => s.estado === 'Entregado').length;
    
    const porcentajePendientes = totalSolicitudes > 0 ? Math.round((solicitudesPendientes / totalSolicitudes) * 100) : 0;
    const porcentajeFabricacion = totalSolicitudes > 0 ? Math.round((solicitudesFabricacion / totalSolicitudes) * 100) : 0;
    const porcentajeEntregadas = totalSolicitudes > 0 ? Math.round((solicitudesEntregadas / totalSolicitudes) * 100) : 0;
    
    resumenDiv.innerHTML = `
        <h5><i class="fas fa-info-circle me-2"></i>Resumen del Reporte</h5>
        <p>En el período analizado, se registraron <strong>${totalSolicitudes} solicitudes</strong> en total.</p>
        <ul>
            <li><strong>${solicitudesPendientes} solicitudes</strong> pendientes (${porcentajePendientes}%)</li>
            <li><strong>${solicitudesFabricacion} solicitudes</strong> en fabricación (${porcentajeFabricacion}%)</li>
            <li><strong>${solicitudesEntregadas} solicitudes</strong> entregadas (${porcentajeEntregadas}%)</li>
        </ul>
    `;
    
    reporteResult.appendChild(resumenDiv);
    
    // Configurar eventos de exportación
    reporteResult.querySelectorAll('.exportar-reporte').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            exportarReporte('Solicitudes por Estado', datosOrdenados, formato);
        });
    });
}

// Generador de reporte: Tiempo de Fabricación
function generarReporteTiempoFabricacion(params) {
    // Filtrar solicitudes por rango de fechas y que estén entregadas
    const solicitudesFiltradas = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin) &&
               s.estado === 'Entregado'; // Solo solicitudes completadas
    });
    
    // Inicializar datos
    let productosTiempos = {};
    let totalTiempoMs = 0;
    let totalSolicitudes = solicitudesFiltradas.length;
    
    // Procesar solicitudes
    solicitudesFiltradas.forEach(solicitud => {
        // Calcular tiempo de fabricación
        let tiempoFabricacionMs = 0;
        
        // Buscar la fecha de creación y la fecha de entrega en el historial
        if (solicitud.historial && solicitud.historial.length >= 2) {
            const fechaCreacion = new Date(solicitud.historial[0].fecha);
            
            // Encontrar la entrada de historial con estado "Entregado"
            const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
            
            if (entregaHistorial) {
                const fechaEntrega = new Date(entregaHistorial.fecha);
                tiempoFabricacionMs = fechaEntrega - fechaCreacion;
                totalTiempoMs += tiempoFabricacionMs;
                
                // Si se requiere agrupar por producto, procesar cada producto
                if (params.agruparPorProducto && solicitud.items) {
                    solicitud.items.forEach(item => {
                        if (!productosTiempos[item.producto]) {
                            productosTiempos[item.producto] = {
                                producto: item.producto,
                                tiempoTotalMs: 0,
                                cantidadSolicitudes: 0,
                                promedioDias: 0
                            };
                        }
                        
                        productosTiempos[item.producto].tiempoTotalMs += tiempoFabricacionMs;
                        productosTiempos[item.producto].cantidadSolicitudes++;
                    });
                }
            }
        }
    });
    
    // Calcular promedio global
    const tiempoPromedioGlobalMs = totalSolicitudes > 0 ? totalTiempoMs / totalSolicitudes : 0;
    const diasPromedioGlobal = tiempoPromedioGlobalMs / (1000 * 60 * 60 * 24);
    
    // Calcular promedios por producto
    if (params.agruparPorProducto) {
        Object.values(productosTiempos).forEach(producto => {
            producto.promedioDias = producto.cantidadSolicitudes > 0 
                ? producto.tiempoTotalMs / producto.cantidadSolicitudes / (1000 * 60 * 60 * 24)
                : 0;
        });
    }
    
    // Ordenar productos por tiempo promedio de fabricación
    const productosOrdenados = Object.values(productosTiempos)
        .sort((a, b) => b.promedioDias - a.promedioDias); // Ordenar de mayor a menor
    
    // Generar resultado
    if (!reporteResult) return;
    
    // Limpiar contenedor
    reporteResult.innerHTML = '';
    
    // Título del reporte
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `
        <i class="fas fa-clock me-2"></i>
        Reporte de Tiempo de Fabricación
        <small class="d-block text-muted">
            Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}
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
    
    // Resumen general
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'card mb-4';
    
    // Formatear tiempo promedio para visualización
    const diasPromedioFormateado = diasPromedioGlobal.toFixed(1);
    const horasPromedio = Math.floor((diasPromedioGlobal % 1) * 24);
    
    resumenDiv.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Resumen General</h5>
            <div class="row">
                <div class="col-md-4">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${solicitudesFiltradas.length}</span>
                        <span class="metric-label">Solicitudes Completadas</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${diasPromedioFormateado}</span>
                        <span class="metric-label">Días Promedio de Fabricación</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card mb-3">
                        <span class="metric-value">${productosOrdenados.length}</span>
                        <span class="metric-label">Productos Analizados</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reporteResult.appendChild(resumenDiv);
    
    // Mostrar resultados según formato seleccionado
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        if (params.agruparPorProducto && productosOrdenados.length > 0) {
            // Crear tabla de tiempo por producto
            const tablaContainer = document.createElement('div');
            tablaContainer.className = 'table-responsive mb-4';
            
            const tabla = document.createElement('table');
            tabla.className = 'table table-bordered table-hover';
            
            // Encabezado
            let thead = `<thead><tr>
                <th>Producto</th>
                <th>Días Promedio</th>
                <th>Solicitudes</th>
            </tr></thead>`;
            
            // Cuerpo
            let tbody = '<tbody>';
            
            productosOrdenados.forEach(producto => {
                tbody += `<tr>
                    <td>${producto.producto}</td>
                    <td>${producto.promedioDias.toFixed(1)}</td>
                    <td>${producto.cantidadSolicitudes}</td>
                </tr>`;
            });
            
            tbody += '</tbody>';
            
            tabla.innerHTML = thead + tbody;
            
            // Título de la tabla
            const tituloTabla = document.createElement('h5');
            tituloTabla.className = 'mb-3';
            tituloTabla.textContent = 'Tiempo de Fabricación por Producto';
            
            tablaContainer.appendChild(tituloTabla);
            tablaContainer.appendChild(tabla);
            reporteResult.appendChild(tablaContainer);
        }
    }
    
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        if (params.agruparPorProducto && productosOrdenados.length > 0) {
            // Limitar a los 10 productos con mayor tiempo para el gráfico
            const topProductos = productosOrdenados.slice(0, 10);
            
            // Crear contenedor para el gráfico
            const graficoContainer = document.createElement('div');
            graficoContainer.className = 'grafico-container mb-4';
            graficoContainer.style.height = '400px';
            
            const canvas = document.createElement('canvas');
            canvas.id = 'grafico-tiempo-fabricacion';
            graficoContainer.appendChild(canvas);
            
            // Título del gráfico
            const tituloGrafico = document.createElement('h5');
            tituloGrafico.className = 'mb-3';
            tituloGrafico.textContent = 'Top 10 Productos por Tiempo de Fabricación';
            
            reporteResult.appendChild(tituloGrafico);
            reporteResult.appendChild(graficoContainer);
            
            // Crear gráfico
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: topProductos.map(p => p.producto),
                    datasets: [{
                        label: 'Días Promedio',
                        data: topProductos.map(p => p.promedioDias.toFixed(1)),
                        backgroundColor: '#3498db',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Barras horizontales
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Días'
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico de tendencia temporal si hay suficientes datos
        if (solicitudesFiltradas.length >= 3) {
            // Ordenar solicitudes por fecha
            const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => 
                new Date(a.fechaSolicitud) - new Date(b.fechaSolicitud)
            );
            
            // Agrupar por mes
            const tiempoPorMes = {};
            
            solicitudesOrdenadas.forEach(solicitud => {
                if (solicitud.historial && solicitud.historial.length >= 2) {
                    const fechaCreacion = new Date(solicitud.historial[0].fecha);
                    
                    // Encontrar la entrada de historial con estado "Entregado"
                    const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
                    
                    if (entregaHistorial) {
                        const fechaEntrega = new Date(entregaHistorial.fecha);
                        const tiempoFabricacionMs = fechaEntrega - fechaCreacion;
                        const tiempoFabricacionDias = tiempoFabricacionMs / (1000 * 60 * 60 * 24);
                        
                        // Clave del mes (YYYY-MM)
                        const mesKey = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (!tiempoPorMes[mesKey]) {
                            tiempoPorMes[mesKey] = {
                                mes: mesKey,
                                tiempoTotalDias: 0,
                                cantidadSolicitudes: 0
                            };
                        }
                        
                        tiempoPorMes[mesKey].tiempoTotalDias += tiempoFabricacionDias;
                        tiempoPorMes[mesKey].cantidadSolicitudes++;
                    }
                }
            });
            
            // Calcular promedios por mes
            Object.values(tiempoPorMes).forEach(mes => {
                mes.promedioDias = mes.cantidadSolicitudes > 0 
                    ? mes.tiempoTotalDias / mes.cantidadSolicitudes
                    : 0;
            });
            
            // Convertir a array y ordenar por mes
            const mesesOrdenados = Object.values(tiempoPorMes)
                .sort((a, b) => a.mes.localeCompare(b.mes));
            
            if (mesesOrdenados.length >= 2) {
                // Crear contenedor para el gráfico
                const graficoContainer = document.createElement('div');
                graficoContainer.className = 'grafico-container mb-4';
                graficoContainer.style.height = '400px';
                
                const canvas = document.createElement('canvas');
                canvas.id = 'grafico-tendencia-tiempo';
                graficoContainer.appendChild(canvas);
                
                // Título del gráfico
                const tituloGrafico = document.createElement('h5');
                tituloGrafico.className = 'mb-3';
                tituloGrafico.textContent = 'Tendencia del Tiempo de Fabricación';
                
                reporteResult.appendChild(tituloGrafico);
                reporteResult.appendChild(graficoContainer);
                
                // Formatear etiquetas de meses
                const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const labels = mesesOrdenados.map(item => {
                    const [anio, mes] = item.mes.split('-');
                    return `${nombresMes[parseInt(mes) - 1]}/${anio}`;
                });
                
                // Crear gráfico
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Días Promedio',
                            data: mesesOrdenados.map(m => m.promedioDias.toFixed(1)),
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
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
                                title: {
                                    display: true,
                                    text: 'Días Promedio'
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    // Configurar eventos de exportación
    reporteResult.querySelectorAll('.exportar-reporte').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            exportarReporte('Tiempo de Fabricación', params.agruparPorProducto ? productosOrdenados : [], formato);
        });
    });
}

// Generador de reporte: Productos Más Solicitados
function generarReporteProductosMasSolicitados(params) {
    // Filtrar solicitudes por rango de fechas
    const solicitudesFiltradas = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin);
    });
    
    // Contar productos
    const productosCantidad = {};
    
    solicitudesFiltradas.forEach(solicitud => {
        if (solicitud.items && solicitud.items.length > 0) {
            solicitud.items.forEach(item => {
                if (!productosCantidad[item.producto]) {
                    productosCantidad[item.producto] = {
                        producto: item.producto,
                        cantidad: 0,
                        solicitudes: 0,
                        estados: {
                            'Solicitud enviada por bodega': 0,
                            'En fabricación': 0,
                            'Entregado': 0
                        }
                    };
                }
                
                productosCantidad[item.producto].cantidad += item.cantidad;
                productosCantidad[item.producto].solicitudes++;
                productosCantidad[item.producto].estados[solicitud.estado]++;
            });
        }
    });
    
    // Convertir a array y ordenar por cantidad
    const productosOrdenados = Object.values(productosCantidad)
        .sort((a, b) => b.cantidad - a.cantidad);
    
    // Tomar solo la cantidad solicitada (o todos si hay menos)
    const limite = Math.min(params.limite, productosOrdenados.length);
    const topProductos = productosOrdenados.slice(0, limite);
    
    // Generar resultado
    if (!reporteResult) return;
    
    // Limpiar contenedor
    reporteResult.innerHTML = '';
    
    // Título del reporte
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `
        <i class="fas fa-box me-2"></i>
        Top ${limite} Productos Más Solicitados
        <small class="d-block text-muted">
            Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}
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
    
    // Mostrar resultados según formato seleccionado
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        // Crear tabla
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'table-responsive mb-4';
        
        const tabla = document.createElement('table');
        tabla.className = 'table table-bordered table-hover';
        
        // Encabezado
        let thead = `<thead><tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Solicitudes</th>
            <th>Estado</th>
        </tr></thead>`;
        
        // Cuerpo
        let tbody = '<tbody>';
        
        topProductos.forEach(producto => {
            // Calcular porcentajes por estado
            const totalEstados = producto.estados['Solicitud enviada por bodega'] + 
                                producto.estados['En fabricación'] + 
                                producto.estados['Entregado'];
            
            const porcentajePendientes = totalEstados > 0 
                ? Math.round((producto.estados['Solicitud enviada por bodega'] / totalEstados) * 100) 
                : 0;
                
            const porcentajeFabricacion = totalEstados > 0 
                ? Math.round((producto.estados['En fabricación'] / totalEstados) * 100) 
                : 0;
                
            const porcentajeEntregadas = totalEstados > 0 
                ? Math.round((producto.estados['Entregado'] / totalEstados) * 100) 
                : 0;
            
            // Crear barra de progreso para visualizar estados
            const barraEstados = `
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-primary" style="width: ${porcentajePendientes}%" 
                        title="Pendientes: ${producto.estados['Solicitud enviada por bodega']} (${porcentajePendientes}%)">
                        ${porcentajePendientes}%
                    </div>
                    <div class="progress-bar bg-warning" style="width: ${porcentajeFabricacion}%" 
                        title="En fabricación: ${producto.estados['En fabricación']} (${porcentajeFabricacion}%)">
                        ${porcentajeFabricacion}%
                    </div>
                    <div class="progress-bar bg-success" style="width: ${porcentajeEntregadas}%" 
                        title="Entregadas: ${producto.estados['Entregado']} (${porcentajeEntregadas}%)">
                        ${porcentajeEntregadas}%
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-1 small">
                    <span>Pendientes: ${producto.estados['Solicitud enviada por bodega']}</span>
                    <span>En fab.: ${producto.estados['En fabricación']}</span>
                    <span>Entregadas: ${producto.estados['Entregado']}</span>
                </div>
            `;
            
            tbody += `<tr>
                <td>${producto.producto}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.solicitudes}</td>
                <td>${barraEstados}</td>
            </tr>`;
        });
        
        tbody += '</tbody>';
        
        tabla.innerHTML = thead + tbody;
        tablaContainer.appendChild(tabla);
        reporteResult.appendChild(tablaContainer);
    }
    
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        // Crear contenedor para el gráfico
        const graficoContainer = document.createElement('div');
        graficoContainer.className = 'grafico-container mb-4';
        graficoContainer.style.height = '400px';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'grafico-productos-solicitados';
        graficoContainer.appendChild(canvas);
        
        reporteResult.appendChild(graficoContainer);
        
        // Crear gráfico
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: topProductos.map(p => p.producto),
                datasets: [{
                    label: 'Cantidad',
                    data: topProductos.map(p => p.cantidad),
                    backgroundColor: topProductos.map((_, index) => {
                        // Colores diferentes para cada barra
                        const colores = [
                            '#3498db', '#2ecc71', '#f39c12', '#e74c3c', 
                            '#9b59b6', '#1abc9c', '#34495e', '#d35400',
                            '#27ae60', '#2980b9', '#8e44ad', '#c0392b'
                        ];
                        return colores[index % colores.length];
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Barras horizontales
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `Top ${limite} Productos Más Solicitados`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const producto = topProductos[context.dataIndex];
                                return [
                                    `Cantidad: ${producto.cantidad}`,
                                    `Solicitudes: ${producto.solicitudes}`,
                                    `Pendientes: ${producto.estados['Solicitud enviada por bodega']}`,
                                    `En fabricación: ${producto.estados['En fabricación']}`,
                                    `Entregadas: ${producto.estados['Entregado']}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad solicitada'
                        }
                    }
                }
            }
        });
        
        // Gráfico adicional para distribución por estado
        const graficoEstadosContainer = document.createElement('div');
        graficoEstadosContainer.className = 'grafico-container mt-4 mb-4';
        graficoEstadosContainer.style.height = '400px';
        
        const canvasEstados = document.createElement('canvas');
        canvasEstados.id = 'grafico-productos-estados';
        graficoEstadosContainer.appendChild(canvasEstados);
        
        // Título del segundo gráfico
        const tituloGrafico2 = document.createElement('h5');
        tituloGrafico2.className = 'mb-3 mt-4';
        tituloGrafico2.textContent = 'Distribución por Estado de los Top Productos';
        
        reporteResult.appendChild(tituloGrafico2);
        reporteResult.appendChild(graficoEstadosContainer);
        
        // Datos para el gráfico apilado
        const datasetPendientes = {
            label: 'Pendientes',
            data: topProductos.map(p => p.estados['Solicitud enviada por bodega']),
            backgroundColor: '#3498db'
        };
        
        const datasetFabricacion = {
            label: 'En Fabricación',
            data: topProductos.map(p => p.estados['En fabricación']),
            backgroundColor: '#f39c12'
        };
        
        const datasetEntregadas = {
            label: 'Entregadas',
            data: topProductos.map(p => p.estados['Entregado']),
            backgroundColor: '#2ecc71'
        };
        
        new Chart(canvasEstados, {
            type: 'bar',
            data: {
                labels: topProductos.map(p => p.producto),
                datasets: [datasetPendientes, datasetFabricacion, datasetEntregadas]
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
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Configurar eventos de exportación
    reporteResult.querySelectorAll('.exportar-reporte').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            exportarReporte('Productos Más Solicitados', topProductos, formato);
        });
    });
}

// Exportar reporte en diferentes formatos
function exportarReporte(nombreReporte, datos, formato) {
    // Registrar evento de exportación
    if (window.auditoria && typeof window.auditoria.registrarEvento === 'function') {
        window.auditoria.registrarEvento(
            window.auditoria.TIPO_EVENTO.EXPORTAR,
            window.auditoria.ENTIDAD.REPORTE,
            null,
            `Exportación de reporte: ${nombreReporte}`,
            { formato, cantidad: datos.length }
        );
    }
    
    switch (formato) {
        case 'csv':
            exportarReporteCSV(nombreReporte, datos);
            break;
            
        case 'excel':
            exportarReporteExcel(nombreReporte, datos);
            break;
            
        case 'pdf':
            exportarReportePDF(nombreReporte, datos);
            break;
            
        default:
            mostrarAlerta(`Formato de exportación '${formato}' no soportado`, 'warning');
    }
}

// Exportar reporte a CSV
function exportarReporteCSV(nombreReporte, datos) {
    if (!datos || datos.length === 0) {
        mostrarAlerta('No hay datos para exportar', 'warning');
        return;
    }
    
    // Obtener cabeceras del primer objeto
    const headers = Object.keys(datos[0]);
    
    // Crear contenido CSV
    let csvContent = headers.join(',') + '\n';
    
    datos.forEach(item => {
        const row = headers.map(header => {
            const value = item[header];
            
            // Manejar diferentes tipos de datos
            if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            } else {
                return value;
            }
        });
        
        csvContent += row.join(',') + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreReporte.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('Reporte exportado como CSV', 'success');
}

// Exportar reporte a Excel
function exportarReporteExcel(nombreReporte, datos) {
    if (!datos || datos.length === 0) {
        mostrarAlerta('No hay datos para exportar', 'warning');
        return;
    }
    
    // Mostrar limitaciones actuales (en una implementación real, usaríamos una biblioteca como SheetJS)
    mostrarAlerta('Exportación a Excel: Funcionalidad en desarrollo. Por ahora, utilice la exportación CSV.', 'info');
    exportarReporteCSV(nombreReporte, datos);
}

// Exportar reporte a PDF
function exportarReportePDF(nombreReporte, datos) {
    // En una implementación real, utilizaríamos una biblioteca como jsPDF
    mostrarAlerta('Exportación a PDF: Funcionalidad en desarrollo. Por ahora, utilice la opción de impresión del navegador.', 'info');
    
    // Configurar página para impresión
    window.print();
}

// Exponer funciones al ámbito global
window.reportes = {
    init: initReportes,
    generarReporte,
    TIPOS_REPORTE
};
