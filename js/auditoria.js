// Sistema de auditoría y logs para el seguimiento de acciones

// Referencia a la base de datos para logs
const logsRef = database.ref('logs'); // Asumiendo que 'database' está definido globalmente (Firebase)

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
    // currentUser puede ser null al inicio, registrarEvento lo maneja
    registrarEvento(
        TIPO_EVENTO.VER,
        ENTIDAD.SISTEMA,
        null,
        'Inicio de la aplicación',
        { userAgent: navigator.userAgent }
    );
    
    // Sobrescribir funciones de autenticación para auditoría
    // Estas funciones deben estar disponibles en el ámbito global (window)
    if (typeof window.handleLogin === 'function' && typeof window.handleLogout === 'function') {
        sobrescribirFuncionesAuth();
    } else {
        console.warn("Funciones de autenticación no disponibles para auditoría.");
    }
    
    // Sobrescribir funciones de gestión de solicitudes
    if (typeof window.handleNuevaSolicitudConUsuario === 'function' && typeof window.handleActualizarEstadoConUsuario === 'function') {
        sobrescribirFuncionesSolicitudes();
    } else {
        console.warn("Funciones de gestión de solicitudes no disponibles para auditoría.");
    }
    
    // Añadir listener para detectar cierre de ventana/pestaña
    window.addEventListener('beforeunload', () => {
        if (currentUser) { // currentUser debe ser una variable global accesible desde auth.js
            // No esperar confirmación, solo registrar
            registrarEvento(
                TIPO_EVENTO.LOGOUT,
                ENTIDAD.USUARIO,
                currentUser.username, // Usar username como ID
                'Cierre de sesión por cierre de ventana',
                { username: currentUser.username, role: currentUser.role }
            );
        }
    });

    // Sincronizar eventos pendientes al cargar la página si hay conexión
    sincronizarEventosPendientes();
}

// Registrar un evento en el sistema de auditoría
function registrarEvento(tipo, entidad, entidadId, descripcion, detalles = {}) {
    // No registrar eventos si no hay conexión y el objeto 'navigator' no existe (entornos de prueba/node)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('No se pudo registrar evento de auditoría: sin conexión a internet');
        guardarEventoPendiente({ tipo, entidad, entidadId, descripcion, detalles, fechaOriginal: new Date().toISOString() });
        return Promise.resolve(null); // Devolver una promesa resuelta
    }
    
    // Crear objeto de log
    // currentUser debe ser una variable global accesible desde auth.js
    const usuarioLog = currentUser ? {
        id: currentUser.username, // MODIFICADO: Usar username como ID ya que los usuarios en auth.js no tienen 'id' numérico
        username: currentUser.username,
        displayName: currentUser.displayName,
        role: currentUser.role
    } : { id: 'sistema', username: 'sistema', displayName: 'Sistema', role: 'sistema' };

    const log = {
        id: database.ref().push().key, // Generar ID único de Firebase para el log mismo
        tipo: tipo,
        entidad: entidad,
        entidadId: entidadId || null, // Asegurar que sea null si no hay ID, no undefined
        descripcion: descripcion,
        detalles: detalles,
        usuario: usuarioLog,
        fecha: new Date().toISOString(),
        ip: '0.0.0.0', // En producción se obtendría del servidor o se omitiría
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
        url: typeof window !== 'undefined' ? window.location.href : 'Desconocido'
    };
    
    // Guardar en Firebase
    return logsRef.push(log)
        .then(() => {
            console.debug('Evento de auditoría registrado:', tipo, entidad, descripcion);
            return log;
        })
        .catch(error => {
            console.error('Error al registrar evento de auditoría:', error);
            guardarEventoPendiente(log); // Guardar localmente para reintentar después
            return null; // Devolver null en caso de error
        });
}

// Guardar evento pendiente para sincronizar después
function guardarEventoPendiente(log) {
    try {
        let eventosPendientes = JSON.parse(localStorage.getItem('auditoria_pendiente') || '[]');
        eventosPendientes.push(log); // El log ya debería tener su propia fecha original
        localStorage.setItem('auditoria_pendiente', JSON.stringify(eventosPendientes));
        console.log("Evento de auditoría guardado localmente para sincronización posterior.");
    } catch (e) {
        console.error("Error al guardar evento pendiente en localStorage:", e);
    }
}

// Sincronizar eventos pendientes cuando se recupera la conexión
function sincronizarEventosPendientes() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    
    let eventosPendientes;
    try {
        eventosPendientes = JSON.parse(localStorage.getItem('auditoria_pendiente') || '[]');
    } catch (e) {
        console.error("Error al leer eventos pendientes de localStorage:", e);
        localStorage.removeItem('auditoria_pendiente'); // Limpiar si está corrupto
        return;
    }

    if (eventosPendientes.length === 0) return;
    
    console.log(`Sincronizando ${eventosPendientes.length} eventos de auditoría pendientes...`);
    
    const promesas = eventosPendientes.map(log => {
        // Si el log no tiene un ID de Firebase, es porque se guardó antes de la modificación
        // que asigna 'id: database.ref().push().key'. Para estos, no podemos simplemente re-pushear
        // el mismo objeto. En su lugar, creamos uno nuevo para que Firebase le asigne un ID.
        // Sin embargo, el log ya tiene una 'fechaOriginal' que es la 'fecha' que tenía cuando se guardó.
        const logParaEnviar = { ...log };
        if (!logParaEnviar.id) { // Si no tiene el ID del log mismo
            logParaEnviar.id = database.ref().push().key;
        }
        // La fecha del log debe ser la de cuando ocurrió el evento, no cuando se sincroniza.
        // Si 'fechaOriginal' existe, úsala, si no, 'fecha' ya es la correcta.
        logParaEnviar.fecha = log.fechaOriginal || log.fecha;
        delete logParaEnviar.fechaOriginal; // Limpiar por si acaso

        return logsRef.child(logParaEnviar.id).set(logParaEnviar) // Usar set con el ID del log para evitar duplicados si se reintenta
            .then(() => true)
            .catch(error => {
                console.error('Error al sincronizar evento de auditoría:', error, logParaEnviar);
                return false;
            });
    });
    
    Promise.all(promesas)
        .then(resultados => {
            const eventosRestantes = eventosPendientes.filter((_, index) => !resultados[index]);
            if (eventosRestantes.length === 0) {
                localStorage.removeItem('auditoria_pendiente');
                console.log('Todos los eventos de auditoría pendientes sincronizados.');
            } else {
                localStorage.setItem('auditoria_pendiente', JSON.stringify(eventosRestantes));
                console.log(`${eventosRestantes.length} eventos de auditoría no pudieron ser sincronizados y permanecen pendientes.`);
            }
        });
}


// Escuchar cambios en la conexión para sincronizar
if (typeof window !== 'undefined') {
    window.addEventListener('online', sincronizarEventosPendientes);
}

// Sobrescribir funciones de autenticación para auditoría
function sobrescribirFuncionesAuth() {
    const originalHandleLogin = window.handleLogin;
    if (originalHandleLogin) {
        window.handleLogin = function(e) { // El evento 'e' es pasado por el listener del form
            const usernameInput = document.getElementById('username-input');
            const roleSelect = document.getElementById('role-select');
            
            const username = usernameInput ? usernameInput.value.trim() : 'desconocido';
            const role = roleSelect ? roleSelect.value : 'desconocido';
            
            // Llamar a la función original primero para que intente la autenticación
            // El resultado (éxito/fracaso) y el currentUser se manejan dentro de originalHandleLogin
            originalHandleLogin.apply(this, arguments);

            // El registro del evento de login (éxito o fracaso) debería hacerse DENTRO
            // de la lógica de handleLogin original, una vez se sepa si fue exitoso y quién es el usuario.
            // Por ahora, este log es solo del intento.
            // Si originalHandleLogin es asíncrona (ej. usa setTimeout), currentUser no estará actualizado aquí.
            // Este es un punto a mejorar: el log de éxito debería ser llamado DESPUÉS de que currentUser se establece.
             registrarEvento(
                TIPO_EVENTO.LOGIN,
                ENTIDAD.USUARIO,
                username, // Usar username como ID temporal del intento
                'Intento de inicio de sesión',
                { username_attempt: username, role_attempt: role, status: 'attempting' }
            );
        };
    }
    
    const originalHandleLogout = window.handleLogout;
    if (originalHandleLogout) {
        window.handleLogout = function() {
            if (currentUser) { // currentUser debe ser global
                registrarEvento(
                    TIPO_EVENTO.LOGOUT,
                    ENTIDAD.USUARIO,
                    currentUser.username, // Usar username como ID
                    'Cierre de sesión',
                    { username: currentUser.username, role: currentUser.role }
                );
            }
            originalHandleLogout.apply(this, arguments);
        };
    }
}

// Sobrescribir funciones de gestión de solicitudes
function sobrescribirFuncionesSolicitudes() {
    const originalHandleNuevaSolicitudConUsuario = window.handleNuevaSolicitudConUsuario;
    if (originalHandleNuevaSolicitudConUsuario) {
        window.handleNuevaSolicitudConUsuario = function(e, user) { // user es pasado a esta función
            const notaVentaInput = document.getElementById('nota-venta');
            const notaVenta = notaVentaInput ? notaVentaInput.value : '';
            
            // Es mejor registrar el evento DESPUÉS de que la creación es exitosa.
            // Esto requeriría que originalHandleNuevaSolicitudConUsuario devuelva una promesa
            // o que el registro se haga dentro de su .then().
            // Por ahora, lo registramos como intento.
            
            // Llamada original
            const resultado = originalHandleNuevaSolicitudConUsuario.apply(this, arguments);

            // Si la función original es asíncrona y devuelve una promesa:
            if (resultado && typeof resultado.then === 'function') {
                resultado.then(nuevaSolicitud => { // Asumiendo que devuelve la nueva solicitud o su ID
                     registrarEvento(
                        TIPO_EVENTO.CREAR,
                        ENTIDAD.SOLICITUD,
                        nuevaSolicitud ? nuevaSolicitud.id : null, // Asume que la función original devuelve la solicitud o su ID
                        'Creación de solicitud',
                        { notaVenta: notaVenta, usuario: user ? user.displayName : 'Desconocido' }
                    );
                }).catch(err => { /* Manejar error si es necesario */ });
            } else {
                 // Si es síncrona, el ID de la nueva solicitud no estará disponible aquí fácilmente.
                 // El registro se hace optimísticamente.
                 registrarEvento(
                    TIPO_EVENTO.CREAR,
                    ENTIDAD.SOLICITUD,
                    null, 
                    'Intento de creación de solicitud',
                    { notaVenta: notaVenta, usuario: user ? user.displayName : 'Desconocido' }
                );
            }
        };
    }
    
    const originalHandleActualizarEstadoConUsuario = window.handleActualizarEstadoConUsuario;
    if (originalHandleActualizarEstadoConUsuario) {
        window.handleActualizarEstadoConUsuario = function(solicitudId, nuevoEstado, observaciones, user, fechaEstimada, fechaEntrega) { //Asegurar que todos los params se pasen
            const solicitud = solicitudes.find(s => s.id === solicitudId); // solicitudes debe ser global
            const estadoAnterior = solicitud ? solicitud.estado : 'Desconocido';
            
             // Similar al anterior, idealmente registrar después del éxito.
            const resultado = originalHandleActualizarEstadoConUsuario.apply(this, arguments);

            if (resultado && typeof resultado.then === 'function') {
                resultado.then(() => {
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
                            usuario: user ? user.displayName : 'Desconocido'
                        }
                    );
                }).catch(err => { /* Manejar error */ });
            } else {
                registrarEvento(
                    TIPO_EVENTO.ACTUALIZAR,
                    ENTIDAD.SOLICITUD,
                    solicitudId,
                    'Intento de actualización de estado',
                    { 
                        notaVenta: solicitud ? solicitud.notaVenta : '',
                        estadoAnterior: estadoAnterior,
                        nuevoEstado: nuevoEstado,
                        observaciones: observaciones,
                        usuario: user ? user.displayName : 'Desconocido'
                    }
                );
            }
        };
    }
}


// Cargar registros de auditoría para el panel de administración
function cargarRegistrosAuditoria(limite = 100, filtros = {}) {
    return new Promise((resolve, reject) => {
        // mostrarSincronizacion('Cargando registros de auditoría...'); // Asumiendo que tienes esta función global
        
        let query = logsRef.orderByChild('fecha'); // Ordenar por fecha
        
        // Aplicar filtros si existen (Firebase tiene limitaciones para filtros complejos en el cliente)
        // Aquí se aplicarían filtros básicos si Firebase los soporta directamente con la estructura de datos.
        // Por ejemplo, si se indexa por 'tipo' o 'entidad'.
        // if (filtros.tipo) query = query.equalTo(filtros.tipo).orderByChild('tipo'); // Ejemplo, necesitaría índice
        
        query.limitToLast(limite).once('value') // Obtener los últimos N para luego invertir
            .then(snapshot => {
                let logs = [];
                snapshot.forEach(childSnapshot => {
                    const log = childSnapshot.val();
                    // log.key = childSnapshot.key; // El ID ya está en log.id
                    
                    // Aplicar filtros del lado del cliente si son más complejos
                    if (aplicarFiltrosManuales(log, filtros)) {
                        logs.push(log);
                    }
                });
                
                logs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar descendente (más recientes primero)
                
                // ocultarSincronizacion(); // Asumiendo que tienes esta función global
                resolve(logs);
            })
            .catch(error => {
                console.error('Error al cargar registros de auditoría:', error);
                // ocultarSincronizacion();
                reject(error);
            });
    });
}

// Aplicar filtros manualmente a un registro de auditoría
function aplicarFiltrosManuales(log, filtros) {
    if (!filtros || Object.keys(filtros).length === 0) {
        return true;
    }
    
    for (const campoFiltro in filtros) {
        const valorFiltro = filtros[campoFiltro];
        if (valorFiltro === null || valorFiltro === undefined || valorFiltro === '') continue;

        let valorLog;
        if (campoFiltro.startsWith('usuario.')) { // Filtrar por subpropiedades de usuario
            const subCampo = campoFiltro.split('.')[1];
            valorLog = log.usuario ? log.usuario[subCampo] : undefined;
        } else {
            valorLog = log[campoFiltro];
        }

        if (campoFiltro === 'fechaDesde') {
            if (new Date(log.fecha) < new Date(valorFiltro)) return false;
            continue;
        }
        if (campoFiltro === 'fechaHasta') {
            const fechaHastaAjustada = new Date(valorFiltro);
            fechaHastaAjustada.setHours(23, 59, 59, 999);
            if (new Date(log.fecha) > fechaHastaAjustada) return false;
            continue;
        }
        
        if (valorLog === undefined) return false;

        if (typeof valorLog === 'string' && typeof valorFiltro === 'string') {
            if (!valorLog.toLowerCase().includes(valorFiltro.toLowerCase())) return false;
        } else if (valorLog !== valorFiltro) {
            return false;
        }
    }
    return true;
}

// Mostrar los logs en una tabla
function mostrarTablaLogs(logs, contenedor) {
    if (!contenedor) {
        console.error('No se especificó un contenedor para la tabla de logs');
        return;
    }
    contenedor.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        contenedor.innerHTML = `<div class="alert alert-info text-center"><i class="fas fa-info-circle me-2"></i>No hay registros de auditoría que mostrar.</div>`;
        return;
    }
    
    const tabla = document.createElement('table');
    tabla.className = 'table table-sm table-hover table-striped align-middle';
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
    
    const tbody = document.createElement('tbody');
    logs.forEach(log => {
        const tr = document.createElement('tr');
        let tipoHTML = log.tipo;
        switch (log.tipo) {
            case TIPO_EVENTO.ERROR: tr.classList.add('table-danger'); tipoHTML = `<span class="badge bg-danger">${log.tipo}</span>`; break;
            case TIPO_EVENTO.CREAR: tr.classList.add('table-success'); tipoHTML = `<span class="badge bg-success">${log.tipo}</span>`; break;
            case TIPO_EVENTO.ELIMINAR: tr.classList.add('table-warning'); tipoHTML = `<span class="badge bg-danger">${log.tipo}</span>`; break; // Peligro es más visual para eliminar
            case TIPO_EVENTO.LOGIN: tipoHTML = `<span class="badge bg-primary">${log.tipo}</span>`; break;
            case TIPO_EVENTO.LOGOUT: tipoHTML = `<span class="badge bg-secondary">${log.tipo}</span>`; break;
            case TIPO_EVENTO.ACTUALIZAR: tipoHTML = `<span class="badge bg-info text-dark">${log.tipo}</span>`; break;
            case TIPO_EVENTO.EXPORTAR: tipoHTML = `<span class="badge bg-warning text-dark">${log.tipo}</span>`; break;
            case TIPO_EVENTO.VER: tipoHTML = `<span class="badge bg-light text-dark">${log.tipo}</span>`; break;
            default: tipoHTML = `<span class="badge bg-dark">${log.tipo}</span>`;
        }
        
        const fecha = new Date(log.fecha);
        const fechaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
        
        let detallesHTML = '';
        if (log.detalles && Object.keys(log.detalles).length > 0) {
            detallesHTML = `<button class="btn btn-sm btn-outline-secondary ver-detalles-log" data-log-id="${log.id}"><i class="fas fa-search"></i></button>`;
        }
        
        tr.innerHTML = `
            <td>${fechaFormateada}</td>
            <td>${log.usuario ? log.usuario.displayName : 'Sistema'} <small class="text-muted">(${log.usuario ? log.usuario.role : 'sistema'})</small></td>
            <td>${tipoHTML}</td>
            <td>${log.entidad}${log.entidadId ? ` <small class="text-muted">#${log.entidadId.substring(0, 6)}...</small>` : ''}</td>
            <td>${log.descripcion}</td>
            <td class="text-center">${detallesHTML}</td>
        `;
        tbody.appendChild(tr);
    });
    
    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);
    
    document.querySelectorAll('.ver-detalles-log').forEach(btn => {
        btn.addEventListener('click', function() {
            const logId = this.getAttribute('data-log-id');
            const logSeleccionado = logs.find(l => l.id === logId);
            if (logSeleccionado) {
                 mostrarDetallesLog(logSeleccionado);
                 // Asegurarse que el modal exista y se muestre con Bootstrap
                 const modalEl = document.getElementById('detalles-log-modal');
                 if (modalEl) {
                     let modalInstance = bootstrap.Modal.getInstance(modalEl);
                     if (!modalInstance) {
                         modalInstance = new bootstrap.Modal(modalEl);
                     }
                     modalInstance.show();
                 }
            }
        });
    });
}

// Mostrar detalles de un log en el modal
function mostrarDetallesLog(log) {
    if (!log) return;
    const modalBody = document.getElementById('detalles-log-modal-body');
    if (!modalBody) return;
    
    const fecha = new Date(log.fecha);
    const fechaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
    const detallesFormateados = log.detalles ? JSON.stringify(log.detalles, null, 2) : 'No hay detalles adicionales';
    
    modalBody.innerHTML = `
        <dl class="row">
            <dt class="col-sm-3">ID Log:</dt><dd class="col-sm-9">${log.id}</dd>
            <dt class="col-sm-3">Fecha:</dt><dd class="col-sm-9">${fechaFormateada}</dd>
            <dt class="col-sm-3">Usuario:</dt><dd class="col-sm-9">${log.usuario ? log.usuario.displayName : 'Sistema'} (${log.usuario ? log.usuario.role : 'sistema'})</dd>
            <dt class="col-sm-3">Tipo Evento:</dt><dd class="col-sm-9">${log.tipo}</dd>
            <dt class="col-sm-3">Entidad:</dt><dd class="col-sm-9">${log.entidad}</dd>
            <dt class="col-sm-3">ID Entidad:</dt><dd class="col-sm-9">${log.entidadId || 'N/A'}</dd>
            <dt class="col-sm-3">Descripción:</dt><dd class="col-sm-9">${log.descripcion}</dd>
            <dt class="col-sm-3">URL:</dt><dd class="col-sm-9"><small>${log.url}</small></dd>
        </dl>
        <h6>Detalles Específicos:</h6>
        <pre class="bg-light p-2 rounded small">${detallesFormateados}</pre>
        <h6>User Agent:</h6>
        <pre class="bg-light p-2 rounded small">${log.userAgent}</pre>
    `;
    // El título del modal se actualiza o se puede dejar genérico
}

// Exportar logs a CSV
function exportarLogsCSV(logs) {
    if (!logs || logs.length === 0) {
        // mostrarAlerta('No hay registros para exportar', 'warning'); // Asumiendo que tienes esta función global
        console.warn('No hay registros de auditoría para exportar');
        return;
    }
    
    registrarEvento(
        TIPO_EVENTO.EXPORTAR,
        ENTIDAD.SISTEMA,
        null,
        'Exportación de logs de auditoría',
        { formato: 'CSV', cantidad: logs.length }
    );
    
    const headers = ['ID', 'Fecha', 'Tipo', 'Entidad', 'ID Entidad', 'Descripción', 'Usuario (Nombre)', 'Usuario (Username)', 'Usuario (Rol)', 'IP', 'URL', 'Detalles (JSON)'];
    const data = logs.map(log => [
        log.id,
        log.fecha,
        log.tipo,
        log.entidad,
        log.entidadId || '',
        log.descripcion,
        log.usuario ? log.usuario.displayName : 'Sistema',
        log.usuario ? log.usuario.username : 'sistema',
        log.usuario ? log.usuario.role : 'sistema',
        log.ip,
        log.url,
        log.detalles ? JSON.stringify(log.detalles) : ''
    ]);
    
    let csvContent = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    data.forEach(row => {
        csvContent += row.map(cell => {
            const cellString = cell === null || cell === undefined ? '' : String(cell);
            return `"${cellString.replace(/"/g, '""')}"`;
        }).join(',') + '\n';
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Añadir BOM para Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // mostrarAlerta('Registros exportados correctamente', 'success');
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

// Inicializar automáticamente si no se hace desde app.js o un punto central
// document.addEventListener('DOMContentLoaded', window.auditoria.init);
