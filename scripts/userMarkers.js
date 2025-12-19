let userMarkers = [];
let isAddingMarkerMode = false;
const USER_MARKER_ICON = 'assets/icons/self.png';
const STORAGE_KEY = 'kcd2_user_markers';

// Инициализация категории "Мои метки"
if (!markers['Мои метки']) {
    markers['Мои метки'] = [];
}

// Загрузка меток из Local Storage
function loadUserMarkersFromStorage() {
    try {
        const storedMarkers = localStorage.getItem(STORAGE_KEY);
        if (storedMarkers) {
            const markersData = JSON.parse(storedMarkers);
            markersData.forEach(markerData => {
                addUserMarkerFromData(markerData);
            });
            console.log(`Загружено ${markersData.length} пользовательских меток из Local Storage`);
        }
    } catch (error) {
        console.error('Ошибка при загрузке меток из Local Storage:', error);
        // Если есть ошибка, очищаем хранилище
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Сохранение меток в Local Storage
function saveUserMarkersToStorage() {
    try {
        const markersToSave = userMarkers.map(markerInfo => ({
            pixelX: markerInfo.pixelX,
            pixelY: markerInfo.pixelY,
            title: markerInfo.title,
            description: markerInfo.description,
            id: markerInfo.id
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(markersToSave));
        console.log(`Сохранено ${markersToSave.length} пользовательских меток в Local Storage`);
    } catch (error) {
        console.error('Ошибка при сохранении меток в Local Storage:', error);
    }
}

// Очистка всех пользовательских меток из хранилища
function clearUserMarkersStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Все пользовательские метки удалены из Local Storage');
    } catch (error) {
        console.error('Ошибка при очистке Local Storage:', error);
    }
}

function addUserMarkerFromData(data) {
    const coordinates = map.unproject([data.pixelX, data.pixelY], map.getMaxZoom() - 1);
    
    const icon = L.icon({
        iconUrl: USER_MARKER_ICON,
        iconSize: [30, 38],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const marker = L.marker(coordinates, { 
        icon: icon, 
        category: 'Мои метки',
        title: data.title,
        userMarker: true,
        markerId: data.id
    });
    
    marker.bindPopup(`
        <div class="popup-content">
            <div class="popup-title-row">
                <div class="popup-icon"></div>
                <h3>${data.title}</h3>
            </div>
            <p>${data.description}</p>
            <small><em>Категория: Мои метки</em></small>
            <div class="user-marker-controls">
                <button class="user-marker-btn edit-btn" onclick="editUserMarker('${data.id}')">
                    ✏️ Редактировать
                </button>
                <button class="user-marker-btn delete-btn" onclick="deleteUserMarker('${data.id}')">
                    🗑️ Удалить
                </button>
            </div>
        </div>
    `);
    
    marker.addTo(map);
    
    const markerInfo = {
        marker: marker,
        pixelX: data.pixelX,
        pixelY: data.pixelY,
        title: data.title,
        description: data.description,
        id: data.id
    };
    
    userMarkers.push(markerInfo);
    markers['Мои метки'].push(marker);
    
    // Сохраняем изменения в Local Storage
    saveUserMarkersToStorage();
    
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
    
    return markerInfo;
}

function addNewUserMarker(e) {
    if (!isAddingMarkerMode) return;
    
    const pixelCoords = map.project(e.latlng, map.getMaxZoom() - 1);
    const pixelX = Math.round(pixelCoords.x);
    const pixelY = Math.round(pixelCoords.y);
    
    showAddMarkerModal(pixelX, pixelY);
    isAddingMarkerMode = false;
    updateAddMarkerButtonState();
}

function showAddMarkerModal(pixelX, pixelY) {
    const modal = document.getElementById('add-marker-modal');
    modal.style.display = 'flex';
    
    document.getElementById('marker-title').value = '';
    document.getElementById('marker-description').value = '';
    
    modal.dataset.pixelX = pixelX;
    modal.dataset.pixelY = pixelY;
}

function saveNewMarker() {
    const modal = document.getElementById('add-marker-modal');
    const title = document.getElementById('marker-title').value.trim();
    const description = document.getElementById('marker-description').value.trim();
    
    if (!title) {
        alert('Введите название метки');
        return;
    }
    
    const pixelX = parseInt(modal.dataset.pixelX);
    const pixelY = parseInt(modal.dataset.pixelY);
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const markerData = {
        pixelX: pixelX,
        pixelY: pixelY,
        title: title,
        description: description || 'Моя метка',
        id: id
    };
    
    addUserMarkerFromData(markerData);
    closeAddMarkerModal();
}

function closeAddMarkerModal() {
    document.getElementById('add-marker-modal').style.display = 'none';
}

function editUserMarker(markerId) {
    const markerInfo = userMarkers.find(m => m.id === markerId);
    if (!markerInfo) return;
    
    const modal = document.getElementById('edit-marker-modal');
    modal.style.display = 'flex';
    
    document.getElementById('edit-marker-title').value = markerInfo.title;
    document.getElementById('edit-marker-description').value = markerInfo.description;
    
    modal.dataset.markerId = markerId;
}

function saveEditedMarker() {
    const modal = document.getElementById('edit-marker-modal');
    const markerId = modal.dataset.markerId;
    const markerInfo = userMarkers.find(m => m.id === markerId);
    
    if (!markerInfo) return;
    
    const title = document.getElementById('edit-marker-title').value.trim();
    const description = document.getElementById('edit-marker-description').value.trim();
    
    if (!title) {
        alert('Введите название метки');
        return;
    }
    
    // Удаляем старую метку
    map.removeLayer(markerInfo.marker);
    const index = markers['Мои метки'].indexOf(markerInfo.marker);
    if (index > -1) {
        markers['Мои метки'].splice(index, 1);
    }
    
    const userIndex = userMarkers.findIndex(m => m.id === markerId);
    if (userIndex > -1) {
        userMarkers.splice(userIndex, 1);
    }
    
    // Создаем обновленную метку
    const markerData = {
        pixelX: markerInfo.pixelX,
        pixelY: markerInfo.pixelY,
        title: title,
        description: description,
        id: markerId
    };
    
    addUserMarkerFromData(markerData);
    closeEditMarkerModal();
}

function closeEditMarkerModal() {
    document.getElementById('edit-marker-modal').style.display = 'none';
}

function deleteUserMarker(markerId) {
    if (!confirm('Удалить эту метку?')) {
        return;
    }
    
    const markerInfo = userMarkers.find(m => m.id === markerId);
    if (!markerInfo) return;
    
    // Удаляем с карты
    map.removeLayer(markerInfo.marker);
    
    // Удаляем из категории
    const index = markers['Мои метки'].indexOf(markerInfo.marker);
    if (index > -1) {
        markers['Мои метки'].splice(index, 1);
    }
    
    // Удаляем из массива пользовательских меток
    const userIndex = userMarkers.findIndex(m => m.id === markerId);
    if (userIndex > -1) {
        userMarkers.splice(userIndex, 1);
    }
    
    // Сохраняем изменения в Local Storage
    saveUserMarkersToStorage();
    
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
}

// Функция для удаления всех пользовательских меток
function deleteAllUserMarkers() {
    if (!confirm('Удалить все ваши метки? Это действие нельзя отменить.')) {
        return;
    }
    
    // Удаляем все метки с карты
    markers['Мои метки'].forEach(marker => {
        map.removeLayer(marker);
    });
    
    // Очищаем массивы
    userMarkers = [];
    markers['Мои метки'] = [];
    
    // Очищаем Local Storage
    clearUserMarkersStorage();
    
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
    
    alert('Все пользовательские метки удалены');
}

function toggleAddMarkerMode() {
    isAddingMarkerMode = !isAddingMarkerMode;
    updateAddMarkerButtonState();
    map.getContainer().style.cursor = isAddingMarkerMode ? 'crosshair' : '';
}

function updateAddMarkerButtonState() {
    const btn = document.getElementById('add-marker-btn');
    if (btn) {
        if (isAddingMarkerMode) {
            btn.classList.add('active');
            btn.innerHTML = '❌ Отменить';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '📍 Добавить метку';
        }
    }
}

function createAddMarkerButton() {
    const addMarkerControl = L.control({ position: 'topleft' });
    
    addMarkerControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'add-marker-control');
        div.innerHTML = `
            <button id="add-marker-btn" class="add-marker-btn" onclick="toggleAddMarkerMode()">
                📍 Добавить метку
            </button>
            ${userMarkers.length > 0 ? `
            <button id="clear-marker-btn" class="add-marker-btn clear-btn" onclick="deleteAllUserMarkers()" title="Удалить все мои метки">
                🗑️ Очистить все
            </button>
            ` : ''}
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    
    addMarkerControl.addTo(map);
}

// Обновление кнопки очистки
function updateClearButton() {
    const controlDiv = document.querySelector('.add-marker-control');
    if (controlDiv) {
        const clearBtn = document.getElementById('clear-marker-btn');
        if (userMarkers.length > 0 && !clearBtn) {
            const newClearBtn = document.createElement('button');
            newClearBtn.id = 'clear-marker-btn';
            newClearBtn.className = 'add-marker-btn clear-btn';
            newClearBtn.innerHTML = '🗑️ Очистить все';
            newClearBtn.title = 'Удалить все мои метки';
            newClearBtn.onclick = deleteAllUserMarkers;
            controlDiv.appendChild(newClearBtn);
        } else if (userMarkers.length === 0 && clearBtn) {
            clearBtn.remove();
        }
    }
}

function createModals() {
    const modalsHTML = `
        <div id="add-marker-modal" class="marker-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Добавить метку</h2>
                    <span class="modal-close" onclick="closeAddMarkerModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="marker-title">Название:</label>
                        <input type="text" id="marker-title" class="form-input" placeholder="Введите название" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="marker-description">Описание:</label>
                        <textarea id="marker-description" class="form-textarea" placeholder="Введите описание" rows="3" maxlength="200"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="closeAddMarkerModal()">Отмена</button>
                    <button class="modal-btn save-btn" onclick="saveNewMarker()">Сохранить</button>
                </div>
            </div>
        </div>
        
        <div id="edit-marker-modal" class="marker-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Редактировать метку</h2>
                    <span class="modal-close" onclick="closeEditMarkerModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-marker-title">Название:</label>
                        <input type="text" id="edit-marker-title" class="form-input" placeholder="Введите название" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="edit-marker-description">Описание:</label>
                        <textarea id="edit-marker-description" class="form-textarea" placeholder="Введите описание" rows="3" maxlength="200"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="closeEditMarkerModal()">Отмена</button>
                    <button class="modal-btn save-btn" onclick="saveEditedMarker()">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = modalsHTML;
    document.body.appendChild(container);
}

document.addEventListener('DOMContentLoaded', function() {
    // Сначала загружаем метки из Local Storage
    loadUserMarkersFromStorage();
    
    // Затем создаем UI элементы
    createAddMarkerButton();
    createModals();
    
    // Добавляем обработчик кликов на карту
    map.on('click', addNewUserMarker);
});

// Экспортируем функции в глобальную область видимости
window.toggleAddMarkerMode = toggleAddMarkerMode;
window.saveNewMarker = saveNewMarker;
window.closeAddMarkerModal = closeAddMarkerModal;
window.editUserMarker = editUserMarker;
window.saveEditedMarker = saveEditedMarker;
window.closeEditMarkerModal = closeEditMarkerModal;
window.deleteUserMarker = deleteUserMarker;
window.deleteAllUserMarkers = deleteAllUserMarkers;
window.saveUserMarkersToStorage = saveUserMarkersToStorage;
window.loadUserMarkersFromStorage = loadUserMarkersFromStorage;
