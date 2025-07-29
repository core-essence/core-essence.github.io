// 商品データ（テンプレートから置換される）
const productData = {
    productNumber: '{{PRODUCT_NUMBER}}',
    productName: '{{PRODUCT_NAME}}',
    salePrice: '{{SALE_PRICE}}'
};

// 画像切り替え
function changeImage(src, element) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.carousel-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// カラー選択
document.addEventListener('DOMContentLoaded', function() {
    // カラーオプションのイベント
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // サイズオプションのイベント
    document.querySelectorAll('.size-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.size-option').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});

// 注文処理
function orderProduct() {
    const selectedColor = document.querySelector('.color-option.active')?.textContent || '';
    const selectedSize = document.querySelector('.size-option.active')?.textContent || '';
    
    const subject = '商品注文: ' + productData.productName;
    const body = '商品番号: ' + productData.productNumber + '\n' +
                '商品名: ' + productData.productName + '\n' +
                'カラー: ' + selectedColor + '\n' +
                'サイズ: ' + selectedSize + '\n' +
                '価格: ¥' + productData.salePrice + '\n\n' +
                'お名前：\n' +
                'ご住所：\n' +
                '電話番号：';
    
    window.location.href = 'mailto:order@aminati-ec.com?subject=' + 
                          encodeURIComponent(subject) + 
                          '&body=' + encodeURIComponent(body);
}