// 資料庫名稱和版本
const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'questions';

// 使用更具描述性的變數名
let database = null;

// 開啟或建立資料庫
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('無法開啟資料庫:', event.target.error);
            console.error('錯誤名稱:', event.target.error.name);
            console.error('錯誤訊息:', event.target.error.message);
            reject(`無法開啟資料庫: ${event.target.error.message}`);
        };
        
        request.onsuccess = (event) => {
            database = event.target.result;
            resolve(database);
        };
        
        request.onupgradeneeded = (event) => {
            console.log('資料庫需要升級或初始化');
            const db = event.target.result;
            database = db;
            
            // 如果物件儲存空間已存在，先刪除
            if (db.objectStoreNames.contains(STORE_NAME)) {
                console.log('刪除舊的資料表:', STORE_NAME);
                db.deleteObjectStore(STORE_NAME);
            }
            
            try {
                // 建立新的物件儲存空間
                console.log('建立新的資料表:', STORE_NAME);
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                
                // 建立索引以便搜尋
                store.createIndex('number', 'number', { unique: false });
                store.createIndex('question', 'question', { unique: false });
                store.createIndex('answer', 'answer', { unique: false });
                
                console.log('資料表建立完成');
            } catch (error) {
                console.error('建立資料表時發生錯誤:', error);
                throw error;
            }
        };
    });
}

// 儲存題目到資料庫
export async function saveQuestionsToDB(questions) {
    console.log('開始儲存題目到資料庫，共', questions.length, '題');
    
    if (!db) {
        try {
            console.log('資料庫尚未初始化，正在初始化...');
            await openDB();
            console.log('資料庫初始化完成');
        } catch (error) {
            console.error('資料庫初始化失敗:', error);
            throw new Error(`資料庫初始化失敗: ${error.message || '未知錯誤'}`);
        }
    }
    
    return new Promise((resolve, reject) => {
        if (!db) {
            const error = new Error('資料庫未正確初始化');
            console.error(error);
            return reject(error);
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // 監聽交易錯誤
        transaction.onerror = (event) => {
            console.error('資料庫交易錯誤:', event.target.error);
            reject(new Error(`資料庫交易錯誤: ${event.target.error?.message || '未知錯誤'}`));
        };
        
        // 監聽交易完成
        transaction.oncomplete = () => {
            console.log('資料庫交易完成');
        };
        
        // 先清空現有資料
        console.log('清空現有資料...');
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
            console.log('清空資料成功，開始儲存新題目...');
            // 儲存新題目
            let successCount = 0;
            let errorCount = 0;
            let hasError = false;
            
            // 如果沒有題目，直接解析為 0
            if (questions.length === 0) {
                console.log('沒有需要儲存的題目');
                return resolve(0);
            }
            
            questions.forEach((question, index) => {
                try {
                    // 為每個題目添加唯一ID
                    const questionWithId = { 
                        ...question, 
                        id: Date.now() + index, // 使用時間戳 + 索引作為唯一ID
                        createdAt: new Date().toISOString() // 添加創建時間
                    };
                    
                    const request = store.add(questionWithId);
                    
                    request.onsuccess = () => {
                        successCount++;
                        console.log(`題目 ${index + 1}/${questions.length} 儲存成功`);
                        
                        // 檢查是否所有題目都處理完成
                        if (successCount + errorCount === questions.length) {
                            if (errorCount > 0) {
                                console.warn(`儲存完成，成功 ${successCount} 題，失敗 ${errorCount} 題`);
                                if (successCount > 0) {
                                    resolve(successCount); // 部分成功
                                } else {
                                    reject(new Error('所有題目儲存失敗'));
                                }
                            } else {
                                console.log(`所有 ${successCount} 題已成功儲存`);
                                resolve(successCount); // 全部成功
                            }
                        }
                    };
                    
                    request.onerror = (event) => {
                        errorCount++;
                        console.error(`題目 ${index + 1} 儲存失敗:`, event.target.error);
                        
                        if (successCount + errorCount === questions.length) {
                            console.warn(`儲存完成，成功 ${successCount} 題，失敗 ${errorCount} 題`);
                            if (successCount > 0) {
                                resolve(successCount); // 部分成功，仍然解析
                            } else {
                                reject(new Error('所有題目儲存失敗'));
                            }
                        }
                    };
                } catch (error) {
                    errorCount++;
                    console.error(`處理題目 ${index + 1} 時發生錯誤:`, error);
                    
                    if (successCount + errorCount === questions.length) {
                        console.warn(`儲存完成，成功 ${successCount} 題，失敗 ${errorCount} 題`);
                        if (successCount > 0) {
                            resolve(successCount); // 部分成功，仍然解析
                        } else {
                            reject(new Error('所有題目處理失敗'));
                        }
                    }
                }
            });
        };
        
        clearRequest.onerror = (event) => {
            const error = new Error(`清除資料庫失敗: ${event.target.error?.message || '未知錯誤'}`);
            console.error(error.message, event.target.error);
            reject(error);
        };
    });
}

// 從資料庫載入題目
export async function loadQuestionsFromDB() {
    if (!database) await openDB();
    
    return new Promise((resolve, reject) => {
        if (!database) {
            console.error('資料庫未初始化');
            reject('資料庫未初始化');
            return;
        }

        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log('成功從資料庫載入', request.result.length, '題');
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('載入資料庫時發生錯誤:', event.target.error);
            reject('載入資料庫時發生錯誤');
        };
    });
}

// 清除資料庫
export async function clearDB() {
    if (!database) await openDB();
    
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('資料庫未初始化');
            return;
        }
        
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => {
            console.log('資料庫已清空');
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('清空資料庫失敗', event);
            reject('清空資料庫失敗');
        };
    });
}
