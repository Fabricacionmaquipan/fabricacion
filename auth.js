// Sistema de autenticación simplificado sin OAuth
// Roles de usuario
const USUARIOS = {
    'usuario_bodega': {
        role: 'bodega',
        name: 'Usuario Bodega'
    },
    'usuario_fabricacion': {
        role: 'fabricacion',
        name: 'Usuario Fabricación'
    },
    'usuario_admin': {
        role: 'admin',
        name: 'Usuario Administrador'
    }
};

// Estado de la aplicación
let currentUser = null;

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const bodegaPanel = document.getElementById('bodega-panel');
const fabricacionPanel = document.getElementById('fabricacion-panel');
const adminPanel = document.getElementById('admin-panel');
const navLogin = document.getElementById('nav-login');
const navLogout = document.getElementById('nav-logout');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const selectRoleForm = document.getElementById('select-role-form');
const roleSelect = document.getElementById('role-select');

// Inicializar la aplicación
function init() {
    checkAuth();
    setupEventListeners();
}

// Comprobar si el usuario está autenticado
function checkAuth() {
    // Comprobar si hay un usuario en localStorage
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
        currentUser = JSON.parse(userJson);
        showUserPanel(currentUser.role);
    } else {
        showLoginScreen();
    }
}

// Configurar los event listeners
function setupEventListeners() {
    if (selectRoleForm) {
        selectRoleForm.addEventListener('submit', handleRoleSelection);
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showLoginScreen();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Manejar la selección de rol
function handleRoleSelection(e) {
    e.preventDefault();
    
    const selectedRole = roleSelect.value;
    
    // Asignar usuario según el rol
    let username;
    switch (selectedRole) {
        case 'bodega':
            username = 'usuario_bodega';
            break;
        case 'fabricacion':
            username = 'usuario_fabricacion';
            break;
        case 'admin':
            username = 'usuario_admin';
            break;
        default:
            alert('Por favor, selecciona un rol válido.');
            return;
    }
    
    currentUser = {
        username: username,
        ...USUARIOS[username]
    };
    
    // Guardar el usuario en localStorage
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    
    showUserPanel(selectedRole);
}

// Mostrar pantalla de login
function showLoginScreen() {
    if (loginScreen) loginScreen.classList.remove('d-none');
    if (bodegaPanel) bodegaPanel.classList.add('d-none');
    if (fabricacionPanel) fabricacionPanel.classList.add('d-none');
    if (adminPanel) adminPanel.classList.add('d-none');
    if (navLogin) navLogin.classList.add('d-none');
    if (navLogout) navLogout.classList.add('d-none');
}

// Mostrar el panel correspondiente al rol del usuario
function showUserPanel(role) {
    if (loginScreen) loginScreen.classList.add('d-none');
    if (navLogin) navLogin.classList.add('d-none');
    if (navLogout) navLogout.classList.remove('d-none');
    
    // Mostrar el panel correspondiente
    switch (role) {
        case 'bodega':
            if (bodegaPanel) bodegaPanel.classList.remove('d-none');
            if (fabricacionPanel) fabricacionPanel.classList.add('d-none');
            if (adminPanel) adminPanel.classList.add('d-none');
            // Cargar datos de bodega
            if (window.bodega && window.bodega.loadData) {
                window.bodega.loadData();
            }
            break;
        case 'fabricacion':
            if (bodegaPanel) bodegaPanel.classList.add('d-none');
            if (fabricacionPanel) fabricacionPanel.classList.remove('d-none');
            if (adminPanel) adminPanel.classList.add('d-none');
            // Cargar datos de fabricación
            if (window.fabricacion && window.fabricacion.loadData) {
                window.fabricacion.loadData();
            }
            break;
        case 'admin':
            if (bodegaPanel) bodegaPanel.classList.add('d-none');
            if (fabricacionPanel) fabricacionPanel.classList.add('d-none');
            if (adminPanel) adminPanel.classList.remove('d-none');
            // Cargar datos de admin
            if (window.admin && window.admin.loadData) {
                window.admin.loadData();
            }
            break;
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('current_user');
    currentUser = null;
    showLoginScreen();
}

// Exportar funciones y variables que se usarán en otros archivos
window.auth = {
    currentUser,
    init,
    checkAuth,
    showUserPanel
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
