// IndexedDB 数据库配置
const DB_NAME = 'CompetitionAwardsDB';
const DB_VERSION = 1;
const STORE_NAME = 'awards';
const API_URL = 'http://localhost:3000/api'; // 后端API地址
let db = null;

// IndexedDB 数据库操作模块
const IndexedDBManager = {
    // 打开数据库
    openDB() {
        return new Promise((resolve, reject) => {
            // 检查是否支持 IndexedDB
            if (!window.indexedDB) {
                reject(new Error('您的浏览器不支持 IndexedDB'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // 数据库版本升级时触发
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                // 创建存储对象
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = database.createObjectStore(STORE_NAME, { 
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    
                    // 创建索引以提高查询效率
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('major', 'major', { unique: false });
                    objectStore.createIndex('submitTime', 'submitTime', { unique: false });
                }
                
                console.log('IndexedDB 数据库初始化完成');
            };

            // 成功打开数据库
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('IndexedDB 数据库连接成功');
                resolve(db);
            };

            // 打开数据库失败
            request.onerror = (event) => {
                console.error('IndexedDB 数据库打开失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // 添加或更新数据
    async put(data) {
        if (!db) {
            await this.openDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.put(data);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error('数据存储失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // 获取所有数据
    async getAll() {
        if (!db) {
            await this.openDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };

            request.onerror = (event) => {
                console.error('数据获取失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // 删除单条数据
    async delete(id) {
        if (!db) {
            await this.openDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error('数据删除失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // 清空所有数据
    async clear() {
        if (!db) {
            await this.openDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error('数据清空失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // 获取存储容量信息
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    },

    // 检查数据库是否存在数据
    async hasData() {
        const data = await this.getAll();
        return data.length > 0;
    }
};

// 导出 IndexedDBManager
window.IndexedDBManager = IndexedDBManager;
