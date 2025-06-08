import { 
    getQuestions, 
    getCurrentQuestionIndex, 
    setCurrentQuestionIndex, 
    getFilteredQuestions, 
    setFilteredQuestions,
    displayQuestion
} from './questions.js';
import { showErrorMessage } from './ui.js';

// 導航題目
export function navigateQuestion(direction) {
    try {
        const currentIndex = getCurrentQuestionIndex();
        const filteredQuestions = getFilteredQuestions();
        
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < filteredQuestions.length) {
            setCurrentQuestionIndex(newIndex);
            displayQuestion();
        }
    } catch (error) {
        console.error('導航題目時發生錯誤:', error);
        showErrorMessage('切換題目時發生錯誤');
    }
}

// 跳轉到指定題目
export function jumpToQuestion() {
    console.log('執行 jumpToQuestion 函數');
    try {
        const jumpInput = document.getElementById('jumpInput');
        console.log('jumpInput:', jumpInput);
        if (!jumpInput) {
            console.error('錯誤：找不到 jumpInput 元素');
            return;
        }
        
        console.log('輸入的值:', jumpInput.value);
        const targetIndex = parseInt(jumpInput.value) - 1;
        console.log('目標索引:', targetIndex);
        
        const filteredQuestions = getFilteredQuestions();
        console.log('過濾後的題目數量:', filteredQuestions.length);
        
        if (isNaN(targetIndex)) {
            console.error('錯誤：輸入的不是有效的數字');
            showErrorMessage('請輸入有效的題號');
            return;
        }
        
        if (targetIndex >= 0 && targetIndex < filteredQuestions.length) {
            console.log('正在跳轉到第', targetIndex + 1, '題');
            setCurrentQuestionIndex(targetIndex);
            displayQuestion();
            jumpInput.value = '';
        } else {
            const errorMsg = '請輸入有效的題號 (1-' + filteredQuestions.length + ')';
            console.error('錯誤：', errorMsg);
            showErrorMessage(errorMsg);
        }
    } catch (error) {
        console.error('跳轉題目時發生錯誤:', error);
        showErrorMessage('跳轉題目時發生錯誤');
    }
}

// 獲取當前測驗模式
export function getQuizCurrentMode() {
    try {
        const radios = document.getElementsByName('quizMode');
        for (let radio of radios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return '';
    } catch (error) {
        console.error('獲取測驗模式時發生錯誤:', error);
        return '';
    }
}
