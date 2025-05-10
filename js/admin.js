// Funciones específicas del panel de administración

// Elementos DOM de Admin
const tablaSolicitudesAdmin = document.getElementById('tabla-solicitudes-admin');

// Configurar event listeners específicos de admin
function setupAdminListeners() {
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#admin-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Filtrar según el valor seleccionado
                const filtro = item.textContent.trim();
                filtrarSolicitudesAdmin(filtro);
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#admin-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            buscarSolicitudesAdmin(searchTerm);
        });
    }
}

// Filtrar solicitudes por estado
function filtrarSolicitudesAdmin(filtro) {
    if (!tablaSolicitudesAdmin) return;
    
    const rows = tablaSolicitudesAdmin.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (filtro === 'Todas') {
            row.style.display = '';
            return;
        }
        
        const estadoCell = row.querySelector('td:nth-child(5)');
        if (estadoCell) {
            const estadoTexto = estadoCell.textContent.trim();
            
            let mostrar = false;
            switch (filtro) {
                case 'Pendientes':
                    mostrar = estadoTexto.includes('Solicitud enviada');
                    break;
                case 'En Fabricación':
                    mostrar = estadoTexto.includes('En fabricación');
                    break;
                case 'Entregadas':
                    mostrar = estadoTexto.includes('Entregado');
                    break;
                default:
                    mostrar = true;
            }
            
            row.style.display = mostrar ? '' : 'none';
        }
    });
    
    // Actualizar texto de footer
    const footerText = document.querySelector('#admin-panel .card-footer small');
    if (footerText) {
        const visibleCount = [...rows].filter(row => row.style.display !== 'none').length;
        footerText.textContent = `Mostrando ${visibleCount} de ${rows.length} solicitudes (Filtro: ${filtro})`;
    }
}

// Buscar solicitudes por término
function buscarSolicitudesAdmin(searchTerm) {
    if (!tablaSolicitudesAdmin || !searchTerm) {
        // Si el término está vacío, mostrar todas
        const rows = tablaSolicitudesAdmin.querySelectorAll('tr');
        rows.forEach(row => row.style.display = '');
        return;
    }
    
    const rows = tablaSolicitudesAdmin.querySelectorAll('tr');
    
    rows.forEach(row => {
        let found = false;
        
        // Buscar en todas las celdas
        row.querySelectorAll('td').forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchTerm)) {
                found = true;
            }
        });
        
        row.style.display = found ? '' : 'none';
    });
    
    // Actualizar texto de footer
    const footerText = document.querySelector('#admin-panel .card-footer small');
    if (footerText) {
        const visibleCount = [...rows].filter(row => row.style.display !== 'none').length;
        footerText.textContent = `Mostrando ${visibleCount} de ${rows.length} solicitudes (Búsqueda: "${searchTerm}")`;
    }
}

// Cargar datos para el panel de Admin
function cargarDatosAdmin() {
    if (!tablaSolicitudesAdmin) return;
    
    tablaSolicitudesAdmin.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesAdmin.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay solicitudes en el sistema</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar solicitudes por fecha (más recientes primero)
    const solicitudesOrdenadas = [...solicitudes].sort((a, b) => {
        return new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud);
    });
    
    solicitudesOrdenadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear el detalle de productos
        const detalleProductos = solicitud.items.map(item => 
            `<div><strong>${item.producto}:</strong> ${item.cantidad}</div>`
        ).join('');
        
        // Crear ID corto para mejor visualización
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Fecha">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Detalle">${detalleProductos}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
            </td>
            <td data-label="Observaciones">${solicitud.observaciones || '<span class="text-muted">Sin observaciones</span>'}</td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                    <i class="fas fa-eye me-1"></i>Ver
                </button>
                <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}">
                    <i class="fas fa-edit me-1"></i>Editar
                </button>
            </td>
        `;
        
        tablaSolicitudesAdmin.appendChild(tr);
    });
    
    // Actualizar texto de footer
    const footerText = document.querySelector('#admin-panel .card-footer small');
    if (footerText) {
        footerText.textContent = `Mostrando ${solicitudesOrdenadas.length} solicitudes`;
    }
}

// Exportar solicitudes a CSV (funcionalidad adicional)
function exportarSolicitudesCSV() {
    if (solicitudes.length === 0) {
        mostrarAlerta('No hay solicitudes para exportar', 'warning');
        return;
    }
    
    // Crear cabeceras del CSV
    let csvContent = 'ID,Nota Venta,Fecha,Estado,Observaciones,Productos\n';
    
    // Añadir filas de datos
    solicitudes.forEach(solicitud => {
        const productos = solicitud.items.map(item => `${item.producto} (${item.cantidad})`).join(' | ');
        
        // Escapar comillas y otros caracteres problemáticos
        const escaparCSV = (texto) => {
            if (!texto) return '';
            return `"${texto.replace(/"/g, '""')}"`;
        };
        
        const fila = [
            solicitud.id,
            escaparCSV(solicitud.notaVenta),
            solicitud.fechaSolicitud,
            escaparCSV(solicitud.estado),
            escaparCSV(solicitud.observaciones || ''),
            escaparCSV(productos)
        ].join(',');
        
        csvContent += fila + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solicitudes_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('Solicitudes exportadas correctamente', 'success');
}

// Función para generar estadísticas (funcionalidad adicional)
function generarEstadisticas() {
    if (solicitudes.length === 0) {
        mostrarAlerta('No hay datos para generar estadísticas', 'warning');
        return;
    }
    
    // Contar solicitudes por estado
    const estadosCounts = solicitudes.reduce((acc, sol) => {
        acc[sol.estado] = (acc[sol.estado] || 0) + 1;
        return acc;
    }, {});
    
    // Productos más solicitados
    const productosCounts = {};
    solicitudes.forEach(sol => {
        sol.items.forEach(item => {
            const producto = item.producto;
            productosCounts[producto] = (productosCounts[producto] || 0) + parseInt(item.cantidad);
        });
    });
    
    // Ordenar productos por cantidad
    const productosOrdenados = Object.entries(productosCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    
    // Solicitudes por mes
    const solicitudesPorMes = solicitudes.reduce((acc, sol) => {
        const fecha = new Date(sol.fechaSolicitud);
        const mes = fecha.toLocaleString('default', { month: 'long' });
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
    }, {});
    
    // Mostrar estadísticas en un modal
    let estadisticasHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0">Solicitudes por Estado</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${Object.entries(estadosCounts).map(([estado, count]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${estado}
                                    <span class="badge bg-primary rounded-pill">${count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0">Productos más Solicitados</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${productosOrdenados.map(([producto, cantidad]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${producto}
                                    <span class="badge bg-info rounded-pill">${cantidad}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Solicitudes por Mes</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${Object.entries(solicitudesPorMes).map(([mes, count]) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${mes}
                                    <span class="badge bg-success rounded-pill">${count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Crear y mostrar el modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    modalContainer.id = 'estadisticasModal';
    modalContainer.setAttribute('tabindex', '-1');
    
    modalContainer.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-chart-bar me-2"></i>Estadísticas del Sistema</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${estadisticasHTML}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="exportarEstadisticas()">
                        <i class="fas fa-download me-1"></i>Exportar
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();
    
    // Función para exportar estadísticas
    window.exportarEstadisticas = function() {
        const contenido = `
            ESTADÍSTICAS DEL SISTEMA DE SOLICITUDES
            Fecha de generación: ${new Date().toLocaleString()}
            
            SOLICITUDES POR ESTADO:
            ${Object.entries(estadosCounts).map(([estado, count]) => `${estado}: ${count}`).join('\n')}
            
            PRODUCTOS MÁS SOLICITADOS:
            ${productosOrdenados.map(([producto, cantidad]) => `${producto}: ${cantidad}`).join('\n')}
            
            SOLICITUDES POR MES:
            ${Object.entries(solicitudesPorMes).map(([mes, count]) => `${mes}: ${count}`).join('\n')}
        `;
        
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'estadisticas_solicitudes.txt';
        link.click();
        
        URL.revokeObjectURL(url);
        
        mostrarAlerta('Estadísticas exportadas correctamente', 'success');
    };
    
    // Limpiar al cerrar
    modalContainer.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalContainer);
        delete window.exportarEstadisticas;
    });
}
