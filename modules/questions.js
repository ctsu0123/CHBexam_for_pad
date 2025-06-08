// 導入 UI 函數
import { showErrorMessage, showWarningMessage, displayQuestion as uiDisplayQuestion } from './ui.js';

// 題目相關的狀態
let questions = [];
let currentQuestionIndex = 0;
let filteredQuestions = [];

// 自定義事件
const questionUpdatedEvent = new Event('questionsUpdated');

// 更新導航按鈕狀態
function updateNavigationButtons() {
    try {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.disabled = currentQuestionIndex <= 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentQuestionIndex >= filteredQuestions.length - 1;
        }
    } catch (error) {
        console.error('更新導航按鈕時發生錯誤:', error);
    }
}

// 顯示當前題目
export function displayQuestion() {
    try {
        const currentIndex = getCurrentQuestionIndex();
        const questions = getFilteredQuestions();
        const currentQuestion = questions[currentIndex];
        
        if (!currentQuestion) {
            console.error('找不到當前題目，索引:', currentIndex);
            return false;
        }
        
        // 獲取當前模式
        const mode = document.querySelector('input[name="quizMode"]:checked')?.value || 'browse-with-answer';
        console.log('Displaying question in mode:', mode, 'Question index:', currentIndex);
        
        // 調用 ui.js 中的 displayQuestion 函數
        return uiDisplayQuestion(currentQuestion, currentIndex, questions.length, mode);
    } catch (error) {
        console.error('顯示題目時發生錯誤:', error);
        showErrorMessage('顯示題目時發生錯誤: ' + error.message);
        return false;
    }
}

// 解析題目
export function parseQuestions(data) {
    console.log('開始解析題目數據，共', data.length, '行');
    const parsedQuestions = [];
    let validQuestionCount = 0;
    let invalidRowCount = 0;
    
    // 確保數據格式正確
    if (!Array.isArray(data) || data.length <= 1) {
        const errorMsg = data.length <= 1 ? '檔案中沒有數據或數據不足' : '檔案格式錯誤';
        console.error('數據格式錯誤:', { dataLength: data.length, firstFewRows: data.slice(0, 3) });
        showErrorMessage(`${errorMsg}，請確認是正確的 Excel 檔案`);
        return [];
    }
    
    // 獲取標題行（第一行）
    const headers = data[0].map(h => String(h || '').trim().toLowerCase());
    console.log('標題行:', headers);
    
    // 找出各欄位的索引
    const numberIndex = headers.findIndex(h => h.includes('題號') || h.includes('number'));
    const answerColIndex = headers.findIndex(h => h.includes('答案') || h.includes('answer'));
    const questionIndex = headers.findIndex(h => h.includes('題目') || h.includes('question'));
    const optionsIndex = headers.findIndex(h => h.includes('選項') || h.includes('options'));
    
    console.log('欄位索引:', { numberIndex, answerColIndex, questionIndex, optionsIndex });
    
    // 檢查必要欄位是否存在
    if (numberIndex === -1 || answerColIndex === -1 || questionIndex === -1 || optionsIndex === -1) {
        const missingFields = [];
        if (numberIndex === -1) missingFields.push('題號');
        if (answerIndex === -1) missingFields.push('答案');
        if (questionIndex === -1) missingFields.push('題目');
        if (optionsIndex === -1) missingFields.push('選項');
        
        const errorMsg = `Excel 檔案缺少必要欄位: ${missingFields.join(', ')}。請確認檔案包含「題號」、「答案」、「題目」和「選項」欄位。`;
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return [];
    }
    
    // 從第二行開始解析數據（跳過標題行）
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // 跳過空行或無效行
        if (!row || !Array.isArray(row)) {
            invalidRowCount++;
            console.warn(`第 ${i + 1} 行數據格式不正確，已跳過`, row);
            continue;
        }
        
        try {
            const questionNumber = String(row[numberIndex] || '').trim();  // 題號
            const answer = String(row[answerColIndex] || '').trim();       // 答案
            const questionText = String(row[questionIndex] || '').trim();  // 題目
            const optionsText = String(row[optionsIndex] || '').trim();    // 選項
            
            // 驗證必填欄位
            if (!questionNumber || !answer || !questionText || !optionsText) {
                console.warn(`第 ${i + 1} 行缺少必要欄位`, { questionNumber, answer, questionText, optionsText });
                invalidRowCount++;
                continue;
            }
            
            // 簡化選項解析，直接使用 (1) (2) (3) (4) 作為選項
            let options = [];
            const optionMatches = optionsText.matchAll(/\(\s*(\d)\s*\)\s*([^\r\n()]+)/g);
            
            for (const match of optionMatches) {
                const index = parseInt(match[1]) - 1; // 轉換為 0-based 索引
                const text = match[2].trim();
                if (index >= 0 && index < 4 && text) {
                    options[index] = text;
                }
            }
            
            // 如果沒有找到 (1) (2) 格式的選項，嘗試其他常見格式
            if (options.filter(Boolean).length < 2) {
                const altOptionPatterns = [
                    { 
                        // 匹配 1. 選項A 格式
                        regex: /(\d+)[\.、]\s*([^\r\n]+)/g,
                        getIndex: (match) => parseInt(match[1]) - 1,
                        cleanValue: (val) => val.trim()
                    },
                    { 
                        // 匹配 A. 選項A 格式
                        regex: /([A-D])[\.、]\s*([^\r\n]+)/g,
                        getIndex: (match) => match[1].charCodeAt(0) - 'A'.charCodeAt(0),
                        cleanValue: (val) => val.trim()
                    }
                ];
                
                for (const pattern of altOptionPatterns) {
                    const matches = [];
                    let match;
                    pattern.regex.lastIndex = 0;
                    
                    while ((match = pattern.regex.exec(optionsText)) !== null) {
                        const index = pattern.getIndex(match);
                        const optionText = (match[2] || '').trim();
                        if (index >= 0 && index < 4 && optionText) {
                            matches[index] = pattern.cleanValue ? pattern.cleanValue(optionText) : optionText;
                        }
                    }
                    
                    if (matches.filter(Boolean).length >= 2) {
                        options = matches;
                        break;
                    }
                }
            }
            
            // 驗證選項
            if (options.length < 2) {
                console.warn(`第 ${i + 1} 題的選項解析失敗或數量不足`, { optionsText, parsedOptions: options });
                invalidRowCount++;
                continue;
            }
            
            // 驗證答案是否有效 (1-4 的數字)
            const normalizedAnswer = answer.toString().trim();
            const isValidAnswer = /^[1-4]$/.test(normalizedAnswer);
            
            if (!isValidAnswer) {
                console.warn(`第 ${i + 1} 題的答案無效: ${answer}，必須是 1-4 的數字`, { options });
                invalidRowCount++;
                continue;
            }
            
            // 轉換答案為數字索引 (0-3)
            const answerIndex = parseInt(normalizedAnswer) - 1;
            console.log(`解析題目 ${i + 1} - 原始答案: "${normalizedAnswer}", 索引: ${answerIndex}`);
            
            // 確保答案索引在有效範圍內
            if (answerIndex < 0 || answerIndex >= options.length) {
                console.warn(`第 ${i + 1} 題的答案超出範圍: ${answer} (選項數: ${options.length})`);
                invalidRowCount++;
                continue;
            }
            
            // 建立題目物件
            const questionObj = {
                number: questionNumber,
                question: questionText,
                options: options.filter(Boolean), // 過濾掉 undefined 的選項
                answer: answerIndex,
                originalAnswer: normalizedAnswer, // 保存原始答案值
                explanation: row[4] ? String(row[4]).trim() : '' // 解析說明（如果有的話）
            };
            
            parsedQuestions.push(questionObj);
            validQuestionCount++;
            
        } catch (error) {
            console.error(`處理第 ${i + 1} 行時發生錯誤:`, error, row);
            invalidRowCount++;
        }
    }
    
    // 輸出解析結果摘要
    console.log(`題目解析完成: 成功 ${validQuestionCount} 題，跳過 ${invalidRowCount} 行無效數據`);
    
    if (validQuestionCount === 0) {
        showErrorMessage('無法從檔案中解析出任何有效題目，請確認檔案格式正確');
    } else if (invalidRowCount > 0) {
        showWarningMessage(`成功載入 ${validQuestionCount} 題，有 ${invalidRowCount} 行數據因格式不正確被跳過`);
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
    console.log('開始測驗，模式:', mode, '題數:', count);
    
    if (questions.length === 0) {
        const errorMsg = '請先上傳題目檔案';
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return false;
    }

    try {
        // 準備題目列表
        let tempFilteredQuestions;
        if (mode === 'random') {
            // 確保題數不超過總題數
            const questionCount = Math.min(parseInt(count) || 10, questions.length);
            console.log(`隨機選擇 ${questionCount} 題，總題庫: ${questions.length} 題`);
            
            // 創建題號數組並洗牌
            const questionIndices = Array.from({length: questions.length}, (_, i) => i);
            for (let i = questionIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questionIndices[i], questionIndices[j]] = [questionIndices[j], questionIndices[i]];
            }
            
            // 選取指定數量的題目
            tempFilteredQuestions = questionIndices
                .slice(0, questionCount)
                .map(index => ({
                    ...questions[index],
                    originalQuestionNumber: questions[index].number // 保存原始題號
                }));
                
            console.log('隨機選取的題目編號:', tempFilteredQuestions.map(q => q.originalQuestionNumber));
        } else {
            console.log('使用全部題目，共', questions.length, '題');
            // 為每個題目添加原始題號
            tempFilteredQuestions = questions.map(q => ({
                ...q,
                originalQuestionNumber: q.number
            }));
        }
        
        // 設置過濾後的題目
        setFilteredQuestions(tempFilteredQuestions);

        currentQuestionIndex = 0;
        
        // 驗證題目是否成功準備
        if (filteredQuestions.length === 0) {
            console.warn('沒有可用的題目');
            showWarningMessage('沒有可用的題目，請檢查題庫');
            return false;
        }

        // 顯示題目區域
        const questionDisplay = document.getElementById('questionDisplay');
        if (questionDisplay) {
            questionDisplay.style.display = 'block';
        }

        // 顯示導航按鈕
        const navigation = document.getElementById('navigation');
        if (navigation) {
            navigation.style.display = 'flex';
        }

        // 顯示第一題
        console.log('顯示第 1 題，共', filteredQuestions.length, '題');
        const success = displayQuestion();
        if (!success) {
            console.error('顯示第一題失敗');
            return false;
        }

        return true;
    } catch (error) {
        console.error('開始測驗時發生錯誤:', error);
        showErrorMessage('開始測驗時發生錯誤: ' + error.message);
        return false;
    }
}
