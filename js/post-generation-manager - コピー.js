// 生成後処理管理クラス
class PostGenerationManager {
    constructor(productGenerator) {
        this.productGenerator = productGenerator;
        this.storage = productGenerator.storage;
    }
    
    showPostGenerationOptions(generatedProducts) {
        const optionsHtml = `
            <div class="post-generation-options" style="margin-top: 20px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
                <h3 style="font-size: 18px; margin-bottom: 15px;">生成完了！次のアクションを選択してください</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <button class="btn btn-primary" onclick="app.productGenerator.viewTopPage()">
                        🏠 トップページを確認
                    </button>
                    
                    <button class="btn btn-secondary" onclick="app.productGenerator.viewProducts()">
                        📋 保存した商品を確認
                    </button>
                    
                    <button class="btn btn-secondary" onclick="app.productGenerator.exportAll()">
                        💾 すべてエクスポート
                    </button>
                    
                    <button class="btn btn-secondary" onclick="app.clearAll()">
                        ✨ 新しい商品を登録
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #ffffff; border-radius: 8px;">
                    <h4 style="font-size: 14px; margin-bottom: 10px;">カテゴリー分類結果</h4>
                    <div style="font-size: 13px; color: #666;">
                        ${this.generateCategoryReport(generatedProducts)}
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('logArea').parentElement;
        const optionsDiv = document.createElement('div');
        optionsDiv.innerHTML = optionsHtml;
        container.appendChild(optionsDiv);
    }
    
    generateCategoryReport(products) {
        const categoryCount = {};
        
        products.forEach(product => {
            const category = product.category || 'その他';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        return Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => `${category}: ${count}件`)
            .join(' / ');
    }
    
    async viewTopPage() {
        window.open('index.html', '_blank');
    }
    
    async viewProducts() {
        const products = await this.storage.getAllProducts();
        
        if (products.length === 0) {
            showErrorMessage('保存された商品がありません');
            return;
        }
        
        const listHtml = this.generateProductListHtml(products);
        const blob = new Blob([listHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
    
    generateProductListHtml(products) {
        const productCards = products.map(p => `
            <div class="product-card" onclick="viewProduct('${p.productNumber}')">
                <div class="product-number">${p.productNumber}</div>
                <div class="product-name">${p.productData.productName}</div>
                <div class="product-meta">
                    <span>¥${this.formatNumber(p.productData.salePrice)}</span>
                    <span>更新: ${new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>保存済み商品一覧 - AMINATI_EC</title>
    <style>
        body { 
            font-family: -apple-system, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { 
            color: #333; 
            margin-bottom: 30px;
        }
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .product-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .product-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .product-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .product-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .product-meta {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #888;
        }
    </style>
    <script>
        async function viewProduct(productNumber) {
            const dbName = 'AminatiECProducts';
            const request = indexedDB.open(dbName);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['products'], 'readonly');
                const store = transaction.objectStore('products');
                const getRequest = store.get(productNumber);
                
                getRequest.onsuccess = () => {
                    const product = getRequest.result;
                    if (product) {
                        const blob = new Blob([product.html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }
                };
            };
        }
    </script>
</head>
<body>
    <h1>保存済み商品一覧（${products.length}件）</h1>
    <div class="product-grid">
        ${productCards}
    </div>
</body>
</html>`;
    }
    
    async exportAll() {
        await this.storage.exportAllProducts();
    }
    
    // ユーティリティメソッド
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }
}