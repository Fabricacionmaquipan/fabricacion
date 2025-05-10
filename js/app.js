// Script principal de la aplicación

// Variables globales
let solicitudes = [];

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

// Función de inicialización
function init() {
    // Mostrar estado de sincronización
    mostrarSincronizacion('Conectando con la base de datos...');
    
    // Escuchar cambios en la base de datos
    solicitudesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            solicitudes = Object.values(data);
            
            // Actualizar la vista según el rol actual
            if (currentRole === 'bodega') {
                cargarDatosBodega();
            } else if (currentRole === 'fabricacion') {
                cargarDatosFabricacion();
            } else if (currentRole === 'admin') {
                cargarDatosAdmin();
            }
            
            ocultarSincronizacion();
        } else {
            solicitudes = [];
            ocultarSincronizacion();
        }
    }, (error) => {
        console.error('Error al leer datos:', error);
        mostrarSincronizacion('Error al conectar con la base de datos', true);
        setTimeout(ocultarSincronizacion, 3000);
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
}

// Configurar los escuchadores de eventos
function setupEventListeners() {
    // Configurar listeners específicos por módulo
    setupAuthListeners();
    setupBodegaListeners();
    setupModalsListeners();
}
