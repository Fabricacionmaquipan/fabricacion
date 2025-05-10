// Componentes de UI comunes

// Configurar componentes de UI
function setupUIComponents() {
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers de Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Comportamiento de colapso en móviles
    setupCollapsibleSections();
    
    // Adaptación responsive
    handleResponsiveUI();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleResponsiveUI);
}

// Configurar secciones colapsables
function setupCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-bs-target');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const icon = header.querySelector('i.fas.fa-chevron-down');
                
                if (targetElement.classList.contains('show')) {
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            }
        });
    });
}

// Manejar adaptaciones de UI según el tamaño de la pantalla
function handleResponsiveUI() {
    const isMobile = window.innerWidth < 768;
    
    // Adaptar tablas para móviles
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
        if (isMobile) {
            // Añadir atributos data-label a las celdas basados en los encabezados
            const headers = table.querySelectorAll('thead th');
            const headerTexts = [...headers].map(header => header.textContent.trim());
            
            table.querySelectorAll('tbody tr').forEach(row => {
                row.querySelectorAll('td').forEach((cell, index) => {
                    if (index < headerTexts.length) {
                        cell.setAttribute('data-label', headerTexts[index]);
                    }
                });
            });
        }
    });
    
    // Comportamiento de colapso en formularios para móviles
    if (isMobile) {
        // Colapsar formularios extensos en móviles por defecto
        const formsToCollapse = document.querySelectorAll('.collapse-on-mobile');
        formsToCollapse.forEach(form => {
            if (!form.classList.contains('show')) {
                form.classList.add('collapse');
            }
        });
    }
}

// Crear una tabla dinámica
function createDynamicTable(containerId, columns, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Configuración por defecto
    const defaultOptions = {
        tableClass: '',
        responsive: true,
        striped: true,
        hover: true,
        searchable: false,
        pagination: false,
        itemsPerPage: 10,
        emptyMessage: 'No hay datos disponibles'
    };
    
    // Combinar opciones
    const settings = { ...defaultOptions, ...options };
    
    // Crear wrapper
    const wrapper = document.createElement('div');
    if (settings.responsive) {
        wrapper.className = 'table-responsive';
    }
    
    // Crear tabla
    const table = document.createElement('table');
    let tableClasses = 'table';
    if (settings.striped) tableClasses += ' table-striped';
    if (settings.hover) tableClasses += ' table-hover';
    if (settings.tableClass) tableClasses += ' ' + settings.tableClass;
    table.className = tableClasses;
    
    // Crear encabezado
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        if (column.width) th.style.width = column.width;
        if (column.class) th.className = column.class;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    if (data.length === 0) {
        // Mensaje para tabla vacía
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = columns.length;
        emptyCell.className = 'text-center py-4';
        emptyCell.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <i class="fas fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                <p class="mb-0">${settings.emptyMessage}</p>
            </div>
        `;
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    } else {
        // Renderizar filas con datos
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Aplicar clase si hay una función de clase de fila
            if (settings.rowClass && typeof settings.rowClass === 'function') {
                const rowClassName = settings.rowClass(item);
                if (rowClassName) row.className = rowClassName;
            }
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                // Aplicar atributo data-label para responsive
                td.setAttribute('data-label', column.label);
                
                if (column.render) {
                    // Renderizar contenido personalizado
                    td.innerHTML = column.render(item);
                } else if (column.field) {
                    // Renderizar valor simple
                    td.textContent = item[column.field] || '';
                }
                
                if (column.cellClass) {
                    td.className = column.cellClass;
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
    }
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    // Añadir búsqueda si está habilitada
    if (settings.searchable) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'mb-3';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control';
        searchInput.placeholder = 'Buscar...';
        
        searchInput.addEventListener('input', e => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach(row => {
                if (data.length === 0) return; // No buscar en fila vacía
                
                let found = false;
                row.querySelectorAll('td').forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(searchTerm)) {
                        found = true;
                    }
                });
                
                row.style.display = found ? '' : 'none';
            });
        });
        
        searchContainer.appendChild(searchInput);
        container.appendChild(searchContainer);
    }
    
    // Añadir la tabla al contenedor
    container.appendChild(wrapper);
    
    // Añadir paginación si está habilitada
    if (settings.pagination && data.length > settings.itemsPerPage) {
        // Implementación de paginación...
        // (Aquí iría el código para la paginación)
    }
    
    return table;
}

// Exportar como módulo (para uso futuro)
window.ui = {
    createDynamicTable,
    setupUIComponents,
    handleResponsiveUI
};
