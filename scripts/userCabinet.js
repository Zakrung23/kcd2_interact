let cabinetFilter = 'all';
let cabinetCategory = 'all';

const CATEGORY_SHORT = {
    'Основные квесты': 'Основные',
    'Побочные квесты': 'Побочные',
    'Просьбы': 'Просьбы'
};

function openCabinet() {
    const modal = document.getElementById('cabinet-modal');
    if (modal) {
        modal.style.display = 'flex';
        refreshCabinetUI();
    }
}

function closeCabinet() {
    const modal = document.getElementById('cabinet-modal');
    if (modal) modal.style.display = 'none';
}

function refreshCabinetUI() {
    renderCabinetStats();
    renderCabinetQuestList();
}

function renderCabinetStats() {
    const stats = getQuestStats();
    const overallEl = document.getElementById('cabinet-overall-percent');
    const overallBar = document.getElementById('cabinet-overall-bar');
    const summaryEl = document.getElementById('cabinet-summary');

    if (overallEl) overallEl.textContent = `${stats.percent}%`;
    if (overallBar) overallBar.style.width = `${stats.percent}%`;
    if (summaryEl) {
        summaryEl.textContent = `Выполнено ${stats.completed} из ${stats.total} · В процессе: ${stats.active}`;
    }

    const statsContainer = document.getElementById('cabinet-category-stats');
    if (!statsContainer) return;

    statsContainer.innerHTML = QUEST_CATEGORIES.map(category => {
        const cat = stats.byCategory[category];
        const percent = cat.total ? Math.round((cat.completed / cat.total) * 100) : 0;
        return `
            <div class="cabinet-stat-item">
                <div class="cabinet-stat-header">
                    <span>${CATEGORY_SHORT[category]}</span>
                    <span>${cat.completed}/${cat.total}</span>
                </div>
                <div class="cabinet-progress-track">
                    <div class="cabinet-progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }).join('');

    const markersCount = document.getElementById('cabinet-markers-count');
    if (markersCount && typeof userMarkers !== 'undefined') {
        markersCount.textContent = userMarkers.length;
    }
}

function renderCabinetQuestList() {
    const listEl = document.getElementById('cabinet-quest-list');
    if (!listEl) return;

    let quests = getQuestList(cabinetFilter);
    if (cabinetCategory !== 'all') {
        quests = quests.filter(q => q.category === cabinetCategory);
    }

    if (quests.length === 0) {
        listEl.innerHTML = '<p class="cabinet-empty">Квесты не найдены</p>';
        return;
    }

    listEl.innerHTML = quests.map(quest => `
        <div class="cabinet-quest-item quest-status-${quest.status}">
            <div class="cabinet-quest-info">
                <span class="cabinet-quest-title">${quest.title}</span>
                <span class="cabinet-quest-meta">${CATEGORY_SHORT[quest.category]} · ${QUEST_STATUS_LABELS[quest.status]}</span>
            </div>
            <button class="cabinet-goto-btn" onclick="flyToQuest('${quest.id}'); closeCabinet();" title="Показать на карте">📍</button>
        </div>
    `).join('');
}

function setCabinetFilter(filter, btn) {
    cabinetFilter = filter;
    document.querySelectorAll('.cabinet-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCabinetQuestList();
}

function setCabinetCategory(category) {
    cabinetCategory = category;
    document.querySelectorAll('.cabinet-category-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.category === category);
    });
    renderCabinetQuestList();
}

function handleExportProgress() {
    const json = exportQuestProgress();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kcd2-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportProgress() {
    const input = document.getElementById('cabinet-import-input');
    if (input) input.click();
}

function onImportFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            importQuestProgress(e.target.result);
            refreshCabinetUI();
            if (typeof updateCategoryCounts === 'function') {
                updateCategoryCounts();
            }
            alert('Прогресс успешно импортирован');
        } catch (err) {
            alert('Ошибка импорта: ' + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

function createCabinetButton() {
    const control = L.control({ position: 'topleft' });

    control.onAdd = function() {
        const div = L.DomUtil.create('div', 'cabinet-control');
        div.innerHTML = `
            <button id="cabinet-btn" class="add-marker-btn cabinet-btn" onclick="openCabinet()">
                📜 Мой прогресс
            </button>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
    };

    control.addTo(map);
}

function createCabinetModal() {
    const html = `
        <div id="cabinet-modal" class="marker-modal cabinet-modal">
            <div class="modal-content cabinet-modal-content">
                <div class="modal-header">
                    <h2>Мой прогресс</h2>
                    <span class="modal-close" onclick="closeCabinet()">&times;</span>
                </div>
                <div class="modal-body cabinet-body">
                    <div class="cabinet-overall">
                        <div class="cabinet-overall-header">
                            <span>Общий прогресс</span>
                            <span id="cabinet-overall-percent" class="cabinet-percent">0%</span>
                        </div>
                        <div class="cabinet-progress-track cabinet-overall-track">
                            <div id="cabinet-overall-bar" class="cabinet-progress-fill"></div>
                        </div>
                        <p id="cabinet-summary" class="cabinet-summary"></p>
                    </div>

                    <div id="cabinet-category-stats" class="cabinet-category-stats"></div>

                    <div class="cabinet-user-info">
                        <span>Мои метки на карте: <strong id="cabinet-markers-count">0</strong></span>
                    </div>

                    <div class="cabinet-filters">
                        <button class="cabinet-filter-btn active" onclick="setCabinetFilter('all', this)">Все</button>
                        <button class="cabinet-filter-btn" onclick="setCabinetFilter('active', this)">В процессе</button>
                        <button class="cabinet-filter-btn" onclick="setCabinetFilter('completed', this)">Выполненные</button>
                        <button class="cabinet-filter-btn" onclick="setCabinetFilter('in_progress', this)">Отмеченные</button>
                    </div>

                    <div class="cabinet-category-filters">
                        <button class="cabinet-category-btn active" data-category="all" onclick="setCabinetCategory('all')">Все типы</button>
                        <button class="cabinet-category-btn" data-category="Основные квесты" onclick="setCabinetCategory('Основные квесты')">Основные</button>
                        <button class="cabinet-category-btn" data-category="Побочные квесты" onclick="setCabinetCategory('Побочные квесты')">Побочные</button>
                        <button class="cabinet-category-btn" data-category="Просьбы" onclick="setCabinetCategory('Просьбы')">Просьбы</button>
                    </div>

                    <div id="cabinet-quest-list" class="cabinet-quest-list"></div>
                </div>
                <div class="modal-footer cabinet-footer">
                    <button class="modal-btn cancel-btn" onclick="handleExportProgress()">Экспорт</button>
                    <button class="modal-btn cancel-btn" onclick="handleImportProgress()">Импорт</button>
                    <button class="modal-btn save-btn" onclick="closeCabinet()">Закрыть</button>
                </div>
                <input type="file" id="cabinet-import-input" accept=".json" style="display:none" onchange="onImportFileSelected(event)">
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
}

document.addEventListener('DOMContentLoaded', function() {
    createCabinetButton();
    createCabinetModal();
});

window.openCabinet = openCabinet;
window.closeCabinet = closeCabinet;
window.refreshCabinetUI = refreshCabinetUI;
window.setCabinetFilter = setCabinetFilter;
window.setCabinetCategory = setCabinetCategory;
window.handleExportProgress = handleExportProgress;
window.handleImportProgress = handleImportProgress;
window.onImportFileSelected = onImportFileSelected;
