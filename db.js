// IndexedDB 資料庫設定
const DB_NAME = 'QuizDB';
const DB_VERSION = 1;
const STORE_NAME = 'questions';

// 開啟或建立資料庫
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject('無法開啟資料庫');
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// 儲存題目到 IndexedDB
async function saveQuestionsToDB(questions) {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // 先清空現有資料
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = resolve;
            clearRequest.onerror = () => reject('無法清空資料');
        });
        
        // 儲存新題目
        const addPromises = questions.map((question, index) => {
            return new Promise((resolve, reject) => {
                const request = store.add({ ...question, id: index + 1 });
                request.onsuccess = resolve;
                request.onerror = () => reject('儲存題目失敗');
            });
        });
        
        await Promise.all(addPromises);
        return questions.length;
    } catch (error) {
        console.error('儲存題目到資料庫失敗:', error);
        throw error;
    }
}

// 從 IndexedDB 載入題目
async function loadQuestionsFromDB() {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => {
                const questions = request.result.map(q => {
                    // 移除 ID 欄位，保持與原本的資料結構一致
                    const { id, ...question } = q;
                    return question;
                });
                resolve(questions);
            };
            
            request.onerror = () => reject('無法載入題目');
        });
    } catch (error) {
        console.error('從資料庫載入題目失敗:', error);
        throw error;
    }
}

// 清除 IndexedDB 中的題目
async function clearDB() {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = resolve;
            request.onerror = () => reject('無法清除資料');
        });
    } catch (error) {
        console.error('清除資料庫失敗:', error);
        throw error;
    }
}

export { saveQuestionsToDB, loadQuestionsFromDB, clearDB };
