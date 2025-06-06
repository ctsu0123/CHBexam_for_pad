// 導入其他模組
import { setupEventListeners } from './events.js';
import { showSwipeHint } from './ui.js';

function initializeApp() {
    console.log('應用程式初始化...');
    
    // 設定事件監聽器
    setupEventListeners();
    
    // 顯示滑動提示
    showSwipeHint();
    
    console.log('應用程式初始化完成');
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', initializeApp);
