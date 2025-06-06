// 資料庫名稱和版本
const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'questions';

let db = null;

// 開啟或建立資料庫
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('無法開啟資料庫', event);
            reject('無法開啟資料庫');
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 如果物件儲存空間不存在，則建立
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                
                // 建立索引以便搜尋
                store.createIndex('number', 'number', { unique: false });
                store.createIndex('question', 'question', { unique: false });
                store.createIndex('answer', 'answer', { unique: false });
            }
        };
    });
}

// 儲存題目到資料庫
export async function saveQuestionsToDB(questions) {
    if (!db) await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // 先清空現有資料
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
            // 儲存新題目
            let count = 0;
            
            questions.forEach((question, index) => {
                // 為每個題目添加唯一ID
                const questionWithId = { ...question, id: Date.now() + index };
                const request = store.add(questionWithId);
                
                request.onsuccess = () => {
                    count++;
                    if (count === questions.length) {
                        resolve(count);
                    }
                };
                
                request.onerror = (event) => {
                    console.error('儲存題目失敗', event);
                    reject('儲存題目失敗');
                };
            });
            
            if (questions.length === 0) {
                resolve(0);
            }
        };
        
        clearRequest.onerror = (event) => {
            console.error('清除資料庫失敗', event);
            reject('清除資料庫失敗');
        };
    });
}

// 從資料庫載入題目
export async function loadQuestionsFromDB() {
    if (!db) await openDB();
    
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result || []);
        };
        
        request.onerror = (event) => {
            console.error('載入題目失敗', event);
            resolve([]);
        };
    });
}

// 清除資料庫
export async function clearDB() {
    if (!db) await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('清除資料庫失敗', event);
            reject('清除資料庫失敗');
        };
    });
}
