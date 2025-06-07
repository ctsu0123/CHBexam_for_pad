import { getQuestions, getCurrentQuestionIndex, setCurrentQuestionIndex, getFilteredQuestions, setFilteredQuestions } from './questions.js';
import { displayQuestion, updateNavigation as updateNavUI } from './ui.js';

// 導航題目
export function navigateQuestion(direction) {
    const currentIndex = getCurrentQuestionIndex();
    const filteredQuestions = getFilteredQuestions();
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < filteredQuestions.length) {
        setCurrentQuestionIndex(newIndex);
        displayQuestion(filteredQuestions[newIndex], newIndex, filteredQuestions.length, getQuizCurrentMode());
    }
}

// 跳轉到指定題目
export function jumpToQuestion() {
    const jumpInput = document.getElementById('jumpInput');
    if (!jumpInput) return;
    
    const targetIndex = parseInt(jumpInput.value) - 1;
    const filteredQuestions = getFilteredQuestions();
    
    if (targetIndex >= 0 && targetIndex < filteredQuestions.length) {
        setCurrentQuestionIndex(targetIndex);
        displayQuestion(filteredQuestions[targetIndex], targetIndex, filteredQuestions.length, getQuizCurrentMode());
        jumpInput.value = '';
    } else {
        showErrorMessage('請輸入有效的題號');
    }
}

// 獲取當前測驗模式
function getQuizCurrentMode() {
    const radios = document.getElementsByName('quizMode');
    for (let radio of radios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return '';
}
