// Gmail SMTP メールサーバー
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 8001;

// CORS設定（ローカル開発用）
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:8001'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// Gmail SMTP設定
const gmailConfig = {
    service: 'gmail',
    auth: {
        user: 'aminati.ec@gmail.com',
        pass: 'vorm ocsn dqit graf'  // アプリパスワード
    }
};

// Nodemailerトランスポーター作成
const transporter = nodemailer.createTransport(gmailConfig);

// 接続テスト
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Gmail SMTP接続エラー:', error);
    } else {
        console.log('✅ Gmail SMTP接続成功');
    }
});

// 注文通知メール送信エンドポイント
app.post('/send-order-email', async (req, res) => {
    console.log('📧 注文メール送信リクエスト受信:', req.body);
    
    try {
        const orderData = req.body;
        
        // 必須フィールドの検証
        if (!orderData.orderId || !orderData.customer || !orderData.product) {
            return res.status(400).json({
                success: false,
                error: '必須データが不足しています'
            });
        }
        
        // 管理者メールアドレス（admin-settings.jsから取得されるべき値）
        const adminEmail = orderData.adminEmail || 'aminati.ec@gmail.com';
        const customerEmail = orderData.customer.email;
        
        // 送信するメールのリスト
        const emailsToSend = [];
        
        // 1. 管理者通知メール（必須）
        const adminMailOptions = {
            from: 'aminati.ec@gmail.com',
            to: adminEmail,
            subject: `[AMINATI_EC] 新規注文: ${orderData.orderId}`,
            html: generateAdminEmailHtml(orderData),
            text: generateAdminEmailText(orderData)
        };
        emailsToSend.push({ type: 'admin', options: adminMailOptions });
        
        // 2. 顧客確認メール（顧客メールアドレスがある場合のみ）
        if (customerEmail && customerEmail.trim() !== '') {
            const customerMailOptions = {
                from: 'aminati.ec@gmail.com',
                to: customerEmail,
                subject: `[AMINATI_EC] ご注文ありがとうございます - ${orderData.orderId}`,
                html: generateCustomerEmailHtml(orderData),
                text: generateCustomerEmailText(orderData)
            };
            emailsToSend.push({ type: 'customer', options: customerMailOptions });
        }
        
        // メール送信実行
        const results = [];
        for (const emailItem of emailsToSend) {
            try {
                const result = await transporter.sendMail(emailItem.options);
                console.log(`✅ ${emailItem.type}メール送信成功:`, result.messageId);
                results.push({
                    type: emailItem.type,
                    success: true,
                    messageId: result.messageId,
                    to: emailItem.options.to
                });
            } catch (error) {
                console.error(`❌ ${emailItem.type}メール送信失敗:`, error);
                results.push({
                    type: emailItem.type,
                    success: false,
                    error: error.message,
                    to: emailItem.options.to
                });
            }
        }
        
        // レスポンス作成
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        res.json({
            success: successCount > 0,
            message: `${successCount}/${totalCount}件のメール送信が完了しました`,
            results: results,
            orderData: {
                orderId: orderData.orderId,
                totalPrice: orderData.pricing?.totalPrice || 0
            }
        });
        
    } catch (error) {
        console.error('❌ メール送信処理エラー:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 管理者向けメール（HTML）
function generateAdminEmailHtml(orderData) {
    const orderDate = new Date(orderData.orderDate).toLocaleString('ja-JP');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; }
            .section h3 { margin-top: 0; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; color: #000; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AMINATI_EC 新規注文通知</h1>
            </div>
            
            <div class="content">
                <div class="section">
                    <h3>📋 注文情報</h3>
                    <div class="info-row">
                        <span class="label">注文番号:</span>
                        <span>${orderData.orderId}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">注文日時:</span>
                        <span>${orderDate}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🛍️ 商品情報</h3>
                    <div class="info-row">
                        <span class="label">商品番号:</span>
                        <span>${orderData.product.productNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">商品名:</span>
                        <span>${orderData.product.productName}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ブランド:</span>
                        <span>${orderData.product.brandName}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">カラー:</span>
                        <span>${orderData.product.selectedColor || '指定なし'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">サイズ:</span>
                        <span>${orderData.product.selectedSize || '指定なし'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>💰 金額詳細</h3>
                    <div class="info-row">
                        <span class="label">商品代金:</span>
                        <span>¥${orderData.pricing.productPrice.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">配送料:</span>
                        <span>¥${orderData.pricing.shippingFee.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">代引き手数料:</span>
                        <span>¥${orderData.pricing.codFee.toLocaleString()}</span>
                    </div>
                    <div class="info-row total">
                        <span class="label">合計金額:</span>
                        <span>¥${orderData.pricing.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>👤 お客様情報</h3>
                    <div class="info-row">
                        <span class="label">お名前:</span>
                        <span>${orderData.customer.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">フリガナ:</span>
                        <span>${orderData.customer.kana || ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">電話番号:</span>
                        <span>${orderData.customer.phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">メールアドレス:</span>
                        <span>${orderData.customer.email || '未入力'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">郵便番号:</span>
                        <span>${orderData.customer.zip}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">住所:</span>
                        <span>${orderData.customer.address}</span>
                    </div>
                </div>
                
                ${orderData.delivery ? `
                <div class="section">
                    <h3>🚚 配送希望</h3>
                    <div class="info-row">
                        <span class="label">希望配達日:</span>
                        <span>${orderData.delivery.date || '指定なし'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">希望時間:</span>
                        <span>${orderData.delivery.time || '指定なし'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ご要望:</span>
                        <span>${orderData.delivery.note || 'なし'}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </body>
    </html>
    `;
}

// 管理者向けメール（テキスト）
function generateAdminEmailText(orderData) {
    const orderDate = new Date(orderData.orderDate).toLocaleString('ja-JP');
    
    return `
AMINATI_EC 新規注文通知

【注文情報】
注文番号: ${orderData.orderId}
注文日時: ${orderDate}

【商品情報】
商品番号: ${orderData.product.productNumber}
商品名: ${orderData.product.productName}
ブランド: ${orderData.product.brandName}
カラー: ${orderData.product.selectedColor || '指定なし'}
サイズ: ${orderData.product.selectedSize || '指定なし'}

【金額詳細】
商品代金: ¥${orderData.pricing.productPrice.toLocaleString()}
配送料: ¥${orderData.pricing.shippingFee.toLocaleString()}
代引き手数料: ¥${orderData.pricing.codFee.toLocaleString()}
合計金額: ¥${orderData.pricing.totalPrice.toLocaleString()}

【お客様情報】
お名前: ${orderData.customer.name}
フリガナ: ${orderData.customer.kana || ''}
電話番号: ${orderData.customer.phone}
メールアドレス: ${orderData.customer.email || '未入力'}
郵便番号: ${orderData.customer.zip}
住所: ${orderData.customer.address}

${orderData.delivery ? `
【配送希望】
希望配達日: ${orderData.delivery.date || '指定なし'}
希望時間: ${orderData.delivery.time || '指定なし'}
ご要望: ${orderData.delivery.note || 'なし'}
` : ''}

管理画面で詳細を確認してください。
    `.trim();
}

// 顧客向けメール（HTML）
function generateCustomerEmailHtml(orderData) {
    const orderDate = new Date(orderData.orderDate).toLocaleString('ja-JP');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; }
            .section h3 { margin-top: 0; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; color: #000; }
            .note { background: #fffbf0; border: 1px solid #ffe0b0; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AMINATI_EC</h1>
                <p>ご注文ありがとうございます</p>
            </div>
            
            <div class="content">
                <p>${orderData.customer.name} 様</p>
                <p>この度は、AMINATI_ECをご利用いただき誠にありがとうございます。<br>
                ご注文を承りましたので、内容をご確認ください。</p>
                
                <div class="section">
                    <h3>📋 ご注文内容</h3>
                    <div class="info-row">
                        <span class="label">注文番号:</span>
                        <span>${orderData.orderId}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">注文日時:</span>
                        <span>${orderDate}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🛍️ 商品情報</h3>
                    <div class="info-row">
                        <span class="label">${orderData.product.productName}</span>
                        <span>¥${orderData.pricing.productPrice.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">カラー:</span>
                        <span>${orderData.product.selectedColor || '指定なし'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">サイズ:</span>
                        <span>${orderData.product.selectedSize || '指定なし'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>💰 お支払い金額</h3>
                    <div class="info-row">
                        <span class="label">商品代金:</span>
                        <span>¥${orderData.pricing.productPrice.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">配送料:</span>
                        <span>¥${orderData.pricing.shippingFee.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">代引き手数料:</span>
                        <span>¥${orderData.pricing.codFee.toLocaleString()}</span>
                    </div>
                    <div class="info-row total">
                        <span class="label">合計金額:</span>
                        <span>¥${orderData.pricing.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="note">
                    <h4>お支払いについて</h4>
                    <p>商品代金は<strong>代金引換</strong>でのお支払いとなります。<br>
                    商品到着時に配達員に現金でお支払いください。</p>
                </div>
                
                <div class="note">
                    <h4>配送について</h4>
                    <p>ご注文から3-5営業日でお届け予定です。<br>
                    配送に関してご質問がございましたら、お気軽にお問い合わせください。</p>
                </div>
                
                <p>ご不明な点がございましたら、以下までお問い合わせください。</p>
                <p><strong>AMINATI_EC</strong><br>
                Email: aminati.ec@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 顧客向けメール（テキスト）
function generateCustomerEmailText(orderData) {
    const orderDate = new Date(orderData.orderDate).toLocaleString('ja-JP');
    
    return `
AMINATI_EC ご注文確認

${orderData.customer.name} 様

この度は、AMINATI_ECをご利用いただき誠にありがとうございます。
ご注文を承りましたので、内容をご確認ください。

【ご注文内容】
注文番号: ${orderData.orderId}
注文日時: ${orderDate}

【商品情報】
${orderData.product.productName} - ¥${orderData.pricing.productPrice.toLocaleString()}
カラー: ${orderData.product.selectedColor || '指定なし'}
サイズ: ${orderData.product.selectedSize || '指定なし'}

【お支払い金額】
商品代金: ¥${orderData.pricing.productPrice.toLocaleString()}
配送料: ¥${orderData.pricing.shippingFee.toLocaleString()}
代引き手数料: ¥${orderData.pricing.codFee.toLocaleString()}
合計金額: ¥${orderData.pricing.totalPrice.toLocaleString()}

【お支払いについて】
商品代金は代金引換でのお支払いとなります。
商品到着時に配達員に現金でお支払いください。

【配送について】
ご注文から3-5営業日でお届け予定です。
配送に関してご質問がございましたら、お気軽にお問い合わせください。

ご不明な点がございましたら、以下までお問い合わせください。

AMINATI_EC
Email: aminati.ec@gmail.com
    `.trim();
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AMINATI_EC Email Server',
        timestamp: new Date().toISOString()
    });
});

// テストメール送信エンドポイント
app.post('/test-email', async (req, res) => {
    try {
        const testMailOptions = {
            from: 'aminati.ec@gmail.com',
            to: 'aminati.ec@gmail.com',
            subject: '[TEST] Gmail SMTP 接続テスト',
            text: 'Gmail SMTP接続テストメールです。このメールが届けばセットアップは正常です。',
            html: '<h2>Gmail SMTP接続テスト</h2><p>このメールが届けばセットアップは正常です。</p>'
        };
        
        const result = await transporter.sendMail(testMailOptions);
        console.log('✅ テストメール送信成功:', result.messageId);
        
        res.json({
            success: true,
            message: 'テストメール送信成功',
            messageId: result.messageId
        });
        
    } catch (error) {
        console.error('❌ テストメール送信失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('📧 AMINATI_EC Gmail メールサーバー');
    console.log('='.repeat(50));
    console.log(`✅ サーバー起動: http://localhost:${PORT}`);
    console.log(`📧 Gmail: aminati.ec@gmail.com`);
    console.log(`🔗 エンドポイント:`);
    console.log(`  POST /send-order-email - 注文メール送信`);
    console.log(`  GET  /health          - ヘルスチェック`);
    console.log(`  POST /test-email      - テストメール送信`);
    console.log('='.repeat(50));
});