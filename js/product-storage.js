// 商品ページストレージクラス
class ProductStorage {
    constructor() {
        this.dbName = 'AminatiECProducts';
        this.dbVersion = 2; // バージョンを2に上げる
        this.storeName = 'products';
        this.db = null;
        this.initDB();
    }
    
    // IndexedDBの初期化
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('データベースの初期化に失敗しました'));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                addLog('商品データベースを初期化しました', 'success');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 商品ページストア
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'productNumber' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    store.createIndex('category', 'productData.category', { unique: false });
                }
                
                // 画像ストア
                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', { keyPath: 'id' });
                    imageStore.createIndex('productNumber', 'productNumber', { unique: false });
                }
            };
        });
    }
    
    // 商品ページの保存
    async saveProduct(productNumber, htmlContent, productData) {
        if (!this.db) {
            await this.initDB();
        }
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const productRecord = {
            productNumber: productNumber,
            html: htmlContent,
            productData: productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };
        
        // 既存のレコードをチェック
        const existingRequest = store.get(productNumber);
        
        return new Promise((resolve, reject) => {
            existingRequest.onsuccess = () => {
                const existing = existingRequest.result;
                
                if (existing) {
                    // 更新
                    productRecord.createdAt = existing.createdAt;
                    productRecord.version = existing.version + 1;
                }
                
                const request = store.put(productRecord);
                
                request.onsuccess = () => {
                    addLog(`商品 ${productNumber} を保存しました（v${productRecord.version}）`, 'success');
                    resolve(productRecord);
                };
                
                request.onerror = () => {
                    reject(new Error(`商品 ${productNumber} の保存に失敗しました`));
                };
            };
        });
    }
    
    // 商品ページの取得
    async getProduct(productNumber) {
        if (!this.db) {
            await this.initDB();
        }
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(productNumber);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error(`商品 ${productNumber} の取得に失敗しました`));
            };
        });
    }
    
    // すべての商品を取得
    async getAllProducts() {
        if (!this.db) {
            await this.initDB();
        }
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('商品一覧の取得に失敗しました'));
            };
        });
    }
    
    // 商品の削除
    async deleteProduct(productNumber) {
        if (!this.db) {
            await this.initDB();
        }
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(productNumber);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                addLog(`商品 ${productNumber} を削除しました`, 'info');
                resolve();
            };
            
            request.onerror = () => {
                reject(new Error(`商品 ${productNumber} の削除に失敗しました`));
            };
        });
    }
    
    // 画像の保存
    async saveImage(productNumber, imageFile, type) {
        if (!this.db) {
            await this.initDB();
        }
        
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                const imageData = e.target.result;
                const id = `${productNumber}-${type}-${Date.now()}`;
                
                const transaction = this.db.transaction(['images'], 'readwrite');
                const store = transaction.objectStore('images');
                
                const imageRecord = {
                    id: id,
                    productNumber: productNumber,
                    type: type,
                    data: imageData,
                    filename: imageFile.name,
                    size: imageFile.size,
                    mimeType: imageFile.type,
                    createdAt: new Date().toISOString()
                };
                
                const request = store.put(imageRecord);
                
                request.onsuccess = () => {
                    resolve(imageRecord);
                };
                
                request.onerror = () => {
                    reject(new Error('画像の保存に失敗しました'));
                };
            };
            
            reader.onerror = () => {
                reject(new Error('画像の読み込みに失敗しました'));
            };
            
            reader.readAsDataURL(imageFile);
        });
    }
    
    // すべてのカテゴリーを取得（シンプル版）
    async getAllCategories() {
        // 事前定義されたカテゴリーリストを返す
        const predefinedCategories = [
            'Tシャツ', 'カットソー', 'シャツ', 'ニット',
            'パンツ', 'スカート', 'ワンピース',
            'ジャケット', 'コート', 'アウター',
            'バッグ', 'シューズ', '財布', 'ベルト', '帽子', 'アクセサリー',
            'トップス', 'その他'
        ];
        
        return predefinedCategories;
    }
    
    // 商品の画像を取得
    async getProductImages(productNumber) {
        if (!this.db) {
            await this.initDB();
        }
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const index = store.index('productNumber');
        const request = index.getAll(productNumber);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('画像の取得に失敗しました'));
            };
        });
    }
    
    // エクスポート機能（ZIPファイルとして一括ダウンロード）
    async exportAllProducts() {
        const products = await this.getAllProducts();
        
        if (products.length === 0) {
            showErrorMessage('エクスポートする商品がありません');
            return;
        }
        
        // JSZipライブラリが必要（CDNから読み込み）
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const zip = new JSZip();
        const productsFolder = zip.folder('products');
        
        // 各商品ページをZIPに追加
        products.forEach(product => {
            productsFolder.file(`${product.productNumber}.html`, product.html);
        });
        
        // インデックスファイルを生成
        const indexHtml = this.generateIndexHtml(products);
        zip.file('index.html', indexHtml);
        
        // ZIPファイルを生成してダウンロード
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aminati-ec-products-${formatDate()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        addLog(`${products.length}件の商品ページをエクスポートしました`, 'success');
    }
    
    // インデックスHTMLの生成
    generateIndexHtml(products) {
        const productList = products.map(p => `
            <li>
                <a href="products/${p.productNumber}.html">
                    ${p.productNumber} - ${p.productData.productName}
                </a>
            </li>
        `).join('');
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>商品一覧 - AMINATI_EC</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h1 { color: #333; }
        ul { list-style: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>商品一覧</h1>
    <p>生成日: ${formatDate()}</p>
    <p>商品数: ${products.length}件</p>
    <ul>${productList}</ul>
</body>
</html>`;
    }
    
    // GitHubへの自動アップロード（GitHub API使用）
    async uploadToGitHub(token, owner, repo, products) {
        const baseUrl = 'https://api.github.com';
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        for (const product of products) {
            const path = `products/${product.productNumber}.html`;
            const content = btoa(unescape(encodeURIComponent(product.html)));
            
            try {
                // 既存ファイルのチェック
                let sha;
                try {
                    const getResponse = await fetch(`${baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
                        headers: headers
                    });
                    
                    if (getResponse.ok) {
                        const data = await getResponse.json();
                        sha = data.sha;
                    }
                } catch (e) {
                    // ファイルが存在しない場合は新規作成
                }
                
                // ファイルの作成/更新
                const body = {
                    message: `Update product ${product.productNumber}`,
                    content: content,
                    branch: 'main'
                };
                
                if (sha) {
                    body.sha = sha;
                }
                
                const response = await fetch(`${baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                
                if (response.ok) {
                    addLog(`GitHub: ${product.productNumber}.html をアップロードしました`, 'success');
                } else {
                    throw new Error(`GitHub API Error: ${response.status}`);
                }
                
            } catch (error) {
                addLog(`GitHub: ${product.productNumber}.html のアップロードに失敗しました: ${error.message}`, 'error');
            }
        }
    }
}