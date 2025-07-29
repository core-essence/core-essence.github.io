// 生成後処理管理クラス
class PostGenerationManager {
    constructor(productGenerator) {
        this.productGenerator = productGenerator;
        this.storage = productGenerator.storage;
    }
    
    showPostGenerationOptions(generatedProducts) {
        // 商品生成後のオプションを表示しない（ヘッダーから各機能にアクセスできるため）
        
        // カテゴリー分類結果のみログに出力
        const categoryReport = this.generateCategoryReport(generatedProducts);
        addLog(`カテゴリー分類結果: ${categoryReport}`, 'info');
    }
    
    generateCategoryReport(products) {
        const categoryCount = {};
        
        products.forEach(product => {
            const category = product.category || 'その他';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        return Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => `${category}: ${count}件`)
            .join(' / ');
    }
    
    async viewTopPage() {
        window.open('index.html', '_blank');
    }
    
    async viewProducts() {
        const products = await this.storage.getAllProducts();
        
        if (products.length === 0) {
            showErrorMessage('保存された商品がありません');
            return;
        }
        
        const listHtml = this.generateProductListHtml(products);
        const blob = new Blob([listHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
    
    generateProductListHtml(products) {
        // 商品データからHTMLフィールドを除外してからエンコード
        const productsDataForClient = products.map(p => ({
            productNumber: p.productNumber,
            productData: p.productData,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
            // htmlフィールドは除外
        }));
        
        // Base64エンコード
        const productsDataEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(productsDataForClient))));
        
        const tableRows = products.map((p, index) => {
            const hasDiscount = p.productData.originalPrice && p.productData.originalPrice != p.productData.salePrice;
            const discountRate = hasDiscount ? Math.round((1 - p.productData.salePrice / p.productData.originalPrice) * 100) : 0;
            
            return `
            <tr>
                <td class="checkbox-cell">
                    <input type="checkbox" class="product-checkbox" data-product-number="${this.escapeHtml(p.productNumber)}">
                </td>
                <td class="product-number-cell">${this.escapeHtml(p.productNumber)}</td>
                <td class="brand-cell">${this.escapeHtml(p.productData.brandName || 'ノーブランド')}</td>
                <td class="name-cell">
                    <a href="#" onclick="viewProduct('${this.escapeHtml(p.productNumber)}'); return false;">${this.escapeHtml(p.productData.productName)}</a>
                </td>
                <td class="price-cell">¥${this.formatNumber(p.productData.salePrice)}</td>
                <td class="colors-cell">${(p.productData.colors || []).length}色</td>
                <td class="sizes-cell">${(p.productData.sizes || []).length}サイズ</td>
            </tr>
        `;
        }).join('');
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>保存済み商品一覧 - AMINATI_EC</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; 
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        h1 { 
            color: #333; 
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: 600;
        }
        
        /* アクションバー */
        .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f8f8;
            border-radius: 6px;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #218838;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        /* CSVインポートエリア */
        .csv-import-area {
            display: none;
            margin-bottom: 20px;
            padding: 20px;
            background: #e8f4f8;
            border: 2px dashed #17a2b8;
            border-radius: 6px;
            text-align: center;
        }
        
        .csv-import-area.active {
            display: block;
        }
        
        /* テーブルスタイル */
        .product-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        .product-table th {
            background: #000;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 500;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .product-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .product-table tr:hover {
            background: #f8f9fa;
        }
        
        .checkbox-cell {
            width: 40px;
            text-align: center;
        }
        
        .product-number-cell {
            width: 80px;
            font-family: monospace;
        }
        
        .brand-cell {
            width: 120px;
        }
        
        .name-cell {
            min-width: 200px;
        }
        
        .name-cell a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
        }
        
        .name-cell a:hover {
            color: #007bff;
            text-decoration: underline;
        }
        
        .price-cell {
            width: 100px;
            text-align: right;
            font-family: monospace;
        }
        
        .colors-cell, .sizes-cell {
            width: 80px;
            text-align: center;
        }
        
        /* 選択カウンター */
        .selection-info {
            font-size: 14px;
            color: #666;
        }
        
        /* ローディング */
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
            font-size: 16px;
            color: #666;
        }
        
        /* ファイルインプット */
        #csvFileInput {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>保存済み商品一覧（${products.length}件）</h1>
        
        <div class="action-bar">
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="selectAll()">
                    <span id="selectAllText">全選択</span>
                </button>
                <button class="btn btn-danger" onclick="deleteSelected()">
                    選択を削除
                </button>
                <button class="btn btn-success" onclick="exportToCSV()">
                    CSVエクスポート
                </button>
                <button class="btn btn-secondary" onclick="toggleImportArea()">
                    CSVインポート
                </button>
            </div>
            <div class="selection-info">
                <span id="selectedCount">0</span>件選択中
            </div>
        </div>
        
        <div class="csv-import-area" id="csvImportArea">
            <p>商品情報を更新するCSVファイルをドロップまたは選択してください</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                ※ CSVには「商品番号」列が必須です。更新したい項目の列のみ含めてください。
            </p>
            <input type="file" id="csvFileInput" accept=".csv" onchange="handleCSVFile(this.files[0])">
            <button class="btn btn-primary" onclick="document.getElementById('csvFileInput').click()">
                ファイルを選択
            </button>
        </div>
        
        <table class="product-table">
            <thead>
                <tr>
                    <th class="checkbox-cell">
                        <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()">
                    </th>
                    <th>商品番号</th>
                    <th>ブランド</th>
                    <th>商品名</th>
                    <th>販売価格</th>
                    <th>カラー数</th>
                    <th>サイズ数</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        
        <div class="loading" id="loading">
            処理中...
        </div>
    </div>
    
    <script>
        // 商品データをBase64から復元
        const productsDataEncoded = '${productsDataEncoded}';
        const productsData = JSON.parse(decodeURIComponent(escape(atob(productsDataEncoded))));
        
        // チェックボックスの状態を管理
        let selectedProducts = new Set();
        
        // 個別チェックボックスの変更を監視
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedProducts.add(this.dataset.productNumber);
                } else {
                    selectedProducts.delete(this.dataset.productNumber);
                }
                updateSelectionInfo();
            });
        });
        
        // 全選択/解除
        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            const checkboxes = document.querySelectorAll('.product-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
                if (selectAllCheckbox.checked) {
                    selectedProducts.add(checkbox.dataset.productNumber);
                } else {
                    selectedProducts.delete(checkbox.dataset.productNumber);
                }
            });
            
            updateSelectionInfo();
        }
        
        // 全選択ボタン
        function selectAll() {
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            selectAllCheckbox.checked = !selectAllCheckbox.checked;
            toggleSelectAll();
        }
        
        // 選択状態の更新
        function updateSelectionInfo() {
            document.getElementById('selectedCount').textContent = selectedProducts.size;
            document.getElementById('selectAllText').textContent = 
                selectedProducts.size === productsData.length ? '全解除' : '全選択';
        }
        
        // 選択した商品を削除
        async function deleteSelected() {
            if (selectedProducts.size === 0) {
                alert('削除する商品を選択してください');
                return;
            }
            
            if (!confirm(\`選択した\${selectedProducts.size}件の商品を削除しますか？\`)) {
                return;
            }
            
            showLoading();
            
            try {
                // IndexedDBから削除
                const dbName = 'AminatiECProducts';
                const request = indexedDB.open(dbName);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(['products'], 'readwrite');
                    const store = transaction.objectStore('products');
                    
                    let deleteCount = 0;
                    selectedProducts.forEach(productNumber => {
                        const deleteRequest = store.delete(productNumber);
                        deleteRequest.onsuccess = () => {
                            deleteCount++;
                            if (deleteCount === selectedProducts.size) {
                                hideLoading();
                                alert(\`\${deleteCount}件の商品を削除しました\`);
                                location.reload();
                            }
                        };
                    });
                };
            } catch (error) {
                hideLoading();
                alert('削除中にエラーが発生しました: ' + error.message);
            }
        }
        
        // CSVエクスポート
        function exportToCSV() {
            const headers = ['商品番号', 'ブランド名', '商品名', '販売価格', '定価', '素材', '原産国', 'カラー', 'サイズ'];
            const rows = productsData.map(p => {
                const data = p.productData;
                return [
                    p.productNumber,
                    data.brandName || '',
                    data.productName,
                    data.salePrice,
                    data.originalPrice || '',
                    data.material || '',
                    data.origin || '',
                    (data.colors || []).join(','),
                    (data.sizes || []).join(',')
                ];
            });
            
            // BOMを追加してExcelで文字化けしないようにする
            const BOM = '\\uFEFF';
            let csvContent = BOM;
            
            // ヘッダー行
            csvContent += headers.join(',') + '\\n';
            
            // データ行
            rows.forEach(row => {
                const escapedRow = row.map(cell => {
                    // セル内にカンマ、改行、ダブルクォートが含まれる場合は""で囲む
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('\\n') || cellStr.includes('"')) {
                        return '"' + cellStr.replace(/"/g, '""') + '"';
                    }
                    return cellStr;
                });
                csvContent += escapedRow.join(',') + '\\n';
            });
            
            // ダウンロード
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`商品一覧_\${new Date().toISOString().split('T')[0]}.csv\`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // CSVインポートエリアの表示切替
        function toggleImportArea() {
            const importArea = document.getElementById('csvImportArea');
            importArea.classList.toggle('active');
        }
        
        // CSVファイルの処理
        function handleCSVFile(file) {
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csvData = parseCSV(e.target.result);
                    updateProductsFromCSV(csvData);
                } catch (error) {
                    alert('CSVの読み込みに失敗しました: ' + error.message);
                }
            };
            reader.readAsText(file, 'UTF-8');
        }
        
        // 改良版CSVパーサー（ダブルクォート対応）
        function parseCSV(csvText) {
            const lines = [];
            let currentLine = '';
            let inQuotes = false;
            
            // BOMを削除
            csvText = csvText.replace(/^\\uFEFF/, '');
            
            // 改行を正しく処理
            for (let i = 0; i < csvText.length; i++) {
                const char = csvText[i];
                const nextChar = csvText[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        currentLine += '"';
                        i++; // スキップ
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === '\\n' && !inQuotes) {
                    if (currentLine.trim()) {
                        lines.push(currentLine);
                    }
                    currentLine = '';
                } else if (char !== '\\r') {
                    currentLine += char;
                }
            }
            if (currentLine.trim()) {
                lines.push(currentLine);
            }
            
            // ヘッダーとデータを分離
            if (lines.length === 0) return [];
            
            const headers = parseCSVLine(lines[0]);
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
            
            return data;
        }
        
        // CSV行をパース
        function parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            
            return values;
        }
        
        // CSVデータで商品情報を更新
        async function updateProductsFromCSV(csvData) {
            if (!csvData.length) {
                alert('CSVファイルにデータがありません');
                return;
            }
            
            showLoading();
            
            try {
                const dbName = 'AminatiECProducts';
                const request = indexedDB.open(dbName);
                
                request.onsuccess = async (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(['products'], 'readwrite');
                    const store = transaction.objectStore('products');
                    
                    let updateCount = 0;
                    const updatedProducts = [];
                    
                    for (const row of csvData) {
                        const productNumber = row['商品番号'];
                        if (!productNumber) continue;
                        
                        // 既存の商品を取得
                        const getRequest = store.get(productNumber);
                        
                        await new Promise((resolve) => {
                            getRequest.onsuccess = () => {
                                const product = getRequest.result;
                                if (product) {
                                    // 更新前の値を保存
                                    const oldData = JSON.parse(JSON.stringify(product.productData));
                                    
                                    // 更新可能なフィールドを更新
                                    if (row['ブランド名'] !== undefined && row['ブランド名'] !== '') {
                                        product.productData.brandName = row['ブランド名'];
                                    }
                                    if (row['商品名'] !== undefined && row['商品名'] !== '') {
                                        product.productData.productName = row['商品名'];
                                    }
                                    if (row['販売価格'] !== undefined && row['販売価格'] !== '') {
                                        product.productData.salePrice = Number(row['販売価格']);
                                    }
                                    if (row['定価'] !== undefined && row['定価'] !== '') {
                                        product.productData.originalPrice = Number(row['定価']);
                                    }
                                    if (row['素材'] !== undefined && row['素材'] !== '') {
                                        product.productData.material = row['素材'];
                                    }
                                    if (row['原産国'] !== undefined && row['原産国'] !== '') {
                                        product.productData.origin = row['原産国'];
                                    }
                                    if (row['カラー'] !== undefined && row['カラー'] !== '') {
                                        product.productData.colors = row['カラー'].split(',').map(c => c.trim()).filter(c => c);
                                    }
                                    if (row['サイズ'] !== undefined && row['サイズ'] !== '') {
                                        product.productData.sizes = row['サイズ'].split(',').map(s => s.trim()).filter(s => s);
                                    }
                                    
                                    // 更新日時を更新
                                    product.updatedAt = new Date().toISOString();
                                    
                                    // バージョンを更新
                                    product.version = (product.version || 1) + 1;
                                    
                                    // HTMLを再生成する必要がある場合のフラグ
                                    const needsHtmlRegeneration = 
                                        oldData.productName !== product.productData.productName ||
                                        oldData.brandName !== product.productData.brandName ||
                                        oldData.salePrice !== product.productData.salePrice ||
                                        oldData.originalPrice !== product.productData.originalPrice ||
                                        JSON.stringify(oldData.colors) !== JSON.stringify(product.productData.colors) ||
                                        JSON.stringify(oldData.sizes) !== JSON.stringify(product.productData.sizes) ||
                                        oldData.material !== product.productData.material ||
                                        oldData.origin !== product.productData.origin;
                                    
                                    if (needsHtmlRegeneration) {
                                        // HTMLを再生成
                                        product.html = regenerateProductHTML(product.productData);
                                    }
                                    
                                    // 更新を保存
                                    store.put(product);
                                    updateCount++;
                                    updatedProducts.push(product);
                                }
                                resolve();
                            };
                        });
                    }
                    
                    transaction.oncomplete = () => {
                        hideLoading();
                        if (updateCount > 0) {
                            alert(\`\${updateCount}件の商品情報を更新しました。\\n\\n更新内容を反映するため、ページを再読み込みします。\`);
                            location.reload();
                        } else {
                            alert('更新対象の商品が見つかりませんでした。\\n商品番号が正しいか確認してください。');
                        }
                    };
                };
            } catch (error) {
                hideLoading();
                alert('更新中にエラーが発生しました: ' + error.message);
            }
        }
        
        // 商品HTMLを再生成する関数（簡易版）
        function regenerateProductHTML(productData) {
            // 注意: これは簡易的な再生成です。
            // 実際の商品ページと完全に同じにするには、
            // product-generator.jsの生成ロジックを呼び出す必要があります。
            
            const hasDiscount = productData.originalPrice && productData.originalPrice != productData.salePrice;
            const discountRate = hasDiscount ? Math.round((1 - productData.salePrice / productData.originalPrice) * 100) : 0;
            
            // 既存のHTMLから画像URLなどを保持したまま、
            // 商品情報部分のみを更新する処理が理想的ですが、
            // ここでは簡易的に新しいHTMLを生成します。
            
            return \`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${escapeHtml(productData.productName)} - AMINATI_EC</title>
    <!-- スタイルシートなどは省略 -->
</head>
<body>
    <p>商品情報が更新されました。正しい表示のためには商品ページを再生成してください。</p>
    <h1>\${escapeHtml(productData.productName)}</h1>
    <p>商品番号: \${productData.productNumber}</p>
    <p>価格: ¥\${productData.salePrice.toLocaleString()}</p>
    <p>この商品ページは簡易的に更新されています。完全な商品ページを表示するには、管理画面から商品ページを再生成してください。</p>
</body>
</html>\`;
        }
        
        // HTMLエスケープ関数（ローカル）
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 商品詳細を表示
        async function viewProduct(productNumber) {
            const dbName = 'AminatiECProducts';
            const request = indexedDB.open(dbName);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['products'], 'readonly');
                const store = transaction.objectStore('products');
                const getRequest = store.get(productNumber);
                
                getRequest.onsuccess = () => {
                    const product = getRequest.result;
                    if (product) {
                        const blob = new Blob([product.html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }
                };
            };
        }
        
        // ローディング表示
        function showLoading() {
            document.getElementById('loading').style.display = 'block';
        }
        
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }
        
        // ドラッグ&ドロップ対応
        const importArea = document.getElementById('csvImportArea');
        
        importArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            importArea.style.background = '#d1ecf1';
        });
        
        importArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            importArea.style.background = '#e8f4f8';
        });
        
        importArea.addEventListener('drop', (e) => {
            e.preventDefault();
            importArea.style.background = '#e8f4f8';
            
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                handleCSVFile(file);
            } else {
                alert('CSVファイルをドロップしてください');
            }
        });
    </script>
</body>
</html>`;
    }
    
    async exportAll() {
        await this.storage.exportAllProducts();
    }
    
    // ユーティリティメソッド
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }
    
    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // JavaScriptエスケープ
    escapeForJavaScript(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
}