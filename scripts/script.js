//карта
const map = L.map('map', {
    minZoom: -1,
    maxZoom: 3,
    crs: L.CRS.Simple
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

// Объект для хранения маркеров по категориям
const markers = {
    'Лагеря': [],
    'Поселения': [],
    'Основные квесты': [],
    'Побочные квесты': [],
    'Просьбы': []
};

// Иконки для каждой категории
const categoryIcons = {
    'Лагеря': 'assets/icons/camp.png',
    'Поселения': 'assets/icons/village.png',
    'Основные квесты': 'assets/icons/main_quest.png',
    'Побочные квесты': 'assets/icons/side_quest.png',
    'Просьбы': 'assets/icons/request.png',
    'default': 'assets/icons/default.png'
};

// Переменные для управления панелью фильтров
let filterPanelControl = null;
let isFilterPanelVisible = true;
let filterPanelState = 'expanded'; // 'expanded', 'collapsed', 'hidden'

// Функция для добавления маркера
function addMarker(pixelX, pixelY, title, description, category, customIconUrl = null) {
    const coordinates = map.unproject([pixelX, pixelY], map.getMaxZoom() - 1);
    
    // Определяем иконку
    let iconUrl = customIconUrl || categoryIcons[category] || categoryIcons['default'];
    
    const icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
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
                <h3>${title}</h3>
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
            <div class="filter-header">
                <h3>Фильтры маркеров</h3>
                <div class="filter-controls">
                    <button class="filter-control-btn collapse-btn" title="Свернуть">−</button>
                    <button class="filter-control-btn close-btn" title="Скрыть панель">×</button>
                </div>
            </div>
            <div class="filter-content">
                <div class="filter-list">
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Лагеря" checked>
                        <span class="filter-label">Лагеря</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Поселения" checked>
                        <span class="filter-label">Поселения</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Основные квесты" checked>
                        <span class="filter-label">Основные квесты</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Побочные квесты" checked>
                        <span class="filter-label">Побочные квесты</span>
                    </label>
                    <label>
                        <input type="checkbox" class="filter-checkbox" value="Просьбы" checked>
                        <span class="filter-label">Просьбы</span>
                    </label>
                </div>
                <div class="filter-buttons">
                    <button class="filter-button" id="show-all">Показать все</button>
                    <button class="filter-button" id="hide-all">Скрыть все</button>
                </div>
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
        
        // Кнопка сворачивания
        div.querySelector('.collapse-btn').addEventListener('click', () => {
            if (filterPanelState === 'expanded') {
                collapseFilterPanel();
            } else {
                expandFilterPanel();
            }
        });
        
        // Кнопка закрытия
        div.querySelector('.close-btn').addEventListener('click', hideFilterPanel);
        
        return div;
    };
    
    filterPanelControl.addTo(map);
    updateFilterPanelAppearance();
}

// Функция для создания кнопки показа/скрытия панели
function createFilterToggleButton() {
    const filterToggleControl = L.control({ position: 'topleft' });
    
    filterToggleControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'filter-toggle-control');
        div.innerHTML = `
            <button class="control-button" id="toggle-filter-panel-btn">
                <span class="btn-text">${isFilterPanelVisible ? 'Скрыть фильтры' : 'Показать фильтры'}</span>
                <span class="btn-icon">${isFilterPanelVisible ? '👁‍🗨' : '👁'}</span>
            </button>
        `;
        
        div.querySelector('#toggle-filter-panel-btn').addEventListener('click', () => {
            if (isFilterPanelVisible) {
                hideFilterPanel();
            } else {
                showFilterPanel();
            }
            updateToggleButton();
        });
        
        return div;
    };
    
    filterToggleControl.addTo(map);
}

// Обновление кнопки переключения
function updateToggleButton() {
    const toggleBtn = document.querySelector('#toggle-filter-panel-btn');
    if (toggleBtn) {
        const btnText = toggleBtn.querySelector('.btn-text');
        const btnIcon = toggleBtn.querySelector('.btn-icon');
        
        if (isFilterPanelVisible) {
            btnText.textContent = 'Скрыть фильтры';
            btnIcon.textContent = '👁‍🗨';
        } else {
            btnText.textContent = 'Показать фильтры';
            btnIcon.textContent = '👁';
        }
    }
}

// Функция сворачивания панели
function collapseFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (panel) {
        panel.classList.add('collapsed');
        filterPanelState = 'collapsed';
        
        const collapseBtn = panel.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.title = 'Развернуть';
            collapseBtn.textContent = '+';
        }
    }
}

// Функция разворачивания панели
function expandFilterPanel() {
    const panel = document.querySelector('.filter-panel');
    if (panel) {
        panel.classList.remove('collapsed');
        filterPanelState = 'expanded';
        
        const collapseBtn = panel.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.title = 'Свернуть';
            collapseBtn.textContent = '−';
        }
    }
}

// Функция скрытия панели фильтров
function hideFilterPanel() {
    if (filterPanelControl && isFilterPanelVisible) {
        // Сохраняем состояние свернутости перед скрытием
        const panel = document.querySelector('.filter-panel');
        const wasCollapsed = panel && panel.classList.contains('collapsed');
        
        // Удаляем панель с карты
        map.removeControl(filterPanelControl);
        filterPanelControl = null;
        isFilterPanelVisible = false;
        
        // Сохраняем состояние
        localStorage.setItem('filterPanelState', wasCollapsed ? 'collapsed' : 'expanded');
        
        updateToggleButton();
    }
}

// Функция показа панели фильтров
function showFilterPanel() {
    if (!isFilterPanelVisible) {
        createFilterPanel();
        isFilterPanelVisible = true;
        
        // Восстанавливаем предыдущее состояние
        const savedState = localStorage.getItem('filterPanelState') || 'expanded';
        if (savedState === 'collapsed') {
            setTimeout(() => {
                collapseFilterPanel();
            }, 10);
        }
        
        updateToggleButton();
    }
}

// Обновление внешнего вида панели
function updateFilterPanelAppearance() {
    if (filterPanelState === 'collapsed') {
        collapseFilterPanel();
    }
}

// Инициализация отображения координат
const coordDisplay = L.control({ position: 'bottomleft' });

coordDisplay.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'coord-display');
    this.update([0, 0]);
    return this._div;
};

coordDisplay.update = function (coords) {
    this._div.innerHTML = `
        <div>
            <strong>X: ${coords[0]} | Y: ${coords[1]}</strong>
        </div>
    `;
};

coordDisplay.addTo(map);

map.on('mousemove', function (e) {
    const pixelCoords = map.project(e.latlng, map.getMaxZoom() - 1);
    const x = Math.round(pixelCoords.x);
    const y = Math.round(pixelCoords.y);
    coordDisplay.update([x, y]);
});

// Загрузка сохраненного состояния панели
function loadFilterPanelState() {
    const savedState = localStorage.getItem('filterPanelState');
    if (savedState) {
        filterPanelState = savedState;
    }
    
    const savedVisibility = localStorage.getItem('filterPanelVisible');
    if (savedVisibility === 'false') {
        isFilterPanelVisible = false;
    }
}

// Сохранение состояния панели
function saveFilterPanelState() {
    localStorage.setItem('filterPanelState', filterPanelState);
    localStorage.setItem('filterPanelVisible', isFilterPanelVisible);
}

// Инициализация
loadFilterPanelState();

// Создаем панель фильтров, если она должна быть видима
if (isFilterPanelVisible) {
    createFilterPanel();
}

// Создаем кнопку переключения
createFilterToggleButton();

// ============================
// ДОБАВЛЕНИЕ МАРКЕРОВ
// ============================

// Лагеря
addMarker(4459, 3694, "Лагерь Сигизмунда", "Военный лагерь короля Сигизмунда под Куттенбергом", "Лагеря");

// Поселения
addMarker(9670, 4462, "Куттенберг", "Столица Богемии, также называемая столицей серебряных рудников", "Поселения");
addMarker(2144, 4466, "Сухдол", "Поселение с небольшой крепостью на западе карты", "Поселения");
addMarker(2818, 2142, "Раборш", "Небольшая деревня с крепостью", "Поселения");
addMarker(3978, 2098, "Богуновиц", "Небольшая деревня", "Поселения");
addMarker(4460, 2946, "Опатовиц", "Небольшая деревня у лагеря Сигизмунда", "Поселения");
addMarker(6072, 2392, "Хоршан", "Небольшая деревня у Логова черта", "Поселения");
addMarker(7608, 2032, "Грунд", "Деревня горняков", "Поселения");
addMarker(6894, 4032, "Пщитоки", "Небольшая деревня", "Поселения");
addMarker(5490, 4958, "Мисковиц", "Небольшая деревня с прудом, известная подпольными боями", "Поселения");
addMarker(7162, 6092, "Билани", "Небольшая деревня", "Поселения");
addMarker(6416, 8972, "Малешов", "Деревня с крепостью пана Отто Бергова", "Поселения");
addMarker(3072, 5908, "Bисока", "Небольшая деревня", "Поселения");

// Основные квесты
addMarker(2252, 4272, "Помяни Черта", "Отправиться на поиски Черта вместе с Жижкой", "Основные квесты");
addMarker(2246, 4080, "Пером и мечом", "Доложить Маркграфу Йобсту о событиях в Тросках", "Основные квесты");
addMarker(2244, 4130, "Последние обряды", "Отразить атаку на крепость", "Основные квесты");
addMarker(6109, 1495, "Чертова стая", "Привести членов банды Черта в Логово черта", "Основные квесты");
addMarker(6131, 1486, "В подземелье", "Узнать информацию о Лихтенштейне от Катерины", "Основные квесты");

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