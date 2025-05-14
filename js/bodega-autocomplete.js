// bodega-autocomplete.js - Implementación completa de autocompletado como modal

// Variables globales para el sistema de autocompletado
let currentInputElement = null;  // Referencia al input que activó el autocompletado
let currentInputType = null;     // Tipo de input (sku o producto)
let currentSuggestions = [];     // Sugerencias actuales
let overlayElement = null;       // Elemento overlay
let autocompleteModal = null;    // Elemento modal de autocompletado

// Inicializar el sistema de autocompletado
function initAutocompleteSistema() {
    console.log("Inicializando sistema de autocompletado...");
    
    // Crear elementos del modal y overlay (una sola vez)
    createAutocompleteElements();
    
    // Añadir listeners a los inputs existentes
    setupInputListeners();
    
    // Observar cambios en el DOM para añadir listeners a nuevos inputs
    setupMutationObserver();
    
    console.log("Sistema de autocompletado inicializado");
}

// Crear elementos del modal y overlay
function createAutocompleteElements() {
    // Verificar si ya existen
    if (document.getElementById('autocomplete-overlay') && 
        document.getElementById('autocomplete-modal')) {
        return;
    }
    
    // Crear overlay
    overlayElement = document.createElement('div');
    overlayElement.id = 'autocomplete-overlay';
    overlayElement.className = 'autocomplete-overlay';
    overlayElement.addEventListener('click', closeAutocomplete);
    
    // Crear modal
    autocompleteModal = document.createElement('div');
    autocompleteModal.id = 'autocomplete-modal';
    autocompleteModal.className = 'autocomplete-modal';
    autocompleteModal.innerHTML = `
        <div class="autocomplete-header">
            <span class="autocomplete-title">Seleccionar producto</span>
            <span class="autocomplete-close" onclick="closeAutocomplete()">&times;</span>
        </div>
        <div class="autocomplete-content">
            <div class="autocomplete-items"></div>
        </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(overlayElement);
    document.body.appendChild(autocompleteModal);
    
    // Añadir estilos
    addAutoCompleteStyles();
}

// Añadir estilos para el autocompletado
function addAutoCompleteStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .autocomplete-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9990;
            display: none;
        }
        
        .autocomplete-overlay.show {
            display: block;
        }
        
        .autocomplete-modal {
            position: fixed;
            z-index: 9999;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            width: 80%;
            max-width: 350px;
            max-height: 80%;
            display: none;
            flex-direction: column;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            overflow: hidden;
        }
        
        .autocomplete-modal.show {
            display: flex;
        }
        
        .autocomplete-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background-color: #4361ee;
            color: white;
            font-weight: bold;
        }
        
        .autocomplete-close {
            cursor: pointer;
            font-size: 1.5em;
            line-height: 0.8;
        }
        
        .autocomplete-content {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }
        
        .autocomplete-items {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        
        .autocomplete-item {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        
        .autocomplete-item:hover, .autocomplete-item.active {
            background-color: #f0f4ff;
        }
        
        .autocomplete-item:last-child {
            border-bottom: none;
        }
        
        .autocomplete-sku {
            font-weight: bold;
            color: #4361ee;
            margin-bottom: 3px;
        }
        
        .autocomplete-nombre {
            font-size: 0.9em;
        }
        
        .autocomplete-categoria {
            font-size: 0.8em;
            color: #28a745;
            margin-top: 3px;
        }
        
        /* Estilos para inputs con autocompletado */
        .sku-input.autocompleted, .producto-input.autocompleted {
            background-color: #e8f5e9;
            border: 1px solid #4caf50;
            animation: pulse-green 1s;
        }
        
        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
    `;
    document.head.appendChild(style);
}

// Configurar listeners para los inputs existentes
function setupInputListeners() {
    // Obtener todos los inputs
    const skuInputs = document.querySelectorAll('.sku-input:not([data-autocomplete="setup"])');
    const productoInputs = document.querySelectorAll('.producto-input:not([data-autocomplete="setup"])');
    
    // Añadir listeners a los inputs de SKU
    skuInputs.forEach(input => {
        input.addEventListener('click', function() {
            showAutocompleteSuggestions(this, 'sku');
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim().length > 0) {
                showAutocompleteSuggestions(this, 'sku');
            }
        });
        
        input.dataset.autocomplete = 'setup';
    });
    
    // Añadir listeners a los inputs de producto
    productoInputs.forEach(input => {
        input.addEventListener('click', function() {
            showAutocompleteSuggestions(this, 'producto');
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim().length > 0) {
                showAutocompleteSuggestions(this, 'producto');
            }
        });
        
        input.dataset.autocomplete = 'setup';
    });
}

// Configurar un observer para detectar nuevos inputs
function setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
        let needsSetup = false;
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Elemento
                        // Verificar si tiene inputs de interés
                        if (node.querySelector('.sku-input:not([data-autocomplete="setup"])') ||
                            node.querySelector('.producto-input:not([data-autocomplete="setup"])')) {
                            needsSetup = true;
                        }
                    }
                });
            }
        });
        
        if (needsSetup) {
            setupInputListeners();
        }
    });
    
    // Observar cambios en todo el documento
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Mostrar sugerencias de autocompletado
function showAutocompleteSuggestions(inputElement, inputType) {
    // Guardar referencia al input actual
    currentInputElement = inputElement;
    currentInputType = inputType;
    
    // Obtener término de búsqueda
    const termino = inputElement.value.trim();
    
    // Buscar sugerencias
    let sugerencias = [];
    
    if (inputType === 'sku') {
        // Buscar por SKU
        if (window.repuestosModule) {
            sugerencias = window.repuestosModule.filtrarRepuestosPorSku(termino);
        }
        
        // Complementar con productos si es necesario
        if (sugerencias.length < 5 && window.productosModule) {
            const sugerenciasProductos = window.productosModule.filtrarProductos(termino);
            sugerenciasProductos.forEach(producto => {
                if (!sugerencias.some(rep => rep.sku === producto.sku)) {
                    sugerencias.push(producto);
                }
            });
        }
    } else {
        // Buscar por nombre de producto
        if (window.repuestosModule) {
            sugerencias = window.repuestosModule.filtrarRepuestosPorNombre(termino);
        }
        
        // Complementar con productos si es necesario
        if (sugerencias.length < 5 && window.productosModule) {
            const sugerenciasProductos = window.productosModule.filtrarProductos(termino);
            sugerenciasProductos.forEach(producto => {
                if (!sugerencias.some(rep => rep.nombre === producto.nombre)) {
                    sugerencias.push(producto);
                }
            });
        }
    }
    
    // Si no hay sugerencias y el término es corto, mostrar todos los repuestos como sugerencia
    if (sugerencias.length === 0 && termino.length < 3 && window.repuestosModule) {
        sugerencias = window.repuestosModule.getRepuestos().slice(0, 10);
    }
    
    // Guardar las sugerencias actuales
    currentSuggestions = sugerencias;
    
    // Si hay sugerencias, mostrar el modal
    if (sugerencias.length > 0) {
        showAutocompleteModal(sugerencias);
    }
}

// Mostrar el modal de autocompletado
function showAutocompleteModal(sugerencias) {
    // Obtener contenedor de items
    const itemsContainer = autocompleteModal.querySelector('.autocomplete-items');
    
    // Limpiar contenedor
    itemsContainer.innerHTML = '';
    
    // Crear elementos para cada sugerencia
    sugerencias.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'autocomplete-item';
        itemElement.dataset.index = index;
        
        itemElement.innerHTML = `
            <div class="autocomplete-sku">${item.sku || ''}</div>
            <div class="autocomplete-nombre">${item.nombre || ''}</div>
            ${item.categoria ? `<div class="autocomplete-categoria">${item.categoria}</div>` : ''}
        `;
        
        // Añadir evento de clic
        itemElement.addEventListener('click', function() {
            selectSuggestion(index);
        });
        
        itemsContainer.appendChild(itemElement);
    });
    
    // Actualizar título
    const title = autocompleteModal.querySelector('.autocomplete-title');
    if (title) {
        title.textContent = currentInputType === 'sku' ? 
            'Seleccionar por SKU' : 'Seleccionar producto';
    }
    
    // Mostrar overlay y modal
    overlayElement.classList.add('show');
    autocompleteModal.classList.add('show');
    
    // Configurar navegación con teclado
    setupKeyboardNavigation();
}

// Configurar navegación con teclado
function setupKeyboardNavigation() {
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Manejar navegación con teclado
function handleKeyboardNavigation(e) {
    // Solo si el modal está visible
    if (!autocompleteModal.classList.contains('show')) {
        document.removeEventListener('keydown', handleKeyboardNavigation);
        return;
    }
    
    const items = autocompleteModal.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;
    
    let activeItem = autocompleteModal.querySelector('.autocomplete-item.active');
    let activeIndex = -1;
    
    if (activeItem) {
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
                selectSuggestion(activeIndex);
            }
            break;
            
        case 'Escape':
            // Cerrar modal
            e.preventDefault();
            closeAutocomplete();
            break;
    }
}

// Seleccionar una sugerencia
function selectSuggestion(index) {
    // Obtener sugerencia
    const sugerencia = currentSuggestions[index];
    
    if (!sugerencia || !currentInputElement) {
        closeAutocomplete();
        return;
    }
    
    // Obtener fila del input
    const itemRow = currentInputElement.closest('.item-row');
    
    // Actualizar valores según el tipo de input
    if (currentInputType === 'sku') {
        // Actualizar SKU
        currentInputElement.value = sugerencia.sku || '';
        
        // Actualizar nombre de producto
        const productoInput = itemRow.querySelector('.producto-input');
        if (productoInput) {
            productoInput.value = sugerencia.nombre || '';
            
            // Añadir clase visual de autocompletado
            productoInput.classList.add('autocompleted');
            setTimeout(() => productoInput.classList.remove('autocompleted'), 2000);
        }
    } else {
        // Actualizar nombre de producto
        currentInputElement.value = sugerencia.nombre || '';
        
        // Actualizar SKU
        const skuInput = itemRow.querySelector('.sku-input');
        if (skuInput) {
            skuInput.value = sugerencia.sku || '';
            
            // Añadir clase visual de autocompletado
            skuInput.classList.add('autocompleted');
            setTimeout(() => skuInput.classList.remove('autocompleted'), 2000);
        }
    }
    
    // Añadir clase visual de autocompletado al input actual
    currentInputElement.classList.add('autocompleted');
    setTimeout(() => currentInputElement.classList.remove('autocompleted'), 2000);
    
    // Cerrar el modal
    closeAutocomplete();
    
    // Enfocar en el campo de cantidad
    const cantidadInput = itemRow.querySelector('input[name="cantidad[]"]');
    if (cantidadInput) {
        setTimeout(() => cantidadInput.focus(), 100);
    }
}

// Cerrar el autocompletado
function closeAutocomplete() {
    // Ocultar overlay y modal
    overlayElement.classList.remove('show');
    autocompleteModal.classList.remove('show');
    
    // Eliminar listener de teclado
    document.removeEventListener('keydown', handleKeyboardNavigation);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Si el módulo de repuestos está disponible
    if (window.repuestosModule) {
        initAutocompleteSistema();
    } else {
        // Esperar a que se cargue el módulo de repuestos
        document.addEventListener('repuestosCargados', function() {
            initAutocompleteSistema();
        });
    }
});

// Exportar funciones al ámbito global
window.bodegaAutocomplete = {
    initAutocompleteSistema,
    showAutocompleteSuggestions,
    closeAutocomplete
};
