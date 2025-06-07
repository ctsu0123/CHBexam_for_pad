// 導入 UI 函數
import { showErrorMessage, showWarningMessage } from './ui.js';

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
        const question = filteredQuestions[currentQuestionIndex];
        if (!question) {
            console.error('找不到當前題目，索引:', currentQuestionIndex);
            return false;
        }

        // 更新題號顯示
        const questionNumberElement = document.getElementById('questionNumber');
        if (questionNumberElement) {
            questionNumberElement.textContent = `第 ${currentQuestionIndex + 1} 題 / 共 ${filteredQuestions.length} 題`;
        }

        // 更新題目內容
        const questionTextElement = document.getElementById('questionText');
        if (questionTextElement) {
            questionTextElement.textContent = question.question || '無題目內容';
        }

        // 更新選項
        const optionsContainer = document.getElementById('options');
        if (optionsContainer) {
            optionsContainer.innerHTML = ''; // 清空現有選項
            
            question.options.forEach((option, index) => {
                if (option) {  // 只處理有值的選項
                    const optionElement = document.createElement('div');
                    optionElement.className = 'option';
                    optionElement.innerHTML = `
                        <input type="radio" name="answer" id="option${index}" value="${String.fromCharCode(65 + index)}">
                        <label for="option${index}">${String.fromCharCode(65 + index)}. ${option}</label>
                    `;
                    optionsContainer.appendChild(optionElement);
                    
                    console.log(`選項 ${String.fromCharCode(65 + index)}:`, option);
                }
            });
            
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
        } else {
            console.error('找不到選項容器 (ID: options)');
        }

        // 更新導航按鈕狀態
        updateNavigationButtons();
        
        return true;
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
            
            // 解析選項，支援多種格式：
            // 1. (1)選項A (2)選項B (3)選項C (4)選項D
            // 2. A.選項A B.選項B C.選項C D.選項D
            // 3. 1.選項A 2.選項B 3.選項C 4.選項D
            // 4. 換行格式的選項
            let options = [];
            
            // 首先嘗試處理換行格式的選項
            const lines = optionsText.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length >= 4) {
                const lineBasedOptions = [];
                let isValid = true;
                
                for (const line of lines) {
                    // 匹配 (1) 選項A 或 1. 選項A 或 1) 選項A 等格式
                    const match = line.match(/^\s*[\(（]?\s*(\d)\s*[\).、]\s*([^\r\n]+)/);
                    if (match) {
                        const index = parseInt(match[1]) - 1;
                        const text = match[2].trim();
                        if (index >= 0 && index < 4) {
                            lineBasedOptions[index] = text;
                        } else {
                            isValid = false;
                            break;
                        }
                    } else {
                        isValid = false;
                        break;
                    }
                }
                
                if (isValid && lineBasedOptions.filter(Boolean).length >= 2) {
                    options = lineBasedOptions;
                }
            }
            
            // 如果換行解析失敗，嘗試其他模式
            if (options.length === 0) {
                const optionPatterns = [
                    { 
                        // 匹配 (1) 選項A 格式
                        regex: /[\(（]\s*(\d)\s*[\）)]\s*([^\r\n]+)/g, 
                        getIndex: (match) => parseInt(match[1]) - 1,
                        cleanValue: (val) => val.replace(/^[\s\r\n]+|[\s\r\n]+$/g, '')
                    },
                    { 
                        // 匹配 A. 選項A 格式
                        regex: /([A-D])\.\s*([^A-D\n]+)/g, 
                        getIndex: (match) => match[1].charCodeAt(0) - 'A'.charCodeAt(0),
                        cleanValue: (val) => val.replace(/^[\s\r\n]+|[\s\r\n]+$/g, '')
                    },
                    { 
                        // 匹配 1. 選項A 格式
                        regex: /(\d+)\.\s*([^\d\n]+)/g, 
                        getIndex: (match) => parseInt(match[1]) - 1,
                        cleanValue: (val) => val.replace(/^[\s\r\n]+|[\s\r\n]+$/g, '')
                    }
                ];
                
                for (const pattern of optionPatterns) {
                    const matches = [];
                    let match;
                    
                    // 重置正則表達式的 lastIndex
                    pattern.regex.lastIndex = 0;
                    
                    while ((match = pattern.regex.exec(optionsText)) !== null) {
                        try {
                            const index = pattern.getIndex(match);
                            // 使用 match[2] 或 match[3] 取決於正則表達式的分組
                            const optionText = (match[2] || match[3] || '').trim();
                            
                            if (index >= 0 && index < 4 && optionText) {
                                matches[index] = pattern.cleanValue ? pattern.cleanValue(optionText) : optionText;
                            }
                        } catch (e) {
                            console.warn(`解析選項時出錯 (行 ${i + 1}):`, e);
                        }
                    }
                    
                    // 檢查是否成功解析出至少2個選項
                    const validOptions = matches.filter(Boolean);
                    if (validOptions.length >= 2) {
                        options = matches;
                        console.log(`使用模式 ${pattern.regex} 成功解析選項:`, options);
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
            
            // 驗證答案是否有效
            const normalizedAnswer = answer.toUpperCase().trim();
            const isValidAnswer = /^[A-D1-4]$/.test(normalizedAnswer) && 
                               (parseInt(normalizedAnswer) <= options.length || 
                                (normalizedAnswer >= 'A' && normalizedAnswer <= String.fromCharCode('A'.charCodeAt(0) + options.length - 1)));
            
            if (!isValidAnswer) {
                console.warn(`第 ${i + 1} 題的答案無效: ${answer}`, { options });
                invalidRowCount++;
                continue;
            }
            
            // 轉換答案為數字索引 (0-3)
            let answerIndex;
            if (/^[1-4]$/.test(normalizedAnswer)) {
                answerIndex = parseInt(normalizedAnswer) - 1;
            } else {
                answerIndex = normalizedAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
            }
            
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
        if (mode === 'random') {
            console.log('隨機選擇', count, '題');
            const shuffled = [...questions].sort(() => Math.random() - 0.5);
            filteredQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
        } else {
            console.log('使用全部題目，共', questions.length, '題');
            filteredQuestions = [...questions];
        }

        currentQuestionIndex = 0;
        
        // 顯示第一題
        if (filteredQuestions.length > 0) {
            console.log('顯示第 1 題，共', filteredQuestions.length, '題');
            displayQuestion();
            return true;
        } else {
            console.warn('沒有可用的題目');
            showWarningMessage('沒有可用的題目，請檢查題庫');
            return false;
        }
    } catch (error) {
        console.error('開始測驗時發生錯誤:', error);
        showErrorMessage('開始測驗時發生錯誤: ' + error.message);
        return false;
    }
}
