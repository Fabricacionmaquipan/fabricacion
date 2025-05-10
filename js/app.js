// Script principal de la aplicación

// Variables globales
let solicitudes = [];

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

// Función de inicialización
function init() {
    // Mostrar estado de sincronización
    mostrarSincronizacion('Conectando con la base de datos...');
    
    // Verificar conexión a internet
    checkInternetConnection();
    
    // Escuchar cambios en la base de datos
    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            solicitudes = Object.values(data);
            
            // Actualizar la vista según el rol actual
            updateCurrentView();
            
            ocultarSincronizacion();
            
            // Mostrar notificación solo si no es la carga inicial
            if (window.isInitialLoad !== false) {
                window.isInitialLoad = false;
            } else {
                mostrarAlerta('Datos actualizados correctamente', 'info');
            }
        } else {
            solicitudes = [];
            updateCurrentView();
            ocultarSincronizacion();
        }
    }, (error) => {
        console.error('Error al leer datos:', error);
        mostrarSincronizacion('Error al conectar con la base de datos. Reintentando...', true);
        
        // Reintentar la conexión después de un tiempo
        setTimeout(() => {
            reconnectToDatabase();
        }, 5000);
    });
    
    // Comprobar si hay una sesión activa
    if (!checkExistingSession()) {
        showLoginScreen();
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar componentes de UI
    setupUIComponents();
}

// Actualizar la vista actual según el rol
function updateCurrentView() {
    if (currentRole === 'bodega') {
        cargarDatosBodega();
    } else if (currentRole === 'fabricacion') {
        cargarDatosFabricacion();
    } else if (currentRole === 'admin') {
        cargarDatosAdmin();
        // También cargar usuarios si es admin
        if (typeof window.userManagement !== 'undefined') {
            window.userManagement.setupUsersListeners();
        }
    }
}

// Verificar conexión a internet
function checkInternetConnection() {
    if (!navigator.onLine) {
        mostrarAlerta('No hay conexión a internet. Algunas funciones podrían no estar disponibles.', 'warning');
    }
    
    // Escuchar cambios en la conexión
    window.addEventListener('online', () => {
        mostrarAlerta('Conexión a internet restablecida.', 'success');
        reconnectToDatabase();
    });
    
    window.addEventListener('offline', () => {
        mostrarAlerta('Se ha perdido la conexión a internet.', 'warning');
    });
}

// Reconectar a la base de datos
function reconnectToDatabase() {
    mostrarSincronizacion('Reconectando...');
    
    // Desconectar para limpiar escuchadores anteriores
    solicitudesRef.off();
    
    // Reintentar la conexión
    solicitudesRef.once('value')
        .then(() => {
            // Si tiene éxito, volver a añadir el escuchador permanente
            init();
        })
        .catch(error => {
            console.error('Error al reconectar:', error);
            mostrarSincronizacion('Error al conectar con la base de datos. Reintentando...', true);
            
            // Reintentar después de un tiempo más largo
            setTimeout(reconnectToDatabase, 10000);
        });
}

// Configurar los escuchadores de eventos
function setupEventListeners() {
    // Configurar listeners específicos por módulo
    setupAuthListeners();
    setupBodegaListeners();
    setupFabricacionListeners();
    setupAdminListeners();
    setupModalsListeners();
    
    // Escuchar eventos globales
    document.addEventListener('keydown', (e) => {
        // Atajo de teclado para cerrar sesión (Ctrl+Q)
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            if (currentRole) {
                handleLogout();
            }
        }
        
        // Atajo para alternar el tema (para implementación futura) (Ctrl+D)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
    });
    
    // Manejar envío de solicitudes con el usuario actual
    const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
    if (nuevaSolicitudForm) {
        // Sobrescribir el evento de envío de solicitud para incluir el usuario
        nuevaSolicitudForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                mostrarAlerta('Debes iniciar sesión para enviar solicitudes', 'warning');
                return;
            }
            
            // Llamar al manejador original pero incluir el usuario actual
            handleNuevaSolicitudConUsuario(e, currentUser);
        }, true); // Usar true para capturar el evento antes que otros listeners
    }
}

// Manejar el envío de solicitud incluyendo información del usuario
function handleNuevaSolicitudConUsuario(e, user) {
    // Obtener valores del formulario
    const notaVenta = document.getElementById('nota-venta').value;
    const fechaSolicitud = document.getElementById('fecha-solicitud').value;
    
    // Obtener productos y cantidades
    const productos = [];
    const cantidades = [];
    
    const productosInputs = document.querySelectorAll('input[name="producto[]"]');
    const cantidadesInputs = document.querySelectorAll('input[name="cantidad[]"]');
    
    for (let i = 0; i < productosInputs.length; i++) {
        const producto = productosInputs[i].value.trim();
        const cantidad = parseInt(cantidadesInputs[i].value);
        
        if (producto && !isNaN(cantidad) && cantidad > 0) {
            productos.push(producto);
            cantidades.push(cantidad);
        }
    }
    
    if (productos.length === 0) {
        mostrarAlerta('Debe agregar al menos un producto.', 'warning');
        return;
    }
    
    // Mostrar indicador de carga
    mostrarSincronizacion('Creando solicitud...');
    
    // Crear la nueva solicitud
    const nuevaSolicitud = {
        id: Date.now().toString(),
        notaVenta: notaVenta,
        fechaSolicitud: fechaSolicitud,
        estado: 'Solicitud enviada por bodega',
        observaciones: '',
        items: [],
        creadoPor: {
            userId: user.id,
            username: user.username,
            displayName: user.displayName
        },
        historial: [
            {
                fecha: new Date().toISOString(),
                estado: 'Solicitud enviada por bodega',
                observaciones: '',
                usuario: user.displayName,
                userId: user.id
            }
        ]
    };
    
    // Agregar los productos
    for (let i = 0; i < productos.length; i++) {
        nuevaSolicitud.items.push({
            producto: productos[i],
            cantidad: cantidades[i]
        });
    }
    
    try {
        // Guardar en Firebase
        solicitudesRef.child(nuevaSolicitud.id).set(nuevaSolicitud)
            .then(() => {
                // Limpiar el formulario
                document.getElementById('nueva-solicitud-form').reset();
                
                // Limpiar los items excepto el primero
                const items = document.querySelectorAll('.item-row');
                for (let i = 1; i < items.length; i++) {
                    items[i].remove();
                }
                
                // Restablecer el primer item
                const firstProductInput = document.querySelector('input[name="producto[]"]');
                const firstCantidadInput = document.querySelector('input[name="cantidad[]"]');
                if (firstProductInput) firstProductInput.value = '';
                if (firstCantidadInput) firstCantidadInput.value = '';
                
                mostrarAlerta('Solicitud creada correctamente.', 'success');
                ocultarSincronizacion();
                
                // Cerrar el formulario en móviles
                if (window.innerWidth < 768) {
                    const nuevaSolicitudContainer = document.getElementById('nueva-solicitud-container');
                    const bsCollapse = bootstrap.Collapse.getInstance(nuevaSolicitudContainer);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }
            })
            .catch(error => {
                console.error('Error al guardar la solicitud:', error);
                mostrarAlerta('Error al crear la solicitud. Por favor, inténtalo de nuevo.', 'danger');
                ocultarSincronizacion();
            });
    } catch (error) {
        console.error('Error al guardar la solicitud:', error);
        mostrarAlerta('Error al crear la solicitud. Por favor, inténtalo de nuevo.', 'danger');
        ocultarSincronizacion();
    }
}

// Manejar la actualización de estado incluyendo información del usuario actual
function handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, user) {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        try {
            mostrarSincronizacion('Actualizando estado...');
            
            // Crear una copia de la solicitud para actualizar
            const solicitudActualizada = {...solicitud};
            
            // Actualizar estado y observaciones
            solicitudActualizada.estado = nuevoEstado;
            solicitudActualizada.observaciones = observaciones;
            
            // Agregar al historial con información del usuario
            solicitudActualizada.historial.push({
                fecha: new Date().toISOString(),
                estado: nuevoEstado,
                observaciones: observaciones,
                usuario: user.displayName,
                userId: user.id
            });
            
            // Guardar en Firebase
            solicitudesRef.child(solicitudId).update(solicitudActualizada)
                .then(() => {
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('actualizar-estado-modal'));
                    if (modal) modal.hide();
                    
                    mostrarAlerta('Estado actualizado correctamente.', 'success');
                    ocultarSincronizacion();
                })
                .catch(error => {
                    console.error('Error al actualizar el estado:', error);
                    mostrarAlerta('Error al actualizar el estado. Por favor, inténtalo de nuevo.', 'danger');
                    ocultarSincronizacion();
                });
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            mostrarAlerta('Error al actualizar el estado. Por favor, inténtalo de nuevo.', 'danger');
            ocultarSincronizacion();
        }
    } else {
        mostrarAlerta('No se encontró la solicitud.', 'danger');
        ocultarSincronizacion();
    }
}

// Sobrescribir el manejador de actualización de estado para incluir al usuario
function overrideUpdateHandlers() {
    // Referencia al formulario de actualización de estado
    const actualizarEstadoForm = document.getElementById('actualizar-estado-form');
    
    if (actualizarEstadoForm) {
        // Sobrescribir el evento submit
        actualizarEstadoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                mostrarAlerta('Debes iniciar sesión para actualizar estados', 'warning');
                return;
            }
            
            const solicitudId = document.getElementById('solicitud-id').value;
            const nuevoEstado = document.getElementById('nuevo-estado').value;
            const observaciones = document.getElementById('observaciones').value;
            
            // Llamar a la función con el usuario actual
            handleActualizarEstadoConUsuario(solicitudId, nuevoEstado, observaciones, currentUser);
        }, true); // Usar true para capturar el evento antes que otros listeners
    }
}

// Alternar entre tema claro y oscuro (para implementación futura)
function toggleDarkMode() {
    const body = document.body;
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        mostrarAlerta('Tema claro activado', 'info');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        mostrarAlerta('Tema oscuro activado', 'info');
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
    // Sobrescribir los manejadores para incluir información de usuario
    overrideUpdateHandlers();
    
    // Otras inicializaciones relacionadas con autenticación
}

// Llamar a la inicialización del sistema de autenticación después del DOMContentLoaded
window.addEventListener('DOMContentLoaded', initAuthSystem);
