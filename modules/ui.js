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
    // 這裡可以添加顯示成功訊息的 UI 邏輯
}

// 顯示錯誤訊息
export function showErrorMessage(message) {
    console.error('錯誤:', message);
    // 這裡可以添加顯示錯誤訊息的 UI 邏輯
}

// 更新題數顯示
export function updateQuestionCount(count) {
    const countElement = document.getElementById('questionCountDisplay');
    if (countElement) {
        countElement.textContent = `已載入 ${count} 題`;
        countElement.style.display = 'block';
    }
}

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
        
        const options = ['A', 'B', 'C', 'D'];
        options.forEach(opt => {
            const optionText = question[`option${opt}`];
            if (optionText) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option';
                optionDiv.textContent = `${opt}. ${optionText}`;
                optionDiv.addEventListener('click', () => showAnswer(opt, question, mode));
                
                // 將數字答案轉換為字母進行比較
                let correctAnswer = question.originalAnswer;
                if (/^[1-4]$/.test(correctAnswer)) {
                    correctAnswer = String.fromCharCode(64 + parseInt(correctAnswer));
                }
                
                // 如果是含答案模式，直接標示正確答案
                if (mode === 'browse-with-answer' && opt === correctAnswer) {
                    optionDiv.classList.add('correct');
                }
                
                optionsContainer.appendChild(optionDiv);
            }
        });
    }
    
    // 顯示答案（含答案模式）
    const answerDisplay = document.getElementById('answerDisplay');
    if (answerDisplay) {
        if (mode === 'browse-with-answer') {
            let displayAnswer = question.originalAnswer || '';
            if (/^[1-4]$/.test(displayAnswer)) {
                displayAnswer = `選項${String.fromCharCode(64 + parseInt(displayAnswer))}`;
            }
            answerDisplay.style.display = 'block';
            answerDisplay.textContent = `正確答案：${displayAnswer}`;
        } else {
            answerDisplay.style.display = 'none';
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
    
    // 將數字答案轉換為字母（1->A, 2->B, 3->C, 4->D）
    let correctAnswer = question.originalAnswer || '';
    if (/^[1-4]$/.test(correctAnswer)) {
        correctAnswer = String.fromCharCode(64 + parseInt(correctAnswer));
    }
    
    if (selectedOption === correctAnswer) {
        answerDisplay.innerHTML = `✅ 正確！答案是：選項${correctAnswer}`;
        answerDisplay.style.background = 'rgba(76, 175, 80, 0.2)';
        answerDisplay.style.borderColor = '#4CAF50';
        answerDisplay.style.color = '#81c784';
    } else {
        answerDisplay.innerHTML = `❌ 錯誤！正確答案是：選項${correctAnswer}`;
        answerDisplay.style.background = 'rgba(244, 67, 54, 0.2)';
        answerDisplay.style.borderColor = '#f44336';
        answerDisplay.style.color = '#ef5350';
    }
    
    answerDisplay.style.display = 'block';
    
    // 標示正確答案
    document.querySelectorAll('.option').forEach(opt => {
        const optText = opt.textContent.charAt(0);
        if (optText === correctAnswer) {
            opt.classList.add('correct');
        }
    });
}
