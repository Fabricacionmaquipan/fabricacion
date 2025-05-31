// Script principal de la aplicación

// Variables globales
let solicitudes = [];
// currentUser y currentRole se definen y actualizan en auth.js

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

// Función de inicialización
function init() {
    mostrarSincronizacion('Conectando con la base de datos...');
    checkInternetConnection(); // Verificar conexión a internet

    // Asegurarse que Firebase está inicializado antes de usarlo
    if (typeof firebase !== 'undefined' && firebase.app()) {
        const solicitudesRef = firebase.database().ref('solicitudes'); // Definir aquí si es local a init
        solicitudesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            // Asegurar IDs y que 'solicitudes' sea siempre un array
            if (data) {
                solicitudes = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                solicitudes = [];
            }
            
            // Ordenar por fecha de solicitud descendente (más recientes primero)
            solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

            updateCurrentView();
            ocultarSincronizacion();
            if (window.isInitialLoad === false) { // Evitar en la primera carga
                mostrarAlerta('Datos actualizados desde la base.', 'info');
            }
            window.isInitialLoad = false; // Marcar que la carga inicial ha terminado
        }, (error) => {
            console.error('Error al leer datos de Firebase:', error);
            mostrarSincronizacion('Error al conectar. Reintentando...', true);
            setTimeout(() => reconnectToDatabase(solicitudesRef), 5000); // Pasar referencia
        });
    } else {
        console.error("Firebase no está inicializado. Las operaciones con la base de datos fallarán.");
        mostrarSincronizacion('Error: Firebase no configurado.', true);
        solicitudes = []; 
        updateCurrentView();
        ocultarSincronizacion();
    }


    if (!checkExistingSession()) { // auth.js
        showLoginScreen(); // auth.js
    }

    setupEventListeners();
    if (typeof setupUIComponents === 'function') setupUIComponents(); // Asumo que existe en ui.js o similar
    initAuthSystem(); // Llama a overrideUpdateHandlers entre otras cosas.
}

// NUEVO: Función para configurar la UI basada en el rol después de mostrar el panel principal
function configureAppForRole(role) {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');

    // Ocultar todos los paneles específicos primero por defecto
    if (bodegaPanel) bodegaPanel.style.display = 'none';
    if (fabricacionPanel) fabricacionPanel.style.display = 'none';
    // El adminPanel se gestiona según el rol

    if (role === 'visualizador') {
        // Asegurarse que solo el adminPanel (modificado) sea visible si es el panel del visualizador
        if (adminPanel) {
             // La visibilidad general del adminPanel la gestiona showPanel en auth.js
             // Aquí solo configuramos su contenido interno
            
            // Ocultar pestañas no deseadas para el visualizador
            const tabsToHide = [
                'usuarios-tab-item', 'repuestos-tab-item', 
                'dashboard-tab-item', 'reportes-tab-item', 'auditoria-tab-item'
            ];
            tabsToHide.forEach(tabId => {
                const tabItem = document.getElementById(tabId);
                if (tabItem) tabItem.style.display = 'none';
            });

            // Ocultar contenido de pestañas no deseadas (por si acaso)
            const tabContentsToHide = [
                'usuarios-content', 'repuestos-content',
                'dashboard-content', 'reportes-content', 'auditoria-content'
            ];
            tabContentsToHide.forEach(contentId => {
                const contentItem = document.getElementById(contentId);
                if (contentItem) {
                    contentItem.classList.remove('show', 'active');
                    // Podrías añadir contentItem.style.display = 'none'; si es necesario
                }
            });

            // Asegurar que la pestaña Solicitudes sea la activa y visible
            const solicitudesTabItem = document.getElementById('solicitudes-tab-item');
            const solicitudesTabButton = document.getElementById('solicitudes-tab');
            const solicitudesTabContent = document.getElementById('solicitudes-content');

            if (solicitudesTabItem) solicitudesTabItem.style.display = 'list-item'; // Asegurar que el <li> sea visible

            if (solicitudesTabButton && solicitudesTabContent) {
                // Quitar active de otras pestañas por si acaso
                document.querySelectorAll('#adminTabs .nav-link').forEach(t => {
                    if (t.id !== 'solicitudes-tab') {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    }
                });
                document.querySelectorAll('#adminTabContent .tab-pane').forEach(tc => {
                     if (tc.id !== 'solicitudes-content') {
                        tc.classList.remove('show', 'active');
                    }
                });

                solicitudesTabButton.classList.add('active');
                solicitudesTabButton.setAttribute('aria-selected', 'true');
                solicitudesTabContent.classList.add('show', 'active');
            } else {
                console.warn("No se encontró la pestaña de Solicitudes para el Visualizador.");
            }
            
            // Ocultar botones de acción en la pestaña Solicitudes para el Visualizador
            const btnGenerarEstadisticas = document.getElementById('btn-generar-estadisticas');
            const btnExportarSolicitudes = document.getElementById('btn-exportar-solicitudes');
            if (btnGenerarEstadisticas) btnGenerarEstadisticas.style.display = 'none';
            if (btnExportarSolicitudes) btnExportarSolicitudes.style.display = 'none';
        }
    } else if (role === 'admin') {
        // Asegurar que todas las pestañas de admin estén visibles para el admin
        const allAdminTabs = [
            'solicitudes-tab-item', 'usuarios-tab-item', 'repuestos-tab-item', 
            'dashboard-tab-item', 'reportes-tab-item', 'auditoria-tab-item'
        ];
        allAdminTabs.forEach(tabId => {
            const tabItem = document.getElementById(tabId);
            if (tabItem) tabItem.style.display = 'list-item'; // O el display original (e.g., 'flex', 'block')
        });
        // Y los botones de acción de Solicitudes
        const btnGenerarEstadisticas = document.getElementById('btn-generar-estadisticas');
        const btnExportarSolicitudes = document.getElementById('btn-exportar-solicitudes');
        // Usar el estilo de Bootstrap para mostrar/ocultar si es posible, o clases CSS
        if (btnGenerarEstadisticas) btnGenerarEstadisticas.style.display = ''; // Vacío para resetear a CSS default
        if (btnExportarSolicitudes) btnExportarSolicitudes.style.display = '';
    }
    // Para otros roles como 'bodega' o 'fabricacion', sus paneles específicos son manejados por showPanel en auth.js
}


function updateCurrentView() {
    if (typeof currentRole === 'undefined' || !currentRole) {
        // console.log("Rol no definido, no se puede actualizar la vista.");
        // Esto es normal en la pantalla de login.
        return;
    }

    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (!user && currentRole !== '') { 
        console.warn("Usuario actual no disponible en updateCurrentView, algunas funciones podrían fallar.");
    }
    
    switch (currentRole) {
        case 'bodega':
            if (typeof cargarDatosBodega === 'function') cargarDatosBodega();
            break;
        case 'fabricacion':
            if (typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
            break;
        case 'admin':
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
            // La configuración de tabs para admin se hace en configureAppForRole,
            // llamada desde showPanel en auth.js.
            // Si necesitas reinicializar componentes específicos del admin aquí:
            // if (typeof window.adminRepuestos !== 'undefined' && typeof window.adminRepuestos.initAdminRepuestos === 'function') {
            //     window.adminRepuestos.initAdminRepuestos(); // Ejemplo
            // }
            break;
        case 'visualizador':
            if (typeof cargarDatosAdmin === 'function') {
                cargarDatosAdmin(); // Carga los datos de solicitudes que el visualizador puede ver
            }
            // La configuración específica de la UI (ocultar botones/tabs) se hace en configureAppForRole
            // que es llamado por showPanel en auth.js después de que este panel se muestra.
            break;
        default:
            console.log("Rol no reconocido en updateCurrentView:", currentRole);
            break;
    }
    // No es necesario llamar a configureAppForRole aquí usualmente, 
    // ya que showPanel (en auth.js) lo hace después de mostrar el panel correcto.
}


function checkInternetConnection() {
    if (!navigator.onLine) {
        mostrarAlerta('Sin conexión a internet.', 'warning');
    }
    window.addEventListener('online', () => {
        mostrarAlerta('Conexión restablecida.', 'success');
        if (typeof firebase !== 'undefined' && firebase.app()) {
            const solicitudesRef = firebase.database().ref('solicitudes');
            reconnectToDatabase(solicitudesRef);
        }
    });
    window.addEventListener('offline', () => mostrarAlerta('Conexión perdida.', 'warning'));
}

function reconnectToDatabase(ref) { // ref es solicitudesRef
    if (!ref) {
        console.error("Referencia a Firebase no válida para reconectar.");
        mostrarSincronizacion('Error crítico: no se puede reconectar.', true);
        return;
    }
    mostrarSincronizacion('Reconectando...');
    ref.off(); 
    ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            solicitudes = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            solicitudes = [];
        }
        solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        updateCurrentView();
        ocultarSincronizacion();
        if (window.isInitialLoad === false) {
             mostrarAlerta('Datos actualizados desde la base.', 'info');
        }
        window.isInitialLoad = false;
    }, (error) => {
        console.error('Error al reconectar:', error);
        mostrarSincronizacion('Error al reconectar. Reintentando...', true);
        setTimeout(() => reconnectToDatabase(ref), 10000);
    });
}

function setupEventListeners() {
    if (typeof setupAuthListeners === 'function') setupAuthListeners(); // auth.js
    if (typeof setupBodegaListeners === 'function') setupBodegaListeners(); // bodega.js
    if (typeof setupFabricacionListeners === 'function') setupFabricacionListeners(); // fabricacion.js
    if (typeof setupAdminListeners === 'function') setupAdminListeners(); // admin.js
    if (typeof setupModalsListeners === 'function') setupModalsListeners(); // modals.js o similar

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'q' && currentRole && typeof handleLogout === 'function') {
            e.preventDefault();
            handleLogout(); // auth.js
        }
    });

    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = getCurrentUser(); // Asegurar que currentUser esté actualizado
            if (!user) {
                mostrarAlerta('Debes iniciar sesión para enviar solicitudes.', 'warning');
                return;
            }
            // MODIFICADO: Chequeo de rol antes de la acción
            if (user.role === 'visualizador') {
                mostrarAlerta('No tienes permisos para crear solicitudes.', 'danger');
                return;
            }
            handleNuevaSolicitudConUsuario(e, user);
        });
    }
}

// MODIFICADO: Chequeo de rol antes de la acción
function handleNuevaSolicitudConUsuario(e, user) {
    // Asegurar que el rol visualizador no pueda ejecutar esta acción
    if (user.role === 'visualizador') {
        mostrarAlerta('Acción no permitida para tu rol.', 'danger');
        return;
    }

    const notaVenta = document.getElementById('nota-venta').value;
    // Asegurar que la fecha se tome correctamente, incluso si el campo está deshabilitado o no editable.
    let fechaSolicitud = document.getElementById('fecha-solicitud').value;
    if (!fechaSolicitud) { // Si está vacío o no se pudo leer (ej. por readonly), usar la actual.
        fechaSolicitud = new Date().toISOString().split('T')[0];
        document.getElementById('fecha-solicitud').value = fechaSolicitud; // Actualizar el campo si estaba vacío
    }


    const items = [];
    const itemRows = document.querySelectorAll('#items-container .item-row');
    itemRows.forEach(row => {
        const skuInput = row.querySelector('input[name="sku[]"]');
        const productoInput = row.querySelector('input[name="producto[]"]');
        const cantidadInput = row.querySelector('input[name="cantidad[]"]');

        const sku = skuInput ? skuInput.value.trim() : '';
        const producto = productoInput ? productoInput.value.trim() : '';
        const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 0;

        if (producto && !isNaN(cantidad) && cantidad > 0) {
            items.push({ sku: sku, producto: producto, cantidad: cantidad });
        }
    });

    if (items.length === 0) {
        mostrarAlerta('Debe agregar al menos un producto.', 'warning');
        return;
    }

    mostrarSincronizacion('Creando solicitud...');
    // Usar Firebase para generar un ID único para la nueva solicitud
    const nuevaSolicitudId = firebase.database().ref().child('solicitudes').push().key; 
    
    const nuevaSolicitud = {
        id: nuevaSolicitudId, // Usar el ID generado por Firebase
        notaVenta: notaVenta,
        cliente: document.getElementById('cliente').value || '',
        local: document.getElementById('local').value || '',
        fechaSolicitud: fechaSolicitud,
        estado: 'Solicitud enviada por bodega',
        observaciones: '',
        items: items,
        creadoPor: { 
            userId: user.username, 
            displayName: user.displayName,
            role: user.role
        },
        historial: [{
            fecha: new Date().toISOString(),
            estado: 'Solicitud enviada por bodega',
            observaciones: 'Solicitud creada.',
            usuario: user.displayName,
            userId: user.username 
        }]
    };

    firebase.database().ref('solicitudes/' + nuevaSolicitudId).set(nuevaSolicitud)
        .then(() => {
            document.getElementById('nueva-solicitud-form').reset();
            const itemsContainer = document.getElementById('items-container');
            while (itemsContainer.children.length > 1) {
                itemsContainer.removeChild(itemsContainer.lastChild);
            }
            const firstItemRow = itemsContainer.querySelector('.item-row');
            if (firstItemRow) {
                const skuInput = firstItemRow.querySelector('input[name="sku[]"]');
                const productoInput = firstItemRow.querySelector('input[name="producto[]"]');
                const cantidadInput = firstItemRow.querySelector('input[name="cantidad[]"]');
                if (skuInput) skuInput.value = '';
                if (productoInput) productoInput.value = '';
                if (cantidadInput) cantidadInput.value = '';
            }

            if (typeof setFechaActual === 'function') setFechaActual(); // bodega.js
            if (typeof currentPageBodega !== 'undefined') currentPageBodega = 1; // bodega.js
            
            mostrarAlerta('Solicitud creada correctamente.', 'success');
            ocultarSincronizacion();
            if (window.innerWidth < 768) { 
                const formCollapseElement = document.getElementById('nueva-solicitud-container');
                if (formCollapseElement) {
                    const formCollapse = bootstrap.Collapse.getInstance(formCollapseElement);
                    if (formCollapse) formCollapse.hide();
                }
            }
        })
        .catch(error => {
            console.error('Error al guardar la solicitud en Firebase:', error);
            mostrarAlerta('Error al crear la solicitud: ' + error.message, 'danger');
            ocultarSincronizacion();
        });
}


// MODIFICADO: Chequeo de rol antes de la acción
function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimada = null, fechaEntrega = null) {
    // Asegurar que el rol visualizador no pueda ejecutar esta acción
    if (user.role === 'visualizador') {
        mostrarAlerta('Acción no permitida para tu rol.', 'danger');
        const modalElement = document.getElementById('actualizar-estado-modal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }
        return;
    }

    const solicitudRef = firebase.database().ref('solicitudes/' + solicitudId);

    // Usar transaction para asegurar la atomicidad y evitar sobrescribir historial si hay concurrencia (opcional pero recomendado)
    solicitudRef.transaction(currentData => {
        if (currentData === null) {
            return undefined; // Abortar transacción si la solicitud no existe
        }

        // Si estamos aquí, la transacción está en progreso
        if (!currentData.historial) {
            currentData.historial = [];
        }

        currentData.estado = nuevoEstado;
        currentData.observaciones = observaciones; // Observaciones generales

        const nuevoItemHistorial = {
            fecha: new Date().toISOString(),
            estado: nuevoEstado,
            observaciones: observaciones, // Observaciones del cambio de estado
            usuario: user.displayName || 'Usuario del sistema',
            userId: user.username 
        };

        if (nuevoEstado === 'En fabricación') {
            if (fechaEstimada) {
                currentData.fechaEstimada = fechaEstimada;
                nuevoItemHistorial.fechaEstimada = fechaEstimada;
            } else {
                delete currentData.fechaEstimada; // o null
            }
            delete currentData.fechaEntrega; // o null
            delete nuevoItemHistorial.fechaEntrega;
        } else if (nuevoEstado === 'Entregado') {
            if (fechaEstimada) { // Mantener la fecha estimada si se proveyó
                currentData.fechaEstimada = fechaEstimada;
                nuevoItemHistorial.fechaEstimada = fechaEstimada;
            }
            currentData.fechaEntrega = fechaEntrega || new Date().toISOString().split('T')[0];
            nuevoItemHistorial.fechaEntrega = currentData.fechaEntrega;
        } else { // Para otros estados como 'Solicitud enviada por bodega'
            delete currentData.fechaEstimada;
            delete nuevoItemHistorial.fechaEstimada;
            delete currentData.fechaEntrega;
            delete nuevoItemHistorial.fechaEntrega;
        }

        currentData.historial.push(nuevoItemHistorial);
        return currentData; // Devolver los datos modificados para que Firebase los guarde
    })
    .then(result => {
        if (!result.committed) {
            mostrarAlerta('No se encontró la solicitud para actualizar o hubo un conflicto.', 'danger');
        } else {
            const modalElement = document.getElementById('actualizar-estado-modal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            mostrarAlerta('Estado actualizado correctamente.', 'success');
        }
        ocultarSincronizacion();
    })
    .catch(error => {
        console.error('Error en la transacción de Firebase:', error);
        mostrarAlerta('Error al actualizar: ' + error.message, 'danger');
        ocultarSincronizacion();
    });

    // mostrarSincronizacion() se llamaría antes de la transacción si fuera una operación larga síncrona,
    // pero como la transacción es asíncrona, es mejor manejarlo dentro de su lógica o al inicio.
    // Para este caso, una indicación al inicio del submit del formulario (en overrideUpdateHandlers) podría ser suficiente.
}


function overrideUpdateHandlers() {
    const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
    if (actualizarEstadoForm) {
        // Clonar y reemplazar para evitar múltiples listeners si se llama varias veces
        // Esta es una técnica, pero puede tener efectos secundarios.
        // Es más robusto guardar una referencia al handler y usar removeEventListener si es necesario.
        const newForm = actualizarEstadoForm.cloneNode(true);
        actualizarEstadoForm.parentNode.replaceChild(newForm, actualizarEstadoForm);

        newForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation(); // Detener otros listeners de submit en el mismo elemento

            const user = getCurrentUser();
            if (!user) {
                mostrarAlerta('Debes iniciar sesión para actualizar estados.', 'warning');
                return;
            }
            // MODIFICADO: Chequeo de rol antes de la acción
            if (user.role === 'visualizador') {
                mostrarAlerta('No tienes permisos para actualizar estados.', 'danger');
                 const modalElement = document.getElementById('actualizar-estado-modal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                }
                return;
            }
            
            mostrarSincronizacion('Actualizando estado...'); // Mostrar antes de llamar a la función asíncrona

            const solicitudId = newForm.querySelector('#solicitud-id').value;
            const nuevoEstado = newForm.querySelector('#nuevo-estado').value;
            const observaciones = newForm.querySelector('#observaciones').value;
            let fechaEstimadaModal = null;
            let fechaEntregaModal = null;

            const fechaEstimadaInput = newForm.querySelector('#fecha-estimada');
            const fechaEntregaInput = newForm.querySelector('#fecha-entrega');

            // Verificar si los campos de fecha son visibles (tienen un offsetParent)
            if (fechaEstimadaInput && fechaEstimadaInput.offsetParent !== null && fechaEstimadaInput.value) {
                fechaEstimadaModal = fechaEstimadaInput.value;
            }
            if (fechaEntregaInput && fechaEntregaInput.offsetParent !== null && fechaEntregaInput.value) {
                fechaEntregaModal = fechaEntregaInput.value;
            }
            
            handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user, fechaEstimadaModal, fechaEntregaModal);
        }, true); // Usar fase de captura si es necesario para asegurar precedencia, pero usualmente no es requerido si se limpia bien.
    }
}

function initAuthSystem() {
    overrideUpdateHandlers();
    // Otras inicializaciones de autenticación que puedan depender del DOM listo.
}

// Definición global de handlePageChange para ser accesible por otros módulos
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
            // Este 'admin' se refiere a la paginación de solicitudes en el panel de admin
            currentPageAdmin = newPage;
            if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
        } else if (panelName === 'admin_repuestos' && typeof currentPageRepuestos !== 'undefined') { 
            // Para la paginación de repuestos en el panel de admin
            currentPageRepuestos = newPage; 
            // Asumiendo que admin.js expone o tiene una función para cargar repuestos
            if (window.adminRepuestos && typeof window.adminRepuestos.cargarTablaRepuestos === 'function') {
                window.adminRepuestos.cargarTablaRepuestos();
            } else if (typeof cargarTablaRepuestos === 'function') { // Si es global en admin.js
                cargarTablaRepuestos();
            }
        }
        // Añadir más casos si hay más tablas paginadas en otros paneles/pestañas
    };
}
