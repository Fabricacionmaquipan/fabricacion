// Configuración de la base de datos en GitHub
const REPO_OWNER = 'YOUR_GITHUB_USERNAME'; // Reemplazar con tu usuario de GitHub
const REPO_NAME = 'sistema-solicitudes-datos'; // Nombre del repositorio
const DATA_FILE = 'solicitudes.json'; // Archivo donde se guardarán los datos
const HISTORY_FILE = 'historico.json'; // Archivo para el historial de cambios

// Función para obtener el token de GitHub
function getToken() {
    return localStorage.getItem('github_token');
}

// Función para verificar si el repositorio existe, y crearlo si no existe
async function checkRepository() {
    try {
        const token = getToken();
        // En una aplicación real, verificaríamos si el repositorio existe
        // y lo crearíamos si no existe usando la API de GitHub
        console.log('Verificando repositorio...');
        
        // Para este ejemplo, asumiremos que el repositorio ya existe
        return true;
    } catch (error) {
        console.error('Error al verificar el repositorio:', error);
        return false;
    }
}

// Función para cargar los datos de solicitudes
async function loadSolicitudes() {
    try {
        // En una aplicación real, cargaríamos los datos del archivo en GitHub
        // usando la API de GitHub
        
        // Para este ejemplo, simularemos datos de prueba
        return getSampleData();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        return [];
    }
}

// Función para guardar los datos de solicitudes
async function saveSolicitudes(solicitudes) {
    try {
        const token = getToken();
        // En una aplicación real, guardaríamos los datos en el archivo en GitHub
        // usando la API de GitHub
        
        // Para este ejemplo, solo mostraremos los datos que se guardarían
        console.log('Datos a guardar:', solicitudes);
        return true;
    } catch (error) {
        console.error('Error al guardar los datos:', error);
        return false;
    }
}

// Función para cargar el historial de cambios
async function loadHistorial() {
    try {
        // En una aplicación real, cargaríamos el historial del archivo en GitHub
        
        // Para este ejemplo, simularemos datos de prueba
        return getSampleHistorial();
    } catch (error) {
        console.error('Error al cargar el historial:', error);
        return [];
    }
}

// Función para guardar un nuevo evento en el historial
async function saveHistorialEvent(solicitudId, estadoAnterior, estadoNuevo, observaciones, usuario) {
    try {
        const historial = await loadHistorial();
        
        const nuevoEvento = {
            id: historial.length + 1,
            solicitudId: solicitudId,
            estadoAnterior: estadoAnterior,
            estadoNuevo: estadoNuevo,
            observaciones: observaciones || '',
            usuario: usuario,
            fecha: new Date().toISOString()
        };
        
        historial.push(nuevoEvento);
        
        // En una aplicación real, guardaríamos el historial en GitHub
        console.log('Guardando evento en historial:', nuevoEvento);
        return true;
    } catch (error) {
        console.error('Error al guardar el evento en el historial:', error);
        return false;
    }
}

// Función para crear una nueva solicitud
async function crearSolicitud(notaVenta, fechaSolicitud, productos, cantidades) {
    try {
        const solicitudes = await loadSolicitudes();
        
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
                    usuario: JSON.parse(localStorage.getItem('current_user')).username
                }
            ]
        };
        
        // Agregar los productos y cantidades
        for (let i = 0; i < productos.length; i++) {
            nuevaSolicitud.items.push({
                producto: productos[i],
                cantidad: cantidades[i]
            });
        }
        
        solicitudes.push(nuevaSolicitud);
        
        // Guardar la solicitud
        const guardado = await saveSolicitudes(solicitudes);
        
        // Guardar el evento en el historial
        await saveHistorialEvent(
            nuevaSolicitud.id,
            null,
            'Solicitud enviada por bodega',
            '',
            JSON.parse(localStorage.getItem('current_user')).username
        );
        
        return guardado ? nuevaSolicitud : null;
    } catch (error) {
        console.error('Error al crear la solicitud:', error);
        return null;
    }
}

// Función para actualizar el estado de una solicitud
async function actualizarEstadoSolicitud(solicitudId, nuevoEstado, observaciones) {
    try {
        const solicitudes = await loadSolicitudes();
        const solicitud = solicitudes.find(s => s.id === solicitudId);
        
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }
        
        const estadoAnterior = solicitud.estado;
        solicitud.estado = nuevoEstado;
        solicitud.observaciones = observaciones || '';
        
        // Agregar al historial interno de la solicitud
        solicitud.historial.push({
            fecha: new Date().toISOString(),
            estado: nuevoEstado,
            observaciones: observaciones || '',
            usuario: JSON.parse(localStorage.getItem('current_user')).username
        });
        
        // Guardar la solicitud actualizada
        const guardado = await saveSolicitudes(solicitudes);
        
        // Guardar el evento en el historial general
        await saveHistorialEvent(
            solicitudId,
            estadoAnterior,
            nuevoEstado,
            observaciones,
            JSON.parse(localStorage.getItem('current_user')).username
        );
        
        return guardado ? solicitud : null;
    } catch (error) {
        console.error('Error al actualizar el estado de la solicitud:', error);
        return null;
    }
}

// Datos de ejemplo para pruebas
function getSampleData() {
    return [
        {
            id: '1683456789012',
            notaVenta: 'NV-2023-001',
            fechaSolicitud: '2023-05-07',
            estado: 'Solicitud enviada por bodega',
            observaciones: '',
            items: [
                { producto: 'Mesa de centro', cantidad: 2 },
                { producto: 'Silla de comedor', cantidad: 8 }
            ],
            historial: [
                {
                    fecha: '2023-05-07T10:30:00Z',
                    estado: 'Solicitud enviada por bodega',
                    observaciones: '',
                    usuario: 'usuario_bodega'
                }
            ]
        },
        {
            id: '1683556789012',
            notaVenta: 'NV-2023-002',
            fechaSolicitud: '2023-05-08',
            estado: 'En fabricación',
            observaciones: 'Pendiente por falta de material',
            items: [
                { producto: 'Estantería', cantidad: 1 },
                { producto: 'Escritorio', cantidad: 1 }
            ],
            historial: [
                {
                    fecha: '2023-05-08T09:15:00Z',
                    estado: 'Solicitud enviada por bodega',
                    observaciones: '',
                    usuario: 'usuario_bodega'
                },
                {
                    fecha: '2023-05-09T11:20:00Z',
                    estado: 'En fabricación',
                    observaciones: 'Pendiente por falta de material',
                    usuario: 'usuario_fabricacion'
                }
            ]
        },
        {
            id: '1683656789012',
            notaVenta: 'NV-2023-003',
            fechaSolicitud: '2023-05-09',
            estado: 'Entregado',
            observaciones: 'Entregado completo',
            items: [
                { producto: 'Cama king', cantidad: 1 }
            ],
            historial: [
                {
                    fecha: '2023-05-09T08:45:00Z',
                    estado: 'Solicitud enviada por bodega',
                    observaciones: '',
                    usuario: 'usuario_bodega'
                },
                {
                    fecha: '2023-05-10T10:30:00Z',
                    estado: 'En fabricación',
                    observaciones: '',
                    usuario: 'usuario_fabricacion'
                },
                {
                    fecha: '2023-05-12T14:20:00Z',
                    estado: 'Entregado',
                    observaciones: 'Entregado completo',
                    usuario: 'usuario_fabricacion'
                }
            ]
        }
    ];
}

// Historial de ejemplo para pruebas
function getSampleHistorial() {
    return [
        {
            id: 1,
            solicitudId: '1683456789012',
            estadoAnterior: null,
            estadoNuevo: 'Solicitud enviada por bodega',
            observaciones: '',
            usuario: 'usuario_bodega',
            fecha: '2023-05-07T10:30:00Z'
        },
        {
            id: 2,
            solicitudId: '1683556789012',
            estadoAnterior: null,
            estadoNuevo: 'Solicitud enviada por bodega',
            observaciones: '',
            usuario: 'usuario_bodega',
            fecha: '2023-05-08T09:15:00Z'
        },
        {
            id: 3,
            solicitudId: '1683556789012',
            estadoAnterior: 'Solicitud enviada por bodega',
            estadoNuevo: 'En fabricación',
            observaciones: 'Pendiente por falta de material',
            usuario: 'usuario_fabricacion',
            fecha: '2023-05-09T11:20:00Z'
        },
        {
            id: 4,
            solicitudId: '1683656789012',
            estadoAnterior: null,
            estadoNuevo: 'Solicitud enviada por bodega',
            observaciones: '',
            usuario: 'usuario_bodega',
            fecha: '2023-05-09T08:45:00Z'
        },
        {
            id: 5,
            solicitudId: '1683656789012',
            estadoAnterior: 'Solicitud enviada por bodega',
            estadoNuevo: 'En fabricación',
            observaciones: '',
            usuario: 'usuario_fabricacion',
            fecha: '2023-05-10T10:30:00Z'
        },
        {
            id: 6,
            solicitudId: '1683656789012',
            estadoAnterior: 'En fabricación',
            estadoNuevo: 'Entregado',
            observaciones: 'Entregado completo',
            usuario: 'usuario_fabricacion',
            fecha: '2023-05-12T14:20:00Z'
        }
    ];
}

// Exportar funciones para su uso en otros archivos
window.db = {
    loadSolicitudes,
    saveSolicitudes,
    loadHistorial,
    saveHistorialEvent,
    crearSolicitud,
    actualizarEstadoSolicitud,
    checkRepository
};