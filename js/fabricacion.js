// Funciones específicas del panel de fabricación

// Elementos DOM de Fabricación
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');

// Configurar event listeners específicos de fabricación
function setupFabricacionListeners() {
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#fabricacion-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Filtrar según el valor seleccionado
                const filtro = item.textContent.trim();
                filtrarSolicitudesFabricacion(filtro);
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#fabricacion-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            buscarSolicitudesFabricacion(searchTerm);
        });
    }
}

// Filtrar solicitudes por estado
function filtrarSolicitudesFabricacion(filtro) {
    if (!tablaSolicitudesFabricacion) return;
    
    const rows = tablaSolicitudesFabricacion.querySelectorAll('tr');
    
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
    const footerText = document.querySelector('#fabricacion-panel .card-footer small');
    if (footerText) {
        const visibleCount = [...rows].filter(row => row.style.display !== 'none').length;
        footerText.textContent = `Mostrando ${visibleCount} de ${rows.length} solicitudes (Filtro: ${filtro})`;
    }
}

// Buscar solicitudes por término
function buscarSolicitudesFabricacion(searchTerm) {
    if (!tablaSolicitudesFabricacion || !searchTerm) {
        // Si el término está vacío, mostrar todas
        const rows = tablaSolicitudesFabricacion.querySelectorAll('tr');
        rows.forEach(row => row.style.display = '');
        return;
    }
    
    const rows = tablaSolicitudesFabricacion.querySelectorAll('tr');
    
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
    const footerText = document.querySelector('#fabricacion-panel .card-footer small');
    if (footerText) {
        const visibleCount = [...rows].filter(row => row.style.display !== 'none').length;
        footerText.textContent = `Mostrando ${visibleCount} de ${rows.length} solicitudes (Búsqueda: "${searchTerm}")`;
    }
}

// Cargar datos para el panel de Fabricación
function cargarDatosFabricacion() {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesFabricacion.innerHTML = `
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
                ${solicitud.estado !== 'Entregado' ? `
                    <button class="btn btn-sm btn-warning btn-cambiar-estado" data-id="${solicitud.id}">
                        <i class="fas fa-edit me-1"></i>Cambiar
                    </button>
                ` : ''}
            </td>
        `;
        
        tablaSolicitudesFabricacion.appendChild(tr);
    });
    
    // Actualizar texto de footer
    const footerText = document.querySelector('#fabricacion-panel .card-footer small');
    if (footerText) {
        footerText.textContent = `Mostrando ${solicitudesOrdenadas.length} solicitudes`;
    }
}
