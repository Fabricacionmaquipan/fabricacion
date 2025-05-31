// Script principal de la aplicación

// Variables globales
let solicitudes = [];
// Asumo que currentUser y currentRole se definen en auth.js o similar
// let currentUser = null;
// let currentRole = null;


// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

// Función de inicialización
function init() {
    mostrarSincronizacion('Conectando con la base de datos...');
    checkInternetConnection();

    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        solicitudes = data ? Object.values(data) : [];
        updateCurrentView();
        ocultarSincronizacion();
        if (window.isInitialLoad === false) { // Evitar en la primera carga
            mostrarAlerta('Datos actualizados desde la base.', 'info');
        }
        window.isInitialLoad = false;
    }, (error) => {
        console.error('Error al leer datos:', error);
        mostrarSincronizacion('Error al conectar. Reintentando...', true);
        setTimeout(reconnectToDatabase, 5000);
    });

    if (!checkExistingSession()) { // Asumo que esta función está en auth.js
        showLoginScreen(); // Asumo que esta función está en auth.js
    }

    setupEventListeners();
    setupUIComponents(); // Asumo que esta función existe
    initAuthSystem(); // Mover aquí para asegurar que los handlers se sobreescriban después de que el DOM esté listo.
}

function updateCurrentView() {
    if (typeof currentRole === 'undefined' || !currentRole) {
        console.log("Rol no definido, no se puede actualizar la vista.");
        return;
    }
    if (currentRole === 'bodega' && typeof cargarDatosBodega === 'function') {
        cargarDatosBodega();
    } else if (currentRole === 'fabricacion' && typeof cargarDatosFabricacion === 'function') {
        cargarDatosFabricacion();
    } else if (currentRole === 'admin' && typeof cargarDatosAdmin === 'function') {
        cargarDatosAdmin();
        if (typeof window.userManagement !== 'undefined' && typeof window.userManagement.setupUsersListeners === 'function') {
            window.userManagement.setupUsersListeners();
        }
    }
}

function checkInternetConnection() {
    if (!navigator.onLine) {
        mostrarAlerta('Sin conexión a internet.', 'warning');
    }
    window.addEventListener('online', () => {
        mostrarAlerta('Conexión restablecida.', 'success');
        reconnectToDatabase();
    });
    window.addEventListener('offline', () => mostrarAlerta('Conexión perdida.', 'warning'));
}

function reconnectToDatabase() {
    mostrarSincronizacion('Reconectando...');
    solicitudesRef.off(); // Limpiar listeners antiguos
    solicitudesRef.on('value', (snapshot) => { // Re-establecer listener principal
        const data = snapshot.val();
        solicitudes = data ? Object.values(data) : [];
        updateCurrentView();
        ocultarSincronizacion();
        if (window.isInitialLoad === false) {
             mostrarAlerta('Datos actualizados desde la base.', 'info');
        }
         window.isInitialLoad = false;
    }, (error) => {
        console.error('Error al reconectar:', error);
        mostrarSincronizacion('Error al reconectar. Reintentando...', true);
        setTimeout(reconnectToDatabase, 10000);
    });
}

function setupEventListeners() {
    if (typeof setupAuthListeners === 'function') setupAuthListeners();
    if (typeof setupBodegaListeners === 'function') setupBodegaListeners();
    if (typeof setupFabricacionListeners === 'function') setupFabricacionListeners();
    if (typeof setupAdminListeners === 'function') setupAdminListeners();
    if (typeof setupModalsListeners === 'function') setupModalsListeners(); // Llama al setup de modals.js

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'q' && currentRole && typeof handleLogout === 'function') {
            e.preventDefault();
            handleLogout();
        }
        if (e.ctrlKey && e.key === 'd') { // Ejemplo para tema oscuro
            e.preventDefault();
            // toggleDarkMode(); // Si tienes esta función
        }
    });

    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser && typeof getCurrentUser === 'function') currentUser = getCurrentUser(); // Asegurar que currentUser esté actualizado
            if (!currentUser) {
                mostrarAlerta('Debes iniciar sesión para enviar solicitudes.', 'warning');
                return;
            }
            handleNuevaSolicitudConUsuario(e, currentUser); // Ya estaba, parece bien
        });
    }
}

function handleNuevaSolicitudConUsuario(e, user) {
    const notaVenta = document.getElementById('nota-venta').value;
    const fechaSolicitud = new Date().toISOString().split('T')[0]; // Usar fecha actual ISO
    document.getElementById('fecha-solicitud').value = fechaSolicitud;

    const items = [];
    const productosInputs = document.querySelectorAll('#items-container .item-row input[name="producto[]"]');
    const cantidadesInputs = document.querySelectorAll('#items-container .item-row input[name="cantidad[]"]');
    const skuInputs = document.querySelectorAll('#items-container .item-row input[name="sku[]"]');


    for (let i = 0; i < productosInputs.length; i++) {
        const producto = productosInputs[i].value.trim();
        const cantidad = parseInt(cantidadesInputs[i].value);
        const sku = skuInputs[i] ? skuInputs[i].value.trim() : null; // Capturar SKU

        if (producto && !isNaN(cantidad) && cantidad > 0) {
            items.push({ sku: sku, producto: producto, cantidad: cantidad });
        }
    }

    if (items.length === 0) {
        mostrarAlerta('Debe agregar al menos un producto.', 'warning');
        return;
    }

    mostrarSincronizacion('Creando solicitud...');
    const nuevaSolicitudId = Date.now().toString(); // Usar un ID más estándar
    const nuevaSolicitud = {
        id: nuevaSolicitudId,
        notaVenta: notaVenta,
        cliente: document.getElementById('cliente').value || '', // Asegurar que se guarda
        local: document.getElementById('local').value || '',   // Asegurar que se guarda
        fechaSolicitud: fechaSolicitud,
        estado: 'Solicitud enviada por bodega',
        observaciones: '', // Puedes añadir un campo de observaciones iniciales si quieres
        items: items,
        creadoPor: {
            userId: user.id,
            username: user.username,
            displayName: user.displayName
        },
        historial: [{
            fecha: new Date().toISOString(),
            estado: 'Solicitud enviada por bodega',
            observaciones: 'Solicitud creada.',
            usuario: user.displayName,
            userId: user.id
        }]
    };

    solicitudesRef.child(nuevaSolicitudId).set(nuevaSolicitud)
        .then(() => {
            document.getElementById('nueva-solicitud-form').reset();
            const itemsContainer = document.getElementById('items-container');
            while (itemsContainer.children.length > 1) { // Dejar solo la primera fila de item
                itemsContainer.removeChild(itemsContainer.lastChild);
            }
            itemsContainer.querySelector('input[name="sku[]"]').value = ''; // Limpiar SKU también
            itemsContainer.querySelector('input[name="producto[]"]').value = '';
            itemsContainer.querySelector('input[name="cantidad[]"]').value = '';

            if (typeof setFechaActual === 'function') setFechaActual(); // Si tienes esta función para la fecha
            if (typeof currentPageBodega !== 'undefined') currentPageBodega = 1;
            
            mostrarAlerta('Solicitud creada correctamente.', 'success');
            ocultarSincronizacion();
            if (window.innerWidth < 768) {
                const formCollapse = bootstrap.Collapse.getInstance(document.getElementById('nueva-solicitud-container'));
                if (formCollapse) formCollapse.hide();
            }
        })
        .catch(error => {
            console.error('Error al guardar la solicitud:', error);
            mostrarAlerta('Error al crear la solicitud: ' + error.message, 'danger');
            ocultarSincronizacion();
        });
}

// ESTA ES LA FUNCIÓN CLAVE MODIFICADA Y SU MANEJADOR DE FORMULARIO
function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada = null, fechaEntrega = null) {
    const solicitud = solicitudes.find(s => s.id === solicitudId);

    if (solicitud) {
        try {
            mostrarSincronizacion('Actualizando estado...');

            if (!user || !user.id) { // Asegurar que el usuario sea válido
                console.warn("Usuario no definido o sin ID, usando usuario de respaldo.");
                user = { id: 'sistema_' + Date.now(), displayName: 'Sistema (error user)' };
            }

            const solicitudActualizada = { ...solicitud }; // Copia superficial, cuidado con historial si es muy profundo
            solicitudActualizada.estado = nuevoEstado;
            solicitudActualizada.observaciones = observaciones; // Actualizar observaciones generales de la solicitud

            const nuevoItemHistorial = {
                fecha: new Date().toISOString(),
                estado: nuevoEstado,
                observaciones: observaciones, // Observaciones específicas de este cambio de estado
                usuario: user.displayName || 'Usuario del sistema',
                userId: user.id
            };

            // Lógica de fechas
            if (nuevoEstado === 'En fabricación') {
                if (fechaEstimada) {
                    solicitudActualizada.fechaEstimada = fechaEstimada;
                    nuevoItemHistorial.fechaEstimada = fechaEstimada;
                } else {
                    // Si es 'En fabricación' y no se provee fecha, se podría eliminar o dejar como estaba.
                    // Por consistencia, si no hay fechaEstimada, no la ponemos o la eliminamos.
                    delete solicitudActualizada.fechaEstimada; // o solicitudActualizada.fechaEstimada = null;
                }
                // Asegurar que la fecha de entrega real se limpie
                delete solicitudActualizada.fechaEntrega; // o solicitudActualizada.fechaEntrega = null;
                delete nuevoItemHistorial.fechaEntrega;

            } else if (nuevoEstado === 'Entregado') {
                if (fechaEstimada) { // Mantener la fecha estimada si se proveyó
                    solicitudActualizada.fechaEstimada = fechaEstimada;
                    nuevoItemHistorial.fechaEstimada = fechaEstimada;
                }
                // Para 'Entregado', la fecha de entrega es crucial
                solicitudActualizada.fechaEntrega = fechaEntrega || new Date().toISOString().split('T')[0]; // Usar la provista o hoy
                nuevoItemHistorial.fechaEntrega = solicitudActualizada.fechaEntrega;

            } else { // Para otros estados como 'Solicitud enviada por bodega'
                delete solicitudActualizada.fechaEstimada;
                delete nuevoItemHistorial.fechaEstimada;
                delete solicitudActualizada.fechaEntrega;
                delete nuevoItemHistorial.fechaEntrega;
            }

            solicitudActualizada.historial = [...(solicitud.historial || []), nuevoItemHistorial]; // Asegurar que historial exista

            console.log("Guardando actualización en Firebase:", solicitudActualizada);

            solicitudesRef.child(solicitudId).update(solicitudActualizada)
                .then(() => {
                    const modalElement = document.getElementById('actualizar-estado-modal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                    // La limpieza del backdrop y body la maneja el evento 'hidden.bs.modal' en modals.js
                    mostrarAlerta('Estado actualizado correctamente.', 'success');
                    ocultarSincronizacion();
                    // updateCurrentView(); // Se actualiza automáticamente por el listener de Firebase

                    // --- INICIO DE LA MODIFICACIÓN CON CONSOLE.LOGS ---
                    if (nuevoEstado === 'En fabricación') {
                        console.log('Estado cambiado a "En fabricación". Intentando generar PDF para solicitud ID:', solicitudId); // LOG AÑADIDO
                        if (typeof generarPDFEntrega === 'function') {
                            console.log('Llamando a generarPDFEntrega directamente.'); // LOG AÑADIDO
                            generarPDFEntrega(solicitudId);
                        } else if (typeof window.generarPDFEntrega === 'function') { 
                            console.log('Llamando a window.generarPDFEntrega.'); // LOG AÑADIDO
                            window.generarPDFEntrega(solicitudId);
                        } else {
                            console.warn('La función generarPDFEntrega no está disponible globalmente.');
                            mostrarAlerta('Estado actualizado, pero no se pudo generar el PDF automáticamente.', 'warning');
                        }
                    }
                    // --- FIN DE LA MODIFICACIÓN ---
                })
                .catch(error => {
                    console.error('Error al actualizar el estado en Firebase:', error);
                    mostrarAlerta('Error al actualizar: ' + error.message, 'danger');
                    ocultarSincronizacion();
                });
        } catch (error) {
            console.error('Error en handleActualizarEstadoConUsuario:', error);
            mostrarAlerta('Error procesando la actualización: ' + error.message, 'danger');
            ocultarSincronizacion();
        }
    } else {
        mostrarAlerta('No se encontró la solicitud para actualizar.', 'danger');
        ocultarSincronizacion();
    }
}

// Sobrescribir el manejador de actualización de estado para incluir al usuario y las fechas
function overrideUpdateHandlers() {
    const actualizarEstadoForm = document.getElementById('actualizar-estado-form');

    if (actualizarEstadoForm) {
        // Remover cualquier listener previo para evitar duplicados si initAuthSystem se llama más de una vez
        // Esto requiere guardar una referencia al handler si se quiere remover específicamente.
        // Una forma más simple es clonar y reemplazar el nodo, pero tiene otras implicaciones.
        // Por ahora, asumimos que se configura una vez.

        actualizarEstadoForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevenir el envío tradicional del formulario
            event.stopPropagation(); // Detener la propagación para evitar que otros listeners (como el de modals.js) se ejecuten

            if (!currentUser && typeof getCurrentUser === 'function') currentUser = getCurrentUser();
            if (!currentUser) {
                mostrarAlerta('Debes iniciar sesión para actualizar estados.', 'warning');
                return;
            }

            const solicitudId = document.getElementById('solicitud-id').value;
            const nuevoEstado = document.getElementById('nuevo-estado').value;
            const observaciones = document.getElementById('observaciones').value;

            // Obtener las fechas DEL MODAL
            let fechaEstimadaModal = null;
            let fechaEntregaModal = null;

            const fechaEstimadaInput = document.getElementById('fecha-estimada');
            const fechaEntregaInput = document.getElementById('fecha-entrega');

            // Verificar si los campos de fecha son visibles antes de tomar sus valores
            // (offsetParent es null si el elemento o un ancestro está display:none)
            if (fechaEstimadaInput && fechaEstimadaInput.offsetParent !== null) {
                fechaEstimadaModal = fechaEstimadaInput.value;
            }
            if (fechaEntregaInput && fechaEntregaInput.offsetParent !== null) {
                fechaEntregaModal = fechaEntregaInput.value;
            }
            
            console.log(`Datos para actualizar: ID=${solicitudId}, Estado=${nuevoEstado}, Obs=${observaciones}, User=${currentUser.displayName}, Est=${fechaEstimadaModal}, Ent=${fechaEntregaModal}`);
            handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, currentUser, fechaEstimadaModal, fechaEntregaModal);
        }, true); // Fase de captura para asegurar que este listener se ejecute primero o en lugar del de modals.js
    }
}

function initAuthSystem() {
    overrideUpdateHandlers();
    // Otras inicializaciones de autenticación
}

// Hacer global la función de manejo de cambio de página si es necesario en otros scripts no modulares
if (typeof window.handlePageChange === 'undefined') {
    window.handlePageChange = function(newPage, panelName) {
        // Esta es una implementación genérica, asegúrate que coincida con tus variables de paginación
        if (panelName === 'bodega' && typeof currentPageBodega !== 'undefined') {
            currentPageBodega = newPage;
            if (typeof cargarDatosBodega === 'function') cargarDatosBodega();
        } else if (panelName === 'fabricacion' && typeof currentPageFabricacion !== 'undefined') {
            currentPageFabricacion = newPage;
            if (typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
        } else if (panelName === 'admin' && typeof currentPageAdmin !== 'undefined') {
            currentPageAdmin = newPage;
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
        } else if (panelName === 'admin_repuestos' && typeof currentPageRepuestos !== 'undefined') { // Ejemplo para repuestos
            currentPageRepuestos = newPage;
            if (typeof cargarRepuestos === 'function') cargarRepuestos();
        }
    };
}

// Asegurarse que currentUser y currentRole se actualizan correctamente al iniciar/cerrar sesión.
// Estas funciones usualmente estarían en auth.js
// Ejemplo:
// window.setCurrentUser = (user) => { currentUser = user; };
// window.setCurrentRole = (role) => { currentRole = role; };
// window.getCurrentUser = () => currentUser;
