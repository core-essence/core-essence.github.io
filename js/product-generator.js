/**
 * ProductGenerator - メインハンドラー
 * 
 * ファイル構成：
 * product-generator.js                // 本ファイル：メインハンドラー（司令塔）
 * ├── product-generator_github-sync.js   // GitHub同期機能（アップロード、削除、更新）
 * ├── product-generator_html-builder.js  // HTML生成機能（テンプレート、CSS）
 * └── product-generator_api-handler.js   // 外部API連携（Gemini API、R2アップロード）
 * 
 * 役割：
 * - 各機能モジュールの呼び出しと連携
 * - app.jsからの指示を受けて、適切なモジュールに処理を振り分け
 * - 全体的な処理フローの管理
 */

class ProductGenerator {
    constructor(storage, templateGenerator, jsGenerator, postGenerationManager) {
        this.storage = storage;
        this.templateGenerator = templateGenerator;
        this.jsGenerator = jsGenerator;
        this.postGenerationManager = postGenerationManager;
        
        // 各モジュールを初期化
        this.githubSync = new GitHubSyncManager();
        this.htmlBuilder = new ProductHTMLBuilder();
        this.apiHandler = new ProductAPIHandler();
        
        this.generatedFiles = [];
    }
    
    // 商品生成メインメソッド
    async generateProducts(products, thumbnailImages, detailImages) {
        try {
            addLog('商品ページ生成を開始します...', 'info');
            this.generatedFiles = [];
            
            const generatedProducts = [];
            
            // 1. 各商品のページを生成
            for (const product of products) {
                addLog(`商品 ${product.productNumber} を処理中...`, 'info');
                
                try {
                    // 画像処理
                    const images = await this.apiHandler.processImages(
                        product.productNumber,
                        thumbnailImages[product.productNumber],
                        detailImages[product.productNumber]
                    );
                    
                    // 商品説明文の生成
                    const description = await this.apiHandler.generateDescription(product);
                    
                    // カテゴリー判定
                    const category = this.htmlBuilder.determineCategory(product);
                    product.category = category;
                    
                    // HTML生成
                    const html = this.htmlBuilder.generateProductHTML(product, description, images);
                    
                    // IndexedDBに保存
                    await this.storage.saveProduct(product.productNumber, html, product);
                    
                    // 生成ファイルリストに追加
                    this.generatedFiles.push({
                        filename: `${product.productNumber}.html`,
                        content: html,
                        productData: product
                    });
                    
                    generatedProducts.push({
                        ...product,
                        description: description,
                        images: images
                    });
                    
                    addLog(`商品 ${product.productNumber} の生成が完了しました`, 'success');
                    
                } catch (error) {
                    addLog(`商品 ${product.productNumber} の生成エラー: ${error.message}`, 'error');
                }
            }
            
            // 2. products.jsonを生成（既存とマージ）
            const productsJson = await this.githubSync.mergeWithExistingProducts(generatedProducts);
            this.generatedFiles.push({
                filename: 'products.json',
                content: JSON.stringify(productsJson, null, 2),
                isJson: true
            });
            
            // 3. index.htmlを生成
            const indexHtml = this.htmlBuilder.generateIndexHTML();
            this.generatedFiles.push({
                filename: 'index.html',
                content: indexHtml,
                isIndex: true
            });
            
            // 4. ダウンロードオプションを表示
            this.showDownloadOptions();
            
            // 5. 生成後の処理
            if (this.postGenerationManager) {
                this.postGenerationManager.showPostGenerationOptions(generatedProducts);
            }
            
            return generatedProducts;
            
        } catch (error) {
            addLog('商品ページ生成中にエラーが発生しました: ' + error.message, 'error');
            throw error;
        }
    }
    
    // GitHubと完全同期（削除も含む）
    async syncWithGitHub() {
        try {
            addLog('=== GitHub完全同期開始 ===', 'info');
            
            // ローカルの商品一覧を取得
            const localProducts = await this.storage.getAllProducts();
            const localProductNumbers = localProducts.map(p => p.productNumber);
            
            // GitHubと同期（削除も含む）
            await this.githubSync.fullSync(localProductNumbers, this.generatedFiles);
            
            addLog('=== GitHub完全同期完了 ===', 'success');
            
        } catch (error) {
            addLog('GitHub同期エラー: ' + error.message, 'error');
            throw error;
        }
    }
    
    // GitHubに直接アップロード
    async uploadToGitHub() {
        try {
            if (!confirm('GitHubに直接アップロードしますか？\n既存のファイルは上書きされます。')) {
                return;
            }
            
            await this.githubSync.uploadFiles(this.generatedFiles);
            
        } catch (error) {
            addLog(`GitHubアップロードエラー: ${error.message}`, 'error');
            alert('GitHubへのアップロードに失敗しました。\nコンソールでエラーを確認してください。');
        }
    }
    
    // すべてのファイルをZIPでダウンロード
    async downloadAllFiles() {
        try {
            // JSZipライブラリのロード
            if (typeof JSZip === 'undefined') {
                addLog('ZIPライブラリを読み込んでいます...', 'info');
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                document.head.appendChild(script);
                
                await new Promise(resolve => {
                    script.onload = resolve;
                });
            }
            
            addLog('ZIPファイルを作成しています...', 'info');
            const zip = new JSZip();
            
            // productsフォルダを作成
            const productsFolder = zip.folder('products');
            
            // ファイルを追加
            this.generatedFiles.forEach(file => {
                if (file.filename === 'products.json' || file.filename === 'index.html') {
                    // ルートに配置
                    zip.file(file.filename, file.content);
                } else {
                    // productsフォルダに配置
                    productsFolder.file(file.filename, file.content);
                }
            });
            
            // ZIPファイルをダウンロード
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aminati-ec-${this.formatDate()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            
            addLog(`${this.generatedFiles.length}個のファイルをZIPでダウンロードしました`, 'success');
        } catch (error) {
            addLog('ZIPダウンロードエラー: ' + error.message, 'error');
        }
    }
    
    // products.jsonのみダウンロード
    downloadProductsJson() {
        const jsonFile = this.generatedFiles.find(f => f.filename === 'products.json');
        if (jsonFile) {
            const blob = new Blob([jsonFile.content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.json';
            a.click();
            URL.revokeObjectURL(url);
            
            addLog('products.json をダウンロードしました', 'success');
        }
    }
    
    // ダウンロードオプションを表示
    showDownloadOptions() {
        // 既存のダウンロードセクションがあれば削除
        const existingSection = document.querySelector('.download-section');
        if (existingSection) {
            existingSection.remove();
        }
        
        const downloadSection = document.createElement('div');
        downloadSection.className = 'download-section';
        downloadSection.innerHTML = `
            <div class="download-options">
                <h3>📥 生成ファイルのダウンロード</h3>
                <p>GitHubにアップロードするファイルをダウンロードできます。</p>
                <div class="download-buttons">
                    <button class="btn btn-primary" onclick="app.productGenerator.downloadAllFiles()">
                        📦 すべてのファイルをダウンロード (ZIP)
                    </button>
                    <button class="btn btn-secondary" onclick="app.productGenerator.downloadProductsJson()">
                        📄 products.json のみダウンロード
                    </button>
                    <button class="btn btn-success" onclick="app.productGenerator.uploadToGitHub()">
                        🚀 GitHubに直接アップロード
                    </button>
                    <button class="btn btn-warning" onclick="app.productGenerator.syncWithGitHub()">
                        🔄 GitHub完全同期（削除も実行）
                    </button>
                </div>
                <div class="file-list">
                    <h4>生成されたファイル (${this.generatedFiles.length}個):</h4>
                    <ul>
                        ${this.generatedFiles.map(f => `
                            <li>
                                <span class="file-icon">${f.isIndex ? '🏠' : f.isJson ? '📄' : '📝'}</span>
                                ${f.filename}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <style>
                .download-section {
                    margin: 20px 0;
                    padding: 20px;
                    background: #f0f8ff;
                    border-radius: 8px;
                    border: 2px solid #007bff;
                }
                .download-options h3 {
                    margin-bottom: 10px;
                    color: #007bff;
                }
                .download-buttons {
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                }
                .file-list {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .file-list h4 {
                    margin-bottom: 10px;
                    color: #333;
                }
                .file-list ul {
                    list-style: none;
                    padding: 0;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .file-list li {
                    padding: 5px 10px;
                    background: white;
                    margin-bottom: 5px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .file-icon {
                    font-size: 16px;
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
                .btn-success:hover {
                    background: #218838;
                }
                .btn-warning {
                    background: #ffc107;
                    color: #212529;
                }
                .btn-warning:hover {
                    background: #e0a800;
                }
            </style>
        `;
        
        // 既存のログエリアの前に挿入
        const logArea = document.getElementById('logArea');
        if (logArea) {
            logArea.parentNode.insertBefore(downloadSection, logArea);
        }
    }
    
    // 日付フォーマット
    formatDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}