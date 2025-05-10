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
const usuarios = [
    { username: 'bodega1', password: 'Bodega2025', role: 'bodega', displayName: 'Usuario Bodega' },
    { username: 'fabricacion1', password: 'Pelaoyjoel', role: 'fabricacion', displayName: 'Usuario Fabricación' },
    { username: 'admin1', password: 'Mono1700..', role: 'admin', displayName: 'Administrador' },
    // Puedes agregar más usuarios según sea necesario
];

// Configurar event listeners relacionados con autenticación
function setupAuthListeners() {
    // Evento de inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // También permitir iniciar sesión presionando Enter
    if (passwordInput) {
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    }
    
    // Cambiar campos requeridos según el rol seleccionado
    if (roleSelect) {
        roleSelect.addEventListener('change', updateLoginForm);
    }
    
    // Evento de cierre de sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Actualizar el formulario según el rol seleccionado
function updateLoginForm() {
    const selectedRole = roleSelect.value;
    
    // Mostrar pistas de campos según el rol
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
            default:
                usernameInput.placeholder = 'Nombre de usuario';
        }
    }
}

// Manejar el inicio de sesión
function handleLogin(e) {
    if (e) e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = roleSelect.value;
    
    // Validar que todos los campos estén completos
    if (!username || !password || !selectedRole) {
        if (!username) highlightInvalidField(usernameInput);
        if (!password) highlightInvalidField(passwordInput);
        if (!selectedRole) highlightInvalidField(roleSelect);
        
        mostrarAlerta('Por favor, completa todos los campos.', 'warning');
        return;
    }
    
    // Mostrar animación de carga
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
    loginButton.disabled = true;
    
    // Simular validación en el servidor
    setTimeout(() => {
        // Buscar usuario y validar credenciales
        const usuario = usuarios.find(u => 
            u.username === username && 
            u.password === password && 
            u.role === selectedRole
        );
        
        if (usuario) {
            // Iniciar sesión
            currentUser = usuario;
            currentRole = usuario.role;
            
            // Guardar en localStorage (solo el nombre de usuario y rol por seguridad)
            const sessionData = {
                username: usuario.username,
                role: usuario.role,
                lastLogin: new Date().toISOString()
            };
            localStorage.setItem('session_data', JSON.stringify(sessionData));
            
            // Mostrar panel correspondiente
            showPanel(currentRole);
            
            // Mostrar mensaje de bienvenida
            mostrarAlerta(`Bienvenido, ${usuario.displayName}`, 'success');
        } else {
            // Credenciales incorrectas
            loginButton.innerHTML = 'Ingresar <i class="fas fa-sign-in-alt ms-1"></i>';
            loginButton.disabled = false;
            
            // Destacar campos y mostrar error
            highlightInvalidField(usernameInput);
            highlightInvalidField(passwordInput);
            highlightInvalidField(roleSelect);
            
            // Limpiar contraseña para reintento
            passwordInput.value = '';
            
            mostrarAlerta('Credenciales incorrectas. Por favor, verifica tu usuario, contraseña y rol.', 'danger');
        }
    }, 800);
}

// Resaltar campo inválido con animación
function highlightInvalidField(field) {
    field.classList.add('is-invalid');
    
    setTimeout(() => {
        field.classList.remove('is-invalid');
    }, 3000);
}

// Manejar el cierre de sesión
function handleLogout() {
    // Confirmar antes de cerrar sesión
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        // Limpiar datos de sesión
        currentUser = null;
        currentRole = '';
        localStorage.removeItem('session_data');
        
        // Limpiar formulario de login
        if (loginForm) loginForm.reset();
        
        // Mostrar pantalla de login
        showLoginScreen();
        
        // Mostrar mensaje de despedida
        mostrarAlerta('Has cerrado sesión correctamente.', 'info');
    }
}

// Comprobar si hay una sesión activa
function checkExistingSession() {
    const sessionData = localStorage.getItem('session_data');
    
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            
            // Verificar si la sesión tiene los datos necesarios
            if (session.username && session.role) {
                // Buscar el usuario en la base de datos
                const usuario = usuarios.find(u => 
                    u.username === session.username && 
                    u.role === session.role
                );
                
                if (usuario) {
                    // Restaurar sesión
                    currentUser = usuario;
                    currentRole = usuario.role;
                    
                    // Mostrar panel correspondiente
                    showPanel(currentRole);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
        }
    }
    
    return false;
}

// Mostrar la pantalla de inicio de sesión
function showLoginScreen() {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    // Ocultar todos los paneles con animación
    if (bodegaPanel) fadeOut(bodegaPanel);
    if (fabricacionPanel) fadeOut(fabricacionPanel);
    if (adminPanel) fadeOut(adminPanel);
    
    // Ocultar elementos de navegación
    logoutBtn.style.display = 'none';
    userInfo.style.display = 'none';
    
    // Mostrar pantalla de login con animación
    setTimeout(() => {
        loginScreen.style.display = 'block';
        fadeIn(loginScreen);
        
        // Focus en el primer campo
        setTimeout(() => {
            usernameInput.focus();
        }, 300);
    }, 300);
}

// Mostrar el panel según el rol seleccionado
function showPanel(role) {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    // Ocultar login screen con animación
    fadeOut(loginScreen);
    
    // Mostrar elementos de navegación
    logoutBtn.style.display = 'block';
    userInfo.style.display = 'block';
    
    // Actualizar información de usuario
    userDisplayName.textContent = currentUser.displayName;
    userRoleDisplay.textContent = getRoleName(role);
    
    // Restaurar botón de login
    loginButton.innerHTML = 'Ingresar <i class="fas fa-sign-in-alt ms-1"></i>';
    loginButton.disabled = false;
    
    // Mostrar el panel correspondiente con animación
    setTimeout(() => {
        switch (role) {
            case 'bodega':
                bodegaPanel.style.display = 'block';
                fabricacionPanel.style.display = 'none';
                adminPanel.style.display = 'none';
                fadeIn(bodegaPanel);
                cargarDatosBodega();
                break;
            case 'fabricacion':
                bodegaPanel.style.display = 'none';
                fabricacionPanel.style.display = 'block';
                adminPanel.style.display = 'none';
                fadeIn(fabricacionPanel);
                cargarDatosFabricacion();
                break;
            case 'admin':
                bodegaPanel.style.display = 'none';
                fabricacionPanel.style.display = 'none';
                adminPanel.style.display = 'block';
                fadeIn(adminPanel);
                cargarDatosAdmin();
                break;
        }
    }, 300);
}

// Obtener nombre amigable del rol
function getRoleName(role) {
    switch (role) {
        case 'bodega': return 'Bodega';
        case 'fabricacion': return 'Fabricación';
        case 'admin': return 'Administrador';
        default: return 'Usuario';
    }
}

// Animación de fade in
function fadeIn(element) {
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

// Animación de fade out
function fadeOut(element) {
    element.style.opacity = '1';
    element.style.transition = 'opacity 0.3s ease';
    
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 300);
}

// Obtener el usuario actual
function getCurrentUser() {
    return currentUser;
}

// Verificar si el usuario tiene permisos para una acción
function hasPermission(action) {
    if (!currentUser) return false;
    
    // Definir permisos por rol
    const permisos = {
        'bodega': ['crear_solicitud', 'ver_solicitudes_bodega'],
        'fabricacion': ['ver_solicitudes', 'cambiar_estado'],
        'admin': ['ver_solicitudes', 'cambiar_estado', 'eliminar_solicitud', 'exportar_datos', 'ver_estadisticas']
    };
    
    const permisosUsuario = permisos[currentUser.role] || [];
    return permisosUsuario.includes(action);
}
