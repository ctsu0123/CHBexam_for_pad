import { getQuestions } from './questions.js';

// 顯示載入中訊息
export function showLoadingMessage(message) {
    // 如果已經有載入訊息，先移除
    const existingLoading = document.getElementById('loading-message');
    if (existingLoading) {
        existingLoading.remove();
    }
    
    // 建立載入訊息元素
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-message';
    loadingDiv.className = 'notification loading';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.zIndex = '2000';
    loadingDiv.style.padding = '15px 25px';
    loadingDiv.style.borderRadius = '10px';
    loadingDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.gap = '10px';
    
    // 加入載入動畫
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '3px solid rgba(255, 255, 255, 0.3)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTopColor = 'white';
    spinner.style.animation = 'spin 1s ease-in-out infinite';
    
    // 加入文字
    const text = document.createElement('span');
    text.textContent = message || '處理中...';
    
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(text);
    document.body.appendChild(loadingDiv);
    
    // 加入動畫樣式（如果尚未加入）
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .fade-out {
                opacity: 0;
                transition: opacity 0.5s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加移除方法
    loadingDiv.remove = function() {
        this.classList.add('fade-out');
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 500);
    };
    
    return loadingDiv;
}

// 顯示滑動提示
export function showSwipeHint() {
    setTimeout(() => {
        const hint = document.getElementById('swipeHint');
        if (hint) {
            hint.classList.add('show');
            setTimeout(() => {
                hint.classList.remove('show');
            }, 3000);
        }
    }, 1000);
}

// 顯示成功訊息
export function showSuccessMessage(message) {
    console.log('成功:', message);
    // 顯示通知
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3 秒後自動消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// 顯示錯誤訊息
export function showErrorMessage(message) {
    console.error('錯誤:', message);
    // 顯示通知
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3 秒後自動消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// 顯示警告訊息
export function showWarningMessage(message) {
    console.warn('警告:', message);
    // 顯示通知
    const notification = document.createElement('div');
    notification.className = 'notification warning';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 5 秒後自動消失（警告訊息顯示時間稍長）
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// 更新題數顯示
export function updateQuestionCount(count) {
    const countElement = document.getElementById('questionCountDisplay');
    if (countElement) {
        countElement.textContent = `已載入 ${count} 題`;
        countElement.style.display = 'block';
        
        // 啟用開始測驗按鈕
        const startBtn = document.getElementById('startQuizBtn');
        if (startBtn) {
            startBtn.disabled = false;
        }
    }
}

// 監聽題目更新事件
document.addEventListener('questionsUpdated', () => {
    const questions = getQuestions();
    updateQuestionCount(questions.length);
    
    // 如果有題目，顯示第一題
    if (questions.length > 0) {
        displayQuestion(questions[0], 0, questions.length, 'browse-with-answer');
    }
});

// 更新導航按鈕狀態
export function updateNavigation(currentIndex, totalCount) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressText = document.getElementById('progressText');
    const jumpInput = document.getElementById('jumpInput');
    
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === totalCount - 1;
    if (progressText) {
        progressText.textContent = `${currentIndex + 1} / ${totalCount}`;
    }
    if (jumpInput) {
        jumpInput.max = totalCount;
    }
}

// 顯示測驗介面
export function showQuizInterface() {
    const quizArea = document.getElementById('quizArea');
    const questionDisplay = document.getElementById('questionDisplay');
    const navigation = document.getElementById('navigation');
    const noQuestions = document.querySelector('.no-questions');
    
    if (quizArea && questionDisplay && navigation && noQuestions) {
        noQuestions.style.display = 'none';
        questionDisplay.style.display = 'flex';
        navigation.style.display = 'flex';
    }
}

// 顯示題目
export function displayQuestion(question, currentIndex, totalCount, mode) {
    if (!question) {
        const quizArea = document.getElementById('quizArea');
        if (quizArea) {
            quizArea.innerHTML = '<div class="no-questions"><h2>🔍 沒有找到符合條件的題目</h2></div>';
        }
        return;
    }
    
    // 更新題號
    const questionNumberElement = document.getElementById('questionNumber');
    if (questionNumberElement) {
        questionNumberElement.textContent = `第 ${currentIndex + 1} 題 / 共 ${totalCount} 題`;
    }
    
    // 更新題目
    const questionTextElement = document.getElementById('questionText');
    if (questionTextElement) {
        questionTextElement.textContent = question.question || '';
    }
    
    // 更新選項
    const optionsContainer = document.getElementById('options');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        
        // 使用 question.options 數組來顯示選項
        question.options.forEach((optionText, index) => {
            if (optionText) {
                const optionNumber = index + 1; // 轉換為 1-based 數字
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option';
                
                // 創建單選按鈕
                const radioId = `option${index}`;
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'answer';
                radio.id = radioId;
                radio.value = optionNumber.toString();
                
                // 創建標籤
                const label = document.createElement('label');
                label.htmlFor = radioId;
                label.textContent = `(${optionNumber}) ${optionText}`;
                
                // 添加點擊事件
                optionDiv.addEventListener('click', () => showAnswer(optionNumber.toString(), question, mode));
                
                // 添加元素到 DOM
                optionDiv.appendChild(radio);
                optionDiv.appendChild(label);
                optionsContainer.appendChild(optionDiv);
            }
        });
    }
    
    // 顯示答案（含答案模式）
    console.log('Current question:', question);
    const answerDisplay = document.getElementById('answerDisplay');
    if (answerDisplay) {
        if (mode === 'browse-with-answer') {
            // 使用原始答案值
            const correctAnswer = question.originalAnswer ? question.originalAnswer.toString().trim() : '';
            console.log('Original answer:', correctAnswer, 'Options:', question.options);
            
            // 顯示正確答案
            answerDisplay.style.display = 'block';
            answerDisplay.textContent = `正確答案：${correctAnswer}`;
            
            // 使用 setTimeout 確保 DOM 已經完全渲染
            setTimeout(() => {
                const options = document.querySelectorAll('.option');
                let found = false;
                
                options.forEach((opt) => {
                    const input = opt.querySelector('input[type="radio"]');
                    if (input) {
                        const optValue = input.value.trim();
                        console.log('Checking option:', optValue, 'vs correct:', correctAnswer);
                        
                        // 清除之前的高亮
                        opt.classList.remove('correct');
                        
                        // 檢查選項值是否等於正確答案
                        if (optValue === correctAnswer) {
                            opt.classList.add('correct');
                            found = true;
                            console.log('Marked correct answer:', optValue);
                        }
                    }
                });
                
                if (!found) {
                    console.warn('Could not find matching option for answer:', correctAnswer);
                    // 如果沒有找到匹配的選項，嘗試使用原始答案索引
                    try {
                        const answerIndex = parseInt(correctAnswer) - 1;
                        if (!isNaN(answerIndex) && answerIndex >= 0 && answerIndex < options.length) {
                            options[answerIndex].classList.add('correct');
                            console.log('Marked correct answer by index:', answerIndex);
                        }
                    } catch (e) {
                        console.error('Error marking correct answer by index:', e);
                    }
                }
            }, 100);
        } else {
            answerDisplay.style.display = 'none';
        }
    }
    
    // 如果是含答案模式，確保正確答案被標記
    if (mode === 'browse-with-answer') {
        const correctAnswer = question.originalAnswer || '';
        console.log('Final check - Original answer:', correctAnswer);
        
        if (correctAnswer) {
            // 使用 setTimeout 確保 DOM 已經更新
            setTimeout(() => {
                console.log('Starting re-marking process for answer:', correctAnswer);
                const options = document.querySelectorAll('.option');
                let found = false;
                
                options.forEach((opt) => {
                    const input = opt.querySelector('input[type="radio"]');
                    if (input) {
                        console.log('Checking option value:', input.value, 'vs correct:', correctAnswer);
                        // 清除之前的高亮
                        opt.classList.remove('correct');
                        
                        // 檢查選項值是否等於正確答案
                        if (input.value === correctAnswer.toString()) {
                            opt.classList.add('correct');
                            found = true;
                            console.log('Re-marked correct answer:', correctAnswer);
                        }
                    }
                });
                
                if (!found) {
                    console.warn('Could not find matching option for answer:', correctAnswer);
                }
            }, 100); // 稍微增加延遲確保 DOM 已完全更新
        } else {
            console.warn('No correct answer found for question:', question.number);
        }
    }
    
    // 更新導航
    updateNavigation(currentIndex, totalCount);
}

// 顯示答案
function showAnswer(selectedOption, question, mode) {
    if (mode === 'browse-with-answer') return;
    
    const answerDisplay = document.getElementById('answerDisplay');
    if (!answerDisplay) return;
    
    // 獲取正確答案的索引（0-based）
    const correctAnswerIndex = question.answer;
    // 獲取正確答案的內容
    const correctAnswerText = question.options[correctAnswerIndex] || '';
    // 獲取正確答案的編號（1-based）
    const correctAnswerNumber = correctAnswerIndex + 1;
    
    // 獲取選中的選項編號（如果有的話）
    const selectedNumber = selectedOption ? parseInt(selectedOption) : null;
    
    if (selectedNumber === correctAnswerNumber) {
        answerDisplay.innerHTML = `✅ 正確！答案是：${correctAnswerNumber}`;
        answerDisplay.style.background = 'rgba(76, 175, 80, 0.2)';
        answerDisplay.style.borderColor = '#4CAF50';
        answerDisplay.style.color = '#81c784';
    } else {
        answerDisplay.innerHTML = `❌ 錯誤！正確答案是：${correctAnswerNumber}`;
        answerDisplay.style.background = 'rgba(244, 67, 54, 0.2)';
        answerDisplay.style.borderColor = '#f44336';
        answerDisplay.style.color = '#ef5350';
    }
    
    answerDisplay.style.display = 'block';
    
    // 標示正確答案
    document.querySelectorAll('.option').forEach(opt => {
        // 獲取選項的 input 元素
        const input = opt.querySelector('input[type="radio"]');
        if (input) {
            const optValue = input.value; // 這會是 "1", "2", "3" 或 "4"
            if (optValue === correctAnswerNumber.toString()) {
                opt.classList.add('correct');
            } else if (optValue === selectedOption) {
                opt.classList.add('incorrect');
            }
        }
    });
}
