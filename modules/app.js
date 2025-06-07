// 導入其他模組
import { setupEventListeners } from './events.js';
import { showSwipeHint } from './ui.js';
import { displayQuestion, parseQuestions } from './questions.js'; // 導入需要的函數

// 確保所有 DOM 元素都已經載入
function initializeApp() {
    console.log('應用程式初始化...');
    
    try {
        // 設定事件監聽器
        setupEventListeners();
        
        // 顯示滑動提示
        showSwipeHint();
        
        // 檢查是否支援 ES 模組
        console.log('ES 模組支援:', typeof window !== 'undefined' && 'noModule' in HTMLScriptElement.prototype);
        
        console.log('應用程式初始化完成');
    } catch (error) {
        console.error('初始化應用程式時發生錯誤:', error);
    }
}

// 當 DOM 載入完成後初始化應用程式
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // 如果 DOM 已經載入完成，直接執行初始化
    initializeApp();
}

// 導出函數供其他模組使用
export { initializeApp };
