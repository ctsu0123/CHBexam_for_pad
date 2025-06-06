const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // 解析 URL
    const parsedUrl = url.parse(req.url);
    
    // 處理根路徑
    let pathname = path.join(__dirname, parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname);
    
    // 獲取文件擴展名
    const ext = path.parse(pathname).ext;
    
    // 讀取文件
    fs.readFile(pathname, (err, data) => {
        if (err) {
            console.error(`檔案讀取錯誤: ${pathname}`, err);
            res.statusCode = 404;
            res.end(`檔案未找到: ${pathname}`);
            return;
        }
        
        // 設置 MIME 類型
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        
        // 發送文件內容
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`伺服器運行在 http://localhost:${PORT}/`);
    console.log('按 Ctrl+C 停止伺服器');
});
