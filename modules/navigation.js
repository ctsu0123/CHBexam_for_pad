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
    try {
        const jumpInput = document.getElementById('jumpInput');
        if (!jumpInput) return;
        
        const targetIndex = parseInt(jumpInput.value) - 1;
        const filteredQuestions = getFilteredQuestions();
        
        if (targetIndex >= 0 && targetIndex < filteredQuestions.length) {
            setCurrentQuestionIndex(targetIndex);
            displayQuestion();
            jumpInput.value = '';
        } else {
            showErrorMessage('請輸入有效的題號 (1-' + filteredQuestions.length + ')');
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
