// 商品ページ生成クラス（外部CSS対応版 - admin-settings.js インライン化対応版）
class ProductGenerator {
    constructor(app) {
        this.app = app;
        this.apiClient = new GeminiAPIClient();
        this.storage = new ProductStorage();
        this.r2Uploader = new R2UploaderSimple();
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
                this.showPostGenerationOptions(generatedProducts);
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
            const html = this.generateHTML(product, description, images);
            
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
    
    // 外部CSS対応版 generateHTML メソッド
    generateHTML(product, description, images) {
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
    
    // AdminSettings.js のコードをインライン化
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
        
        // メニュー項目の処理（絶対パスを使用 - GitHub Pages対応）
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
    
    formatNumber(num) {
        return parseInt(num).toLocaleString('ja-JP');
    }
    
    getPurchaseFlowScript() {
        return `
        // EmailNotificationService（購入者優先・管理者デフォルト版）
        class EmailNotificationService {
            constructor() {
                this.apiUrl = 'https://ec-image-uploader.archiver0922.workers.dev/send-order-email';
            }
            
            async sendOrderNotification(orderData) {
                try {
                    console.log('📧 メール送信開始...', orderData);
                    
                    // 管理者メールアドレスを取得
                    let adminEmail = this.getAdminEmail();
                    
                    // 管理者メールアドレスが取得できない場合はスキップ
                    if (!adminEmail) {
                        console.warn('⚠️ 管理者メールアドレスが設定されていないため、管理者通知をスキップします');
                        this.showEmailPartialSuccess(orderData);
                        return { success: true, adminSkipped: true };
                    }
                    
                    // APIに送信するデータ形式に変換
                    const emailData = this.formatEmailData(orderData, adminEmail);
                    
                    console.log('🌐 API呼び出し先:', this.apiUrl);
                    console.log('📝 送信データ:', emailData);
                    
                    // CloudflareWorkers APIを呼び出し（POST確実対応）
                    const response = await fetch(this.apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(emailData)
                    });
                    
                    console.log('📊 レスポンス状態:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ APIエラーレスポンス:', errorText);
                        throw new Error(\`HTTP \${response.status}: \${errorText}\`);
                    }
                    
                    const result = await response.json();
                    console.log('✅ メール送信成功:', result);
                    
                    this.showEmailSuccess(orderData, adminEmail);
                    return { success: true, result };
                    
                } catch (error) {
                    console.error('❌ メール送信エラー:', error);
                    this.showEmailFallback(orderData);
                    return { success: false, error: error.message };
                }
            }
            
            // 管理者メールアドレスを取得
            getAdminEmail() {
                if (window.adminSettings && typeof window.adminSettings.get === 'function') {
                    try {
                        const email = window.adminSettings.get('email');
                        if (email && email.trim() !== '') {
                            console.log('✅ AdminSettings読み込み成功: ' + email);
                            return email;
                        }
                    } catch (e) {
                        console.warn('⚠️ AdminSettings.get()エラー:', e);
                    }
                }
                
                console.warn('⚠️ 管理者メールアドレスが未設定です');
                return null;
            }
            
            formatEmailData(orderData, adminEmail) {
                return {
                    customerEmail: orderData.customer.email || '',
                    adminEmail: adminEmail,
                    orderId: orderData.orderId,
                    customerName: orderData.customer.name,
                    items: [
                        {
                            name: orderData.product.productName,
                            brand: orderData.product.brandName || 'AMINATI COLLECTION',
                            color: orderData.product.selectedColor || '',
                            size: orderData.product.selectedSize || '',
                            price: orderData.pricing.productPrice,
                            quantity: 1
                        }
                    ],
                    total: orderData.pricing.totalPrice,
                    pricing: {
                        productPrice: orderData.pricing.productPrice,
                        shippingFee: orderData.pricing.shippingFee,
                        codFee: orderData.pricing.codFee,
                        totalPrice: orderData.pricing.totalPrice
                    },
                    customer: {
                        name: orderData.customer.name,
                        kana: orderData.customer.kana || '',
                        phone: orderData.customer.phone,
                        email: orderData.customer.email || '',
                        zip: orderData.customer.zip,
                        address: orderData.customer.address
                    },
                    delivery: {
                        date: orderData.delivery.date || '',
                        time: orderData.delivery.time || '',
                        note: orderData.delivery.note || ''
                    }
                };
            }
            
            showEmailSuccess(orderData, adminEmail) {
                const successHtml = \`
                    <div class="modal-overlay" id="emailSuccessModal">
                        <div class="modal-content">
                            <div class="success-icon">✅</div>
                            <h2>メール送信完了</h2>
                            
                            <div class="success-content">
                                <p><strong>以下にメールを送信しました：</strong></p>
                                <div class="email-sent-list">
                                    \${orderData.customer.email ? \`
                                    <div class="email-sent-item">
                                        <span class="email-icon">📧</span>
                                        <span>お客様: \${orderData.customer.email}</span>
                                    </div>
                                    \` : ''}
                                    <div class="email-sent-item">
                                        <span class="email-icon">✅</span>
                                        <span>店舗: \${adminEmail}</span>
                                    </div>
                                </div>
                                
                                <div class="success-note">
                                    <p>📨 注文詳細は自動的にメールで送信されました</p>
                                    <p>🔔 店舗に新規注文の通知が届きます</p>
                                </div>
                            </div>
                            
                            <div class="modal-buttons">
                                <button class="btn-primary" onclick="emailNotificationService.closeEmailSuccess()">確認</button>
                            </div>
                        </div>
                    </div>
                    
                    <style>
                    .success-icon {
                        width: 60px;
                        height: 60px;
                        background: #28a745;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        margin: 0 auto 20px;
                    }
                    .success-content {
                        text-align: center;
                        margin: 20px 0;
                    }
                    .email-sent-list {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                    }
                    .email-sent-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }
                    .email-icon {
                        font-size: 16px;
                    }
                    .success-note {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 15px 0;
                    }
                    .success-note p {
                        margin-bottom: 8px;
                        font-size: 14px;
                        line-height: 1.4;
                    }
                    .modal-buttons {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .btn-primary {
                        padding: 12px 20px;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        background: #000;
                        color: white;
                    }
                    .btn-primary:hover {
                        background: #333;
                    }
                    </style>
                \`;
                
                document.body.insertAdjacentHTML('beforeend', successHtml);
            }
            
            showEmailPartialSuccess(orderData) {
                const successHtml = \`
                    <div class="modal-overlay" id="emailSuccessModal">
                        <div class="modal-content">
                            <div class="success-icon">⚠️</div>
                            <h2>注文完了</h2>
                            
                            <div class="success-content">
                                <p><strong>ご注文を承りました</strong></p>
                                <div class="warning-note">
                                    <p>⚠️ 管理者メールアドレスが設定されていないため、店舗への自動通知は送信されませんでした</p>
                                    <p>📞 お急ぎの場合は直接お電話でご連絡ください</p>
                                </div>
                            </div>
                            
                            <div class="modal-buttons">
                                <button class="btn-primary" onclick="emailNotificationService.closeEmailSuccess()">確認</button>
                            </div>
                        </div>
                    </div>
                    
                    <style>
                    .success-icon {
                        width: 60px;
                        height: 60px;
                        background: #ffc107;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        margin: 0 auto 20px;
                    }
                    .warning-note {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 15px 0;
                    }
                    .warning-note p {
                        margin-bottom: 8px;
                        font-size: 14px;
                        line-height: 1.4;
                        color: #856404;
                    }
                    .success-content {
                        text-align: center;
                        margin: 20px 0;
                    }
                    .modal-buttons {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .btn-primary {
                        padding: 12px 20px;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        background: #000;
                        color: white;
                    }
                    .btn-primary:hover {
                        background: #333;
                    }
                    </style>
                \`;
                
                document.body.insertAdjacentHTML('beforeend', successHtml);
            }
            
            showEmailFallback(orderData) {
                alert('⚠️ 自動メール送信に失敗しました\\n\\n管理画面で注文を確認してください。\\n注文データは正常に保存されています。');
            }
            
            closeEmailSuccess() {
                const modal = document.getElementById('emailSuccessModal');
                if (modal) modal.remove();
            }
        }
        
        // グローバルインスタンス作成
        const emailNotificationService = new EmailNotificationService();
        
        // 既存のコードとの互換性を保つためのラッパー関数
        function sendOrderNotification(orderData) {
            return emailNotificationService.sendOrderNotification(orderData);
        }
        
        // 購入フロー開始
        function startPurchaseFlow() {
            const selectedColor = document.querySelector('.color-option.active')?.dataset.value || '';
            const selectedSize = document.querySelector('.size-option.active')?.dataset.value || '';
            
            const purchaseData = {
                ...currentProduct,
                selectedColor: selectedColor,
                selectedSize: selectedSize,
                timestamp: new Date().toISOString()
            };
            
            sessionStorage.setItem('purchaseData', JSON.stringify(purchaseData));
            showEstimateModal(purchaseData);
        }
        
        // 概算確認モーダル
        function showEstimateModal(purchaseData) {
            const shippingFee = 500;
            const codFee = 330;
            const totalPrice = purchaseData.price + shippingFee + codFee;
            
            const modalHtml = \`
                <div class="modal-overlay" id="estimateModal">
                    <div class="modal-content">
                        <h2>ご注文内容の確認</h2>
                        
                        <div class="order-summary">
                            <div class="product-info">
                                <h3>\${purchaseData.productName}</h3>
                                <p>ブランド: \${purchaseData.brandName}</p>
                                <p>カラー: \${purchaseData.selectedColor}</p>
                                <p>サイズ: \${purchaseData.selectedSize}</p>
                            </div>
                            
                            <div class="price-breakdown">
                                <div class="price-item">
                                    <span>商品代金</span>
                                    <span>¥\${formatNumber(purchaseData.price)}</span>
                                </div>
                                <div class="price-item">
                                    <span>配送料</span>
                                    <span>¥\${formatNumber(shippingFee)}</span>
                                </div>
                                <div class="price-item">
                                    <span>代引き手数料</span>
                                    <span>¥\${formatNumber(codFee)}</span>
                                </div>
                                <div class="price-total">
                                    <span>合計金額</span>
                                    <span>¥\${formatNumber(totalPrice)}</span>
                                </div>
                            </div>
                            
                            <div class="payment-info">
                                <p><strong>お支払い方法:</strong> 代金引換（現金のみ）</p>
                                <p><small>※商品到着時に配達員にお支払いください</small></p>
                            </div>
                        </div>
                        
                        <div class="modal-buttons">
                            <button class="btn-secondary" onclick="closeEstimateModal()">戻る</button>
                            <button class="btn-primary" onclick="proceedToShipping()">この内容で注文する</button>
                        </div>
                    </div>
                </div>
                
                <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 400px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .modal-content h2 {
                    font-size: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .order-summary {
                    margin-bottom: 25px;
                }
                .product-info {
                    padding: 15px;
                    background: #f8f8f8;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .product-info h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                }
                .product-info p {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                .price-breakdown {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                .price-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                .price-total {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 16px;
                    padding-top: 10px;
                    border-top: 1px solid #e0e0e0;
                    margin-top: 10px;
                }
                .payment-info {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #ffeaa7;
                }
                .payment-info p {
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                .modal-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 20px;
                }
                .btn-primary, .btn-secondary {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-primary {
                    background: #000;
                    color: white;
                }
                .btn-secondary {
                    background: #f5f5f5;
                    color: #333;
                }
                .btn-primary:hover {
                    background: #333;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const estimateData = {
                ...purchaseData,
                shippingFee: shippingFee,
                codFee: codFee,
                totalPrice: totalPrice
            };
            sessionStorage.setItem('estimateData', JSON.stringify(estimateData));
        }
        
        function closeEstimateModal() {
            const modal = document.getElementById('estimateModal');
            if (modal) modal.remove();
        }
        
        function proceedToShipping() {
            closeEstimateModal();
            showShippingForm();
        }
        
        // 配送先入力フォーム
        function showShippingForm() {
            const modalHtml = \`
                <div class="modal-overlay" id="shippingModal">
                    <div class="modal-content shipping-form">
                        <h2>配送先情報の入力</h2>
                        
                        <form id="shippingForm">
                            <div class="form-group">
                                <label for="customerName">お名前 <span class="required">*</span></label>
                                <input type="text" id="customerName" name="customerName" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerKana">お名前（フリガナ） <span class="required">*</span></label>
                                <input type="text" id="customerKana" name="customerKana" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerPhone">電話番号 <span class="required">*</span></label>
                                <input type="tel" id="customerPhone" name="customerPhone" required placeholder="例: 090-1234-5678">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerEmail">メールアドレス</label>
                                <input type="email" id="customerEmail" name="customerEmail" placeholder="例: example@email.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerZip">郵便番号 <span class="required">*</span></label>
                                <input type="text" id="customerZip" name="customerZip" required placeholder="例: 123-4567">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerAddress">住所 <span class="required">*</span></label>
                                <textarea id="customerAddress" name="customerAddress" required placeholder="都道府県市区町村番地"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="deliveryDate">希望配達日</label>
                                <input type="date" id="deliveryDate" name="deliveryDate">
                                <small>※最短5日後から指定可能</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="deliveryTime">希望配達時間</label>
                                <select id="deliveryTime" name="deliveryTime">
                                    <option value="">指定なし</option>
                                    <option value="午前中">午前中</option>
                                    <option value="12-14">12:00-14:00</option>
                                    <option value="14-16">14:00-16:00</option>
                                    <option value="16-18">16:00-18:00</option>
                                    <option value="18-20">18:00-20:00</option>
                                    <option value="19-21">19:00-21:00</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="orderNote">ご要望・備考</label>
                                <textarea id="orderNote" name="orderNote" placeholder="その他ご要望がございましたらご記入ください"></textarea>
                            </div>
                        </form>
                        
                        <div class="modal-buttons">
                            <button class="btn-secondary" onclick="closeShippingModal()">戻る</button>
                            <button class="btn-primary" onclick="submitOrder()">注文を確定する</button>
                        </div>
                    </div>
                </div>
                
                <style>
                .shipping-form {
                    max-width: 500px;
                    max-height: 90vh;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .required {
                    color: #ff0000;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 12px;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const today = new Date();
            const minDate = new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000));
            document.getElementById('deliveryDate').min = minDate.toISOString().split('T')[0];
        }
        
        function closeShippingModal() {
            const modal = document.getElementById('shippingModal');
            if (modal) modal.remove();
        }
        
        function submitOrder() {
            const form = document.getElementById('shippingForm');
            const formData = new FormData(form);
            
            const requiredFields = ['customerName', 'customerKana', 'customerPhone', 'customerZip', 'customerAddress'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    isValid = false;
                    document.getElementById(field).style.borderColor = '#ff0000';
                } else {
                    document.getElementById(field).style.borderColor = '#ddd';
                }
            });
            
            if (!isValid) {
                alert('必須項目をすべて入力してください。');
                return;
            }
            
            const estimateData = JSON.parse(sessionStorage.getItem('estimateData'));
            const orderData = {
                orderId: 'ORD-' + Date.now(),
                orderDate: new Date().toISOString(),
                product: {
                    productNumber: estimateData.productNumber,
                    productName: estimateData.productName,
                    brandName: estimateData.brandName,
                    selectedColor: estimateData.selectedColor,
                    selectedSize: estimateData.selectedSize,
                    price: estimateData.price,
                    thumbnail: estimateData.thumbnail
                },
                pricing: {
                    productPrice: estimateData.price,
                    shippingFee: estimateData.shippingFee,
                    codFee: estimateData.codFee,
                    totalPrice: estimateData.totalPrice
                },
                customer: {
                    name: formData.get('customerName'),
                    kana: formData.get('customerKana'),
                    phone: formData.get('customerPhone'),
                    email: formData.get('customerEmail') || '',
                    zip: formData.get('customerZip'),
                    address: formData.get('customerAddress')
                },
                delivery: {
                    date: formData.get('deliveryDate') || '',
                    time: formData.get('deliveryTime') || '',
                    note: formData.get('orderNote') || ''
                },
                status: 'pending'
            };
            
            saveOrder(orderData);
        }
        
        function saveOrder(orderData) {
            // GitHub Pages版：IndexedDBは使用せず、メール通知のみ
            console.log('注文データ:', orderData);
            
            // メール通知送信
            sendOrderNotification(orderData);
            
            // 注文完了画面を表示
            showOrderComplete(orderData);
            sessionStorage.removeItem('purchaseData');
            sessionStorage.removeItem('estimateData');
            
            // 注：実際の注文データはメールで管理者に送信されます
            // より高度な注文管理が必要な場合は、バックエンドサーバーの実装が必要です
        }
        
        function showOrderComplete(orderData) {
            closeShippingModal();
            
            const completeHtml = \`
                <div class="modal-overlay" id="completeModal">
                    <div class="modal-content">
                        <div class="success-icon">✓</div>
                        <h2>ご注文ありがとうございました</h2>
                        
                        <div class="order-info">
                            <p><strong>注文番号：</strong>\${orderData.orderId}</p>
                            <p><strong>お支払い金額：</strong>¥\${formatNumber(orderData.pricing.totalPrice)}</p>
                        </div>
                        
                        <div class="complete-message">
                            <p>ご注文内容の確認メールをお送りしました。</p>
                            <p>商品は\${orderData.delivery.date ? '指定された日時' : '3-5営業日以内'}にお届けいたします。</p>
                            <p>お支払いは商品到着時に配達員にお支払いください。</p>
                        </div>
                        
                        <button class="btn-primary" onclick="closeCompleteModal()">トップページに戻る</button>
                    </div>
                </div>
                
                <style>
                .success-icon {
                    width: 60px;
                    height: 60px;
                    background: #28a745;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    margin: 0 auto 20px;
                }
                .order-info {
                    background: #f8f8f8;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .order-info p {
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                .complete-message {
                    margin-bottom: 25px;
                }
                .complete-message p {
                    margin-bottom: 10px;
                    font-size: 14px;
                    color: #666;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', completeHtml);
        }
        
        function closeCompleteModal() {
            const modal = document.getElementById('completeModal');
            if (modal) modal.remove();
            window.location.href = 'https://aminati-ec.github.io/';
        }`;
    }
    
    showPostGenerationOptions(generatedProducts) {
        const postGenerationHtml = `
            <div class="post-generation-options">
                <h3>次のステップ</h3>
                <p>商品ページの生成が完了しました。以下のオプションから選択してください：</p>
                
                <div class="option-buttons">
                    <button onclick="window.indexGenerator.generateIndexPage()" class="btn-option">
                        <span class="option-icon">🏠</span>
                        <span class="option-text">
                            <strong>トップページを生成</strong>
                            <small>index.htmlを作成・更新します</small>
                        </span>
                    </button>
                    
                    <button onclick="window.gitHubUploader.showUploadModal()" class="btn-option">
                        <span class="option-icon">📤</span>
                        <span class="option-text">
                            <strong>GitHubにアップロード</strong>
                            <small>生成したファイルを公開します</small>
                        </span>
                    </button>
                    
                    <button onclick="window.zipDownloader.downloadAll()" class="btn-option">
                        <span class="option-icon">📦</span>
                        <span class="option-text">
                            <strong>ZIPでダウンロード</strong>
                            <small>全ファイルをローカルに保存</small>
                        </span>
                    </button>
                </div>
            </div>
            
            <style>
            .post-generation-options {
                margin-top: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .post-generation-options h3 {
                margin-bottom: 10px;
                font-size: 18px;
            }
            .post-generation-options p {
                margin-bottom: 20px;
                color: #666;
            }
            .option-buttons {
                display: grid;
                gap: 15px;
            }
            .btn-option {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 20px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
            }
            .btn-option:hover {
                border-color: #333;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .option-icon {
                font-size: 24px;
            }
            .option-text strong {
                display: block;
                font-size: 16px;
                margin-bottom: 4px;
            }
            .option-text small {
                color: #666;
                font-size: 13px;
            }
            </style>`;
        
        const container = document.getElementById('generationResults');
        if (container) {
            container.innerHTML = postGenerationHtml;
        } else {
            const newContainer = document.createElement('div');
            newContainer.id = 'generationResults';
            newContainer.innerHTML = postGenerationHtml;
            document.querySelector('.section-content').appendChild(newContainer);
        }
    }
}