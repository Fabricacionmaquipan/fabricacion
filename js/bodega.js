// Funciones específicas del panel de bodega

// Elementos DOM de Bodega
const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const tablaSolicitudesBodega = document.getElementById('tabla-solicitudes-bodega');

// Variables para paginación y filtrado
let currentPageBodega = 1;
let filterTermBodega = '';
let filterStatusBodega = 'all';

// Función para establecer la fecha actual en el formulario
function setFechaActual() {
    const fechaInput = document.getElementById('fecha-solicitud');
    if (fechaInput) {
        // Obtener fecha actual en formato YYYY-MM-DD
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // +1 porque los meses van de 0 a 11
        const dia = String(hoy.getDate()).padStart(2, '0');
        
        const fechaFormateada = `${año}-${mes}-${dia}`;
        
        // Establecer el valor y hacer el campo de solo lectura
        fechaInput.value = fechaFormateada;
        fechaInput.setAttribute('readonly', 'readonly');
    }
}

// Configurar event listeners específicos de bodega
function setupBodegaListeners() {
    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', handleNuevaSolicitud);
        
        // Establecer fecha actual cada vez que se muestra el formulario
        setFechaActual();
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }
    
    // Evento delegado para remover items
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const button = e.target.classList.contains('remove-item') ? e.target : e.target.closest('.remove-item');
            removeItem(button);
        }
    });
    
    // Buscar en solicitudes
    const buscarInput = document.getElementById('buscar-solicitud-bodega');
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            filterTermBodega = e.target.value.toLowerCase();
            currentPageBodega = 1; // Reiniciar a primera página al buscar
            cargarDatosBodega();
        });
    }
    
    // Cuando se hace clic en el botón de "Nueva Solicitud", establecer la fecha actual
    const btnNuevaSolicitud = document.querySelector('[data-bs-target="#nueva-solicitud-container"]');
    if (btnNuevaSolicitud) {
        btnNuevaSolicitud.addEventListener('click', setFechaActual);
    }
    
    // Filtrar por estado
    const filtroDropdownItems = document.querySelectorAll('#bodega-panel .dropdown-item');
    if (filtroDropdownItems.length > 0) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Actualizar visual
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                
                // Establecer filtro según el texto
                const filterText = this.textContent.trim().toLowerCase();
                switch (filterText) {
                    case 'pendientes':
                        filterStatusBodega = 'pendientes';
                        break;
                    case 'en fabricación':
                        filterStatusBodega = 'fabricacion';
                        break;
                    case 'entregadas':
                        filterStatusBodega = 'entregadas';
                        break;
                    default:
                        filterStatusBodega = 'all';
                }
                
                // Actualizar texto del botón de filtro
                const filterButton = document.querySelector('#bodega-panel .dropdown-toggle');
                if (filterButton) {
                    filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${this.textContent.trim()}`;
                }
                
                currentPageBodega = 1; // Reiniciar a primera página al filtrar
                cargarDatosBodega();
            });
        });
    }
    
    // Configurar los botones de detalle y acción
    setupBodegaButtonListeners();
}

// Configurar listeners específicos para los botones de acción en la tabla
function setupBodegaButtonListeners() {
    // Si la tabla existe, configurar delegación de eventos para botones
    if (tablaSolicitudesBodega) {
        tablaSolicitudesBodega.addEventListener('click', (e) => {
            let targetButton = null;
            
            // Comprobar si el clic fue en el botón de detalles o en un elemento dentro del botón
            if (e.target.classList.contains('btn-detalle')) {
                targetButton = e.target;
            } else if (e.target.closest('.btn-detalle')) {
                targetButton = e.target.closest('.btn-detalle');
            }
            
            // Si encontramos un botón de detalle, mostrar el modal de detalles
            if (targetButton) {
                const solicitudId = targetButton.getAttribute('data-id');
                console.log("Botón detalle clickeado, ID:", solicitudId);
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                } else {
                    console.error("No se pudo mostrar el detalle. ID:", solicitudId, "Función disponible:", typeof window.showDetalleSolicitud);
                }
                e.preventDefault();
                e.stopPropagation();
            }
        });
    } else {
        console.warn("No se encontró la tabla de solicitudes de bodega para configurar listeners");
    }
}

// Cargar datos para el panel de Bodega
function cargarDatosBodega() {
    if (!tablaSolicitudesBodega) return;
    
    tablaSolicitudesBodega.innerHTML = '';
    
    if (solicitudes.length === 0) {
        tablaSolicitudesBodega.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No hay solicitudes registradas</p>
                        <small class="text-muted">Las solicitudes que crees aparecerán aquí</small>
                    </div>
                </td>
            </tr>
        `;
        
        // Ocultar paginación
        updateBodegaPagination(0);
        return;
    }
    
    // Paginar y filtrar solicitudes
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes, 
        currentPageBodega,
        filterTermBodega,
        filterStatusBodega
    );
    
    // Actualizar paginación
    updateBodegaPagination(totalItems);
    
    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesBodega.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="fas fa-search text-muted mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No se encontraron solicitudes</p>
                        <small class="text-muted">Intenta con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar clase según el estado
        if (solicitud.estado === 'Entregado') {
            tr.classList.add('table-success');
        } else if (solicitud.estado === 'En fabricación') {
            tr.classList.add('table-warning');
        }
        
        // Crear ID corto para mejor visualización
        const idCorto = solicitud.id.substring(solicitud.id.length - 6);
        
        tr.innerHTML = `
            <td data-label="ID">${idCorto}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta}</td>
            <td data-label="Fecha">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Estado">
                <span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span>
            </td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                    <i class="fas fa-eye me-1"></i>Detalles
                </button>
            </td>
        `;
        
        tablaSolicitudesBodega.appendChild(tr);
    });
    
    // Refrescar listeners después de cargar datos
    // No es necesario llamar a setupBodegaButtonListeners() aquí porque 
    // usamos delegación de eventos en la tabla misma
}

// Actualizar controles de paginación para bodega
function updateBodegaPagination(totalItems) {
    createPaginationControls(
        '#bodega-panel .card-footer',
        totalItems,
        currentPageBodega,
        handlePageChange,
        'bodega'
    );
}

// Manejar cambios de página
function handlePageChange(newPage, panelName) {
    if (panelName === 'bodega') {
        currentPageBodega = newPage;
        cargarDatosBodega();
    }
}

// Manejar el envío del formulario de nueva solicitud
async function handleNuevaSolicitud(e) {
    e.preventDefault();
    
    // Comprobación adicional para asegurar que estamos usando la fecha actual
    setFechaActual();
    
    mostrarSincronizacion('Enviando solicitud...');
    
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
        mostrarAlerta('Debe agregar al menos un producto.', 'danger');
        ocultarSincronizacion();
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
    
    try {
        // Guardar en Firebase
        await solicitudesRef.child(nuevaSolicitud.id).set(nuevaSolicitud);
        
        // Limpiar el formulario
        nuevaSolicitudForm.reset();
        
        // Limpiar los items excepto el primero
        const items = document.querySelectorAll('.item-row');
        for (let i = 1; i < items.length; i++) {
            items[i].remove();
        }
        
        // Restablecer el primer item
        const firstProductInput = document.querySelector('input[name="producto[]"]');
        const firstCantidadInput = document.querySelector('input[name="cantidad[]"]');
        if (firstProductInput) firstProductInput.value = '';
        if (firstCantidadInput) firstCantidadInput.value = '';
        
        // Restablecer la fecha actual para la próxima solicitud
        setFechaActual();
        
        // Ir a la primera página para ver la solicitud recién creada
        currentPageBodega = 1;
        
        mostrarAlerta('Solicitud creada correctamente.', 'success');
        ocultarSincronizacion();
        
        // Cerrar el formulario en móviles
        if (window.innerWidth < 768) {
            const nuevaSolicitudContainer = document.getElementById('nueva-solicitud-container');
            const bsCollapse = bootstrap.Collapse.getInstance(nuevaSolicitudContainer);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        }
        
    } catch (error) {
        console.error('Error al guardar la solicitud:', error);
        mostrarAlerta('Error al crear la solicitud. Por favor, inténtalo de nuevo.', 'danger');
        ocultarSincronizacion();
    }
}

// Agregar un nuevo item al formulario
function addItem() {
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-md-6">
                <input type="text" class="form-control" placeholder="Nombre del producto" name="producto[]" required>
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control" placeholder="Cantidad" name="cantidad[]" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger w-100 remove-item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    itemsContainer.appendChild(newRow);
    
    // Hacer scroll al nuevo elemento en móviles
    if (window.innerWidth < 768) {
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Focus en el input de producto
    setTimeout(() => {
        const input = newRow.querySelector('input[name="producto[]"]');
        if (input) input.focus();
    }, 100);
}

// Eliminar un item del formulario
function removeItem(button) {
    const row = button.closest('.item-row');
    
    // No eliminar si es el único item
    const items = document.querySelectorAll('.item-row');
    if (items.length > 1) {
        // Animación de eliminación
        row.style.transition = 'all 0.3s';
        row.style.opacity = '0';
        row.style.height = '0';
        
        setTimeout(() => {
            row.remove();
        }, 300);
    } else {
        mostrarAlerta('Debe haber al menos un producto.', 'warning');
    }
}

// Asegurarse de que la fecha se establezca cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Si el panel de bodega está visible al cargar la página, establecer la fecha
    const bodegaPanel = document.getElementById('bodega-panel');
    if (bodegaPanel && window.getComputedStyle(bodegaPanel).display !== 'none') {
        setFechaActual();
    }
    
    // También podemos asegurarnos de que los listeners están configurados
    setupBodegaButtonListeners();
});
