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
let currentTheme = 'blue';
let sortAscending = false;
let searchQuery = '';
let chatMessages = [];

// ===== ЗАГРУЗКА/СОХРАНЕНИЕ =====
function loadData() {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
        try {
            documents = JSON.parse(savedDocs);
        } catch {
            documents = [];
        }
    }
    
    const savedChats = localStorage.getItem('chatMessages');
    if (savedChats) {
        try {
            chatMessages = JSON.parse(savedChats);
        } catch {
            chatMessages = [];
        }
    }
    
    const theme = localStorage.getItem('theme');
    if (theme) {
        currentTheme = theme;
        document.body.className = 'theme-' + theme;
    }
    
    const passwords = localStorage.getItem('userPasswords');
    if (!passwords) {
        const defaultPasswords = {
            user1: '1234',
            user2: '1234'
        };
        localStorage.setItem('userPasswords', JSON.stringify(defaultPasswords));
    }
}

function saveDocuments() {
    localStorage.setItem('documents', JSON.stringify(documents));
}

function saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
}

function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

function getPasswords() {
    const data = localStorage.getItem('userPasswords');
    return data ? JSON.parse(data) : {};
}

function savePasswords(passwords) {
    localStorage.setItem('userPasswords', JSON.stringify(passwords));
}

// ===== ВХОД =====
function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPassword').value;
    
    const passwords = getPasswords();
    
    if (!passwords[userId]) {
        alert('❌ Пользователь не зарегистрирован! Обратитесь к администратору.');
        return;
    }
    
    if (passwords[userId] !== password) {
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

    loadData();
    renderDocuments();
    updateDocCount();
    renderChatMessages();

    const banner = document.getElementById('roleBanner');
    if (currentUser.role === 'Поставщик') {
        banner.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        banner.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
}

// ===== ВЫХОД =====
function logout() {
    currentUser = null;
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
    saveTheme(theme);
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
function handleUpload(event) {
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
    reader.onload = function(e) {
        newDoc.fileData = e.target.result;
        documents.unshift(newDoc);
        saveDocuments();
        renderDocuments();
        updateDocCount();
        document.getElementById('uploadForm').reset();
        showNotification('✅ Документ "' + file.name + '" успешно загружен!');
    };
    reader.readAsDataURL(file);
}

// ===== УДАЛЕНИЕ =====
function deleteDoc(id) {
    if (!confirm('🗑 Удалить этот документ?')) return;
    
    documents = documents.filter(d => d.id !== id);
    saveDocuments();
    renderDocuments();
    updateDocCount();
    showNotification('🗑 Документ удалён');
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

function clearChat() {
    if (!confirm('🗑 Очистить всю историю чата?')) return;
    chatMessages = [];
    saveChatMessages();
    renderChatMessages();
    showNotification('🗑 Чат очищен');
}

function sendMessage(event) {
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
    saveChatMessages();
    renderChatMessages();
    input.value = '';
    scrollChatToBottom();
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
loadData();