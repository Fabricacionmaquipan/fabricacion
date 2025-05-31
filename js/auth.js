// Gestión de autenticación y roles con sistema de claves

// Variables y elementos DOM
let currentRole = '';
let currentUser = null;
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const roleSelect = document.getElementById('role-select');
const loginButton = document.getElementById('login-button');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userDisplayName = document.getElementById('user-display-name');
const userRoleDisplay = document.getElementById('user-role-display');

// Base de datos de usuarios (en producción esto estaría en Firebase)
// MODIFICADO: Nombres de usuario simplificados y añadido Visualizador
const usuarios = [
    { username: 'bodega', password: 'Bodega2025', role: 'bodega', displayName: 'Usuario Bodega' },
    { username: 'fabricacion', password: 'Pelaoyjoel', role: 'fabricacion', displayName: 'Usuario Fabricación' },
    { username: 'admin', password: 'Mono1700..', role: 'admin', displayName: 'Administrador' },
    // NUEVO: Usuario Visualizador
    { username: 'viewer', password: 'viewer123', role: 'visualizador', displayName: 'Usuario Visualizador' }
];

// Configurar event listeners relacionados con autenticación
function setupAuthListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (passwordInput) {
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    }
    if (roleSelect) {
        roleSelect.addEventListener('change', updateLoginForm);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function updateLoginForm() {
    const selectedRole = roleSelect.value;
    if (usernameInput) {
        switch (selectedRole) {
            case 'bodega':
                usernameInput.placeholder = 'Usuario de bodega';
                break;
            case 'fabricacion':
                usernameInput.placeholder = 'Usuario de fabricación';
                break;
            case 'admin':
                usernameInput.placeholder = 'Usuario administrador';
                break;
            // NUEVO: Placeholder para Visualizador
            case 'visualizador':
                usernameInput.placeholder = 'Usuario visualizador';
                break;
            default:
                usernameInput.placeholder = 'Nombre de usuario';
        }
    }
}

function handleLogin(e) {
    if (e) e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = roleSelect.value;
    
    if (!username || !password || !selectedRole) {
        if (!username) highlightInvalidField(usernameInput);
        if (!password) highlightInvalidField(passwordInput);
        if (!selectedRole) highlightInvalidField(roleSelect);
        mostrarAlerta('Por favor, completa todos los campos.', 'warning');
        return;
    }
    
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
    loginButton.disabled = true;
    
    setTimeout(() => {
        const usuario = usuarios.find(u => 
            u.username === username && 
            u.password === password && 
            u.role === selectedRole
        );
        
        if (usuario) {
            currentUser = usuario;
            currentRole = usuario.role;
            
            const sessionData = {
                username: usuario.username,
                role: usuario.role,
                displayName: usuario.displayName, // NUEVO: Guardar displayName en sesión
                lastLogin: new Date().toISOString()
            };
            localStorage.setItem('session_data', JSON.stringify(sessionData));
            
            showPanel(currentRole); // Esto llamará a configureAppForRole desde app.js
            
            mostrarAlerta(`Bienvenido, ${usuario.displayName}`, 'success');
        } else {
            loginButton.innerHTML = 'Ingresar <i class="fas fa-sign-in-alt ms-1"></i>';
            loginButton.disabled = false;
            highlightInvalidField(usernameInput);
            highlightInvalidField(passwordInput);
            highlightInvalidField(roleSelect);
            passwordInput.value = '';
            mostrarAlerta('Credenciales incorrectas. Por favor, verifica tu usuario, contraseña y rol.', 'danger');
        }
    }, 800);
}

function highlightInvalidField(field) {
    field.classList.add('is-invalid');
    setTimeout(() => {
        field.classList.remove('is-invalid');
    }, 3000);
}

function handleLogout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        currentUser = null;
        currentRole = '';
        localStorage.removeItem('session_data');
        if (loginForm) loginForm.reset();
        showLoginScreen();
        mostrarAlerta('Has cerrado sesión correctamente.', 'info');
    }
}

function checkExistingSession() {
    const sessionData = localStorage.getItem('session_data');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.username && session.role) {
                // MODIFICADO: Buscar usuario también por displayName si se guardó
                const usuario = usuarios.find(u => 
                    u.username === session.username && 
                    u.role === session.role &&
                    (session.displayName ? u.displayName === session.displayName : true) 
                );
                
                if (usuario) {
                    currentUser = usuario;
                    currentRole = usuario.role;
                    showPanel(currentRole); // Esto llamará a configureAppForRole
                    return true;
                } else {
                     // Si no se encuentra el usuario exacto (ej. displayName cambió o no estaba en sesión vieja)
                    // Tratar de encontrar solo por username y role para compatibilidad,
                    // pero idealmente forzar nuevo login si los datos no son consistentes.
                    const basicUser = usuarios.find(u => u.username === session.username && u.role === session.role);
                    if (basicUser) {
                         currentUser = basicUser;
                         currentRole = basicUser.role;
                         showPanel(currentRole);
                         return true;
                    }
                }
            }
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            localStorage.removeItem('session_data'); // Limpiar sesión corrupta
        }
    }
    return false;
}

function showLoginScreen() {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    if (bodegaPanel) fadeOut(bodegaPanel);
    if (fabricacionPanel) fadeOut(fabricacionPanel);
    if (adminPanel) fadeOut(adminPanel);
    
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    
    setTimeout(() => {
        if (loginScreen) {
            loginScreen.style.display = 'block';
            fadeIn(loginScreen);
        }
        if (usernameInput) {
             setTimeout(() => { usernameInput.focus(); }, 300);
        }
    }, 300);
}

// MODIFICADO: showPanel ahora llama a configureAppForRole (de app.js) para configurar la UI específica del rol
function showPanel(role) {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    if (loginScreen) fadeOut(loginScreen);
    
    if (logoutBtn) logoutBtn.style.display = 'flex'; // Cambiado a flex para alinear con el original
    if (userInfo) userInfo.style.display = 'block'; // O 'flex' si es necesario para su layout
    
    if (currentUser && userDisplayName) userDisplayName.textContent = currentUser.displayName;
    if (userRoleDisplay) userRoleDisplay.textContent = getRoleName(role);
    
    if (loginButton) {
        loginButton.innerHTML = 'Ingresar <i class="fas fa-sign-in-alt ms-1"></i>';
        loginButton.disabled = false;
    }
    
    // Ocultar todos los paneles principales primero
    if (bodegaPanel) bodegaPanel.style.display = 'none';
    if (fabricacionPanel) fabricacionPanel.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';

    setTimeout(() => {
        let panelToShow = null;
        switch (role) {
            case 'bodega':
                panelToShow = bodegaPanel;
                if (typeof cargarDatosBodega === 'function') cargarDatosBodega();
                break;
            case 'fabricacion':
                panelToShow = fabricacionPanel;
                if (typeof cargarDatosFabricacion === 'function') cargarDatosFabricacion();
                break;
            case 'admin':
                panelToShow = adminPanel;
                if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
                break;
            // NUEVO: Caso para Visualizador
            case 'visualizador':
                panelToShow = adminPanel; // El visualizador verá una versión del panel de admin
                if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin(); // Carga los datos como admin
                break;
        }

        if (panelToShow) {
            panelToShow.style.display = 'block';
            fadeIn(panelToShow);
        }
        
        // NUEVO: Llamar a la función de configuración de UI específica del rol en app.js
        if (typeof configureAppForRole === 'function') {
            configureAppForRole(role);
        } else {
            console.warn("configureAppForRole no está definida en app.js. La UI específica del rol no se aplicará.");
        }

    }, 300);
}


// MODIFICADO: getRoleName para incluir Visualizador
function getRoleName(role) {
    switch (role) {
        case 'bodega': return 'Bodega';
        case 'fabricacion': return 'Fabricación';
        case 'admin': return 'Administrador';
        // NUEVO: Nombre para Visualizador
        case 'visualizador': return 'Visualizador';
        default: return 'Usuario';
    }
}

function fadeIn(element) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

function fadeOut(element) {
    if (!element) return;
    element.style.opacity = '1';
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.display = 'none';
    }, 300);
}

function getCurrentUser() {
    return currentUser;
}

// MODIFICADO: hasPermission para el rol Visualizador
function hasPermission(action) {
    if (!currentUser) return false;
    
    // Para el rol 'visualizador', negamos explícitamente la mayoría de las acciones.
    // Solo permitimos acciones de 'ver'.
    if (currentUser.role === 'visualizador') {
        const visualizadorPermissions = [
            'ver_solicitudes_admin', // Permiso para ver la tabla de solicitudes
            'ver_detalle_solicitud'  // Permiso para ver el modal de detalle
            // Podrías añadir 'ver_repuestos_admin' si decides mostrarles la tabla de repuestos
        ];
        return visualizadorPermissions.includes(action);
    }

    const permisos = {
        'bodega': ['crear_solicitud', 'ver_solicitudes_bodega', 'ver_detalle_solicitud'],
        'fabricacion': ['ver_solicitudes_fabricacion', 'cambiar_estado', 'ver_detalle_solicitud', 'descargar_pdf_entrega'],
        'admin': [
            'ver_solicitudes_admin', 'cambiar_estado', 'eliminar_solicitud', 
            'exportar_datos', 'ver_estadisticas', 'ver_detalle_solicitud',
            'gestionar_usuarios', 'gestionar_repuestos', 'ver_dashboard',
            'generar_reportes', 'ver_auditoria'
        ]
        // No es necesario listar explícitamente los permisos del visualizador aquí si se maneja arriba.
    };
    
    const permisosUsuario = permisos[currentUser.role] || [];
    return permisosUsuario.includes(action);
}

// Si setupAuthListeners() se llama desde app.js, no es necesario llamarlo aquí al final.
// document.addEventListener('DOMContentLoaded', setupAuthListeners);
