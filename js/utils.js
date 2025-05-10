// Utilidades globales

// Mostrar estado de sincronización
function mostrarSincronizacion(mensaje, isError = false) {
    const syncStatus = document.getElementById('sync-status');
    const syncMessage = document.getElementById('sync-message');
    
    syncMessage.textContent = mensaje;
    syncStatus.classList.add('active');
    
    if (isError) {
        syncStatus.style.backgroundColor = '#f8d7da';
        syncStatus.style.color = '#721c24';
    } else {
        syncStatus.style.backgroundColor = '#f8f9fa';
        syncStatus.style.color = '#212529';
    }
}

// Ocultar estado de sincronización
function ocultarSincronizacion() {
    const syncStatus = document.getElementById('sync-status');
    syncStatus.classList.remove('active');
}

// Obtener clase para la insignia según el estado
function getStatusBadgeClass(estado) {
    switch (estado) {
        case 'Solicitud enviada por bodega':
            return 'bg-primary';
        case 'En fabricación':
            return 'bg-warning text-dark';
        case 'Entregado':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Formatear fecha (YYYY-MM-DD a DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Formatear fecha y hora
function formatDateTime(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    return date.toLocaleString();
}
