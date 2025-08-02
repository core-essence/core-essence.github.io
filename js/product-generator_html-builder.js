/**
 * ProductHTMLBuilder - HTML生成クラス
 * 
 * 機能：
 * - 商品ページのHTML生成
 * - トップページ（index.html）の生成
 * - カテゴリー判定
 * - テンプレート管理
 */

class ProductHTMLBuilder {
    constructor() {
        // カテゴリーマスタ
        this.categories = [
            'Tシャツ', 'カットソー', 'シャツ', 'ニット',
            'パンツ', 'スカート', 'ワンピース',
            'ジャケット', 'コート', 'アウター',
            'バッグ', 'シューズ', '財布', 'ベルト', '帽子', 'アクセサリー',
            'トップス', 'その他'
        ];
    }
    
    // 商品ページHTML生成
    generateProductHTML(product, description, images) {
        const thumbnailUrl = images.thumbnail || 'https://via.placeholder.com/500x625/f5f5f5/666666?text=No+Image';
        const detailUrls = images.details || [];
        
        const hasDiscount = product.originalPrice && product.originalPrice != product.salePrice;
        const discountRate = hasDiscount ? Math.round((1 - product.salePrice / product.originalPrice) * 100) : 0;
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${this.escapeHtml(product.productName)} - AMINATI_EC</title>
    <!-- 外部CSSを読み込み -->
    <link rel="stylesheet" href="../css/product.css">
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
        ${this.getAdminSettingsCode()}
        ${this.getProductScripts(product, images)}
        ${this.getPurchaseFlowScript()}
    </script>
</body>
</html>`;
    }
    
    // ヘッダー部分
    getHeader() {
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
                営業時間: 平日 9:00-18:00<br>
                TEL: 03-XXXX-XXXX<br>
                FAX: 03-XXXX-XXXX
            </p>
        </div>
    </div>

    <div class="overlay" id="overlay"></div>`;
    }
    
    // 画像セクション
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
    
    // 商品詳細
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
    
    // 商品説明
    getDescription(description) {
        return `
        <div class="description-section">
            <h3 class="section-title">商品説明</h3>
            <p class="description-text">${description.replace(/\n/g, '<br>')}</p>
        </div>`;
    }
    
    // 仕様
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
    
    // 購入セクション
    getPurchaseSection() {
        return `
    <div class="purchase-section">
        <div class="purchase-buttons">
            <button class="btn-add-cart" onclick="startPurchaseFlow()">注文する（代引きのみ）</button>
        </div>
    </div>`;
    }
    
    // AdminSettings.jsのコード
    getAdminSettingsCode() {
        return `
        // 管理設定クラス（インライン版）
        class AdminSettings {
            constructor() {
                this.storageKey = 'aminatiAdminSettings';
                this.settings = this.loadSettings();
            }
            
            loadSettings() {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    return JSON.parse(saved);
                }
                
                // デフォルト設定
                return {
                    geminiApiKey: '',
                    companyName: 'AMINATI_EC',
                    companyFullName: '株式会社AMINATI',
                    ceo: '代表取締役',
                    address: '〒100-0001 東京都千代田区千代田1-1-1',
                    tel: '03-XXXX-XXXX',
                    fax: '03-XXXX-XXXX',
                    email: 'order@aminati-ec.com',
                    businessHours: '平日 9:00-18:00',
                    established: '2024年1月',
                    capital: '1,000万円',
                    business: 'アパレル製品の企画・製造・販売',
                    paymentMethod: '代金引換のみ',
                    minimumOrder: '1点から可能',
                    deliveryTime: 'ご注文から3-5営業日',
                    shippingFee: '全国一律送料無料',
                    returnPolicy: '商品到着後7日以内',
                    updated: new Date().toISOString()
                };
            }
            
            saveSettings() {
                this.settings.updated = new Date().toISOString();
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            }
            
            get(key) {
                return this.settings[key] || '';
            }
        }
        
        // グローバルに公開
        window.adminSettings = new AdminSettings();
        `;
    }
    
    // 商品ページ用スクリプト
    getProductScripts(product, images) {
        return `
        // メニューの開閉
        const menuBtn = document.getElementById('menuBtn');
        const slideMenu = document.getElementById('slideMenu');
        const overlay = document.getElementById('overlay');

        menuBtn.addEventListener('click', function() {
            menuBtn.classList.toggle('active');
            slideMenu.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', function() {
            menuBtn.classList.remove('active');
            slideMenu.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        // メニュー項目の処理
        function goToTopPage() {
            window.location.href = 'https://aminati-ec.github.io/';
        }
        
        function showAllProducts() {
            window.location.href = 'https://aminati-ec.github.io/';
        }
        
        function showNewProducts() {
            window.location.href = 'https://aminati-ec.github.io/#new';
        }
        
        function showCategories() {
            window.location.href = 'https://aminati-ec.github.io/#categories';
        }
        
        function showAboutTrade() {
            window.location.href = 'https://aminati-ec.github.io/trade.html';
        }
        
        function showCompanyInfo() {
            window.location.href = 'https://aminati-ec.github.io/company.html';
        }
        
        function showContact() {
            window.location.href = 'https://aminati-ec.github.io/contact.html';
        }
        
        // 画像切り替え
        function changeImage(src, element) {
            document.getElementById('mainImage').src = src;
            document.querySelectorAll('.carousel-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
        }
        
        // オプション選択
        document.querySelectorAll('.option-item').forEach(option => {
            option.addEventListener('click', function() {
                const siblings = this.parentElement.querySelectorAll('.option-item');
                siblings.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // 商品データ
        const currentProduct = {
            productNumber: '${product.productNumber}',
            productName: '${this.escapeForJavaScript(product.productName)}',
            brandName: '${this.escapeForJavaScript(product.brandName || 'AMINATI COLLECTION')}',
            price: ${product.salePrice},
            originalPrice: ${product.originalPrice || product.salePrice},
            material: '${this.escapeForJavaScript(product.material || '')}',
            origin: '${this.escapeForJavaScript(product.origin || '')}',
            colors: ${JSON.stringify(product.colors || [])},
            sizes: ${JSON.stringify(product.sizes || [])},
            thumbnail: '${images.thumbnail || ''}'
        };
        
        // 数値フォーマット
        function formatNumber(num) {
            return num.toLocaleString('ja-JP');
        }`;
    }
    
    // 購入フロースクリプト
    getPurchaseFlowScript() {
        // 長いので省略（product-generator2.jsから移植）
        return `
        // EmailNotificationService等の購入フロー関連のコード
        // ※既存のproduct-generator2.jsから移植
        `;
    }
    
    // カテゴリー判定
    determineCategory(product) {
        const name = product.productName.toLowerCase();
        
        const categoryMap = {
            'カットソー': ['カットソー', 'cut and sewn'],
            'Tシャツ': ['tシャツ', 't-shirt', 'ティーシャツ'],
            'ニット': ['ニット', 'セーター', 'sweater', 'カーディガン'],
            'シャツ': ['シャツ', 'ブラウス'],
            'パンツ': ['パンツ', 'ズボン', 'デニム', 'ジーンズ', 'スラックス'],
            'スカート': ['スカート'],
            'ワンピース': ['ワンピース', 'ドレス'],
            'ジャケット': ['ジャケット', 'ブルゾン'],
            'コート': ['コート'],
            'アウター': ['アウター', 'パーカー', 'フーディー', 'ウィンドブレーカー'],
            'バッグ': ['バッグ', 'かばん', '鞄', 'リュック', 'トート'],
            'シューズ': ['シューズ', '靴', 'スニーカー', 'ブーツ', 'サンダル'],
            'ベルト': ['ベルト'],
            '財布': ['財布', 'ウォレット'],
            '帽子': ['帽子', 'キャップ', 'ハット'],
            'アクセサリー': ['アクセサリー', 'ネックレス', 'ブレスレット', 'リング', 'ピアス'],
            'トップス': ['トップス', 'tops']
        };
        
        for (const [category, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                addLog(`カテゴリー判定: ${product.productName} → ${category}`, 'success');
                return category;
            }
        }
        
        addLog(`カテゴリー判定: ${product.productName} → その他`, 'warning');
        return 'その他';
    }
    
    // index.html生成
    generateIndexHTML() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMINATI_EC - オンラインストア</title>
    <style>
        /* CSSは省略（既存のものを使用） */
    </style>
</head>
<body>
    <!-- HTMLは省略（既存のものを使用） -->
</body>
</html>`;
    }
    
    // ユーティリティ関数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeForJavaScript(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    
    formatNumber(num) {
        return parseInt(num).toLocaleString('ja-JP');
    }
}