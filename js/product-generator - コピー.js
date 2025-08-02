// 商品ページ生成クラス（コア機能）
class ProductGenerator {
    constructor(app) {
        this.app = app;
        this.apiClient = new GeminiAPIClient();
        this.storage = new ProductStorage();
        this.r2Uploader = new R2UploaderSimple();
        
        // 分割されたクラスを依存として注入
        this.htmlGenerator = new HTMLTemplateGenerator();
        this.jsGenerator = new JavaScriptCodeGenerator();
        this.postGenManager = new PostGenerationManager(this);
    }
    
    async generateAll() {
        const btn = document.getElementById('generateBtn');
        const loading = btn.querySelector('.loading');
        
        btn.disabled = true;
        loading.style.display = 'inline-block';
        
        addLog('商品ページ生成開始', 'info');
        
        try {
            const productCount = Object.keys(this.app.productData).length;
            let generatedCount = 0;
            const generatedProducts = [];
            
            for (const [productNumber, product] of Object.entries(this.app.productData)) {
                const result = await this.generateProduct(product);
                if (result) {
                    generatedProducts.push(result);
                    generatedCount++;
                    addLog(`進捗: ${generatedCount}/${productCount}`, 'info');
                }
            }
            
            if (generatedCount > 0) {
                showSuccessMessage(`${generatedCount}件の商品ページを生成・保存しました`);
                this.postGenManager.showPostGenerationOptions(generatedProducts);
            }
            
        } catch (error) {
            addLog(`生成エラー: ${error.message}`, 'error');
            showErrorMessage('商品ページの生成中にエラーが発生しました');
        } finally {
            btn.disabled = false;
            loading.style.display = 'none';
        }
    }
    
    async generateProduct(product) {
        addLog(`商品 ${product.productNumber} のページ生成中...`, 'info');
        
        try {
            const description = await this.generateDescription(product);
            const category = await this.determineCategory(product);
            product.category = category;
            
            const images = await this.processProductImages(product.productNumber);
            const html = this.htmlGenerator.generateHTML(product, description, images, this.jsGenerator);
            
            await this.storage.saveProduct(product.productNumber, html, product);
            
            addLog(`商品 ${product.productNumber} のページ生成・保存完了`, 'success');
            
            return {
                productNumber: product.productNumber,
                productName: product.productName,
                html: html,
                category: category
            };
            
        } catch (error) {
            addLog(`商品 ${product.productNumber} の生成エラー: ${error.message}`, 'error');
            return null;
        }
    }
    
    async processProductImages(productNumber) {
        const thumbnailData = this.app.thumbnailImages[productNumber];
        const detailsData = this.app.detailImages[productNumber] || [];
        
        let thumbnailUrl = null;
        const detailUrls = [];
        
        if (thumbnailData) {
            if (thumbnailData.isUrl) {
                thumbnailUrl = thumbnailData.url;
            } else if (thumbnailData.file) {
                const path = `products/${productNumber}-thumb.jpg`;
                thumbnailUrl = await this.r2Uploader.uploadImage(thumbnailData.file, path);
            } else {
                thumbnailUrl = `${this.r2Uploader.publicUrl}/products/${productNumber}-thumb.jpg`;
            }
        }
        
        for (let i = 0; i < detailsData.length; i++) {
            const detail = detailsData[i];
            
            if (detail.isUrl) {
                detailUrls.push(detail.url);
            } else if (detail.file) {
                const path = `products/${productNumber}-detail-${i + 1}.jpg`;
                const url = await this.r2Uploader.uploadImage(detail.file, path);
                detailUrls.push(url);
            } else {
                const url = `${this.r2Uploader.publicUrl}/products/${productNumber}-detail-${i + 1}.jpg`;
                detailUrls.push(url);
            }
        }
        
        return {
            thumbnail: thumbnailUrl,
            details: detailUrls
        };
    }
    
    async generateDescription(product) {
        let apiKey = '';
        
        if (window.adminSettings) {
            apiKey = window.adminSettings.get('geminiApiKey');
        }
        
        if (apiKey) {
            try {
                return await this.apiClient.generateDescription(product.productName, apiKey);
            } catch (error) {
                addLog('Gemini API エラー、デフォルト説明文を使用します', 'warning');
            }
        }
        
        return this.getDefaultDescription(product.productName);
    }
    
    getDefaultDescription(productName) {
        return `${productName}は、上質な素材と洗練されたデザインが特徴的なアイテムです。

シンプルながらもこだわりのディテールが光る一着で、様々なスタイリングに合わせやすく、長くご愛用いただけます。

快適な着心地と美しいシルエットを両立し、日常のあらゆるシーンで活躍します。

細部まで丁寧に仕上げられた品質の高さは、長期間の使用にも耐える耐久性を実現。
お手入れも簡単で、いつでも清潔に保てます。`;
    }
    
    async determineCategory(product) {
        const predefinedCategories = [
            'Tシャツ', 'カットソー', 'シャツ', 'ニット',
            'パンツ', 'スカート', 'ワンピース',
            'ジャケット', 'コート', 'アウター',
            'バッグ', 'シューズ', '財布', 'ベルト', '帽子', 'アクセサリー',
            'トップス', 'その他'
        ];
        
        const category = this.getDefaultCategory(product.productName);
        
        if (predefinedCategories.includes(category)) {
            addLog(`カテゴリー判定: ${product.productName} → ${category}`, 'success');
            return category;
        } else {
            addLog(`カテゴリー判定: ${product.productName} → その他（未定義カテゴリー）`, 'warning');
            return 'その他';
        }
    }
    
    getDefaultCategory(productName) {
        const name = productName.toLowerCase();
        
        if (name.includes('カットソー') || name.includes('cut and sewn')) return 'カットソー';
        if (name.includes('tシャツ') || name.includes('t-shirt') || name.includes('ティーシャツ')) return 'Tシャツ';
        if (name.includes('ニット') || name.includes('セーター') || name.includes('sweater') || name.includes('カーディガン')) return 'ニット';
        if (name.includes('シャツ') || name.includes('ブラウス')) return 'シャツ';
        if (name.includes('パンツ') || name.includes('ズボン') || name.includes('デニム') || name.includes('ジーンズ') || name.includes('スラックス')) return 'パンツ';
        if (name.includes('スカート')) return 'スカート';
        if (name.includes('ワンピース') || name.includes('ドレス')) return 'ワンピース';
        if (name.includes('ジャケット') || name.includes('ブルゾン')) return 'ジャケット';
        if (name.includes('コート')) return 'コート';
        if (name.includes('アウター') || name.includes('パーカー') || name.includes('フーディー') || name.includes('ウィンドブレーカー')) return 'アウター';
        if (name.includes('バッグ') || name.includes('かばん') || name.includes('鞄') || name.includes('リュック') || name.includes('トート')) return 'バッグ';
        if (name.includes('シューズ') || name.includes('靴') || name.includes('スニーカー') || name.includes('ブーツ') || name.includes('サンダル')) return 'シューズ';
        if (name.includes('ベルト')) return 'ベルト';
        if (name.includes('財布') || name.includes('ウォレット')) return '財布';
        if (name.includes('帽子') || name.includes('キャップ') || name.includes('ハット')) return '帽子';
        if (name.includes('アクセサリー') || name.includes('ネックレス') || name.includes('ブレスレット') || name.includes('リング') || name.includes('ピアス')) return 'アクセサリー';
        if (name.includes('トップス') || name.includes('tops')) return 'トップス';
        
        return 'その他';
    }
    
    // PostGenerationManagerに委譲するメソッド
    async viewTopPage() {
        return this.postGenManager.viewTopPage();
    }
    
    async viewProducts() {
        return this.postGenManager.viewProducts();
    }
    
    async exportAll() {
        return this.postGenManager.exportAll();
    }
    
    // ユーティリティメソッド
    escapeForJavaScript(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }
}