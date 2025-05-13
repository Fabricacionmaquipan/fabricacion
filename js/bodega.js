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
    
    // Configurar autocompletado de productos si el módulo está disponible
    if (window.productosModule) {
        setupProductoAutocompletado();
    }
    
    // Actualizar encabezado de la tabla para incluir nuevas columnas
    setTimeout(actualizarEncabezadoTablaBodega, 1000);
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
                <td colspan="6" class="text-center py-4">
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
                <td colspan="6" class="text-center py-4">
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
            <td data-label="Cliente">${solicitud.cliente || 'No especificado'}</td>
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
}

// Actualizar encabezado de la tabla de solicitudes en el panel de bodega
function actualizarEncabezadoTablaBodega() {
    // Buscar la tabla
    const tablaBodega = document.querySelector('#bodega-panel table thead tr');
    
    if (tablaBodega) {
        // Actualizar encabezados
        tablaBodega.innerHTML = `
            <th>ID</th>
            <th>Nota Venta</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
        `;
    }
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
    const cliente = document.getElementById('cliente').value;
    const local = document.getElementById('local').value;
    
    // Obtener productos, SKUs y cantidades
    const productos = [];
    const skus = [];
    const cantidades = [];
    
    const productosInputs = document.querySelectorAll('input[name="producto[]"]');
    const skuInputs = document.querySelectorAll('input[name="sku[]"]');
    const cantidadesInputs = document.querySelectorAll('input[name="cantidad[]"]');
    
    for (let i = 0; i < productosInputs.length; i++) {
        const producto = productosInputs[i].value.trim();
        const sku = skuInputs[i] ? skuInputs[i].value.trim() : '';
        const cantidad = parseInt(cantidadesInputs[i].value);
        
        if (producto && !isNaN(cantidad) && cantidad > 0) {
            productos.push(producto);
            skus.push(sku);
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
        cliente: cliente,
        local: local,
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
            sku: skus[i],
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
        const firstSkuInput = document.querySelector('input[name="sku[]"]');
        const firstCantidadInput = document.querySelector('input[name="cantidad[]"]');
        if (firstProductInput) firstProductInput.value = '';
        if (firstSkuInput) firstSkuInput.value = '';
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
            <div class="col-md-3 position-relative">
                <input type="text" class="form-control sku-input" placeholder="SKU" name="sku[]" autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-4 position-relative">
                <input type="text" class="form-control producto-input" placeholder="Nombre del producto" name="producto[]" required autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-3">
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
    
    // Configurar autocompletado para el nuevo item
    setupAutocompletadoEnItems();
    
    // Hacer scroll al nuevo elemento en móviles
    if (window.innerWidth < 768) {
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Focus en el input de SKU
    setTimeout(() => {
        const input = newRow.querySelector('.sku-input');
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

// Configurar autocompletado de productos
function setupProductoAutocompletado() {
    // Configurar autocompletado para los elementos existentes
    setupAutocompletadoEnItems();
    
    // Observar cambios en el contenedor de items para configurar autocompletado en nuevos elementos
    const observador = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                setupAutocompletadoEnItems();
            }
        });
    });
    
    // Iniciar observación del contenedor
    if (itemsContainer) {
        observador.observe(itemsContainer, { childList: true });
    }
}

// Configurar autocompletado en todos los inputs de productos y SKUs
function setupAutocompletadoEnItems() {
    // Configurar SKU inputs
    document.querySelectorAll('.sku-input').forEach(input => {
        if (!input.dataset.autocompleteSetup) {
            setupSkuInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
    
    // Configurar producto inputs
    document.querySelectorAll('.producto-input').forEach(input => {
        if (!input.dataset.autocompleteSetup) {
            setupProductoInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
}

// Configurar input de SKU
function setupSkuInput(input) {
    // Elemento de sugerencias para este input
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    
    // Al escribir en el input de SKU
    input.addEventListener('input', function() {
        const sku = this.value.trim();
        
        // Si no hay valor, ocultar sugerencias
        if (!sku) {
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        // Buscar productos que coincidan con el SKU
        const sugerencias = buscarProductosPorSku(sku);
        mostrarSugerencias(suggestionsContainer, sugerencias, this);
    });
    
    // Al hacer clic o presionar Enter en el input
    input.addEventListener('click', function() {
        if (this.value.trim()) {
            const sugerencias = buscarProductosPorSku(this.value.trim());
            mostrarSugerencias(suggestionsContainer, sugerencias, this);
        }
    });
    
    // Al perder el foco, verificar si el SKU existe y autocompletar nombre
    input.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.classList.remove('show');
            
            const sku = this.value.trim();
            if (sku && window.productosModule) {
                const producto = window.productosModule.buscarProductoPorSku(sku);
                if (producto) {
                    // Encontrar el input de nombre de producto correspondiente
                    const itemRow = this.closest('.item-row');
                    const productoInput = itemRow.querySelector('.producto-input');
                    if (productoInput) {
                        productoInput.value = producto.nombre;
                    }
                }
            }
        }, 200);
    });
    
    // Gestionar navegación con teclado y selección
    input.addEventListener('keydown', function(e) {
        manejarNavegacionTeclado(e, suggestionsContainer, this);
    });
}

// Configurar input de nombre de producto
function setupProductoInput(input) {
    // Elemento de sugerencias para este input
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    
    // Al escribir en el input de producto
    input.addEventListener('input', function() {
        const nombre = this.value.trim();
        
        // Si no hay valor, ocultar sugerencias
        if (!nombre) {
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        // Buscar productos que coincidan con el nombre
        const sugerencias = buscarProductosPorNombre(nombre);
        mostrarSugerencias(suggestionsContainer, sugerencias, this);
    });
    
    // Al hacer clic o presionar Enter en el input
    input.addEventListener('click', function() {
        if (this.value.trim()) {
            const sugerencias = buscarProductosPorNombre(this.value.trim());
            mostrarSugerencias(suggestionsContainer, sugerencias, this);
        }
    });
    
    // Al perder el foco, verificar si el nombre existe y autocompletar SKU
    input.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.classList.remove('show');
            
            const nombre = this.value.trim();
            if (nombre && window.productosModule) {
                const producto = window.productosModule.buscarProductoPorNombre(nombre);
                if (producto) {
                    // Encontrar el input de SKU correspondiente
                    const itemRow = this.closest('.item-row');
                    const skuInput = itemRow.querySelector('.sku-input');
                    if (skuInput) {
                        skuInput.value = producto.sku;
                    }
                }
            }
        }, 200);
    });
    
    // Gestionar navegación con teclado y selección
    input.addEventListener('keydown', function(e) {
        manejarNavegacionTeclado(e, suggestionsContainer, this);
    });
}

// Buscar productos por SKU
function buscarProductosPorSku(sku) {
    if (!window.productosModule) return [];
    
    // Filtrar productos que coincidan con el SKU
    return window.productosModule.getProductos().filter(producto => 
        producto.sku && producto.sku.toLowerCase().includes(sku.toLowerCase())
    ).slice(0, 10); // Mostrar solo los primeros 10 resultados
}

// Buscar productos por nombre
function buscarProductosPorNombre(nombre) {
    if (!window.productosModule) return [];
    
    // Filtrar productos que coincidan con el nombre
    return window.productosModule.getProductos().filter(producto => 
        producto.nombre && producto.nombre.toLowerCase().includes(nombre.toLowerCase())
    ).slice(0, 10); // Mostrar solo los primeros 10 resultados
}

// Mostrar sugerencias en el contenedor
function mostrarSugerencias(container, sugerencias, inputOrigen) {
    // Limpiar y ocultar si no hay sugerencias
    if (!sugerencias || sugerencias.length === 0) {
        container.innerHTML = '';
        container.classList.remove('show');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear elementos para cada sugerencia
    sugerencias.forEach(producto => {
        const item = document.createElement('div');
        item.className = 'producto-suggestion-item';
        item.innerHTML = `
            <div class="suggestion-sku">${producto.sku}</div>
            <div class="suggestion-nombre">${producto.nombre}</div>
        `;
        
        // Al hacer clic en una sugerencia
        item.addEventListener('click', () => {
            // Determinar qué tipo de input es el origen
            const esSkuInput = inputOrigen.classList.contains('sku-input');
            const itemRow = inputOrigen.closest('.item-row');
            
            if (esSkuInput) {
                // Completar input de SKU
                inputOrigen.value = producto.sku;
                
                // Completar input de nombre de producto
                const productoInput = itemRow.querySelector('.producto-input');
                if (productoInput) {
                    productoInput.value = producto.nombre;
                }
            } else {
                // Completar input de nombre de producto
                inputOrigen.value = producto.nombre;
                
                // Completar input de SKU
                const skuInput = itemRow.querySelector('.sku-input');
                if (skuInput) {
                    skuInput.value = producto.sku;
                }
            }
            
            // Ocultar sugerencias
            container.classList.remove('show');
            
            // Mover foco al input de cantidad
            const cantidadInput = itemRow.querySelector('input[name="cantidad[]"]');
            if (cantidadInput) {
                cantidadInput.focus();
            }
        });
        
        container.appendChild(item);
    });
    
    // Mostrar contenedor
    container.classList.add('show');
}

// Manejar navegación con teclado en el dropdown
function manejarNavegacionTeclado(e, container, input) {
    // Si el dropdown no está visible, no hacer nada
    if (!container.classList.contains('show')) return;
    
    const items = container.querySelectorAll('.producto-suggestion-item');
    let activeItem = container.querySelector('.producto-suggestion-item.active');
    let activeIndex = -1;
    
    if (activeItem) {
        // Encontrar índice del item activo
        for (let i = 0; i < items.length; i++) {
            if (items[i] === activeItem) {
                activeIndex = i;
                break;
            }
        }
    }
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            // Ir al siguiente item
            if (activeItem) {
                activeItem.classList.remove('active');
                activeIndex = (activeIndex + 1) % items.length;
            } else {
                activeIndex = 0;
            }
            items[activeIndex].classList.add('active');
            items[activeIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            // Ir al item anterior
            if (activeItem) {
                activeItem.classList.remove('active');
                activeIndex = (activeIndex - 1 + items.length) % items.length;
            } else {
                activeIndex = items.length - 1;
            }
            items[activeIndex].classList.add('active');
            items[activeIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'Enter':
            // Seleccionar item activo
            if (activeItem) {
                e.preventDefault();
                activeItem.click();
            }
            break;
            
        case 'Escape':
            // Cerrar dropdown
            e.preventDefault();
            container.classList.remove('show');
            break;
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
    
    // Configurar autocompletado de productos
    if (window.productosModule) {
        setupProductoAutocompletado();
    }
});
