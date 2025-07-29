// 管理設定クラス
class AdminSettings {
    constructor() {
        this.storageKey = 'aminatiAdminSettings';
        this.settings = this.loadSettings();
    }
    
    // 設定の読み込み
    loadSettings() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        
        // デフォルト設定
        return {
            // API設定
            geminiApiKey: '',
            
            // 会社情報
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
            
            // 取引条件
            paymentMethod: '代金引換のみ',
            minimumOrder: '1点から可能',
            deliveryTime: 'ご注文から3-5営業日',
            shippingFee: '全国一律送料無料',
            returnPolicy: '商品到着後7日以内',
            
            // その他
            updated: new Date().toISOString()
        };
    }
    
    // 設定の保存
    saveSettings() {
        this.settings.updated = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    }
    
    // 設定UIの表示
    showSettingsDialog() {
        const dialogHtml = `
            <div class="admin-dialog" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 1000; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h2 style="margin-bottom: 20px;">管理設定</h2>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">API設定</h3>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px;">Gemini API Key</label>
                        <input type="password" id="admin_geminiApiKey" value="${this.settings.geminiApiKey}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">会社情報</h3>
                    <div style="display: grid; gap: 10px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">会社名（表示用）</label>
                            <input type="text" id="admin_companyName" value="${this.settings.companyName}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">会社名（正式）</label>
                            <input type="text" id="admin_companyFullName" value="${this.settings.companyFullName}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">代表者</label>
                            <input type="text" id="admin_ceo" value="${this.settings.ceo}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">住所</label>
                            <input type="text" id="admin_address" value="${this.settings.address}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">TEL</label>
                            <input type="text" id="admin_tel" value="${this.settings.tel}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">FAX</label>
                            <input type="text" id="admin_fax" value="${this.settings.fax}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">メールアドレス</label>
                            <input type="email" id="admin_email" value="${this.settings.email}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">営業時間</label>
                            <input type="text" id="admin_businessHours" value="${this.settings.businessHours}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">設立</label>
                            <input type="text" id="admin_established" value="${this.settings.established}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">資本金</label>
                            <input type="text" id="admin_capital" value="${this.settings.capital}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">事業内容</label>
                            <textarea id="admin_business" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${this.settings.business}</textarea>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">取引条件</h3>
                    <div style="display: grid; gap: 10px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">支払方法</label>
                            <input type="text" id="admin_paymentMethod" value="${this.settings.paymentMethod}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">最小注文数</label>
                            <input type="text" id="admin_minimumOrder" value="${this.settings.minimumOrder}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">納期</label>
                            <input type="text" id="admin_deliveryTime" value="${this.settings.deliveryTime}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">送料</label>
                            <input type="text" id="admin_shippingFee" value="${this.settings.shippingFee}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 14px;">返品条件</label>
                            <input type="text" id="admin_returnPolicy" value="${this.settings.returnPolicy}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="adminSettings.closeDialog()">
                        キャンセル
                    </button>
                    <button class="btn btn-primary" onclick="adminSettings.saveAndClose()">
                        保存
                    </button>
                </div>
            </div>
            <div class="admin-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;" onclick="adminSettings.closeDialog()"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    }
    
    // ダイアログを閉じる
    closeDialog() {
        document.querySelector('.admin-dialog')?.remove();
        document.querySelector('.admin-overlay')?.remove();
    }
    
    // 保存して閉じる
    saveAndClose() {
        // 各フィールドの値を取得
        const fields = [
            'geminiApiKey', 'companyName', 'companyFullName', 'ceo', 
            'address', 'tel', 'fax', 'email', 'businessHours', 
            'established', 'capital', 'business',
            'paymentMethod', 'minimumOrder', 'deliveryTime', 
            'shippingFee', 'returnPolicy'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(`admin_${field}`);
            if (element) {
                this.settings[field] = element.value;
            }
        });
        
        // 保存
        this.saveSettings();
        
        // Gemini API Keyを自動的に反映
        const geminiInput = document.getElementById('geminiApiKey');
        if (geminiInput && this.settings.geminiApiKey) {
            geminiInput.value = this.settings.geminiApiKey;
        }
        
        // ダイアログを閉じる
        this.closeDialog();
        
        // 成功メッセージ
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('設定を保存しました');
        } else {
            alert('設定を保存しました');
        }
    }
    
    // 設定値の取得
    get(key) {
        return this.settings[key] || '';
    }
    
    // 固定ページの生成
    generateStaticPages() {
        return {
            trade: this.generateTradePage(),
            company: this.generateCompanyPage(),
            contact: this.generateContactPage()
        };
    }
    
    // お取引についてページの生成
    generateTradePage() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お取引について - ${this.settings.companyName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            line-height: 1.6;
        }
        header {
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -2px;
            text-decoration: none;
            color: #000000;
        }
        .nav-link {
            text-decoration: none;
            color: #666666;
            font-size: 14px;
        }
        main {
            max-width: 800px;
            margin: 60px auto;
            padding: 0 20px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 40px;
            text-align: center;
        }
        .section {
            margin-bottom: 40px;
            background: #f8f8f8;
            padding: 30px;
            border-radius: 12px;
        }
        h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #333333;
        }
        .info-grid {
            display: grid;
            gap: 20px;
        }
        .info-item {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 20px;
            padding: 15px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #666666;
        }
        .info-value {
            color: #000000;
        }
        .back-button {
            display: inline-block;
            margin-top: 40px;
            padding: 12px 30px;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .back-button:hover {
            background: #333333;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <a href="index.html" class="logo">${this.settings.companyName}</a>
            <a href="index.html" class="nav-link">← トップに戻る</a>
        </div>
    </header>
    
    <main>
        <h1>お取引について</h1>
        
        <div class="section">
            <h2>取引条件</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">お支払い方法</div>
                    <div class="info-value">${this.settings.paymentMethod}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">最小注文数</div>
                    <div class="info-value">${this.settings.minimumOrder}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">納期</div>
                    <div class="info-value">${this.settings.deliveryTime}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">送料</div>
                    <div class="info-value">${this.settings.shippingFee}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">返品・交換</div>
                    <div class="info-value">${this.settings.returnPolicy}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>ご注文方法</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">STEP 1</div>
                    <div class="info-value">商品ページから「注文する」ボタンをクリック</div>
                </div>
                <div class="info-item">
                    <div class="info-label">STEP 2</div>
                    <div class="info-value">メールソフトが起動し、注文内容が自動入力されます</div>
                </div>
                <div class="info-item">
                    <div class="info-label">STEP 3</div>
                    <div class="info-value">お客様情報（お名前・ご住所・電話番号）をご記入ください</div>
                </div>
                <div class="info-item">
                    <div class="info-label">STEP 4</div>
                    <div class="info-value">送信後、確認メールをお送りします</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>お問い合わせ</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">メール</div>
                    <div class="info-value">${this.settings.email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">TEL</div>
                    <div class="info-value">${this.settings.tel}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">営業時間</div>
                    <div class="info-value">${this.settings.businessHours}</div>
                </div>
            </div>
        </div>
        
        <a href="index.html" class="back-button">トップページに戻る</a>
    </main>
</body>
</html>`;
    }
    
    // 会社概要ページの生成
    generateCompanyPage() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>会社概要 - ${this.settings.companyName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            line-height: 1.6;
        }
        header {
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -2px;
            text-decoration: none;
            color: #000000;
        }
        .nav-link {
            text-decoration: none;
            color: #666666;
            font-size: 14px;
        }
        main {
            max-width: 800px;
            margin: 60px auto;
            padding: 0 20px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 40px;
            text-align: center;
        }
        .company-table {
            width: 100%;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 20px rgba(0,0,0,0.05);
        }
        .company-table tr {
            border-bottom: 1px solid #f0f0f0;
        }
        .company-table tr:last-child {
            border-bottom: none;
        }
        .company-table th {
            background: #f8f8f8;
            padding: 20px;
            text-align: left;
            font-weight: 600;
            color: #666666;
            width: 30%;
        }
        .company-table td {
            padding: 20px;
            color: #000000;
        }
        .back-button {
            display: inline-block;
            margin-top: 40px;
            padding: 12px 30px;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .back-button:hover {
            background: #333333;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <a href="index.html" class="logo">${this.settings.companyName}</a>
            <a href="index.html" class="nav-link">← トップに戻る</a>
        </div>
    </header>
    
    <main>
        <h1>会社概要</h1>
        
        <table class="company-table">
            <tr>
                <th>会社名</th>
                <td>${this.settings.companyFullName}</td>
            </tr>
            <tr>
                <th>代表者</th>
                <td>${this.settings.ceo}</td>
            </tr>
            <tr>
                <th>設立</th>
                <td>${this.settings.established}</td>
            </tr>
            <tr>
                <th>資本金</th>
                <td>${this.settings.capital}</td>
            </tr>
            <tr>
                <th>事業内容</th>
                <td>${this.settings.business}</td>
            </tr>
            <tr>
                <th>所在地</th>
                <td>${this.settings.address}</td>
            </tr>
            <tr>
                <th>TEL</th>
                <td>${this.settings.tel}</td>
            </tr>
            <tr>
                <th>FAX</th>
                <td>${this.settings.fax}</td>
            </tr>
            <tr>
                <th>E-mail</th>
                <td>${this.settings.email}</td>
            </tr>
            <tr>
                <th>営業時間</th>
                <td>${this.settings.businessHours}</td>
            </tr>
        </table>
        
        <a href="index.html" class="back-button">トップページに戻る</a>
    </main>
</body>
</html>`;
    }
    
    // お問い合わせページの生成
    generateContactPage() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お問い合わせ - ${this.settings.companyName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            line-height: 1.6;
        }
        header {
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -2px;
            text-decoration: none;
            color: #000000;
        }
        .nav-link {
            text-decoration: none;
            color: #666666;
            font-size: 14px;
        }
        main {
            max-width: 600px;
            margin: 60px auto;
            padding: 0 20px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
            text-align: center;
        }
        .subtitle {
            text-align: center;
            color: #666666;
            margin-bottom: 40px;
        }
        .contact-info {
            background: #f8f8f8;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 40px;
        }
        .contact-item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        .contact-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .contact-label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #333333;
        }
        .contact-value {
            font-size: 18px;
            color: #000000;
        }
        .contact-button {
            display: block;
            width: 100%;
            padding: 15px;
            background: #000000;
            color: #ffffff;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        }
        .contact-button:hover {
            background: #333333;
        }
        .note {
            background: #fffbf0;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ffe0b0;
            margin-bottom: 40px;
        }
        .note-title {
            font-weight: 600;
            margin-bottom: 10px;
        }
        .back-button {
            display: inline-block;
            padding: 12px 30px;
            background: #ffffff;
            color: #000000;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid #000000;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .back-button:hover {
            background: #000000;
            color: #ffffff;
        }
    </style>
    <script>
        function sendEmail() {
            const subject = encodeURIComponent('お問い合わせ');
            const body = encodeURIComponent(\`お問い合わせ内容をご記入ください。

【お名前】


【会社名】


【お問い合わせ内容】


【ご連絡先】
TEL: 
Email: \`);
            
            window.location.href = \`mailto:${this.settings.email}?subject=\${subject}&body=\${body}\`;
        }
    </script>
</head>
<body>
    <header>
        <div class="header-content">
            <a href="index.html" class="logo">${this.settings.companyName}</a>
            <a href="index.html" class="nav-link">← トップに戻る</a>
        </div>
    </header>
    
    <main>
        <h1>お問い合わせ</h1>
        <p class="subtitle">お気軽にお問い合わせください</p>
        
        <div class="contact-info">
            <div class="contact-item">
                <div class="contact-label">メールアドレス</div>
                <div class="contact-value">${this.settings.email}</div>
            </div>
            <div class="contact-item">
                <div class="contact-label">電話番号</div>
                <div class="contact-value">${this.settings.tel}</div>
            </div>
            <div class="contact-item">
                <div class="contact-label">FAX</div>
                <div class="contact-value">${this.settings.fax}</div>
            </div>
            <div class="contact-item">
                <div class="contact-label">営業時間</div>
                <div class="contact-value">${this.settings.businessHours}</div>
            </div>
        </div>
        
        <a href="javascript:void(0);" onclick="sendEmail()" class="contact-button">
            メールでお問い合わせ
        </a>
        
        <div class="note">
            <div class="note-title">ご注意</div>
            <ul style="margin-left: 20px;">
                <li>お問い合わせへの返信は営業時間内に行います</li>
                <li>商品のご注文は各商品ページからお願いします</li>
                <li>お急ぎの場合はお電話でお問い合わせください</li>
            </ul>
        </div>
        
        <a href="index.html" class="back-button">トップページに戻る</a>
    </main>
</body>
</html>`;
    }
}

// グローバルに公開
window.adminSettings = new AdminSettings();