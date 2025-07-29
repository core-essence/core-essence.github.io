// ユーティリティ関数

// ログ出力
function addLog(message, type = 'info') {
    const logArea = document.getElementById('logArea');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logArea.appendChild(entry);
    logArea.style.display = 'block';
    logArea.scrollTop = logArea.scrollHeight;
    
    // 最大エントリ数を超えたら古いものを削除
    const entries = logArea.querySelectorAll('.log-entry');
    if (entries.length > CONFIG.UI.LOG_MAX_ENTRIES) {
        entries[0].remove();
    }
}

// 商品番号の抽出（互換性を保つため既存の関数は変更しない）
function extractProductNumber(filename) {
    // ファイル名から商品番号を抽出
    // 例: "21765-1(2).jpg" → "21765"
    // 例: "https://c.imgz.jp/004/21765-1(2).jpg" → "21765"
    // 例: "21765-thumb.jpg" → "21765"
    // 例: "21765-detail-1.jpg" → "21765"
    const basename = filename.split('/').pop().split('\\').pop();
    const match = basename.match(/(\d{4,})/);
    return match ? match[1] : null;
}

// ファイルタイプの判定関数（新規追加）
function isThumbFile(filename) {
    return filename.toLowerCase().includes('-thumb');
}

function isDetailFile(filename) {
    return filename.toLowerCase().includes('-detail');
}

// 商品番号とファイルタイプの詳細抽出（新規追加）
function extractProductInfo(filename) {
    const basename = filename.split('/').pop().split('\\').pop();
    const productNumber = extractProductNumber(filename);
    
    if (!productNumber) {
        return null;
    }
    
    // ファイルタイプを判定
    let type = 'unknown';
    if (isThumbFile(basename)) {
        type = 'thumbnail';
    } else if (isDetailFile(basename)) {
        type = 'detail';
    }
    
    // 詳細画像の場合、インデックス番号も抽出
    let index = null;
    if (type === 'detail') {
        const indexMatch = basename.match(/-detail-?(\d+)/i);
        if (indexMatch) {
            index = parseInt(indexMatch[1], 10);
        }
    }
    
    return {
        productNumber: productNumber,
        type: type,
        index: index,
        originalFilename: basename
    };
}

// ドラッグ&ドロップゾーンの設定
function setupDropZone(dropZoneId, handleFiles) {
    const dropZone = document.getElementById(dropZoneId);
    
    if (!dropZone) {
        console.error(`Drop zone not found: ${dropZoneId}`);
        return;
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('active'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'), false);
    });
    
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    }, false);
    
    // クリックでファイル選択
    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = dropZoneId !== 'excelDropZone';
        
        if (dropZoneId === 'excelDropZone') {
            input.accept = CONFIG.EXCEL.ACCEPTED_EXTENSIONS.join(',');
        } else if (dropZoneId.includes('Url')) {
            input.accept = '.txt,.xlsx,.xls';
        } else {
            input.accept = 'image/*';
        }
        
        input.onchange = (e) => {
            handleFiles(e.target.files);
        };
        input.click();
    });
}

// ファイルタイプのチェック
function isExcelFile(file) {
    return CONFIG.EXCEL.ACCEPTED_EXTENSIONS.some(ext => file.name.endsWith(ext));
}

function isImageFile(file) {
    return file.type.startsWith('image/');
}

function isTextFile(file) {
    return file.name.endsWith('.txt');
}

// 配列フィールドのパース
function parseArrayField(field) {
    if (!field) return [];
    return String(field).split(',').map(item => item.trim()).filter(item => item);
}

// 成功メッセージの表示
function showSuccessMessage(message = '商品の登録が完了しました！') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, CONFIG.UI.SUCCESS_MESSAGE_DURATION);
}

// エラーメッセージの表示
function showErrorMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message status-error';
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
        statusMessage.className = 'status-message status-success';
    }, CONFIG.UI.SUCCESS_MESSAGE_DURATION * 2);
}

// ファイルダウンロード
function downloadFile(content, filename, mimeType = 'text/html;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 数値のフォーマット
function formatNumber(num) {
    return Number(num).toLocaleString();
}

// 日付のフォーマット
function formatDate(date = new Date()) {
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}