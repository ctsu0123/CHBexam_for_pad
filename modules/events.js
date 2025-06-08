// 導入其他模組
import { handleFileUpload, downloadTemplate } from './file.js';
import { handleSearch } from './search.js';
import { navigateQuestion, jumpToQuestion } from './navigation.js';

// 應用程式狀態
let appCurrentMode = '';

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
            appCurrentMode = this.value;
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
        startBtn.addEventListener('click', handleStartQuiz);
    }
    
    // 下載範例檔案按鈕
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', downloadTemplate);
    }

    // 搜尋按鈕
    const searchBtn = document.querySelector('.search-input-group button');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Excel 轉換工具按鈕
    const showConvertToolBtn = document.getElementById('showConvertToolBtn');
    if (showConvertToolBtn) {
        showConvertToolBtn.addEventListener('click', () => {
            try {
                // 在新分頁中開啟轉換工具
                window.open('convert/excel_converter.html', '_blank');
            } catch (error) {
                console.error('開啟 Excel 轉換工具時發生錯誤:', error);
                showErrorMessage('無法開啟 Excel 轉換工具: ' + error.message);
            }
        });
    }

    // 導航按鈕
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const jumpInput = document.getElementById('jumpInput');
    
    if (prevBtn) prevBtn.addEventListener('click', () => navigateQuestion(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateQuestion(1));
    // 跳轉按鈕點擊事件
    if (jumpBtn) {
        jumpBtn.addEventListener('click', function() {
            console.log('跳轉按鈕被點擊');
            try {
                jumpToQuestion();
            } catch (error) {
                console.error('執行跳轉時發生錯誤:', error);
                showErrorMessage('執行跳轉時發生錯誤');
            }
        });
    }
    // 跳轉輸入框 Enter 鍵事件
    if (jumpInput) {
        jumpInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('按下 Enter 鍵');
                try {
                    jumpToQuestion();
                } catch (error) {
                    console.error('執行跳轉時發生錯誤:', error);
                    showErrorMessage('執行跳轉時發生錯誤');
                }
            }
        });
    }

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

// 從 questions.js 導入函數
import { startQuiz, displayQuestion } from './questions.js';

// 開始測驗的事件處理函數
function handleStartQuiz() {
    if (!appCurrentMode) {
        showErrorMessage('請選擇測驗模式');
        return;
    }
    
    // 獲取使用者設定的題數
    let questionCount = 10; // 預設值
    if (appCurrentMode === 'random') {
        const countInput = document.getElementById('questionCount');
        if (countInput) {
            questionCount = parseInt(countInput.value) || 10;
            console.log('使用者設定的題數:', questionCount);
        }
    }
    
    // 呼叫 questions.js 中的 startQuiz 函數
    const success = startQuiz(appCurrentMode, questionCount);
    if (success) {
        console.log('開始測驗，模式:', appCurrentMode, '題數:', questionCount);
        // 顯示第一題
        if (typeof displayQuestion === 'function') {
            displayQuestion();
        } else {
            console.error('displayQuestion 函數未定義');
            showErrorMessage('顯示題目時發生錯誤: displayQuestion 函數未定義');
        }
    }
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

// 從 ui.js 導入 showErrorMessage 函數
import { showErrorMessage } from './ui.js';
