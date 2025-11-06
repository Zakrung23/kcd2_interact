// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const mapContainer = document.getElementById('map-container');
    const map = document.getElementById('map');
    const addMarkerBtn = document.getElementById('add-marker-btn');
    const clearMarkersBtn = document.getElementById('clear-markers-btn');
    const toggleGridBtn = document.getElementById('toggle-grid-btn');
    const markerForm = document.getElementById('marker-form');
    const markerTitle = document.getElementById('marker-title');
    const markerDescription = document.getElementById('marker-description');
    const saveMarkerBtn = document.getElementById('save-marker');
    const cancelMarkerBtn = document.getElementById('cancel-marker');
    const markerInfo = document.getElementById('marker-info');
    const infoTitle = document.getElementById('info-title');
    const infoDescription = document.getElementById('info-description');
    const closeInfoBtn = document.getElementById('close-info');
    const deleteMarkerBtn = document.getElementById('delete-marker');
    const coordinatesDisplay = document.getElementById('coordinates');

    // Переменные состояния
    let isDragging = false;
    let startX, startY;
    let initialScrollLeft, initialScrollTop;
    let scale = 1;
    let markers = [];
    let isAddingMarker = false;
    let currentMarker = null;
    let gridVisible = false;

    // Загрузка маркеров из localStorage
    loadMarkers();

    // Инициализация карты
    centerMap();

    // Обработчики событий для перемещения карты
    map.addEventListener('mousedown', startDragging);
    map.addEventListener('touchstart', startDraggingTouch, { passive: false });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', dragTouch, { passive: false });
    
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);

    // Обработчики для кнопок управления
    addMarkerBtn.addEventListener('click', toggleAddMarkerMode);
    clearMarkersBtn.addEventListener('click', clearMarkers);
    toggleGridBtn.addEventListener('click', toggleGrid);
    
    // Обработчики для формы маркера
    saveMarkerBtn.addEventListener('click', saveMarker);
    cancelMarkerBtn.addEventListener('click', cancelMarker);
    
    // Обработчики для информации о маркере
    closeInfoBtn.addEventListener('click', closeMarkerInfo);
    deleteMarkerBtn.addEventListener('click', deleteMarker);

    // Обработчик колеса мыши для масштабирования
    mapContainer.addEventListener('wheel', zoom, { passive: false });

    // Отображение координат
    mapContainer.addEventListener('mousemove', updateCoordinates);

    // Функции для перемещения карты
    function startDragging(e) {
        if (isAddingMarker) return;
        
        isDragging = true;
        map.classList.add('dragging');
        startX = e.pageX - map.offsetLeft;
        startY = e.pageY - map.offsetTop;
        initialScrollLeft = map.scrollLeft;
        initialScrollTop = map.scrollTop;
        e.preventDefault();
    }

    function startDraggingTouch(e) {
        if (isAddingMarker) return;
        
        isDragging = true;
        map.classList.add('dragging');
        startX = e.touches[0].pageX - map.offsetLeft;
        startY = e.touches[0].pageY - map.offsetTop;
        initialScrollLeft = map.scrollLeft;
        initialScrollTop = map.scrollTop;
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        
        const x = e.pageX - map.offsetLeft;
        const y = e.pageY - map.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        
        map.scrollLeft = initialScrollLeft - walkX;
        map.scrollTop = initialScrollTop - walkY;
    }

    function dragTouch(e) {
        if (!isDragging) return;
        
        const x = e.touches[0].pageX - map.offsetLeft;
        const y = e.touches[0].pageY - map.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        
        map.scrollLeft = initialScrollLeft - walkX;
        map.scrollTop = initialScrollTop - walkY;
        
        e.preventDefault();
    }

    function stopDragging() {
        isDragging = false;
        map.classList.remove('dragging');
    }

    // Функции для масштабирования
    function zoom(e) {
        e.preventDefault();
        
        const rect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const newScale = scale * (1 + wheel * zoomIntensity);
        
        // Ограничение масштаба
        if (newScale < 0.1 || newScale > 3) return;
        
        // Сохраняем позицию курсора относительно карты
        const xPercent = (mouseX + map.scrollLeft) / map.scrollWidth;
        const yPercent = (mouseY + map.scrollTop) / map.scrollHeight;
        
        scale = newScale;
        map.style.transform = `scale(${scale})`;
        
        // Корректируем позицию прокрутки для сохранения позиции курсора
        const newScrollLeft = xPercent * map.scrollWidth - mouseX;
        const newScrollTop = yPercent * map.scrollHeight - mouseY;
        
        map.scrollLeft = newScrollLeft;
        map.scrollTop = newScrollTop;
        
        updateMarkersPosition();
    }

    // Центрирование карты
    function centerMap() {
        map.scrollLeft = (map.scrollWidth - mapContainer.clientWidth) / 2;
        map.scrollTop = (map.scrollHeight - mapContainer.clientHeight) / 2;
    }

    // Функции для работы с маркерами
    function toggleAddMarkerMode() {
        isAddingMarker = !isAddingMarker;
        
        if (isAddingMarker) {
            addMarkerBtn.textContent = 'Отменить добавление';
            map.style.cursor = 'crosshair';
            map.addEventListener('click', placeMarker);
        } else {
            addMarkerBtn.textContent = 'Добавить маркер';
            map.style.cursor = 'grab';
            map.removeEventListener('click', placeMarker);
        }
    }

    function placeMarker(e) {
        if (!isAddingMarker) return;
        
        const rect = map.getBoundingClientRect();
        const x = e.clientX - rect.left + map.scrollLeft;
        const y = e.clientY - rect.top + map.scrollTop;
        
        // Позиция относительно оригинального размера карты
        const relativeX = x / scale;
        const relativeY = y / scale;
        
        markerForm.classList.remove('hidden');
        currentMarker = { x: relativeX, y: relativeY };
    }

    function saveMarker() {
        const title = markerTitle.value.trim();
        const description = markerDescription.value.trim();
        
        if (!title) {
            alert('Пожалуйста, введите название маркера');
            return;
        }
        
        const marker = {
            id: Date.now(),
            x: currentMarker.x,
            y: currentMarker.y,
            title: title,
            description: description
        };
        
        markers.push(marker);
        createMarkerElement(marker);
        saveMarkersToStorage();
        
        markerForm.classList.add('hidden');
        markerTitle.value = '';
        markerDescription.value = '';
        toggleAddMarkerMode();
    }

    function cancelMarker() {
        markerForm.classList.add('hidden');
        markerTitle.value = '';
        markerDescription.value = '';
        toggleAddMarkerMode();
    }

    function createMarkerElement(marker) {
        const markerElement = document.createElement('div');
        markerElement.className = 'marker';
        markerElement.dataset.id = marker.id;
        markerElement.style.left = `${marker.x}px`;
        markerElement.style.top = `${marker.y}px`;
        
        markerElement.addEventListener('click', function(e) {
            e.stopPropagation();
            showMarkerInfo(marker);
        });
        
        map.appendChild(markerElement);
        return markerElement;
    }

    function showMarkerInfo(marker) {
        infoTitle.textContent = marker.title;
        infoDescription.textContent = marker.description || 'Описание отсутствует';
        markerInfo.dataset.id = marker.id;
        markerInfo.classList.remove('hidden');
    }

    function closeMarkerInfo() {
        markerInfo.classList.add('hidden');
    }

    function deleteMarker() {
        const markerId = parseInt(markerInfo.dataset.id);
        markers = markers.filter(m => m.id !== markerId);
        
        const markerElement = document.querySelector(`.marker[data-id="${markerId}"]`);
        if (markerElement) {
            markerElement.remove();
        }
        
        saveMarkersToStorage();
        closeMarkerInfo();
    }

    function clearMarkers() {
        if (confirm('Вы уверены, что хотите удалить все маркеры?')) {
            markers = [];
            document.querySelectorAll('.marker').forEach(marker => marker.remove());
            saveMarkersToStorage();
        }
    }

    function updateMarkersPosition() {
        document.querySelectorAll('.marker').forEach(markerEl => {
            const markerId = parseInt(markerEl.dataset.id);
            const marker = markers.find(m => m.id === markerId);
            
            if (marker) {
                markerEl.style.left = `${marker.x * scale}px`;
                markerEl.style.top = `${marker.y * scale}px`;
            }
        });
    }

    // Функции для работы с координатной сеткой
    function toggleGrid() {
        gridVisible = !gridVisible;
        
        if (gridVisible) {
            toggleGridBtn.textContent = 'Скрыть сетку';
            createGrid();
        } else {
            toggleGridBtn.textContent = 'Сетка координат';
            removeGrid();
        }
    }

    function createGrid() {
        const gridSize = 512; // Размер ячейки сетки
        
        // Горизонтальные линии
        for (let y = gridSize; y < 10240; y += gridSize) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.top = `${y}px`;
            line.style.left = '0';
            map.appendChild(line);
            
            const label = document.createElement('div');
            label.className = 'grid-label';
            label.textContent = `Y: ${y}`;
            label.style.top = `${y - 10}px`;
            label.style.left = '10px';
            map.appendChild(label);
        }
        
        // Вертикальные линии
        for (let x = gridSize; x < 12288; x += gridSize) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = `${x}px`;
            line.style.top = '0';
            map.appendChild(line);
            
            const label = document.createElement('div');
            label.className = 'grid-label';
            label.textContent = `X: ${x}`;
            label.style.left = `${x - 20}px`;
            label.style.top = '10px';
            map.appendChild(label);
        }
    }

    function removeGrid() {
        document.querySelectorAll('.grid-line, .grid-label').forEach(el => el.remove());
    }

    // Функции для работы с localStorage
    function saveMarkersToStorage() {
        localStorage.setItem('kcd2-markers', JSON.stringify(markers));
    }

    function loadMarkers() {
        const savedMarkers = localStorage.getItem('kcd2-markers');
        if (savedMarkers) {
            markers = JSON.parse(savedMarkers);
            markers.forEach(marker => createMarkerElement(marker));
        }
    }

    // Обновление координат курсора
    function updateCoordinates(e) {
        const rect = map.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left + map.scrollLeft) / scale);
        const y = Math.round((e.clientY - rect.top + map.scrollTop) / scale);
        
        coordinatesDisplay.textContent = `X: ${x}, Y: ${y}`;
    }
});