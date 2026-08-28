// ===== КОНФИГУРАЦИЯ JSONBIN =====
// ТОЛЬКО ЗДЕСЬ МЕНЯЙТЕ! ВСТАВЬТЕ СВОЙ API KEY
const CONFIG = {
    BIN_ID: '6a916c28da38895dfe1be603',  // УЖЕ ВСТАВЛЕН
    API_KEY: '$2a$10$rI2x9qva3go7LWV0fOjuR.BxNY6nScpawDDyHJpN13ydqq.W4rOZq'   // 👈 ТОЛЬКО ЭТО МЕНЯЙТЕ!
};

// ===== ДАННЫЕ ПОЛЬЗОВАТЕЛЕЙ =====
const users = {
    user1: { 
        id: 'user1',
        name: 'Акмаль', 
        role: 'Поставщик', 
        description: '📦 Загружаю документы для печати',
        icon: '📦'
    },
    user2: { 
        id: 'user2',
        name: 'Рамзиддин', 
        role: 'Менеджер', 
        description: '📋 Отправляю документы на печать',
        icon: '📋'
    }
};

let currentUser = null;
let documents = [];
let chatMessages = [];
let currentTheme = 'blue';
let sortAscending = false;
let searchQuery = '';

// ===== РАБОТА С JSONBIN =====
async function loadFromCloud() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const data = await response.json();
        const record = data.record;
        
        if (record) {
            documents = record.documents || [];
            chatMessages = record.chatMessages || [];
            
            if (record.passwords) {
                localStorage.setItem('userPasswords', JSON.stringify(record.passwords));
            }
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка загрузки из облака:', error);
        return false;
    }
}

async function saveToCloud() {
    try {
        const data = {
            documents: documents,
            chatMessages: chatMessages,
            passwords: JSON.parse(localStorage.getItem('userPasswords') || '{}'),
            lastUpdated: new Date().toISOString()
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.API_KEY
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка сохранения данных');
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в облако:', error);
        return false;
    }
}

async function syncData(showStatus = true) {
    const syncBtn = document.querySelector('.sync-btn');
    if (syncBtn) {
        syncBtn.classList.add('syncing');
        syncBtn.textContent = '⏳ Синхронизация...';
    }
    
    if (showStatus) {
        showSyncStatus('🔄 Синхронизация данных...', 'loading');
    }
    
    const loaded = await loadFromCloud();
    
    if (loaded) {
        const saved = await saveToCloud();
        
        if (saved) {
            showSyncStatus('✅ Данные синхронизированы!', 'success');
            renderDocuments();
            renderChatMessages();
            updateDocCount();
        } else {
            showSyncStatus('❌ Ошибка сохранения данных', 'error');
        }
    } else {
        const saved = await saveToCloud();
        if (saved) {
            showSyncStatus('✅ Данные сохранены в облаке!', 'success');
        } else {
            showSyncStatus('❌ Ошибка синхронизации', 'error');
        }
    }
    
    if (syncBtn) {
        syncBtn.classList.remove('syncing');
        syncBtn.textContent = '🔄 Синхронизация';
    }
}

function showSyncStatus(message, type = 'info') {
    const existing = document.querySelector('.sync-status');
    if (existing) existing.remove();
    
    const status = document.createElement('div');
    status.className = `sync-status ${type}`;
    status.textContent = message;
    document.body.appendChild(status);
    
    setTimeout(() => {
        status.style.opacity = '0';
        status.style.transition = '0.5s';
        setTimeout(() => status.remove(), 500);
    }, 3000);
}

// ===== АВТО-СИНХРОНИЗАЦИЯ =====
let autoSyncInterval = null;

function startAutoSync() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
        if (currentUser) {
            syncData(false);
        }
    }, 30000);
}

// ===== ПАРОЛИ =====
function getPasswords() {
    const data = localStorage.getItem('userPasswords');
    return data ? JSON.parse(data) : {};
}

function savePasswords(passwords) {
    localStorage.setItem('userPasswords', JSON.stringify(passwords));
    if (currentUser) {
        saveToCloud();
    }
}

// ===== ВХОД =====
async function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPassword').value;
    
    await loadFromCloud();
    
    const passwords = getPasswords();
    
    if (!passwords[userId]) {
        passwords[userId] = password;
        savePasswords(passwords);
        await saveToCloud();
        alert('✅ Пользователь создан! Добро пожаловать!');
    } else if (passwords[userId] !== password) {
        alert('❌ Неверный пароль!');
        return;
    }
    
    login(userId);
}

function login(userId) {
    currentUser = users[userId];
    if (!currentUser) return;

    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');

    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('roleName').textContent = currentUser.name;
    document.getElementById('roleDescription').textContent = currentUser.description;
    document.querySelector('.banner-icon').textContent = currentUser.icon;

    const theme = localStorage.getItem('theme');
    if (theme) {
        currentTheme = theme;
        document.body.className = 'theme-' + theme;
    }

    renderDocuments();
    renderChatMessages();
    updateDocCount();

    const banner = document.getElementById('roleBanner');
    if (currentUser.role === 'Поставщик') {
        banner.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        banner.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
    
    startAutoSync();
}

// ===== ВЫХОД =====
function logout() {
    currentUser = null;
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
    document.getElementById('dashboardPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('uploadForm').reset();
    document.getElementById('settingsPanel').classList.remove('active');
    document.getElementById('loginPassword').value = '';
}

// ===== НАСТРОЙКИ =====
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.className = 'theme-' + theme;
    localStorage.setItem('theme', theme);
    document.getElementById('settingsPanel').classList.remove('active');
    showNotification('🎨 Тема изменена');
}

function changePassword(event) {
    event.preventDefault();
    
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('newPasswordConfirm').value;
    
    const passwords = getPasswords();
    
    if (passwords[currentUser.id] !== current) {
        alert('❌ Текущий пароль неверен!');
        return;
    }
    
    if (newPass !== confirm) {
        alert('❌ Новые пароли не совпадают!');
        return;
    }
    
    if (newPass.length < 4) {
        alert('❌ Пароль должен быть минимум 4 символа!');
        return;
    }
    
    passwords[currentUser.id] = newPass;
    savePasswords(passwords);
    
    alert('✅ Пароль успешно изменён!');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newPasswordConfirm').value = '';
    document.getElementById('settingsPanel').classList.remove('active');
}

// ===== ЗАГРУЗКА ФАЙЛА =====
async function handleUpload(event) {
    event.preventDefault();

    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('descriptionInput');

    const file = fileInput.files[0];
    const description = descriptionInput.value.trim();

    if (!file) {
        alert('Выберите PDF-файл');
        return;
    }

    if (!description) {
        alert('Введите описание документа');
        return;
    }

    const newDoc = {
        id: Date.now(),
        name: file.name,
        description: description,
        size: (file.size / 1024).toFixed(1) + ' KB',
        date: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        uploadedBy: currentUser.name,
        fileData: null
    };

    const reader = new FileReader();
    reader.onload = async function(e) {
        newDoc.fileData = e.target.result;
        documents.unshift(newDoc);
        
        const saved = await saveToCloud();
        if (saved) {
            renderDocuments();
            updateDocCount();
            document.getElementById('uploadForm').reset();
            showNotification('✅ Документ "' + file.name + '" загружен и синхронизирован!');
        } else {
            showNotification('⚠️ Документ сохранён локально, но не синхронизирован');
        }
    };
    reader.readAsDataURL(file);
}

// ===== УДАЛЕНИЕ =====
async function deleteDoc(id) {
    if (!confirm('🗑 Удалить этот документ?')) return;
    
    documents = documents.filter(d => d.id !== id);
    const saved = await saveToCloud();
    if (saved) {
        renderDocuments();
        updateDocCount();
        showNotification('🗑 Документ удалён');
    } else {
        showNotification('❌ Ошибка удаления документа');
    }
}

// ===== СКАЧИВАНИЕ =====
function downloadDoc(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc || !doc.fileData) {
        alert('Файл не найден');
        return;
    }

    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== ПОИСК =====
function filterDocuments() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    renderDocuments();
}

// ===== СОРТИРОВКА =====
function toggleSort() {
    sortAscending = !sortAscending;
    const btn = document.getElementById('sortBtn');
    btn.textContent = sortAscending ? '📅 Сортировка: по старым' : '📅 Сортировка: по новым';
    renderDocuments();
}

// ===== ОТОБРАЖЕНИЕ ДОКУМЕНТОВ =====
function renderDocuments() {
    const container = document.getElementById('documentsList');
    
    let filtered = documents;
    if (searchQuery) {
        filtered = filtered.filter(doc => 
            doc.name.toLowerCase().includes(searchQuery) ||
            doc.description.toLowerCase().includes(searchQuery)
        );
    }
    
    const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortAscending ? dateA - dateB : dateB - dateA;
    });

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>${documents.length === 0 ? 'Пока нет загруженных документов' : 'Ничего не найдено'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = sorted.map(doc => `
        <div class="doc-card">
            <div class="doc-name">📄 ${doc.name}</div>
            <div class="doc-desc">${doc.description}</div>
            <div class="doc-meta">
                <span>${doc.dateFormatted || doc.date}</span>
                <span class="doc-badge">${doc.uploadedBy}</span>
            </div>
            <div style="margin-top: 4px; font-size: 0.75rem; color: #aaa;">
                ${doc.size}
            </div>
            <div class="doc-actions">
                <button class="download-btn" onclick="downloadDoc(${doc.id})">⬇ Скачать</button>
                <button class="delete-btn" onclick="deleteDoc(${doc.id})">🗑 Удалить</button>
            </div>
        </div>
    `).join('');
}

function updateDocCount() {
    document.getElementById('docCount').textContent = documents.length;
}

// ===== ЧАТ =====
function toggleChat() {
    const body = document.getElementById('chatBody');
    const toggle = document.getElementById('chatToggle');
    body.classList.toggle('active');
    toggle.textContent = body.classList.contains('active') ? '▲' : '▼';
    if (body.classList.contains('active')) {
        scrollChatToBottom();
    }
}

async function clearChat() {
    if (!confirm('🗑 Очистить всю историю чата?')) return;
    chatMessages = [];
    const saved = await saveToCloud();
    if (saved) {
        renderChatMessages();
        showNotification('🗑 Чат очищен');
    } else {
        showNotification('❌ Ошибка очистки чата');
    }
}

async function sendMessage(event) {
    event.preventDefault();
    
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }
    
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const message = {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: text,
        time: new Date().toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: new Date().toISOString()
    };
    
    chatMessages.push(message);
    const saved = await saveToCloud();
    if (saved) {
        renderChatMessages();
        input.value = '';
        scrollChatToBottom();
    } else {
        showNotification('❌ Ошибка отправки сообщения');
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    
    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>Напишите первое сообщение 📝</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = chatMessages.map(msg => `
        <div class="chat-message ${msg.userId === currentUser?.id ? 'self' : 'other'}">
            <div style="font-weight: 600; font-size: 0.85rem;">${msg.userName}</div>
            <div>${msg.text}</div>
            <div class="msg-meta">${msg.time}</div>
        </div>
    `).join('');
}

function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// ===== УВЕДОМЛЕНИЕ =====
function showNotification(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #2d2d2d;
        color: white;
        padding: 16px 28px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        font-weight: 500;
        z-index: 9999;
        animation: slideUp 0.4s ease;
        max-width: 400px;
    `;
    document.body.appendChild(toast);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(30px)';
        toast.style.transition = '0.4s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
loadFromCloud().then(() => {
    renderDocuments();
    renderChatMessages();
    updateDocCount();
});