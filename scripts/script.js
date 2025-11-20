// Инициализация карты
const map = L.map('map', {
    minZoom: -1,
    maxZoom: 3,
    crs: L.CRS.Simple
});

// Размеры изображения карты в пикселях
const mapWidth = 12288;
const mapHeight = 10240;

// Рассчитываем границы карты в координатах CRS.Simple
const southWest = map.unproject([0, mapHeight], map.getMaxZoom()-1);
const northEast = map.unproject([mapWidth, 0], map.getMaxZoom()-1);
const bounds = new L.LatLngBounds(southWest, northEast);

// Устанавливаем максимальные границы
map.setMaxBounds(bounds);
// Устанавливаем "липкость" границ (1.0 - полностью липкие, 0.0 - нет)
map.options.maxBoundsViscosity = 1.0;

// Добавляем изображение карты
L.imageOverlay('assets/maps/kuttenberg.jpeg', bounds).addTo(map);

// Устанавливаем начальный вид карты в центр
map.fitBounds(bounds);

// Функция для легкого добавления маркеров
function addMarker(pixelX, pixelY, title, description, iconUrl = null) {
    const coordinates = map.unproject([pixelX, pixelY], map.getMaxZoom()-1);
    
    let markerOptions = {};
    if (iconUrl) {
        markerOptions.icon = L.icon({
            iconUrl: iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }
    
    const marker = L.marker(coordinates, markerOptions)
        .addTo(map)
        .bindPopup(`
            <div class="popup-content">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `);
    
    return marker;
}

// Создаем элемент для отображения координат
const coordDisplay = L.control({position: 'bottomleft'});

coordDisplay.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'coord-display');
    this.update([0, 0]);
    return this._div;
};

coordDisplay.update = function(coords) {
    this._div.innerHTML = `
        <div style="
            background: white;
            padding: 8px 12px;
            border-radius: 5px;
            border: 2px solid rgba(0,0,0,0.2);
            font-family: monospace;
            font-size: 14px;
        ">
            <strong>X: ${coords[0]} | Y: ${coords[1]}</strong>
        </div>
    `;
};

coordDisplay.addTo(map);

// Обновляем координаты при движении курсора
map.on('mousemove', function(e) {
    const pixelCoords = map.project(e.latlng, map.getMaxZoom()-1);
    const x = Math.round(pixelCoords.x);
    const y = Math.round(pixelCoords.y);
    coordDisplay.update([x, y]);
});

// Примеры использования:
addMarker(1500, 2500, "Троски", "Стартовый регион игры");
addMarker(8500, 4200, "Куттенберг", "Столица серебряных рудников");
addMarker(4500, 3200, "Табор", "Лагерь гуситов");