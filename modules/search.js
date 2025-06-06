import { getQuestions } from './questions.js';
import { showSuccessMessage, showErrorMessage } from './ui.js';

// 處理搜尋
export function handleSearch() {
    console.log('開始執行搜尋...');
    
    const questions = getQuestions();
    
    // 檢查是否有題目
    if (!questions || questions.length === 0) {
        showErrorMessage('請先上傳題目檔案');
        console.error('錯誤：尚未載入任何題目');
        return;
    }
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    console.log('搜尋關鍵字:', searchTerm);
    
    let filteredQuestions;
    
    if (!searchTerm) {
        filteredQuestions = [...questions];
        console.log('未輸入關鍵字，顯示所有題目，共', filteredQuestions.length, '題');
    } else {
        filteredQuestions = questions.filter(q => {
            const searchableFields = [
                q.question || '',
                q.optionA || '',
                q.optionB || '',
                q.optionC || '',
                q.optionD || '',
                q.number ? q.number.toString() : ''
            ];
            
            return searchableFields.some(field => 
                field.toLowerCase().includes(searchTerm)
            );
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
}

// 顯示搜尋結果
function showSearchResults(results, searchTerm) {
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
        </style>
    </head>
    <body>
        <h1>搜尋結果</h1>
        <div class="search-info">
            <p>搜尋關鍵字: <strong>${escapeHtml(searchTerm) || '（顯示所有題目）'}</strong> | 共找到 <strong>${results.length}</strong> 筆結果</p>
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
                ${results.map(q => `
                    <tr>
                        <td>${q.number || ''}</td>
                        <td class="answer">${q.answer || ''}</td>
                        <td>${highlightText(escapeHtml(q.question || ''), searchTerm)}</td>
                        <td>
                            <div><strong>A.</strong> ${highlightText(escapeHtml(q.optionA || ''), searchTerm)}</div>
                            <div><strong>B.</strong> ${highlightText(escapeHtml(q.optionB || ''), searchTerm)}</div>
                            <div><strong>C.</strong> ${highlightText(escapeHtml(q.optionC || ''), searchTerm)}</div>
                            <div><strong>D.</strong> ${highlightText(escapeHtml(q.optionD || ''), searchTerm)}</div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <script>
            // 高亮顯示搜尋關鍵字
            function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
            }
            
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
        </script>
    </body>
    </html>`;

    // 寫入新視窗的內容
    newWindow.document.open();
    newWindow.document.write(html);
    newWindow.document.close();
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
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
}
