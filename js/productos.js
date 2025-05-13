// productos.js - Gestión de la base de datos de productos

// Base de datos de productos
let productos = [];

// Referencias a Firebase para productos
const productosRef = database.ref('productos');

// Inicializar el sistema de productos
function initProductos() {
    // Cargar productos desde Firebase
    productosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            productos = Object.values(data);
            console.log(`Base de datos de productos cargada: ${productos.length} productos`);
        } else {
            productos = [];
            console.log('No hay productos en la base de datos');
        }
    }, (error) => {
        console.error('Error al cargar productos:', error);
    });
}

// Buscar un producto por SKU
function buscarProductoPorSku(sku) {
    if (!sku) return null;
    return productos.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
}

// Buscar un producto por nombre
function buscarProductoPorNombre(nombre) {
    if (!nombre) return null;
    return productos.find(p => p.nombre && p.nombre.toLowerCase() === nombre.toLowerCase());
}

// Filtrar productos que coincidan con un término de búsqueda
function filtrarProductos(termino) {
    if (!termino) return [];
    termino = termino.toLowerCase();
    
    return productos.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(termino)) || 
        (p.sku && p.sku.toLowerCase().includes(termino))
    );
}

// Agregar un nuevo producto
async function agregarProducto(producto) {
    try {
        // Verificar si ya existe un producto con el mismo SKU
        const productoExistente = buscarProductoPorSku(producto.sku);
        if (productoExistente) {
            throw new Error(`Ya existe un producto con el SKU ${producto.sku}`);
        }
        
        // Generar un ID único
        const id = producto.id || Date.now().toString();
        producto.id = id;
        
        // Guardar en Firebase
        await productosRef.child(id).set(producto);
        
        return producto;
    } catch (error) {
        console.error('Error al agregar producto:', error);
        throw error;
    }
}

// Actualizar un producto existente
async function actualizarProducto(producto) {
    try {
        if (!producto.id) {
            throw new Error('El producto no tiene ID');
        }
        
        // Verificar si el SKU ya está en uso por otro producto
        const productoExistente = buscarProductoPorSku(producto.sku);
        if (productoExistente && productoExistente.id !== producto.id) {
            throw new Error(`Ya existe otro producto con el SKU ${producto.sku}`);
        }
        
        // Actualizar en Firebase
        await productosRef.child(producto.id).update(producto);
        
        return producto;
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        throw error;
    }
}

// Eliminar un producto
async function eliminarProducto(id) {
    try {
        await productosRef.child(id).remove();
        return true;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        throw error;
    }
}

// Importar productos desde un archivo CSV
async function importarProductosDesdeCSV(contenidoCSV) {
    try {
        // Parse CSV
        const filas = contenidoCSV.split('\n');
        const encabezados = filas[0].split(',').map(h => h.trim());
        
        // Verificar encabezados mínimos
        const indexSKU = encabezados.findIndex(h => h.toLowerCase() === 'sku');
        const indexNombre = encabezados.findIndex(h => h.toLowerCase() === 'nombre' || h.toLowerCase() === 'producto');
        
        if (indexSKU === -1 || indexNombre === -1) {
            throw new Error('El CSV debe tener al menos las columnas "SKU" y "Nombre" o "Producto"');
        }
        
        // Procesar cada fila
        const productosImportados = [];
        const errores = [];
        
        for (let i = 1; i < filas.length; i++) {
            const fila = filas[i].trim();
            if (!fila) continue; // Saltar filas vacías
            
            const valores = parsearCSVRow(fila);
            
            if (valores.length < Math.max(indexSKU, indexNombre) + 1) {
                errores.push(`Fila ${i+1}: No tiene suficientes columnas`);
                continue;
            }
            
            const sku = valores[indexSKU].trim();
            const nombre = valores[indexNombre].trim();
            
            if (!sku || !nombre) {
                errores.push(`Fila ${i+1}: SKU o nombre vacío`);
                continue;
            }
            
            // Crear objeto de producto con todos los campos disponibles
            const producto = { id: Date.now().toString() + i, sku, nombre };
            
            // Añadir campos adicionales si existen en el CSV
            encabezados.forEach((encabezado, index) => {
                if (index !== indexSKU && index !== indexNombre && index < valores.length) {
                    const campo = encabezado.toLowerCase();
                    if (campo !== 'id') { // No permitir sobrescribir el ID
                        producto[campo] = valores[index].trim();
                    }
                }
            });
            
            try {
                // Verificar si ya existe
                const productoExistente = buscarProductoPorSku(sku);
                if (productoExistente) {
                    // Actualizar producto existente
                    producto.id = productoExistente.id;
                    await actualizarProducto(producto);
                    productosImportados.push({ ...producto, actualizado: true });
                } else {
                    // Agregar nuevo producto
                    await agregarProducto(producto);
                    productosImportados.push(producto);
                }
            } catch (error) {
                errores.push(`Fila ${i+1}: ${error.message}`);
            }
        }
        
        return { productosImportados, errores };
    } catch (error) {
        console.error('Error al importar productos:', error);
        throw error;
    }
}

// Función auxiliar para parsear una fila de CSV correctamente (maneja comillas, etc.)
function parsearCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current); // Añadir último valor
    return result;
}

// Exportar productos a CSV
function exportarProductosACSV() {
    try {
        // Crear encabezados
        let csv = 'SKU,Nombre,Descripción\n';
        
        // Añadir filas de productos
        productos.forEach(producto => {
            const sku = producto.sku?.replace(/"/g, '""') || '';
            const nombre = producto.nombre?.replace(/"/g, '""') || '';
            const descripcion = producto.descripcion?.replace(/"/g, '""') || '';
            
            csv += `"${sku}","${nombre}","${descripcion}"\n`;
        });
        
        return csv;
    } catch (error) {
        console.error('Error al exportar productos a CSV:', error);
        throw error;
    }
}

// Exportar funciones para uso en otros módulos
window.productosModule = {
    initProductos,
    buscarProductoPorSku,
    buscarProductoPorNombre,
    filtrarProductos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    importarProductosDesdeCSV,
    exportarProductosACSV,
    getProductos: () => [...productos]
};

// Inicializar el módulo
document.addEventListener('DOMContentLoaded', function() {
    initProductos();
});
