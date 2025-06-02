let originalData = null;

// 讀取Excel檔案
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 假設我們使用第一個工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 轉換為JSON格式
        originalData = XLSX.utils.sheet_to_json(worksheet);
        
        // 顯示原始表格
        displayTable('originalTable', originalData, true);
    };
    reader.readAsBinaryString(file);
}

// 轉換Excel資料
function convertExcel() {
    if (!originalData) {
        alert('請先上傳Excel檔案');
        return;
    }

    // 轉換資料
    const convertedData = originalData.map(row => {
        const content = row.內容 || '';
        const questionIndex = content.indexOf('(1)');
        
        if (questionIndex === -1) {
            return {
                '題號': row.題號 || '',
                '答案': row.答案 || '',
                '題目': content,
                '選項': ''
            };
        }

        const question = content.substring(0, questionIndex).trim();
        const options = content.substring(questionIndex);
        
        // 處理選項並標記正確答案
        const optionsArray = options
            .split('(')
            .filter(part => part.trim())
            .map(part => `(${part}`.trim());
            
        // 建立選項物件，包含編號和內容
        const processedOptions = optionsArray.map(option => {
            const numberMatch = option.match(/\((\d+)\)/);
            const number = numberMatch ? numberMatch[1] : '';
            const content = option.replace(/\(\d+\)/, '').trim();
            // 確保答案是數字格式
            const answer = String(row.答案).trim();
            return {
                number: number,
                content: content,
                isCorrect: number === answer
            };
        });

        // 將選項以紅色顯示正確答案
        const formattedOptions = processedOptions.map(option => {
            // 確保編號和內容都以紅色顯示
            const formattedNumber = option.isCorrect ? `<span style="color: red;">(${option.number})</span>` : `(${option.number})`;
            const formattedContent = option.isCorrect ? `<span style="color: red;">${option.content}</span>` : option.content;
            return `${formattedNumber} ${formattedContent}`;
        }).join('<br>');
        
        return {
            '題號': row.題號 || '',
            '答案': row.答案 || '',
            '題目': question,
            '選項': formattedOptions,
            '選項資料': processedOptions // 用於暫存選項資料
        };
    });

    // 顯示轉換後的表格
    displayTable('convertedTable', convertedData, false);
}

// 顯示表格
function displayTable(containerId, data, isOriginal = false) {
    const container = document.getElementById(containerId);
    if (!data || data.length === 0) {
        container.innerHTML = '<p>無資料</p>';
        return;
    }

    // 根據是否為原始資料決定顯示的欄位
    const headers = isOriginal ? Object.keys(data[0]) : ['題號', '答案', '題目', '選項'];

    // 建立表格
    const table = document.createElement('table');

    // 建立表頭
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 建立內容
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            // 如果是選項欄位，使用innerHTML來保留HTML格式
            if (header === '選項') {
                td.innerHTML = row[header];
            } else {
                td.textContent = row[header];
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

// 下載轉換後的Excel檔案
function downloadExcel() {
    if (!originalData) {
        alert('請先上傳Excel檔案');
        return;
    }

    // 轉換資料
    const convertedData = originalData.map(row => {
        const content = row.內容 || '';
        const questionIndex = content.indexOf('(1)');
        
        if (questionIndex === -1) {
            return {
                '題號': row.題號 || '',
                '答案': row.答案 || '',
                '題目': content,
                '選項': ''
            };
        }

        const question = content.substring(0, questionIndex).trim();
        const options = content.substring(questionIndex);
        
        // 將選項換行顯示
        const formattedOptions = options
            .split('(')
            .filter(part => part.trim())
            .map(part => `(${part}`)
            .join('\n');
        
        return {
            '題號': row.題號 || '',
            '答案': row.答案 || '',
            '題目': question,
            '選項': formattedOptions
        };
    });

    // 轉換為工作表
    const ws = XLSX.utils.json_to_sheet(convertedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "轉換後資料");

    // 下載
    XLSX.writeFile(wb, "轉換後資料.xlsx");
}

// 綁定檔案選擇事件
document.getElementById('excelFile').addEventListener('change', handleFileSelect);
