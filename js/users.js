// Gestión de usuarios para el sistema

// Base de datos de usuarios (en producción esto estaría en Firebase)
let usuarios = [
    { 
        id: 'u1001',
        username: 'bodega1', 
        password: 'bodega123', 
        role: 'bodega', 
        displayName: 'Usuario Bodega',
        status: 'active',
        lastLogin: '2025-05-10T08:45:00',
        createdAt: '2025-01-15T10:00:00'
    },
    { 
        id: 'u1002',
        username: 'fabricacion1', 
        password: 'fabrica123', 
        role: 'fabricacion', 
        displayName: 'Usuario Fabricación',
        status: 'active',
        lastLogin: '2025-05-10T09:15:00',
        createdAt: '2025-01-15T10:00:00'
    },
    { 
        id: 'u1003',
        username: 'admin1', 
        password: 'admin123', 
        role: 'admin', 
        displayName: 'Administrador',
        status: 'active',
        lastLogin: '2025-05-10T10:30:00',
        createdAt: '2025-01-15T10:00:00' 
    }
];

// Referencia a Firebase para usuarios (similar a solicitudes)
const usuariosRef = database.ref('usuarios');

// Configurar listeners para gestión de usuarios
function setupUsersListeners() {
    // Referencias a elementos del DOM
    const tablaUsuarios = document.getElementById('tabla-usuarios');
    const usuarioForm = document.getElementById('usuario-form');
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    
    // Verificar si tenemos acceso a estos elementos (solo admin debería tenerlo)
    if (!tablaUsuarios || !usuarioForm || !btnNuevoUsuario) return;
    
    // Evento para el formulario de usuario
    usuarioForm.addEventListener('submit', handleUsuarioSubmit);
    
    // Delegación de eventos para botones en la tabla de usuarios
    if (tablaUsuarios) {
        tablaUsuarios.addEventListener('click', (e) => {
            // Editar usuario
            if (e.target.classList.contains('btn-warning') || e.target.closest('.btn-warning')) {
                const row = e.target.closest('tr');
                const username = row.cells[0].textContent;
                editarUsuario(username);
            }
            
            // Desactivar/activar usuario
            if (e.target.classList.contains('btn-danger') || e.target.closest('.btn-danger')) {
                const row = e.target.closest('tr');
                const username = row.cells[0].textContent;
                toggleUsuarioStatus(username);
            }
        });
    }
    
    // Cargar usuarios al iniciar
    cargarUsuarios();
}

// Manejar el envío del formulario de usuario
function handleUsuarioSubmit(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const id = document.getElementById('usuario-id').value;
    const username = document.getElementById('usuario-username').value;
    const displayName = document.getElementById('usuario-displayname').value;
    const password = document.getElementById('usuario-password').value;
    const role = document.getElementById('usuario-role').value;
    const status = document.getElementById('usuario-status').value;
    
    // Validar datos
    if (!username || !displayName || !password || !role || !status) {
        mostrarAlerta('Todos los campos son obligatorios', 'warning');
        return;
    }
    
    // Mostrar indicador de carga
    mostrarSincronizacion('Guardando usuario...');
    
    // Verificar si es un nuevo usuario o actualización
    if (id) {
        // Actualizar usuario existente
        const index = usuarios.findIndex(u => u.id === id);
        
        if (index !== -1) {
            // Actualizar datos
            usuarios[index].username = username;
            usuarios[index].displayName = displayName;
            if (password !== '********') { // Solo actualizar contraseña si se cambió
                usuarios[index].password = password;
            }
            usuarios[index].role = role;
            usuarios[index].status = status;
            
            // En producción: guardar en Firebase
            // usuariosRef.child(id).update(usuarios[index]);
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('usuario-modal')).hide();
            mostrarAlerta('Usuario actualizado correctamente', 'success');
        }
    } else {
        // Verificar que el usuario no exista ya
        if (usuarios.some(u => u.username === username)) {
            mostrarAlerta('El nombre de usuario ya existe', 'danger');
            ocultarSincronizacion();
            return;
        }
        
        // Crear nuevo usuario
        const nuevoUsuario = {
            id: 'u' + Date.now(),
            username,
            displayName,
            password,
            role,
            status,
            lastLogin: null,
            createdAt: new Date().toISOString()
        };
        
        // Agregar a la lista
        usuarios.push(nuevoUsuario);
        
        // En producción: guardar en Firebase
        // usuariosRef.child(nuevoUsuario.id).set(nuevoUsuario);
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('usuario-modal')).hide();
        mostrarAlerta('Usuario creado correctamente', 'success');
    }
    
    // Recargar tabla y ocultar indicador
    cargarUsuarios();
    ocultarSincronizacion();
}

// Editar usuario existente
function editarUsuario(username) {
    const usuario = usuarios.find(u => u.username === username);
    
    if (usuario) {
        // Llenar formulario
        document.getElementById('usuario-id').value = usuario.id;
        document.getElementById('usuario-username').value = usuario.username;
        document.getElementById('usuario-displayname').value = usuario.displayName;
        document.getElementById('usuario-password').value = '********'; // Placeholder para contraseña
        document.getElementById('usuario-role').value = usuario.role;
        document.getElementById('usuario-status').value = usuario.status;
        
        // Cambiar título del modal
        document.getElementById('usuario-modal-title').innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Usuario';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('usuario-modal'));
        modal.show();
    }
}

// Activar/desactivar usuario
function toggleUsuarioStatus(username) {
    const usuario = usuarios.find(u => u.username === username);
    
    if (usuario) {
        // Confirmar cambio
        const mensaje = usuario.status === 'active' 
            ? `¿Estás seguro que deseas desactivar al usuario ${usuario.displayName}?`
            : `¿Estás seguro que deseas activar al usuario ${usuario.displayName}?`;
            
        if (confirm(mensaje)) {
            // Cambiar estado
            usuario.status = usuario.status === 'active' ? 'inactive' : 'active';
            
            // En producción: actualizar en Firebase
            // usuariosRef.child(usuario.id).update({ status: usuario.status });
            
            // Recargar tabla
            cargarUsuarios();
            
            // Mostrar mensaje
            const accion = usuario.status === 'active' ? 'activado' : 'desactivado';
            mostrarAlerta(`Usuario ${accion} correctamente`, 'success');
        }
    }
}

// Cargar usuarios en la tabla
function cargarUsuarios() {
    const tablaUsuarios = document.getElementById('tabla-usuarios');
    if (!tablaUsuarios) return;
    
    // Limpiar tabla
    tablaUsuarios.innerHTML = '';
    
    // Mostrar cada usuario
    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        
        // Agregar clase según estado
        if (usuario.status === 'inactive') {
            tr.classList.add('table-secondary');
        }
        
        // Formatear fecha de último acceso
        let lastLogin = usuario.lastLogin ? new Date(usuario.lastLogin).toLocaleString() : 'Nunca';
        
        // Crear badge según rol
        let roleBadge = '';
        switch(usuario.role) {
            case 'bodega':
                roleBadge = '<span class="badge bg-info">Bodega</span>';
                break;
            case 'fabricacion':
                roleBadge = '<span class="badge bg-primary">Fabricación</span>';
                break;
            case 'admin':
                roleBadge = '<span class="badge bg-dark">Administrador</span>';
                break;
        }
        
        // Crear badge según estado
        let statusBadge = usuario.status === 'active'
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-secondary">Inactivo</span>';
        
        tr.innerHTML = `
            <td data-label="Usuario">${usuario.username}</td>
            <td data-label="Nombre">${usuario.displayName}</td>
            <td data-label="Rol">${roleBadge}</td>
            <td data-label="Último Acceso">${lastLogin}</td>
            <td data-label="Estado">${statusBadge}</td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-warning">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger">
                    <i class="fas fa-${usuario.status === 'active' ? 'user-slash' : 'user-check'}"></i>
                </button>
            </td>
        `;
        
        tablaUsuarios.appendChild(tr);
    });
}

// Buscar usuario por credenciales
function buscarUsuario(username, password, role) {
    return usuarios.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role &&
        u.status === 'active'
    );
}

// Actualizar último acceso de un usuario
function actualizarUltimoAcceso(userId) {
    const index = usuarios.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        usuarios[index].lastLogin = new Date().toISOString();
        
        // En producción: actualizar en Firebase
        // usuariosRef.child(userId).update({ lastLogin: usuarios[index].lastLogin });
    }
}

// Exportar funciones para uso en otros módulos
window.userManagement = {
    buscarUsuario,
    actualizarUltimoAcceso,
    setupUsersListeners
};
