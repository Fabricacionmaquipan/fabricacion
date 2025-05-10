// Configuración de GitHub
const GITHUB_TOKEN = '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'; // Tu token personal
const GITHUB_REPO_OWNER = 'Fabricacionmaquipan';
const GITHUB_REPO_NAME = 'fabricacion';
const DATA_FILE_PATH = 'data/solicitudes.json';

// Función para cargar solicitudes desde GitHub
async function cargarSolicitudesDesdeGithub() {
    try {
        console.log('Cargando solicitudes desde GitHub...');
        
        // Intentar obtener el archivo de datos
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${DATA_FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            // Si el archivo no existe, devolver un array vacío
            if (response.status === 404) {
                console.log('Archivo de datos no encontrado, se creará uno nuevo.');
                return [];
            }
            throw new Error(`Error al cargar datos: ${response.status}`);
        }
        
        const data = await response.json();
        const contenidoBase64 = data.content;
        const contenidoTexto = atob(contenidoBase64);
        return JSON.parse(contenidoTexto);
        
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        // En caso de error, devolver los datos de ejemplo
        return [...solicitudesData];
    }
}

// Función para guardar solicitudes en GitHub
async function guardarSolicitudesEnGithub(solicitudesArray) {
    try {
        console.log('Guardando solicitudes en GitHub...');
        
        // Convertir el array a JSON
        const contenidoJSON = JSON.stringify(solicitudesArray, null, 2);
        const contenidoBase64 = btoa(unescape(encodeURIComponent(contenidoJSON)));
        
        // Obtener el SHA del archivo si existe
        let sha = '';
        try {
            const checkResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${DATA_FILE_PATH}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (checkResponse.ok) {
                const fileData = await checkResponse.json();
                sha = fileData.sha;
            }
        } catch (error) {
            console.log('El archivo no existe, se creará uno nuevo.');
        }
        
        // Datos a enviar
        const requestData = {
            message: 'Actualización de solicitudes',
            content: contenidoBase64,
            branch: 'main'
        };
        
        // Si el archivo ya existe, incluir su SHA
        if (sha) {
            requestData.sha = sha;
        }
        
        // Guardar el archivo
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${DATA_FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Error al guardar datos: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error al guardar solicitudes:', error);
        alert('Error al guardar los datos en GitHub. Los cambios solo se guardarán localmente.');
        return false;
    }
}

// Modificar estas funciones en tu código principal para usar GitHub

// Cargar solicitudes al inicio
async function initializeSolicitudes() {
    solicitudes = await cargarSolicitudesDesdeGithub();
    // Actualizar las vistas según el rol actual
    if (currentRole) {
        showPanel(currentRole);
    }
}

// Modificar handleNuevaSolicitud
async function handleNuevaSolicitud(e) {
    e.preventDefault();
    
    const notaVenta = document.getElementById('nota-venta').value;
    const fechaSolicitud = document.getElementById('fecha-solicitud').value;
    
    // Obtener productos y cantidades
    const productos = [];
    const cantidades = [];
    
    const productosInputs = document.querySelectorAll('input[name="producto[]"]');
    const cantidadesInputs = document.querySelectorAll('input[name="cantidad[]"]');
    
    for (let i = 0; i < productosInputs.length; i++) {
        const producto = productosInputs[i].value.trim();
        const cantidad = parseInt(cantidadesInputs[i].value);
        
        if (producto && !isNaN(cantidad) && cantidad > 0) {
            productos.push(producto);
            cantidades.push(cantidad);
        }
    }
    
    if (productos.length === 0) {
        alert('Debe agregar al menos un producto.');
        return;
    }
    
    // Crear la nueva solicitud
    const nuevaSolicitud = {
        id: Date.now().toString(),
        notaVenta: notaVenta,
        fechaSolicitud: fechaSolicitud,
        estado: 'Solicitud enviada por bodega',
        observaciones: '',
        items: [],
        historial: [
            {
                fecha: new Date().toISOString(),
                estado: 'Solicitud enviada por bodega',
                observaciones: '',
                usuario: 'usuario_bodega'
            }
        ]
    };
    
    // Agregar los productos
    for (let i = 0; i < productos.length; i++) {
        nuevaSolicitud.items.push({
            producto: productos[i],
            cantidad: cantidades[i]
        });
    }
    
    // Agregar la solicitud a la lista
    solicitudes.unshift(nuevaSolicitud);
    
    // Guardar en GitHub
    const guardado = await guardarSolicitudesEnGithub(solicitudes);
    
    // Limpiar el formulario
    nuevaSolicitudForm.reset();
    
    // Limpiar los items excepto el primero
    const items = document.querySelectorAll('.item-row');
    for (let i = 1; i < items.length; i++) {
        items[i].remove();
    }
    
    // Recargar los datos
    cargarDatosBodega();
    
    alert('Solicitud creada correctamente.' + (guardado ? ' Los datos se han sincronizado con GitHub.' : ''));
}

// Modificar handleActualizarEstado
async function handleActualizarEstado(e) {
    e.preventDefault();
    
    const solicitudId = solicitudIdInput.value;
    const nuevoEstado = nuevoEstadoSelect.value;
    const observaciones = observacionesText.value;
    
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    
    if (solicitud) {
        const estadoAnterior = solicitud.estado;
        solicitud.estado = nuevoEstado;
        solicitud.observaciones = observaciones;
        
        // Agregar al historial
        solicitud.historial.push({
            fecha: new Date().toISOString(),
            estado: nuevoEstado,
            observaciones: observaciones,
            usuario: currentRole === 'admin' ? 'usuario_admin' : 'usuario_fabricacion'
        });
        
        // Guardar en GitHub
        const guardado = await guardarSolicitudesEnGithub(solicitudes);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(actualizarEstadoModal);
        modal.hide();
        
        // Recargar los datos
        if (currentRole === 'fabricacion') {
            cargarDatosFabricacion();
        } else if (currentRole === 'admin') {
            cargarDatosAdmin();
        }
        
        alert('Estado actualizado correctamente.' + (guardado ? ' Los datos se han sincronizado con GitHub.' : ''));
    }
}

// Función para comprobar periódicamente si hay cambios
function startSyncInterval() {
    setInterval(async () => {
        try {
            const remoteSolicitudes = await cargarSolicitudesDesdeGithub();
            
            // Solo actualizar si hay diferencias
            if (JSON.stringify(remoteSolicitudes) !== JSON.stringify(solicitudes)) {
                console.log('Cambios detectados en GitHub, actualizando datos...');
                solicitudes = remoteSolicitudes;
                
                // Actualizar la vista actual
                if (currentRole === 'bodega') {
                    cargarDatosBodega();
                } else if (currentRole === 'fabricacion') {
                    cargarDatosFabricacion();
                } else if (currentRole === 'admin') {
                    cargarDatosAdmin();
                }
            }
        } catch (error) {
            console.error('Error al sincronizar con GitHub:', error);
        }
    }, 30000); // Comprobar cada 30 segundos
}

// Modificar la función init para inicializar los datos
async function init() {
    // Comprobar si hay un rol guardado en localStorage
    const savedRole = localStorage.getItem('current_role');
    
    // Cargar solicitudes desde GitHub
    await initializeSolicitudes();
    
    if (savedRole) {
        currentRole = savedRole;
        showPanel(currentRole);
    } else {
        showLoginScreen();
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    // Iniciar sincronización periódica
    startSyncInterval();
}
