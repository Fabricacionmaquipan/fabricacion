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
    
    // Comprobar si hay un rol guardado en localStorage
    const savedRole = localStorage.getItem('current_role');
    if (savedRole) {
        currentRole = savedRole;
        showPanel(currentRole);
    } else {
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
