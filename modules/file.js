import { saveQuestionsToDB } from './db.js';
import { parseQuestions, setQuestions } from './questions.js';
import { showSuccessMessage, showErrorMessage, updateQuestionCount } from './ui.js';

// 處理檔案上傳
export async function handleFileUpload(event) {
    console.log('開始處理檔案上傳...');
    const file = event.target.files[0];
    if (!file) {
        console.log('沒有選擇檔案');
        return;
    }
    
    console.log('已選擇檔案:', file.name);
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // 解析題目
            const questions = parseQuestions(jsonData);
            
            // 儲存到 IndexedDB
            const count = await saveQuestionsToDB(questions);
            
            // 更新全局的 questions 變量
            setQuestions(questions);
            
            showSuccessMessage(`成功載入 ${count} 題`);
            updateQuestionCount(count);
            
            // 啟用開始測驗按鈕
            const startBtn = document.getElementById('startQuizBtn');
            if (startBtn) {
                startBtn.disabled = false;
            }
        } catch (error) {
            console.error('處理檔案上傳錯誤:', error);
            showErrorMessage('檔案讀取失敗，請確認格式正確');
        }
    };
    
    reader.onerror = function() {
        showErrorMessage('檔案讀取失敗');
    };
    
    try {
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('讀取檔案錯誤:', error);
        showErrorMessage('無法讀取檔案');
    }
}

// 下載範例檔案
export function downloadTemplate() {
    // 建立範例資料
    const exampleData = [
        ['題號', '答案', '題目', '選項'],
        [1, 'A', '這是第一題的題目', '(1)選項A (2)選項B (3)選項C (4)選項D'],
        [2, 'B', '這是第二題的題目', 'A.選項A B.選項B C.選項C D.選項D'],
        [3, 'C', '這是第三題的題目', '(1)選項A (2)選項B (3)選項C (4)選項D'],
        [4, 'D', '這是第四題的題目', 'A.選項A B.選項B C.選項C D.選項D']
    ];
    
    // 建立工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exampleData);
    
    // 設定欄位寬度
    const wscols = [
        { wch: 10 }, // 題號
        { wch: 10 }, // 答案
        { wch: 60 }, // 題目
        { wch: 60 }  // 選項
    ];
    ws['!cols'] = wscols;
    
    // 將工作表加入工作簿
    XLSX.utils.book_append_sheet(wb, ws, '題目範例');
    
    // 匯出 Excel 檔案
    XLSX.writeFile(wb, '題目範例.xlsx');
}
