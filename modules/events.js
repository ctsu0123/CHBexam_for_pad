// 導入其他模組
import { handleFileUpload } from './file.js';
import { handleSearch } from './search.js';
import { navigateQuestion } from './navigation.js';

// 應用程式狀態
let currentMode = '';

// 設定事件監聽器
export function setupEventListeners() {
    // 檔案上傳
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // 模式選擇
    document.querySelectorAll('input[name="quizMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentMode = this.value;
            const randomSettings = document.getElementById('randomSettings');
            if (randomSettings) {
                randomSettings.style.display = this.value === 'random' ? 'block' : 'none';
            }
            
            // 啟用開始測驗按鈕
            const startBtn = document.getElementById('startQuizBtn');
            if (startBtn) {
                startBtn.disabled = false;
            }
        });
    });
    
    // 開始測驗按鈕
    const startBtn = document.getElementById('startQuizBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }

    // 搜尋按鈕
    const searchBtn = document.querySelector('.search-input-group button');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // 導航按鈕
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateQuestion(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateQuestion(1));

    // 鍵盤導航
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') navigateQuestion(-1);
        if (e.key === 'ArrowRight') navigateQuestion(1);
    });

    // 觸控事件
    const quizArea = document.getElementById('quizArea');
    if (quizArea) {
        quizArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        quizArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        quizArea.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
}

// 開始測驗
function startQuiz() {
    if (!currentMode) {
        showErrorMessage('請選擇測驗模式');
        return;
    }
    
    // 這裡可以加入開始測驗的邏輯
    console.log('開始測驗，模式:', currentMode);
}

// 觸控事件處理
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchEndX = touchStartX;
        
        const touchFeedback = document.getElementById('touchFeedback');
        if (touchFeedback) {
            touchFeedback.style.opacity = '0';
            touchFeedback.querySelector('.progress').style.width = '0%';
            touchFeedback.style.opacity = '1';
        }
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1) {
        touchEndX = e.touches[0].clientX;
        const diff = touchEndX - touchStartX;
        const maxDiff = window.innerWidth * 0.3;
        const progress = Math.min(Math.abs(diff) / maxDiff, 1);
        
        const touchFeedback = document.getElementById('touchFeedback');
        if (touchFeedback) {
            touchFeedback.querySelector('.progress').style.width = `${progress * 100}%`;
        }
        
        // 防止頁面滾動
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    }
}

function handleTouchEnd() {
    const diff = touchEndX - touchStartX;
    const threshold = window.innerWidth * 0.1;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            // 向右滑動，顯示上一題
            navigateQuestion(-1);
        } else {
            // 向左滑動，顯示下一題
            navigateQuestion(1);
        }
    }
    
    // 重置觸控狀態
    const touchFeedback = document.getElementById('touchFeedback');
    if (touchFeedback) {
        touchFeedback.querySelector('.progress').style.width = '0%';
        touchFeedback.style.opacity = '0';
    }
}

// 顯示錯誤訊息
function showErrorMessage(message) {
    console.error('錯誤:', message);
    // 這裡可以添加顯示錯誤訊息的 UI 邏輯
}
