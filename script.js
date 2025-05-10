// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Применение темы Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hint_color || '#999999');
document.documentElement.style.setProperty('--tg-theme-link-color', tg.link_color || '#2481cc');
document.documentElement.style.setProperty('--tg-theme-button-color', tg.button_color || '#2481cc');
document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.button_text_color || '#ffffff');

// DOM элементы
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const walletAddress = document.getElementById('wallet-address');
const copyBtn = document.getElementById('copy-btn');
const notification = document.getElementById('notification');
const qrCode = document.getElementById('qr-code');

// Установка данных пользователя
if (tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    if (user.photo_url) {
        userPhoto.src = user.photo_url;
    }
}

// Функция для генерации QR кода (простая SVG реализация)
function generateQRCode(text) {
    // Для простоты используем текст внутри SVG
    // В реальном приложении вы можете использовать библиотеку для генерации QR кода
    const qrSvg = `
        <svg viewBox="0 0 200 200" width="200" height="200">
            <rect x="0" y="0" width="200" height="200" fill="white"/>
            <text x="100" y="95" text-anchor="middle" font-size="8">USDT TRC20</text>
            <text x="100" y="110" text-anchor="middle" font-size="7">${text.substring(0, 15)}...</text>
        </svg>
    `;
    qrCode.innerHTML = qrSvg;
}

// Функция для генерации "псевдо-случайного" адреса кошелька на основе идентификатора пользователя
function generateWalletAddress(userId) {
    // В реальном приложении мы бы взаимодействовали с бэкендом
    // Это просто демонстрационная реализация
    const hash = CryptoJS.SHA256(userId.toString() + "salt_for_trc20").toString();
    return "T" + hash.substring(0, 33);
}

// Функция для копирования в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    });
}

// Обработчик клика на кнопку копирования
copyBtn.addEventListener('click', () => {
    copyToClipboard(walletAddress.value);
});

// Функция для получения кошелька с бэкенда
async function fetchWallet() {
    try {
        // Получаем идентификатор пользователя из Telegram WebApp
        const userId = tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000);
        
        // В реальном приложении здесь должен быть запрос на бэкенд
        const response = await fetch(`http://localhost:8000/wallet/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // В реальном приложении передайте дополнительные заголовки для аутентификации
                'X-Telegram-Data': tg.initData
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            walletAddress.value = data.wallet_address;
            generateQRCode(data.wallet_address);
        } else {
            // Если бэкенд недоступен, генерируем "фейковый" адрес на клиенте
            const fakeAddress = generateWalletAddress(userId);
            walletAddress.value = fakeAddress;
            generateQRCode(fakeAddress);
        }
    } catch (error) {
        console.error('Error fetching wallet:', error);
        // В случае ошибки также используем "фейковый" адрес
        const userId = tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000);
        const fakeAddress = generateWalletAddress(userId);
        walletAddress.value = fakeAddress;
        generateQRCode(fakeAddress);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Получаем кошелек
    fetchWallet();
    
    // Показываем уведомление, что приложение готово
    tg.ready();
});
