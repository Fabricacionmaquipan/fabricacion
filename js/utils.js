// Utilidades globales

// Mostrar estado de sincronización
function mostrarSincronizacion(mensaje, isError = false) {
    const syncStatus = document.getElementById('sync-status');
    const syncMessage = document.getElementById('sync-message');
    
    syncMessage.textContent = mensaje;
    syncStatus.classList.add('active');
    
    if (isError) {
        syncStatus.classList.add('error');
    } else {
        syncStatus.classList.remove('error');
    }
}

// Ocultar estado de sincronización
function ocultarSincronizacion() {
    const syncStatus = document.getElementById('sync-status');
    
    // Animación suave de desaparición
    syncStatus.style.opacity = '0';
    
    setTimeout(() => {
        syncStatus.classList.remove('active');
        syncStatus.style.opacity = '1';
    }, 300);
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
    
    // Formatear fecha con hora en formato legible
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    
    return date.toLocaleString(undefined, options);
}

// Generar un ID único
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Mostrar alerta (Toast)
function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertContainer.style.top = '15px';
    alertContainer.style.right = '15px';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.maxWidth = '300px';
    alertContainer.style.boxShadow = '0 0.25rem 0.5rem rgba(0, 0, 0, 0.15)';
    
    alertContainer.innerHTML = `
        ${tipo === 'success' ? '<i class="fas fa-check-circle me-2"></i>' : 
          tipo === 'danger' ? '<i class="fas fa-exclamation-circle me-2"></i>' : 
          tipo === 'warning' ? '<i class="fas fa-exclamation-triangle me-2"></i>' : 
          '<i class="fas fa-info-circle me-2"></i>'}
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Añadir al body
    document.body.appendChild(alertContainer);
    
    // Animación de entrada
    setTimeout(() => {
        alertContainer.style.transition = 'all 0.3s ease';
        alertContainer.style.transform = 'translateX(0)';
        alertContainer.style.opacity = '1';
    }, 10);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        alertContainer.style.opacity = '0';
        alertContainer.style.transform = 'translateX(50px)';
        
        setTimeout(() => {
            alertContainer.remove();
        }, 300);
    }, 3000);
}

// Validar formulario
function validarFormulario(form) {
    // Si el navegador soporta validación nativa, usarla
    if (form.checkValidity) {
        return form.checkValidity();
    }
    
    // Validación manual para navegadores antiguos
    let isValid = true;
    
    // Validar campos requeridos
    form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Función para copiar texto al portapapeles
function copyToClipboard(text) {
    // Método moderno
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
            .then(() => true)
            .catch(() => {
                // Fallback a método antiguo si falla
                return fallbackCopyToClipboard(text);
            });
    }
    
    // Método antiguo como fallback
    return Promise.resolve(fallbackCopyToClipboard(text));
}

// Método antiguo para copiar
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Hacer el textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        document.body.removeChild(textArea);
        return false;
    }
}

// Detección de dispositivo móvil
function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i));
}
