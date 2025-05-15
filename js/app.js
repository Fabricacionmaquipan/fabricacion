// Script principal de la aplicación

// Variables globales
let solicitudes = []; // Este array se llenará desde Firebase
// Se asume que window.authModule (de auth.js) expondrá:
// window.authModule.getCurrentUser()
// window.authModule.getCurrentRole()
// window.authModule.checkExistingSession()
// window.authModule.showLoginScreen()
// window.authModule.setupAuthListeners()
// window.authModule.handleLogout()

// Función de inicialización principal
function initApp() {
    // Es crucial que utils.js se cargue ANTES que app.js
    if (typeof mostrarSincronizacion !== 'function' || typeof generarIdSolicitud !== 'function') {
        console.error("Funciones de utils.js no están disponibles. Verifica el orden de carga de scripts en index.html.");
        alert("Error crítico: La aplicación no puede iniciarse correctamente. Faltan utilidades base. Por favor, recargue la página o contacte al administrador.");
        return;
    }

    mostrarSincronizacion('Conectando con la base de datos...');
    checkInternetConnection();

    if (typeof solicitudesRef === 'undefined') { // solicitudesRef debe venir de config.js
        console.error("Referencia a Firebase (solicitudesRef) no definida. Revisa config.js.");
        mostrarSincronizacion('Error de configuración: No se puede conectar a Firebase.', true);
        return;
    }

    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("APP.JS: Datos crudos de Firebase:", data);
        solicitudes = data ? Object.values(data) : [];
        console.log("APP.JS: Array 'solicitudes' actualizado globalmente:", solicitudes);

        if (solicitudes.length > 0 && solicitudes[0] && solicitudes[0].hasOwnProperty('fechaSolicitud')) {
            solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        }

        updateCurrentView();
        ocultarSincronizacion();

        if (window.isAppInitialLoad === undefined) {
            window.isAppInitialLoad = true;
        } else if (window.isAppInitialLoad) {
            window.isAppInitialLoad = false;
        } else {
            mostrarAlerta('Datos actualizados desde el servidor.', 'info');
        }
    }, (error) => {
        console.error('APP.JS: Error al leer datos de Firebase:', error);
        mostrarSincronizacion('Error al conectar. Reintentando...', true);
        setTimeout(reconnectToDatabase, 7000);
    });

    if (window.authModule && typeof window.authModule.checkExistingSession === 'function') {
        if (!window.authModule.checkExistingSession()) {
            if (typeof window.authModule.showLoginScreen === 'function') window.authModule.showLoginScreen();
        }
    } else {
        console.warn("authModule o sus funciones de sesión no están disponibles. Mostrando login por defecto.");
        const loginScreenEl = document.getElementById('login-screen');
        if (loginScreenEl) loginScreenEl.style.display = 'block';
    }

    setupBaseEventListeners();
    if (window.ui && typeof window.ui.setupUIComponents === 'function') { // Asumiendo que ui.js define window.ui
        window.ui.setupUIComponents();
    }
    if (typeof applyStoredTheme === 'function') applyStoredTheme(); // Si tienes theming
}

function updateCurrentView() {
    const role = (window.authModule && typeof window.authModule.getCurrentRole === 'function')
                    ? window.authModule.getCurrentRole()
                    : null;
    console.log("APP.JS: Actualizando vista para rol:", role);

    if (role === 'bodega' && typeof cargarDatosBodega === 'function') cargarDatosBodega();
    else if (role === 'fabricacion' && typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
    else if (role === 'admin') {
        if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
        // Otras inicializaciones específicas de admin pueden ir aquí
    } else if (role) { // Si hay rol pero no función de carga
        console.warn(`APP.JS: No hay función de carga de datos para el rol '${role}'.`);
    }
    // Si no hay rol (ej. pantalla de login), no se hace nada aquí.
}

function checkInternetConnection() {
    if (!navigator.onLine) mostrarAlerta('Sin conexión a internet.', 'warning');
    window.addEventListener('online', () => { mostrarAlerta('Conexión restablecida.', 'success'); reconnectToDatabase(); });
    window.addEventListener('offline', () => mostrarAlerta('Conexión perdida.', 'warning'));
}

function reconnectToDatabase() {
    if (typeof solicitudesRef === 'undefined') return;
    mostrarSincronizacion('Reconectando a Firebase...');
    solicitudesRef.off();
    // Re-ejecutar la parte de conexión de initApp o una función específica de reconexión
    initApp(); // Simplificado, pero podría ser más granular
    console.log("APP.JS: Intento de reconexión. Si persiste, recargar la página podría ser necesario.");
}

function setupBaseEventListeners() {
    if (window.authModule && typeof window.authModule.setupAuthListeners === 'function') window.authModule.setupAuthListeners();
    if (typeof setupBodegaListeners === 'function') setupBodegaListeners();
    if (typeof setupFabricacionListeners === 'function') setupFabricacionListeners();
    if (typeof setupAdminListeners === 'function') setupAdminListeners();
    if (typeof setupModalsListeners === 'function') setupModalsListeners();

    document.addEventListener('keydown', (e) => {
        const userIsLoggedIn = window.authModule && typeof window.authModule.getCurrentUser === 'function' && window.authModule.getCurrentUser();
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            if (userIsLoggedIn && window.authModule && typeof window.authModule.handleLogout === 'function') {
                window.authModule.handleLogout();
            }
        }
    });

    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const currentUser = (window.authModule && typeof window.authModule.getCurrentUser === 'function')
                                ? window.authModule.getCurrentUser()
                                : null;
            if (!currentUser) {
                mostrarAlerta('Debe iniciar sesión para enviar solicitudes.', 'warning');
                return;
            }
            handleNuevaSolicitudConUsuario(currentUser);
        });
    }
}

function handlePageChange(newPage, panelName) {
    // Implementación centralizada del cambio de página
    console.log(`APP.JS: Cambiando a página ${newPage} para panel ${panelName}`);
    switch (panelName) {
        case 'bodega':
            if (typeof currentPageBodega !== 'undefined') currentPageBodega = newPage;
            if (typeof cargarDatosBodega === 'function') cargarDatosBodega();
            break;
        case 'fabricacion':
            if (typeof currentPageFabricacion !== 'undefined') currentPageFabricacion = newPage;
            if (typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
            break;
        case 'admin': // Para la tabla principal de solicitudes en admin
            if (typeof currentPageAdmin !== 'undefined') currentPageAdmin = newPage;
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
            break;
        case 'productos': // Para la tabla de productos en admin
             if (typeof currentPageProductos !== 'undefined' && window.adminProductos && typeof window.adminProductos.cargarTablaProductos === 'function') {
                currentPageProductos = newPage;
                window.adminProductos.cargarTablaProductos();
            } else if (typeof currentPageProductos !== 'undefined' && typeof cargarTablaProductos === 'function') { // Si está en admin.js global
                 currentPageProductos = newPage;
                 cargarTablaProductos();
            }
            break;
        case 'repuestos': // Para la tabla de repuestos en admin
             if (typeof currentPageRepuestos !== 'undefined' && window.adminRepuestos && typeof window.adminRepuestos.cargarTablaRepuestos === 'function') {
                currentPageRepuestos = newPage;
                window.adminRepuestos.cargarTablaRepuestos();
            } else if (typeof currentPageRepuestos !== 'undefined' && typeof cargarTablaRepuestos === 'function') { // Si está en admin.js global
                 currentPageRepuestos = newPage;
                 cargarTablaRepuestos();
            }
            break;
        default:
            console.warn(`APP.JS: Panel desconocido para paginación: ${panelName}`);
    }
}
window.handlePageChange = handlePageChange; // Exponer globalmente

function handleNuevaSolicitudConUsuario(user) {
    const notaVentaInput = document.getElementById('nota-venta');
    const clienteInput = document.getElementById('cliente');
    const localInput = document.getElementById('local');
    const fechaSolicitudInput = document.getElementById('fecha-solicitud');

    const notaVenta = notaVentaInput ? notaVentaInput.value.trim() : '';
    const cliente = clienteInput ? clienteInput.value.trim() : '';
    const local = localInput ? localInput.value.trim() : '';
    let fechaSolicitud = fechaSolicitudInput ? fechaSolicitudInput.value : '';

    if (!fechaSolicitud) {
        const hoy = new Date();
        fechaSolicitud = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }

    const items = [];
    document.querySelectorAll('#items-container .item-row').forEach(row => {
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
        mostrarAlerta('Debe agregar al menos un producto.', 'warning');
        return;
    }
    if (!notaVenta) {
        mostrarAlerta('El campo "Nota de Venta" es obligatorio.', 'warning');
        if(notaVentaInput) notaVentaInput.focus();
        return;
    }

    mostrarSincronizacion('Creando solicitud...');
    const nuevoIdSolicitud = generarIdSolicitud(); // De utils.js

    const nuevaSolicitudData = {
        id: nuevoIdSolicitud,
        notaVenta: notaVenta,
        fechaSolicitud: fechaSolicitud,
        cliente: cliente,
        local: local,
        estado: 'Solicitud enviada por bodega',
        observaciones: document.getElementById('observaciones-bodega') ? document.getElementById('observaciones-bodega').value : '', // Asumiendo un campo de observaciones
        items: items,
        creadoPor: {
            userId: user.id || user.uid || 'system_user',
            displayName: user.displayName || 'Sistema'
        },
        historial: [{
            fecha: new Date().toISOString(),
            estado: 'Solicitud enviada por bodega',
            observaciones: 'Solicitud creada.',
            usuario: user.displayName || 'Sistema',
            userId: user.id || user.uid || 'system_user'
        }],
        fechaEstimada: null,
        fechaEntrega: null
    };

    console.log("APP.JS: Nueva solicitud a guardar:", nuevaSolicitudData);

    solicitudesRef.child(nuevoIdSolicitud).set(nuevaSolicitudData)
        .then(() => {
            document.getElementById('nueva-solicitud-form').reset();
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
            if (typeof setFechaActual === 'function') setFechaActual();

            mostrarAlerta(`Solicitud ${nuevoIdSolicitud} creada.`, 'success');
            ocultarSincronizacion();

            const formContainer = document.getElementById('nueva-solicitud-container');
            if (formContainer && window.innerWidth < 768 && bootstrap.Collapse.getInstance(formContainer)) {
                 bootstrap.Collapse.getInstance(formContainer).hide();
            }
        })
        .catch(error => {
            console.error('APP.JS: Error al guardar solicitud:', error);
            mostrarAlerta('Error al crear solicitud: ' + error.message, 'danger');
            ocultarSincronizacion();
        });
}

function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada = null, fechaEntrega = null) {
    if (typeof solicitudes === 'undefined' || !Array.isArray(solicitudes)) {
        mostrarAlerta('Error de datos: No se puede actualizar.', 'danger'); return;
    }
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (!solicitud) {
        mostrarAlerta('Error: Solicitud no encontrada.', 'danger'); return;
    }
    if (!user || (!user.id && !user.uid)) {
        user = { id: 'sistema', uid: 'sistema', displayName: 'Sistema (Error Sesión)' };
        console.warn("APP.JS: Usuario no válido en handleActualizarEstadoConUsuario, usando datos de sistema.");
    }

    mostrarSincronizacion('Actualizando estado...');

    const solicitudActualizada = { ...solicitud };
    solicitudActualizada.estado = nuevoEstado;
    solicitudActualizada.observaciones = observaciones || solicitudActualizada.observaciones || '';

    if (nuevoEstado === 'En fabricación') {
        solicitudActualizada.fechaEstimada = fechaEstimada || null;
        delete solicitudActualizada.fechaEntrega;
    } else if (nuevoEstado === 'Entregado') {
        solicitudActualizada.fechaEstimada = fechaEstimada || solicitudActualizada.fechaEstimada || null;
        solicitudActualizada.fechaEntrega = fechaEntrega || new Date().toISOString().split('T')[0];
    } else {
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
        fechaEstimada: (nuevoEstado === 'En fabricación' || nuevoEstado === 'Entregado') ? (fechaEstimada || null) : null,
        fechaEntrega: nuevoEstado === 'Entregado' ? (fechaEntrega || new Date().toISOString().split('T')[0]) : null
    });

    console.log("APP.JS: Actualizando solicitud en Firebase:", solicitudActualizada);
    solicitudesRef.child(solicitudId).update(solicitudActualizada)
        .then(() => {
            const modalEl = document.getElementById('actualizar-estado-modal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            mostrarAlerta('Estado actualizado.', 'success');
            ocultarSincronizacion();
        })
        .catch(error => {
            console.error('APP.JS: Error al actualizar estado en Firebase:', error);
            mostrarAlerta('Error al actualizar estado: ' + error.message, 'danger');
            ocultarSincronizacion();
        });
}
window.handleActualizarEstadoConUsuario = handleActualizarEstadoConUsuario; // Exponer globalmente

// Aplicar tema (si existe la función)
function applyStoredTheme() {
    // Implementación de tu theming aquí si la tienes
}

// Inicialización
document.addEventListener('DOMContentLoaded', initApp);
document.addEventListener('DOMContentLoaded', function() { // Para funciones que podrían no estar en authModule
    if (typeof window.authModule !== 'undefined' && typeof window.authModule.initAuthSystem === 'function') {
        window.authModule.initAuthSystem();
    } else if (typeof initAuthSystem === 'function') { // Si initAuthSystem es global
        initAuthSystem();
    }
    if (typeof applyStoredTheme === 'function') applyStoredTheme();
});
