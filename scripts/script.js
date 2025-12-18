///карта
const map = L.map('map', {
    minZoom: -1,
    maxZoom: 3,
    crs: L.CRS.Simple,
    attributionControl:false
});

// размеры изображения
const mapWidth = 12288;
const mapHeight = 10240;

const southWest = map.unproject([0, mapHeight], map.getMaxZoom() - 1);
const northEast = map.unproject([mapWidth, 0], map.getMaxZoom() - 1);
const bounds = new L.LatLngBounds(southWest, northEast);

// максимальные границы
map.setMaxBounds(bounds);
map.options.maxBoundsViscosity = 1.0;

// изображение карты
L.imageOverlay('assets/maps/kuttenberg.jpeg', bounds).addTo(map);

// вид центр
map.fitBounds(bounds);


const markers = {
    'Лагеря у дороги': [],
    'Поселения': [],
    'Основные квесты': [],
    'Побочные квесты': [],
    'Просьбы': [],
    'Мастерские бронника': [],
    'Кузницы': [],
    'Таверны': []
};


const categoryIcons = {
    'Лагеря у дороги': 'assets/icons/swords-marker.png',
    'Поселения': 'assets/icons/house-marker.png',
    'Основные квесты': 'assets/icons/main-quest.png',
    'Побочные квесты': 'assets/icons/side-quest.png',
    'Просьбы': 'assets/icons/begging.png',
    'Таверны': 'assets/icons/taverna.png',
    'Кузницы': 'assets/icons/blacksmithm.png',
    'Мастерские бронника': 'assets/icons/armoury.png',
    'default': 'assets/icons/шаблон-маркер.png'
};

// Переменные для управления панелью фильтров
let filterPanelControl = null;
let isFilterPanelVisible = true;
let filterPanelState = 'expanded'; // 'expanded', 'collapsed'

// Функция для добавления маркера
function addMarker(pixelX, pixelY, title, description, category, customIconUrl = null) {
    const coordinates = map.unproject([pixelX, pixelY], map.getMaxZoom() - 1);
    
    // Определяем иконку
    let iconUrl = customIconUrl || categoryIcons[category] || categoryIcons['default'];
    
    const icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [30, 38],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const marker = L.marker(coordinates, { 
        icon: icon, 
        category: category,
        title: title
    })
        .addTo(map)
        .bindPopup(`
            <div class="popup-content">
                <div class="popup-title-row">
                    <div class="popup-icon"></div>
                    <h3>${title}</h3>
                </div>
                <p>${description}</p>
                <small><em>Категория: ${category}</em></small>
            </div>
        `);
    
    // Сохраняем маркер в соответствующей категории
    if (markers[category]) {
        markers[category].push(marker);
    } else {
        // Если категории нет, создаем ее
        markers[category] = [marker];
    }
    
    // Обновляем счетчики категорий, если панель уже создана
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
    
    return marker;
}

// Функция для фильтрации маркеров
function filterMarkers(categoriesToShow) {
    // Скрыть все маркеры сначала
    Object.values(markers).flat().forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    // Показать только выбранные категории
    categoriesToShow.forEach(category => {
        if (markers[category]) {
            markers[category].forEach(marker => {
                marker.addTo(map);
            });
        }
    });
}

// Функция для обновления фильтров
function updateFilters() {
    const checkboxes = document.querySelectorAll('.filter-checkbox');
    const selectedCategories = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.push(checkbox.value);
        }
    });
    
    filterMarkers(selectedCategories);
}

// Функция для создания панели фильтров
function createFilterPanel() {
    filterPanelControl = L.control({ position: 'topright' });
    
    filterPanelControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'filter-panel');
    div.innerHTML = `
        <!-- Кнопка свернуть/развернуть теперь в левой части -->
        <div class="filter-toggle-left" title="Свернуть/Развернуть панель"></div>
        
        <div class="filter-content-wrapper">
            <div class="filter-logo">
                <div class="logo-emblem"></div>
            </div>
            <div class="filter-subtitle-main">Интерактивная карта Kingdom Come Deliverance 2</div>
            <div class="filter-header">
                <h3>Фильтры маркеров</h3>
            </div>
            <div class="filter-content">
                <div class="filter-list">
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Лагеря у дороги" checked>
                        <span class="filter-label">
                            <img src="assets/icons/sword.png" alt="Лагеря у дороги" class="filter-icon"> Лагеря у дороги
                        </span>
                        <span class="category-count" data-category="Лагеря у дороги">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Поселения" checked>
                        <span class="filter-label">
                            <img src="assets/icons/home.png" alt="Поселения" class="filter-icon"> Поселения
                        </span>
                        <span class="category-count" data-category="Поселения">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Основные квесты" checked>
                        <span class="filter-label">
                            <img src="assets/icons/danger.png" alt="Основные квесты" class="filter-icon"> Основные квесты
                        </span>
                        <span class="category-count" data-category="Основные квесты">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Побочные квесты" checked>
                        <span class="filter-label">
                            <img src="assets/icons/question.png" alt="Побочные квесты" class="filter-icon"> Побочные квесты
                        </span>
                        <span class="category-count" data-category="Побочные квесты">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Просьбы" checked>
                        <span class="filter-label">
                            <img src="assets/icons/palm.png" alt="Просьбы" class="filter-icon"> Просьбы
                        </span>
                        <span class="category-count" data-category="Просьбы">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Таверны" checked>
                        <span class="filter-label">
                            <img src="assets/icons/beer.png" alt="Таверны" class="filter-icon"> Таверны
                        </span>
                        <span class="category-count" data-category="Таверны">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Кузницы" checked>
                        <span class="filter-label">
                            <img src="assets/icons/blacksmith.png" alt="Кузницы" class="filter-icon"> Кузницы
                        </span>
                        <span class="category-count" data-category="Кузницы">0</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Мастерские бронника" checked>
                        <span class="filter-label">
                            <img src="assets/icons/shield.png" alt="Мастерские бронника" class="filter-icon"> Мастерские бронника
                        </span>
                        <span class="category-count" data-category="Мастерские бронника">0</span>
                    </label>
                </div>
                <div class="filter-buttons">
                    <button class="filter-button" id="show-all">Показать все</button>
                    <button class="filter-button" id="hide-all">Скрыть все</button>
                </div>
            </div>
            <div class="filter-footer-powered">Powered by Bolvany</div>
        </div>
    `;
        
        // Добавляем обработчики событий для чекбоксов
        const checkboxes = div.querySelectorAll('.filter-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateFilters);
        });
        
        // Кнопка "Показать все"
        div.querySelector('#show-all').addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = true);
            updateFilters();
        });
        
        // Кнопка "Скрыть все"
        div.querySelector('#hide-all').addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
            updateFilters();
        });
        
        updateCategoryCounts();
        
        // Обработчик для кнопки сворачивания в левой части
        const toggleLeft = div.querySelector('.filter-toggle-left');
        if (toggleLeft) {
            toggleLeft.addEventListener('click', () => {
                if (filterPanelState === 'expanded') {
                    collapseFilterPanel();
                } else {
                    expandFilterPanel();
                }
            });
        }

        return div;
    };
    
    filterPanelControl.addTo(map);
    updateFilterPanelAppearance();
}

// Функция сворачивания панели
function collapseFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (panel) {
        panel.classList.add('collapsed');
        filterPanelState = 'collapsed';
    }
}

// Функция разворачивания панели
function expandFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (panel) {
        panel.classList.remove('collapsed');
        filterPanelState = 'expanded';
    }
}

// Функция скрытия панели фильтров
function hideFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (panel && isFilterPanelVisible) {
        const wasCollapsed = panel.classList.contains('collapsed');
        panel.classList.add('is-hidden');
        isFilterPanelVisible = false;
        localStorage.setItem('filterPanelState', wasCollapsed ? 'collapsed' : 'expanded');
        saveFilterPanelState();
    }
}

// Функция показа панели фильтров
function showFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (!panel) {
        createFilterPanel();
    }
    const restoredPanel = document.querySelector('.filter-panel');
    if (restoredPanel) {
        restoredPanel.classList.remove('is-hidden');
    }
    isFilterPanelVisible = true;
    const savedState = localStorage.getItem('filterPanelState') || 'expanded';
    if (savedState === 'collapsed') {
        setTimeout(() => collapseFilterPanel(), 10);
    } else {
        expandFilterPanel();
    }
    updateCategoryCounts();
    saveFilterPanelState();
}

// Обновление внешнего вида панели
function updateFilterPanelAppearance() {
    if (filterPanelState === 'collapsed') {
        collapseFilterPanel();
    }
}
// <<<<<<<<<< ЭТА ФИЧА ТОЛЬКО ДЛЯ РАЗРАБОТКИ МАРКЕРОВ >>>>>>>>>>>>>>
// Инициализация отображения координат
// const coordDisplay = L.control({ position: 'bottomleft' });

// coordDisplay.onAdd = function (map) {
//     this._div = L.DomUtil.create('div', 'coord-display');
//     this.update([0, 0]);
//     return this._div;
// };

// coordDisplay.update = function (coords) {
//     this._div.innerHTML = `
//         <div>
//             <strong>X: ${coords[0]} | Y: ${coords[1]}</strong>
//         </div>
//     `;
// };

// coordDisplay.addTo(map);

// map.on('mousemove', function (e) {
//     const pixelCoords = map.project(e.latlng, map.getMaxZoom() - 1);
//     const x = Math.round(pixelCoords.x);
//     const y = Math.round(pixelCoords.y);
//     coordDisplay.update([x, y]);
// });

// <<<<<<<<<< ЭТА ФИЧА ТОЛЬКО ДЛЯ РАЗРАБОТКИ МАРКЕРОВ >>>>>>>>>>>>>>

// Загрузка сохраненного состояния панели
function loadFilterPanelState() {
    const savedState = localStorage.getItem('filterPanelState');
    if (savedState) {
        filterPanelState = savedState;
    }
    // Панель всегда отображается при загрузке страницы
    isFilterPanelVisible = true;
}

// Сохранение состояния панели
function saveFilterPanelState() {
    localStorage.setItem('filterPanelState', filterPanelState);
    localStorage.setItem('filterPanelVisible', isFilterPanelVisible);
}

// Инициализация
loadFilterPanelState();

// Создаем панель фильтров (открыта по умолчанию)
createFilterPanel();

// Первичное обновление счетчиков после создания панели
updateCategoryCounts();

// Обновление счетчиков категорий
function updateCategoryCounts() {
    const countSpans = document.querySelectorAll('.category-count');
    countSpans.forEach(span => {
        const category = span.dataset.category;
        const count = markers[category] ? markers[category].length : 0;
        span.textContent = count;
    });
}


// Функция для быстрого добавления маркера
function addMarkers(pixelX, pixelY, title, description, iconUrl = null) {
    return addMarker(pixelX, pixelY, title, description, 'default', iconUrl);
}

// Экспорт функций для использования
window.mapUtils = {
    addMarker,
    addMarkers,
    filterMarkers,
    updateFilters,
    showFilterPanel,
    hideFilterPanel,
    expandFilterPanel,
    collapseFilterPanel,
    showAllMarkers: () => {
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = true);
        updateFilters();
    },
    hideAllMarkers: () => {
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
        updateFilters();
    },
    isFilterPanelVisible: () => isFilterPanelVisible,
    markers
};

// Сохранение состояния при закрытии страницы
window.addEventListener('beforeunload', saveFilterPanelState);