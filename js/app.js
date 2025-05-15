// Script principal de la aplicación

// Variables globales
let solicitudes = [];
// currentRole y currentUser se definen en auth.js, asegúrate que estén disponibles globalmente.
// Si no, necesitas una forma de acceder a ellos aquí, por ejemplo:
// let currentRole = window.authModule ? window.authModule.getCurrentRole() : null;
// let currentUser = window.authModule ? window.authModule.getCurrentUser() : null;
// O pásalos como parámetros donde sea necesario.

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

// Función de inicialización
function init() {
    // Asegurarse de que las funciones de utils.js estén disponibles
    if (typeof mostrarSincronizacion !== 'function' || typeof generarIdSolicitud !== 'function') {
        console.error("Funciones de utils.js no están disponibles. Verifica el orden de carga de scripts.");
        // Podrías mostrar un error al usuario o detener la inicialización.
        // Por ahora, solo un log.
    }

    mostrarSincronizacion('Conectando con la base de datos...');

    checkInternetConnection();

    // Asegúrate que solicitudesRef está definido (usualmente en config.js)
    if (typeof solicitudesRef === 'undefined') {
        console.error("solicitudesRef no está definido. Firebase no funcionará.");
        mostrarSincronizacion('Error de configuración: No se puede conectar a Firebase.', true);
        return;
    }

    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        solicitudes = data ? Object.values(data) : []; // Actualiza la variable global 'solicitudes'

        // Ordenar solicitudes globalmente aquí si siempre se desea ese orden
        if (solicitudes.length > 0 && solicitudes[0].hasOwnProperty('fechaSolicitud')) {
            solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        }

        updateCurrentView();
        ocultarSincronizacion();

        if (window.isInitialLoad !== false) {
            window.isInitialLoad = false;
        } else {
            if (typeof mostrarAlerta === 'function') mostrarAlerta('Datos actualizados correctamente', 'info');
        }
    }, (error) => {
        console.error('Error al leer datos:', error);
        mostrarSincronizacion('Error al conectar con la base de datos. Reintentando...', true);
        setTimeout(reconnectToDatabase, 5000);
    });

    if (typeof checkExistingSession === 'function' && !checkExistingSession()) {
        if (typeof showLoginScreen === 'function') showLoginScreen();
    }

    setupEventListeners();
    if (typeof setupUIComponents === 'function') setupUIComponents(); // De ui.js
}

// Actualizar la vista actual según el rol
function updateCurrentView() {
    const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null; // Obtener rol actual

    if (role === 'bodega' && typeof cargarDatosBodega === 'function') {
        cargarDatosBodega();
    } else if (role === 'fabricacion' && typeof cargarDatosFabricacion === 'function') {
        cargarDatosFabricacion();
    } else if (role === 'admin' && typeof cargarDatosAdmin === 'function') {
        cargarDatosAdmin();
        if (typeof window.userManagement !== 'undefined' && typeof window.userManagement.setupUsersListeners === 'function') {
            window.userManagement.setupUsersListeners();
        }
    }
}

// Verificar conexión a internet
function checkInternetConnection() {
    if (!navigator.onLine) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('No hay conexión a internet. Algunas funciones podrían no estar disponibles.', 'warning');
    }

    window.addEventListener('online', () => {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Conexión a internet restablecida.', 'success');
        reconnectToDatabase();
    });

    window.addEventListener('offline', () => {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Se ha perdido la conexión a internet.', 'warning');
    });
}

// Reconectar a la base de datos
function reconnectToDatabase() {
    if (typeof solicitudesRef === 'undefined') return;
    mostrarSincronizacion('Reconectando...');
    solicitudesRef.off();
    solicitudesRef.once('value')
        .then(() => init()) // Re-inicializa para re-adjuntar el listener 'on'
        .catch(error => {
            console.error('Error al reconectar:', error);
            mostrarSincronizacion('Error al conectar. Reintentando...', true);
            setTimeout(reconnectToDatabase, 10000);
        });
}

// Configurar los escuchadores de eventos
function setupEventListeners() {
    // Configurar listeners específicos por módulo
    if (typeof setupAuthListeners === 'function') setupAuthListeners();
    if (typeof setupBodegaListeners === 'function') setupBodegaListeners();
    if (typeof setupFabricacionListeners === 'function') setupFabricacionListeners();
    if (typeof setupAdminListeners === 'function') setupAdminListeners(); // Del admin.js unificado
    if (typeof setupModalsListeners === 'function') setupModalsListeners(); // Del modals.js que modificamos

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;
            if (role && typeof handleLogout === 'function') {
                handleLogout();
            }
        }
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (typeof toggleDarkMode === 'function') toggleDarkMode();
        }
    });

    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevenir el envío normal del formulario
            const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null; // Obtener usuario actual
            if (!user) {
                if (typeof mostrarAlerta === 'function') mostrarAlerta('Debes iniciar sesión para enviar solicitudes', 'warning');
                return;
            }
            // Llamar a nuestra función que maneja la creación con el usuario
            handleNuevaSolicitudConUsuario(user); // Pasamos el usuario directamente
        }, true); // Usar true para capturar el evento antes que otros listeners
    }
}

// Función global para manejar cambios de página en cualquier panel
// (Esta función ya estaba en tu app.js, la dejamos)
function handlePageChange(newPage, panelName) {
    // Asegúrate que currentPageBodega, etc., y cargarDatosBodega, etc., estén definidos
    // y sean accesibles (globales o dentro de un módulo)
    switch (panelName) {
        case 'bodega':
            if (typeof currentPageBodega !== 'undefined') currentPageBodega = newPage;
            if (typeof cargarDatosBodega === 'function') cargarDatosBodega();
            break;
        case 'fabricacion':
            if (typeof currentPageFabricacion !== 'undefined') currentPageFabricacion = newPage;
            if (typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
            break;
        case 'admin':
            if (typeof currentPageAdmin !== 'undefined') currentPageAdmin = newPage;
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
            break;
        // Considera añadir casos para 'productos' y 'repuestos' si tienen paginación propia
        case 'productos':
            if (typeof currentPageProductos !== 'undefined' && typeof cargarTablaProductos === 'function') { // del admin.js unificado
                currentPageProductos = newPage;
                cargarTablaProductos();
            }
            break;
        case 'repuestos':
             if (typeof currentPageRepuestos !== 'undefined' && typeof cargarTablaRepuestos === 'function') { // del admin.js unificado
                currentPageRepuestos = newPage;
                cargarTablaRepuestos();
            }
            break;
    }
}

// Manejar el envío de solicitud incluyendo información del usuario
function handleNuevaSolicitudConUsuario(user) { // Recibe el objeto 'user'
    // Obtener valores del formulario
    const notaVentaInput = document.getElementById('nota-venta');
    const clienteInput = document.getElementById('cliente');
    const localInput = document.getElementById('local');
    const fechaSolicitudInput = document.getElementById('fecha-solicitud'); // El campo de fecha

    const notaVenta = notaVentaInput ? notaVentaInput.value.trim() : '';
    const cliente = clienteInput ? clienteInput.value.trim() : '';
    const local = localInput ? localInput.value.trim() : '';

    // Usar la fecha del input (que bodega.js debería haber llenado con la actual)
    // o generar una nueva si está vacía.
    let fechaSolicitud;
    if (fechaSolicitudInput && fechaSolicitudInput.value) {
        fechaSolicitud = fechaSolicitudInput.value;
    } else {
        const fechaActual = new Date();
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        fechaSolicitud = `${año}-${mes}-${dia}`;
        if(fechaSolicitudInput) fechaSolicitudInput.value = fechaSolicitud; // Actualizar por si acaso
    }


    const items = [];
    const itemRows = document.querySelectorAll('#items-container .item-row');

    itemRows.forEach(row => {
        const skuInput = row.querySelector('.sku-input');
        const productoInput = row.querySelector('.producto-input');
        const cantidadInput = row.querySelector('input[name="cantidad[]"]');

        const producto = productoInput ? productoInput.value.trim() : '';
        const sku = skuInput ? skuInput.value.trim() : '';
        const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 0;

        if (producto && !isNaN(cantidad) && cantidad > 0) {
            items.push({
                sku: sku,
                producto: producto,
                cantidad: cantidad
            });
        }
    });

    if (items.length === 0) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Debe agregar al menos un producto.', 'warning');
        return;
    }

    if (typeof mostrarSincronizacion === 'function') mostrarSincronizacion('Creando solicitud...');

    // --- USO DE LA NUEVA FUNCIÓN DE utils.js ---
    const nuevoIdSolicitud = typeof generarIdSolicitud === 'function' ?
                                generarIdSolicitud() :
                                Date.now().toString(); // Fallback si generarIdSolicitud no está
    // --- FIN DEL CAMBIO ---

    const nuevaSolicitud = {
        id: nuevoIdSolicitud,
        notaVenta: notaVenta,
        fechaSolicitud: fechaSolicitud,
        cliente: cliente,
        local: local,
        estado: 'Solicitud enviada por bodega',
        observaciones: '', // Puedes añadir un campo si lo tienes en el form
        items: items,
        creadoPor: { // Usar el 'user' pasado a la función
            userId: user.id || user.uid || 'unknown_user', // Asegurar que hay un ID
            username: user.username || 'N/A',
            displayName: user.displayName || 'Usuario Desconocido'
        },
        historial: [
            {
                fecha: new Date().toISOString(),
                estado: 'Solicitud enviada por bodega',
                observaciones: 'Solicitud creada.',
                usuario: user.displayName || 'Usuario Desconocido',
                userId: user.id || user.uid || 'unknown_user'
            }
        ],
        fechaEstimada: null,
        fechaEntrega: null
    };

    try {
        if (typeof solicitudesRef === 'undefined') throw new Error("solicitudesRef no está definido.");

        solicitudesRef.child(nuevaSolicitud.id).set(nuevaSolicitud)
            .then(() => {
                const form = document.getElementById('nueva-solicitud-form');
                if (form) form.reset();

                const itemsContainerEl = document.getElementById('items-container');
                if (itemsContainerEl) {
                    while (itemsContainerEl.children.length > 1) {
                        const lastItemRow = itemsContainerEl.querySelector('.item-row:last-child');
                        if(lastItemRow && itemsContainerEl.children.length > 1) itemsContainerEl.removeChild(lastItemRow); else break;
                    }
                    const firstItemRow = itemsContainerEl.querySelector('.item-row');
                    if (firstItemRow) {
                        const firstSkuInput = firstItemRow.querySelector('.sku-input');
                        const firstProductInput = firstItemRow.querySelector('.producto-input');
                        const firstCantidadInput = firstItemRow.querySelector('input[name="cantidad[]"]');
                        if (firstSkuInput) firstSkuInput.value = '';
                        if (firstProductInput) firstProductInput.value = '';
                        if (firstCantidadInput) firstCantidadInput.value = '';
                    }
                }

                if (typeof setFechaActual === 'function') setFechaActual(); // De bodega.js

                if (typeof currentPageBodega !== 'undefined') currentPageBodega = 1;
                // No es necesario llamar a cargarDatosBodega() aquí,
                // el listener de 'solicitudesRef.on('value', ...)' en init() ya lo hará.

                if (typeof mostrarAlerta === 'function') mostrarAlerta('Solicitud creada correctamente. ID: ' + nuevaSolicitud.id, 'success');
                if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();

                if (window.innerWidth < 768) {
                    const nuevaSolicitudContainer = document.getElementById('nueva-solicitud-container');
                    if (nuevaSolicitudContainer) {
                        const bsCollapse = bootstrap.Collapse.getInstance(nuevaSolicitudContainer);
                        if (bsCollapse) bsCollapse.hide();
                    }
                }
            })
            .catch(error => {
                console.error('Error al guardar la solicitud:', error);
                if (typeof mostrarAlerta === 'function') mostrarAlerta('Error al crear la solicitud: ' + error.message, 'danger');
                if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
            });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Error al procesar la solicitud: ' + error.message, 'danger');
        if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
    }
}

// Manejar la actualización de estado incluyendo información del usuario actual
function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada = null, fechaEntrega = null) {
    // Asegurarse que 'solicitudes' (array global) está disponible
    if (typeof solicitudes === 'undefined' || !Array.isArray(solicitudes)) {
        console.error("El array global 'solicitudes' no está disponible.");
        if(typeof mostrarAlerta === 'function') mostrarAlerta('Error: No se pueden actualizar los datos de la solicitud.', 'danger');
        return;
    }

    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud) {
        try {
            if (typeof mostrarSincronizacion === 'function') mostrarSincronizacion('Actualizando estado...');

            if (!user || (!user.id && !user.uid)) { // uid es común en Firebase Auth
                console.warn("Usuario no definido o sin ID, usando usuario de respaldo");
                user = {
                    id: 'sistema_' + Date.now(), // ID único simple
                    uid: 'sistema_' + Date.now(),
                    displayName: 'Sistema'
                };
            }

            const solicitudActualizada = {...solicitud};
            solicitudActualizada.estado = nuevoEstado;
            solicitudActualizada.observaciones = observaciones || ''; // Asegurar que observaciones sea string

            // Actualizar fechas
            if (nuevoEstado === 'En fabricación') {
                solicitudActualizada.fechaEstimada = fechaEstimada || null;
                delete solicitudActualizada.fechaEntrega; // Limpiar fecha de entrega si se vuelve a poner en fabricación
            } else if (nuevoEstado === 'Entregado') {
                solicitudActualizada.fechaEstimada = fechaEstimada || solicitudActualizada.fechaEstimada || null; // Mantener si existe, sino null
                solicitudActualizada.fechaEntrega = fechaEntrega || new Date().toISOString().split('T')[0];
            } else { // Para otros estados, limpiar ambas fechas
                delete solicitudActualizada.fechaEstimada;
                delete solicitudActualizada.fechaEntrega;
            }

            // Asegurar que el historial existe
            if (!Array.isArray(solicitudActualizada.historial)) {
                solicitudActualizada.historial = [];
            }

            solicitudActualizada.historial.push({
                fecha: new Date().toISOString(),
                estado: nuevoEstado,
                observaciones: observaciones || '',
                usuario: user.displayName || 'Usuario del Sistema',
                userId: user.id || user.uid,
                fechaEstimada: fechaEstimada || null, // Guardar las fechas que se usaron para este cambio
                fechaEntrega: fechaEntrega || null
            });

            console.log("Guardando actualización:", solicitudActualizada);

            if (typeof solicitudesRef === 'undefined') throw new Error("solicitudesRef no está definido.");

            solicitudesRef.child(solicitudId).update(solicitudActualizada)
                .then(() => {
                    const modalEl = document.getElementById('actualizar-estado-modal');
                    if (modalEl) {
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                        // La limpieza del backdrop ya se maneja en el evento 'hidden.bs.modal' en modals.js
                    }
                    if (typeof mostrarAlerta === 'function') mostrarAlerta('Estado actualizado correctamente.', 'success');
                    if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
                    // La vista se actualizará automáticamente por el listener 'solicitudesRef.on('value', ...)'
                })
                .catch(error => {
                    console.error('Error al actualizar el estado:', error);
                    if (typeof mostrarAlerta === 'function') mostrarAlerta('Error al actualizar el estado: ' + error.message, 'danger');
                    if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
                });
        } catch (error) {
            console.error('Error al actualizar el estado (bloque try):', error);
            if (typeof mostrarAlerta === 'function') mostrarAlerta('Error al actualizar el estado: ' + error.message, 'danger');
            if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
        }
    } else {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('No se encontró la solicitud para actualizar.', 'danger');
        if (typeof ocultarSincronizacion === 'function') ocultarSincronizacion();
    }
}

// Sobrescribir el manejador de actualización de estado para incluir al usuario
// Esta función ya no es estrictamente necesaria si el listener en modals.js
// ya llama a handleActualizarEstadoConUsuario a través de una cadena de llamadas.
// Sin embargo, la mantenemos por si hay un listener directo en el formulario aquí.
function overrideUpdateHandlers() {
    const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
    if (actualizarEstadoForm) {
        // Remover cualquier listener previo para evitar duplicados si se llama varias veces initAuthSystem
        // Esto es un poco más complejo; lo ideal es que el listener se añada una sola vez.
        // Por ahora, asumimos que el listener en modals.js es el principal o que este se coordina.

        actualizarEstadoForm.addEventListener('submit', function(e) { // Este listener podría entrar en conflicto con el de modals.js
            e.preventDefault();
            console.log("Submit desde overrideUpdateHandlers en app.js"); // Para depurar cuál listener se activa
            const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!user) {
                if (typeof mostrarAlerta === 'function') mostrarAlerta('Debes iniciar sesión para actualizar estados', 'warning');
                return;
            }

            const solicitudId = document.getElementById('solicitud-id').value;
            const nuevoEstado = document.getElementById('nuevo-estado').value;
            const observaciones = document.getElementById('observaciones').value;
            const fechaEstimada = document.getElementById('fecha-estimada') ? document.getElementById('fecha-estimada').value : null;
            const fechaEntrega = document.getElementById('fecha-entrega') ? document.getElementById('fecha-entrega').value : null;

            handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada, fechaEntrega);
        }, true); // El true puede ser problemático si modals.js también tiene un listener.
    }
}


// Alternar entre tema claro y oscuro (para implementación futura)
function toggleDarkMode() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Tema claro activado', 'info');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Tema oscuro activado', 'info');
    }
}

// Aplicar el tema guardado (para implementación futura)
function applyStoredTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Inicializar el sistema de autenticación y sobreescribir handlers
function initAuthSystem() {
    // La lógica de overrideUpdateHandlers puede ser conflictiva si modals.js también
    // adjunta un listener al mismo formulario. Es mejor tener un único punto de verdad
    // para manejar el submit de ese formulario.
    // Considera si la lógica de `handleActualizarEstado` en modals.js debería llamar
    // directamente a `handleActualizarEstadoConUsuario` obteniendo el usuario actual.
    // overrideUpdateHandlers(); // Comentado temporalmente para evitar doble listener.

    // Otras inicializaciones relacionadas con autenticación
}

window.addEventListener('DOMContentLoaded', initAuthSystem);

// Hacer globales las funciones necesarias si son llamadas desde el HTML (onclick) o desde otros módulos sin import.
// Es mejor minimizar el uso de globales y usar módulos si es posible.
window.handlePageChange = handlePageChange; // Ya estaba
// Si 'handleActualizarEstadoConUsuario' es llamado desde modals.js (como parece ser el caso)
// y 'modals.js' no tiene acceso a 'currentUser', entonces 'handleActualizarEstadoConUsuario'
// debe obtener 'currentUser' por sí misma o recibirlo.
// Ya modificamos modals.js para que llame a esta función con el usuario.
