// Script principal de la aplicación

// Variables globales
let solicitudes = []; // Este array se llenará desde Firebase
// currentRole y currentUser se asume que son definidos y actualizados por auth.js
// y están disponibles globalmente (ej. window.currentRole, window.currentUser)
// Si no, deben obtenerse a través de funciones de auth.js (ej. window.authModule.getCurrentUser())

// Función de inicialización principal
function initApp() {
    // Asegurarse que las funciones de utils.js están disponibles
    // Es mejor si utils.js se carga primero, así que estas verificaciones son más una salvaguarda.
    if (typeof window.utils === 'undefined' || typeof window.utils.mostrarSincronizacion !== 'function') {
        console.error("Modulo utils.js no está completamente cargado o disponible. Funcionalidad limitada.");
        alert("Error crítico: Las utilidades base de la aplicación no pudieron cargarse. Por favor, recargue la página.");
        return; // Detener la inicialización si las utilidades no están.
    }

    window.utils.mostrarSincronizacion('Conectando con la base de datos...');
    checkInternetConnection(); // Función definida abajo

    // Asegurarse que solicitudesRef (de config.js) esté definido
    if (typeof solicitudesRef === 'undefined') {
        console.error("solicitudesRef (Firebase Database reference) no está definido. Revisa config.js.");
        window.utils.mostrarSincronizacion('Error de configuración: No se puede conectar a Firebase.', true);
        return;
    }

    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("Datos crudos de Firebase:", data);
        solicitudes = data ? Object.values(data) : [];
        console.log("Array 'solicitudes' actualizado globalmente:", solicitudes);

        // Ordenar solicitudes globalmente por fecha de solicitud (más recientes primero)
        if (solicitudes.length > 0 && solicitudes[0].hasOwnProperty('fechaSolicitud')) {
            solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        }

        updateCurrentView(); // Actualiza la vista basada en el rol actual y los datos cargados
        window.utils.ocultarSincronizacion();

        // Evitar alerta en la carga inicial
        if (window.isInitialLoad === undefined) { // Marcar la carga inicial
            window.isInitialLoad = true;
        } else if (window.isInitialLoad) {
            window.isInitialLoad = false; // Ya no es la carga inicial
        } else {
            window.utils.mostrarAlerta('Datos actualizados desde el servidor.', 'info');
        }

    }, (error) => {
        console.error('Error al leer datos de Firebase:', error);
        window.utils.mostrarSincronizacion('Error al conectar con la base de datos. Reintentando...', true);
        setTimeout(reconnectToDatabase, 7000); // Aumentar tiempo de reintento
    });

    // Comprobar sesión existente (asumiendo que estas funciones vienen de auth.js)
    if (typeof window.authModule !== 'undefined' && typeof window.authModule.checkExistingSession === 'function') {
        if (!window.authModule.checkExistingSession()) {
            if (typeof window.authModule.showLoginScreen === 'function') window.authModule.showLoginScreen();
        }
    } else {
        console.warn("authModule o checkExistingSession no están definidos.");
        // Si no hay módulo de autenticación, podría mostrarse el login por defecto o un error.
    }

    setupBaseEventListeners(); // Listeners base de la aplicación
    if (typeof window.ui !== 'undefined' && typeof window.ui.setupUIComponents === 'function') {
        window.ui.setupUIComponents(); // De ui.js
    }
    if (typeof applyStoredTheme === 'function') applyStoredTheme(); // Si tienes theme
}

// Actualizar la vista actual según el rol
function updateCurrentView() {
    const role = (window.authModule && typeof window.authModule.getCurrentRole === 'function') ? window.authModule.getCurrentRole() : null;
    console.log("APP: Actualizando vista para rol:", role);

    if (role === 'bodega' && typeof cargarDatosBodega === 'function') {
        console.log("APP: Llamando a cargarDatosBodega");
        cargarDatosBodega();
    } else if (role === 'fabricacion' && typeof cargarDatosFabricacion === 'function') {
        console.log("APP: Llamando a cargarDatosFabricacion");
        cargarDatosFabricacion();
    } else if (role === 'admin') {
        if (typeof cargarDatosAdmin === 'function') { // Del admin.js unificado
            console.log("APP: Llamando a cargarDatosAdmin");
            cargarDatosAdmin();
        }
        // Aquí también se podrían inicializar o cargar datos de otras pestañas de admin si es necesario
    } else {
        console.log("APP: Rol no reconocido o función de carga de datos no disponible para el rol:", role);
    }
}

function checkInternetConnection() {
    if (!navigator.onLine) {
        window.utils.mostrarAlerta('Sin conexión a internet.', 'warning');
    }
    window.addEventListener('online', () => {
        window.utils.mostrarAlerta('Conexión restablecida.', 'success');
        reconnectToDatabase();
    });
    window.addEventListener('offline', () => window.utils.mostrarAlerta('Conexión perdida.', 'warning'));
}

function reconnectToDatabase() {
    if (typeof solicitudesRef === 'undefined') return;
    window.utils.mostrarSincronizacion('Reconectando a Firebase...');
    solicitudesRef.off(); // Desconectar listeners anteriores para evitar duplicados
    // Re-adjuntar el listener principal (esto es similar a re-llamar parte de initApp)
     solicitudesRef.on('value', (snapshot) => { /* ... misma lógica que en initApp ... */ }, (error) => { /* ... */ });
     // Sería mejor tener una función que solo re-adjunte el listener sin llamar a todo initApp.
     // Por ahora, una recarga forzada podría ser más simple si la reconexión es compleja.
     // O, mejor, hacer que initApp sea idempotente y se pueda llamar de nuevo.
     console.log("Intento de reconexión. Si persiste, recargar la página podría ser necesario.");
}


// Configurar los escuchadores de eventos base de la aplicación
function setupBaseEventListeners() {
    // Inicializar listeners de módulos específicos (asegurándose que las funciones existen)
    if (typeof window.authModule !== 'undefined' && typeof window.authModule.setupAuthListeners === 'function') window.authModule.setupAuthListeners();
    if (typeof setupBodegaListeners === 'function') setupBodegaListeners(); // De bodega.js
    if (typeof setupFabricacionListeners === 'function') setupFabricacionListeners(); // De fabricacion.js
    if (typeof setupAdminListeners === 'function') setupAdminListeners(); // De admin.js (unificado)
    if (typeof setupModalsListeners === 'function') setupModalsListeners(); // De modals.js

    document.addEventListener('keydown', (e) => {
        const userRole = (window.authModule && typeof window.authModule.getCurrentRole === 'function') ? window.authModule.getCurrentRole() : null;
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            if (userRole && window.authModule && typeof window.authModule.handleLogout === 'function') {
                window.authModule.handleLogout();
            }
        }
        // if (e.ctrlKey && e.key === 'd') { // Si implementas toggleDarkMode
        //     e.preventDefault();
        //     if (typeof toggleDarkMode === 'function') toggleDarkMode();
        // }
    });

    // Listener para el formulario de nueva solicitud (PRINCIPAL PUNTO DE CREACIÓN)
    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        // Remover cualquier listener previo para evitar duplicados si setupBaseEventListeners se llama más de una vez
        // Es mejor asegurar que setupBaseEventListeners se llame solo una vez en initApp.
        nuevaSolicitudForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const currentUser = (window.authModule && typeof window.authModule.getCurrentUser === 'function') ? window.authModule.getCurrentUser() : null;
            if (!currentUser) {
                window.utils.mostrarAlerta('Debe iniciar sesión para enviar solicitudes.', 'warning');
                return;
            }
            handleNuevaSolicitudConUsuario(currentUser); // Pasar el usuario actual
        });
    }
}


/**
 * Maneja la creación y guardado de una nueva solicitud.
 * @param {object} user - El objeto del usuario actual (debe tener id/uid y displayName).
 */
function handleNuevaSolicitudConUsuario(user) {
    const notaVentaInput = document.getElementById('nota-venta');
    const clienteInput = document.getElementById('cliente');
    const localInput = document.getElementById('local');
    const fechaSolicitudInput = document.getElementById('fecha-solicitud');

    const notaVenta = notaVentaInput ? notaVentaInput.value.trim() : '';
    const cliente = clienteInput ? clienteInput.value.trim() : '';
    const local = localInput ? localInput.value.trim() : '';
    let fechaSolicitud = fechaSolicitudInput ? fechaSolicitudInput.value : '';

    if (!fechaSolicitud) { // Si bodega.js no la puso, la generamos aquí
        const hoy = new Date();
        fechaSolicitud = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }

    const items = [];
    const itemRows = document.querySelectorAll('#items-container .item-row');
    itemRows.forEach(row => {
        const skuInput = row.querySelector('.sku-input');
        const productoInput = row.querySelector('.producto-input');
        const cantidadInput = row.querySelector('input[name="cantidad[]"]');
        if (productoInput && productoInput.value.trim() && cantidadInput && parseInt(cantidadInput.value) > 0) {
            items.push({
                sku: skuInput ? skuInput.value.trim() : '',
                producto: productoInput.value.trim(),
                cantidad: parseInt(cantidadInput.value)
            });
        }
    });

    if (items.length === 0) {
        window.utils.mostrarAlerta('Debe agregar al menos un producto a la solicitud.', 'warning');
        return;
    }
    if (!notaVenta) { // Validación básica
        window.utils.mostrarAlerta('El campo "Nota de Venta" es obligatorio.', 'warning');
        notaVentaInput.focus();
        return;
    }


    window.utils.mostrarSincronizacion('Creando solicitud...');

    const nuevoIdSolicitud = window.utils.generarIdSolicitud(); // Usar la función de utils.js

    const nuevaSolicitudData = {
        id: nuevoIdSolicitud,
        notaVenta: notaVenta,
        fechaSolicitud: fechaSolicitud,
        cliente: cliente,
        local: local,
        estado: 'Solicitud enviada por bodega', // Estado inicial
        observaciones: '', // Puedes añadir un campo de observaciones si lo tienes
        items: items,
        creadoPor: {
            userId: user.id || user.uid || 'unknown_user_id', // Asegurar que el ID del usuario existe
            displayName: user.displayName || 'Usuario Desconocido'
        },
        historial: [{
            fecha: new Date().toISOString(),
            estado: 'Solicitud enviada por bodega',
            observaciones: 'Solicitud creada.',
            usuario: user.displayName || 'Usuario Desconocido',
            userId: user.id || user.uid || 'unknown_user_id'
        }],
        fechaEstimada: null, // Inicializar fechas estimadas/entrega
        fechaEntrega: null
    };

    console.log("Nueva solicitud a guardar:", nuevaSolicitudData);

    solicitudesRef.child(nuevoIdSolicitud).set(nuevaSolicitudData)
        .then(() => {
            document.getElementById('nueva-solicitud-form').reset();
            const itemsContainerEl = document.getElementById('items-container');
            if (itemsContainerEl) { // Limpiar items extras
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
            if (typeof setFechaActual === 'function') setFechaActual(); // De bodega.js, para resetear la fecha

            // La vista se actualizará por el listener de Firebase, no es necesario llamar a cargarDatosBodega() aquí.
            // if (typeof currentPageBodega !== 'undefined') currentPageBodega = 1;
            // if (typeof cargarDatosBodega === 'function') cargarDatosBodega();


            window.utils.mostrarAlerta(`Solicitud ${nuevoIdSolicitud} creada con éxito.`, 'success');
            window.utils.ocultarSincronizacion();

            // Opcional: colapsar el formulario en móviles
            const formContainer = document.getElementById('nueva-solicitud-container');
            if (formContainer && window.innerWidth < 768) {
                const bsCollapse = bootstrap.Collapse.getInstance(formContainer);
                if (bsCollapse) bsCollapse.hide();
            }
        })
        .catch(error => {
            console.error('Error al guardar la solicitud en Firebase:', error);
            window.utils.mostrarAlerta('Error al crear la solicitud: ' + error.message, 'danger');
            window.utils.ocultarSincronizacion();
        });
}


/**
 * Maneja la actualización del estado de una solicitud, incluyendo información del usuario.
 * Esta función es llamada desde modals.js.
 * @param {string} solicitudId
 * @param {string} nuevoEstado
 * @param {string} observaciones
 * @param {object} user - El objeto del usuario actual.
 * @param {string|null} fechaEstimada
 * @param {string|null} fechaEntrega
 */
function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada = null, fechaEntrega = null) {
    if (typeof solicitudes === 'undefined' || !Array.isArray(solicitudes)) {
        console.error("El array global 'solicitudes' no está disponible en handleActualizarEstadoConUsuario.");
        window.utils.mostrarAlerta('Error de datos: No se puede actualizar la solicitud.', 'danger');
        return;
    }
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (!solicitud) {
        window.utils.mostrarAlerta('Error: Solicitud no encontrada para actualizar.', 'danger');
        return;
    }
    if (!user || (!user.id && !user.uid)) { // Asegurar que el objeto user y su id/uid son válidos
        console.warn("Usuario no válido en handleActualizarEstadoConUsuario, usando datos de sistema.");
        user = { id: 'sistema', uid: 'sistema', displayName: 'Sistema' };
    }

    window.utils.mostrarSincronizacion('Actualizando estado de la solicitud...');

    const solicitudActualizada = { ...solicitud };
    solicitudActualizada.estado = nuevoEstado;
    solicitudActualizada.observaciones = observaciones || solicitudActualizada.observaciones || ''; // Mantener observaciones si no se proveen nuevas

    // Lógica de fechas
    if (nuevoEstado === 'En fabricación') {
        solicitudActualizada.fechaEstimada = fechaEstimada || null;
        delete solicitudActualizada.fechaEntrega; // Borrar fecha de entrega si se vuelve a este estado
    } else if (nuevoEstado === 'Entregado') {
        solicitudActualizada.fechaEstimada = fechaEstimada || solicitudActualizada.fechaEstimada || null; // Mantener si ya existía
        solicitudActualizada.fechaEntrega = fechaEntrega || new Date().toISOString().split('T')[0]; // Fecha actual si no se provee
    } else { // Para otros estados, como "Solicitud enviada por bodega"
        delete solicitudActualizada.fechaEstimada;
        delete solicitudActualizada.fechaEntrega;
    }

    solicitudActualizada.historial = Array.isArray(solicitud.historial) ? [...solicitud.historial] : [];
    solicitudActualizada.historial.push({
        fecha: new Date().toISOString(),
        estado: nuevoEstado,
        observaciones: observaciones || '',
        usuario: user.displayName,
        userId: user.id || user.uid,
        fechaEstimada: nuevoEstado === 'En fabricación' || nuevoEstado === 'Entregado' ? (fechaEstimada || null) : null,
        fechaEntrega: nuevoEstado === 'Entregado' ? (fechaEntrega || new Date().toISOString().split('T')[0]) : null
    });

    console.log("Actualizando solicitud en Firebase:", solicitudActualizada);
    solicitudesRef.child(solicitudId).update(solicitudActualizada)
        .then(() => {
            const modalEl = document.getElementById('actualizar-estado-modal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
                // El evento 'hidden.bs.modal' en modals.js debería limpiar el backdrop
            }
            window.utils.mostrarAlerta('Estado actualizado correctamente.', 'success');
            window.utils.ocultarSincronizacion();
            // La vista se actualiza por el listener de Firebase
        })
        .catch(error => {
            console.error('Error al actualizar estado en Firebase:', error);
            window.utils.mostrarAlerta('Error al actualizar estado: ' + error.message, 'danger');
            window.utils.ocultarSincronizacion();
        });
}

// La función overrideUpdateHandlers podría no ser necesaria si modals.js
// ya está configurado para llamar a handleActualizarEstadoConUsuario (pasándole el currentUser).
// Es mejor tener una sola cadena de llamadas para evitar confusión.

// Si toggleDarkMode y applyStoredTheme se van a usar, deben estar definidas.
// function toggleDarkMode() { /* ... */ }
// function applyStoredTheme() { /* ... */ }

// Inicializar el sistema de autenticación si existe
// y otros listeners que dependen del DOM pero no de datos de Firebase.
function initSecondarySystems() {
    if (typeof window.authModule !== 'undefined' && typeof window.authModule.initAuthSystem === 'function') {
        window.authModule.initAuthSystem(); // Asumiendo que authModule tiene su propia inicialización
    } else {
        console.warn("authModule o initAuthSystem no definidos.");
    }
    // Aplicar tema si la función existe
    if (typeof applyStoredTheme === 'function') applyStoredTheme();
}


// Asegurarse que initApp se llama después de que el DOM esté listo.
document.addEventListener('DOMContentLoaded', initApp);
// initSecondarySystems podría llamarse también aquí o dentro de initApp al final.
document.addEventListener('DOMContentLoaded', initSecondarySystems);


// Exponer funciones que podrían ser llamadas desde el HTML (onclick) o módulos que no importan explícitamente
window.handlePageChange = handlePageChange;
// La siguiente es crucial si modals.js la va a llamar y no puede acceder a currentUser directamente
window.handleActualizarEstadoConUsuario = handleActualizarEstadoConUsuario;
