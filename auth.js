// Configuración de autenticación de GitHub
const CLIENT_ID = 'Ov23liKt7FqbxVYYUJRZ'; // Tu Client ID de GitHub
const REDIRECT_URI = window.location.origin;
const AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;

// Roles de usuario (en una aplicación real esto vendría de una base de datos)
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
const githubLoginBtn = document.getElementById('github-login');

// Inicializar la aplicación
function init() {
    checkAuth();
    setupEventListeners();
}

// Comprobar si el usuario está autenticado
function checkAuth() {
    // Comprobar si hay un token en localStorage
    const token = localStorage.getItem('github_token');
    if (token) {
        // En una aplicación real, validaríamos el token con GitHub
        // Para este ejemplo, simularemos un usuario autenticado
        simulateLogin();
    } else {
        // Comprobar si hay un código de autorización en la URL (después de la redirección de GitHub)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // En una aplicación real, intercambiaríamos este código por un token
            // Para este ejemplo, simularemos que obtuvimos un token
            localStorage.setItem('github_token', 'fake_token_' + Date.now());
            // Limpiamos la URL para no mantener el código visible
            history.replaceState({}, document.title, window.location.pathname);
            simulateLogin();
        } else {
            showLoginScreen();
        }
    }
}

// Configurar los event listeners
function setupEventListeners() {
    githubLoginBtn.addEventListener('click', () => {
        window.location.href = AUTH_URL;
    });
    
    loginBtn.addEventListener('click', () => {
        window.location.href = AUTH_URL;
    });
    
    logoutBtn.addEventListener('click', logout);
}

// Mostrar pantalla de login
function showLoginScreen() {
    loginScreen.classList.remove('d-none');
    bodegaPanel.classList.add('d-none');
    fabricacionPanel.classList.add('d-none');
    adminPanel.classList.add('d-none');
    navLogin.classList.remove('d-none');
    navLogout.classList.add('d-none');
}

// Simular inicio de sesión (para este ejemplo)
function simulateLogin() {
    // En una aplicación real, obtendríamos la información del usuario de GitHub
    // y verificaríamos su rol en nuestra base de datos
    
    // Para este ejemplo, simularemos un usuario según la URL o elegiremos uno al azar
    const urlParams = new URLSearchParams(window.location.search);
    let role = urlParams.get('role');
    
    if (!role || !['bodega', 'fabricacion', 'admin'].includes(role)) {
        // Si no hay rol especificado o es inválido, elegimos uno al azar para la demostración
        const roles = ['bodega', 'fabricacion', 'admin'];
        role = roles[Math.floor(Math.random() * roles.length)];
    }
    
    // Asignar usuario según el rol
    let username;
    switch (role) {
        case 'bodega':
            username = 'usuario_bodega';
            break;
        case 'fabricacion':
            username = 'usuario_fabricacion';
            break;
        case 'admin':
            username = 'usuario_admin';
            break;
    }
    
    currentUser = {
        username: username,
        ...USUARIOS[username]
    };
    
    // Guardar el usuario en localStorage
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    
    showUserPanel(role);
}

// Mostrar el panel correspondiente al rol del usuario
function showUserPanel(role) {
    loginScreen.classList.add('d-none');
    navLogin.classList.add('d-none');
    navLogout.classList.remove('d-none');
    
    // Mostrar el panel correspondiente
    switch (role) {
        case 'bodega':
            bodegaPanel.classList.remove('d-none');
            fabricacionPanel.classList.add('d-none');
            adminPanel.classList.add('d-none');
            // Cargar datos de bodega
            loadBodegaData();
            break;
        case 'fabricacion':
            bodegaPanel.classList.add('d-none');
            fabricacionPanel.classList.remove('d-none');
            adminPanel.classList.add('d-none');
            // Cargar datos de fabricación
            loadFabricacionData();
            break;
        case 'admin':
            bodegaPanel.classList.add('d-none');
            fabricacionPanel.classList.add('d-none');
            adminPanel.classList.remove('d-none');
            // Cargar datos de admin
            loadAdminData();
            break;
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('github_token');
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
