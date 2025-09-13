/*!
* Start Bootstrap - Resume v7.0.4 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('mode-toggle');
    const icon = toggleButton.querySelector('i');
    const body = document.body;

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // 檢查 localStorage 中是否有儲存的使用者偏好
    const currentTheme = localStorage.getItem('theme');

    // 根據儲存的偏好或系統偏好設定初始模式
    if (currentTheme) {
        body.classList.toggle('dark-mode', currentTheme === 'dark');
        if (currentTheme === 'dark') {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
        } else {
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
        }
    } else {
        // 如果沒有儲存的偏好，則根據系統設定來初始化
        if (prefersDarkScheme.matches) {
            body.classList.add('dark-mode');
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
            localStorage.setItem('theme', 'light');
        }
    }

    // 彩蛋模式變數
    let clickCount = 0;
    let firstClickTime = 0;
    const EASTER_EGG_CLICKS = 10;
    const EASTER_EGG_TIME_LIMIT = 5 * 1000; // 5 秒
    let colorIntervalId = null; // 新增變數來儲存動畫 ID

    // 監聽按鈕點擊事件
    toggleButton.addEventListener('click', () => {
        // --- 原本的深色模式切換邏輯 ---
        const isDarkMode = body.classList.toggle('dark-mode');

        // 切換圖示並儲存偏好
        if (isDarkMode) {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
            localStorage.setItem('theme', 'light');
        }
        // --- 深色模式切換邏輯結束 ---

        // --- 新增的彩蛋模式觸發邏輯 ---
        const now = new Date().getTime();

        // 檢查是否是新的點擊序列 (第一次點擊或超時)
        if (clickCount === 0 || now - firstClickTime > EASTER_EGG_TIME_LIMIT) {
            clickCount = 1;
            firstClickTime = now;
        } else {
            clickCount++;
        }

        // 檢查是否達到觸發條件
        if (clickCount >= EASTER_EGG_CLICKS) {
            surpriseMode();
        }
    });

    // 觸發彩蛋模式
    function surpriseMode() {
        alert('Surprise! You found the Easter egg!');

        // 隱藏按鈕
        toggleButton.style.display = 'none';

        // 重置點擊計數
        clickCount = 0;
        firstClickTime = 0;

        body.classList.remove('dark-mode');
        body.classList.add('surprise-mode');

        updateRainbowColor();

        // 新增：監聽圖片點擊事件
        const imgProfiles = document.querySelectorAll('.img-profile');
        // console.log(imgProfiles);

        if (imgProfiles) {
            imgProfiles.forEach(imgProfile => {
                let drawCount = 0;
    
                imgProfile.addEventListener('click', () => {
                    // alert('Avatar Changed!');
                    const randomNumber = Math.random();
                    drawCount++;
    
                    if (randomNumber < 0.01) { // 1%
                        imgProfile.src = 'img/avatar/avatar-1.png';
                        if (drawCount <= 100) {
                            alert("You're so lucky! You found the rare avatar within " + drawCount + " draws!");
                        }
                        else {
                            alert("You're not so lucky... You found the rare avatar within " + drawCount + " draws...");
                        }
                        drawCount = 0;
                    }
                    else if (randomNumber < 0.03) { // 2%
                        imgProfile.src = 'img/avatar/avatar-2.png';
                    } 
                    else if (randomNumber < 0.06) { // 3%
                        imgProfile.src = 'img/avatar/avatar-3.png';
                    } 
                    else if (randomNumber < 0.10) { // 4%
                        imgProfile.src = 'img/avatar/avatar-4.png';
                    } 
                    else if (randomNumber < 0.15) { // 5%
                        imgProfile.src = 'img/avatar/avatar-5.png';
                    }
                    else if (randomNumber < 0.20) { // 5%
                        imgProfile.src = 'img/avatar/avatar-6.png';
                    }
                    else if (randomNumber < 0.26) { // 6%
                        imgProfile.src = 'img/avatar/avatar-7.png';
                    }
                    else if (randomNumber < 0.33) { // 7%
                        imgProfile.src = 'img/avatar/avatar-8.png';
                    }
                    else if (randomNumber < 0.41) { // 8%
                        imgProfile.src = 'img/avatar/avatar-9.png';
                    }
                    else if (randomNumber < 0.50) { // 9%
                        imgProfile.src = 'img/avatar/avatar-10.png';
                    }
                    else if (randomNumber < 0.60) { // 10%
                        imgProfile.src = 'img/avatar/avatar-11.png';
                    }
                    else if (randomNumber < 0.70) { // 10%
                        imgProfile.src = 'img/avatar/avatar-12.png';
                    }
                    else if (randomNumber < 0.80) { // 10%
                        imgProfile.src = 'img/avatar/avatar-13.png';
                    }
                    else if (randomNumber < 0.90) { // 10%
                        imgProfile.src = 'img/avatar/avatar-14.png';
                    }
                    else { // 10%
                        imgProfile.src = 'img/avatar/avatar-15.png';
                    }
                });
            });
        }

        // 彩蛋模式功能
        const oiiaioiiiaiImage = document.getElementById('oiiaioiiiai');
        oiiaioiiiaiImage.style.display = 'block';

        // 第一次顯示時，將定位方式從 right/bottom 轉換為 left/top
        const rect = oiiaioiiiaiImage.getBoundingClientRect();
        oiiaioiiiaiImage.style.left = `${rect.left}px`;
        oiiaioiiiaiImage.style.top = `${rect.top}px`;
        oiiaioiiiaiImage.style.right = 'auto';
        oiiaioiiiaiImage.style.bottom = 'auto';
        
        const audio = new Audio('img/oiiaioiiiai/oiiaioiiiai.mp3');

        let isMoving = false;

        oiiaioiiiaiImage.addEventListener('click', () => {
            if (isMoving) {
                return;
            }

            // 切換圖片
            oiiaioiiiaiImage.src = 'img/oiiaioiiiai/oiiaioiiiai.gif';

            // 播放音效
            audio.play().catch(e => console.error("Audio playback failed:", e));

            // 取得視窗寬高
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // 取得圖片寬高
            const imageWidth = oiiaioiiiaiImage.offsetWidth;
            const imageHeight = oiiaioiiiaiImage.offsetHeight;

            // 取得圖片當前位置
            const currentX = parseFloat(oiiaioiiiaiImage.style.left);
            const currentY = parseFloat(oiiaioiiiaiImage.style.top);

            let newX, newY, distance;
            const minDistance = 300; // 設定最小移動距離 (單位: 像素)

            // 循環直到找到一個足夠遠的新座標
            do {
                newX = Math.random() * (windowWidth - imageWidth);
                newY = Math.random() * (windowHeight - imageHeight);
                // 計算移動距離 (歐幾里得距離)
                distance = Math.sqrt(Math.pow(newX - currentX, 2) + Math.pow(newY - currentY, 2));
            } while (distance < minDistance);

            // 開始移動
            isMoving = true;
            oiiaioiiiaiImage.style.left = `${newX}px`;
            oiiaioiiiaiImage.style.top = `${newY}px`;
            oiiaioiiiaiImage.style.right = 'auto';
            oiiaioiiiaiImage.style.bottom = 'auto';

            // 移動完成後
            const handler = () => {
                isMoving = false;
                oiiaioiiiaiImage.removeEventListener('transitionend', handler);
                // 切換回原始圖片
                oiiaioiiiaiImage.src = 'img/oiiaioiiiai/oiiaioiiiai.png';
            };
            oiiaioiiiaiImage.addEventListener('transitionend', handler);
        });
    }

    // 新增一個函數來處理顏色變化
    const updateRainbowColor = () => {
        const time = Date.now() * 0.001;
        const r = Math.sin(time) * 127 + 128;
        const g = Math.sin(time + 2) * 127 + 128;
        const b = Math.sin(time + 4) * 127 + 128;
        const color = `rgb(${r}, ${g}, ${b})`;
        document.documentElement.style.setProperty('--primary-color', color);
        colorIntervalId = requestAnimationFrame(updateRainbowColor);
    };
});

window.addEventListener('DOMContentLoaded', event => {
    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // The list-view and map-view buttons
    document.getElementById('list-view').style.display = 'block';
    document.getElementById('map-view').style.display = 'none';

    document.getElementById('list-view-button').addEventListener('click', function () {
        document.getElementById('list-view-button').classList.remove('btn-outline-primary');
        document.getElementById('list-view-button').classList.add('btn-primary');
        document.getElementById('map-view-button').classList.remove('btn-primary');
        document.getElementById('map-view-button').classList.add('btn-outline-primary');
        document.getElementById('list-view').style.display = 'block';
        document.getElementById('map-view').style.display = 'none';
    });

    document.getElementById('map-view-button').addEventListener('click', function () {
        document.getElementById('map-view-button').classList.remove('btn-outline-primary');
        document.getElementById('map-view-button').classList.add('btn-primary');
        document.getElementById('list-view-button').classList.remove('btn-primary');
        document.getElementById('list-view-button').classList.add('btn-outline-primary');
        document.getElementById('map-view').style.display = 'block';
        document.getElementById('list-view').style.display = 'none';
    });
});

// Leaflet maps
var map = L.map('map').setView([30, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var locations = [
    { name: "Vienna, Austria", coords: [48.210033, 16.373449], date: "2025/07 - 2025/08" },
    { name: "Bratislava, Slovakia", coords: [48.1486, 17.1077], date: "2025/07 - 2025/08" },
    { name: "Budapest, Hungary", coords: [47.4979, 19.0402], date: "2025/07 - 2025/08" },
    { name: "Jeju, South Korea", coords: [33.4996, 126.5312], date: "2024/08" },
    { name: "San Francisco, USA", coords: [37.7749, -122.4194], date: "2024/02" },
    { name: "Vancouver, Canada", coords: [49.2827, -123.1207], date: "2024/02" },
    { name: "Tokyo, Japan", coords: [35.682839, 139.759455], date: "2023/03" },
    { name: "Dubai, UAE", coords: [25.276987, 55.296249], date: "2022/12" },
    { name: "Abu Dhabi, UAE", coords: [24.453884, 54.3773438], date: "2022/12" },
    { name: "Bangkok, Thailand", coords: [13.7563, 100.5018], date: "2018/07" },
    { name: "Nagoya, Japan", coords: [35.1815, 136.9066], date: "2017/06 - 2017/07" },
    { name: "Kyushu, Japan", coords: [32.7502, 129.8675], date: "2016/02" },
    { name: "Hokkaido, Japan", coords: [43.0642, 141.3469], date: "2015/08" },
    { name: "Kyoto, Japan", coords: [35.0116, 135.7681], date: "2014/07" },
    { name: "Kobe, Japan", coords: [34.6901, 135.1955], date: "2014/07" },
    { name: "Osaka, Japan", coords: [34.6937, 135.5023], date: "2014/07" },
    { name: "Chiang Mai, Thailand", coords: [18.7883, 98.9853], date: "2013/08" },
];

locations.forEach(location => {
    L.marker(location.coords)
        .addTo(map)
        .bindPopup(`<b>${location.name}</b><br>${location.date}`);
});
