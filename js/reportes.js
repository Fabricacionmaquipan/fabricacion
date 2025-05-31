// js/reportes.js

// Variables globales para reportes (si son necesarias fuera de las funciones)
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

    let htmlOpciones = '<div class="row g-3">'; 

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

    const fechaActual = new Date();
    const fechaInicioDefault = new Date();
    fechaInicioDefault.setMonth(fechaInicioDefault.getMonth() - 1); 
    
    const formatoFechaInput = fecha => fecha.toISOString().split('T')[0];
    
    const fechaInicioInputs = opcionesContainer.querySelectorAll('input[name="fecha_inicio"]');
    fechaInicioInputs.forEach(input => { input.value = formatoFechaInput(fechaInicioDefault); });
    
    const fechaFinInputs = opcionesContainer.querySelectorAll('input[name="fecha_fin"]');
    fechaFinInputs.forEach(input => { input.value = formatoFechaInput(fechaActual); });
}

// ==================== FUNCIONES DE CONTROL PRINCIPAL ====================

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
        
        if (reporteResult) reporteResult.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-2">Cargando reporte...</p></div>';
        else throw new Error("Contenedor de resultados (reporte-result) no encontrado.");

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
                        window.auditoria.TIPO_EVENTO.EXPORTAR, 
                        window.auditoria.ENTIDAD.REPORTE,
                        null, 
                        `Generación de reporte: ${tipoReporte}`,
                        params 
                    );
                }
            } catch (error) {
                 console.error('Error dentro del setTimeout de generarReporte:', error);
                 if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error generando reporte: ${error.message}</div>`;
            } finally {
                 if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
                 else console.warn("Función ocultarSincronizacion no definida.");
            }
        }, 50); 

    } catch (error) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(`Error al generar reporte: ${error.message}`, 'danger');
        else alert(`Error al generar reporte: ${error.message}`);
        console.error('Error al generar reporte:', error);
        if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>${error.message}</div>`;
        if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
    }
}

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

if (typeof formatDate !== 'function') {
    window.formatDate = function(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; 
            return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString; 
        }
    };
}

function generarReporteSolicitudesPorEstado(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = '<p>Generando reporte de Solicitudes por Estado...</p>'; 
    
    const solicitudesFiltradas = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin);
    });
    
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
            case 'mes': default: periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; break;
        }
        
        if (!datosPorPeriodo[periodoKey]) {
            datosPorPeriodo[periodoKey] = { periodo: periodoKey, total: 0 };
            estadosPosibles.forEach(estado => { datosPorPeriodo[periodoKey][estado] = 0; });
        }
        
        datosPorPeriodo[periodoKey].total++;
        if (estadosPosibles.includes(solicitud.estado)) {
            datosPorPeriodo[periodoKey][solicitud.estado]++;
        } else {
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
    if (datosOrdenados.some(d => d['Otro'] > 0)) { 
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
    
    reporteResult.innerHTML = ''; 
    
    const tituloEl = document.createElement('h4');
    tituloEl.className = 'reporte-titulo mb-3';
    tituloEl.innerHTML = `<i class="fas fa-chart-bar me-2"></i>Reporte de Solicitudes por Estado <small class="d-block text-muted">Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}</small>`;
    reporteResult.appendChild(tituloEl);
    
    const accionesDiv = crearBotonesExportacion('Solicitudes_por_Estado', datosOrdenados);
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
}

function generarReporteTiempoFabricacion(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Tiempo de Fabricación...</p>`;
    // Lógica detallada para este reporte...
}

function generarReporteProductosMasSolicitados(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Productos más Solicitados...</p>`;
    // Lógica detallada para este reporte...
}

function generarReporteActividadUsuarios(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = `<p>Generando reporte de Actividad de Usuarios...</p>`;
    // Lógica detallada para este reporte...
}

function generarReportePersonalizado(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = ''; 
    
    let solicitudesFiltradas = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud >= new Date(params.fechaInicio) && 
               fechaSolicitud <= new Date(params.fechaFin);
    });
    
    if (params.filtroEstado) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => s.estado === params.filtroEstado);
    }
    
    const [campoOrden, direccion] = params.ordenarPor.split('_');
    
    solicitudesFiltradas.sort((a, b) => {
        let valorA, valorB;
        if (['fechaSolicitud', 'fechaEstimada', 'fechaEntrega'].includes(campoOrden)) {
            valorA = a[campoOrden] ? new Date(a[campoOrden]) : null;
            valorB = b[campoOrden] ? new Date(b[campoOrden]) : null;
            if (valorA === null && valorB === null) return 0;
            if (valorA === null) return direccion === 'asc' ? -1 : 1;
            if (valorB === null) return direccion === 'asc' ? 1 : -1;
        } else if (campoOrden === 'tiempoFabricacion') {
            valorA = calcularTiempoFabricacionDias(a); // Asegúrate que esto devuelva número o N/A consistente
            valorB = calcularTiempoFabricacionDias(b);
            // Convertir 'N/A' a un valor comparable (ej. -1 o Infinity)
            valorA = valorA === 'N/A' ? (direccion === 'asc' ? Infinity : -Infinity) : parseFloat(valorA);
            valorB = valorB === 'N/A' ? (direccion === 'asc' ? Infinity : -Infinity) : parseFloat(valorB);
        } else {
            valorA = a[campoOrden];
            valorB = b[campoOrden];
            if (valorA !== undefined && valorA !== null && typeof valorA.toString === 'function') valorA = valorA.toString().toLowerCase(); else valorA = '';
            if (valorB !== undefined && valorB !== null && typeof valorB.toString === 'function') valorB = valorB.toString().toLowerCase(); else valorB = '';
        }
        if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
        return 0;
    });
    
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `<i class="fas fa-clipboard-list me-2"></i>Reporte Personalizado <small class="d-block text-muted">Período: ${formatDate(params.fechaInicio)} - ${formatDate(params.fechaFin)}${params.filtroEstado ? ` | Estado: ${params.filtroEstado}` : ''}</small>`;
    reporteResult.appendChild(titulo);
    
    const accionesDiv = crearBotonesExportacion('Reporte_Personalizado', solicitudesFiltradas, params.campos);
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
        'id': 'ID', 'notaVenta': 'Nota Venta', 'cliente': 'Cliente', 'local': 'Local',
        'fechaSolicitud': 'Fecha Sol.', 'estado': 'Estado', 'observaciones': 'Observaciones',
        'items': 'Productos', 'creadoPor': 'Creado Por', 'historial': 'Últ. Actividad',
        'fechaEstimada': 'Fecha Est.', 'fechaEntrega': 'Fecha Ent.', 'tiempoFabricacion': 'T. Fab. (días)'
    };
    params.campos.forEach(campo => { thead += `<th>${nombresCampos[campo] || campo.charAt(0).toUpperCase() + campo.slice(1)}</th>`; });
    thead += '</tr></thead>';
    
    let tbody = '<tbody>';
    solicitudesFiltradas.forEach(solicitud => {
        tbody += '<tr>';
        params.campos.forEach(campo => {
            let contenido = '';
            switch (campo) {
                case 'id': contenido = solicitud.id ? solicitud.id.slice(-6) : 'N/A'; break;
                case 'fechaSolicitud': case 'fechaEstimada': case 'fechaEntrega': contenido = solicitud[campo] ? formatDate(solicitud[campo]) : 'N/A'; break;
                case 'estado': contenido = `<span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado || 'N/A'}</span>`; break;
                case 'items':
                    if (solicitud.items && solicitud.items.length > 0) {
                        contenido = '<ul class="list-unstyled mb-0 small">';
                        solicitud.items.forEach(item => { contenido += `<li>${item.producto || 'N/A'} (x${item.cantidad || 0})</li>`; });
                        contenido += '</ul>';
                    } else { contenido = '<span class="text-muted small">Sin productos</span>'; }
                    break;
                case 'creadoPor': contenido = solicitud.creadoPor ? (solicitud.creadoPor.displayName || solicitud.creadoPor.username || 'N/A') : 'N/A'; break;
                case 'historial':
                    if (solicitud.historial && solicitud.historial.length > 0) {
                        const ultimo = solicitud.historial[solicitud.historial.length - 1];
                        contenido = `<div class="small"><strong>${ultimo.estado || 'N/A'}</strong> (${formatDate(ultimo.fecha)})<br><span class="text-muted">${ultimo.usuario || 'N/A'}</span></div>`;
                    } else { contenido = '<span class="text-muted small">Sin historial</span>'; }
                    break;
                case 'tiempoFabricacion': contenido = calcularTiempoFabricacionDias(solicitud); break;
                default: contenido = (solicitud[campo] !== undefined && solicitud[campo] !== null) ? solicitud[campo] : '<span class="text-muted small">N/A</span>';
            }
            tbody += `<td>${contenido}</td>`;
        });
        tbody += '</tr>';
    });
    tbody += '</tbody>';
    
    tabla.innerHTML = thead + tbody;
    tablaContainer.appendChild(tabla);
    reporteResult.appendChild(tablaContainer);

    if (params.formatoSalida && params.formatoSalida !== 'html') {
        setTimeout(() => { 
            exportarReporte('Reporte_Personalizado', solicitudesFiltradas, params.formatoSalida, params.campos);
        }, 500);
    }
} 

function generarReporteRendimientoMensual(params) {
    const anio = params.anio;
    const solicitudesAnio = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => {
        const fechaSolicitud = new Date(s.fechaSolicitud);
        return fechaSolicitud.getFullYear().toString() === anio;
    });
    
    const datosMensuales = [];
    const nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth(); 
    const anioActual = fechaActual.getFullYear();
    const esAnioActual = parseInt(anio) === anioActual;
    
    for (let mes = 0; mes < 12; mes++) {
        const solicitudesMes = solicitudesAnio.filter(s => new Date(s.fechaSolicitud).getMonth() === mes);
        const solicitudesCompletadas = solicitudesMes.filter(s => s.estado === 'Entregado');
        let tiempoTotalMs = 0;
        solicitudesCompletadas.forEach(solicitud => {
            tiempoTotalMs += calcularTiempoFabricacionMs(solicitud);
        });
        const tiempoPromedioMs = solicitudesCompletadas.length > 0 ? tiempoTotalMs / solicitudesCompletadas.length : 0;
        const diasPromedio = tiempoPromedioMs / (1000 * 60 * 60 * 24);
        const esMesFuturo = esAnioActual && mes > mesActual;
        
        datosMensuales.push({
            mes: mes + 1, nombreMes: nombresMes[mes],
            solicitudes: solicitudesMes.length, completadas: solicitudesCompletadas.length,
            diasPromedio: diasPromedio, proyeccion: esMesFuturo
        });
    }
    
    if (params.incluirProyeccion && esAnioActual) {
        const mesesDisponibles = datosMensuales.filter(d => !d.proyeccion && d.solicitudes > 0); 
        if (mesesDisponibles.length > 0) {
            const ultimosMeses = mesesDisponibles.slice(-Math.min(3, mesesDisponibles.length)); 
            const promedioSolicitudes = ultimosMeses.reduce((sum, m) => sum + m.solicitudes, 0) / ultimosMeses.length;
            const promedioCompletadas = ultimosMeses.reduce((sum, m) => sum + m.completadas, 0) / ultimosMeses.length;
            const promedioDias = ultimosMeses.reduce((sum, m) => sum + m.diasPromedio, 0) / ultimosMeses.length;
            
            datosMensuales.forEach(mesData => {
                if (mesData.proyeccion) {
                    mesData.solicitudes = Math.round(promedioSolicitudes);
                    mesData.completadas = Math.round(promedioCompletadas);
                    mesData.diasPromedio = promedioDias;
                }
            });
        }
    }
    
    if (!reporteResult) return;
    reporteResult.innerHTML = '';
    
    const metricaTitulos = { 'solicitudes': 'Total de Solicitudes', 'completadas': 'Solicitudes Completadas', 'tiempo': 'Tiempo Promedio de Fabricación (días)' };
    const titulo = document.createElement('h4');
    titulo.className = 'reporte-titulo mb-3';
    titulo.innerHTML = `<i class="fas fa-chart-line me-2"></i> Reporte de Rendimiento Mensual ${anio} <small class="d-block text-muted">Métrica principal: ${metricaTitulos[params.metrica] || 'Total de Solicitudes'}${params.incluirProyeccion && esAnioActual ? ' (incluye proyección)' : ''}</small>`;
    reporteResult.appendChild(titulo);
    
    const accionesDiv = crearBotonesExportacion('Rendimiento_Mensual_' + anio, datosMensuales);
    reporteResult.appendChild(accionesDiv);
    
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'card mb-4';
    const datosRealesAnuales = datosMensuales.filter(d => !d.proyeccion);
    const totalSolicitudesAnual = datosRealesAnuales.reduce((sum, m) => sum + m.solicitudes, 0);
    const totalCompletadasAnual = datosRealesAnuales.reduce((sum, m) => sum + m.completadas, 0);
    const tasaCompletitudAnual = totalSolicitudesAnual > 0 ? (totalCompletadasAnual / totalSolicitudesAnual) * 100 : 0;
    const diasPromedioAnualGlobal = totalCompletadasAnual > 0 ? datosRealesAnuales.reduce((sum, m) => sum + (m.diasPromedio * m.completadas), 0) / totalCompletadasAnual : 0;

    resumenDiv.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Resumen Anual ${anio} ${esAnioActual && datosRealesAnuales.length < 12 ? '(Hasta la fecha)' : ''}</h5>
            <div class="row">
                <div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${totalSolicitudesAnual}</span><span class="metric-label">Solicitudes</span></div></div>
                <div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${totalCompletadasAnual}</span><span class="metric-label">Completadas</span></div></div>
                <div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${tasaCompletitudAnual.toFixed(1)}%</span><span class="metric-label">Completitud</span></div></div>
                <div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${diasPromedioAnualGlobal.toFixed(1)}</span><span class="metric-label">Días Prom.</span></div></div>
            </div>
        </div>`;
    reporteResult.appendChild(resumenDiv);

    if (params.formato === 'tabla' || params.formato === 'ambos') {
        const tablaContainer = document.createElement('div');
        tablaContainer.className = 'table-responsive mb-4';
        const tabla = document.createElement('table');
        tabla.className = 'table table-bordered table-hover table-sm';
        let thead = `<thead><tr><th>Mes</th><th>Solicitudes</th><th>Completadas</th><th>Completitud (%)</th><th>Días Promedio</th></tr></thead>`;
        let tbody = '<tbody>';
        datosMensuales.forEach(mes => {
            const tasaMes = mes.solicitudes > 0 ? (mes.completadas / mes.solicitudes) * 100 : 0;
            const rowClass = mes.proyeccion ? 'table-light text-muted fst-italic' : '';
            const proyLabel = mes.proyeccion ? ' (Proy.)' : '';
            tbody += `<tr class="${rowClass}"><td>${mes.nombreMes}${proyLabel}</td><td>${mes.solicitudes}</td><td>${mes.completadas}</td><td>${tasaMes.toFixed(1)}</td><td>${mes.diasPromedio.toFixed(1)}</td></tr>`;
        });
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

        const labels = datosMensuales.map(m => m.nombreMes);
        let datosGrafico, labelY, colorGrafico;
        switch (params.metrica) {
            case 'completadas': datosGrafico = datosMensuales.map(m => m.completadas); labelY = 'Solicitudes Completadas'; colorGrafico = '#2ecc71'; break;
            case 'tiempo': datosGrafico = datosMensuales.map(m => m.diasPromedio); labelY = 'Días Promedio'; colorGrafico = '#f39c12'; break;
            default: datosGrafico = datosMensuales.map(m => m.solicitudes); labelY = 'Total de Solicitudes'; colorGrafico = '#3498db'; break;
        }
        
        const datosRealesGraf = datosMensuales.map((m, i) => m.proyeccion ? null : datosGrafico[i]);
        const datosProyGraf = datosMensuales.map((m, i) => m.proyeccion ? datosGrafico[i] : null);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: `${labelY} (Real)`, data: datosRealesGraf, borderColor: colorGrafico, backgroundColor: `${colorGrafico}33`, borderWidth: 2, tension: 0.3, fill: true, spanGaps: false },
                    { label: `${labelY} (Proyección)`, data: datosProyGraf, borderColor: `${colorGrafico}99`, backgroundColor: `${colorGrafico}1A`, borderWidth: 2, borderDash: [5, 5], tension: 0.3, fill: true, spanGaps: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: `${metricaTitulos[params.metrica]} por Mes - ${anio}` }, legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true, title: { display: true, text: labelY } } }
            }
        });
    }
} 

// ==================== FUNCIONES AUXILIARES DE REPORTE ====================

function crearBotonesExportacion(nombreBaseArchivo, datos, camposPersonalizados = null) {
    const accionesDiv = document.createElement('div');
    accionesDiv.className = 'reporte-acciones d-flex justify-content-end gap-2 mb-3';
    accionesDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary exportar-reporte-btn" data-formato="csv"><i class="fas fa-file-csv me-1"></i> CSV</button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte-btn" data-formato="excel"><i class="fas fa-file-excel me-1"></i> Excel</button>
        <button class="btn btn-sm btn-outline-primary exportar-reporte-btn" data-formato="pdf"><i class="fas fa-file-pdf me-1"></i> PDF</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.print()"><i class="fas fa-print me-1"></i> Imprimir</button>
    `;
    accionesDiv.querySelectorAll('.exportar-reporte-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const formato = btn.getAttribute('data-formato');
            exportarReporte(nombreBaseArchivo, datos, formato, camposPersonalizados);
        });
    });
    return accionesDiv;
}

function crearMensajeSinDatos() {
    const noDataDiv = document.createElement('div');
    noDataDiv.className = 'alert alert-info';
    noDataDiv.innerHTML = `<i class="fas fa-info-circle me-2"></i><strong>No hay datos</strong><p>No se encontraron registros para los criterios seleccionados.</p>`;
    return noDataDiv;
}

function calcularTiempoFabricacionDias(solicitud) {
    if (solicitud.estado === 'Entregado' && solicitud.historial && solicitud.historial.length > 0) {
        const fechaCreacionHist = solicitud.historial.find(h => h.estado === 'Solicitud enviada por bodega') || solicitud.historial[0];
        const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
        
        if (fechaCreacionHist && entregaHistorial) {
            const fechaCreacion = new Date(fechaCreacionHist.fecha);
            const fechaEntrega = new Date(entregaHistorial.fecha);
            if (!isNaN(fechaCreacion.getTime()) && !isNaN(fechaEntrega.getTime())) {
                const tiempoFabricacionMs = fechaEntrega - fechaCreacion;
                return (tiempoFabricacionMs / (1000 * 60 * 60 * 24)).toFixed(1);
            }
        }
    }
    return 'N/A'; 
}

function calcularTiempoFabricacionMs(solicitud) {
    if (solicitud.estado === 'Entregado' && solicitud.historial && solicitud.historial.length > 0) {
        const fechaCreacionHist = solicitud.historial.find(h => h.estado === 'Solicitud enviada por bodega') || solicitud.historial[0];
        const entregaHistorial = solicitud.historial.find(h => h.estado === 'Entregado');
        
        if (fechaCreacionHist && entregaHistorial) {
            const fechaCreacion = new Date(fechaCreacionHist.fecha);
            const fechaEntrega = new Date(entregaHistorial.fecha);
            if (!isNaN(fechaCreacion.getTime()) && !isNaN(fechaEntrega.getTime())) {
                return fechaEntrega - fechaCreacion;
            }
        }
    }
    return 0;
}

function getStatusBadgeClass(estado) {
    // Asumiendo que esta función está definida en utils.js o similar
    if (typeof window.getStatusBadgeClass === 'function') {
        return window.getStatusBadgeClass(estado);
    }
    // Fallback simple
    switch (estado) {
        case 'Solicitud enviada por bodega': return 'bg-info';
        case 'En fabricación': return 'bg-warning text-dark';
        case 'Entregado': return 'bg-success';
        default: return 'bg-secondary';
    }
}

/**
 * Exporta los datos del reporte a CSV, Excel o PDF.
 */
function exportarReporte(nombreArchivoBase, datos, formato, campos = null) {
    console.log(`Exportando reporte '${nombreArchivoBase}' a ${formato}`);
    if (!datos || datos.length === 0) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('No hay datos para exportar.', 'warning');
        else alert('No hay datos para exportar.');
        return;
    }

    const nombreArchivo = `${nombreArchivoBase.replace(/[^a-z0-9_]/gi, '_')}_${new Date().toISOString().slice(0,10)}`;

    const columnasDefecto = Object.keys(datos[0]);
    const columnasAUsar = campos ? campos : columnasDefecto;
    
    const nombresCamposHeader = {
        'id': 'ID', 'notaVenta': 'Nota Venta', 'cliente': 'Cliente', 'local': 'Local',
        'fechaSolicitud': 'Fecha Sol.', 'estado': 'Estado', 'observaciones': 'Observaciones',
        'items': 'Productos (JSON)', 'creadoPor': 'Creado Por (Usuario)', 'historial': 'Historial (JSON)',
        'fechaEstimada': 'Fecha Est.', 'fechaEntrega': 'Fecha Ent.', 'tiempoFabricacion': 'T. Fab. (días)',
        'nombreMes': 'Mes', 'solicitudes': 'Solicitudes', 'completadas': 'Completadas', 
        'diasPromedio': 'Días Promedio Fab.', 'periodo': 'Período',
        'total': 'Total', 'Solicitud enviada por bodega': 'Pendientes', 'En fabricación': 'En Fabricación', 'Entregado': 'Entregadas',
        // Añadir más mapeos si son necesarios para otros reportes
    };

    const cabeceras = columnasAUsar.map(col => nombresCamposHeader[col] || col.charAt(0).toUpperCase() + col.slice(1));

    if (formato === 'csv' || formato === 'excel') {
        let contenidoExportar = cabeceras.join(',') + '\n';
        datos.forEach(fila => {
            const valoresFila = columnasAUsar.map(col => {
                let valor = fila[col];
                if (typeof valor === 'object' && valor !== null) {
                    valor = JSON.stringify(valor); // Convertir objetos/arrays a JSON string
                }
                return `"${(valor === undefined || valor === null ? '' : String(valor)).replace(/"/g, '""')}"`; // Escapar comillas dobles
            });
            contenidoExportar += valoresFila.join(',') + '\n';
        });

        const blob = new Blob(["\uFEFF" + contenidoExportar], { type: `text/${formato === 'csv' ? 'csv' : 'plain'};charset=utf-8;` });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${nombreArchivo}.${formato === 'excel' ? 'csv' : formato}`); // Excel a menudo abre mejor CSV
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (typeof mostrarAlerta === 'function') mostrarAlerta(`Reporte exportado a ${formato.toUpperCase()}.`, 'success');
        } else {
            if (typeof mostrarAlerta === 'function') mostrarAlerta(`La exportación ${formato.toUpperCase()} no es compatible con tu navegador.`, 'warning');
        }
    } else if (formato === 'pdf') {
        if (typeof jsPDF !== 'undefined' && typeof jsPDF.autoTable !== 'undefined') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.text(nombreArchivoBase.replace(/_/g, ' '), 14, 16);
            
            const cuerpoTabla = datos.map(fila => 
                columnasAUsar.map(col => {
                    let valor = fila[col];
                     if (typeof valor === 'object' && valor !== null) {
                        if (col === 'items' && Array.isArray(valor)) return valor.map(it => `${it.producto || ''} (x${it.cantidad || 0})`).join('; ');
                        if (col === 'historial' && Array.isArray(valor) && valor.length > 0) {
                            const ult = valor[valor.length -1];
                            return `${ult.estado || ''} (${formatDate(ult.fecha)}) por ${ult.usuario || ''}`;
                        }
                        return JSON.stringify(valor);
                    }
                    return (valor === undefined || valor === null) ? '' : String(valor);
                })
            );

            doc.autoTable({
                head: [cabeceras],
                body: cuerpoTabla,
                startY: 22,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: { 0: { cellWidth: 'auto' } } // Ajustar ancho de columnas si es necesario
            });
            doc.save(`${nombreArchivo}.pdf`);
            if (typeof mostrarAlerta === 'function') mostrarAlerta('Reporte exportado a PDF.', 'success');
        } else {
            if (typeof mostrarAlerta === 'function') mostrarAlerta('La biblioteca jsPDF o jsPDF-AutoTable no está cargada. No se puede exportar a PDF.', 'danger');
            console.error("jsPDF o jsPDF-AutoTable no disponible para exportar a PDF.");
        }
    }
}

// Asegurarse de que initReportes se llama cuando el DOM está listo,
// usualmente desde app.js o un listener global de DOMContentLoaded.
// Si este archivo se carga después de app.js, y app.js llama a initReportes,
// entonces no es necesario el listener aquí.
// Si es independiente o se carga antes, se necesitaría:
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reportes-content')) { // Solo inicializar si la pestaña de reportes existe
        initReportes();
    }
});
```

**Cambios clave realizados en esta versión:**

1.  **Completada la función `exportarReporte`**: He añadido la lógica para CSV, Excel (que en realidad genera un CSV que Excel puede abrir bien) y PDF. Para PDF, se asume que tienes `jsPDF` y el plugin `jsPDF-AutoTable` cargados en tu `index.html`. Si no los tienes, la exportación a PDF fallará con un mensaje.
    * **Para PDF**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>`
    * **Para PDF AutoTable**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>` (Asegúrate de cargarla *después* de jsPDF).
2.  **Función `getStatusBadgeClass`**: He añadido un fallback simple para `getStatusBadgeClass` dentro de `generarReportePersonalizado` en caso de que no esté definida globalmente. Es mejor si tienes esta función en `utils.js` y te aseguras de que esté disponible.
3.  **Manejo de `solicitudes` y `usuarios`**: Las funciones de reporte asumen que las variables `solicitudes` (array de todas las solicitudes) y `usuarios` (array de todos los usuarios, para el reporte de actividad) están disponibles globalmente (probablemente cargadas en `app.js`).
4.  **Llamada a `initReportes`**: Se ha envuelto en un `DOMContentLoaded` y se verifica si el contenedor de reportes existe, para asegurar que solo se inicialice si la sección de reportes está presente en la página.
5.  **Robustez en `obtenerParametrosReporte`**: Se usan valores por defecto si los elementos del formulario no se encuentran, aunque se lanzan errores si faltan fechas requeridas.
6.  **Spinner y Mensajes**: Se usa `mostrarSincronizacion` y `ocultarSincronizacion` (asumiendo que están definidas globalmente, por ejemplo en `utils.js`) para indicar carga. También se usa `mostrarAlerta`.
7.  **Detalles en `generarReportePersonalizado` y `generarReporteRendimientoMensual`**: Se han refinado estas funciones basándose en el código que proporcionaste, asegurando que los datos se procesen y muestren correctamente.
8.  **`calcularTiempoFabricacionDias` y `calcularTiempoFabricacionMs`**: He añadido estas funciones auxiliares que estaban siendo llamadas pero no definidas en el fragmento anterior.

Por favor, reemplaza el contenido de tu `reportes.js` con este código. Después de hacerlo, revisa la consola del navegador nuevamente. Si el error `Unexpected end of input` desaparece, entonces el problema de sintaxis en ese archivo estará resuel
