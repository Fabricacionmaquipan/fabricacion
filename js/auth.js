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
    loginButton.addEventListener('click', () => {
        const selectedRole = roleSelect.value;
        if (selectedRole) {
            currentRole = selectedRole;
            localStorage.setItem('current_role', currentRole);
            showPanel(currentRole);
        } else {
            alert('Por favor, selecciona un rol para continuar.');
        }
    });
    
    // Evento de cierre de sesión
    logoutBtn.addEventListener('click', () => {
        currentRole = '';
        localStorage.removeItem('current_role');
        showLoginScreen();
    });
}

// Mostrar la pantalla de inicio de sesión
function showLoginScreen() {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    loginScreen.style.display = 'block';
    bodegaPanel.style.display = 'none';
    fabricacionPanel.style.display = 'none';
    adminPanel.style.display = 'none';
    logoutBtn.style.display = 'none';
    userInfo.style.display = 'none';
}

// Mostrar el panel según el rol seleccionado
function showPanel(role) {
    const bodegaPanel = document.getElementById('bodega-panel');
    const fabricacionPanel = document.getElementById('fabricacion-panel');
    const adminPanel = document.getElementById('admin-panel');
    
    loginScreen.style.display = 'none';
    logoutBtn.style.display = 'block';
    userInfo.style.display = 'block';
    
    // Mostrar el nombre del rol
    let roleName = '';
    switch (role) {
        case 'bodega': roleName = 'Bodega'; break;
        case 'fabricacion': roleName = 'Fabricación'; break;
        case 'admin': roleName = 'Administrador'; break;
    }
    userRoleDisplay.textContent = roleName;
    
    // Mostrar el panel correspondiente
    switch (role) {
        case 'bodega':
            bodegaPanel.style.display = 'block';
            fabricacionPanel.style.display = 'none';
            adminPanel.style.display = 'none';
            cargarDatosBodega();
            break;
        case 'fabricacion':
            bodegaPanel.style.display = 'none';
            fabricacionPanel.style.display = 'block';
            adminPanel.style.display = 'none';
            cargarDatosFabricacion();
            break;
        case 'admin':
            bodegaPanel.style.display = 'none';
            fabricacionPanel.style.display = 'none';
            adminPanel.style.display = 'block';
            cargarDatosAdmin();
            break;
    }
}
