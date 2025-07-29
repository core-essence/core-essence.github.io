// HTMLテンプレート生成クラス
class HTMLTemplateGenerator {
    constructor() {
        // HTML生成専用クラス
    }
    
    generateHTML(product, description, images, jsGenerator) {
        const thumbnailUrl = images.thumbnail || 'https://via.placeholder.com/500x625/f5f5f5/666666?text=No+Image';
        const detailUrls = images.details;
        
        const hasDiscount = product.originalPrice && product.originalPrice != product.salePrice;
        const discountRate = hasDiscount ? Math.round((1 - product.salePrice / product.originalPrice) * 100) : 0;
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${this.escapeHtml(product.productName)} - AMINATI_EC</title>
    ${this.getProductStyles()}
</head>
<body>
    ${this.getHeader()}
    
    <main>
        ${this.getImageSection(thumbnailUrl, detailUrls)}
        ${this.getProductDetails(product, hasDiscount, discountRate)}
        ${this.getDescription(description)}
        ${this.getSpecifications(product)}
    </main>
    
    ${this.getPurchaseSection()}
    
<script>
    ${jsGenerator.getAdminSettingsCode()}  // ← これを削除するかも
    ${jsGenerator.getProductScripts(product, images)}
    ${jsGenerator.getPurchaseFlowScript()}
</script>
</body>
</html>`;
    }
    
    getProductStyles() {
        return `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            overflow-x: hidden;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        header { 
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            background-color: #ffffff; 
            z-index: 1000; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
        }
        .header-content { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 20px; 
            position: relative;
        }
        .menu-btn {
            width: 24px;
            height: 24px;
            position: relative;
            cursor: pointer;
            z-index: 1002;
        }
        .menu-btn span {
            display: block;
            width: 100%;
            height: 2px;
            background-color: #000000;
            position: absolute;
            transition: all 0.3s ease;
        }
        .menu-btn span:nth-child(1) { top: 0; }
        .menu-btn span:nth-child(2) { top: 11px; }
        .menu-btn span:nth-child(3) { bottom: 0; }
        .menu-btn.active span:nth-child(1) {
            transform: rotate(45deg);
            top: 11px;
        }
        .menu-btn.active span:nth-child(2) {
            opacity: 0;
        }
        .menu-btn.active span:nth-child(3) {
            transform: rotate(-45deg);
            bottom: 11px;
        }
        .logo { 
            font-size: 28px; 
            font-weight: 900; 
            letter-spacing: -2px;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
        }
        .cart-icon {
            width: 24px;
            height: 24px;
            position: relative;
            cursor: pointer;
        }
        
        .slide-menu {
            position: fixed;
            top: 0;
            left: -300px;
            width: 300px;
            height: 100vh;
            background-color: #ffffff;
            z-index: 1001;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 2px 0 20px rgba(0,0,0,0.1);
        }
        .slide-menu.active {
            left: 0;
        }
        .menu-header {
            padding: 30px 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        .menu-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .menu-subtitle {
            font-size: 12px;
            color: #888888;
        }
        .menu-nav {
            padding: 20px 0;
        }
        .menu-item {
            display: block;
            padding: 15px 20px;
            text-decoration: none;
            color: #000000;
            font-size: 16px;
            font-weight: 500;
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .menu-item:hover {
            background-color: #f5f5f5;
            padding-left: 30px;
        }
        .menu-item::after {
            content: '→';
            position: absolute;
            right: 20px;
            opacity: 0.5;
        }
        .menu-footer {
            position: absolute;
            bottom: 30px;
            left: 20px;
            right: 20px;
        }
        .menu-footer-text {
            font-size: 11px;
            color: #888888;
            line-height: 1.5;
        }
        
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
        }
        .overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        main { 
            margin-top: 64px; 
            flex: 1;
            margin-bottom: 100px;
        }
        
        .product-images { 
            position: relative; 
            width: 100%; 
            background: #f5f5f5; 
        }
        .main-image { 
            width: 100%; 
            height: auto; 
            display: block; 
        }
        .image-carousel { 
            display: flex; 
            overflow-x: auto; 
            gap: 10px; 
            padding: 10px; 
            background: #ffffff;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }
        .image-carousel::-webkit-scrollbar { display: none; }
        .carousel-item { 
            flex: 0 0 80px; 
            height: 100px; 
            background: #f5f5f5;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer; 
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        .carousel-item.active { border-color: #000000; }
        .carousel-item img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }
        
        .product-details { padding: 20px; }
        .brand-name { 
            font-size: 12px; 
            color: #666666; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 8px; 
        }
        .product-name { 
            font-size: 18px; 
            font-weight: 700; 
            line-height: 1.4;
            margin-bottom: 15px; 
        }
        .stock-info { 
            background: #000000; 
            color: #ffffff; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 11px;
            font-weight: 600;
            display: inline-block; 
            margin-bottom: 15px; 
        }
        .price-section { 
            margin-bottom: 20px; 
            padding-bottom: 20px; 
            border-bottom: 1px solid #e0e0e0; 
        }
        .current-price { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 5px;
        }
        .original-price { 
            font-size: 16px; 
            color: #999999; 
            text-decoration: line-through; 
            margin-right: 10px; 
        }
        .discount-badge { 
            background: #ff0000; 
            color: #ffffff; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        
        .selection-section { margin-bottom: 20px; }
        .section-title { 
            font-size: 14px; 
            font-weight: 600; 
            margin-bottom: 10px; 
        }
        .color-options, .size-options { 
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .option-item {
            padding: 8px 16px;
            border: 1px solid #e0e0e0;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 13px;
        }
        .option-item.active {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
        }
        .size-options .option-item {
            min-width: 60px;
            text-align: center;
            border-radius: 8px;
        }
        
        .purchase-section { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            background: #ffffff; 
            padding: 15px 20px 25px; 
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 997;
        }
        .purchase-buttons { 
            display: grid; 
            grid-template-columns: 1fr; 
            gap: 10px; 
        }
        .btn-add-cart { 
            background: #000000; 
            color: #ffffff; 
            padding: 15px; 
            border: none; 
            border-radius: 8px; 
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-add-cart:active { transform: scale(0.98); }
        
        .description-section { 
            padding: 20px; 
            background: #f8f8f8;
            margin-bottom: 20px;
        }
        .description-text { 
            font-size: 14px; 
            line-height: 1.8;
            color: #333333;
        }
        .details-section { 
            padding: 20px; 
            background: #ffffff;
        }
        .detail-item { 
            display: flex; 
            padding: 12px 0; 
            border-bottom: 1px solid #f0f0f0; 
        }
        .detail-item:last-child {
            border-bottom: none;
        }
        .detail-label { 
            flex: 0 0 100px; 
            font-size: 13px; 
            color: #666666; 
        }
        .detail-value { 
            flex: 1; 
            font-size: 13px;
            color: #000000;
        }
    </style>`;
    }
    
    getHeader() {
        const settings = window.adminSettings ? window.adminSettings.settings : {
            businessHours: '平日 9:00-18:00',
            tel: '03-XXXX-XXXX',
            fax: '03-XXXX-XXXX'
        };
        
        return `
    <header>
        <div class="header-content">
            <div class="menu-btn" id="menuBtn">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <h1 class="logo">AMINATI</h1>
            <div class="cart-icon"></div>
        </div>
    </header>
    
    <div class="slide-menu" id="slideMenu">
        <div class="menu-header">
            <div class="menu-title">MENU</div>
            <div class="menu-subtitle">WHOLESALE CATALOG</div>
        </div>
        <nav class="menu-nav">
            <a href="#" class="menu-item" onclick="goToTopPage(); return false;">トップページ</a>
            <a href="#" class="menu-item" onclick="showAllProducts(); return false;">すべての商品</a>
            <a href="#" class="menu-item" onclick="showNewProducts(); return false;">新着商品</a>
            <a href="#" class="menu-item" onclick="showCategories(); return false;">カテゴリー</a>
            <a href="#" class="menu-item" onclick="showAboutTrade(); return false;">お取引について</a>
            <a href="#" class="menu-item" onclick="showCompanyInfo(); return false;">会社概要</a>
            <a href="#" class="menu-item" onclick="showContact(); return false;">お問い合わせ</a>
        </nav>
        <div class="menu-footer">
            <p class="menu-footer-text">
                営業時間: ${settings.businessHours}<br>
                TEL: ${settings.tel}<br>
                FAX: ${settings.fax}
            </p>
        </div>
    </div>

    <div class="overlay" id="overlay"></div>`;
    }
    
    getImageSection(thumbnailUrl, detailUrls) {
        const hasMultipleImages = detailUrls.length > 0;
        
        return `
        <div class="product-images">
            <img src="${thumbnailUrl}" alt="商品画像" class="main-image" id="mainImage">
            ${hasMultipleImages ? `
            <div class="image-carousel">
                <div class="carousel-item active" onclick="changeImage('${thumbnailUrl}', this)">
                    <img src="${thumbnailUrl}" alt="メイン画像">
                </div>
                ${detailUrls.map((url, index) => `
                <div class="carousel-item" onclick="changeImage('${url}', this)">
                    <img src="${url}" alt="画像${index + 2}">
                </div>
                `).join('')}
            </div>
            ` : ''}
        </div>`;
    }
    
    getProductDetails(product, hasDiscount, discountRate) {
        const priceClass = hasDiscount ? 'style="color: #ff0000;"' : '';
        
        return `
        <div class="product-details">
            <div class="brand-name">${product.brandName || 'AMINATI COLLECTION'}</div>
            <h2 class="product-name">${this.escapeHtml(product.productName)}</h2>
            
            <div class="stock-info">在庫 無限</div>
            
            <div class="price-section">
                <div class="current-price" ${priceClass}>¥${this.formatNumber(product.salePrice)}</div>
                ${hasDiscount ? `
                <span class="original-price">¥${this.formatNumber(product.originalPrice)}</span>
                <span class="discount-badge">${discountRate}% OFF</span>
                ` : ''}
            </div>

            ${product.colors && product.colors.length > 0 ? `
            <div class="selection-section">
                <h3 class="section-title">カラー</h3>
                <div class="color-options">
                    ${product.colors.map((color, index) => `
                    <div class="option-item color-option ${index === 0 ? 'active' : ''}" data-value="${this.escapeHtml(color)}">${this.escapeHtml(color)}</div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${product.sizes && product.sizes.length > 0 ? `
            <div class="selection-section">
                <h3 class="section-title">サイズ</h3>
                <div class="size-options">
                    ${product.sizes.map((size, index) => `
                    <div class="option-item size-option ${index === 0 ? 'active' : ''}" data-value="${this.escapeHtml(size)}">${this.escapeHtml(size)}</div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>`;
    }
    
    getDescription(description) {
        return `
        <div class="description-section">
            <h3 class="section-title">商品説明</h3>
            <p class="description-text">${description.replace(/\n/g, '<br>')}</p>
        </div>`;
    }
    
    getSpecifications(product) {
        return `
        <div class="details-section">
            <h3 class="section-title">商品詳細</h3>
            <div class="detail-item">
                <span class="detail-label">素材</span>
                <span class="detail-value">${product.material || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">原産国</span>
                <span class="detail-value">${product.origin || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">品番</span>
                <span class="detail-value">${product.productNumber}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">性別タイプ</span>
                <span class="detail-value">メンズ・レディース</span>
            </div>
        </div>`;
    }
    
    getPurchaseSection() {
        return `
    <div class="purchase-section">
        <div class="purchase-buttons">
            <button class="btn-add-cart" onclick="startPurchaseFlow()">注文する（代引きのみ）</button>
        </div>
    </div>`;
    }
    
    // ユーティリティメソッド
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }
}