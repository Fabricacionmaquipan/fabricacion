// Funciones específicas del panel de fabricación

// Elementos DOM de Fabricación
const tablaSolicitudesFabricacion = document.getElementById('tabla-solicitudes-fabricacion');

// Variables para paginación y filtrado
let currentPageFabricacion = 1;
let filterTermFabricacion = '';
let filterStatusFabricacion = 'all';

// Configurar event listeners específicos de fabricación
function setupFabricacionListeners() {
    // Filtros y búsqueda
    const filtroDropdownItems = document.querySelectorAll('#fabricacion-panel .dropdown-item');
    if (filtroDropdownItems) {
        filtroDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar visual de selección
                filtroDropdownItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Establecer filtro según el texto
                const filterText = item.textContent.trim().toLowerCase();
                switch (filterText) {
                    case 'pendientes':
                        filterStatusFabricacion = 'pendientes';
                        break;
                    case 'en fabricación':
                        filterStatusFabricacion = 'fabricacion';
                        break;
                    case 'entregadas':
                        filterStatusFabricacion = 'entregadas';
                        break;
                    default:
                        filterStatusFabricacion = 'all';
                }
                
                // Actualizar texto del botón de filtro
                const filterButton = document.querySelector('#fabricacion-panel .dropdown-toggle');
                if (filterButton) {
                    filterButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${item.textContent.trim()}`;
                }
                
                currentPageFabricacion = 1; // Reiniciar a primera página al filtrar
                cargarDatosFabricacion();
            });
        });
    }
    
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('#fabricacion-panel .input-group input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTermFabricacion = e.target.value.toLowerCase();
            currentPageFabricacion = 1; // Reiniciar a primera página al buscar
            cargarDatosFabricacion
