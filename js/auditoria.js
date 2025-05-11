// Sistema de auditoría y logs para el seguimiento de acciones

// Referencia a la base de datos para logs
const logsRef = database.ref('logs');

// Tipos de eventos para auditoría
const TIPO_EVENTO = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    CREAR: 'crear',
    ACTUALIZAR: 'actualizar',
    ELIMINAR: 'eliminar',
    EXPORTAR: 'exportar',
    VER: 'ver',
    ERROR: 'error'
};

// Entidades que pueden ser modificadas
const ENTIDAD = {
    SOLICITUD: 'solicitud',
    USUARIO: 'usuario',
    SISTEMA: 'sistema',
    REPORTE: 'reporte'
};

// Inicializar sistema de auditoría
function initAuditoria() {
    console.log('Sistema de auditoría inicializado');
    
    // Registrar inicio de la aplicación
    registrarEvento(
        TIPO_EVENTO.VER,
        ENTIDAD.SISTEMA,
        null,
        'Inicio de la aplicación',
        { userAgent: navigator.userAgent }
    );
    
    // Sobrescribir funciones de autenticación para auditoría
    sobrescribirFuncionesAuth();
    
    // Sobrescribir funciones de gestión de solicitudes
    sobrescribirFuncionesSolicitudes();
    
    // Añadir listener para detectar cierre de ventana/pestaña
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            // No esperar confirmación, solo registrar
            registrarEvento(
                TIPO_EVENTO.LOGOUT,
                ENTIDAD.USUARIO,
                currentUser.id,
                'Cierre de sesión por cierre de ventana',
                { username: currentUser.username, role: currentUser.role }
            );
        }
    });
}

// Registrar un evento en el sistema de auditoría
function registrarEvento(tipo, entidad, entidadId, descripcion, detalles = {}) {
    // No registrar eventos si no hay conexión
    if (!navigator.onLine) {
        console.warn('No se pudo registrar evento de auditoría: sin conexión a internet');
        
        // Guardar en indexedDB o localStorage para sincronizar después
        guardarEventoPendiente({ tipo, entidad, entidadId, descripcion, detalles });
        return;
    }
    
    // Crear objeto de log
    const log = {
        id: generateUniqueId(),
        tipo: tipo,
        entidad: entidad,
        entidadId: entidadId,
        descripcion: descripcion,
        detalles: detalles,
        usuario: currentUser ? {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            role: currentUser.role
        } : { id: 'sistema', username: 'sistema', displayName: 'Sistema', role: 'sistema' },
        fecha: new Date().toISOString(),
        ip: '0.0.0.0', // En producción se obtendría del servidor
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // Guardar en Firebase
    return logsRef.push(log)
        .then(() => {
            console.debug('Evento registrado:', tipo, entidad, descripcion);
            return log;
        })
        .catch(error => {
            console.error('Error al registrar evento:', error);
            
            // Guardar localmente para reintentar después
            guardarEventoPendiente(log);
            
            return null;
        });
}

// Guardar evento pendiente para sincronizar después
function guardarEventoPendiente(log) {
    // Obtener eventos pendientes del localStorage
    let eventosPendientes = JSON.parse(localStorage.getItem('auditoria_pendiente') || '[]');
    
    // Añadir nuevo evento
    eventosPendientes.push(log);
    
    // Guardar en localStorage
    localStorage.setItem('auditoria_pendiente', JSON.stringify(eventosPendientes));
}

// Sincronizar eventos pendientes cuando se recupera la conexión
function sincronizarEventosPendientes() {
    if (!navigator.onLine) return;
    
    // Obtener eventos pendientes
    const eventosPendientes = JSON.parse(localStorage.getItem('auditoria_pendiente') || '[]');
    
    if (eventosPendientes.length === 0) return;
    
    console.log(`Sincronizando ${eventosPendientes.length} eventos de auditoría pendientes...`);
    
    // Crear array de promesas para cada evento
    const promesas = eventosPendientes.map(log => 
        logsRef.push(log)
            .then(() => true)
            .catch(error => {
                console.error('Error al sincronizar evento:', error);
                return false;
            })
    );
    
    // Esperar que todas las promesas se resuelvan
    Promise.all(promesas)
        .then(resultados => {
            // Contar cuántos se sincronizaron correctamente
            const sincronizados = resultados.filter(resultado => resultado).length;
            
            console.log(`${sincronizados} de ${eventosPendientes.length} eventos sincronizados correctamente`);
            
            // Si todos se sincronizaron, limpiar localStorage
            if (sincronizados === eventosPendientes.length) {
                localStorage.removeItem('auditoria_pendiente');
            } else {
                // Sino, guardar solo los que fallaron
                const eventosFallidos = eventosPendientes.filter((_, index) => !resultados[index]);
                localStorage.setItem('auditoria_pendiente', JSON.stringify(eventosFallidos));
            }
        });
}

// Escuchar cambios en la conexión para sincronizar
window.addEventListener('online', sincronizarEventosPendientes);

// Sobrescribir funciones de autenticación para auditoría
function sobrescribirFuncionesAuth() {
    // Guardar referencia a la función original de login
    const originalHandleLogin = window.handleLogin;
    
    // Sobrescribir función de login
    window.handleLogin = function(e) {
        const usernameInput = document.getElementById('username-input');
        const roleSelect = document.getElementById('role-select');
        
        const username = usernameInput ? usernameInput.value.trim() : '';
        const role = roleSelect ? roleSelect.value : '';
        
        // Registrar intento de inicio de sesión
        registrarEvento(
            TIPO_EVENTO.LOGIN,
            ENTIDAD.USUARIO,
            null,
            'Intento de inicio de sesión',
            { username, role, status: 'attempting' }
        );
        
        // Llamar a la función original
        originalHandleLogin.apply(this, arguments);
        
        // La auditoría del éxito se maneja en el callback original
    };
    
    // Guardar referencia a la función original de logout
    const originalHandleLogout = window.handleLogout;
    
    // Sobrescribir función de logout
    window.handleLogout = function() {
        // Registrar cierre de sesión
        if (currentUser) {
            registrarEvento(
                TIPO_EVENTO.LOGOUT,
                ENTIDAD.USUARIO,
                currentUser.id,
                'Cierre de sesión',
                { username: currentUser.username, role: currentUser.role }
            );
        }
        
        // Llamar a la función original
        originalHandleLogout.apply(this, arguments);
    };
}

// Sobrescribir funciones de gestión de solicitudes
function sobrescribirFuncionesSolicitudes() {
    // Guardar referencia a la función original de nueva solicitud
    const originalHandleNuevaSolicitudConUsuario = window.handleNuevaSolicitudConUsuario;
    
    // Sobrescribir función de nueva solicitud
    window.handleNuevaSolicitudConUsuario = function(e, user) {
        // Obtener datos del formulario antes de enviar
        const notaVenta = document.getElementById('nota-venta') ? document.getElementById('nota-venta').value : '';
        
        // Llamar a la función original
        originalHandleNuevaSolicitudConUsuario.apply(this, arguments);
        
        // Registrar creación de solicitud
        registrarEvento(
            TIPO_EVENTO.CREAR,
            ENTIDAD.SOLICITUD,
            null, // El ID se asigna en la función original
            'Creación de solicitud',
            { notaVenta: notaVenta, usuario: user.displayName }
        );
    };
    
    // Guardar referencia a la función original de actualización de estado
    const originalHandleActualizarEstadoConUsuario = window.handleActualizarEstadoConUsuario;
    
    // Sobrescribir función de actualización de estado
    window.handleActualizarEstadoConUsuario = function(solicitudId, nuevoEstado, observaciones, user) {
        // Obtener estado anterior
        const solicitud = solicitudes.find(s => s.id === solicitudId);
        const estadoAnterior = solicitud ? solicitud.estado : 'Desconocido';
        
        // Registrar actualización de estado
        registrarEvento(
            TIPO_EVENTO.ACTUALIZAR,
            ENTIDAD.SOLICITUD,
            solicitudId,
            'Actualización de estado',
            { 
                notaVenta: solicitud ? solicitud.notaVenta : '',
                estadoAnterior: estadoAnterior,
                nuevoEstado: nuevoEstado,
                observaciones: observaciones,
                usuario: user.displayName
            }
        );
        
        // Llamar a la función original
        originalHandleActualizarEstadoConUsuario.apply(this, arguments);
    };
}

// Cargar registros de auditoría para el panel de administración
function cargarRegistrosAuditoria(limite = 100, filtros = {}) {
    return new Promise((resolve, reject) => {
        mostrarSincronizacion('Cargando registros de auditoría...');
        
        // Construir consulta con filtros
        let query = logsRef.orderByChild('fecha').limitToLast(limite);
        
        // Aplicar filtros si existen
        // Nota: en una implementación real, se utilizarían índices compuestos en Firebase
        
        // Ejecutar consulta
        query.once('value')
            .then(snapshot => {
                let logs = [];
                
                snapshot.forEach(childSnapshot => {
                    const log = childSnapshot.val();
                    log.key = childSnapshot.key;
                    
                    // Aplicar filtros manuales si Firebase no permite filtrar directamente
                    if (aplicarFiltrosManuales(log, filtros)) {
                        logs.push(log);
                    }
                });
                
                // Ordenar por fecha descendente (más recientes primero)
                logs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                
                ocultarSincronizacion();
                resolve(logs);
            })
            .catch(error => {
                console.error('Error al cargar registros de auditoría:', error);
                ocultarSincronizacion();
                reject(error);
            });
    });
}

// Aplicar filtros manualmente a un registro de auditoría
function aplicarFiltrosManuales(log, filtros) {
    // Si no hay filtros, incluir el registro
    if (!filtros || Object.keys(filtros).length === 0) {
        return true;
    }
    
    // Verificar cada filtro
    for (const campo in filtros) {
        const valor = filtros[campo];
        
        // Si el valor es vacío o null, ignorar este filtro
        if (valor === null || valor === undefined || valor === '') {
            continue;
        }
        
        // Manejar filtro de fechas (rango)
        if (campo === 'fechaDesde' && new Date(log.fecha) < new Date(valor)) {
            return false;
        }
        
        if (campo === 'fechaHasta') {
            // Ajustar la fecha hasta para incluir todo el día
            const fechaHasta = new Date(valor);
            fechaHasta.setHours(23, 59, 59, 999);
            
            if (new Date(log.fecha) > fechaHasta) {
                return false;
            }
        }
        
        // Verificar campos anidados como usuario.username
        if (campo.includes('.')) {
            const partes = campo.split('.');
            let objetoActual = log;
            
            // Navegar por el objeto anidado
            for (const parte of partes) {
                if (!objetoActual || !objetoActual[parte]) {
                    return false;
                }
                objetoActual = objetoActual[parte];
            }
            
            // Comparar el valor final
            if (typeof objetoActual === 'string' && typeof valor === 'string') {
                if (!objetoActual.toLowerCase().includes(valor.toLowerCase())) {
                    return false;
                }
            } else if (objetoActual !== valor) {
                return false;
            }
            
            continue;
        }
        
        // Manejar campos normales
        if (!log[campo]) {
            return false;
        }
        
        // Para strings, hacer búsqueda parcial insensible a mayúsculas/minúsculas
        if (typeof log[campo] === 'string' && typeof valor === 'string') {
            if (!log[campo].toLowerCase().includes(valor.toLowerCase())) {
                return false;
            }
        } 
        // Para objetos, verificar igualdad exacta
        else if (typeof log[campo] === 'object' && log[campo] !== null) {
            if (JSON.stringify(log[campo]) !== JSON.stringify(valor)) {
                return false;
            }
        } 
        // Para otros tipos, verificar igualdad
        else if (log[campo] !== valor) {
            return false;
        }
    }
    
    // Si pasó todos los filtros, incluir el registro
    return true;
}

// Mostrar los logs en una tabla
function mostrarTablaLogs(logs, contenedor) {
    if (!contenedor) {
        console.error('No se especificó un contenedor para la tabla de logs');
        return;
    }
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    // Si no hay logs, mostrar mensaje
    if (!logs || logs.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>No hay registros de auditoría que mostrar
            </div>
        `;
        return;
    }
    
    // Crear tabla
    const tabla = document.createElement('table');
    tabla.className = 'table table-sm table-hover table-striped align-middle';
    
    // Crear encabezado
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Tipo</th>
            <th>Entidad</th>
            <th>Descripción</th>
            <th>Detalles</th>
        </tr>
    `;
    tabla.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        // Aplicar clases de fila según el tipo de evento
        switch (log.tipo) {
            case TIPO_EVENTO.ERROR:
                tr.className = 'table-danger';
                break;
            case TIPO_EVENTO.CREAR:
                tr.className = 'table-success';
                break;
            case TIPO_EVENTO.ELIMINAR:
                tr.className = 'table-warning';
                break;
        }
        
        // Formatear fecha
        const fecha = new Date(log.fecha);
        const fechaFormateada = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
        
        // Formatear detalles
        let detallesHTML = '';
        if (log.detalles && Object.keys(log.detalles).length > 0) {
            detallesHTML = `
                <button class="btn btn-sm btn-outline-secondary ver-detalles-log" 
                        data-bs-toggle="modal" 
                        data-bs-target="#detalles-log-modal"
                        data-log-id="${log.id}">
                    <i class="fas fa-search"></i>
                </button>
            `;
        }
        
        // Formatear tipo
        let tipoHTML = '';
        switch (log.tipo) {
            case TIPO_EVENTO.LOGIN:
                tipoHTML = '<span class="badge bg-primary">Login</span>';
                break;
            case TIPO_EVENTO.LOGOUT:
                tipoHTML = '<span class="badge bg-secondary">Logout</span>';
                break;
            case TIPO_EVENTO.CREAR:
                tipoHTML = '<span class="badge bg-success">Crear</span>';
                break;
            case TIPO_EVENTO.ACTUALIZAR:
                tipoHTML = '<span class="badge bg-info text-dark">Actualizar</span>';
                break;
            case TIPO_EVENTO.ELIMINAR:
                tipoHTML = '<span class="badge bg-danger">Eliminar</span>';
                break;
            case TIPO_EVENTO.EXPORTAR:
                tipoHTML = '<span class="badge bg-warning text-dark">Exportar</span>';
                break;
            case TIPO_EVENTO.VER:
                tipoHTML = '<span class="badge bg-light text-dark">Ver</span>';
                break;
            case TIPO_EVENTO.ERROR:
                tipoHTML = '<span class="badge bg-danger">Error</span>';
                break;
            default:
                tipoHTML = `<span class="badge bg-dark">${log.tipo}</span>`;
        }
        
        // Construir fila
        tr.innerHTML = `
            <td>${fechaFormateada}</td>
            <td>${log.usuario ? log.usuario.displayName : 'Sistema'}</td>
            <td>${tipoHTML}</td>
            <td>${log.entidad}${log.entidadId ? ` <small class="text-muted">#${log.entidadId.substring(0, 6)}</small>` : ''}</td>
            <td>${log.descripcion}</td>
            <td>${detallesHTML}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);
    
    // Configurar eventos para ver detalles
    document.querySelectorAll('.ver-detalles-log').forEach(btn => {
        btn.addEventListener('click', function() {
            const logId = this.getAttribute('data-log-id');
            mostrarDetallesLog(logs.find(log => log.id === logId));
        });
    });
}

// Mostrar detalles de un log en el modal
function mostrarDetallesLog(log) {
    if (!log) return;
    
    const modalBody = document.getElementById('detalles-log-modal-body');
    if (!modalBody) return;
    
    // Formatear fecha completa
    const fecha = new Date(log.fecha);
    const fechaFormateada = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
    
    // Formatear detalles como JSON pretty-printed
    const detallesFormateados = log.detalles ? JSON.stringify(log.detalles, null, 2) : '';
    
    // Construir contenido del modal
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>ID:</strong> ${log.id}</p>
                <p><strong>Tipo:</strong> ${log.tipo}</p>
                <p><strong>Entidad:</strong> ${log.entidad}</p>
                <p><strong>ID Entidad:</strong> ${log.entidadId || 'N/A'}</p>
                <p><strong>Descripción:</strong> ${log.descripcion}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Usuario:</strong> ${log.usuario ? log.usuario.displayName : 'Sistema'}</p>
                <p><strong>Rol:</strong> ${log.usuario ? log.usuario.role : 'N/A'}</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>IP:</strong> ${log.ip}</p>
                <p><strong>URL:</strong> ${log.url}</p>
            </div>
        </div>
        
        <div class="mt-3">
            <h6>Detalles:</h6>
            <pre class="bg-light p-3 rounded">${detallesFormateados || 'No hay detalles adicionales'}</pre>
        </div>
        
        <div class="mt-3">
            <h6>User Agent:</h6>
            <pre class="bg-light p-2 rounded small">${log.userAgent}</pre>
        </div>
    `;
    
    // Actualizar título del modal
    const modalTitle = document.querySelector('#detalles-log-modal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-info-circle me-2"></i>Detalles del Registro #${log.id.substring(0, 8)}`;
    }
}

// Exportar logs a CSV
function exportarLogsCSV(logs) {
    if (!logs || logs.length === 0) {
        mostrarAlerta('No hay registros para exportar', 'warning');
        return;
    }
    
    // Registrar evento de exportación
    registrarEvento(
        TIPO_EVENTO.EXPORTAR,
        ENTIDAD.SISTEMA,
        null,
        'Exportación de logs de auditoría',
        { formato: 'CSV', cantidad: logs.length }
    );
    
    // Cabeceras del CSV
    const headers = ['ID', 'Fecha', 'Tipo', 'Entidad', 'ID Entidad', 'Descripción', 'Usuario', 'Rol', 'IP', 'URL'];
    
    // Preparar datos
    const data = logs.map(log => [
        log.id,
        log.fecha,
        log.tipo,
        log.entidad,
        log.entidadId || '',
        log.descripcion,
        log.usuario ? log.usuario.displayName : 'Sistema',
        log.usuario ? log.usuario.role : '',
        log.ip,
        log.url
    ]);
    
    // Unir todo en un string CSV
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        // Escapar comas en los valores
        const escapedRow = row.map(cell => {
            // Si hay comas, comillas o saltos de línea, encerrar en comillas
            if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                // Escapar comillas duplicándolas
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        });
        
        csvContent += escapedRow.join(',') + '\n';
    });
    
    // Crear blob y link de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('Registros exportados correctamente', 'success');
}

// Exportar funciones al ámbito global
window.auditoria = {
    init: initAuditoria,
    registrarEvento,
    cargarRegistrosAuditoria,
    mostrarTablaLogs,
    exportarLogsCSV,
    TIPO_EVENTO,
    ENTIDAD
};
