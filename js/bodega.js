// Funciones específicas del panel de bodega

// Elementos DOM de Bodega
const nuevaSolicitudForm = document.getElementById('nueva-solicitud-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const tablaSolicitudesBodega = document.getElementById('tabla-solicitudes-bodega');

// Variables para paginación y filtrado
let currentPageBodega = 1;
let filterTermBodega = '';
let filterStatusBodega = 'all'; // Valor inicial para mostrar todas

// Función para establecer la fecha actual en el formulario
function setFechaActual() {
    const fechaInput = document.getElementById('fecha-solicitud');
    if (fechaInput) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaFormateada = `${año}-${mes}-${dia}`;
        fechaInput.value = fechaFormateada;
        fechaInput.setAttribute('readonly', 'readonly'); // Hacerlo solo lectura es una buena práctica para la fecha de solicitud
    }
}

// Configurar event listeners específicos de bodega
function setupBodegaListeners() {
    if (nuevaSolicitudForm) {
        // El event listener principal para el submit del formulario
        // ahora está en app.js (handleNuevaSolicitudConUsuario)
        // para asegurar que se incluye la información del usuario.
        // Si handleNuevaSolicitud en bodega.js aún se necesita como fallback
        // o para alguna lógica específica previa, se puede mantener,
        // pero la creación final la hará app.js.
        // nuevaSolicitudForm.addEventListener('submit', handleNuevaSolicitud); // Podría ser redundante

        // Establecer fecha actual cuando el formulario se vuelve visible o se interactúa con él
        setFechaActual(); // Asegurar que la fecha esté al cargar los listeners
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItem);
    }

    // Evento delegado para remover items
    if (itemsContainer) { // Verificar que itemsContainer existe
        itemsContainer.addEventListener('click', (e) => { // Más eficiente adjuntar al contenedor
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

    const btnNuevaSolicitud = document.querySelector('[data-bs-target="#nueva-solicitud-container"]');
    if (btnNuevaSolicitud) {
        btnNuevaSolicitud.addEventListener('click', setFechaActual);
    }

    const filtroDropdownItems = document.querySelectorAll('#bodega-panel .dropdown-item');
    if (filtroDropdownItems.length > 0) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                this.classList.add('active');

                const filterText = this.textContent.trim().toLowerCase();
                const filterButton = this.closest('.dropdown').querySelector('.dropdown-toggle'); // Más robusto

                switch (filterText) {
                    case 'pendientes':
                        filterStatusBodega = 'pendientes';
                        if(filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Pendientes`;
                        break;
                    case 'en fabricación':
                        filterStatusBodega = 'fabricacion';
                         if(filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> En Fabricación`;
                        break;
                    case 'entregadas':
                        filterStatusBodega = 'entregadas';
                        if(filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Entregadas`;
                        break;
                    default: // "Todas"
                        filterStatusBodega = 'all';
                        if(filterButton) filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> Todas`;
                }
                currentPageBodega = 1;
                cargarDatosBodega();
            });
        });
    }

    setupBodegaButtonListeners();

    if (typeof window.productosModule !== 'undefined') { // Verificar si productosModule existe
        setupProductoAutocompletado();
    }

    if (typeof window.repuestosModule !== 'undefined') { // Verificar si repuestosModule existe
        setupRepuestosAutocompletado();
    }

    // La actualización del encabezado se hará una vez después de que el DOM esté listo.
    // No es necesario aquí si ya se hace en DOMContentLoaded
}

// Configurar listeners específicos para los botones de acción en la tabla
function setupBodegaButtonListeners() {
    if (tablaSolicitudesBodega) {
        tablaSolicitudesBodega.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.btn-detalle'); // Más eficiente
            if (targetButton) {
                e.preventDefault(); // Prevenir comportamiento por defecto si es un <a> o similar
                const solicitudId = targetButton.getAttribute('data-id');
                console.log("Botón detalle bodega clickeado, ID:", solicitudId);
                if (solicitudId && typeof window.showDetalleSolicitud === 'function') {
                    window.showDetalleSolicitud(solicitudId);
                } else {
                    console.error("No se pudo mostrar el detalle. ID:", solicitudId, "Función showDetalleSolicitud disponible:", typeof window.showDetalleSolicitud);
                }
            }
        });
    } else {
        console.warn("No se encontró la tabla de solicitudes de bodega ('tabla-solicitudes-bodega') para configurar listeners de botones.");
    }
}

// Cargar y mostrar datos en la tabla de bodega
function cargarDatosBodega() {
    if (!tablaSolicitudesBodega) {
        console.warn("Elemento 'tabla-solicitudes-bodega' no encontrado. No se pueden cargar los datos.");
        return;
    }

    tablaSolicitudesBodega.innerHTML = ''; // Limpiar antes de cargar

    // Asegurarse que 'solicitudes' (variable global de app.js) y 'paginateAndFilterItems' (de utils.js) estén disponibles
    if (typeof solicitudes === 'undefined' || typeof paginateAndFilterItems !== 'function') {
        console.error("Variables 'solicitudes' o función 'paginateAndFilterItems' no disponibles.");
        tablaSolicitudesBodega.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">Error al cargar datos.</td></tr>`;
        updateBodegaPagination(0);
        return;
    }

    if (solicitudes.length === 0) {
        tablaSolicitudesBodega.innerHTML = `
            <tr><td colspan="9" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="mb-0">No hay solicitudes registradas</p>
                </div>
            </td></tr>`;
        updateBodegaPagination(0);
        return;
    }

    const { items: solicitudesPaginadas, totalItems } = paginateAndFilterItems(
        solicitudes,
        currentPageBodega,
        filterTermBodega,
        filterStatusBodega
    );

    updateBodegaPagination(totalItems);

    if (solicitudesPaginadas.length === 0) {
        tablaSolicitudesBodega.innerHTML = `
            <tr><td colspan="9" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <i class="fas fa-search text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="mb-0">No se encontraron solicitudes con los filtros aplicados</p>
                </div>
            </td></tr>`;
        return;
    }

    solicitudesPaginadas.forEach(solicitud => {
        const tr = document.createElement('tr');
        if (solicitud.estado === 'Entregado') tr.classList.add('table-success');
        else if (solicitud.estado === 'En fabricación') tr.classList.add('table-warning');

        // --- CAMBIO PARA MOSTRAR ID COMPLETO ---
        // const idCorto = solicitud.id.substring(solicitud.id.length - 6); // Ya no es necesario si el nuevo ID es legible
        const idParaMostrar = solicitud.id; // Mostrar el ID completo generado por generarIdSolicitud()
        // --- FIN DEL CAMBIO ---

        let fechaEstimada = 'No establecida';
        if (solicitud.fechaEstimada && typeof formatDate === 'function') {
            fechaEstimada = formatDate(solicitud.fechaEstimada);
        } else if (solicitud.fechaEstimada) {
            fechaEstimada = solicitud.fechaEstimada; // Fallback si formatDate no está
        }

        let fechaEntrega = 'Pendiente';
        if (solicitud.fechaEntrega && typeof formatDate === 'function') {
            fechaEntrega = formatDate(solicitud.fechaEntrega);
        } else if (solicitud.fechaEntrega) {
            fechaEntrega = solicitud.fechaEntrega; // Fallback
        } else if (solicitud.estado === 'Entregado' && solicitud.historial) {
            const entregaHistorial = [...solicitud.historial].reverse().find(h => h.estado === 'Entregado' && h.fechaEntrega);
            if (entregaHistorial && entregaHistorial.fechaEntrega) {
                fechaEntrega = typeof formatDate === 'function' ? formatDate(entregaHistorial.fechaEntrega) : entregaHistorial.fechaEntrega;
            }
        }
        
        // Asegurarse que formatDate y getStatusBadgeClass están disponibles
        const formattedFechaSolicitud = typeof formatDate === 'function' ? formatDate(solicitud.fechaSolicitud) : solicitud.fechaSolicitud;
        const badgeClass = typeof getStatusBadgeClass === 'function' ? getStatusBadgeClass(solicitud.estado) : 'bg-secondary';

        tr.innerHTML = `
            <td data-label="ID">${idParaMostrar}</td>
            <td data-label="Nota Venta">${solicitud.notaVenta || ''}</td>
            <td data-label="Cliente">${solicitud.cliente || 'No especificado'}</td>
            <td data-label="Local">${solicitud.local || 'No especificado'}</td>
            <td data-label="Fecha Solicitud">${formattedFechaSolicitud}</td>
            <td data-label="Fecha Estimada">${fechaEstimada}</td>
            <td data-label="Fecha Entrega">${fechaEntrega}</td>
            <td data-label="Estado"><span class="badge ${badgeClass}">${solicitud.estado}</span></td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-primary btn-detalle" data-id="${solicitud.id}">
                    <i class="fas fa-eye me-1"></i>Detalles
                </button>
            </td>
        `;
        tablaSolicitudesBodega.appendChild(tr);
    });
}

// Actualizar encabezado para incluir ambas fechas (se llama una vez al cargar el DOM)
function actualizarEncabezadoTablaBodega() {
    const tablaBodegaTheadTr = document.querySelector('#bodega-panel table thead tr');
    if (tablaBodegaTheadTr) {
        tablaBodegaTheadTr.innerHTML = `
            <th>ID</th>
            <th>Nota Venta</th>
            <th>Cliente</th>
            <th>Local</th>
            <th>Fecha Solicitud</th>
            <th>Fecha Estimada</th>
            <th>Fecha Entrega</th>
            <th>Estado</th>
            <th>Acciones</th>
        `;
    } else {
        console.warn("No se encontró el encabezado de la tabla de bodega para actualizar.");
    }
}

// Actualizar controles de paginación para bodega
function updateBodegaPagination(totalItems) {
    if (typeof createPaginationControls === 'function') {
        createPaginationControls(
            '#bodega-panel .card-footer', // Selector del contenedor de paginación
            totalItems,
            currentPageBodega,
            window.handlePageChange, // Usar la función global de app.js
            'bodega' // Nombre del panel para handlePageChange
        );
    } else {
        console.warn("Función createPaginationControls no disponible (de utils.js). La paginación no funcionará.");
    }
}

// Manejar el envío del formulario de nueva solicitud
// Esta función ahora podría ser un fallback o lógica previa,
// ya que app.js/handleNuevaSolicitudConUsuario toma precedencia
// para la creación y guardado en Firebase.
async function handleNuevaSolicitud(e) {
    e.preventDefault();
    console.log("handleNuevaSolicitud en bodega.js llamado. La creación principal debería ocurrir en app.js.");

    // Aquí podrías poner validaciones específicas de bodega ANTES de que app.js tome el control,
    // pero la lógica de creación del objeto y guardado en Firebase está centralizada en app.js.

    // Ejemplo: asegurar que la fecha esté seteada.
    setFechaActual();

    // Mostrar una alerta indicando que el proceso continúa en el módulo principal
    // if (typeof mostrarAlerta === 'function') {
    //     mostrarAlerta('Procesando solicitud...', 'info');
    // }

    // NO crear ni guardar la solicitud aquí si app.js lo va a hacer.
    // Si necesitas que esta función cree la solicitud de forma independiente
    // (por ejemplo, si app.js no siempre maneja este evento),
    // entonces debes replicar aquí la lógica de:
    // 1. Obtener currentUser.
    // 2. Llamar a generarIdSolicitud().
    // 3. Construir el objeto nuevaSolicitud completo (incluyendo cliente, local, items con SKU).
    // 4. Guardar en Firebase.
    // Pero esto llevaría a duplicación de código. Es mejor que app.js sea el único responsable.
}


// Agregar un nuevo item al formulario
function addItem() {
    if (!itemsContainer) {
        console.error("Elemento 'items-container' no encontrado.");
        return;
    }
    const newRow = document.createElement('div');
    newRow.className = 'item-row item-row-new'; // Clase para animación
    // Estructura consistente con la recolección de datos en app.js
    newRow.innerHTML = `
        <div class="row g-2 align-items-center mb-2">
            <div class="col-md-3 col-sm-12 position-relative">
                <label class="form-label visually-hidden">SKU</label>
                <input type="text" class="form-control sku-input" placeholder="SKU (Opcional)" name="sku[]" autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-4 col-sm-12 position-relative">
                <label class="form-label visually-hidden">Nombre del producto</label>
                <input type="text" class="form-control producto-input" placeholder="Nombre del producto" name="producto[]" required autocomplete="off">
                <div class="dropdown-menu producto-suggestions"></div>
            </div>
            <div class="col-md-3 col-sm-8">
                <label class="form-label visually-hidden">Cantidad</label>
                <input type="number" class="form-control" placeholder="Cantidad" name="cantidad[]" min="1" required>
            </div>
            <div class="col-md-2 col-sm-4">
                <button type="button" class="btn btn-outline-danger w-100 remove-item" aria-label="Eliminar producto">
                    <i class="fas fa-trash-alt"></i> <span class="d-md-none">Eliminar</span>
                </button>
            </div>
        </div>
    `;

    itemsContainer.appendChild(newRow);

    // Re-configurar autocompletado para los nuevos inputs si las funciones están disponibles
    if (typeof setupAutocompletadoEnItems === 'function') {
        setupAutocompletadoEnItems(); // Llama a la función que configura ambos tipos de input
    }


    if (window.innerWidth < 768) {
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const productoInput = newRow.querySelector('.producto-input');
    if (productoInput) {
        setTimeout(() => productoInput.focus(), 100);
    }
}

// Eliminar un item del formulario
function removeItem(button) {
    const row = button.closest('.item-row');
    if (!row) return;

    const items = itemsContainer.querySelectorAll('.item-row');
    if (items.length > 1) {
        row.classList.add('item-row-remove'); // Para animación CSS
        // Esperar que la animación termine antes de remover el elemento
        row.addEventListener('animationend', () => row.remove(), { once: true });
        row.addEventListener('transitionend', () => row.remove(), { once: true }); // Fallback por si no hay anim
         setTimeout(() => { // Fallback si no hay eventos de transición/animación
            if (row.parentNode) {
                row.remove();
            }
        }, 300);


    } else {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('Debe haber al menos un producto en la solicitud.', 'warning');
        else alert('Debe haber al menos un producto.');
    }
}


// --- LÓGICA DE AUTOCOMPLETADO (Movida aquí para mantener bodega.js más autocontenido si es necesario) ---
// (Asegúrate que window.productosModule y window.repuestosModule estén disponibles globalmente)

function setupProductoAutocompletado() {
    if (typeof setupAutocompletadoEnItems === 'function') setupAutocompletadoEnItems();
    if (itemsContainer) { // Observar si se añaden nuevas filas de items
        const observador = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('item-row')) {
                             if (typeof setupAutocompletadoEnItems === 'function') setupAutocompletadoEnItems(node);
                        }
                    });
                }
            });
        });
        observador.observe(itemsContainer, { childList: true });
    }
}
function setupRepuestosAutocompletado() { // Similar a productos, pero podría tener lógica diferente
    if (typeof setupAutocompletadoEnItems === 'function') setupAutocompletadoEnItems();
     if (itemsContainer) {
        const observador = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                     mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('item-row')) {
                             if (typeof setupAutocompletadoEnItems === 'function') setupAutocompletadoEnItems(node);
                        }
                    });
                }
            });
        });
        observador.observe(itemsContainer, { childList: true });
    }
}

// Configurar autocompletado en inputs de una fila específica o en todos
function setupAutocompletadoEnItems(specificRow = null) {
    const scope = specificRow || document; // Si se pasa una fila, buscar solo dentro de ella

    scope.querySelectorAll('.sku-input').forEach(input => {
        if (!input.dataset.autocompleteSetup) { // Evitar re-adjuntar listeners
            if (typeof setupSkuInput === 'function') setupSkuInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
    scope.querySelectorAll('.producto-input').forEach(input => {
        if (!input.dataset.autocompleteSetup) {
            if (typeof setupProductoInput === 'function') setupProductoInput(input);
            input.dataset.autocompleteSetup = 'true';
        }
    });
}


function setupSkuInput(input) {
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    if (!suggestionsContainer) return;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (!term) { suggestionsContainer.classList.remove('show'); return; }
        let sugerencias = [];
        if (window.repuestosModule && typeof window.repuestosModule.filtrarRepuestosPorSku === 'function') {
            sugerencias = sugerencias.concat(window.repuestosModule.filtrarRepuestosPorSku(term));
        }
        if (window.productosModule && typeof window.productosModule.filtrarProductosPorSku === 'function') { // Asumiendo filtrarProductosPorSku
             const prodSugs = window.productosModule.filtrarProductosPorSku(term);
             prodSugs.forEach(p => { if(!sugerencias.some(s => s.sku === p.sku)) sugerencias.push(p);});
        }
        if (typeof mostrarSugerencias === 'function') mostrarSugerencias(suggestionsContainer, sugerencias.slice(0, 7), this); // Limitar a 7 sugerencias
    });
    input.addEventListener('blur', () => setTimeout(() => suggestionsContainer.classList.remove('show'), 200)); // Ocultar con retardo
    input.addEventListener('focus', function() { // Mostrar al hacer focus si hay texto
         if(this.value.trim()) this.dispatchEvent(new Event('input'));
    });
    input.addEventListener('keydown', (e) => {if (typeof manejarNavegacionTeclado === 'function') manejarNavegacionTeclado(e, suggestionsContainer, this)});
}

function setupProductoInput(input) {
    const suggestionsContainer = input.parentElement.querySelector('.producto-suggestions');
    if (!suggestionsContainer) return;

    input.addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        if (!term) { suggestionsContainer.classList.remove('show'); return; }
        let sugerencias = [];
        if (window.repuestosModule && typeof window.repuestosModule.filtrarRepuestosPorNombre === 'function') {
            sugerencias = sugerencias.concat(window.repuestosModule.filtrarRepuestosPorNombre(term));
        }
        if (window.productosModule && typeof window.productosModule.filtrarProductosPorNombre === 'function') { // Asumiendo filtrarProductosPorNombre
            const prodSugs = window.productosModule.filtrarProductosPorNombre(term);
            prodSugs.forEach(p => { if(!sugerencias.some(s => s.nombre.toLowerCase() === p.nombre.toLowerCase())) sugerencias.push(p);});
        }
        if (typeof mostrarSugerencias === 'function') mostrarSugerencias(suggestionsContainer, sugerencias.slice(0, 7), this);
    });
    input.addEventListener('blur', () => setTimeout(() => suggestionsContainer.classList.remove('show'), 200));
    input.addEventListener('focus', function() {
         if(this.value.trim()) this.dispatchEvent(new Event('input'));
    });
    input.addEventListener('keydown', (e) => {if (typeof manejarNavegacionTeclado === 'function') manejarNavegacionTeclado(e, suggestionsContainer, this)});
}


function mostrarSugerencias(container, sugerencias, inputOrigen) {
    if (!container) return;
    container.innerHTML = '';
    if (!sugerencias || sugerencias.length === 0) {
        container.classList.remove('show');
        return;
    }

    sugerencias.forEach(producto => {
        const item = document.createElement('a'); // Usar <a> para que sea clickeable y accesible
        item.className = 'dropdown-item producto-suggestion-item'; // Clases de Bootstrap para dropdown
        item.href = '#';
        // Mostrar SKU y Nombre. Si hay categoría, también.
        let displayText = `<strong>${producto.sku || 'S/SKU'}</strong> - ${producto.nombre}`;
        if (producto.categoria) displayText += ` <small class="text-muted">(${producto.categoria})</small>`;
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


function manejarNavegacionTeclado(e, container, input) {
    if (!container.classList.contains('show')) return;
    const items = Array.from(container.querySelectorAll('.producto-suggestion-item'));
    if (items.length === 0) return;

    let activeIndex = items.findIndex(item => item.classList.contains('active'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex < items.length - 1) activeIndex++;
        else activeIndex = 0; // Volver al inicio
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) activeIndex--;
        else activeIndex = items.length - 1; // Ir al final
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex !== -1) {
            items[activeIndex].click();
        } else { // Si no hay nada activo, pero hay texto, intenta buscarlo (o no hacer nada)
           container.classList.remove('show');
        }
        return;
    } else if (e.key === 'Escape') {
        container.classList.remove('show');
        return;
    } else {
        return; // No manejar otras teclas
    }

    items.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

// Llamadas iniciales al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bodega-panel')) { // Solo si estamos en un contexto donde existe el panel de bodega
        setFechaActual(); // Asegura que la fecha se establece al cargar la página si el form es visible
        setupBodegaButtonListeners(); // Configurar listeners para botones en la tabla de bodega
        actualizarEncabezadoTablaBodega(); // Asegurar que el encabezado esté correcto

        // El autocompletado se llama en setupBodegaListeners, que a su vez se llama desde app.js/setupEventListeners
        // Si se necesita llamar explícitamente aquí, asegurarse que productosModule y repuestosModule ya estén cargados.
        // if (window.productosModule) setupProductoAutocompletado();
        // if (window.repuestosModule) setupRepuestosAutocompletado();
    }
});
