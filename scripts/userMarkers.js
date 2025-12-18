const USER_MARKERS_COOKIE_KEY = 'kcd2_user_markers';
let userMarkers = [];
let isAddingMarkerMode = false;
const USER_MARKER_ICON = 'assets/icons/question.png';

if (!markers['Мои метки']) {
    markers['Мои метки'] = [];
}

function saveUserMarkersToCookies() {
    try {
        const markerData = userMarkers.map(m => ({
            pixelX: m.pixelX,
            pixelY: m.pixelY,
            title: m.title,
            description: m.description,
            id: m.id
        }));
        
        const jsonData = JSON.stringify(markerData);
        const date = new Date();
        date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        
        document.cookie = USER_MARKERS_COOKIE_KEY + "=" + encodeURIComponent(jsonData) + ";" + expires + ";path=/";
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

function loadUserMarkersFromCookies() {
    try {
        const cookieValue = getCookie(USER_MARKERS_COOKIE_KEY);
        if (cookieValue) {
            const markerData = JSON.parse(decodeURIComponent(cookieValue));
            markerData.forEach(data => addUserMarkerFromData(data));
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
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
    
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
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
    saveUserMarkersToCookies();
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
    
    map.removeLayer(markerInfo.marker);
    const index = markers['Мои метки'].indexOf(markerInfo.marker);
    if (index > -1) {
        markers['Мои метки'].splice(index, 1);
    }
    
    const userIndex = userMarkers.findIndex(m => m.id === markerId);
    if (userIndex > -1) {
        userMarkers.splice(userIndex, 1);
    }
    
    const markerData = {
        pixelX: markerInfo.pixelX,
        pixelY: markerInfo.pixelY,
        title: title,
        description: description,
        id: markerId
    };
    
    addUserMarkerFromData(markerData);
    saveUserMarkersToCookies();
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
    
    map.removeLayer(markerInfo.marker);
    
    const index = markers['Мои метки'].indexOf(markerInfo.marker);
    if (index > -1) {
        markers['Мои метки'].splice(index, 1);
    }
    
    const userIndex = userMarkers.findIndex(m => m.id === markerId);
    if (userIndex > -1) {
        userMarkers.splice(userIndex, 1);
    }
    
    saveUserMarkersToCookies();
    
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
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
        div.innerHTML = '<button id="add-marker-btn" class="add-marker-btn" onclick="toggleAddMarkerMode()">📍 Добавить метку</button>';
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    
    addMarkerControl.addTo(map);
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
    createAddMarkerButton();
    createModals();
    loadUserMarkersFromCookies();
    map.on('click', addNewUserMarker);
});

window.toggleAddMarkerMode = toggleAddMarkerMode;
window.saveNewMarker = saveNewMarker;
window.closeAddMarkerModal = closeAddMarkerModal;
window.editUserMarker = editUserMarker;
window.saveEditedMarker = saveEditedMarker;
window.closeEditMarkerModal = closeEditMarkerModal;
window.deleteUserMarker = deleteUserMarker;
