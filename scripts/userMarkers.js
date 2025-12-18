const USER_MARKERS_COOKIE_KEY = 'kcd2_user_markers';
let userMarkers = [];
let isAddingMarkerMode = false;

const userMarkerIcons = {
    'default': 'assets/icons/шаблон-маркер.png',
    'sword': 'assets/icons/sword.png',
    'home': 'assets/icons/home.png',
    'danger': 'assets/icons/danger.png',
    'question': 'assets/icons/question.png',
    'palm': 'assets/icons/palm.png',
    'beer': 'assets/icons/beer.png',
    'blacksmith': 'assets/icons/blacksmith.png',
    'shield': 'assets/icons/shield.png',
    'tent': 'assets/icons/tent.png'
};

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
            icon: m.icon,
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
    
    const iconUrl = userMarkerIcons[data.icon] || userMarkerIcons['default'];
    const icon = L.icon({
        iconUrl: iconUrl,
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
        icon: data.icon,
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
    document.getElementById('marker-icon').value = 'default';
    
    modal.dataset.pixelX = pixelX;
    modal.dataset.pixelY = pixelY;
}

function saveNewMarker() {
    const modal = document.getElementById('add-marker-modal');
    const title = document.getElementById('marker-title').value.trim();
    const description = document.getElementById('marker-description').value.trim();
    const icon = document.getElementById('marker-icon').value;
    
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
        icon: icon,
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
    document.getElementById('edit-marker-icon').value = markerInfo.icon;
    
    modal.dataset.markerId = markerId;
}

function saveEditedMarker() {
    const modal = document.getElementById('edit-marker-modal');
    const markerId = modal.dataset.markerId;
    const markerInfo = userMarkers.find(m => m.id === markerId);
    
    if (!markerInfo) return;
    
    const title = document.getElementById('edit-marker-title').value.trim();
    const description = document.getElementById('edit-marker-description').value.trim();
    const icon = document.getElementById('edit-marker-icon').value;
    
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
        icon: icon,
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
                    <div class="form-group">
                        <label for="marker-icon">Иконка:</label>
                        <select id="marker-icon" class="form-select">
                            <option value="default">По умолчанию</option>
                            <option value="sword">Меч</option>
                            <option value="home">Дом</option>
                            <option value="danger">Опасность</option>
                            <option value="question">Вопрос</option>
                            <option value="palm">Просьба</option>
                            <option value="beer">Таверна</option>
                            <option value="blacksmith">Кузница</option>
                            <option value="shield">Щит</option>
                            <option value="tent">Лагерь</option>
                        </select>
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
                    <div class="form-group">
                        <label for="edit-marker-icon">Иконка:</label>
                        <select id="edit-marker-icon" class="form-select">
                            <option value="default">По умолчанию</option>
                            <option value="sword">Меч</option>
                            <option value="home">Дом</option>
                            <option value="danger">Опасность</option>
                            <option value="question">Вопрос</option>
                            <option value="palm">Просьба</option>
                            <option value="beer">Таверна</option>
                            <option value="blacksmith">Кузница</option>
                            <option value="shield">Щит</option>
                            <option value="tent">Лагерь</option>
                        </select>
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
