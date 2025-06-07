import { saveQuestionsToDB } from './db.js';
import { parseQuestions, setQuestions } from './questions.js';
import { showSuccessMessage, showErrorMessage, updateQuestionCount, showLoadingMessage } from './ui.js';

// 處理檔案上傳
export async function handleFileUpload(event) {
    console.log('開始處理檔案上傳...');
    const file = event.target.files[0];
    if (!file) {
        console.log('沒有選擇檔案');
        showErrorMessage('請選擇一個檔案');
        return;
    }
    
    // 檢查檔案類型
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileType)) {
        console.error('不支援的檔案類型:', fileType);
        showErrorMessage('不支援的檔案類型，請上傳 .xlsx 或 .xls 檔案');
        return;
    }
    
    console.log('已選擇檔案:', file.name, '大小:', (file.size / 1024).toFixed(2), 'KB');
    
    // 顯示載入中訊息
    const loadingMessage = showLoadingMessage('檔案處理中，請稍候...');
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            console.log('開始解析 Excel 檔案...');
            const data = new Uint8Array(e.target.result);
            
            // 嘗試讀取 Excel 檔案
            let workbook;
            try {
                workbook = XLSX.read(data, { type: 'array' });
            } catch (ex) {
                console.error('Excel 解析錯誤:', ex);
                throw new Error('無法解析 Excel 檔案，請確認檔案格式正確且未損壞');
            }
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel 檔案中沒有工作表');
            }
            
            console.log('找到工作表:', workbook.SheetNames);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // 將工作表轉換為 JSON 資料
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
            console.log('解析到', jsonData.length, '行資料');
            
            // 輸出前幾行數據用於調試
            console.log('前5行數據:', JSON.stringify(jsonData.slice(0, Math.min(5, jsonData.length)), null, 2));
            
            if (jsonData.length <= 1) {
                console.error('Excel 檔案中沒有足夠的資料行:', jsonData);
                throw new Error('Excel 檔案中沒有資料或格式不正確');
            }
            
            // 檢查標題行
            const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
            console.log('標題行:', headers);
            
            // 檢查必要欄位
            const requiredFields = ['題號', '答案', '題目', '選項'];
            const missingFields = requiredFields.filter(field => 
                !headers.some(h => h.includes(field))
            );
            
            if (missingFields.length > 0) {
                console.error('缺少必要欄位:', missingFields);
                throw new Error(`Excel 缺少必要欄位: ${missingFields.join(', ')}`);
            }
            
            // 解析題目
            console.log('開始解析題目...');
            const questions = parseQuestions(jsonData);
            console.log('成功解析', questions.length, '題');
            
            if (questions.length === 0) {
                throw new Error('無法從檔案中解析出任何題目，請確認格式正確');
            }
            
            // 儲存到 IndexedDB
            console.log('開始儲存到資料庫...');
            const count = await saveQuestionsToDB(questions);
            console.log('成功儲存', count, '題到資料庫');
            
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
            showErrorMessage(error.message || '檔案處理失敗，請確認格式正確');
        } finally {
            // 移除載入中訊息
            if (loadingMessage && loadingMessage.remove) {
                loadingMessage.remove();
            }
        }
    };
    
    reader.onerror = function(error) {
        console.error('檔案讀取錯誤:', error);
        showErrorMessage(`檔案讀取失敗: ${error.message || '未知錯誤'}`);
        // 移除載入中訊息
        if (loadingMessage && loadingMessage.remove) {
            loadingMessage.remove();
        }
    };
    
    try {
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('讀取檔案錯誤:', error);
        showErrorMessage(`無法讀取檔案: ${error.message || '未知錯誤'}`);
        // 移除載入中訊息
        if (loadingMessage && loadingMessage.remove) {
            loadingMessage.remove();
        }
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
