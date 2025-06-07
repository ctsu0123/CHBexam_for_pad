// 導入 UI 函數
import { showErrorMessage } from './ui.js';

// 題目相關的狀態
let questions = [];
let currentQuestionIndex = 0;
let filteredQuestions = [];

// 自定義事件
const questionUpdatedEvent = new Event('questionsUpdated');

// 解析題目
export function parseQuestions(data) {
    const parsedQuestions = [];
    
    // 確保數據格式正確
    if (!Array.isArray(data)) {
        console.error('數據格式錯誤:', data);
        showErrorMessage('檔案格式錯誤，請確認是正確的 Excel 檔案');
        return [];
    }
    
    // 跳過標題行
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // 確保有足夠的欄位（至少4欄：題號、答案、題目、選項）
        if (!row || row.length < 4) continue;
        
        const questionNumber = row[0];  // 題號
        const answer = row[1];          // 答案
        const questionText = row[2];     // 題目
        const optionsText = row[3];      // 選項
        
        if (!optionsText) continue;
        
        // 解析選項，支援多種格式：
        // 1. (1)選項A (2)選項B (3)選項C (4)選項D
        // 2. A.選項A B.選項B C.選項C D.選項D
        let options = [];
        
        // 嘗試匹配 (1)選項A 格式
        const numberPattern = /\(([1-4])\)([^(]+)/g;
        let match;
        while ((match = numberPattern.exec(optionsText)) !== null) {
            const index = parseInt(match[1]) - 1;
            const optionText = match[2].trim();
            options[index] = optionText;
        }
        
        // 如果沒有匹配到 (1) 格式，嘗試匹配 A. 格式
        if (options.length === 0) {
            const letterPattern = /([A-D])\.\s*([^A-D]+)/g;
            while ((match = letterPattern.exec(optionsText)) !== null) {
                const index = match[1].charCodeAt(0) - 65; // A->0, B->1, etc.
                const optionText = match[2].trim();
                options[index] = optionText;
            }
        }
        
        // 如果成功解析出選項
        if (options.length > 0) {
            parsedQuestions.push({
                question: questionText,
                answer: answer,
                optionA: options[0] || '',
                optionB: options[1] || '',
                optionC: options[2] || '',
                optionD: options[3] || '',
                originalAnswer: answer,
                number: questionNumber
            });
        } else {
            // 如果無法解析選項，將整個選項文字作為一個欄位
            parsedQuestions.push({
                question: questionText,
                answer: answer,
                options: optionsText,
                originalAnswer: answer,
                number: questionNumber
            });
        }
    }
    
    return parsedQuestions;
}

// 獲取所有題目
export function getQuestions() {
    return questions;
}

// 設置題目
export function setQuestions(newQuestions) {
    questions = newQuestions;
    filteredQuestions = [...newQuestions];
    // 觸發自定義事件
    document.dispatchEvent(questionUpdatedEvent);
}

// 獲取當前題目索引
export function getCurrentQuestionIndex() {
    return currentQuestionIndex;
}

// 設置當前題目索引
export function setCurrentQuestionIndex(index) {
    currentQuestionIndex = index;
}

// 獲取過濾後的題目
export function getFilteredQuestions() {
    return filteredQuestions;
}

// 設置過濾後的題目
export function setFilteredQuestions(questions) {
    filteredQuestions = [...questions];
}

// 開始測驗
export function startQuiz(mode, count = 10) {
    if (questions.length === 0) {
        showErrorMessage('請先上傳題目檔案');
        return false;
    }

    // 準備題目列表
    if (mode === 'random') {
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        filteredQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
    } else {
        filteredQuestions = [...questions];
    }

    currentQuestionIndex = 0;
    return true;
}
