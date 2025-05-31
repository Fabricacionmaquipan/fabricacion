// js/reportes.js

// Variables globales para reportes
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

// ==================== FUNCIONES AUXILIARES Y DE UTILIDAD (Definidas primero) ====================

/**
 * Formatea una cadena de fecha o un objeto Date a un formato legible (DD/MM/YYYY).
 * @param {string|Date} dateString - La fecha a formatear.
 * @returns {string} Fecha formateada o 'N/A'.
 */
function formatDateReportes(dateString) { // Renombrada para evitar colisión si existe formatDate global
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString); // Devolver original si no es parseable
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return String(dateString); 
    }
}

/**
 * Obtiene la clase CSS para el badge de estado de una solicitud.
 * @param {string} estado - El estado de la solicitud.
 * @returns {string} Clase CSS para el badge.
 */
function getStatusBadgeClassReportes(estado) { // Renombrada para evitar colisión
    if (typeof window.getStatusBadgeClass === 'function' && window.getStatusBadgeClass !== getStatusBadgeClassReportes) {
        return window.getStatusBadgeClass(estado); // Usar la global si existe y es diferente
    }
    // Fallback simple
    switch (String(estado).toLowerCase()) {
        case 'solicitud enviada por bodega': return 'bg-info text-dark'; // Asegurar contraste
        case 'en fabricación': return 'bg-warning text-dark';
        case 'entregado': return 'bg-success';
        default: return 'bg-secondary';
    }
}

/**
 * Muestra un indicador de carga/sincronización.
 * (Asume que tienes estilos CSS para .sincronizacion-overlay y .sincronizacion-contenido)
 * @param {string} mensaje - Mensaje a mostrar.
 */
function mostrarSincronizacionReportes(mensaje) { // Renombrada
    if (typeof mostrarSincronizacion === 'function' && mostrarSincronizacion !== mostrarSincronizacionReportes) {
        mostrarSincronizacion(mensaje); return;
    }
    let sincDiv = document.getElementById('sincronizacion-overlay-reportes');
    if (!sincDiv) {
        sincDiv = document.createElement('div');
        sincDiv.id = 'sincronizacion-overlay-reportes';
        sincDiv.className = 'sincronizacion-overlay fixed-top start-0 w-100 h-100 d-flex align-items-center justify-content-center'; // Estilos Bootstrap
        sincDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        sincDiv.style.zIndex = '1060'; // Encima de modales de Bootstrap
        sincDiv.innerHTML = `
            <div class="sincronizacion-contenido text-center p-3 bg-light rounded shadow">
                <div class="spinner-border text-primary mb-2" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mb-0 text-dark">${mensaje || 'Procesando...'}</p>
            </div>
        `;
        document.body.appendChild(sincDiv);
    } else {
        sincDiv.querySelector('p').textContent = mensaje || 'Procesando...';
        sincDiv.style.display = 'flex';
    }
}

/**
 * Oculta el indicador de carga/sincronización.
 */
function ocultarSincronizacionReportes() { // Renombrada
    if (typeof ocultarSincronizacion === 'function' && ocultarSincronizacion !== ocultarSincronizacionReportes) {
        ocultarSincronizacion(); return;
    }
    const sincDiv = document.getElementById('sincronizacion-overlay-reportes');
    if (sincDiv) {
        sincDiv.style.display = 'none';
    }
}

/**
 * Muestra una alerta/notificación.
 * @param {string} mensaje - Mensaje de la alerta.
 * @param {string} tipo - Tipo de alerta (success, danger, warning, info).
 */
function mostrarAlertaReportes(mensaje, tipo = 'info') { // Renombrada
    if (typeof mostrarAlerta === 'function' && mostrarAlerta !== mostrarAlertaReportes) {
        mostrarAlerta(mensaje, tipo); return;
    }
    // Implementación básica de alerta si no existe una global
    const alertaId = 'reporte-alerta-flotante';
    let alertaDiv = document.getElementById(alertaId);
    if (!alertaDiv) {
        alertaDiv = document.createElement('div');
        alertaDiv.id = alertaId;
        alertaDiv.style.position = 'fixed';
        alertaDiv.style.top = '20px';
        alertaDiv.style.right = '20px';
        alertaDiv.style.zIndex = '1070'; // Encima de overlay
        alertaDiv.style.maxWidth = '350px';
        document.body.appendChild(alertaDiv);
    }
    const alertaInner = document.createElement('div');
    alertaInner.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
    alertaInner.setAttribute('role', 'alert');
    alertaInner.innerHTML = `${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alertaDiv.appendChild(alertaInner);

    setTimeout(() => {
        bootstrap.Alert.getOrCreateInstance(alertaInner).close();
    }, 5000);
}

/**
 * Exporta los datos del reporte a CSV, Excel o PDF.
 */
function exportarReporte(nombreArchivoBase, datos, formato, campos = null) {
    console.log(`Exportando reporte '${nombreArchivoBase}' a ${formato}`);
    if (!datos || datos.length === 0) {
        mostrarAlertaReportes('No hay datos para exportar.', 'warning');
        return;
    }

    const nombreArchivo = `${nombreArchivoBase.replace(/[^a-z0-9_]/gi, '_')}_${new Date().toISOString().slice(0,10)}`;
    const columnasDefecto = (datos[0] && typeof datos[0] === 'object') ? Object.keys(datos[0]) : [];
    const columnasAUsar = campos && campos.length > 0 ? campos : columnasDefecto;
    
    const nombresCamposHeader = {
        'id': 'ID', 'notaVenta': 'Nota Venta', 'cliente': 'Cliente', 'local': 'Local',
        'fechaSolicitud': 'Fecha Sol.', 'estado': 'Estado', 'observaciones': 'Observaciones',
        'items': 'Productos (JSON)', 'creadoPor': 'Creado Por (Usuario)', 'historial': 'Historial (JSON)',
        'fechaEstimada': 'Fecha Est.', 'fechaEntrega': 'Fecha Ent.', 'tiempoFabricacion': 'T. Fab. (días)',
        'nombreMes': 'Mes', 'solicitudes': 'Solicitudes', 'completadas': 'Completadas', 
        'diasPromedio': 'Días Promedio Fab.', 'periodo': 'Período',
        'total': 'Total', 'Solicitud enviada por bodega': 'Pendientes', 'En fabricación': 'En Fabricación', 'Entregado': 'Entregadas',
        'Otro': 'Otro Estado' // Añadir si se usa 'Otro'
    };

    const cabeceras = columnasAUsar.map(col => nombresCamposHeader[col] || col.charAt(0).toUpperCase() + col.slice(1));

    if (formato === 'csv' || formato === 'excel') {
        let contenidoExportar = cabeceras.join(',') + '\n';
        datos.forEach(fila => {
            const valoresFila = columnasAUsar.map(col => {
                let valor = fila[col];
                if (typeof valor === 'object' && valor !== null) {
                    valor = JSON.stringify(valor); 
                }
                return `"${(valor === undefined || valor === null ? '' : String(valor)).replace(/"/g, '""')}"`;
            });
            contenidoExportar += valoresFila.join(',') + '\n';
        });

        const blob = new Blob(["\uFEFF" + contenidoExportar], { type: `text/${formato === 'csv' ? 'csv' : 'plain'};charset=utf-8;` });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${nombreArchivo}.${formato === 'excel' ? 'csv' : formato}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            mostrarAlertaReportes(`Reporte exportado a ${formato.toUpperCase()}.`, 'success');
        } else {
            mostrarAlertaReportes(`La exportación ${formato.toUpperCase()} no es compatible con tu navegador.`, 'warning');
        }
    } else if (formato === 'pdf') {
        if (typeof jsPDF !== 'undefined' && typeof jsPDF.autoTable !== 'undefined') {
            const { jsPDF: JSPDF } = window.jspdf; // Acceder a jsPDF a través de window.jspdf
            const doc = new JSPDF(); // Usar el constructor correcto
            
            doc.text(nombreArchivoBase.replace(/_/g, ' '), 14, 16);
            
            const cuerpoTabla = datos.map(fila => 
                columnasAUsar.map(col => {
                    let valor = fila[col];
                     if (typeof valor === 'object' && valor !== null) {
                        if (col === 'items' && Array.isArray(valor)) return valor.map(it => `${it.producto || ''} (x${it.cantidad || 0})`).join('; ');
                        if (col === 'historial' && Array.isArray(valor) && valor.length > 0) {
                            const ult = valor[valor.length -1];
                            return `${ult.estado || ''} (${formatDateReportes(ult.fecha)}) por ${ult.usuario || ''}`;
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
                headStyles: { fillColor: [22, 160, 133] }, // Un color verde azulado
                styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                columnStyles: { 0: { cellWidth: 'auto' } } 
            });
            doc.save(`${nombreArchivo}.pdf`);
            mostrarAlertaReportes('Reporte exportado a PDF.', 'success');
        } else {
            mostrarAlertaReportes('La biblioteca jsPDF o jsPDF-AutoTable no está cargada. No se puede exportar a PDF.', 'danger');
            console.error("jsPDF o jsPDF-AutoTable no disponible para exportar a PDF.");
        }
    }
}

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
            if (typeof exportarReporte === 'function') {
                exportarReporte(nombreBaseArchivo, datos, formato, camposPersonalizados);
            } else {
                console.error("La función exportarReporte no está definida.");
                mostrarAlertaReportes("Error: Función de exportación no disponible.", "danger");
            }
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
        
        if (fechaCreacionHist && entregaHistorial && fechaCreacionHist.fecha && entregaHistorial.fecha) {
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
        
        if (fechaCreacionHist && entregaHistorial && fechaCreacionHist.fecha && entregaHistorial.fecha) {
            const fechaCreacion = new Date(fechaCreacionHist.fecha);
            const fechaEntrega = new Date(entregaHistorial.fecha);
            if (!isNaN(fechaCreacion.getTime()) && !isNaN(fechaEntrega.getTime())) {
                return fechaEntrega - fechaCreacion;
            }
        }
    }
    return 0;
}

// ==================== FUNCIONES DE INICIALIZACIÓN Y UI (PRINCIPALES) ====================
// (Estas ya estaban definidas, las mantengo aquí por si acaso)
function initReportes() {
    console.log("Inicializando sistema de reportes...");
    if (!reporteForm) {
        console.error("Formulario de reportes (reporte-form) no encontrado en el DOM.");
        return;
    }
    reporteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generarReporte();
    });
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    if (tipoReporteSelect) {
        tipoReporteSelect.addEventListener('change', actualizarFormularioReporte);
        actualizarFormularioReporte(); 
    } else {
        console.error("Selector de tipo de reporte (tipo-reporte) no encontrado.");
    }
    console.log("Sistema de reportes inicializado correctamente.");
}

function actualizarFormularioReporte() {
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    const opcionesContainer = document.getElementById('opciones-reporte');
    if (!tipoReporteSelect || !opcionesContainer) {
        console.error("Elementos necesarios para actualizarFormularioReporte no encontrados.");
        return;
    }
    const tipoReporte = tipoReporteSelect.value;
    opcionesContainer.innerHTML = ''; 

    const getOpcionesFechaHTML = () => `
        <div class="col-md-6"><label class="form-label">Fecha inicio</label><input type="date" class="form-control" name="fecha_inicio" required></div>
        <div class="col-md-6"><label class="form-label">Fecha fin</label><input type="date" class="form-control" name="fecha_fin" required></div>`;
    let htmlOpciones = '<div class="row g-3">'; 
    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `<div class="col-md-6"><label class="form-label">Agrupar por</label><select class="form-select" name="agrupar_por"><option value="dia">Día</option><option value="semana">Semana</option><option value="mes" selected>Mes</option></select></div><div class="col-md-6"><label class="form-label">Formato</label><select class="form-select" name="formato"><option value="tabla">Tabla</option><option value="grafico" selected>Gráfico</option><option value="ambos">Ambos</option></select></div>`;
            break;
        case TIPOS_REPORTE.TIEMPO_FABRICACION:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `<div class="col-md-6"><label class="form-label">Agrupar por producto</label><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="agrupar_producto" checked><label class="form-check-label">Desglose por producto</label></div></div><div class="col-md-6"><label class="form-label">Formato</label><select class="form-select" name="formato"><option value="tabla">Tabla</option><option value="grafico">Gráfico</option><option value="ambos" selected>Ambos</option></select></div>`;
            break;
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `<div class="col-md-6"><label class="form-label">Cantidad de productos</label><input type="number" class="form-control" name="limite" value="10" min="1" max="50"></div><div class="col-md-6"><label class="form-label">Formato</label><select class="form-select" name="formato"><option value="tabla">Tabla</option><option value="grafico" selected>Gráfico</option><option value="ambos">Ambos</option></select></div>`;
            break;
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS:
            htmlOpciones += getOpcionesFechaHTML();
            const usuariosOptions = (typeof usuarios !== 'undefined' && Array.isArray(usuarios)) ? usuarios.map(u => `<option value="${u.username}">${u.displayName || u.username}</option>`).join('') : '<option value="">No hay usuarios</option>';
            htmlOpciones += `<div class="col-md-6"><label class="form-label">Usuario</label><select class="form-select" name="usuario_id"><option value="">Todos</option>${usuariosOptions}</select></div><div class="col-md-6"><label class="form-label">Formato</label><select class="form-select" name="formato"><option value="tabla" selected>Tabla</option><option value="grafico">Gráfico</option><option value="ambos">Ambos</option></select></div>`;
            break;
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL:
            const currentYear = new Date().getFullYear();
            htmlOpciones += `<div class="col-md-6"><label class="form-label">Año</label><select class="form-select" name="anio"><option value="${currentYear}">${currentYear}</option><option value="${currentYear-1}">${currentYear-1}</option><option value="${currentYear-2}">${currentYear-2}</option></select></div><div class="col-md-6"><label class="form-label">Métrica principal</label><select class="form-select" name="metrica"><option value="solicitudes">Total solicitudes</option><option value="completadas">Completadas</option><option value="tiempo">Tiempo prom. fabricación</option></select></div><div class="col-md-6"><label class="form-label">Incluir proyección</label><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="incluir_proyeccion" checked><label class="form-check-label">Proyección meses futuros</label></div></div><div class="col-md-6"><label class="form-label">Formato</label><select class="form-select" name="formato"><option value="tabla">Tabla</option><option value="grafico" selected>Gráfico</option><option value="ambos">Ambos</option></select></div>`;
            break;
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO:
            htmlOpciones += getOpcionesFechaHTML();
            htmlOpciones += `<div class="col-md-12"><label class="form-label">Campos a incluir</label><div class="row g-2"><div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="id" checked><label>ID</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="notaVenta" checked><label>Nota Venta</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="cliente" checked><label>Cliente</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="local" checked><label>Local</label></div></div><div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaSolicitud" checked><label>Fecha Sol.</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="estado" checked><label>Estado</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="observaciones"><label>Observaciones</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="items" checked><label>Productos</label></div></div><div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="creadoPor"><label>Creado Por</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="historial"><label>Historial</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaEstimada"><label>Fecha Est.</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="fechaEntrega"><label>Fecha Ent.</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="campos" value="tiempoFabricacion"><label>T. Fab.</label></div></div></div></div><div class="col-md-6"><label class="form-label">Filtrar por estado</label><select class="form-select" name="filtro_estado"><option value="">Todos</option><option value="Solicitud enviada por bodega">Pendientes</option><option value="En fabricación">En fabricación</option><option value="Entregado">Entregado</option></select></div><div class="col-md-6"><label class="form-label">Ordenar por</label><select class="form-select" name="ordenar_por"><option value="fechaSolicitud_desc">Fecha (recientes)</option><option value="fechaSolicitud_asc">Fecha (antiguas)</option><option value="notaVenta_asc">Nota Venta</option><option value="estado_asc">Estado</option></select></div><div class="col-md-6"><label class="form-label">Formato Salida</label><select class="form-select" name="formato_salida"><option value="html" selected>HTML</option><option value="csv">CSV</option><option value="excel">Excel</option><option value="pdf">PDF</option></select></div>`;
            break;
        default: htmlOpciones += `<div class="col-12"><div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Selecciona un tipo de reporte.</div></div>`;
    }
    htmlOpciones += '</div>'; 
    opcionesContainer.innerHTML = htmlOpciones;
    const fechaActual = new Date();
    const fechaInicioDefault = new Date();
    fechaInicioDefault.setMonth(fechaInicioDefault.getMonth() - 1); 
    const formatoFechaInput = fecha => fecha.toISOString().split('T')[0];
    opcionesContainer.querySelectorAll('input[name="fecha_inicio"]').forEach(input => { input.value = formatoFechaInput(fechaInicioDefault); });
    opcionesContainer.querySelectorAll('input[name="fecha_fin"]').forEach(input => { input.value = formatoFechaInput(fechaActual); });
}

// ==================== FUNCIONES DE CONTROL PRINCIPAL (ya definidas) ====================
function generarReporte() {
    console.log("Generando reporte...");
    mostrarSincronizacionReportes('Generando reporte...');
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
                    case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO: generarReporteSolicitudesPorEstado(params); break;
                    case TIPOS_REPORTE.TIEMPO_FABRICACION: generarReporteTiempoFabricacion(params); break;
                    case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS: generarReporteProductosMasSolicitados(params); break;
                    case TIPOS_REPORTE.ACTIVIDAD_USUARIOS: generarReporteActividadUsuarios(params); break;
                    case TIPOS_REPORTE.RENDIMIENTO_MENSUAL: generarReporteRendimientoMensual(params); break;
                    case TIPOS_REPORTE.REPORTE_PERSONALIZADO: generarReportePersonalizado(params); break;
                    default: throw new Error('Tipo de reporte no válido o no implementado');
                }
                if (window.auditoria && typeof window.auditoria.registrarEvento === 'function') {
                    window.auditoria.registrarEvento(window.auditoria.TIPO_EVENTO.EXPORTAR, window.auditoria.ENTIDAD.REPORTE, null, `Generación de reporte: ${tipoReporte}`, params);
                }
            } catch (error) {
                 console.error('Error dentro del setTimeout de generarReporte:', error);
                 if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error generando reporte: ${error.message}</div>`;
            } finally {
                 ocultarSincronizacionReportes();
            }
        }, 50); 
    } catch (error) {
        mostrarAlertaReportes(`Error al generar reporte: ${error.message}`, 'danger');
        console.error('Error al generar reporte:', error);
        if (reporteResult) reporteResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>${error.message}</div>`;
        ocultarSincronizacionReportes();
    }
}

function obtenerParametrosReporte(tipoReporte) {
    const params = {};
    const opcionesContainer = document.getElementById('opciones-reporte');
    if (!opcionesContainer) throw new Error("Contenedor de opciones de reporte no encontrado");
    const getInputValue = (name, defaultValue = null) => { const input = opcionesContainer.querySelector(`input[name="${name}"], select[name="${name}"]`); return input ? input.value : defaultValue; };
    const getInputChecked = (name, defaultValue = false) => { const input = opcionesContainer.querySelector(`input[name="${name}"]`); return input ? input.checked : defaultValue; };
    if (['solicitudes_por_estado', 'tiempo_fabricacion', 'productos_mas_solicitados', 'actividad_usuarios', 'reporte_personalizado'].includes(tipoReporte)) {
        params.fechaInicio = getInputValue('fecha_inicio'); params.fechaFin = getInputValue('fecha_fin');
        if (!params.fechaInicio || !params.fechaFin) throw new Error('Las fechas de inicio y fin son requeridas');
        if (new Date(params.fechaInicio) > new Date(params.fechaFin)) throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    switch (tipoReporte) {
        case TIPOS_REPORTE.SOLICITUDES_POR_ESTADO: params.agruparPor = getInputValue('agrupar_por', 'mes'); params.formato = getInputValue('formato', 'grafico'); break;
        case TIPOS_REPORTE.TIEMPO_FABRICACION: params.agruparPorProducto = getInputChecked('agrupar_producto', true); params.formato = getInputValue('formato', 'ambos'); break;
        case TIPOS_REPORTE.PRODUCTOS_MAS_SOLICITADOS: params.limite = parseInt(getInputValue('limite', '10')); params.formato = getInputValue('formato', 'grafico'); break;
        case TIPOS_REPORTE.ACTIVIDAD_USUARIOS: params.usuarioId = getInputValue('usuario_id', ''); params.formato = getInputValue('formato', 'tabla'); break;
        case TIPOS_REPORTE.RENDIMIENTO_MENSUAL: params.anio = getInputValue('anio', new Date().getFullYear().toString()); params.incluirProyeccion = getInputChecked('incluir_proyeccion', true); params.metrica = getInputValue('metrica', 'solicitudes'); params.formato = getInputValue('formato', 'grafico'); break;
        case TIPOS_REPORTE.REPORTE_PERSONALIZADO: params.campos = Array.from(opcionesContainer.querySelectorAll('input[name="campos"]:checked')).map(c => c.value); if (params.campos.length === 0) throw new Error("Debe seleccionar al menos un campo."); params.filtroEstado = getInputValue('filtro_estado', ''); params.ordenarPor = getInputValue('ordenar_por', 'fechaSolicitud_desc'); params.formatoSalida = getInputValue('formato_salida', 'html'); break;
    }
    return params;
}

// ==================== FUNCIONES DE GENERACIÓN DE REPORTES ESPECÍFICOS (ya definidas) ====================
function generarReporteSolicitudesPorEstado(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = '<p>Generando reporte de Solicitudes por Estado...</p>'; 
    const solicitudesFiltradas = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => { const fechaSolicitud = new Date(s.fechaSolicitud); return fechaSolicitud >= new Date(params.fechaInicio) && fechaSolicitud <= new Date(params.fechaFin); });
    const datosPorPeriodo = {}; const estadosPosibles = ['Solicitud enviada por bodega', 'En fabricación', 'Entregado'];
    solicitudesFiltradas.forEach(solicitud => {
        const fecha = new Date(solicitud.fechaSolicitud); let periodoKey;
        switch (params.agruparPor) { case 'dia': periodoKey = fecha.toISOString().split('T')[0]; break; case 'semana': const diaSemana = fecha.getDay(); const lunes = new Date(fecha); lunes.setDate(fecha.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1)); periodoKey = lunes.toISOString().split('T')[0]; break; case 'mes': default: periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; break; }
        if (!datosPorPeriodo[periodoKey]) { datosPorPeriodo[periodoKey] = { periodo: periodoKey, total: 0 }; estadosPosibles.forEach(estado => { datosPorPeriodo[periodoKey][estado] = 0; }); }
        datosPorPeriodo[periodoKey].total++; if (estadosPosibles.includes(solicitud.estado)) { datosPorPeriodo[periodoKey][solicitud.estado]++; } else { datosPorPeriodo[periodoKey]['Otro'] = (datosPorPeriodo[periodoKey]['Otro'] || 0) + 1; }
    });
    const datosOrdenados = Object.values(datosPorPeriodo).sort((a, b) => a.periodo.localeCompare(b.periodo));
    const labels = []; const datasets = [{ label: 'Pendientes', backgroundColor: '#3498db', data: [] }, { label: 'En Fabricación', backgroundColor: '#f39c12', data: [] }, { label: 'Entregadas', backgroundColor: '#2ecc71', data: [] }];
    if (datosOrdenados.some(d => d['Otro'] > 0)) { datasets.push({ label: 'Otro', backgroundColor: '#95a5a6', data: [] });}
    datosOrdenados.forEach(dato => {
        let etiqueta; switch (params.agruparPor) { case 'dia': const [anio, mes, dia] = dato.periodo.split('-'); etiqueta = `${dia}/${mes}/${anio.slice(-2)}`; break; case 'semana': const [anioS, mesS, diaS] = dato.periodo.split('-'); etiqueta = `Sem ${diaS}/${mesS}`; break; case 'mes': default: const [anioM, mesM] = dato.periodo.split('-'); const nombresM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; etiqueta = `${nombresM[parseInt(mesM) - 1]}/${anioM.slice(-2)}`; break; }
        labels.push(etiqueta); datasets[0].data.push(dato['Solicitud enviada por bodega'] || 0); datasets[1].data.push(dato['En fabricación'] || 0); datasets[2].data.push(dato['Entregado'] || 0); if (datasets.length > 3) datasets[3].data.push(dato['Otro'] || 0);
    });
    reporteResult.innerHTML = ''; 
    const tituloEl = document.createElement('h4'); tituloEl.className = 'reporte-titulo mb-3'; tituloEl.innerHTML = `<i class="fas fa-chart-bar me-2"></i>Reporte de Solicitudes por Estado <small class="d-block text-muted">Período: ${formatDateReportes(params.fechaInicio)} - ${formatDateReportes(params.fechaFin)}</small>`; reporteResult.appendChild(tituloEl);
    const accionesDiv = crearBotonesExportacion('Solicitudes_por_Estado', datosOrdenados); reporteResult.appendChild(accionesDiv);
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        const tablaContainer = document.createElement('div'); tablaContainer.className = 'table-responsive mb-4'; const tabla = document.createElement('table'); tabla.className = 'table table-bordered table-hover table-sm'; let thead = `<thead><tr><th>Período</th><th>Pendientes</th><th>En Fabricación</th><th>Entregadas</th>`; if (datasets.length > 3) thead += `<th>Otro</th>`; thead += `<th>Total</th></tr></thead>`; let tbody = '<tbody>';
        datosOrdenados.forEach((dato, index) => { tbody += `<tr><td>${labels[index]}</td><td>${dato['Solicitud enviada por bodega'] || 0}</td><td>${dato['En fabricación'] || 0}</td><td>${dato['Entregado'] || 0}</td>`; if (datasets.length > 3) tbody += `<td>${dato['Otro'] || 0}</td>`; tbody += `<td>${dato.total}</td></tr>`; });
        const totalPendientes = datosOrdenados.reduce((sum, d) => sum + (d['Solicitud enviada por bodega'] || 0), 0); const totalEnFabricacion = datosOrdenados.reduce((sum, d) => sum + (d['En fabricación'] || 0), 0); const totalEntregadas = datosOrdenados.reduce((sum, d) => sum + (d['Entregado'] || 0), 0); const totalOtro = datasets.length > 3 ? datosOrdenados.reduce((sum, d) => sum + (d['Otro'] || 0), 0) : 0; const granTotal = datosOrdenados.reduce((sum, d) => sum + d.total, 0);
        tbody += `<tr class="table-secondary fw-bold"><td><strong>TOTAL</strong></td><td><strong>${totalPendientes}</strong></td><td><strong>${totalEnFabricacion}</strong></td><td><strong>${totalEntregadas}</strong></td>`; if (datasets.length > 3) tbody += `<td><strong>${totalOtro}</strong></td>`; tbody += `<td><strong>${granTotal}</strong></td></tr>`; tbody += '</tbody>'; tabla.innerHTML = thead + tbody; tablaContainer.appendChild(tabla); reporteResult.appendChild(tablaContainer);
    }
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        const graficoContainer = document.createElement('div'); graficoContainer.className = 'grafico-container mb-4'; graficoContainer.style.height = '400px'; const canvas = document.createElement('canvas'); graficoContainer.appendChild(canvas); reporteResult.appendChild(graficoContainer);
        new Chart(canvas, { type: 'bar', data: { labels: labels, datasets: datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Distribución de Solicitudes por Estado' }, legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } } });
    }
}

function generarReporteTiempoFabricacion(params) { if (!reporteResult) return; reporteResult.innerHTML = `<p>Generando reporte de Tiempo de Fabricación...</p>`; }
function generarReporteProductosMasSolicitados(params) { if (!reporteResult) return; reporteResult.innerHTML = `<p>Generando reporte de Productos más Solicitados...</p>`; }
function generarReporteActividadUsuarios(params) { if (!reporteResult) return; reporteResult.innerHTML = `<p>Generando reporte de Actividad de Usuarios...</p>`; }

function generarReportePersonalizado(params) {
    if (!reporteResult) return;
    reporteResult.innerHTML = ''; 
    let solicitudesFiltradas = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => { const fechaSolicitud = new Date(s.fechaSolicitud); return fechaSolicitud >= new Date(params.fechaInicio) && fechaSolicitud <= new Date(params.fechaFin); });
    if (params.filtroEstado) { solicitudesFiltradas = solicitudesFiltradas.filter(s => s.estado === params.filtroEstado); }
    const [campoOrden, direccion] = params.ordenarPor.split('_');
    solicitudesFiltradas.sort((a, b) => {
        let valorA, valorB;
        if (['fechaSolicitud', 'fechaEstimada', 'fechaEntrega'].includes(campoOrden)) { valorA = a[campoOrden] ? new Date(a[campoOrden]) : null; valorB = b[campoOrden] ? new Date(b[campoOrden]) : null; if (valorA === null && valorB === null) return 0; if (valorA === null) return direccion === 'asc' ? -1 : 1; if (valorB === null) return direccion === 'asc' ? 1 : -1; } 
        else if (campoOrden === 'tiempoFabricacion') { valorA = calcularTiempoFabricacionDias(a); valorB = calcularTiempoFabricacionDias(b); valorA = valorA === 'N/A' ? (direccion === 'asc' ? Infinity : -Infinity) : parseFloat(valorA); valorB = valorB === 'N/A' ? (direccion === 'asc' ? Infinity : -Infinity) : parseFloat(valorB); } 
        else { valorA = a[campoOrden]; valorB = b[campoOrden]; if (valorA !== undefined && valorA !== null && typeof valorA.toString === 'function') valorA = valorA.toString().toLowerCase(); else valorA = ''; if (valorB !== undefined && valorB !== null && typeof valorB.toString === 'function') valorB = valorB.toString().toLowerCase(); else valorB = ''; }
        if (valorA < valorB) return direccion === 'asc' ? -1 : 1; if (valorA > valorB) return direccion === 'asc' ? 1 : -1; return 0;
    });
    const titulo = document.createElement('h4'); titulo.className = 'reporte-titulo mb-3'; titulo.innerHTML = `<i class="fas fa-clipboard-list me-2"></i>Reporte Personalizado <small class="d-block text-muted">Período: ${formatDateReportes(params.fechaInicio)} - ${formatDateReportes(params.fechaFin)}${params.filtroEstado ? ` | Estado: ${params.filtroEstado}` : ''}</small>`; reporteResult.appendChild(titulo);
    const accionesDiv = crearBotonesExportacion('Reporte_Personalizado', solicitudesFiltradas, params.campos); reporteResult.appendChild(accionesDiv);
    if (solicitudesFiltradas.length === 0) { reporteResult.appendChild(crearMensajeSinDatos()); return; }
    const tablaContainer = document.createElement('div'); tablaContainer.className = 'table-responsive mb-4'; const tabla = document.createElement('table'); tabla.className = 'table table-bordered table-hover table-sm';
    let thead = '<thead><tr>'; const nombresCampos = { 'id': 'ID', 'notaVenta': 'Nota Venta', 'cliente': 'Cliente', 'local': 'Local', 'fechaSolicitud': 'Fecha Sol.', 'estado': 'Estado', 'observaciones': 'Observaciones', 'items': 'Productos', 'creadoPor': 'Creado Por', 'historial': 'Últ. Actividad', 'fechaEstimada': 'Fecha Est.', 'fechaEntrega': 'Fecha Ent.', 'tiempoFabricacion': 'T. Fab. (días)' };
    params.campos.forEach(campo => { thead += `<th>${nombresCampos[campo] || campo.charAt(0).toUpperCase() + campo.slice(1)}</th>`; }); thead += '</tr></thead>';
    let tbody = '<tbody>';
    solicitudesFiltradas.forEach(solicitud => {
        tbody += '<tr>';
        params.campos.forEach(campo => {
            let contenido = '';
            switch (campo) {
                case 'id': contenido = solicitud.id ? solicitud.id.slice(-6) : 'N/A'; break;
                case 'fechaSolicitud': case 'fechaEstimada': case 'fechaEntrega': contenido = solicitud[campo] ? formatDateReportes(solicitud[campo]) : 'N/A'; break;
                case 'estado': contenido = `<span class="badge ${getStatusBadgeClassReportes(solicitud.estado)}">${solicitud.estado || 'N/A'}</span>`; break;
                case 'items': if (solicitud.items && solicitud.items.length > 0) { contenido = '<ul class="list-unstyled mb-0 small">'; solicitud.items.forEach(item => { contenido += `<li>${item.producto || 'N/A'} (x${item.cantidad || 0})</li>`; }); contenido += '</ul>'; } else { contenido = '<span class="text-muted small">Sin productos</span>'; } break;
                case 'creadoPor': contenido = solicitud.creadoPor ? (solicitud.creadoPor.displayName || solicitud.creadoPor.username || 'N/A') : 'N/A'; break;
                case 'historial': if (solicitud.historial && solicitud.historial.length > 0) { const ultimo = solicitud.historial[solicitud.historial.length - 1]; contenido = `<div class="small"><strong>${ultimo.estado || 'N/A'}</strong> (${formatDateReportes(ultimo.fecha)})<br><span class="text-muted">${ultimo.usuario || 'N/A'}</span></div>`; } else { contenido = '<span class="text-muted small">Sin historial</span>'; } break;
                case 'tiempoFabricacion': contenido = calcularTiempoFabricacionDias(solicitud); break;
                default: contenido = (solicitud[campo] !== undefined && solicitud[campo] !== null) ? solicitud[campo] : '<span class="text-muted small">N/A</span>';
            }
            tbody += `<td>${contenido}</td>`;
        });
        tbody += '</tr>';
    });
    tbody += '</tbody>'; tabla.innerHTML = thead + tbody; tablaContainer.appendChild(tabla); reporteResult.appendChild(tablaContainer);
    if (params.formatoSalida && params.formatoSalida !== 'html') { setTimeout(() => { if (typeof exportarReporte === 'function') exportarReporte('Reporte_Personalizado', solicitudesFiltradas, params.formatoSalida, params.campos); }, 500); }
} 

function generarReporteRendimientoMensual(params) {
    const anio = params.anio; const solicitudesAnio = (typeof solicitudes !== 'undefined' ? solicitudes : []).filter(s => new Date(s.fechaSolicitud).getFullYear().toString() === anio);
    const datosMensuales = []; const nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date(); const mesActual = fechaActual.getMonth(); const anioActual = fechaActual.getFullYear(); const esAnioActual = parseInt(anio) === anioActual;
    for (let mes = 0; mes < 12; mes++) {
        const solicitudesMes = solicitudesAnio.filter(s => new Date(s.fechaSolicitud).getMonth() === mes); const solicitudesCompletadas = solicitudesMes.filter(s => s.estado === 'Entregado');
        let tiempoTotalMs = 0; solicitudesCompletadas.forEach(solicitud => { tiempoTotalMs += calcularTiempoFabricacionMs(solicitud); });
        const tiempoPromedioMs = solicitudesCompletadas.length > 0 ? tiempoTotalMs / solicitudesCompletadas.length : 0; const diasPromedio = tiempoPromedioMs / (1000 * 60 * 60 * 24);
        const esMesFuturo = esAnioActual && mes > mesActual;
        datosMensuales.push({ mes: mes + 1, nombreMes: nombresMes[mes], solicitudes: solicitudesMes.length, completadas: solicitudesCompletadas.length, diasPromedio: diasPromedio, proyeccion: esMesFuturo });
    }
    if (params.incluirProyeccion && esAnioActual) {
        const mesesDisponibles = datosMensuales.filter(d => !d.proyeccion && d.solicitudes > 0); 
        if (mesesDisponibles.length > 0) {
            const ultimosMeses = mesesDisponibles.slice(-Math.min(3, mesesDisponibles.length)); 
            const promedioSolicitudes = ultimosMeses.reduce((sum, m) => sum + m.solicitudes, 0) / ultimosMeses.length; const promedioCompletadas = ultimosMeses.reduce((sum, m) => sum + m.completadas, 0) / ultimosMeses.length; const promedioDias = ultimosMeses.reduce((sum, m) => sum + m.diasPromedio, 0) / ultimosMeses.length;
            datosMensuales.forEach(mesData => { if (mesData.proyeccion) { mesData.solicitudes = Math.round(promedioSolicitudes); mesData.completadas = Math.round(promedioCompletadas); mesData.diasPromedio = promedioDias; } });
        }
    }
    if (!reporteResult) return; reporteResult.innerHTML = '';
    const metricaTitulos = { 'solicitudes': 'Total de Solicitudes', 'completadas': 'Solicitudes Completadas', 'tiempo': 'Tiempo Promedio de Fabricación (días)' };
    const titulo = document.createElement('h4'); titulo.className = 'reporte-titulo mb-3'; titulo.innerHTML = `<i class="fas fa-chart-line me-2"></i> Reporte de Rendimiento Mensual ${anio} <small class="d-block text-muted">Métrica principal: ${metricaTitulos[params.metrica] || 'Total de Solicitudes'}${params.incluirProyeccion && esAnioActual ? ' (incluye proyección)' : ''}</small>`; reporteResult.appendChild(titulo);
    const accionesDiv = crearBotonesExportacion('Rendimiento_Mensual_' + anio, datosMensuales); reporteResult.appendChild(accionesDiv);
    const resumenDiv = document.createElement('div'); resumenDiv.className = 'card mb-4';
    const datosRealesAnuales = datosMensuales.filter(d => !d.proyeccion); const totalSolicitudesAnual = datosRealesAnuales.reduce((sum, m) => sum + m.solicitudes, 0); const totalCompletadasAnual = datosRealesAnuales.reduce((sum, m) => sum + m.completadas, 0); const tasaCompletitudAnual = totalSolicitudesAnual > 0 ? (totalCompletadasAnual / totalSolicitudesAnual) * 100 : 0; const diasPromedioAnualGlobal = totalCompletadasAnual > 0 ? datosRealesAnuales.reduce((sum, m) => sum + (m.diasPromedio * m.completadas), 0) / totalCompletadasAnual : 0;
    resumenDiv.innerHTML = `<div class="card-body"><h5 class="card-title">Resumen Anual ${anio} ${esAnioActual && datosRealesAnuales.length < 12 ? '(Hasta la fecha)' : ''}</h5><div class="row"><div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${totalSolicitudesAnual}</span><span class="metric-label">Solicitudes</span></div></div><div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${totalCompletadasAnual}</span><span class="metric-label">Completadas</span></div></div><div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${tasaCompletitudAnual.toFixed(1)}%</span><span class="metric-label">Completitud</span></div></div><div class="col-md-3 col-6 mb-2"><div class="metric-card"><span class="metric-value">${diasPromedioAnualGlobal.toFixed(1)}</span><span class="metric-label">Días Prom.</span></div></div></div></div>`; reporteResult.appendChild(resumenDiv);
    if (params.formato === 'tabla' || params.formato === 'ambos') {
        const tablaContainer = document.createElement('div'); tablaContainer.className = 'table-responsive mb-4'; const tabla = document.createElement('table'); tabla.className = 'table table-bordered table-hover table-sm'; let thead = `<thead><tr><th>Mes</th><th>Solicitudes</th><th>Completadas</th><th>Completitud (%)</th><th>Días Promedio</th></tr></thead>`; let tbody = '<tbody>';
        datosMensuales.forEach(mes => { const tasaMes = mes.solicitudes > 0 ? (mes.completadas / mes.solicitudes) * 100 : 0; const rowClass = mes.proyeccion ? 'table-light text-muted fst-italic' : ''; const proyLabel = mes.proyeccion ? ' (Proy.)' : ''; tbody += `<tr class="${rowClass}"><td>${mes.nombreMes}${proyLabel}</td><td>${mes.solicitudes}</td><td>${mes.completadas}</td><td>${tasaMes.toFixed(1)}</td><td>${mes.diasPromedio.toFixed(1)}</td></tr>`; });
        tbody += '</tbody>'; tabla.innerHTML = thead + tbody; tablaContainer.appendChild(tabla); reporteResult.appendChild(tablaContainer);
    }
    if (params.formato === 'grafico' || params.formato === 'ambos') {
        const graficoContainer = document.createElement('div'); graficoContainer.className = 'grafico-container mb-4'; graficoContainer.style.height = '400px'; const canvas = document.createElement('canvas'); graficoContainer.appendChild(canvas); reporteResult.appendChild(graficoContainer);
        const labels = datosMensuales.map(m => m.nombreMes); let datosGrafico, labelY, colorGrafico;
        switch (params.metrica) { case 'completadas': datosGrafico = datosMensuales.map(m => m.completadas); labelY = 'Solicitudes Completadas'; colorGrafico = '#2ecc71'; break; case 'tiempo': datosGrafico = datosMensuales.map(m => m.diasPromedio); labelY = 'Días Promedio'; colorGrafico = '#f39c12'; break; default: datosGrafico = datosMensuales.map(m => m.solicitudes); labelY = 'Total de Solicitudes'; colorGrafico = '#3498db'; break; }
        const datosRealesGraf = datosMensuales.map((m, i) => m.proyeccion ? null : datosGrafico[i]); const datosProyGraf = datosMensuales.map((m, i) => m.proyeccion ? datosGrafico[i] : null);
        new Chart(canvas, { type: 'line', data: { labels: labels, datasets: [{ label: `${labelY} (Real)`, data: datosRealesGraf, borderColor: colorGrafico, backgroundColor: `${colorGrafico}33`, borderWidth: 2, tension: 0.3, fill: true, spanGaps: false }, { label: `${labelY} (Proyección)`, data: datosProyGraf, borderColor: `${colorGrafico}99`, backgroundColor: `${colorGrafico}1A`, borderWidth: 2, borderDash: [5, 5], tension: 0.3, fill: true, spanGaps: false }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: `${metricaTitulos[params.metrica]} por Mes - ${anio}` }, legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, title: { display: true, text: labelY } } } } });
    }
} 

// Listener para inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página/sección de reportes
    if (document.getElementById('reportes-content') && reporteForm && reporteResult) {
        initReportes();
    } else {
        // console.log("Pestaña de reportes no activa o elementos no encontrados, no se inicializa el módulo de reportes.");
    }
});
