// 商品ページ生成機能
// このファイルは管理画面（zozo_admin_ui.html）で使用します

// HTMLテンプレートを読み込む関数
async function loadTemplate() {
    // 実際の実装では、fetch APIを使用してテンプレートを読み込みます
    // ここでは、テンプレートを文字列として保持
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

// カラーセクション生成
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

// サイズセクション生成
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

// 画像カルーセル生成
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

// 割引セクション生成
function generateDiscountSection(originalPrice, salePrice) {
    if (!originalPrice || originalPrice <= salePrice) return '';
    
    const discountRate = Math.round((1 - salePrice / originalPrice) * 100);
    
    let html = `<span class="original-price">¥${Number(originalPrice).toLocaleString()}</span>\n`;
    html += `<span class="discount-badge">${discountRate}% OFF</span>`;
    
    return html;
}

// HTMLエスケープ
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

// メイン生成関数
async function generateProductHTML(product, description) {
    // 画像URL取得
    const thumbnail = thumbnailImages[product.productNumber];
    const details = detailImages[product.productNumber] || [];
    
    const baseUrl = 'https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev/products/';
    const thumbnailUrl = thumbnail ? 
        (thumbnail.isUrl ? thumbnail.url : `${baseUrl}${product.productNumber}-thumb.jpg`) : 
        'https://via.placeholder.com/500x625/f5f5f5/666666?text=No+Image';
    
    const detailUrls = details.map((img, index) => 
        img.isUrl ? img.url : `${baseUrl}${product.productNumber}-detail-${index + 1}.jpg`
    );
    
    // テンプレート読み込み（実際にはファイルから読み込む）
    let html = await loadTemplate();
    
    // 価格計算
    const hasDiscount = product.originalPrice && product.originalPrice != product.salePrice;
    const priceColorClass = hasDiscount ? ' discount' : '';
    
    // プレースホルダー置換
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
    
    // 置換実行
    Object.entries(replacements).forEach(([placeholder, value]) => {
        html = html.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return html;
}

// HTMLダウンロード
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
        
        // Admin設定からメールアドレス取得
        let adminEmail = null;
        if (window.adminSettings) {
            const settingsEmail = window.adminSettings.get('email');
            if (settingsEmail && settingsEmail.trim() !== '') {
                adminEmail = settingsEmail;
            }
        }
        
        // メールデータ作成
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
        
        // API送信
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
            console.log('✅ メール送信成功');
            // 成功メッセージは注文完了画面で表示されるのでここでは何もしない
        } else {
            console.error('❌ メール送信失敗');
            // 失敗してもエラーで止めない
        }
        
    } catch (error) {
        console.error('❌ API接続エラー:', error);
        // エラーでも処理を続行
    }
}
