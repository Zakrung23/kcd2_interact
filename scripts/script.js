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

// добавление маркеров
function addMarker(pixelX, pixelY, title, description, iconUrl = null) {
    const coordinates = map.unproject([pixelX, pixelY], map.getMaxZoom() - 1);

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

// координаты
const coordDisplay = L.control({ position: 'bottomleft' });

coordDisplay.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'coord-display');
    this.update([0, 0]);
    return this._div;
};

coordDisplay.update = function (coords) {
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

map.on('mousemove', function (e) {
    const pixelCoords = map.project(e.latlng, map.getMaxZoom() - 1);
    const x = Math.round(pixelCoords.x);
    const y = Math.round(pixelCoords.y);
    coordDisplay.update([x, y]);
});


// Примеры использования:
addMarker(1500, 2500, "Троски", "Стартовый регион игры");
addMarker(9600, 4480, "Куттенберг", "Столица серебряных рудников");
addMarker(4400, 3500, "Лагерь Сигизмунда", "тут может быть ваша реклама")
//Маркеры
//Лагеря
addMarker(4459, 3694, "Лагерь Сигизмунда", "Военный лагерь короля Сигизмунда под Куттенбергом");
//Поселения
addMarker(9670, 4462, "Куттенберг", "Столица Богемии, также называемая столицей серебряных рудников");
addMarker(2144, 4466, "Сухдол", "Поселение с небольшой крепостью на западе карты");
addMarker(2818, 2142, "Раборш", "Небольшая деревня с крепостью");
addMarker(3978, 2098, "Богуновиц", "Небольшая деревня");
addMarker(4460, 2946, "Опатовиц", "Небольшая деревня у лагеря Сигизмунда");
addMarker(6072, 2392, "Хоршан", "Небольшая деревня у Логова черта");
addMarker(7608, 2032, "Грунд", "Деревня горняков");
addMarker(6894, 4032, "Пщитоки", "Небольшая деревня");
addMarker(5490, 4958, "Мисковиц", "Небольшая деревня с прудом, известная подпольными боями");
addMarker(7162, 6092, "Билани", "Небольшая деревня");
addMarker(6416, 8972, "Малешов", "Деревня с крепостью пана Отто Бергова");
addMarker(3072, 5908, "Bисока", "Небольшая деревня");
//Квесты основные
addMarker(2252, 4272, "Помяни Черта", "Отправиться на поиски Черта вместе с Жижкой");
addMarker(2246, 4080, "Пером и мечом", "Доложить Маркграфу Йобсту о событиях в Тросках");
addMarker(2244, 4130, "Последние обряды", "Отразить атаку на крепость");
addMarker(6109, 1495, "Чертовая стая", "Привести членов банды Черта в Логово черта");
addMarker(6131, 1486, "В подземелье", "Узнать информацию о Лихтенштейне от Катерины");
//Квесты побочные

//Просьбы

