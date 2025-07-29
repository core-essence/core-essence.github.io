// 📧 Email Notification Module (Google Apps Script版)
// GAS連携用に最適化 - 最終版

class EmailNotificationService {
    constructor() {
        // GAS のURL（唯一必要なURL）
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbw8XWKX56Kioxp0xJH2Vc5qiWDv-Y-XlIQzQ5LkJCbDoEEoIwx_-92gHFjj3MHFnQvO/exec';
    }
    
    // 注文完了メール送信（GAS版）
    async sendOrderNotification(orderData) {
        try {
            console.log('📧 メール送信開始...', orderData);
            
            // Admin設定からメールアドレスを取得
            let adminEmail = this.getAdminEmail();
            
            // 管理者メールアドレスが取得できない場合はデフォルトを使用
            if (!adminEmail) {
                console.warn('⚠️ 管理者メールアドレスが設定されていないため、デフォルトアドレスを使用します');
                adminEmail = 'aminati.ec@gmail.com';
            }
            
            // APIに送信するデータ形式に変換
            const emailData = this.formatEmailData(orderData, adminEmail);
            
            console.log('🌐 GAS呼び出し:', this.apiUrl);
            console.log('📝 送信データ:', emailData);
            
            // Google Apps Script を呼び出し
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                mode: 'no-cors', // CORS回避
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            // no-corsモードではresponseの中身が見えないため、成功と仮定
            console.log('✅ GAS呼び出し完了（no-corsモード）');
            
            // シンプルな成功通知
            alert('メール送信リクエストを送信しました！');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ メール送信エラー:', error);
            alert('メール送信中にエラーが発生しました: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    // 管理者メールアドレス取得
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
        
        console.warn('⚠️ 管理者メールアドレスが未設定、デフォルトを使用');
        return null;
    }
    
    // メールデータのフォーマット（GAS用）
    formatEmailData(orderData, adminEmail) {
        return {
            orderId: orderData.orderId,
            orderDate: orderData.orderDate,
            adminEmail: adminEmail,
            product: {
                productNumber: orderData.product.productNumber,
                productName: orderData.product.productName,
                brandName: orderData.product.brandName || 'AMINATI COLLECTION',
                selectedColor: orderData.product.selectedColor || '',
                selectedSize: orderData.product.selectedSize || '',
                price: orderData.product.price
            },
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
}

// グローバルインスタンス作成
const emailNotificationService = new EmailNotificationService();

// 既存のコードとの互換性を保つためのラッパー関数
function sendOrderNotification(orderData) {
    return emailNotificationService.sendOrderNotification(orderData);
}

// モジュールのエクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailNotificationService;
}

// ブラウザ環境での利用
if (typeof window !== 'undefined') {
    window.EmailNotificationService = EmailNotificationService;
    window.emailNotificationService = emailNotificationService;
    window.sendOrderNotification = sendOrderNotification;
}