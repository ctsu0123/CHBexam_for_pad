import { getQuestions } from './questions.js';
import { showSuccessMessage, showErrorMessage } from './ui.js';

// 跳脫 HTML 字元
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 跳脫正則表達式特殊字元
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 高亮顯示文字
function highlightText(text, term) {
    if (!text || !term) return text || '';
    try {
        const escapedTerm = escapeRegExp(term);
        const regex = new RegExp(escapedTerm, 'gi');
        return text.replace(regex, match => 
            '<span class="highlight">' + match + '</span>'
        );
    } catch (e) {
        console.error('高亮顯示時發生錯誤:', e);
        return text;
    }
}

// 顯示搜尋結果
function showSearchResults(searchResults, searchTerm) {
    try {
        // 建立新視窗
        const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        if (!newWindow) {
            showErrorMessage('無法開啟新視窗，請允許彈出視窗');
            return;
        }
        
        // 建立搜尋結果的 HTML 內容
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>搜尋結果: ${escapeHtml(searchTerm) || '所有題目'}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px;
                    line-height: 1.6;
                }
                h1 { 
                    color: #333; 
                    text-align: center;
                    margin-bottom: 20px;
                }
                .search-info {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                tr:hover {
                    background-color: #f1f1f1;
                }
                .highlight {
                    background-color: #fff3cd;
                    font-weight: bold;
                }
                .answer {
                    color: #28a745;
                    font-weight: bold;
                }
                @media print {
                    body { padding: 0.4in; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>搜尋結果</h1>
            <div class="search-info">
                <p>搜尋關鍵字: <strong>${escapeHtml(searchTerm) || '（顯示所有題目）'}</strong> | 共找到 <strong>${searchResults.length}</strong> 筆結果</p>
                <button onclick="window.print()" class="no-print" style="padding: 8px 16px; margin: 10px 0; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">列印結果</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="8%">題號</th>
                        <th width="8%">答案</th>
                        <th width="30%">題目</th>
                        <th width="54%">選項</th>
                    </tr>
                </thead>
                <tbody>
                    ${searchResults.map(q => {
                        const safeQuestion = escapeHtml(q.question || '');
                        return `
                        <tr>
                            <td>${escapeHtml(q.number || '')}</td>
                            <td class="answer">${escapeHtml(q.answer || '')}</td>
                            <td>${highlightText(safeQuestion, searchTerm)}</td>
                            <td>
                                <div>${highlightText(escapeHtml(q.option1 || q.optionA || ''), searchTerm)}</div>
                                <div>${highlightText(escapeHtml(q.option2 || q.optionB || ''), searchTerm)}</div>
                                <div>${highlightText(escapeHtml(q.option3 || q.optionC || ''), searchTerm)}</div>
                                <div>${highlightText(escapeHtml(q.option4 || q.optionD || ''), searchTerm)}</div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </body>
        </html>`;

        // 寫入新視窗的內容
        newWindow.document.open();
        newWindow.document.write(html);
        newWindow.document.close();
    } catch (error) {
        console.error('顯示搜尋結果時發生錯誤:', error);
        showErrorMessage('顯示搜尋結果時發生錯誤，請查看控制台獲取詳細資訊');
    }
}

// 處理搜尋
export function handleSearch() {
    console.log('開始執行搜尋...');
    
    try {
        const questions = getQuestions();
        
        // 檢查是否有題目
        if (!questions || questions.length === 0) {
            showErrorMessage('請先上傳題目檔案');
            console.error('錯誤：尚未載入任何題目');
            return;
        }
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            console.error('錯誤：找不到搜尋輸入框');
            return;
        }
        
        const searchTerm = searchInput.value.trim().toLowerCase();
        console.log('搜尋關鍵字:', searchTerm);
        
        let filteredQuestions;
        
        if (!searchTerm) {
            filteredQuestions = [...questions];
            console.log('未輸入關鍵字，顯示所有題目，共', filteredQuestions.length, '題');
        } else {
            filteredQuestions = questions.filter(q => {
                try {
                    const searchableFields = [
                        q.question || '',
                        q.option1 || '',
                        q.option2 || '',
                        q.option3 || '',
                        q.option4 || '',
                        q.number ? q.number.toString() : ''
                    ];
                    
                    return searchableFields.some(field => 
                        field.toLowerCase().includes(searchTerm)
                    );
                } catch (e) {
                    console.error('過濾題目時發生錯誤:', e, q);
                    return false;
                }
            });
            
            console.log('找到符合條件的題目:', filteredQuestions.length, '題');
        }
        
        if (filteredQuestions.length === 0) {
            showErrorMessage('找不到符合條件的題目');
            return;
        }
        
        // 在新視窗中顯示搜尋結果
        showSearchResults(filteredQuestions, searchTerm);
        showSuccessMessage(`找到 ${filteredQuestions.length} 筆符合的題目，已在新視窗中顯示`);
    } catch (error) {
        console.error('執行搜尋時發生錯誤:', error);
        showErrorMessage('執行搜尋時發生錯誤，請查看控制台獲取詳細資訊');
    }
}