// Funciones específicas del panel de fabricación

// Elementos DOM de Fabricación
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');

// Cargar datos para el panel de Fabricación
function cargarDatosFabricacion() {
    if (!tablaSolicitudesFabricacion) return;
    
    tablaSolicitudesFabricacion.innerHTML = '';
    
    solicitudes.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear el detalle de productos
        const detalleProductos = solicitud.items.map(item => 
            `${item.producto}: ${item.cantidad}`
        ).join('<br>');
        
        tr.innerHTML = `
            <td>${solicitud.id.substring(solicitud.id.length - 6)}</td>
            <td>${solicitud.notaVenta}</td>
            <td>${formatDate(solicitud.fechaSolicitud)}</td>
            <td>${detalleProductos}</td>
            <td><span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span></td>
            <td>${solicitud.observaciones || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info mb-1 btn-detalle" data-id="${solicitud.id}">
                    Ver
                </button>
                ${solicitud.estado !== 'Entregado' ? `
                    <button class="btn btn-sm btn-warning mb-1 btn-cambiar-estado" data-id="${solicitud.id}">
                        Cambiar Estado
                    </button>
                ` : ''}
            </td>
        `;
        
        tablaSolicitudesFabricacion.appendChild(tr);
    });
}
