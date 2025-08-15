// ========================================
// inventory-manager.js
// 商品ページ用在庫管理システム
// GitHub連携対応版 v3.0 - 実行問題修正版
// ========================================

// グローバルスコープで実行
console.log('📦 在庫管理システム v3.0 起動');

// グローバル変数
let colorStockData = {};
let PRODUCT_NUMBER = null;
let selectedColor = null;
let selectedSize = null;

// ========== 商品番号取得 ==========
function getProductNumber() {
    // 方法1: 商品詳細セクションから取得
    const detailItems = document.querySelectorAll('.detail-item');
    for (let item of detailItems) {
        const label = item.querySelector('.detail-label');
        const value = item.querySelector('.detail-value');
        if (label && (label.textContent === '品番' || label.textContent === '商品番号')) {
            return value ? value.textContent.trim() : null;
        }
    }
    
    // 方法2: currentProduct変数から取得（既存のスクリプトがある場合）
    if (typeof currentProduct !== 'undefined' && currentProduct.productNumber) {
        return currentProduct.productNumber;
    }
    
    // 方法3: URLから取得（ファイル名が商品番号の場合）
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const match = filename.match(/(\d{4}-\d{4})/);
    if (match) {
        return match[1];
    }
    
    return null;
}

// ========== 在庫データ読み込み（GitHub対応版） ==========
async function loadStockData() {
    try {
        // GitHubから最新データを取得（絶対パスを使用）
        console.log('🌐 GitHubから在庫データを取得中...');
        
        // GitHub Pagesの絶対URLを使用
        const timestamp = new Date().getTime();
        const githubUrl = `https://aminati-ec.github.io/data/color-stock.json?t=${timestamp}`;
        
        console.log(`📡 取得URL: ${githubUrl}`);
        
        const response = await fetch(githubUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📥 取得したデータ:', data);
            
            if (data && data.stockData) {
                colorStockData = data.stockData;
                console.log('✅ GitHubから在庫データ読み込み成功');
                console.log('📊 在庫データ:', colorStockData);
                
                // LocalStorageにも保存（キャッシュとして）
                localStorage.setItem('colorStockData', JSON.stringify(colorStockData));
                localStorage.setItem('colorStockDataTimestamp', new Date().toISOString());
                
                // この商品の在庫状況を表示
                const productStockKeys = Object.keys(colorStockData).filter(key => 
                    key.startsWith(PRODUCT_NUMBER + '_')
                );
                
                if (productStockKeys.length > 0) {
                    console.log(`📊 ${PRODUCT_NUMBER}の在庫切れカラー:`);
                    productStockKeys.forEach(key => {
                        const color = key.replace(PRODUCT_NUMBER + '_', '');
                        console.log(`  🚫 ${color}: 在庫切れ`);
                    });
                } else {
                    console.log(`✅ ${PRODUCT_NUMBER}: 全カラー在庫あり`);
                }
                
                return;
            } else {
                console.warn('⚠️ データ形式が不正です:', data);
            }
        } else {
            console.warn(`⚠️ HTTPエラー: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.warn('⚠️ GitHubからの読み込み失敗:', error.message);
    }
    
    // GitHubから読めない場合はLocalStorageから読み込み（フォールバック）
    console.log('📁 LocalStorageから在庫データを読み込み中...');
    const savedData = localStorage.getItem('colorStockData');
    const savedTimestamp = localStorage.getItem('colorStockDataTimestamp');
    
    if (savedData) {
        colorStockData = JSON.parse(savedData);
        console.log('✅ LocalStorageから在庫データ読み込み成功');
        console.log('📊 保存日時:', savedTimestamp);
        console.log('📊 在庫データ（キャッシュ）:', colorStockData);
        
        // この商品の在庫状況を表示
        const productStockKeys = Object.keys(colorStockData).filter(key => 
            key.startsWith(PRODUCT_NUMBER + '_')
        );
        if (productStockKeys.length > 0) {
            console.log(`📊 ${PRODUCT_NUMBER}の在庫切れカラー（キャッシュ）:`, productStockKeys);
        }
    } else {
        console.log('ℹ️ 在庫データなし（全商品在庫あり）');
        colorStockData = {};
    }
}

// ========== カラーオプションの在庫状態更新 ==========
function updateColorStockStatus() {
    const colorOptions = document.querySelectorAll('.color-option');
    let outOfStockCount = 0;
    let totalColors = colorOptions.length;
    
    console.log(`🎨 カラーオプション数: ${totalColors}`);
    
    colorOptions.forEach(option => {
        // data-value属性からカラー名を取得
        const colorValue = option.dataset.value || option.textContent.trim();
        const stockKey = `${PRODUCT_NUMBER}_${colorValue}`;
        
        console.log(`  🔍 チェック中: ${stockKey}`);
        
        if (colorStockData[stockKey] === false) {
            // 在庫切れ
            option.classList.add('out-of-stock');
            option.setAttribute('title', `${colorValue} - 在庫切れ`);
            option.style.opacity = '0.3';
            option.style.cursor = 'not-allowed';
            option.style.pointerEvents = 'none';  // クリック無効化
            
            // 取り消し線を追加
            option.style.textDecoration = 'line-through';
            option.style.textDecorationColor = '#dc3545';
            
            outOfStockCount++;
            console.log(`    🚫 ${colorValue}: 在庫切れ設定完了`);
        } else {
            // 在庫あり
            option.classList.remove('out-of-stock');
            option.setAttribute('title', `${colorValue} - 在庫あり`);
            option.style.opacity = '';
            option.style.cursor = '';
            option.style.pointerEvents = '';  // クリック有効化
            option.style.textDecoration = '';
            console.log(`    ✅ ${colorValue}: 在庫あり`);
        }
    });
    
    // 全体の在庫状態を表示
    if (outOfStockCount === totalColors && totalColors > 0) {
        showStockMessage('申し訳ございません。全カラー在庫切れです', 'out-of-stock');
        disablePurchaseButton(true);
    } else if (outOfStockCount > 0) {
        const availableCount = totalColors - outOfStockCount;
        showStockMessage(`一部カラーが在庫切れです（${availableCount}色在庫あり）`, 'low-stock');
    }
    
    console.log(`📊 在庫状況サマリー: ${totalColors}色中 ${outOfStockCount}色が在庫切れ`);
}

// ========== イベントリスナー設定 ==========
function setupEventListeners() {
    // カラー選択イベント
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        // 既存のonclickを保持しつつ、新しい処理を追加
        const originalOnclick = option.onclick;
        option.onclick = function(e) {
            // 在庫切れチェック
            if (this.classList.contains('out-of-stock')) {
                e.preventDefault();
                e.stopPropagation();
                showStockMessage('選択されたカラーは在庫切れです', 'out-of-stock');
                return false;
            }
            
            // 元の処理を実行
            if (originalOnclick) {
                originalOnclick.call(this, e);
            }
            
            // 選択状態を更新
            handleColorSelection(this);
        };
    });
    
    // サイズ選択イベント
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        const originalOnclick = option.onclick;
        option.onclick = function(e) {
            if (originalOnclick) {
                originalOnclick.call(this, e);
            }
            handleSizeSelection(this);
        };
    });
}

// ========== カラー選択処理 ==========
function handleColorSelection(element) {
    selectedColor = element.dataset.value || element.textContent.trim();
    console.log('🎨 カラー選択:', selectedColor);
    
    // 選択されたカラーの在庫確認
    const stockKey = `${PRODUCT_NUMBER}_${selectedColor}`;
    if (colorStockData[stockKey] === false) {
        showStockMessage('選択されたカラーは在庫切れです', 'out-of-stock');
        disablePurchaseButton(true);
    } else {
        checkPurchaseAvailability();
    }
}

// ========== サイズ選択処理 ==========
function handleSizeSelection(element) {
    selectedSize = element.dataset.value || element.textContent.trim();
    console.log('📏 サイズ選択:', selectedSize);
    checkPurchaseAvailability();
}

// ========== 購入可能状態チェック ==========
function checkPurchaseAvailability() {
    // 現在選択されているカラーとサイズを取得
    const activeColor = document.querySelector('.color-option.active');
    const activeSize = document.querySelector('.size-option.active');
    
    if (activeColor && activeSize) {
        const colorValue = activeColor.dataset.value || activeColor.textContent.trim();
        const stockKey = `${PRODUCT_NUMBER}_${colorValue}`;
        
        if (colorStockData[stockKey] === false) {
            // 在庫切れ
            disablePurchaseButton(true);
            showStockMessage('選択されたカラーは在庫切れです', 'out-of-stock');
        } else {
            // 在庫あり
            disablePurchaseButton(false);
            showStockMessage('在庫あり - 購入可能です', 'in-stock');
        }
    }
}

// ========== 購入ボタン制御 ==========
function disablePurchaseButton(disable) {
    const purchaseBtn = document.querySelector('.btn-add-cart');
    if (!purchaseBtn) return;
    
    if (disable) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.5';
        purchaseBtn.style.cursor = 'not-allowed';
        
        // ボタンテキストを変更（元のテキストを保存）
        if (!purchaseBtn.dataset.originalText) {
            purchaseBtn.dataset.originalText = purchaseBtn.textContent;
        }
        purchaseBtn.textContent = '在庫切れ';
    } else {
        purchaseBtn.disabled = false;
        purchaseBtn.style.opacity = '';
        purchaseBtn.style.cursor = '';
        
        // 元のテキストに戻す
        if (purchaseBtn.dataset.originalText) {
            purchaseBtn.textContent = purchaseBtn.dataset.originalText;
        }
    }
}

// ========== 在庫メッセージ表示 ==========
function showStockMessage(message, status) {
    let messageElement = document.getElementById('stockStatusMessage');
    
    if (!messageElement) {
        console.warn('⚠️ 在庫メッセージエリアが見つかりません。作成します。');
        addStockMessageArea();
        messageElement = document.getElementById('stockStatusMessage');
    }
    
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `stock-status-message ${status}`;
        messageElement.style.display = 'block';
        
        // スタイルを適用
        if (status === 'out-of-stock') {
            messageElement.style.background = '#f8d7da';
            messageElement.style.color = '#721c24';
            messageElement.style.border = '1px solid #f5c6cb';
        } else if (status === 'low-stock') {
            messageElement.style.background = '#fff3cd';
            messageElement.style.color = '#856404';
            messageElement.style.border = '1px solid #ffeeba';
        } else if (status === 'in-stock') {
            messageElement.style.background = '#d4edda';
            messageElement.style.color = '#155724';
            messageElement.style.border = '1px solid #c3e6cb';
        }
        
        // out-of-stock以外は3秒後に自動非表示
        if (status !== 'out-of-stock') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 3000);
        }
    }
}

// ========== 在庫メッセージエリア追加 ==========
function addStockMessageArea() {
    // 既に存在する場合はスキップ
    if (document.getElementById('stockStatusMessage')) {
        return;
    }
    
    // 商品名の後に追加
    const productName = document.querySelector('.product-name');
    if (productName) {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'stockStatusMessage';
        messageDiv.className = 'stock-status-message';
        messageDiv.style.cssText = `
            display: none;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
        `;
        productName.insertAdjacentElement('afterend', messageDiv);
        console.log('✅ 在庫メッセージエリアを追加しました');
    }
}

// ========== 初期化処理 ==========
async function initInventorySystem() {
    console.log('🔧 在庫管理システム初期化開始...');
    
    // 商品番号を取得
    PRODUCT_NUMBER = getProductNumber();
    if (!PRODUCT_NUMBER) {
        console.warn('⚠️ 商品番号が見つかりません');
        return;
    }
    console.log(`📋 商品番号: ${PRODUCT_NUMBER}`);
    
    // 在庫データを読み込み（GitHub優先）
    await loadStockData();
    
    // カラーオプションの在庫状態を更新
    updateColorStockStatus();
    
    // イベントリスナーを設定
    setupEventListeners();
    
    // 在庫状態メッセージエリアを追加
    addStockMessageArea();
    
    console.log('✅ 在庫管理システム初期化完了');
}

// ========== デバッグ用関数 ==========
window.inventoryDebug = {
    // 在庫データを表示
    showStock: function() {
        console.log('📊 現在の在庫データ:');
        console.table(colorStockData);
        const productKeys = Object.keys(colorStockData).filter(key => 
            key.startsWith(PRODUCT_NUMBER + '_')
        );
        console.log(`📦 ${PRODUCT_NUMBER}の在庫切れ:`, productKeys);
        return colorStockData;
    },
    
    // 在庫データをリセット
    resetStock: function() {
        if (confirm('在庫データをリセットしますか？')) {
            localStorage.removeItem('colorStockData');
            localStorage.removeItem('colorStockDataTimestamp');
            location.reload();
        }
    },
    
    // 特定カラーの在庫を切り替え（テスト用）
    toggleStock: function(color) {
        const stockKey = `${PRODUCT_NUMBER}_${color}`;
        if (colorStockData[stockKey] === false) {
            delete colorStockData[stockKey];
            console.log(`✅ ${color}を在庫ありに変更`);
        } else {
            colorStockData[stockKey] = false;
            console.log(`🚫 ${color}を在庫切れに変更`);
        }
        localStorage.setItem('colorStockData', JSON.stringify(colorStockData));
        location.reload();
    },
    
    // GitHubから強制再読み込み
    reloadFromGitHub: async function() {
        console.log('🔄 GitHubから強制再読み込み中...');
        localStorage.removeItem('colorStockData');
        localStorage.removeItem('colorStockDataTimestamp');
        await loadStockData();
        updateColorStockStatus();
        console.log('✅ 再読み込み完了');
        return colorStockData;
    },
    
    // 現在の商品番号を表示
    showProductNumber: function() {
        console.log(`📋 現在の商品番号: ${PRODUCT_NUMBER}`);
        return PRODUCT_NUMBER;
    },
    
    // すべての情報を表示
    showAll: function() {
        console.log('========== 在庫管理システム情報 ==========');
        console.log(`📋 商品番号: ${PRODUCT_NUMBER}`);
        console.log('📊 在庫データ:', colorStockData);
        console.log(`🎨 カラーオプション数: ${document.querySelectorAll('.color-option').length}`);
        console.log(`📅 キャッシュ日時: ${localStorage.getItem('colorStockDataTimestamp')}`);
        console.log('==========================================');
    },
    
    // 手動で初期化を実行
    init: async function() {
        console.log('🔧 手動初期化実行...');
        await initInventorySystem();
    }
};

// ========== 自動実行 ==========
// スクリプト読み込み時に即座に実行
(async function() {
    console.log('📌 在庫管理システム自動起動...');
    
    // DOMの読み込み状態を確認
    if (document.readyState === 'loading') {
        console.log('⏳ DOM読み込み中... DOMContentLoadedを待機');
        document.addEventListener('DOMContentLoaded', initInventorySystem);
    } else {
        console.log('✅ DOM読み込み完了済み... 即座に初期化');
        // 少し待機してから実行（他のスクリプトの初期化を待つ）
        setTimeout(initInventorySystem, 100);
    }
})();

console.log('💡 デバッグコマンド:');
console.log('  inventoryDebug.showAll() - すべての情報表示');
console.log('  inventoryDebug.showStock() - 在庫データ表示');
console.log('  inventoryDebug.reloadFromGitHub() - GitHubから再読み込み');
console.log('  inventoryDebug.init() - 手動で初期化実行');