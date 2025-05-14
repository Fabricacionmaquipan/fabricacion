// repuestos.js - Gestión del catálogo de repuestos

// Base de datos de repuestos
let repuestos = [];

// Referencias a Firebase para repuestos
const repuestosRef = database.ref('repuestos');

// Inicializar el sistema de repuestos
function initRepuestos() {
    console.log("Inicializando módulo de repuestos...");
    
    // Cargar repuestos desde Firebase o inicializar con algunos predeterminados
    repuestosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            repuestos = Object.values(data);
            console.log(`Base de datos de repuestos cargada: ${repuestos.length} repuestos`);
        } else {
            // Si no hay datos, inicializar con algunos repuestos de ejemplo
            repuestos = [
                { id: 'R001', sku: 'REP-001', nombre: 'Tornillo hexagonal 10mm', categoria: 'Tornillos', stock: 150 },
                { id: 'R002', sku: 'REP-002', nombre: 'Tuerca de seguridad 8mm', categoria: 'Tuercas', stock: 200 },
                { id: 'R003', sku: 'REP-003', nombre: 'Arandela plana 12mm', categoria: 'Arandelas', stock: 300 },
                { id: 'R004', sku: 'REP-004', nombre: 'Pasador elástico 5mm', categoria: 'Pasadores', stock: 80 },
                { id: 'R005', sku: 'REP-005', nombre: 'Rodamiento de bolas 6205', categoria: 'Rodamientos', stock: 40 },
                { id: 'R006', sku: 'REP-006', nombre: 'Correa de distribución', categoria: 'Transmisión', stock: 25 },
                { id: 'R007', sku: 'REP-007', nombre: 'Filtro de aceite', categoria: 'Filtros', stock: 60 },
                { id: 'R008', sku: 'REP-008', nombre: 'Junta de culata', categoria: 'Juntas', stock: 15 },
                { id: 'R009', sku: 'REP-009', nombre: 'Kit de embrague', categoria: 'Embrague', stock: 10 },
                { id: 'R010', sku: 'REP-010', nombre: 'Bomba de agua', categoria: 'Refrigeración', stock: 8 },
                { id: 'R011', sku: 'REP-011', nombre: 'Amortiguador delantero', categoria: 'Suspensión', stock: 12 },
                { id: 'R012', sku: 'REP-012', nombre: 'Pastillas de freno', categoria: 'Frenos', stock: 30 },
                { id: 'R013', sku: 'REP-013', nombre: 'Disco de freno', categoria: 'Frenos', stock: 20 },
                { id: 'R014', sku: 'REP-014', nombre: 'Bujía de encendido', categoria: 'Encendido', stock: 50 },
                { id: 'R015', sku: 'REP-015', nombre: 'Batería 12V', categoria: 'Eléctrico', stock: 15 }
            ];
            
            // Guardar repuestos iniciales en Firebase
            repuestos.forEach(repuesto => {
                repuestosRef.child(repuesto.id).set(repuesto);
            });
            
            console.log("Se inicializaron repuestos de ejemplo en la base de datos");
        }
        
        // Notificar que los repuestos están listos
        document.dispatchEvent(new CustomEvent('repuestosCargados'));
    }, (error) => {
        console.error('Error al cargar repuestos:', error);
    });
}

// Buscar un repuesto por SKU
function buscarRepuestoPorSku(sku) {
    if (!sku) return null;
    return repuestos.find(r => r.sku && r.sku.toLowerCase() === sku.toLowerCase());
}

// Buscar un repuesto por nombre
function buscarRepuestoPorNombre(nombre) {
    if (!nombre) return null;
    return repuestos.find(r => r.nombre && r.nombre.toLowerCase() === nombre.toLowerCase());
}

// Filtrar repuestos que coincidan con un término de búsqueda en SKU
function filtrarRepuestosPorSku(termino) {
    if (!termino) return [];
    termino = termino.toLowerCase();
    
    return repuestos.filter(r => 
        r.sku && r.sku.toLowerCase().includes(termino)
    ).slice(0, 10); // Limitar a 10 resultados
}

// Filtrar repuestos que coincidan con un término de búsqueda en nombre
function filtrarRepuestosPorNombre(termino) {
    if (!termino) return [];
    termino = termino.toLowerCase();
    
    return repuestos.filter(r => 
        r.nombre && r.nombre.toLowerCase().includes(termino)
    ).slice(0, 10); // Limitar a 10 resultados
}

// Obtener todos los repuestos
function getRepuestos() {
    return [...repuestos];
}

// Agregar un nuevo repuesto
async function agregarRepuesto(repuesto) {
    try {
        // Verificar si ya existe un repuesto con el mismo SKU
        const repuestoExistente = buscarRepuestoPorSku(repuesto.sku);
        if (repuestoExistente) {
            throw new Error(`Ya existe un repuesto con el SKU ${repuesto.sku}`);
        }
        
        // Generar un ID único si no se proporciona
        const id = repuesto.id || 'R' + Date.now().toString(36);
        repuesto.id = id;
        
        // Guardar en Firebase
        await repuestosRef.child(id).set(repuesto);
        
        // Añadir a la lista local
        repuestos.push(repuesto);
        
        return repuesto;
    } catch (error) {
        console.error('Error al agregar repuesto:', error);
        throw error;
    }
}

// Actualizar un repuesto existente
async function actualizarRepuesto(repuesto) {
    try {
        if (!repuesto.id) {
            throw new Error('El repuesto no tiene ID');
        }
        
        // Verificar si el SKU ya está en uso por otro repuesto
        const repuestoExistente = buscarRepuestoPorSku(repuesto.sku);
        if (repuestoExistente && repuestoExistente.id !== repuesto.id) {
            throw new Error(`Ya existe otro repuesto con el SKU ${repuesto.sku}`);
        }
        
        // Actualizar en Firebase
        await repuestosRef.child(repuesto.id).update(repuesto);
        
        // Actualizar en la lista local
        const index = repuestos.findIndex(r => r.id === repuesto.id);
        if (index !== -1) {
            repuestos[index] = repuesto;
        }
        
        return repuesto;
    } catch (error) {
        console.error('Error al actualizar repuesto:', error);
        throw error;
    }
}

// Eliminar un repuesto
async function eliminarRepuesto(id) {
    try {
        // Eliminar de Firebase
        await repuestosRef.child(id).remove();
        
        // Eliminar de la lista local
        repuestos = repuestos.filter(r => r.id !== id);
        
        return true;
    } catch (error) {
        console.error('Error al eliminar repuesto:', error);
        throw error;
    }
}

// Exportar funciones para uso en otros módulos
window.repuestosModule = {
    initRepuestos,
    buscarRepuestoPorSku,
    buscarRepuestoPorNombre,
    filtrarRepuestosPorSku,
    filtrarRepuestosPorNombre,
    getRepuestos,
    agregarRepuesto,
    actualizarRepuesto,
    eliminarRepuesto
};

// Inicializar el módulo al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initRepuestos();
});
