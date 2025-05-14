// fabricacion-enhanced.js - Mejoras para el panel de fabricación

// Variables y elementos DOM
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');
let currentPageFabricacion = 1;
let filterTermFabricacion = '';
let filterStatusFabricacion = 'all';

// Configurar event listeners para el panel de fabricación
function setupFabricacionListeners() {
    console.log("Configurando listeners para panel de fabricación mejorado...");
    
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#fabricacion-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Establecer filtro según el texto
                const filterText = item.textContent.trim().toLowerCase();
                switch (filterText) {
                    case 'pendientes':
                        filterStatusFabricacion = 'pendientes';
                        break;
                    case 'en fabricación':
                        filterStatusFabricacion = 'fabricacion';
                        break;
                    case 'entregadas':
                        filterStatusFabricacion = 'entregadas';
                        break;
                    default:
                        filterStatusFabricacion = 'all';
                }
                
                // Actualizar texto del botón de filtro
                const filterButton = document.querySelector('#fabricacion-panel .dropdown-toggle');
                if (filterButton) {
                    filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${item.textContent.trim()}`;
                }
                
                currentPageFabricacion = 1; // Reiniciar a primera página al filtrar
                cargarDatosFabricacion();
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#fabricacion-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTermFabricacion = e.target.value.toLowerCase();
            currentPageFabricacion = 1; // Reiniciar a primera página al buscar
            cargarDatosFabricacion();
        });
    }
    
    // Configurar listeners para botones
    setupFabricacionButtonListeners();
    
    console.log("Listeners para panel de fabricación configurados correctamente");
}

// Configurar listeners para los botones en la tabla
function setupFabricacionButtonListeners() {
    if (!tablaSolicitudesFabricacion) return;
    
    // Delegar eventos para los botones en la tabla
    tablaSolicitudesFabricacion.addEventListener('click', (e) => {
        let targetButton = null;
        
        // Detectar botón de detalle
        if (e.target.classList.contains('btn-detalle') || e.target.closest('.btn-detalle')) {
            targetButton = e.target.classList.contains('btn-detalle') ? e.target : e.target.closest('.btn-detalle');
            
            const solicitudId = targetButton.getAttribute('data-id');
            if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                window.showDetalleSolicitud(solicitudId);
            }
            e.stopPropagation();
            return;
        }
        
        // Detectar botón de cambiar estado
        if (e.target.classList.contains('btn-cambiar-estado') || e.target.closest('.btn-cambiar-estado')) {
            targetButton = e.target.classList.contains('btn-cambiar-estado') ? e.target : e.target.closest('.btn-cambiar-estado');
            
            const solicitudId = targetButton.getAttribute('data-id');
            if (solicitudId && typeof window.showActualizarEstadoModal === 'function') {
                window.showActualizarEstadoModal(solicitudId);
            }
            e.stopPropagation();
            return;
        }
        
        // Detectar botón de descargar PDF
        if (e.target.classList.contains('btn-descargar-pdf') || e.target.closest('.btn-descargar-pdf')) {
            targetButton = e.target.classList.contains('btn-descargar-pdf') ? e.target : e.target.closest('.btn-descargar-pdf');
            
            const solicitudId = targetButton.getAttribute('data-id');
            if (solicitudId) {
                generarPDFEntrega(solicitudId);
            }
            e.stopPropagation();
            return;
        }
    });
}

// Cargar datos para el panel de Fabricación
function cargarDatosFabricacion() {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesFabricacion.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay solicitudes en el sistema</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Ocultar paginación
        updateFabricacionPagination(0);
        return;
    }
    
    // Paginar y filtrar solicitudes
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes, 
        currentPageFabricacion,
        filterTermFabricacion,
        filterStatusFabricacion
    );
    
    // Actualizar paginación
    updateFabricacionPagination(totalItems);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesFabricacion.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-search text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No se encontraron solicitudes</p>
                        <small class="text-muted">Intenta con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear ID corto para mejor visualización
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        
        // Obtener fecha estimada
        let fechaEstimada = 'No establecida';
        if (solicitud.fechaEstimada) {
            fechaEstimada = formatDate(solicitud.fechaEstimada);
        }
        
        // Obtener fecha de entrega real
        let fechaEntrega = 'Pendiente';
        if (solicitud.fechaEntrega) {
            fechaEntrega = formatDate(solicitud.fechaEntrega);
        } else if (solicitud.estado === 'Entregado' && solicitud.historial) {
            // Buscar en el historial si no está como propiedad directa
            const entregaHistorial = [...solicitud.historial]
                .reverse()
                .find(h => h.estado === 'Entregado' && h.fechaEntrega);
            
            if (entregaHistorial && entregaHistorial.fechaEntrega) {
                fechaEntrega = formatDate(entregaHistorial.fechaEntrega);
            }
        }
        
        // Obtener cliente y local (o usar valores por defecto)
        const cliente = solicitud.cliente || 'No especificado';
        const local = solicitud.local || 'No especificado';
        
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Cliente">${cliente}</td>
            <td data-label="Local">${local}</td>
            <td data-label="Fecha Solicitud">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Fecha Estimada">${fechaEstimada}</td>
            <td data-label="Fecha Entrega">${fechaEntrega}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
            </td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                        <i class="fas fa-eye me-1"></i>Ver
                    </button>
                    ${solicitud.estado !== 'Entregado' ? `
                        <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}">
                            <i class="fas fa-edit me-1"></i>Estado
                        </button>
                    ` : ''}
                    ${solicitud.estado === 'Entregado' ? `
                        <button class="btn btn-sm btn-success btn-descargar-pdf" data-id="${solicitud.id}">
                            <i class="fas fa-file-pdf me-1"></i>PDF
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tablaSolicitudesFabricacion.appendChild(tr);
    });
}

// Actualizar controles de paginación para fabricación
function updateFabricacionPagination(totalItems) {
    createPaginationControls(
        '#fabricacion-panel .card-footer',
        totalItems,
        currentPageFabricacion,
        handlePageChange,
        'fabricacion'
    );
}

// Actualizar el encabezado de la tabla para incluir todos los campos
function actualizarEncabezadoTablaFabricacion() {
    const tablaFabricacion = document.querySelector('#fabricacion-panel table thead tr');
    
    if (tablaFabricacion) {
        // Actualizar encabezados con todos los campos solicitados
        tablaFabricacion.innerHTML = `
            <th>ID</th>
            <th>Nota Venta</th>
            <th>Cliente</th>
            <th>Local</th>
            <th>Fecha Solicitud</th>
            <th>Fecha Estimada</th>
            <th>Fecha Entrega</th>
            <th>Estado</th>
            <th>Acciones</th>
        `;
    }
}

// Generar PDF de entrega
function generarPDFEntrega(solicitudId) {
    console.log("Generando PDF para solicitud:", solicitudId);
    
    // Buscar la solicitud
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
        return;
    }
    
    // Verificar que la solicitud esté en estado "Entregado"
    if (solicitud.estado !== 'Entregado') {
        mostrarAlerta('Solo se pueden generar guías para solicitudes entregadas.', 'warning');
        return;
    }
    
    // Mostrar loading mientras se genera el PDF
    mostrarSincronizacion('Generando PDF...');
    
    // Generar el PDF utilizando la biblioteca jsPDF si está disponible
    if (typeof jspdf === 'undefined') {
        // Cargar jsPDF dinámicamente si no está disponible
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            // También necesitamos html2canvas
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script2.onload = function() {
                generarPDFConLibreria(solicitud);
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script);
    } else {
        // Si jsPDF ya está disponible
        generarPDFConLibreria(solicitud);
    }
}

// Generar el PDF usando jsPDF
function generarPDFConLibreria(solicitud) {
    try {
        // Crear un contenedor temporal para el PDF
        const tempDiv = document.createElement('div');
        tempDiv.id = 'pdf-container';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // Ancho A4
        tempDiv.innerHTML = generarContenidoGuiaEntrega(solicitud);
        document.body.appendChild(tempDiv);
        
        // Usar html2canvas para convertir el HTML a una imagen
        html2canvas(tempDiv, { scale: 2 }).then(canvas => {
            // Crear un nuevo PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Añadir la imagen al PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            // Guardar el PDF
            pdf.save(`Guia_Entrega_${solicitud.notaVenta}_${Date.now()}.pdf`);
            
            // Eliminar el contenedor temporal
            document.body.removeChild(tempDiv);
            
            // Ocultar loading
            ocultarSincronizacion();
            
            // Mostrar mensaje de éxito
            mostrarAlerta('Guía de entrega generada correctamente.', 'success');
        });
    } catch (error) {
        console.error('Error al generar PDF:', error);
        ocultarSincronizacion();
        mostrarAlerta('Error al generar la guía de entrega: ' + error.message, 'danger');
        
        // Fallback simple si falla jsPDF
        generarPDFFallback(solicitud);
    }
}

// Método alternativo para generar un PDF (fallback)
function generarPDFFallback(solicitud) {
    // Crear una ventana nueva
    const printWindow = window.open('', '_blank');
    
    // Escribir el contenido HTML
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Guía de Entrega - ${solicitud.notaVenta}</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .subtitle { font-size: 16px; color: #666; }
                .info-section { margin-bottom: 20px; }
                .info-row { display: flex; margin-bottom: 5px; }
                .info-label { width: 150px; font-weight: bold; }
                .info-value { flex: 1; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 50px; text-align: center; }
                .signatures { display: flex; justify-content: space-between; margin-top: 100px; }
                .signature { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
            </style>
        </head>
        <body>
            ${generarContenidoGuiaEntrega(solicitud)}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Ocultar loading
    ocultarSincronizacion();
}

// Generar el contenido HTML de la guía de entrega
function generarContenidoGuiaEntrega(solicitud) {
    // Obtener fecha estimada
    let fechaEstimada = 'No establecida';
    if (solicitud.fechaEstimada) {
        fechaEstimada = formatDate(solicitud.fechaEstimada);
    }
    
    // Obtener fecha de entrega real
    let fechaEntrega = 'Pendiente';
    if (solicitud.fechaEntrega) {
        fechaEntrega = formatDate(solicitud.fechaEntrega);
    } else if (solicitud.estado === 'Entregado' && solicitud.historial) {
        // Buscar en el historial si no está como propiedad directa
        const entregaHistorial = [...solicitud.historial]
            .reverse()
            .find(h => h.estado === 'Entregado' && h.fechaEntrega);
        
        if (entregaHistorial && entregaHistorial.fechaEntrega) {
            fechaEntrega = formatDate(entregaHistorial.fechaEntrega);
        }
    }
    
    // Obtener cliente y local (o usar valores por defecto)
    const cliente = solicitud.cliente || 'No especificado';
    const local = solicitud.local || 'No especificado';
    
    // Obtener productos
    const productosHTML = solicitud.items.map(item => `
        <tr>
            <td>${item.sku || '-'}</td>
            <td>${item.producto}</td>
            <td>${item.cantidad}</td>
        </tr>
    `).join('');
    
    // Crear el HTML para la guía de entrega
    return `
        <div class="header">
            <div class="title">GUÍA DE ENTREGA</div>
            <div class="subtitle">Sistema de Solicitudes</div>
        </div>
        
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">ID Solicitud:</div>
                <div class="info-value">${solicitud.id}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Nota de Venta:</div>
                <div class="info-value">${solicitud.notaVenta}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Cliente:</div>
                <div class="info-value">${cliente}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Local:</div>
                <div class="info-value">${local}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fecha de Solicitud:</div>
                <div class="info-value">${formatDate(solicitud.fechaSolicitud)}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fecha Estimada:</div>
                <div class="info-value">${fechaEstimada}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fecha de Entrega:</div>
                <div class="info-value">${fechaEntrega}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Estado:</div>
                <div class="info-value">${solicitud.estado}</div>
            </div>
            ${solicitud.observaciones ? `
            <div class="info-row">
                <div class="info-label">Observaciones:</div>
                <div class="info-value">${solicitud.observaciones}</div>
            </div>
            ` : ''}
        </div>
        
        <div>
            <h3>Productos</h3>
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="signatures">
            <div class="signature">Entregado por</div>
            <div class="signature">Recibido por</div>
        </div>
    `;
}

// Modificar la función handlePageChange en window para manejar cambios de página
function handlePageChangeFabricacion(newPage, panelName) {
    if (panelName === 'fabricacion') {
        currentPageFabricacion = newPage;
        cargarDatosFabricacion();
    }
}

// Asegurarse de que los listeners estén configurados al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado, inicializando mejoras del panel de fabricación...");
    
    // Actualizar el encabezado de la tabla para incluir todos los campos
    setTimeout(() => {
        actualizarEncabezadoTablaFabricacion();
    }, 500);
    
    // Configurar listeners específicos
    setupFabricacionButtonListeners();
    
    // Mensaje indicando que los cambios se han aplicado
    console.log("Mejoras del panel de fabricación inicializadas correctamente");
});

// Sobrescribir las funciones originales
window.cargarDatosFabricacion = cargarDatosFabricacion;
window.setupFabricacionListeners = setupFabricacionListeners;
window.updateFabricacionPagination = updateFabricacionPagination;
window.generarPDFEntrega = generarPDFEntrega;
