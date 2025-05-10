// Configuración de autenticación de GitHub
const CLIENT_ID = 'Ov23liKt7FqbxVYYUJRZ'; // Tu Client ID de GitHub
const REDIRECT_URI = 'https://fabricacionmaquipan.github.io/fabricacion/';
const AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo`;

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
    console.log("Iniciando checkAuth...");
    // Comprobar si hay un token en localStorage
    const token = localStorage.getItem('github_token');
    if (token) {
        console.log("Token encontrado:", token);
        // En una aplicación real, validaríamos el token con GitHub
        // Para este ejemplo, simularemos un usuario autenticado
        simulateLogin();
    } else {
        console.log("No hay token, verificando código en URL");
        // Comprobar si hay un código de autorización en la URL (después de la redirección de GitHub)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            console.log("Código de autorización encontrado:", code);
            // En una aplicación real, intercambiaríamos este código por un token
            // Para este ejemplo, simularemos que obtuvimos un token
            localStorage.setItem('github_token', 'fake_token_' + Date.now());
            // Limpiamos la URL para no mantener el código visible
            history.replaceState({}, document.title, window.location.pathname);
            simulateLogin();
        } else {
            console.log("No hay código, mostrando pantalla de login");
            showLoginScreen();
        }
    }
}

// Configurar los event listeners
function setupEventListeners() {
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => {
            console.log("Redirigiendo a GitHub OAuth:", AUTH_URL);
            window.location.href = AUTH_URL;
        });
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log("Redirigiendo a GitHub OAuth desde botón de navbar:", AUTH_URL);
            window.location.href = AUTH_URL;
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Mostrar pantalla de login
function showLoginScreen() {
    if (loginScreen) loginScreen.classList.remove('d-none');
    if (bodegaPanel) bodegaPanel.classList.add('d-none');
    if (fabricacionPanel) fabricacionPanel.classList.add('d-none');
    if (adminPanel) adminPanel.classList.add('d-none');
    if (navLogin) navLogin.classList.remove('d-none');
    if (navLogout) navLogout.classList.add('d-none');
}

// Simular inicio de sesión (para este ejemplo)
function simulateLogin() {
    console.log("Simulando inicio de sesión...");
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
    
    console.log("Rol seleccionado:", role);
    
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
    
    console.log("Usuario actual:", currentUser);
    
    // Guardar el usuario en localStorage
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    
    showUserPanel(role);
}

// Mostrar el panel correspondiente al rol del usuario
function showUserPanel(role) {
    console.log("Mostrando panel para rol:", role);
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
    console.log("Cerrando sesión...");
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
