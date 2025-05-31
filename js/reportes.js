// js/reportes.js

// Variables globales para reportes (si son necesarias fuera de las funciones)
// const reporteContainer = document.getElementById('reporte-container'); // Ya no se usa directamente
const reporteForm = document.getElementById('reporte-form');
const reporteResult = document.getElementById('reporte-result');

// Tipos de reportes disponibles (asegúrate que coincidan con el HTML)
const TIPOS_REPORTE = {
    SOLICITUDES_POR_ESTADO: 'solicitudes_por_estado',
    TIEMPO_FABRICACION: 'tiempo_fabricacion',
    PRODUCTOS_MAS_SOLICITADOS: 'productos_mas_solicitados',
    ACTIVIDAD_USUARIOS: 'actividad_usuarios',
    RENDIMIENTO_MENSUAL: 'rendimiento_mensual',
    REPORTE_PERSONALIZADO: 'reporte_personalizado'
};

// ==================== FUNCIONES DE INICIALIZACIÓN Y UI ====================

/**
 * Inicializa el sistema de reportes, configurando listeners.
 */
function initReportes() {
    console.log("Inicializando sistema de reportes...");
    
    if (!reporteForm) {
        console.error("Formulario de reportes (reporte-form) no encontrado en el DOM.");
        return;
    }
    
    reporteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Formulario enviado, generando reporte...");
        generarReporte();
    });
    
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    if (tipoReporteSelect) {
        tipoReporteSelect.addEventListener('change', actualizarFormularioReporte);
        actualizarFormularioReporte(); // Llamada inicial para configurar el formulario
    } else {
        console.error("Selector de tipo de reporte (tipo-reporte) no encontrado.");
    }
    
    console.log("Sistema de reportes inicializado correctamente.");
}

/**
 * Actualiza las opciones del formulario dinámicamente según el tipo de reporte seleccionado.
 */
function actualizarFormularioReporte() {
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    const opcionesContainer = document.getElementById('opciones-reporte');
    
    if (!tipoReporteSelect || !opcionesContainer) {
        console.error("Elementos necesarios para actualizarFormularioReporte no encontrados.");
        return;
    }
    const tipoReporte = tipoReporteSelect.value;
    console.log("Actualizando formulario para tipo:", tipoReporte);
    opcionesContainer.innerHTML = ''; // Limpiar opciones anteriores

    // Opciones comunes de fecha (si aplican)
    const getOpcionesFechaHTML = () => `
        <div class="col-md-6">
            <label class="form-label">Fecha inicio</label>
            <input type="date" class="form-control" name="fecha_inicio" required>
        </div>
        <div class="col-md-6">
            <label class="form-label">Fecha fin</label>
            <input type="date" class="form-control" name="fecha_fin" required>
        </div>
    `;

    let htmlOpciones = '<div class="row g-3">'; // Abrir row

    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `
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
            `;
            break;
            
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `
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
            `;
            break;
            
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `
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
            `;
            break;
            
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
            htmlOpciones += getOpcionesFechaHTML();
            // Asumiendo que 'usuarios' es una variable global con la lista de usuarios
            const usuariosOptions = (typeof usuarios !== 'undefined' && Array.isArray(usuarios)) 
                ? usuarios.map(u => `<option value="${u.username}">${u.displayName || u.username}</option>`).join('')
                : '<option value="">No hay usuarios para seleccionar</option>';
            htmlOpciones += `
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
            `;
            break;
            
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
            const currentYear = new Date().getFullYear();
            htmlOpciones += `
                <div class="col-md-6">
                    <label class="form-label">Año</label>
                    <select class="form-select" name="anio">
                        <option value="${currentYear}">${currentYear}</option>
                        <option value="${currentYear-1}">${currentYear-1}</option>
                        <option value="${currentYear-2}">${currentYear-2}</option>
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
            `;
            break;
            
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `
                <div class="col-md-12">
                    <label class="form-label">Campos a incluir</label>
                    <div class="row g-2">
                        <div class="col-md-4">
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="id" checked><label class="form-check-label">ID</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="notaVenta" checked><label class="form-check-label">Nota de Venta</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="cliente" checked><label class="form-check-label">Cliente</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="local" checked><label class="form-check-label">Local</label></div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaSolicitud" checked><label class="form-check-label">Fecha Solicitud</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="estado" checked><label class="form-check-label">Estado</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="observaciones"><label class="form-check-label">Observaciones</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="items" checked><label class="form-check-label">Productos</label></div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="creadoPor"><label class="form-check-label">Creado Por</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="historial"><label class="form-check-label">Historial (último)</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaEstimada"><label class="form-check-label">Fecha Estimada</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaEntrega"><label class="form-check-label">Fecha Entrega</label></div>
                            <div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="tiempoFabricacion"><label class="form-check-label">Tiempo Fabricación</label></div>
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
                        <option value="fechaSolicitud_desc">Fecha (más recientes)</option>
                        <option value="fechaSolicitud_asc">Fecha (más antiguas)</option>
                        <option value="notaVenta_asc">Nota de Venta (A-Z)</option>
                        <option value="estado_asc">Estado (A-Z)</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Formato Salida</label>
                    <select class="form-select" name="formato_salida">
                        <option value="html" selected>HTML (Vista Previa)</option>
                        <option value="csv">CSV</option>
                        <option value="excel">Excel (XLSX)</option>
                        <option value="pdf">PDF</option>
                    </select>
                </div>
            `;
            break;
            
        default:
            htmlOpciones += `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>Por favor, selecciona un tipo de reporte.
                    </div>
                </div>
            `;
    }
    htmlOpciones += '</div>'; // Cerrar row
    opcionesContainer.innerHTML = htmlOpciones;

    // Establecer fecha actual en los inputs de fecha si existen
    const fechaActual = new Date();
    const fechaInicioDefault = new Date();
    fechaInicioDefault.setMonth(fechaInicioDefault.getMonth() - 1); // Un mes atrás por defecto
    
    const formatoFechaInput = fecha => fecha.toISOString().split('T')[0];
    
    const fechaInicioInputs = opcionesContainer.querySelectorAll('input[name="fecha_inicio"]');
    fechaInicioInputs.forEach(input => { input.value = formatoFechaInput(fechaInicioDefault); });
    
    const fechaFinInputs = opcionesContainer.querySelectorAll('input[name="fecha_fin"]');
    fechaFinInputs.forEach(input => { input.value = formatoFechaInput(fechaActual); });
}


// ==================== FUNCIONES DE CONTROL PRINCIPAL ====================

/**
 * Genera el reporte seleccionado con los parámetros del formulario.
 */
function generarReporte() {
    console.log("Generando reporte...");
    if (typeof mostrarSincronizacion === 'function') mostrarSincronizacion('Generando reporte...');
    else console.warn("Función mostrarSincronizacion no definida.");
    
    try {
        const tipoReporteSelect = document.getElementById('tipo-reporte');
        if (!tipoReporteSelect) throw new Error("Selector de tipo de reporte no encontrado.");
        const tipoReporte = tipoReporteSelect.value;
        
        if (!tipoReporte) throw new Error('Debe seleccionar un tipo de reporte');
        
        const params = obtenerParametrosReporte(tipoReporte);
        
        // Limpiar resultados anteriores
        if (reporteResult) reporteResult.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-2">Cargando reporte...</p></div>';
        else throw new Error("Contenedor de resultados (reporte-result) no encontrado.");

        // Usar setTimeout para permitir que el spinner se muestre antes de la ejecución larga
        setTimeout(() => {
            try {
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
                        throw new Error('Tipo de reporte no válido o no implementado');
                }
                
                if (window.auditoria && typeof window.auditoria.registrarEvento === 'function') {
                    window.auditoria.registrarEvento(
                        window.auditoria.TIPO_EVENTO.EXPORTAR, // Asumiendo que generar es como una exportación visual
                        window.auditoria.ENTIDAD.REPORTE,
                        null, // ID del objeto (podría ser un ID de reporte si se guardan)
                        `Generación de reporte: ${tipoReporte}`,
                        params // Datos relevantes del reporte
                    );
                }
            } catch (error) {
                 console.error('Error dentro del setTimeout de generarReporte:', error);
                 if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error generando reporte: ${error.message}</div>`;
            } finally {
                 if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
                 else console.warn("Función ocultarSincronizacion no definida.");
            }
        }, 50); // Pequeño delay

    } catch (error) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(`Error al generar reporte: ${error.message}`, 'danger');
        else alert(`Error al generar reporte: ${error.message}`);
        console.error('Error al generar reporte:', error);
        if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>${error.message}</div>`;
        if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
    }
}

/**
 * Obtiene los parámetros del formulario según el tipo de reporte.
 * @param {string} tipoReporte - El tipo de reporte seleccionado.
 * @returns {object} Objeto con los parámetros.
 */
function obtenerParametrosReporte(tipoReporte) {
    const params = {};
    const opcionesContainer = document.getElementById('opciones-reporte');
    if (!opcionesContainer) throw new Error("Contenedor de opciones de reporte no encontrado");

    const getInputValue = (name, defaultValue = null) => {
        const input = opcionesContainer.querySelector(`input[name="${name}"], select[name="${name}"]`);
        return input ? input.value : defaultValue;
    };
    const getInputChecked = (name, defaultValue = false) => {
        const input = opcionesContainer.querySelector(`input[name="${name}"]`);
        return input ? input.checked : defaultValue;
    };

    if (['solicitudes_por_estado', 'tiempo_fabricacion', 'productos_mas_solicitados', 'actividad_usuarios', 'reporte_personalizado'].includes(tipoReporte)) {
        params.fechaInicio = getInputValue('fecha_inicio');
        params.fechaFin = getInputValue('fecha_fin');
        if (!params.fechaInicio || !params.fechaFin) throw new Error('Las fechas de inicio y fin son requeridas');
        if (new Date(params.fechaInicio) > new Date(params.fechaFin)) throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            params.agruparPor = getInputValue('agrupar_por', 'mes');
            params.formato = getInputValue('formato', 'grafico');
            break;
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            params.agruparPorProducto = getInputChecked('agrupar_producto', true);
            params.formato = getInputValue('formato', 'ambos');
            break;
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            params.limite = parseInt(getInputValue('limite', '10'));
            params.formato = getInputValue('formato', 'grafico');
            break;
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
            params.usuarioId = getInputValue('usuario_id', '');
            params.formato = getInputValue('formato', 'tabla');
            break;
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
            params.anio = getInputValue('anio', new Date().getFullYear().toString());
            params.incluirProyeccion = getInputChecked('incluir_proyeccion', true);
            params.metrica = getInputValue('metrica', 'solicitudes');
            params.formato = getInputValue('formato', 'grafico');
            break;
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
            params.campos = Array.from(opcionesContainer.querySelectorAll('input[name="campos"]:checked')).map(c => c.value);
            if (params.campos.length === 0) throw new Error("Debe seleccionar al menos un campo para el reporte personalizado.");
            params.filtroEstado = getInputValue('filtro_estado', '');
            params.ordenarPor = getInputValue('ordenar_por', 'fechaSolicitud_desc');
            params.formatoSalida = getInputValue('formato_salida', 'html');
            break;
    }
    return params;
}

// ==================== FUNCIONES DE GENERACIÓN DE REPORTES ESPECÍFICOS ====================

// Función auxiliar para formatear fechas (si no está en utils.js)
if (typeof formatDate !== 'function') {
    window.formatDate = function(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            // Verificar si la fecha es válida; toLocaleDateString puede dar resultados inesperados para fechas inválidas
            if (isNaN(date.getTime())) return dateString; // Devolver original si no es parseable
            return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString; // Devolver original si hay error
        }
    };
}

// Generador de reporte: Solicitudes por Estado
function generarReporteSolicitudesPorEstado(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = '<p>Generando reporte de Solicitudes por Estado...</p>'; // Placeholder
    
    // Implementación basada en el código que proporcionaste anteriormente
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
        
        switch (params.agruparPor) {
            case 'dia': periodoKey = fecha.toISOString().split('T')[0]; break;
            case 'semana':
                const diaSemana = fecha.getDay();
                const lunes = new Date(fecha);
                lunes.setDate(fecha.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
                periodoKey = lunes.toISOString().split('T')[0];
                break;
            case 'mes':
            default:
                periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                break;
        }
        
        if (!datosPorPeriodo[periodoKey]) {
            datosPorPeriodo[periodoKey] = { periodo: periodoKey, total: 0 };
            estadosPosibles.forEach(estado => { datosPorPeriodo[periodoKey][estado] = 0; });
        }
        
        datosPorPeriodo[periodoKey].total++;
        if (estadosPosibles.includes(solicitud.estado)) {
            datosPorPeriodo[periodoKey][solicitud.estado]++;
        } else {
            // Considerar un estado 'Otro' o ignorar si no coincide
            datosPorPeriodo[periodoKey]['Otro'] = (datosPorPeriodo[periodoKey]['Otro'] || 0) + 1;
        }
    });
    
    const datosOrdenados = Object.values(datosPorPeriodo).sort((a, b) => a.periodo.localeCompare(b.periodo));
    
    const labels = [];
    const datasets = [
        { label: 'Pendientes', backgroundColor: '#3498db', data: [] },
        { label: 'En Fabricación', backgroundColor: '#f39c12', data: [] },
        { label: 'Entregadas', backgroundColor: '#2ecc71', data: [] }
    ];
    if (datosOrdenados.some(d => d['Otro'] > 0)) { // Si hay estados 'Otro'
        datasets.push({ label: 'Otro', backgroundColor: '#95a5a6', data: [] });
    }

    datosOrdenados.forEach(dato => {
        let etiqueta;
        switch (params.agruparPor) {
            case 'dia': const [anio, mes, dia] = dato.periodo.split('-'); etiqueta = `${dia}/${mes}/${anio.slice(-2)}`; break;
            case 'semana': const [anioS, mesS, diaS] = dato.periodo.split('-'); etiqueta = `Sem ${diaS}/${mesS}`; break;
            case 'mes': default: const [anioM, mesM] = dato.periodo.split('-'); const nombresM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; etiqueta = `${nombresM[parseInt(mesM) - 1]}/${anioM.slice(-2)}`; break;
        }
        labels.push(etiqueta);
        datasets[0].data.push(dato['Solicitud enviada por bodega'] || 0);
        datasets[1].data.push(dato['En fabricación'] || 0);
        datasets[2].data.push(dato['Entregado'] || 0);
        if (datasets.length > 3) datasets[3].data.push(dato['Otro'] || 0);
    });
    
    reporteResult.innerHTML = ''; // Limpiar placeholder
    
    const tituloEl = document.createElement('h4');
    tituloEl.className = 'reporte-titulo mb-3';
    tituloEl.innerHTML = `<i class="fas fa-chart-bar me-2"></i>Reporte de Solicitudes por Estado <small class="d-block text-muted">Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}</small>`;
    reporteResult.appendChild(tituloEl);
    
    // Añadir botones de exportación
    const accionesDiv = crearBotonesExportacion('Solicitudes por Estado', datosOrdenados);
    reporteResult.appendChild(accionesDiv);

    if (params.formato === 'tabla' || params.formato === 'ambos') {
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'table-responsive mb-4';
        const tabla = document.createElement('table');
        tabla.className = 'table table-bordered table-hover table-sm';
        let thead = `<thead><tr><th>Período</th><th>Pendientes</th><th>En Fabricación</th><th>Entregadas</th>`;
        if (datasets.length > 3) thead += `<th>Otro</th>`;
        thead += `<th>Total</th></tr></thead>`;
        
        let tbody = '<tbody>';
        datosOrdenados.forEach((dato, index) => {
            tbody += `<tr><td>${labels[index]}</td><td>${dato['Solicitud enviada por bodega'] || 0}</td><td>${dato['En fabricación'] || 0}</td><td>${dato['Entregado'] || 0}</td>`;
            if (datasets.length > 3) tbody += `<td>${dato['Otro'] || 0}</td>`;
            tbody += `<td>${dato.total}</td></tr>`;
        });
        // Fila de totales
        const totalPendientes = datosOrdenados.reduce((sum, d) => sum + (d['Solicitud enviada por bodega'] || 0), 0);
        const totalEnFabricacion = datosOrdenados.reduce((sum, d) => sum + (d['En fabricación'] || 0), 0);
        const totalEntregadas = datosOrdenados.reduce((sum, d) => sum + (d['Entregado'] || 0), 0);
        const totalOtro = datasets.length > 3 ? datosOrdenados.reduce((sum, d) => sum + (d['Otro'] || 0), 0) : 0;
        const granTotal = datosOrdenados.reduce((sum, d) => sum + d.total, 0);

        tbody += `<tr class="table-secondary fw-bold"><td><strong>TOTAL</strong></td><td><strong>${totalPendientes}</strong></td><td><strong>${totalEnFabricacion}</strong></td><td><strong>${totalEntregadas}</strong></td>`;
        if (datasets.length > 3) tbody += `<td><strong>${totalOtro}</strong></td>`;
        tbody += `<td><strong>${granTotal}</strong></td></tr>`;
        tbody += '</tbody>';
        tabla.innerHTML = thead + tbody;
        tablaContainer.appendChild(tabla);
        reporteResult.appendChild(tablaContainer);
    }

    if (params.formato === 'grafico' || params.formato === 'ambos') {
        const graficoContainer = document.createElement('div');
        graficoContainer.className = 'grafico-container mb-4';
        graficoContainer.style.height = '400px';
        const canvas = document.createElement('canvas');
        graficoContainer.appendChild(canvas);
        reporteResult.appendChild(graficoContainer);
        
        new Chart(canvas, {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Distribución de Solicitudes por Estado' }, legend: { position: 'bottom' } },
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
    // (Aquí iría la lógica para mostrar el resumen que tenías)
}

// Generador de reporte: Tiempo de Fabricación
function generarReporteTiempoFabricacion(params) {
    // (Tu lógica para este reporte)
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Tiempo de Fabricación para el período ${params.fechaInicio} a ${params.fechaFin}...</p><p>Agrupar por producto: ${params.agruparPorProducto}. Formato: ${params.formato}</p>`;
}

// Generador de reporte: Productos más Solicitados
function generarReporteProductosMasSolicitados(params) {
    // (Tu lógica para este reporte)
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Productos más Solicitados (Top ${params.limite}) para el período ${params.fechaInicio} a ${params.fechaFin}...</p><p>Formato: ${params.formato}</p>`;
}

// Generador de reporte: Actividad de Usuarios
function generarReporteActividadUsuarios(params) {
    // (Tu lógica para este reporte)
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Actividad de Usuarios para ${params.usuarioId || 'todos los usuarios'} en el período ${params.fechaInicio} a ${params.fechaFin}...</p><p>Formato: ${params.formato}</p>`;
}


// El código que me pasaste para generarReportePersonalizado y generarReporteRendimientoMensual
// se inserta aquí, asegurándose que las llaves de cierre estén correctas.

// Generador de reporte: Reporte Personalizado
function generarReportePersonalizado(params) {
    // Filtrar solicitudes por rango de fechas y estado
    let solicitudesFiltradas = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => {
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
        
        if (campoOrden === 'fechaSolicitud' || campoOrden === 'fechaEstimada' || campoOrden === 'fechaEntrega') {
            valorA = a[campoOrden] ? new Date(a[campoOrden]) : null;
            valorB = b[campoOrden] ? new Date(b[campoOrden]) : null;
            // Manejar nulos para fechas
            if (valorA === null && valorB === null) return 0;
            if (valorA === null) return direccion === 'asc' ? -1 : 1;
            if (valorB === null) return direccion === 'asc' ? 1 : -1;
        } else if (campoOrden === 'tiempoFabricacion') {
            valorA = calcularTiempoFabricacionDias(a);
            valorB = calcularTiempoFabricacionDias(b);
        }
        else {
            valorA = a[campoOrden];
            valorB = b[campoOrden];
            
            if (valorA !== undefined && valorA !== null && typeof valorA.toString === 'function') valorA = valorA.toString().toLowerCase();
            else valorA = ''; // Default para nulos/undefined en strings
            if (valorB !== undefined && valorB !== null && typeof valorB.toString === 'function') valorB = valorB.toString().toLowerCase();
            else valorB = '';
        }
        
        if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
        return 0;
    });
    
    if (!reporteResult) return;
    reporteResult.innerHTML = '';
    
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
    
    const accionesDiv = crearBotonesExportacion('Reporte Personalizado', solicitudesFiltradas, params.campos);
    reporteResult.appendChild(accionesDiv);
    
    if (solicitudesFiltradas.length === 0) {
        reporteResult.appendChild(crearMensajeSinDatos());
        return;
    }
    
    const tablaContainer = document.createElement('div');
    tablaContainer.className = 'table-responsive mb-4';
    const tabla = document.createElement('table');
    tabla.className = 'table table-bordered table-hover table-sm';
    
    let thead = '<thead><tr>';
    const nombresCampos = {
        'id': 'ID', 'notaVenta': 'Nota Venta', 'cliente': 'Cliente', 'local'
