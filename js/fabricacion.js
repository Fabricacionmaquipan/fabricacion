// fabricacion.js - Funciones para el panel de fabricación

// Elementos DOM y variables
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');
let currentPageFabricacion = 1;
let filterTermFabricacion = '';
let filterStatusFabricacion = 'all';

// Configurar event listeners para el panel de fabricación
function setupFabricacionListeners() {
    console.log("Configurando listeners para panel de fabricación...");
    
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

// Función para paginar y filtrar elementos
function paginateAndFilterItems(items, currentPage, filterTerm, filterStatus, itemsPerPage = 10) {
    // Filtrar por término de búsqueda si existe
    let filteredItems = items;
    
    if (filterTerm && filterTerm.trim() !== '') {
        filteredItems = items.filter(item => {
            // Búsqueda en múltiples campos
            return (
                (item.id && item.id.toLowerCase().includes(filterTerm)) ||
                (item.notaVenta && item.notaVenta.toLowerCase().includes(filterTerm)) ||
                (item.cliente && item.cliente.toLowerCase().includes(filterTerm)) ||
                (item.local && item.local.toLowerCase().includes(filterTerm)) ||
                (item.estado && item.estado.toLowerCase().includes(filterTerm))
            );
        });
    }
    
    // Filtrar por estado si existe
    if (filterStatus && filterStatus !== 'all') {
        filteredItems = filteredItems.filter(item => {
            if (filterStatus === 'pendientes') {
                return item.estado === 'Solicitud enviada por bodega';
            } else if (filterStatus === 'fabricacion') {
                return item.estado === 'En fabricación';
            } else if (filterStatus === 'entregadas') {
                return item.estado === 'Entregado';
            }
            return true;
        });
    }
    
    // Ordenar por fecha (más recientes primero)
    filteredItems.sort((a, b) => {
        return new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud);
    });
    
    // Calcular índices para paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Devolver los elementos paginados y el total
    return {
        items: filteredItems.slice(startIndex, endIndex),
        totalItems: filteredItems.length
    };
}

// Obtener clase para el badge de estado
function getStatusBadgeClass(estado) {
    switch (estado) {
        case 'Solicitud enviada por bodega':
            return 'bg-info';
        case 'En fabricación':
            return 'bg-warning text-dark';
        case 'Entregado':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Formatear fecha para mostrar
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Si no es una fecha válida
    
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Crear controles de paginación
function createPaginationControls(containerSelector, totalItems, currentPage, pageChangeCallback, panelType, itemsPerPage = 10) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <nav aria-label="Paginación" class="d-flex justify-content-between align-items-center">
            <div class="small text-muted">
                Mostrando ${Math.min(totalItems, 1 + (currentPage - 1) * itemsPerPage)}-${Math.min(totalItems, currentPage * itemsPerPage)} de ${totalItems} solicitudes
            </div>
            <ul class="pagination pagination-sm mb-0">
    `;
    
    // Botón anterior
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" data-panel="${panelType}" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Números de página
    const maxPages = 5; // Limitar a 5 números por UX
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Ajustar si no hay suficientes páginas al inicio
    if (endPage - startPage + 1 < maxPages && startPage > 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}" data-panel="${panelType}">${i}</a>
            </li>
        `;
    }
    
    // Botón siguiente
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" data-panel="${panelType}" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    html += `
            </ul>
        </nav>
    `;
    
    container.innerHTML = html;
    
    // Añadir listener a los botones de paginación
    const pageLinks = container.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            
            const page = parseInt(link.getAttribute('data-page'));
            const panel = link.getAttribute('data-panel');
            
            if (isNaN(page) || page < 1 || page > totalPages) return;
            
            pageChangeCallback(page, panel);
        });
    });
}

// Manejar cambio de página
function handlePageChange(page, panel) {
    if (panel === 'fabricacion') {
        currentPageFabricacion = page;
        cargarDatosFabricacion();
    }
}

// Cargar datos para el panel de Fabricación
function cargarDatosFabricacion() {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    // Verificar si la variable solicitudes existe globalmente
    if (typeof solicitudes === 'undefined' || !Array.isArray(solicitudes)) {
        tablaSolicitudesFabricacion.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">Error: No se pudo acceder a los datos de solicitudes</p>
                    </div>
                </td>
            </tr>
        `;
        console.error('Error: La variable "solicitudes" no está definida o no es un array');
        return;
    }
    
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
        const idCorto = solicitud.id ? solicitud.id.substring(Math.max(0, solicitud.id.length - 6)) : 'N/A';
        
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
        
        // Construir HTML de la fila - ASEGURANDO QUE COINCIDE CON EL ORDEN DE LAS COLUMNAS DEL ENCABEZADO
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta || 'N/A'}</td>
            <td data-label="Cliente">${cliente}</td>
            <td data-label="Local">${local}</td>
            <td data-label="Fecha Solicitud">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Fecha Estimada">${fechaEstimada}</td>
            <td data-label="Fecha Entrega">${fechaEntrega}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado || 'Sin estado'}</span>
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
    console.log('Función generarPDFEntrega INVOCADA con ID:', solicitudId); // NUEVO LOG

    // Buscar la solicitud
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    console.log('Solicitud encontrada en generarPDFEntrega:', solicitud); // NUEVO LOG
    if (!solicitud) {
        mostrarAlerta('No se encontró la solicitud para generar PDF.', 'danger'); // Mensaje un poco diferente para distinguir
        console.error('No se encontró la solicitud con ID:', solicitudId, 'en el array global "solicitudes"');
        return;
    }
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se elimina o comenta la siguiente condición para permitir generar el PDF
    // en estados diferentes a 'Entregado'.
    /*
    if (solicitud.estado !== 'Entregado') {
        mostrarAlerta('Solo se pueden generar guías para solicitudes entregadas.', 'warning');
        return;
    }
    */
    // --- FIN DE LA MODIFICACIÓN ---
    
    // Mostrar loading mientras se genera el PDF
    mostrarSincronizacion('Generando PDF...');
    
    // Generar el PDF utilizando la biblioteca jsPDF si está disponible
    if (typeof jspdf === 'undefined') {
        // Verificar si la variable global jsPDF está disponible (nombre alternativo)
        if (typeof jsPDF === 'undefined') {
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
            // Si jsPDF está disponible con nombre alternativo
            generarPDFConLibreria(solicitud);
        }
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
        
        // Definir estilos para el contenedor temporal
        const style = document.createElement('style');
        style.textContent = `
            #pdf-container {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #000;
            }
            #pdf-container .header {
                text-align: center;
                margin-bottom: 20px;
            }
            #pdf-container .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            #pdf-container .subtitle {
                font-size: 16px;
                color: #666;
            }
            #pdf-container .info-section {
                margin-bottom: 20px;
            }
            #pdf-container .info-row {
                display: flex;
                margin-bottom: 5px;
            }
            #pdf-container .info-label {
                width: 150px;
                font-weight: bold;
            }
            #pdf-container .info-value {
                flex: 1;
            }
            #pdf-container table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            #pdf-container th, #pdf-container td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            #pdf-container th {
                background-color: #f2f2f2;
            }
            #pdf-container .footer {
                margin-top: 50px;
                text-align: center;
            }
            #pdf-container .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 100px;
            }
            #pdf-container .signature {
                border-top: 1px solid #000;
                width: 200px;
                text-align: center;
                padding-top: 5px;
            }
        `;
        document.head.appendChild(style);
        
        // Verificar si html2canvas está disponible
        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas no está disponible, usando fallback');
            generarPDFFallback(solicitud);
            document.body.removeChild(tempDiv);
            document.head.removeChild(style);
            return;
        }
        
        // Usar html2canvas para convertir el HTML a una imagen
        html2canvas(tempDiv, { 
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true
        }).then(canvas => {
            try {
                // Verificar qué versión de jsPDF está disponible
                let pdf;
                if (typeof jspdf !== 'undefined') {
                    const { jsPDF } = window.jspdf;
                    pdf = new jsPDF('p', 'mm', 'a4');
                } else if (typeof jsPDF !== 'undefined') {
                    pdf = new jsPDF('p', 'mm', 'a4');
                } else {
                    throw new Error('jsPDF no está disponible');
                }
                
                // Añadir la imagen al PDF
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = canvas.height * imgWidth / canvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                
                // Añadir primera página
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                // Añadir páginas adicionales si es necesario
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                // Guardar el PDF
                pdf.save(`Guia_Entrega_${solicitud.notaVenta}_${Date.now()}.pdf`);
                
                // Eliminar elementos temporales
                document.body.removeChild(tempDiv);
                document.head.removeChild(style);
                
                // Ocultar loading
                ocultarSincronizacion();
                
                // Mostrar mensaje de éxito
                mostrarAlerta('Guía de entrega generada correctamente.', 'success');
            } catch (error) {
                console.error('Error al crear PDF:', error);
                generarPDFFallback(solicitud);
                
                // Eliminar elementos temporales
                document.body.removeChild(tempDiv);
                document.head.removeChild(style);
            }
        }).catch(error => {
            console.error('Error en html2canvas:', error);
            generarPDFFallback(solicitud);
            
            // Eliminar elementos temporales
            document.body.removeChild(tempDiv);
            document.head.removeChild(style);
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
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            ${generarContenidoGuiaEntrega(solicitud)}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Imprimir Guía
                </button>
            </div>
            <script>
                // Ofrecer impresión automática después de 1 segundo
                setTimeout(function() {
                    if (confirm('¿Desea imprimir la guía de entrega ahora?')) {
                        window.print();
                    }
                }, 1000);
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
    const productosHTML = solicitud.items ? solicitud.items.map(item => `
        <tr>
            <td>${item.sku || '-'}</td>
            <td>${item.producto}</td>
            <td>${item.cantidad}</td>
        </tr>
    `).join('') : '<tr><td colspan="3">No hay productos registrados</td></tr>';
    
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

// Opcional: Exponer generarPDFEntrega globalmente si es necesario para app.js
// window.generarPDFEntrega = generarPDFEntrega;
