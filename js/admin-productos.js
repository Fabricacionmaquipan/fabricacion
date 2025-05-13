// admin-productos.js - Gestión de productos en el panel de administración (continuación)

// Cargar tabla de productos
function cargarTablaProductos() {
    if (!tablaProductos || !window.productosModule) return;
    
    // Obtener productos
    const productosLista = window.productosModule.getProductos();
    
    // Filtrar productos
    let productosFiltrados = productosLista;
    if (filterTermProductos) {
        productosFiltrados = productosLista.filter(p => 
            (p.sku && p.sku.toLowerCase().includes(filterTermProductos)) ||
            (p.nombre && p.nombre.toLowerCase().includes(filterTermProductos)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(filterTermProductos))
        );
    }
    
    // Paginar productos
    const ITEMS_PER_PAGE = 10;
    const startIndex = (currentPageProductos - 1) * ITEMS_PER_PAGE;
    const productosPaginados = productosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalItems = productosFiltrados.length;
    
    // Limpiar tabla
    tablaProductos.innerHTML = '';
    
    // Verificar si hay productos
    if (productosPaginados.length === 0) {
        tablaProductos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-box-open text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay productos disponibles</p>
                        ${filterTermProductos ? '<small class="text-muted">Intenta con otra búsqueda</small>' : ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Mostrar productos
    productosPaginados.forEach(producto => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td data-label="SKU">${producto.sku}</td>
            <td data-label="Nombre">${producto.nombre}</td>
            <td data-label="Descripción">${producto.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td data-label="Acciones">
                <div class="btn-group">
                    <button class="btn btn-sm btn-warning btn-editar-producto" data-id="${producto.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar-producto" data-id="${producto.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tablaProductos.appendChild(tr);
    });
    
    // Actualizar paginación
    createPaginationControls(
        '#productos-content .card-footer',
        totalItems,
        currentPageProductos,
        handlePageChangeProductos,
        'productos'
    );
}

// Manejar cambio de página
function handlePageChangeProductos(newPage) {
    currentPageProductos = newPage;
    cargarTablaProductos();
}

// Exportar funciones para uso en otros módulos
window.adminProductos = {
    initAdminProductos,
    cargarTablaProductos
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en el panel de administración
    if (document.getElementById('admin-panel')) {
        initAdminProductos();
    }
});
