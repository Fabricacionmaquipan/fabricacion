// Gestión de autenticación y roles

// Variables y elementos DOM
let currentRole = '';
const loginScreen = document.getElementById('login-screen');
const roleSelect = document.getElementById('role-select');
const loginButton = document.getElementById('login-button');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userRoleDisplay = document.getElementById('user-role-display');

// Configurar event listeners relacionados con autenticación
function setupAuthListeners() {
    // Evento de inicio de sesión
    loginButton.addEventListener('click', handleLogin);
    
    // También permitir iniciar sesión presionando Enter en el select
    roleSelect.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Evento de cierre de sesión
    logoutBtn.addEventListener('click', handleLogout);
}

// Manejar el inicio de sesión
function handleLogin() {
    const selectedRole = roleSelect.value;
    if (selectedRole) {
        // Mostrar animación de carga
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';
        loginButton.disabled = true;
        
        // Simular un pequeño retardo para mejor UX
        setTimeout(() => {
            currentRole = selectedRole;
            localStorage.setItem('current_role', currentRole);
            showPanel(currentRole);
            
            // Restaurar el botón
            loginButton.innerHTML = 'Ingresar <i class="fas fa-arrow-right ms-1"></i>';
            loginButton.disabled = false;
            
            // Mostrar mensaje de bienvenida
            mostrarAlerta(`Bienvenido al panel de ${getRoleName(currentRole)}`, 'success');
        }, 800);
    } else {
        // Animar el select para indicar error
        roleSelect.classList.add('is-invalid');
        
        setTimeout(() => {
            roleSelect.classList.remove('is-invalid');
        }, 3000);
        
        // Mostrar mensaje de error
        mostrarAlerta('Por favor, selecciona un rol para continuar.', 'warning');
    }
}

// Manejar el cierre de sesión
function handleLogout() {
    // Confirmar antes de cerrar sesión
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        currentRole = '';
        localStorage.removeItem('current_role');
        showLoginScreen();
        
        // Mostrar mensaje de despedida
        mostrarAlerta('Has cerrado sesión correctamente.', 'info');
    }
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
        
        // Focus en el select
        setTimeout(() => {
            roleSelect.focus();
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
    
    // Mostrar el nombre del rol
    let roleName = getRoleName(role);
    userRoleDisplay.textContent = roleName;
    
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
