const QUEST_PROGRESS_KEY = 'kcd2_quest_progress';

const QUEST_CATEGORIES = ['Основные квесты', 'Побочные квесты', 'Просьбы'];

const QUEST_STATUS_LABELS = {
    not_started: 'Не начат',
    active: 'В процессе',
    completed: 'Выполнен'
};

const questRegistry = {};
let questProgress = {};

function isQuestCategory(category) {
    return QUEST_CATEGORIES.includes(category);
}

function loadQuestProgressFromStorage() {
    try {
        const stored = localStorage.getItem(QUEST_PROGRESS_KEY);
        questProgress = stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Ошибка загрузки прогресса квестов:', error);
        questProgress = {};
        localStorage.removeItem(QUEST_PROGRESS_KEY);
    }
}

function saveQuestProgressToStorage() {
    try {
        localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify(questProgress));
    } catch (error) {
        console.error('Ошибка сохранения прогресса квестов:', error);
    }
}

function getQuestStatus(questId) {
    return questProgress[questId] || 'not_started';
}

function setQuestStatus(questId, status) {
    if (!questRegistry[questId]) return;

    if (status === 'not_started') {
        delete questProgress[questId];
    } else {
        questProgress[questId] = status;
    }

    saveQuestProgressToStorage();
    applyQuestVisual(questRegistry[questId].marker, status);
    updateQuestPopup(questId);

    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
    if (typeof refreshCabinetUI === 'function') {
        refreshCabinetUI();
    }
}

function registerQuestMarker(questId, marker, meta) {
    questRegistry[questId] = {
        marker,
        pixelX: meta.pixelX,
        pixelY: meta.pixelY,
        title: meta.title,
        description: meta.description,
        category: meta.category
    };

    const status = getQuestStatus(questId);
    applyQuestVisual(marker, status);
    marker.bindPopup(() => buildQuestPopupContent(questId));
}

function applyQuestVisual(marker, status) {
    const icon = marker._icon;
    if (!icon) return;

    icon.classList.remove('quest-active', 'quest-completed');
    if (status === 'completed') {
        icon.classList.add('quest-completed');
    } else if (status === 'active') {
        icon.classList.add('quest-active');
    }
}

function applyAllQuestVisuals() {
    Object.keys(questRegistry).forEach(questId => {
        const entry = questRegistry[questId];
        applyQuestVisual(entry.marker, getQuestStatus(questId));
        entry.marker.bindPopup(() => buildQuestPopupContent(questId));
    });
}

function buildQuestPopupContent(questId) {
    const entry = questRegistry[questId];
    if (!entry) return '';

    const status = getQuestStatus(questId);
    const statusLabel = QUEST_STATUS_LABELS[status];

    return `
        <div class="popup-content quest-popup">
            <div class="popup-title-row">
                <div class="popup-icon"></div>
                <h3 class="${status === 'completed' ? 'quest-title-completed' : ''}">${entry.title}</h3>
            </div>
            <p>${entry.description}</p>
            <div class="quest-status-badge quest-status-${status}">${statusLabel}</div>
            <small><em>Категория: ${entry.category}</em></small>
            <div class="quest-status-controls">
                <button class="quest-status-btn ${status === 'active' ? 'active' : ''}"
                    onclick="setQuestStatus('${questId}', 'active')">В процессе</button>
                <button class="quest-status-btn ${status === 'completed' ? 'active' : ''}"
                    onclick="setQuestStatus('${questId}', 'completed')">Выполнен</button>
                <button class="quest-status-btn reset-btn"
                    onclick="setQuestStatus('${questId}', 'not_started')">Сбросить</button>
            </div>
        </div>
    `;
}

function updateQuestPopup(questId) {
    const entry = questRegistry[questId];
    if (!entry || !entry.marker.isPopupOpen()) return;
    entry.marker.setPopupContent(buildQuestPopupContent(questId));
}

function flyToQuest(questId) {
    const entry = questRegistry[questId];
    if (!entry) return;

    const coordinates = map.unproject([entry.pixelX, entry.pixelY], map.getMaxZoom() - 1);
    map.flyTo(coordinates, map.getZoom(), { duration: 0.8 });
    setTimeout(() => entry.marker.openPopup(), 850);
}

function getQuestStats() {
    const stats = {
        total: 0,
        completed: 0,
        active: 0,
        byCategory: {}
    };

    QUEST_CATEGORIES.forEach(category => {
        stats.byCategory[category] = { total: 0, completed: 0, active: 0 };
    });

    Object.entries(questRegistry).forEach(([questId, entry]) => {
        const status = getQuestStatus(questId);
        stats.total++;
        stats.byCategory[entry.category].total++;

        if (status === 'completed') {
            stats.completed++;
            stats.byCategory[entry.category].completed++;
        } else if (status === 'active') {
            stats.active++;
            stats.byCategory[entry.category].active++;
        }
    });

    stats.percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
    return stats;
}

function getQuestList(filter = 'all') {
    return Object.entries(questRegistry)
        .map(([id, entry]) => ({
            id,
            ...entry,
            status: getQuestStatus(id)
        }))
        .filter(quest => {
            if (filter === 'active') return quest.status === 'active';
            if (filter === 'completed') return quest.status === 'completed';
            if (filter === 'in_progress') return quest.status !== 'not_started';
            return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

function exportQuestProgress() {
    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        progress: questProgress
    }, null, 2);
}

function importQuestProgress(jsonString) {
    const data = JSON.parse(jsonString);
    const progress = data.progress || data;

    if (typeof progress !== 'object' || Array.isArray(progress)) {
        throw new Error('Неверный формат файла');
    }

    questProgress = {};
    Object.entries(progress).forEach(([questId, status]) => {
        if (questRegistry[questId] && ['active', 'completed'].includes(status)) {
            questProgress[questId] = status;
        }
    });

    saveQuestProgressToStorage();
    applyAllQuestVisuals();
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
}

function initQuestProgress() {
    loadQuestProgressFromStorage();
    applyAllQuestVisuals();
    if (typeof updateCategoryCounts === 'function') {
        updateCategoryCounts();
    }
}

window.setQuestStatus = setQuestStatus;
window.flyToQuest = flyToQuest;
window.initQuestProgress = initQuestProgress;
window.getQuestStats = getQuestStats;
window.getQuestList = getQuestList;
window.exportQuestProgress = exportQuestProgress;
window.importQuestProgress = importQuestProgress;
window.isQuestCategory = isQuestCategory;
window.QUEST_CATEGORIES = QUEST_CATEGORIES;
window.QUEST_STATUS_LABELS = QUEST_STATUS_LABELS;
window.getQuestStatus = getQuestStatus;
