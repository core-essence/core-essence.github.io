// 購入フロー管理クラス
class PurchaseFlow {
    constructor() {
        this.shippingFee = 500; // 配送料固定
        this.codFee = 330; // 代引き手数料固定
    }
    
    // 購入フロー開始
    start(productData) {
        const selectedColor = document.querySelector('.color-option.active')?.dataset.value || '';
        const selectedSize = document.querySelector('.size-option.active')?.dataset.value || '';
        
        // 選択された商品情報を保存
        const purchaseData = {
            ...productData,
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            timestamp: new Date().toISOString()
        };
        
        // セッションストレージに保存
        sessionStorage.setItem('purchaseData', JSON.stringify(purchaseData));
        
        // 概算確認画面を表示
        this.showEstimateModal(purchaseData);
    }
    
    // 概算確認モーダル表示
    showEstimateModal(purchaseData) {
        const totalPrice = purchaseData.price + this.shippingFee + this.codFee;
        
        const modalHtml = `
            <div class="modal-overlay" id="estimateModal">
                <div class="modal-content">
                    <h2>ご注文内容の確認</h2>
                    
                    <div class="order-summary">
                        <div class="product-info">
                            <h3>${purchaseData.productName}</h3>
                            <p>ブランド: ${purchaseData.brandName}</p>
                            <p>カラー: ${purchaseData.selectedColor}</p>
                            <p>サイズ: ${purchaseData.selectedSize}</p>
                        </div>
                        
                        <div class="price-breakdown">
                            <div class="price-item">
                                <span>商品代金</span>
                                <span>¥${this.formatNumber(purchaseData.price)}</span>
                            </div>
                            <div class="price-item">
                                <span>配送料</span>
                                <span>¥${this.formatNumber(this.shippingFee)}</span>
                            </div>
                            <div class="price-item">
                                <span>代引き手数料</span>
                                <span>¥${this.formatNumber(this.codFee)}</span>
                            </div>
                            <div class="price-total">
                                <span>合計金額</span>
                                <span>¥${this.formatNumber(totalPrice)}</span>
                            </div>
                        </div>
                        
                        <div class="payment-info">
                            <p><strong>お支払い方法:</strong> 代金引換（現金のみ）</p>
                            <p><small>※商品到着時に配達員にお支払いください</small></p>
                        </div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-secondary" onclick="purchaseFlow.closeEstimateModal()">戻る</button>
                        <button class="btn-primary" onclick="purchaseFlow.proceedToShipping()">この内容で注文する</button>
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
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 概算データを保存
        const estimateData = {
            ...purchaseData,
            shippingFee: this.shippingFee,
            codFee: this.codFee,
            totalPrice: totalPrice
        };
        sessionStorage.setItem('estimateData', JSON.stringify(estimateData));
    }
    
    // 概算モーダルを閉じる
    closeEstimateModal() {
        const modal = document.getElementById('estimateModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // 配送先入力画面に進む
    proceedToShipping() {
        this.closeEstimateModal();
        this.showShippingForm();
    }
    
    // 配送先入力フォーム表示
    showShippingForm() {
        const modalHtml = `
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
                            <small>※最短3日後から指定可能</small>
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
                        <button class="btn-secondary" onclick="purchaseFlow.closeShippingModal()">戻る</button>
                        <button class="btn-primary" onclick="purchaseFlow.submitOrder()">注文を確定する</button>
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
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 最短配達日を設定
        const today = new Date();
        const minDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
        document.getElementById('deliveryDate').min = minDate.toISOString().split('T')[0];
    }
    
    // 配送モーダルを閉じる
    closeShippingModal() {
        const modal = document.getElementById('shippingModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // 注文確定処理
    submitOrder() {
        const form = document.getElementById('shippingForm');
        const formData = new FormData(form);
        
        // バリデーション
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
        
        // 注文データを作成
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
        
        // 注文データを保存
        this.saveOrder(orderData);
    }
    
    // 注文データ保存
    saveOrder(orderData) {
        // IndexedDBに保存
        const request = indexedDB.open('AminatiECOrders', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('orders')) {
                const objectStore = db.createObjectStore('orders', { keyPath: 'orderId' });
                objectStore.createIndex('orderDate', 'orderDate', { unique: false });
                objectStore.createIndex('status', 'status', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['orders'], 'readwrite');
            const objectStore = transaction.objectStore('orders');
            
            objectStore.add(orderData).onsuccess = () => {
                // 管理者にメール通知を送信
                this.sendOrderNotification(orderData);
                
                // 注文完了画面を表示
                this.showOrderComplete(orderData);
                
                // セッションデータをクリア
                sessionStorage.removeItem('purchaseData');
                sessionStorage.removeItem('estimateData');
            };
        };
    }
    
    // 管理者メール通知
    sendOrderNotification(orderData) {
        // Admin設定からメールアドレスを取得
        const adminEmail = window.adminSettings ? window.adminSettings.get('email') : 'admin@aminati-ec.com';
        
        const subject = encodeURIComponent(`[AMINATI_EC] 新規注文: ${orderData.orderId}`);
        const body = encodeURIComponent(`新しい注文が入りました。

【注文情報】
注文番号: ${orderData.orderId}
注文日時: ${new Date(orderData.orderDate).toLocaleString('ja-JP')}

【商品情報】
商品番号: ${orderData.product.productNumber}
商品名: ${orderData.product.productName}
ブランド: ${orderData.product.brandName}
カラー: ${orderData.product.selectedColor}
サイズ: ${orderData.product.selectedSize}

【金額】
商品代金: ¥${this.formatNumber(orderData.pricing.productPrice)}
配送料: ¥${this.formatNumber(orderData.pricing.shippingFee)}
代引き手数料: ¥${this.formatNumber(orderData.pricing.codFee)}
合計金額: ¥${this.formatNumber(orderData.pricing.totalPrice)}

【お客様情報】
お名前: ${orderData.customer.name}
フリガナ: ${orderData.customer.kana}
電話番号: ${orderData.customer.phone}
メールアドレス: ${orderData.customer.email}
郵便番号: ${orderData.customer.zip}
住所: ${orderData.customer.address}

【配送希望】
希望配達日: ${orderData.delivery.date || '指定なし'}
希望時間: ${orderData.delivery.time || '指定なし'}
ご要望: ${orderData.delivery.note || 'なし'}

管理画面で詳細を確認してください。
`);
        
        // メーラーを開く
        window.open(`mailto:${adminEmail}?subject=${subject}&body=${body}`);
    }
    
    // 注文完了画面
    showOrderComplete(orderData) {
        this.closeShippingModal();
        
        const modalHtml = `
            <div class="modal-overlay" id="completeModal">
                <div class="modal-content">
                    <div class="complete-icon">✓</div>
                    <h2>ご注文ありがとうございました</h2>
                    
                    <div class="order-info">
                        <p><strong>注文番号:</strong> ${orderData.orderId}</p>
                        <p><strong>注文日時:</strong> ${new Date(orderData.orderDate).toLocaleString('ja-JP')}</p>
                        <p><strong>合計金額:</strong> ¥${this.formatNumber(orderData.pricing.totalPrice)}</p>
                    </div>
                    
                    <div class="complete-message">
                        <p>ご注文を承りました。</p>
                        <p>商品は代金引換でお届けいたします。</p>
                        <p>配送について詳細をお電話にてご連絡する場合がございます。</p>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-primary" onclick="purchaseFlow.closeCompleteModal()">閉じる</button>
                    </div>
                </div>
            </div>
            
            <style>
            .complete-icon {
                width: 60px;
                height: 60px;
                background: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                font-weight: bold;
                margin: 0 auto 20px;
            }
            .order-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .order-info p {
                margin-bottom: 8px;
                font-size: 14px;
            }
            .complete-message {
                text-align: center;
                margin: 20px 0;
            }
            .complete-message p {
                margin-bottom: 10px;
                font-size: 14px;
                line-height: 1.5;
            }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    // 注文完了モーダルを閉じる
    closeCompleteModal() {
        const modal = document.getElementById('completeModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // 数値フォーマット
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }
}

// グローバルインスタンス作成
const purchaseFlow = new PurchaseFlow();