// 商品ページ生成クラス
class ProductGenerator {
    constructor(storage, templateGenerator, jsGenerator, postGenerationManager) {
        this.storage = storage;
        this.templateGenerator = templateGenerator;
        this.jsGenerator = jsGenerator;
        this.postGenerationManager = postGenerationManager;
        this.generatedFiles = []; // 生成したファイルを保持
    }
    
    // 商品生成メインメソッド
    async generateProducts(products, thumbnailImages, detailImages) {
        try {
            addLog('商品ページ生成を開始します...', 'info');
            this.generatedFiles = []; // リセット
            
            const uploadedProducts = [];
            const generatedProducts = [];
            
            for (const product of products) {
                addLog(`商品 ${product.productNumber} を処理中...`, 'info');
                
                // 画像URL取得
                const images = await this.processImages(product, thumbnailImages, detailImages);
                
                // 商品説明文の生成
                const description = this.generateDescription(product);
                
                // HTML生成
                const html = this.templateGenerator.generateHTML(
                    product,
                    description,
                    images,
                    this.jsGenerator
                );
                
                // IndexedDBに保存（既存機能維持）
                await this.storage.saveProduct(product.productNumber, html, product);
                
                // ダウンロード用にファイルを保持
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
            }
            
            // 商品一覧JSONを生成
            const productsJson = this.generateProductsJson(generatedProducts);
            this.generatedFiles.push({
                filename: 'products.json',
                content: JSON.stringify(productsJson, null, 2),
                isJson: true
            });
            
            // トップページ(index.html)も生成
            const indexHtml = this.generateIndexHtml();
            this.generatedFiles.push({
                filename: 'index.html',
                content: indexHtml,
                isIndex: true
            });
            
            // ダウンロードボタンを表示
            this.showDownloadOptions();
            
            // 生成後の処理（既存）
            this.postGenerationManager.showPostGenerationOptions(generatedProducts);
            
            return uploadedProducts;
            
        } catch (error) {
            addLog('商品ページ生成中にエラーが発生しました: ' + error.message, 'error');
            throw error;
        }
    }
    
    // 画像処理
    async processImages(product, thumbnailImages, detailImages) {
        const productNumber = product.productNumber;
        const uploader = new R2UploaderSimple();
        
        // サムネイル画像の処理
        let thumbnailUrl = null;
        const thumbnailData = thumbnailImages[productNumber];
        
        if (thumbnailData) {
            if (thumbnailData.isUrl) {
                // URLの場合はそのまま使用
                thumbnailUrl = thumbnailData.url;
                addLog(`サムネイルURL使用: ${thumbnailUrl}`, 'info');
            } else if (thumbnailData.file) {
                // ファイルの場合はアップロード
                try {
                    const path = `products/${productNumber}-thumb.jpg`;
                    thumbnailUrl = await uploader.uploadImage(thumbnailData.file, path);
                    addLog(`サムネイルアップロード成功: ${path}`, 'success');
                } catch (error) {
                    addLog(`サムネイルアップロード失敗: ${error.message}`, 'error');
                    thumbnailUrl = thumbnailData.url; // ローカルURLをフォールバック
                }
            }
        }
        
        // 詳細画像の処理
        const detailUrls = [];
        const details = detailImages[productNumber] || [];
        
        for (let i = 0; i < details.length; i++) {
            const detailData = details[i];
            
            if (detailData.isUrl) {
                // URLの場合はそのまま使用
                detailUrls.push(detailData.url);
                addLog(`詳細画像URL使用: ${detailData.url}`, 'info');
            } else if (detailData.file) {
                // ファイルの場合はアップロード
                try {
                    const path = `products/${productNumber}-detail-${i + 1}.jpg`;
                    const url = await uploader.uploadImage(detailData.file, path);
                    detailUrls.push(url);
                    addLog(`詳細画像アップロード成功: ${path}`, 'success');
                } catch (error) {
                    addLog(`詳細画像アップロード失敗: ${error.message}`, 'error');
                    detailUrls.push(detailData.url); // ローカルURLをフォールバック
                }
            }
        }
        
        return {
            thumbnail: thumbnailUrl,
            details: detailUrls
        };
    }
    
    // 商品説明文の生成
    generateDescription(product) {
        const descriptions = [];
        
        // 基本的な商品説明
        descriptions.push(`${product.productName}は、${product.brandName || 'AMINATI'}の人気アイテムです。`);
        
        // カテゴリーに基づく説明
        if (product.category) {
            const categoryDescriptions = {
                'Tシャツ': 'シンプルで着回しやすいデザインが特徴的で、デイリーユースに最適です。',
                'シャツ': '上品な仕上がりで、ビジネスからカジュアルまで幅広いシーンで活躍します。',
                'パンツ': 'シルエットにこだわり、快適な履き心地を実現しています。',
                'ジャケット': '季節の変わり目に重宝する、スタイリッシュなアウターです。',
                'ニット': '柔らかな肌触りと暖かさを兼ね備えた、秋冬の定番アイテムです。'
            };
            
            const categoryDesc = categoryDescriptions[product.category] || 
                                `${product.category}カテゴリーの中でも特に人気の高いアイテムです。`;
            descriptions.push(categoryDesc);
        }
        
        // 素材についての説明
        if (product.material) {
            descriptions.push(`素材には${product.material}を使用し、品質にこだわって製作されています。`);
        }
        
        // 価格についての説明
        if (product.originalPrice && product.originalPrice > product.salePrice) {
            const discountRate = Math.round((1 - product.salePrice / product.originalPrice) * 100);
            descriptions.push(`今なら特別価格、${discountRate}%OFFでご提供中です。`);
        }
        
        // カラーバリエーション
        if (product.colors && product.colors.length > 1) {
            descriptions.push(`${product.colors.length}色のカラーバリエーションからお選びいただけます。`);
        }
        
        // サイズ展開
        if (product.sizes && product.sizes.length > 0) {
            descriptions.push(`サイズは${product.sizes.join('、')}をご用意しています。`);
        }
        
        // 締めの文
        descriptions.push('ぜひこの機会にお買い求めください。');
        
        return descriptions.join('\n');
    }
    
    // 商品一覧JSON生成
    generateProductsJson(products) {
        return {
            generated: new Date().toISOString(),
            count: products.length,
            products: products.map(p => ({
                productNumber: p.productNumber,
                productName: p.productName,
                brandName: p.brandName || 'AMINATI',
                category: p.category || 'その他',
                salePrice: p.salePrice,
                originalPrice: p.originalPrice,
                thumbnail: p.images.thumbnail,
                colors: p.colors || [],
                sizes: p.sizes || [],
                material: p.material || '',
                origin: p.origin || ''
            }))
        };
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
            </style>
        `;
        
        // 既存のログエリアの前に挿入
        const logArea = document.getElementById('logArea');
        logArea.parentNode.insertBefore(downloadSection, logArea);
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
            a.download = `aminati-ec-${formatDate()}.zip`;
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
    
    // GitHubに直接アップロード
    async uploadToGitHub() {
        try {
            // 設定
            const GITHUB_TOKEN = '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';
            const GITHUB_OWNER = 'aminati-ec';  // あなたのGitHubユーザー名
            const GITHUB_REPO = 'aminati-ec.github.io';  // リポジトリ名
            const GITHUB_BRANCH = 'main';  // ブランチ名（mainまたはmaster）
            
            if (!confirm('GitHubに直接アップロードしますか？\n既存のファイルは上書きされます。')) {
                return;
            }
            
            addLog('GitHubへのアップロードを開始します...', 'info');
            
            let successCount = 0;
            let errorCount = 0;
            
            // 各ファイルをアップロード
            for (const file of this.generatedFiles) {
                try {
                    let path = file.filename;
                    // productsフォルダ内のファイルはパスを調整
                    if (path.endsWith('.html') && path !== 'index.html') {
                        path = `products/${path}`;
                    }
                    
                    addLog(`アップロード中: ${path}`, 'info');
                    
                    // ファイルの内容をBase64エンコード
                    const content = btoa(unescape(encodeURIComponent(file.content)));
                    
                    // 既存ファイルの情報を取得（存在する場合）
                    let sha = null;
                    try {
                        const getResponse = await fetch(
                            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
                            {
                                headers: {
                                    'Authorization': `token ${GITHUB_TOKEN}`,
                                    'Accept': 'application/vnd.github.v3+json'
                                }
                            }
                        );
                        
                        if (getResponse.ok) {
                            const fileData = await getResponse.json();
                            sha = fileData.sha;
                        }
                    } catch (e) {
                        // ファイルが存在しない場合は新規作成
                    }
                    
                    // ファイルをアップロード
                    const uploadResponse = await fetch(
                        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${GITHUB_TOKEN}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: `Update ${path}`,
                                content: content,
                                branch: GITHUB_BRANCH,
                                ...(sha ? { sha } : {})
                            })
                        }
                    );
                    
                    if (uploadResponse.ok) {
                        successCount++;
                        addLog(`✅ ${path} をアップロードしました`, 'success');
                    } else {
                        errorCount++;
                        const error = await uploadResponse.text();
                        addLog(`❌ ${path} のアップロードに失敗: ${error}`, 'error');
                    }
                    
                } catch (error) {
                    errorCount++;
                    addLog(`❌ エラー: ${error.message}`, 'error');
                }
            }
            
            // 結果を表示
            if (errorCount === 0) {
                addLog(`🎉 すべてのファイル（${successCount}個）のアップロードが完了しました！`, 'success');
                alert(`アップロード完了！\n\n数分後に以下のURLで確認できます：\nhttps://${GITHUB_OWNER}.github.io/`);
            } else {
                addLog(`⚠️ アップロード完了: 成功 ${successCount}個, 失敗 ${errorCount}個`, 'warning');
                alert(`一部のファイルのアップロードに失敗しました。\n成功: ${successCount}個\n失敗: ${errorCount}個`);
            }
            
        } catch (error) {
            addLog(`GitHubアップロードエラー: ${error.message}`, 'error');
            alert('GitHubへのアップロードに失敗しました。\nコンソールでエラーを確認してください。');
        }
    }
    
    // トップページ用index.html生成
    generateIndexHtml() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMINATI_EC - オンラインストア</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.6;
        }
        
        header {
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -2px;
        }
        
        .header-nav {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        
        .cart-icon {
            width: 24px;
            height: 24px;
            cursor: pointer;
            position: relative;
        }
        
        .cart-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff0000;
            color: #ffffff;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
        }
        
        .hero {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            padding: 80px 30px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            letter-spacing: -1px;
        }
        
        .hero p {
            font-size: 18px;
            color: #666666;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .category-nav {
            background: #f8f8f8;
            padding: 20px 0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .category-list {
            display: flex;
            gap: 20px;
            padding: 0 30px;
            max-width: 1400px;
            margin: 0 auto;
            min-width: max-content;
        }
        
        .category-item {
            padding: 10px 20px;
            background: #ffffff;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            border: 2px solid transparent;
        }
        
        .category-item:hover {
            background: #000000;
            color: #ffffff;
        }
        
        .category-item.active {
            background: #000000;
            color: #ffffff;
        }
        
        .main-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 30px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 30px;
        }
        
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
        }
        
        .product-card {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .product-image {
            width: 100%;
            aspect-ratio: 4/5;
            object-fit: cover;
            background: #f5f5f5;
        }
        
        .product-info {
            padding: 20px;
        }
        
        .product-brand {
            font-size: 12px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .product-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            line-height: 1.4;
            height: 2.8em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .product-price {
            font-size: 18px;
            font-weight: 700;
        }
        
        .original-price {
            font-size: 14px;
            color: #999999;
            text-decoration: line-through;
            margin-right: 8px;
        }
        
        .sale-price {
            color: #ff0000;
        }
        
        footer {
            background: #000000;
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        
        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 32px;
            }
            
            .product-grid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 15px;
            }
            
            .category-list {
                padding: 0 15px;
            }
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666666;
        }
        
        .no-products {
            text-align: center;
            padding: 60px 20px;
            color: #666666;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 20px;
            border-radius: 8px;
            margin: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1 class="logo">AMINATI</h1>
            <nav class="header-nav">
                <div class="cart-icon">
                    <div class="cart-badge">0</div>
                </div>
            </nav>
        </div>
    </header>
    
    <section class="hero">
        <h1>AMINATI COLLECTION</h1>
        <p>上質なライフスタイルを提案する、こだわりのセレクション</p>
    </section>
    
    <nav class="category-nav">
        <div class="category-list" id="categoryList">
            <div class="category-item active" data-category="all">すべて</div>
        </div>
    </nav>
    
    <main class="main-container">
        <h2 class="section-title" id="sectionTitle">すべての商品</h2>
        
        <div class="product-grid" id="productGrid">
            <div class="loading">商品を読み込んでいます...</div>
        </div>
        
        <div class="no-products" id="noProducts" style="display: none;">
            <p>表示する商品がありません</p>
        </div>
    </main>
    
    <footer>
        <div class="footer-content">
            <p>&copy; 2024 AMINATI_EC. All rights reserved.</p>
        </div>
    </footer>
    
    <script>
        // グローバル変数
        let allProducts = [];
        let currentCategory = 'all';
        
        // ページ読み込み時の処理
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('[AMINATI_EC] ページ読み込み開始');
            await loadProducts();
            setupCategoryFilters();
        });
        
        // 商品データの読み込み（JSONファイルから）
        async function loadProducts() {
            try {
                console.log('[AMINATI_EC] 商品データ読み込み開始');
                
                const response = await fetch('./products.json');
                if (!response.ok) {
                    throw new Error('products.json の読み込みに失敗しました');
                }
                
                const data = await response.json();
                allProducts = data.products;
                
                console.log('[AMINATI_EC] 取得した商品数:', allProducts.length);
                
                if (allProducts.length === 0) {
                    document.getElementById('productGrid').innerHTML = '';
                    document.getElementById('noProducts').style.display = 'block';
                    return;
                }
                
                updateCategories();
                displayProducts();
                
            } catch (error) {
                console.error('[AMINATI_EC] 商品の読み込みエラー:', error);
                document.getElementById('productGrid').innerHTML = 
                    '<div class="error-message">商品データの読み込みに失敗しました</div>';
            }
        }
        
        // カテゴリーの更新
        function updateCategories() {
            const categories = new Set(['all']);
            
            allProducts.forEach(product => {
                if (product.category) {
                    categories.add(product.category);
                }
            });
            
            const categoryList = document.getElementById('categoryList');
            categoryList.innerHTML = '';
            
            // 「すべて」カテゴリーを追加
            const allItem = createCategoryElement('all', 'すべて');
            allItem.classList.add('active');
            categoryList.appendChild(allItem);
            
            // その他のカテゴリーを追加
            Array.from(categories).slice(1).sort().forEach(category => {
                const item = createCategoryElement(category, category);
                categoryList.appendChild(item);
            });
        }
        
        // カテゴリー要素の作成
        function createCategoryElement(value, text) {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.dataset.category = value;
            item.textContent = text;
            return item;
        }
        
        // カテゴリーフィルターの設定
        function setupCategoryFilters() {
            document.getElementById('categoryList').addEventListener('click', (e) => {
                if (e.target.classList.contains('category-item')) {
                    document.querySelectorAll('.category-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    e.target.classList.add('active');
                    
                    currentCategory = e.target.dataset.category;
                    
                    const title = currentCategory === 'all' ? 'すべての商品' : currentCategory;
                    document.getElementById('sectionTitle').textContent = title;
                    
                    displayProducts();
                }
            });
        }
        
        // 商品の表示
        function displayProducts() {
            const productGrid = document.getElementById('productGrid');
            const noProducts = document.getElementById('noProducts');
            
            const filteredProducts = currentCategory === 'all' 
                ? allProducts 
                : allProducts.filter(p => p.category === currentCategory);
            
            if (filteredProducts.length === 0) {
                productGrid.innerHTML = '';
                noProducts.style.display = 'block';
                return;
            }
            
            noProducts.style.display = 'none';
            productGrid.innerHTML = filteredProducts.map(product => {
                const hasDiscount = product.originalPrice && product.originalPrice != product.salePrice;
                
                return \`
                    <div class="product-card" onclick="openProduct('\${product.productNumber}')">
                        <img src="\${product.thumbnail || 'https://via.placeholder.com/500x625/f5f5f5/666666?text=No+Image'}" 
                             alt="\${product.productName}" 
                             class="product-image" 
                             loading="lazy">
                        <div class="product-info">
                            <div class="product-brand">\${product.brandName || 'AMINATI'}</div>
                            <h3 class="product-name">\${product.productName}</h3>
                            <div class="product-price">
                                \${hasDiscount ? \`<span class="original-price">¥\${formatNumber(product.originalPrice)}</span>\` : ''}
                                <span class="\${hasDiscount ? 'sale-price' : ''}">¥\${formatNumber(product.salePrice)}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // 商品ページを開く
        function openProduct(productNumber) {
            window.location.href = './products/' + productNumber + '.html';
        }
        
        // 数値のフォーマット
        function formatNumber(num) {
            return Number(num).toLocaleString();
        }
    </script>
</body>
</html>`;
    }
}

// HTMLテンプレートを読み込む関数（既存のコードとの互換性のため）
async function loadTemplate() {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>{{PRODUCT_NAME}} - AMINATI_EC</title>
    <style>
        /* ここにCSSを挿入 */
    </style>
</head>
<body>
    <!-- HTMLテンプレートの内容 -->
</body>
</html>`;
}

// 以下、既存の関数（互換性のため維持）
function generateColorSection(colors) {
    if (!colors || colors.length === 0) return '';
    
    let html = '<div class="color-section">\n';
    html += '    <h3 class="section-title">カラー</h3>\n';
    html += '    <div class="color-options">\n';
    
    colors.forEach((color, index) => {
        const activeClass = index === 0 ? ' active' : '';
        html += `        <div class="color-option${activeClass}">${color}</div>\n`;
    });
    
    html += '    </div>\n';
    html += '</div>';
    
    return html;
}

function generateSizeSection(sizes) {
    if (!sizes || sizes.length === 0) return '';
    
    let html = '<div class="size-section">\n';
    html += '    <h3 class="section-title">サイズ</h3>\n';
    html += '    <div class="size-options">\n';
    
    sizes.forEach((size, index) => {
        const activeClass = index === 0 ? ' active' : '';
        html += `        <div class="size-option${activeClass}">${size}</div>\n`;
    });
    
    html += '    </div>\n';
    html += '</div>';
    
    return html;
}

function generateImageCarousel(thumbnailUrl, detailUrls) {
    if (!detailUrls || detailUrls.length === 0) return '';
    
    let html = '<div class="image-carousel">\n';
    
    // サムネイル
    html += `    <div class="carousel-item active" onclick="changeImage('${thumbnailUrl}', this)">\n`;
    html += `        <img src="${thumbnailUrl}" alt="メイン画像">\n`;
    html += '    </div>\n';
    
    // 詳細画像
    detailUrls.forEach((url, index) => {
        html += `    <div class="carousel-item" onclick="changeImage('${url}', this)">\n`;
        html += `        <img src="${url}" alt="画像${index + 2}">\n`;
        html += '    </div>\n';
    });
    
    html += '</div>';
    
    return html;
}

function generateDiscountSection(originalPrice, salePrice) {
    if (!originalPrice || originalPrice <= salePrice) return '';
    
    const discountRate = Math.round((1 - salePrice / originalPrice) * 100);
    
    let html = `<span class="original-price">¥${Number(originalPrice).toLocaleString()}</span>\n`;
    html += `<span class="discount-badge">${discountRate}% OFF</span>`;
    
    return html;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function generateProductHTML(product, description) {
    const thumbnail = thumbnailImages[product.productNumber];
    const details = detailImages[product.productNumber] || [];
    
    const baseUrl = 'https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev/products/';
    const thumbnailUrl = thumbnail ? 
        (thumbnail.isUrl ? thumbnail.url : `${baseUrl}${product.productNumber}-thumb.jpg`) : 
        'https://via.placeholder.com/500x625/f5f5f5/666666?text=No+Image';
    
    const detailUrls = details.map((img, index) => 
        img.isUrl ? img.url : `${baseUrl}${product.productNumber}-detail-${index + 1}.jpg`
    );
    
    let html = await loadTemplate();
    
    const hasDiscount = product.originalPrice && product.originalPrice != product.salePrice;
    const priceColorClass = hasDiscount ? ' discount' : '';
    
    const replacements = {
        '{{PRODUCT_NAME}}': escapeHtml(product.productName),
        '{{THUMBNAIL_URL}}': thumbnailUrl,
        '{{IMAGE_CAROUSEL}}': generateImageCarousel(thumbnailUrl, detailUrls),
        '{{BRAND_NAME}}': escapeHtml(product.brandName || 'AMINATI COLLECTION'),
        '{{SALE_PRICE}}': Number(product.salePrice).toLocaleString(),
        '{{PRICE_COLOR_CLASS}}': priceColorClass,
        '{{DISCOUNT_SECTION}}': generateDiscountSection(product.originalPrice, product.salePrice),
        '{{COLOR_SECTION}}': generateColorSection(product.colors),
        '{{SIZE_SECTION}}': generateSizeSection(product.sizes),
        '{{DESCRIPTION}}': escapeHtml(description).replace(/\n/g, '<br>'),
        '{{MATERIAL}}': escapeHtml(product.material || '—'),
        '{{ORIGIN}}': escapeHtml(product.origin || '—'),
        '{{PRODUCT_NUMBER}}': escapeHtml(product.productNumber)
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
        html = html.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return html;
}

function downloadHTML(content, filename) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function sendOrderNotification(orderData) {
    try {
        const apiUrl = 'https://ec-image-uploader.archiver0922.workers.dev/send-order-email';
        
        let adminEmail = null;
        if (window.adminSettings) {
            const settingsEmail = window.adminSettings.get('email');
            if (settingsEmail && settingsEmail.trim() !== '') {
                adminEmail = settingsEmail;
            }
        }
        
        const emailData = {
            customerEmail: orderData.customer.email,
            adminEmail: adminEmail,
            orderId: orderData.orderId,
            customerName: orderData.customer.name,
            items: [{
                name: orderData.product.productName,
                brand: orderData.product.brandName,
                color: orderData.product.selectedColor,
                size: orderData.product.selectedSize,
                price: orderData.pricing.productPrice,
                quantity: 1
            }],
            pricing: orderData.pricing,
            customer: orderData.customer,
            delivery: orderData.delivery
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
            console.log('✅ メール送信成功');
        } else {
            console.error('❌ メール送信失敗');
        }
        
    } catch (error) {
        console.error('❌ API接続エラー:', error);
    }
}