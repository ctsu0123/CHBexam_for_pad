// 觸控手勢支援
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
}

function handleTouchEnd(event) {
    if (!touchStartX) return;
    
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
    touchStartX = 0;
}

function handleSwipe() {
    const swipeThreshold = 100; // 增加滑動距離門檻
    
    if (touchEndX < touchStartX - swipeThreshold) {
        // 向左滑動，下一題
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
            // 播放滑動動畫
            playSwipeAnimation('next');
        }
    }
    
    if (touchEndX > touchStartX + swipeThreshold) {
        // 向右滑動，上一題
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.click();
            // 播放滑動動畫
            playSwipeAnimation('prev');
        }
    }
}

// 初始化觸控事件
function initTouchEvents() {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// 播放滑動動畫
function playSwipeAnimation(direction) {
    const animation = direction === 'next' ? 'slide-left' : 'slide-right';
    const outputSection = document.getElementById('output-section');
    
    if (outputSection) {
        outputSection.style.animation = `${animation} 0.3s ease-out`;
        setTimeout(() => {
            outputSection.style.animation = '';
        }, 300);
    }
}

// 初始化行動選單
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const leftPanel = document.getElementById('left-panel');
    
    if (mobileMenuBtn && leftPanel) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            leftPanel.classList.toggle('visible');
        });
        
        // 點擊外部關閉選單
        document.addEventListener('click', function(event) {
            if (leftPanel.classList.contains('visible') && 
                !leftPanel.contains(event.target) && 
                event.target !== mobileMenuBtn) {
                leftPanel.classList.remove('visible');
            }
        });
        
        // 防止點擊選單內部時觸發外部點擊事件
        leftPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// 檢測 iOS 裝置
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// 優化 iOS 輸入體驗
function optimizeForIOS() {
    if (!isIOS()) return;
    
    // 為輸入框添加額外的 padding 以防止縮放
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        input.style.fontSize = '16px'; // 防止 iOS 自動放大
    });
    
    // 防止點擊輸入框時頁面縮放
    document.documentElement.style.touchAction = 'manipulation';
    document.documentElement.style.webkitTextSizeAdjust = '100%';
    
    // 添加 iOS 下載提示
    const downloadLink = document.getElementById('download-link');
    if (downloadLink) {
        downloadLink.addEventListener('click', function(e) {
            // 短暫延遲後顯示提示，避免被瀏覽器阻擋
            setTimeout(() => {
                if (!window.confirm('在 iOS 上，請點擊「下載」按鈕後，選擇「在『檔案』中下載」或「下載連結檔案」以儲存範例檔案。')) {
                    // 使用者點擊取消，不做任何操作
                }
            }, 100);
        });
    }
}

// 處理視窗大小變更
function handleResize() {
    const leftPanel = document.getElementById('left-panel');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (window.innerWidth > 768) {
        // 桌面版：顯示左側面板，隱藏行動選單按鈕
        if (leftPanel) leftPanel.style.transform = 'none';
        if (mobileMenuBtn) mobileMenuBtn.style.display = 'none';
    } else {
        // 行動版：隱藏左側面板，顯示行動選單按鈕
        if (leftPanel) leftPanel.style.transform = 'translateX(-100%)';
        if (mobileMenuBtn) mobileMenuBtn.style.display = 'block';
    }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initTouchEvents();
    initMobileMenu();
    optimizeForIOS(); // 優化 iOS 裝置體驗
    handleResize();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);
    
    // 在 iOS 上禁用雙擊縮放
    if (isIOS()) {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
});

// 下載功能
function downloadFile(e) {
    if (e) {
        e.preventDefault(); // 阻止預設行為
        e.stopPropagation(); // 阻止事件冒泡
    }
    
    const fileUrl = 'example/範例.xlsx';
    
    // 檢查是否為 iOS 裝置
    if (isIOS()) {
        // 在 iOS 上使用 window.open 方法
        const newWindow = window.open(fileUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // 如果彈出視窗被阻擋，顯示提示訊息
            alert('請允許彈出視窗以下載檔案。如果沒有自動下載，請長按連結並選擇「下載連結檔案」。');
        }
    } else {
        // 在桌面上使用傳統的 iframe 方法
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = fileUrl;
        document.body.appendChild(iframe);
        
        // 設置延遲移除 iframe
        setTimeout(() => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    }
    
    return false;
}

// 題庫資料暫存於此
let questions = [];
let mode = '';
let currentIdx = 0;
let randomList = [];
let userAnswers = [];
let errorList = [];
let correctCount = 0, wrongCount = 0;
let handleKeyboard = null;

const leftPanel = document.getElementById('left-panel');
const toggleLeftBtn = document.getElementById('toggle-left');
const fileInput = document.getElementById('file-input');
const modeRadios = document.getElementsByName('mode');
const startBtn = document.getElementById('start-btn');
const outputSection = document.getElementById('output-section');
const navSection = document.getElementById('nav-section');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const gotoBtn = document.getElementById('goto-btn');
const gotoInput = document.getElementById('goto-input');
const randomCountSection = document.getElementById('random-count-section');
const randomCountInput = document.getElementById('random-count');
const instructions = document.getElementById('instructions');

// 隱藏/顯示左側面板
let leftPanelHidden = false;
toggleLeftBtn.onclick = () => {
    leftPanelHidden = !leftPanelHidden;
    leftPanel.classList.toggle('hidden', leftPanelHidden);
    // 隱藏說明文字
    if (instructions) instructions.classList.toggle('hidden', leftPanelHidden);
    // >>為隱藏，<<為顯示
    toggleLeftBtn.textContent = leftPanelHidden ? '>>' : '<<';
};
// 初始化符號
if (toggleLeftBtn) toggleLeftBtn.textContent = '<<';

// 切換模式時顯示/隱藏隨機題數並重置相關狀態
modeRadios.forEach(radio => {
    radio.onchange = () => {
        // 重置相關變數和狀態
        currentIdx = 0;
        
        // 重新初始化題目索引和答案陣列
        if (mode === 'random') {
            // 隨機模式：重新生成隨機題目索引
            let n = parseInt(randomCountInput.value, 10) || 1;
            if (n > questions.length) n = questions.length;
            randomList = shuffle([...Array(questions.length).keys()]).slice(0, n);
            userAnswers = Array(n).fill(null);
        } else {
            // 非隨機模式：使用完整題目列表
            randomList = [...Array(questions.length).keys()];
            userAnswers = Array(questions.length).fill(null);
        }
        
        errorList = [];
        correctCount = 0;
        wrongCount = 0;
        
        // 重置按鈕狀態
        prevBtn.disabled = true;
        prevBtn.style.backgroundColor = '#ccc';
        nextBtn.disabled = true;
        nextBtn.style.backgroundColor = '#ccc';
        
        // 重置鍵盤事件監聽器
        document.removeEventListener('keydown', handleKeyboard);
        
        if (radio.value === 'random') {
            randomCountSection.style.display = '';
        } else {
            randomCountSection.style.display = 'none';
        }
        mode = radio.value;
        
        // 重新添加 Enter 鍵監聽器
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startBtn.click(); // 觸發確認按鈕的點擊事件
            }
        });
    };
});

// 自訂檔案按鈕觸發與檔名顯示
const fileBtn = document.getElementById('file-btn');
const fileNameSpan = document.getElementById('file-name');
if (fileBtn && fileInput) {
    fileBtn.onclick = () => fileInput.click();
    fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
            const fileName = e.target.files[0].name;
            fileNameSpan.textContent = fileName;
            
            // 隱藏說明文字
            if (instructions) instructions.classList.add('hidden');
            
            // 讀取Excel檔案
            const reader = new FileReader();
            const fileStatus = document.getElementById('file-status');
            
            // 顯示讀取狀態
            fileStatus.className = 'file-status warning';
            fileStatus.textContent = '正在載入檔案...';
            fileStatus.style.display = 'block';
            
            reader.onload = function (evt) {
                try {
                    const data = evt.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const ws = workbook.Sheets['Sheet1'];
                    if (!ws) {
                        throw new Error('找不到工作表 Sheet1');
                    }
                    
                    // 確保工作表有資料
                    if (!Object.keys(ws).length) {
                        throw new Error('工作表中沒有資料');
                    }
                    
                    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    // 驗證資料格式
                    if (json.length < 2) {
                        throw new Error('題庫檔案格式不正確，請確認檔案包含題號、答案、題目和選項欄位');
                    }
                    
                    // 檢查標頭是否正確
                    const headers = json[0];
                    if (!headers || headers.length < 4 || 
                        headers[0] !== '題號' || headers[1] !== '答案' || 
                        headers[2] !== '題目' || headers[3] !== '選項') {
                        throw new Error('檔案欄位格式不正確，請確認包含題號、答案、題目和選項欄位');
                    }
                    
                    // 預期格式：[題號, 答案, 題目, 選項]
                    questions = [];
                    for (let i = 1; i < json.length; i++) {
                        const row = json[i];
                        if (row.length < 4) continue;
                        
                        // 檢查欄位資料是否完整
                        if (!row[0] || !row[1] || !row[2] || !row[3]) {
                            continue;
                        }
                        
                        questions.push({
                            id: row[0].toString().trim(),
                            answer: row[1].toString().trim(),
                            question: row[2].toString().trim(),
                            options: row[3].toString().trim()
                        });
                    }
                    
                    if (questions.length === 0) {
                        throw new Error('沒有找到有效的題目資料');
                    }
                    
                    // 顯示成功訊息
                    const successMsg = `題庫載入成功，共 ${questions.length} 題`;
                    fileStatus.className = 'file-status success';
                    fileStatus.textContent = successMsg;
                    
                    // 啟用開始按鈕
                    startBtn.disabled = false;
                    startBtn.style.backgroundColor = '';
                    
                } catch (error) {
                    fileStatus.className = 'file-status error';
                    fileStatus.textContent = `載入失敗：${error.message}`;
                    console.error('載入題庫失敗:', error);
                    
                    // 確保狀態訊息顯示
                    fileStatus.style.display = 'block';
                }
            };
            
            reader.onerror = function (error) {
                fileStatus.className = 'file-status error';
                fileStatus.textContent = '讀取檔案時發生錯誤';
                console.error('讀取檔案失敗:', error);
                
                // 確保狀態訊息顯示
                fileStatus.style.display = 'block';
            };
            
            // 使用更穩定的讀取方式
            try {
                reader.readAsBinaryString(e.target.files[0]);
            } catch (error) {
                fileStatus.className = 'file-status error';
                fileStatus.textContent = '讀取檔案失敗，請確認檔案格式正確';
                console.error('讀取檔案失敗:', error);
                
                // 確保狀態訊息顯示
                fileStatus.style.display = 'block';
            }      }
    });
}

// 開始測驗
startBtn.onclick = () => {
    // 檢查題庫
    if (!questions.length) {
        alert('請先上傳題庫 Excel 檔案！');
        return;
    }
    // 取得模式
    let selectedMode = '';
    modeRadios.forEach(radio => { if (radio.checked) selectedMode = radio.value; });
    if (!selectedMode) {
        alert('請選擇測驗模式！');
        return;
    }
    mode = selectedMode;
    currentIdx = 0;
    errorList = [];
    correctCount = 0;
    wrongCount = 0;
    
    // 重新初始化題目索引和答案陣列
    if (mode === 'random') {
        // 隨機模式：根據設定的題數重新生成隨機題目索引
        let n = parseInt(randomCountInput.value, 10) || 1;
        if (n > questions.length) n = questions.length;
        randomList = shuffle([...Array(questions.length).keys()]).slice(0, n);
        userAnswers = Array(n).fill(null);
    } else {
        // 非隨機模式：使用完整題目列表
        randomList = [...Array(questions.length).keys()];
        userAnswers = Array(questions.length).fill(null);
    }
    renderQuestion();
    
    // 移除舊的鍵盤事件監聽器
    if (handleKeyboard) {
        document.removeEventListener('keydown', handleKeyboard);
    }
    
    // 添加新的鍵盤事件監聽器
    if (!handleKeyboard) {
        handleKeyboard = function(e) {
            if (mode && !e.target.closest('#search-keyword')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (prevBtn.disabled) return;
                        prevBtn.onclick();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (nextBtn.disabled) return;
                        nextBtn.onclick();
                        break;
                }
            }
        };
    }
    document.addEventListener('keydown', handleKeyboard);
};

// 顯示題目
function renderQuestion() {
    outputSection.innerHTML = '';
    let idx = randomList[currentIdx];
    if (typeof idx === 'undefined') return;
    const q = questions[idx];
    // 題號、題目、選項
    let html = `<div><b>題號：</b>${q.id}</div>`;
    html += `<div style="margin:10px 0 10px 0;"><b>題目：</b><br>${formatContent(q.question)}</div>`;
    
    // 根據答案高亮選項
    let options = formatContent(q.options);
    const answer = parseInt(q.answer);
    if (mode === 'show-answer' && answer >= 1 && answer <= 4) {
        const optionText = options.match(/\(\d\)[^\(]+/g);
        if (optionText && optionText[answer - 1]) {
            const answerText = optionText[answer - 1];
            options = options.replace(answerText, `<span style="color:rgb(226, 140, 153);">${answerText}</span>`);
        }
    }
    html += `<div style="margin:10px 0 20px 0;"><b>選項：</b>${options}</div>`;
    // 模式判斷
    if (mode === 'show-answer') {
        html += `<div class="answer" style="font-size: 18px; color: rgb(192, 108, 122);">答案：${q.answer}</div>`;
    } else {
        html += renderOptions(q, idx);
        if (mode === 'random') {
            // 統計：答對、答錯、未答、正確比率
            const total = randomList.length;
            const unanswered = userAnswers.filter(x => !x).length;
            const ratio = total ? ((correctCount / (total - unanswered)) * 100).toFixed(1) : 0;
            // 依照數值顯示不同顏色
            const correctStyle = correctCount > 0 ? 'color: #4caf50;' : 'color: #9e9e9e;';
            const wrongStyle = wrongCount > 0 ? 'color: #f44336;' : 'color: #9e9e9e;';
            const unansweredStyle = unanswered > 0 ? 'color: #ff9800;' : 'color: #9e9e9e;';
            const ratioStyle = ratio >= 80 ? 'color: #4caf50;' : 
                              ratio >= 60 ? 'color: #2196f3;' : 
                              ratio > 0 ? 'color: #f44336;' : 
                              'color: #9e9e9e;';
            
            html += `
                <div id="stat-section" style="font-size: 16px; line-height: 1.5; margin: 10px 0;">
                    <span style="${correctStyle}">答對：${correctCount}</span>
                    <span style="${wrongStyle}">　答錯：${wrongCount}</span>
                    <span style="${unansweredStyle}">　未答：${unanswered}</span>
                    <span style="${ratioStyle}">　正確比率：${(isNaN(ratio)||!isFinite(ratio))?0:ratio}%</span>
                </div>`;
        }
    }
    // 隨機模式下最後一題且未答為0時才顯示錯題明細與匯出
    if (mode === 'random' && currentIdx === randomList.length - 1) {
        const unanswered = userAnswers.filter(x => !x).length;
        html += renderErrorLink(unanswered);
    }
    outputSection.innerHTML = html;
    gotoInput.value = currentIdx + 1;
    
    // 控制按鈕狀態
    if (currentIdx === 0) {
        prevBtn.disabled = true;
        prevBtn.style.backgroundColor = '#ccc';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.backgroundColor = '';
    }

    if (mode === 'random' && currentIdx === randomList.length - 1) {
        nextBtn.disabled = true;
        nextBtn.style.backgroundColor = '#ccc';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.backgroundColor = '';
    }
}

// 格式化題目內容 (1)~(4) 自動換行
function formatContent(content) {
    if (!content) return '';
    // 將 (1) 這種格式轉換為換行顯示
    return content.replace(/\(\d+\)/g, match => `<br>${match}`);
}

// 顯示紅色答案
function highlightAnswer(ans) {
    return `<span style="color:#d32f2f;">${ans}</span>`;
}

// 渲染選項按鈕
function renderOptions(q, idx) {
    let options = '';
    const btnClass = 'option-btn';
    const answer = q.answer.trim();
    
    // 在「逐題瀏覽(不含答案)」和「隨機出題」模式下顯示選項按鈕
    if ((mode === 'hide-answer' || mode === 'random') && q.options) {
        // 從選項文本中提取選項內容
        const optionMatches = q.options.match(/\(\d+\)[^\n]+/g) || [];
        
        optionMatches.forEach((opt, index) => {
            const optionNum = index + 1;
            const selected = userAnswers[currentIdx] == optionNum ? 'selected' : '';
            let correct = '', wrong = '';
            
            // 只在選擇後顯示正確/錯誤狀態
            if (userAnswers[currentIdx]) {
                if (optionNum == answer) {
                    correct = 'correct';
                } else if (userAnswers[currentIdx] == optionNum) {
                    wrong = 'wrong';
                }
            }
            
            options += `<button class="${btnClass} ${selected} ${correct} ${wrong}" data-option="${opt.trim()}" data-opt="${optionNum}">${optionNum}</button>`;
        });
        
        return `<div class="options">${options}</div>`;
    }
    
    // 其他模式下不顯示選項按鈕
    return '';
}

// 選項按鈕事件
outputSection.addEventListener('click', function(e) {
    if (!e.target.classList.contains('option-btn')) return;
    let opt = parseInt(e.target.getAttribute('data-opt'));
    if (!opt) return;
    
    if (mode === 'random') {
        // 隨機模式只能答一次
        if (userAnswers[currentIdx]) return;
        userAnswers[currentIdx] = opt;
        let idx = randomList[currentIdx];
        let q = questions[idx];
        if (opt == q.answer) {
            correctCount++;
        } else {
            wrongCount++;
            errorList.push({
                id: q.id,
                content: q.content,
                answer: q.answer
            });
        }
    } else {
        userAnswers[currentIdx] = opt;
    }
    renderQuestion();
});

// 上一題、下一題、跳轉
// 上一題
prevBtn.onclick = () => {
    if (currentIdx > 0) {
        currentIdx--;
        renderQuestion();
        // 更新按鈕狀態
        if (currentIdx === 0) {
            prevBtn.disabled = true;
            prevBtn.style.backgroundColor = '#ccc';
        }
        nextBtn.disabled = false;
        nextBtn.style.backgroundColor = '';
    }
};

// 下一題
nextBtn.onclick = () => {
    if (currentIdx < randomList.length - 1) {
        currentIdx++;
        renderQuestion();
        // 更新按鈕狀態
        if (currentIdx === randomList.length - 1) {
            nextBtn.disabled = true;
            nextBtn.style.backgroundColor = '#ccc';
        }
        prevBtn.disabled = false;
        prevBtn.style.backgroundColor = '';
    }
};

gotoBtn.onclick = () => {
    let n = parseInt(gotoInput.value, 10);
    if (!n || n < 1 || n > randomList.length) {
        alert('題號超出範圍');
        return;
    }
    currentIdx = n - 1;
    renderQuestion();
    // 手動更新按鈕狀態
    if (n === 1) {
        prevBtn.disabled = true;
        prevBtn.style.backgroundColor = '#ccc';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.backgroundColor = '';
    }
    if (n === randomList.length) {
        nextBtn.disabled = true;
        nextBtn.style.backgroundColor = '#ccc';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.backgroundColor = '';
    }
};

gotoInput.onkeydown = function(e) {
    if (e.key === 'Enter') gotoBtn.onclick();
};

// 隨機排列
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 錯題明細連結與匯出
function renderErrorLink(unanswered) {
    if (!errorList.length || unanswered > 0) return '';
    return `<div style="margin-top:18px;">
        <button id="show-error-detail-btn">查看錯題明細</button>
        <button id="export-error-btn">另存 EXCEL</button>
    </div>`;
}

outputSection.addEventListener('click', function(e) {
    if (e.target.id === 'show-error-detail-btn') {
        showErrorDetail();
    } else if (e.target.id === 'export-error-btn') {
        exportErrorExcel();
    }
});

function showErrorDetail() {
    let html = '<h3>錯題明細</h3>';
    html += '<table border=1 cellpadding=6 style="border-collapse:collapse;margin:20px 0;">';
    html += '<tr><th>題號</th><th>答案</th><th>題目</th><th>選項</th></tr>';
    for (let err of errorList) {
        const question = questions.find(q => q.id === err.id);
        if (question) {
            html += `<tr>
                <td>${err.id}</td>
                <td><span style="color: red; font-weight: bold;">${err.answer}</span></td>
                <td>${formatContent(question.question)}</td>
                <td>${question.options.replace(/\n/g, '<br>')}</td>
            </tr>`;
        }
    }
    html += '</table>';
    // 再次檢查未答數
    const unanswered = userAnswers.filter(x => !x).length;
    outputSection.innerHTML = html + renderErrorLink(unanswered);
}

function exportErrorExcel() {
    const wb = XLSX.utils.book_new();
    const wsData = [['題號', '答案', '題目', '選項']];
    errorList.forEach(err => {
        const question = questions.find(q => q.id === err.id);
        if (question) {
            wsData.push([
                err.id,
                err.answer,
                question.question,
                question.options
            ]);
        }
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, '錯題明細');
    XLSX.writeFile(wb, '錯題明細.xlsx');
}

// 初始化
function reset() {
    questions = [];
    mode = '';
    currentIdx = 0;
    randomList = [];
    userAnswers = [];
    errorList = [];
    correctCount = 0;
    wrongCount = 0;
    outputSection.innerHTML = '';
}
window.onbeforeunload = reset;

// 關鍵字查詢功能
const searchKeyword = document.getElementById('search-keyword');
const searchBtn = document.getElementById('search-btn');

// 當按下 Enter 鍵時觸發查詢
searchKeyword.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchQuestions();
    }
});

// 關鍵字查詢
function searchQuestions() {
    // 檢查題庫是否已載入
    if (!questions.length) {
        const win = window.open('', '_blank');
        if (win) {
            let html = '<style>' +
                'body { font-family: Arial, sans-serif; margin: 20px; }' +
                'h3 { color: #333; }' +
                'p { color: #666; margin: 10px 0; }' +
                '</style>' +
                '<h3>查詢結果</h3>' +
                '<p>抱歉，題庫尚未載入。</p>' +
                '<p>建議：</p>' +
                '<ul>' +
                    '<li>請先在左側選擇Excel檔案</li>' +
                    '<li>點擊「確認」按鈕載入題庫</li>' +
                '</ul>';
            win.document.write(html);
        }
        return;
    }

    const keyword = searchKeyword.value.trim();
    if (!keyword) {
        alert('請輸入關鍵字');
        return;
    }

    // 使用部分相同查詢
    const keywordLower = keyword.toLowerCase();
    const results = questions.filter(q => {
        const question = q.question.toLowerCase();
        const options = q.options.toLowerCase();
        const answer = q.answer.toLowerCase();
        const id = q.id.toString().toLowerCase();
        return question.includes(keywordLower) || 
               options.includes(keywordLower) || 
               answer.includes(keywordLower) || 
               id.includes(keywordLower);
    });

    if (!results.length) {
        const win = window.open('', '_blank');
        if (win) {
            let html = '<style>' +
                'body { font-family: Arial, sans-serif; margin: 20px; }' +
                'h3 { color: #333; }' +
                'p { color: #666; margin: 10px 0; }' +
                'ul { margin: 10px 0; padding-left: 20px; }' +
                'li { margin: 5px 0; }' +
                '</style>' +
                '<h3>查詢結果</h3>' +
                '<p>抱歉，未找到符合關鍵字「' + keyword + '」的題目。</p>' +
                '<p>建議：</p>' +
                '<ul>' +
                    '<li>請確認關鍵字是否正確</li>' +
                    '<li>嘗試使用不同的查詢模式（完全相同/部分相同）</li>' +
                    '<li>檢查題庫是否已正確載入</li>' +
                '</ul>' +
                '<p>目前題庫中共有 ' + questions.length + ' 題。</p>';
            win.document.write(html);
        }
        return;
    }

    // 在新視窗顯示查詢結果
    const win = window.open('', '_blank');
    if (win) {
        let html = '<style>' +
            'body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }' +
            'h3 { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }' +
            'table { width: 100%; border-collapse: separate; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
            'th { background-color: #2c3e50; color: white; padding: 15px; text-align: left; font-size: 16px; }' +
            'td { padding: 15px; border: none; background-color: white; }' +
            'tr:nth-child(even) { background-color: #f8f9fa; }' +
            'tr:hover { background-color: #f0f4f8; }' +
            '.question-content { margin: 0; line-height: 1.3; }' +
            '.answer { color: #d32f2f; font-weight: bold; font-size: 16px; }' +
            '.highlight { background-color: #ffd700; padding: 2px 4px; border-radius: 3px; }' +
            '</style>' +
            '<h3>查詢結果 - 共 ' + results.length + ' 題</h3>' +
            '<table>' +
            '<tr><th>題號</th><th>答案</th><th>題目</th><th>選項</th></tr>';

        results.forEach(q => {
            // 組合題目和選項內容
            const question = q.question;
            // 優化選項內容處理，確保沒有空白行
            const options = q.options
                .trim()  // 移除開頭和結尾空白
                .replace(/^\s+/g, '')  // 移除開頭空白
                .replace(/\s+/g, ' ')  // 將多個空白字符替換為單個空格
                .replace(/\((\d)\)/g, '<br>($1)')  // 處理選項編號
                .replace(/\n+/g, '<br>')  // 將換行符號替換為<br>，並移除多餘換行
            const answer = q.answer;
            
            // 高亮關鍵字
            const highlightKeyword = (text) => {
                // 先將文本轉換為小寫進行匹配
                const lowerText = text.toLowerCase();
                const regex = new RegExp(keywordLower, 'gi');
                let lastIndex = 0;
                let result = '';
                
                // 使用 exec 來找到所有匹配的位置
                let match;
                while ((match = regex.exec(lowerText)) !== null) {
                    // 添加未匹配的部分
                    result += text.substring(lastIndex, match.index);
                    // 添加高亮部分
                    result += '<span class="highlight">' + text.substring(match.index, match.index + match[0].length) + '</span>';
                    lastIndex = match.index + match[0].length;
                }
                // 添加剩餘部分
                result += text.substring(lastIndex);
                return result;
            };

            html += '<tr>' +
                '<td>' + highlightKeyword(q.id) + '</td>' +
                '<td><span class="answer">' + highlightKeyword(answer) + '</span></td>' +
                '<td>' + highlightKeyword(question) + '</td>' +
                '<td>' + highlightKeyword(options) + '</td>' +
                '</tr>';
        });

        html += '</table>';
        win.document.write(html);
    } else {
        alert('無法開啟新視窗，請檢查瀏覽器設定');
    }
}

// 確認查詢按鈕事件
if (searchBtn) {
    searchBtn.onclick = searchQuestions;
}
