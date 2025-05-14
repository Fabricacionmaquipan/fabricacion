// bodega-repuestos.js - Manejo del autocompletado de repuestos en el panel de bodega

// Elementos DOM y variables relacionadas con autocomplete de repuestos
let skuInputs = [];
let productoInputs = [];
let lastSuggestions = [];

// Configurar autocompletado de repuestos
function setupRepuestosAutocompletado() {
    console.log("Configurando autocompletado de repuestos...");
    
    // Verificar que el módulo de repuestos esté disponible
    if (!window.repuestosModule) {
        console.error("Módulo de repuestos no encontrado. El autocompletado no funcionará.");
        return;
    }
    
    // Configurar autocompletado para los elementos existentes
    setupAutocompletadoEnItems();
    
    // Observar cambios en el contenedor de items para configurar autocompletado en nuevos elementos
    const itemsContainer = document.getElementById('items-container');
    if (itemsContainer) {
        const observador = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setupAutocompletadoEnItems();
                }
            });
        });
        
        // Iniciar observación del contenedor
        observador.observe(itemsContainer, { childList: true });
    }
    
    console.log("Autocompletado de repuestos configurado");
}

// Configurar autocompletado en todos los inputs de productos y SKUs
function setupAutocompletadoEnItems() {
    // Obtener todos los inputs actualizados
    skuInputs = document.querySelectorAll('.sku-input');
    productoInputs = document.querySelectorAll('.producto-input');
    
    // Primero cerrar cualquier menú de sugerencias abierto
    document.querySelectorAll('.producto-suggestions.show').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Configurar SKU inputs
    skuInputs.forEach(input => {
        if (!input.dataset.autocompleteSetup) {
            setupSkuInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
    
    // Configurar producto inputs
    productoInputs.forEach(input => {
        if (!input.dataset.autocompleteSetup) {
            setupProductoInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
    
    // Agregar manejador global para cerrar listas al hacer clic fuera
    if (!window.suggestionClickHandlerAdded) {
        document.addEventListener('click', function(e) {
            // Si el clic no fue dentro de un input o de una lista de sugerencias
            if (!e.target.closest('.sku-input') && 
                !e.target.closest('.producto-input') && 
                !e.target.closest('.producto-suggestions')) {
                // Cerrar todas las listas de sugerencias
                document.querySelectorAll('.producto-suggestions.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
        window.suggestionClickHandlerAdded = true;
    }
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
        
        // Buscar repuestos que coincidan con el SKU
        let sugerencias = [];
        
        // Primero intentar con repuestos si el módulo está disponible
        if (window.repuestosModule) {
            sugerencias = window.repuestosModule.filtrarRepuestosPorSku(sku);
        }
        
        // Si no hay suficientes sugerencias, buscar también en productos
        if (sugerencias.length < 5 && window.productosModule) {
            const sugerenciasProductos = window.productosModule.filtrarProductos(sku);
            // Añadir solo las que no estén ya en la lista
            sugerenciasProductos.forEach(producto => {
                if (!sugerencias.some(rep => rep.sku === producto.sku)) {
                    sugerencias.push(producto);
                }
            });
        }
        
        // Guardar las sugerencias para referencia
        lastSuggestions = sugerencias;
        
        mostrarSugerencias(suggestionsContainer, sugerencias, this, 'sku');
    });
    
    // Al hacer clic en el input
    input.addEventListener('click', function() {
        if (this.value.trim()) {
            let sugerencias = [];
            
            // Buscar en repuestos primero
            if (window.repuestosModule) {
                sugerencias = window.repuestosModule.filtrarRepuestosPorSku(this.value.trim());
            }
            
            // Complementar con productos
            if (sugerencias.length < 5 && window.productosModule) {
                const sugerenciasProductos = window.productosModule.filtrarProductos(this.value.trim());
                sugerenciasProductos.forEach(producto => {
                    if (!sugerencias.some(rep => rep.sku === producto.sku)) {
                        sugerencias.push(producto);
                    }
                });
            }
            
            // Guardar las sugerencias para referencia
            lastSuggestions = sugerencias;
            
            mostrarSugerencias(suggestionsContainer, sugerencias, this, 'sku');
        }
    });
    
    // Al perder el foco, verificar si el SKU existe y autocompletar nombre
    input.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.classList.remove('show');
            
            const sku = this.value.trim();
            if (!sku) return;
            
            let producto = null;
            
            // Buscar primero en repuestos
            if (window.repuestosModule) {
                producto = window.repuestosModule.buscarRepuestoPorSku(sku);
            }
            
            // Si no se encuentra, buscar en productos
            if (!producto && window.productosModule) {
                producto = window.productosModule.buscarProductoPorSku(sku);
            }
            
            if (producto) {
                // Encontrar el input de nombre de producto correspondiente
                const itemRow = this.closest('.item-row');
                const productoInput = itemRow.querySelector('.producto-input');
                if (productoInput && productoInput.value !== producto.nombre) {
                    productoInput.value = producto.nombre;
                    // Añadir clase visual de autocompletado
                    productoInput.classList.add('autocompleted');
                    setTimeout(() => productoInput.classList.remove('autocompleted'), 1500);
                }
            }
        }, 200);
    });
    
    // Gestionar navegación con teclado y selección
    input.addEventListener('keydown', function(e) {
        manejarNavegacionTeclado(e, suggestionsContainer, this, 'sku');
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
        let sugerencias = [];
        
        // Primero intentar con repuestos si el módulo está disponible
        if (window.repuestosModule) {
            sugerencias = window.repuestosModule.filtrarRepuestosPorNombre(nombre);
        }
        
        // Si no hay suficientes sugerencias, buscar también en productos
        if (sugerencias.length < 5 && window.productosModule) {
            const sugerenciasProductos = window.productosModule.filtrarProductos(nombre);
            // Añadir solo las que no estén ya en la lista
            sugerenciasProductos.forEach(producto => {
                if (!sugerencias.some(rep => rep.nombre === producto.nombre)) {
                    sugerencias.push(producto);
                }
            });
        }
        
        // Guardar las sugerencias para referencia
        lastSuggestions = sugerencias;
        
        mostrarSugerencias(suggestionsContainer, sugerencias, this, 'producto');
    });
    
    // Al hacer clic en el input
    input.addEventListener('click', function() {
        if (this.value.trim()) {
            let sugerencias = [];
            
            // Buscar en repuestos primero
            if (window.repuestosModule) {
                sugerencias = window.repuestosModule.filtrarRepuestosPorNombre(this.value.trim());
            }
            
            // Complementar con productos
            if (sugerencias.length < 5 && window.productosModule) {
                const sugerenciasProductos = window.productosModule.filtrarProductos(this.value.trim());
                sugerenciasProductos.forEach(producto => {
                    if (!sugerencias.some(rep => rep.nombre === producto.nombre)) {
                        sugerencias.push(producto);
                    }
                });
            }
            
            // Guardar las sugerencias para referencia
            lastSuggestions = sugerencias;
            
            mostrarSugerencias(suggestionsContainer, sugerencias, this, 'producto');
        }
    });
    
    // Al perder el foco, verificar si el nombre existe y autocompletar SKU
    input.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.classList.remove('show');
            
            const nombre = this.value.trim();
            if (!nombre) return;
            
            let producto = null;
            
            // Buscar primero en repuestos
            if (window.repuestosModule) {
                producto = window.repuestosModule.buscarRepuestoPorNombre(nombre);
            }
            
            // Si no se encuentra, buscar en productos
            if (!producto && window.productosModule) {
                producto = window.productosModule.buscarProductoPorNombre(nombre);
            }
            
            if (producto) {
                // Encontrar el input de SKU correspondiente
                const itemRow = this.closest('.item-row');
                const skuInput = itemRow.querySelector('.sku-input');
                if (skuInput && skuInput.value !== producto.sku) {
                    skuInput.value = producto.sku;
                    // Añadir clase visual de autocompletado
                    skuInput.classList.add('autocompleted');
                    setTimeout(() => skuInput.classList.remove('autocompleted'), 1500);
                }
            }
        }, 200);
    });
    
    // Gestionar navegación con teclado y selección
    input.addEventListener('keydown', function(e) {
        manejarNavegacionTeclado(e, suggestionsContainer, this, 'producto');
    });
}

// Mostrar sugerencias en el contenedor
function mostrarSugerencias(container, sugerencias, inputOrigen, tipo) {
    // Limpiar y ocultar si no hay sugerencias
    if (!sugerencias || sugerencias.length === 0) {
        container.innerHTML = '';
        container.classList.remove('show');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Asegurar que el contenedor esté por encima de otros elementos
    container.style.zIndex = '2000';
    
    // Crear elementos para cada sugerencia
    sugerencias.forEach((producto, index) => {
        const item = document.createElement('div');
        item.className = 'producto-suggestion-item';
        item.dataset.index = index;
        
        // Añadir clase de categoría si existe (solo para repuestos)
        if (producto.categoria) {
            item.classList.add('repuesto-item');
        }
        
        item.innerHTML = `
            <div class="suggestion-sku">${producto.sku || ''}</div>
            <div class="suggestion-nombre">${producto.nombre || ''}</div>
            ${producto.categoria ? `<small class="suggestion-categoria">${producto.categoria}</small>` : ''}
        `;
        
        // Al hacer clic en una sugerencia
        item.addEventListener('click', () => {
            seleccionarSugerencia(producto, inputOrigen, tipo);
        });
        
        container.appendChild(item);
    });
    
    // Ajustar posición del contenedor de sugerencias
    posicionarContainerSugerencias(container, inputOrigen);
    
    // Mostrar contenedor
    container.classList.add('show');
}

// Posicionar el contenedor de sugerencias
function posicionarContainerSugerencias(container, input) {
    if (window.innerWidth >= 768) {
        // En desktop, posicionar debajo del input
        container.style.width = input.offsetWidth + 'px';
        
        // Asegurar que el contenedor está posicionado correctamente
        const inputRect = input.getBoundingClientRect();
        const parentRect = input.parentElement.getBoundingClientRect();
        
        // Resetear posiciones y propiedades que puedan interferir
        container.style.position = 'absolute';
        container.style.top = '100%';
        container.style.left = '0';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
    } else {
        // En móviles, usar la posición definida en CSS para overlay centrado
        container.style.width = '90%';
        container.style.maxHeight = '40vh';
    }
    
    // Asegurar que el z-index es suficientemente alto
    container.style.zIndex = '2000';
}

// Seleccionar una sugerencia
function seleccionarSugerencia(producto, inputOrigen, tipo) {
    // Determinar qué tipo de input es el origen
    const esSkuInput = tipo === 'sku';
    const itemRow = inputOrigen.closest('.item-row');
    
    if (esSkuInput) {
        // Completar input de SKU
        inputOrigen.value = producto.sku || '';
        
        // Completar input de nombre de producto
        const productoInput = itemRow.querySelector('.producto-input');
        if (productoInput) {
            productoInput.value = producto.nombre || '';
            // Añadir clase visual de autocompletado
            productoInput.classList.add('autocompleted');
            setTimeout(() => productoInput.classList.remove('autocompleted'), 1500);
        }
    } else {
        // Completar input de nombre de producto
        inputOrigen.value = producto.nombre || '';
        
        // Completar input de SKU
        const skuInput = itemRow.querySelector('.sku-input');
        if (skuInput) {
            skuInput.value = producto.sku || '';
            // Añadir clase visual de autocompletado
            skuInput.classList.add('autocompleted');
            setTimeout(() => skuInput.classList.remove('autocompleted'), 1500);
        }
    }
    
    // Ocultar sugerencias
    const suggestionsContainer = inputOrigen.parentElement.querySelector('.producto-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('show');
    }
    
    // Mover foco al input de cantidad
    const cantidadInput = itemRow.querySelector('input[name="cantidad[]"]');
    if (cantidadInput) {
        cantidadInput.focus();
    }
}

// Manejar navegación con teclado en el dropdown
function manejarNavegacionTeclado(e, container, input, tipo) {
    // Si el dropdown no está visible, no hacer nada
    if (!container.classList.contains('show')) return;
    
    const items = container.querySelectorAll('.producto-suggestion-item');
    if (items.length === 0) return;
    
    let activeItem = container.querySelector('.producto-suggestion-item.active');
    let activeIndex = -1;
    
    if (activeItem) {
        // Encontrar índice del item activo
        activeIndex = parseInt(activeItem.dataset.index);
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
                const selectedIndex = parseInt(activeItem.dataset.index);
                if (selectedIndex >= 0 && selectedIndex < lastSuggestions.length) {
                    seleccionarSugerencia(lastSuggestions[selectedIndex], input, tipo);
                }
            }
            break;
            
        case 'Escape':
            // Cerrar dropdown
            e.preventDefault();
            container.classList.remove('show');
            break;
            
        case 'Tab':
            // Cerrar dropdown al tabular (comportamiento natural)
            container.classList.remove('show');
            break;
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Si el módulo de repuestos está disponible
    if (window.repuestosModule) {
        setupRepuestosAutocompletado();
    } else {
        // Esperar a que se cargue el módulo de repuestos
        document.addEventListener('repuestosCargados', function() {
            setupRepuestosAutocompletado();
        });
    }
    
    // Agregar una hoja de estilos adicional para garantizar la visualización correcta
    agregarEstilosCorregidos();
});

// Agregar estilos corregidos para asegurar visualización correcta
function agregarEstilosCorregidos() {
    const style = document.createElement('style');
    style.textContent = `
        /* Correcciones para el menú desplegable */
        .producto-suggestions {
            z-index: 2000 !important;
            position: absolute !important;
        }
        
        .producto-suggestions.show {
            display: block !important;
        }
        
        @media (max-width: 767.98px) {
            .producto-suggestions {
                position: fixed !important;
                top: auto !important;
                bottom: 20% !important;
                left: 5% !important;
                right: 5% !important;
                width: 90% !important;
            }
        }
        
        /* Asegurar que los contenedores tienen posición relativa */
        .item-row .col-md-3,
        .item-row .col-md-4 {
            position: relative !important;
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones al ámbito global
window.bodegaRepuestos = {
    setupRepuestosAutocompletado,
    setupAutocompletadoEnItems,
    mostrarSugerencias,
    seleccionarSugerencia
};
