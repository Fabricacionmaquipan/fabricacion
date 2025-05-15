// Funciones específicas del panel de bodega

// Elementos DOM de Bodega
const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const tablaSolicitudesBodega = document.getElementById('tabla-solicitudes-bodega');
// Asegúrate que el campo de observaciones tenga un ID si quieres accederlo aquí
// const observacionesBodegaInput = document.getElementById('observaciones-bodega');


// Variables para paginación y filtrado
let currentPageBodega = 1;
let filterTermBodega = '';
let filterStatusBodega = 'all';

// Función para establecer la fecha actual en el formulario
function setFechaActual() {
    const fechaInput = document.getElementById('fecha-solicitud');
    if (fechaInput) {
        const hoy = new Date();
        // Formato YYYY-MM-DD para el input type="date"
        fechaInput.value = hoy.getFullYear() + '-' +
                           String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                           String(hoy.getDate()).padStart(2, '0');
        fechaInput.setAttribute('readonly', 'readonly');
    }
}

// Configurar event listeners específicos de bodega
function setupBodegaListeners() {
    if (nuevaSolicitudForm) {
        // El listener principal para 'submit' está en app.js (handleNuevaSolicitudConUsuario)
        // para centralizar la lógica de creación con el usuario actual.
        // Aquí solo nos aseguramos que la fecha se ponga al interactuar.
        setFechaActual();
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }

    if (itemsContainer) {
        itemsContainer.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-item');
            if (removeButton) {
                removeItem(removeButton);
            }
        });
    }

    const buscarInput = document.getElementById('buscar-solicitud-bodega');
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            filterTermBodega = e.target.value.toLowerCase();
            currentPageBodega = 1;
            cargarDatosBodega();
        });
    }

    const btnNuevaSolicitudToggle = document.querySelector('[data-bs-target="#nueva-solicitud-container"]');
    if (btnNuevaSolicitudToggle) {
        btnNuevaSolicitudToggle.addEventListener('click', setFechaActual);
    }

    const filtroDropdownItems = document.querySelectorAll('#bodega-panel .dropdown-item');
    if (filtroDropdownItems.length > 0) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                const filterText = this.textContent.trim().toLowerCase();
                const filterButton = this.closest('.dropdown').querySelector('.dropdown-toggle');

                switch (filterText) {
                    case 'pendientes': filterStatusBodega = 'pendientes'; break;
                    case 'en fabricación': filterStatusBodega = 'fabricacion'; break;
                    case 'entregadas': filterStatusBodega = 'entregadas'; break;
                    default: filterStatusBodega = 'all';
                }
                if(filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${this.textContent.trim()}`;
                currentPageBodega = 1;
                cargarDatosBodega();
            });
        });
    }

    setupBodegaButtonListeners(); // Para botones de detalle en la tabla

    // Autocompletado (asegúrate que los módulos base estén listos)
    if (typeof setupAutocompletadoEnItems === 'function') { // Esta función ahora vive en bodega.js
        // Configurar para items existentes al inicio y observar nuevos
        setupAutocompletadoEnItems();
        if (itemsContainer) {
            const observador = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.classList.contains('item-row')) {
                                setupAutocompletadoEnItems(node); // Configurar solo para la nueva fila
                            }
                        });
                    }
                });
            });
            observador.observe(itemsContainer, { childList: true });
        }
    }
}

function setupBodegaButtonListeners() {
    if (tablaSolicitudesBodega) {
        tablaSolicitudesBodega.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.btn-detalle');
            if (targetButton) {
                e.preventDefault();
                const solicitudId = targetButton.getAttribute('data-id');
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') { // De modals.js
                    window.showDetalleSolicitud(solicitudId);
                } else {
                    console.error("BODEGA.JS: No se pudo mostrar detalle. ID:", solicitudId);
                }
            }
        });
    } else {
        console.warn("BODEGA.JS: Tabla 'tabla-solicitudes-bodega' no encontrada.");
    }
}

function cargarDatosBodega() {
    if (!tablaSolicitudesBodega) {
        console.warn("BODEGA.JS: Elemento 'tabla-solicitudes-bodega' no encontrado.");
        return;
    }
    tablaSolicitudesBodega.innerHTML = '';

    if (typeof solicitudes === 'undefined' || typeof paginateAndFilterItems !== 'function') {
        console.error("BODEGA.JS: 'solicitudes' o 'paginateAndFilterItems' no disponibles.");
        tablaSolicitudesBodega.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">Error al cargar datos.</td></tr>`;
        updateBodegaPagination(0);
        return;
    }

    console.log("BODEGA.JS: Cargando datos bodega. Total solicitudes global:", solicitudes.length, "Filtros:", { term: filterTermBodega, status: filterStatusBodega });
    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        [...solicitudes], // Pasar una copia para no afectar el array global con el sort interno de paginateAndFilterItems
        currentPageBodega,
        filterTermBodega,
        filterStatusBodega
    );
    console.log("BODEGA.JS: Solicitudes paginadas:", solicitudesPaginadas.length, "Total filtradas:", totalItems);

    updateBodegaPagination(totalItems);

    if (totalItems === 0 && solicitudes.length > 0) { // Hay solicitudes pero ninguna coincide con el filtro
        tablaSolicitudesBodega.innerHTML = `<tr><td colspan="9" class="text-center py-4">No se encontraron solicitudes con los filtros aplicados.</td></tr>`;
        return;
    }
    if (solicitudes.length === 0) { // No hay ninguna solicitud en el sistema
        tablaSolicitudesBodega.innerHTML = `<tr><td colspan="9" class="text-center py-4">No hay solicitudes registradas.</td></tr>`;
        return;
    }


    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        if (solicitud.estado === 'Entregado') tr.classList.add('table-success');
        else if (solicitud.estado === 'En fabricación') tr.classList.add('table-warning');

        // USAR EL ID COMPLETO
        const idParaMostrar = solicitud.id || 'N/A';

        const fechaEstimada = solicitud.fechaEstimada ? formatDate(solicitud.fechaEstimada) : 'No establecida';
        let fechaEntrega = 'Pendiente';
        if (solicitud.fechaEntrega) {
            fechaEntrega = formatDate(solicitud.fechaEntrega);
        } else if (solicitud.estado === 'Entregado' && solicitud.historial) {
            const entregaHistorial = [...solicitud.historial].reverse().find(h => h.estado === 'Entregado' && h.fechaEntrega);
            if (entregaHistorial && entregaHistorial.fechaEntrega) {
                fechaEntrega = formatDate(entregaHistorial.fechaEntrega);
            }
        }

        tr.innerHTML = `
            <td data-label="ID">${idParaMostrar}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta || ''}</td>
            <td data-label="Cliente">${solicitud.cliente || 'N/A'}</td>
            <td data-label="Local">${solicitud.local || 'N/A'}</td>
            <td data-label="Fecha Solicitud">${formatDate(solicitud.fechaSolicitud)}</td>
            <td data-label="Fecha Estimada">${fechaEstimada}</td>
            <td data-label="Fecha Entrega">${fechaEntrega}</td>
            <td data-label="Estado"><span class="badge ${getStatusBadgeClass(solicitud.estado)}">${solicitud.estado}</span></td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                    <i class="fas fa-eye me-1"></i>Detalles
                </button>
            </td>
        `;
        tablaSolicitudesBodega.appendChild(tr);
    });
}

function actualizarEncabezadoTablaBodega() {
    const tablaBodegaTheadTr = document.querySelector('#bodega-panel table thead tr');
    if (tablaBodegaTheadTr) {
        tablaBodegaTheadTr.innerHTML = `
            <th>ID</th><th>Nota Venta</th><th>Cliente</th><th>Local</th>
            <th>Fecha Solicitud</th><th>Fecha Estimada</th><th>Fecha Entrega</th>
            <th>Estado</th><th>Acciones</th>
        `;
    }
}

function updateBodegaPagination(totalItems) {
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#bodega-panel .card-footer',
            totalItems,
            currentPageBodega,
            window.handlePageChange, // Usar la global de app.js
            'bodega'
        );
    }
}

// handleNuevaSolicitud ahora es manejada principalmente por app.js/handleNuevaSolicitudConUsuario
// Esta función en bodega.js podría eliminarse o usarse solo para validaciones de UI previas si fuera necesario.
// async function handleNuevaSolicitud(e) {
//     e.preventDefault();
//     console.log("BODEGA.JS: handleNuevaSolicitud llamada, pero la creación principal es en app.js.");
//     // La lógica de recolección de datos y envío a Firebase está en app.js/handleNuevaSolicitudConUsuario
//     // para incluir el currentUser.
// }

function addItem() {
    if (!itemsContainer) return;
    const newRow = document.createElement('div');
    newRow.className = 'item-row item-row-new mb-2'; // Agregado mb-2 para separación
    newRow.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-md-3 col-sm-12 position-relative">
                <label for="sku-${Date.now()}" class="form-label visually-hidden">SKU</label>
                <input type="text" id="sku-${Date.now()}" class="form-control sku-input" placeholder="SKU (Opcional)" name="sku[]" autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-4 col-sm-12 position-relative">
                <label for="producto-${Date.now()}" class="form-label visually-hidden">Nombre del producto</label>
                <input type="text" id="producto-${Date.now()}" class="form-control producto-input" placeholder="Nombre del producto" name="producto[]" required autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-3 col-sm-8">
                 <label for="cantidad-${Date.now()}" class="form-label visually-hidden">Cantidad</label>
                <input type="number" id="cantidad-${Date.now()}" class="form-control" placeholder="Cantidad" name="cantidad[]" min="1" required>
            </div>
            <div class="col-md-2 col-sm-4 d-flex align-items-end">
                <button type="button" class="btn btn-outline-danger w-100 remove-item" aria-label="Eliminar producto">
                    <i class="fas fa-trash-alt"></i> <span class="d-none d-md-inline">Eliminar</span>
                </button>
            </div>
        </div>
    `;
    itemsContainer.appendChild(newRow);
    if (typeof setupAutocompletadoEnItems === 'function') setupAutocompletadoEnItems(newRow);

    const productoInput = newRow.querySelector('.producto-input');
    if (productoInput) setTimeout(() => productoInput.focus(), 50);
}

function removeItem(button) {
    const row = button.closest('.item-row');
    if (!row || !itemsContainer) return;
    if (itemsContainer.querySelectorAll('.item-row').length > 1) {
        row.style.transition = 'opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
        row.style.opacity = '0';
        row.style.height = '0';
        row.style.marginTop = '0';
        row.style.marginBottom = '0';
        row.style.paddingTop = '0';
        row.style.paddingBottom = '0';
        setTimeout(() => { if(row.parentNode) row.remove(); }, 300);
    } else {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Debe haber al menos un producto.', 'warning');
    }
}

// --- LÓGICA DE AUTOCOMPLETADO ---
function setupAutocompletadoEnItems(scopeElement = document) {
    // Si se pasa un elemento (como una nueva fila), buscar solo dentro de él.
    // Sino, buscar en todo el documento (para la carga inicial).
    const currentScope = scopeElement === document ? itemsContainer : scopeElement;
    if(!currentScope) return;


    currentScope.querySelectorAll('.sku-input:not([data-autocomplete-setup="true"])').forEach(input => {
        setupSkuInputListeners(input);
        input.dataset.autocompleteSetup = 'true';
    });
    currentScope.querySelectorAll('.producto-input:not([data-autocomplete-setup="true"])').forEach(input => {
        setupProductoInputListeners(input);
        input.dataset.autocompleteSetup = 'true';
    });
}

function setupSkuInputListeners(input) {
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    if (!suggestionsContainer) return;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (!term) { suggestionsContainer.classList.remove('show'); return; }
        let sugerencias = [];
        if (window.repuestosModule && typeof window.repuestosModule.filtrarRepuestosPorTermino === 'function') {
            sugerencias = sugerencias.concat(window.repuestosModule.filtrarRepuestosPorTermino(term, 'sku'));
        }
        if (window.productosModule && typeof window.productosModule.filtrarProductosPorTermino === 'function') {
            const prodSugs = window.productosModule.filtrarProductosPorTermino(term, 'sku');
            prodSugs.forEach(p => { if(!sugerencias.some(s => s.sku === p.sku)) sugerencias.push(p);});
        }
        mostrarSugerenciasUI(suggestionsContainer, sugerencias.slice(0, 7), this);
    });
    input.addEventListener('blur', () => setTimeout(() => {
        if(suggestionsContainer) suggestionsContainer.classList.remove('show');
        // Lógica opcional para autocompletar nombre si solo se llenó SKU y es único
    }, 200));
    input.addEventListener('focus', function() { if(this.value.trim() && suggestionsContainer.children.length > 0) suggestionsContainer.classList.add('show'); else this.dispatchEvent(new Event('input')); });
    input.addEventListener('keydown', (e) => manejarNavegacionTecladoUI(e, suggestionsContainer, this));
}

function setupProductoInputListeners(input) {
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    if (!suggestionsContainer) return;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (!term) { suggestionsContainer.classList.remove('show'); return; }
        let sugerencias = [];
        if (window.repuestosModule && typeof window.repuestosModule.filtrarRepuestosPorTermino === 'function') {
            sugerencias = sugerencias.concat(window.repuestosModule.filtrarRepuestosPorTermino(term, 'nombre'));
        }
        if (window.productosModule && typeof window.productosModule.filtrarProductosPorTermino === 'function') {
            const prodSugs = window.productosModule.filtrarProductosPorTermino(term, 'nombre');
            prodSugs.forEach(p => { if(!sugerencias.some(s => s.nombre.toLowerCase() === p.nombre.toLowerCase())) sugerencias.push(p);});
        }
        mostrarSugerenciasUI(suggestionsContainer, sugerencias.slice(0, 7), this);
    });
     input.addEventListener('blur', () => setTimeout(() => {
        if(suggestionsContainer) suggestionsContainer.classList.remove('show');
        // Lógica opcional para autocompletar SKU si solo se llenó nombre y es único
    }, 200));
    input.addEventListener('focus', function() { if(this.value.trim() && suggestionsContainer.children.length > 0) suggestionsContainer.classList.add('show'); else this.dispatchEvent(new Event('input')); });
    input.addEventListener('keydown', (e) => manejarNavegacionTecladoUI(e, suggestionsContainer, this));
}

function mostrarSugerenciasUI(container, sugerencias, inputOrigen) {
    if (!container) return;
    container.innerHTML = '';
    if (!sugerencias || sugerencias.length === 0) {
        container.classList.remove('show');
        return;
    }

    sugerencias.forEach(producto => {
        const item = document.createElement('a');
        item.className = 'dropdown-item producto-suggestion-item';
        item.href = '#';
        let displayText = `<strong>${producto.sku || 'S/SKU'}</strong> - ${producto.nombre}`;
        if (producto.categoria) displayText += ` <small class="text-muted">(${producto.categoria})</small>`;
        if (producto.stock !== undefined) displayText += ` <span class="badge bg-${producto.stock > 0 ? 'success' : 'danger'} float-end">${producto.stock}</span>`;
        item.innerHTML = displayText;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            const itemRow = inputOrigen.closest('.item-row');
            const skuInput = itemRow.querySelector('.sku-input');
            const productoInput = itemRow.querySelector('.producto-input');
            const cantidadInput = itemRow.querySelector('input[name="cantidad[]"]');

            if (skuInput) skuInput.value = producto.sku || '';
            if (productoInput) productoInput.value = producto.nombre || '';
            container.classList.remove('show');
            if (cantidadInput) cantidadInput.focus();
        });
        container.appendChild(item);
    });
    container.classList.add('show');
}

function manejarNavegacionTecladoUI(e, container, input) {
    if (!container.classList.contains('show')) return;
    const items = Array.from(container.querySelectorAll('.producto-suggestion-item'));
    if (items.length === 0) return;
    let activeIndex = items.findIndex(item => item.classList.contains('active'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' || e.key === 'Tab') { // Tab también selecciona
        if (activeIndex !== -1) {
            e.preventDefault();
            items[activeIndex].click();
        } else if (items.length === 1 && e.key === 'Enter') { // Si solo hay una sugerencia y se presiona enter
            e.preventDefault();
            items[0].click();
        } else {
            container.classList.remove('show'); // Cierra si no hay nada activo
        }
        return;
    } else if (e.key === 'Escape') {
        container.classList.remove('show');
        return;
    } else {
        return;
    }

    items.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active', 'bg-primary', 'text-white'); // Bootstrap active class
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active', 'bg-primary', 'text-white');
        }
    });
}
// --- FIN LÓGICA DE AUTOCOMPLETADO ---

document.addEventListener('DOMContentLoaded', function() {
    // Asegurarse que setupBodegaListeners (que llama a setupAutocompletadoEnItems)
    // se llame DESPUÉS de que utils.js, repuestos.js y productos.js (si existe) se hayan cargado y definido sus módulos.
    // Esto se maneja mejor desde app.js -> initApp -> setupBaseEventListeners -> setupBodegaListeners
    if (document.getElementById('bodega-panel')) {
        actualizarEncabezadoTablaBodega(); // Asegurar que el encabezado de la tabla es correcto al cargar
    }
});
