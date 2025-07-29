// UI管理クラス
class UIManager {
    constructor(app) {
        this.app = app;
    }
    
    // 商品データ表示の更新
    updateProductDisplay() {
        const preview = document.getElementById('dataPreview');
        const header = document.getElementById('previewHeader');
        const body = document.getElementById('previewBody');
        
        if (Object.keys(this.app.productData).length === 0) {
            preview.style.display = 'none';
            return;
        }
        
        preview.style.display = 'block';
        
        // ヘッダー行
        header.innerHTML = `
            <th>商品番号</th>
            <th>ブランド</th>
            <th>商品名</th>
            <th>販売価格</th>
            <th>カラー数</th>
            <th>サイズ数</th>
        `;
        
        // データ行
        body.innerHTML = '';
        Object.values(this.app.productData).forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.productNumber}</td>
                <td>${product.brandName || '—'}</td>
                <td>${product.productName}</td>
                <td>¥${formatNumber(product.salePrice)}</td>
                <td>${product.colors.length}色</td>
                <td>${product.sizes.length}サイズ</td>
            `;
            body.appendChild(row);
        });
    }
    
    // 画像表示の更新
    updateImageDisplay() {
        this.updateThumbnailDisplay();
        this.updateDetailDisplay();
        this.updateImageGroups();
    }
    
    // サムネイル表示の更新
    updateThumbnailDisplay() {
        const grid = document.getElementById('thumbnailGrid');
        const preview = document.getElementById('thumbnailPreview');
        
        grid.innerHTML = '';
        
        Object.entries(this.app.thumbnailImages).forEach(([productNumber, image]) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            
            if (image.isUrl) {
                // URL画像の場合
                item.innerHTML = `
                    <div style="background: #f5f5f5; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 5px;">
                        URL画像<br>${productNumber}
                    </div>
                    <button class="preview-remove" onclick="removeThumbnail('${productNumber}')">×</button>
                `;
            } else {
                // ローカル画像の場合
                item.innerHTML = `
                    <img src="${image.url}" alt="${productNumber}">
                    <button class="preview-remove" onclick="removeThumbnail('${productNumber}')">×</button>
                `;
            }
            
            grid.appendChild(item);
        });
        
        preview.style.display = Object.keys(this.app.thumbnailImages).length > 0 ? 'block' : 'none';
    }
    
    // 詳細画像表示の更新
    updateDetailDisplay() {
        const grid = document.getElementById('detailGrid');
        const preview = document.getElementById('detailPreview');
        
        grid.innerHTML = '';
        
        Object.entries(this.app.detailImages).forEach(([productNumber, images]) => {
            images.forEach((image, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                
                if (image.isUrl) {
                    // URL画像の場合
                    item.innerHTML = `
                        <div style="background: #f5f5f5; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; text-align: center; padding: 5px;">
                            URL画像<br>${productNumber}-${index + 1}
                        </div>
                        <button class="preview-remove" onclick="removeDetail('${productNumber}', ${index})">×</button>
                    `;
                } else {
                    // ローカル画像の場合
                    item.innerHTML = `
                        <img src="${image.url}" alt="${productNumber}-${index}">
                        <button class="preview-remove" onclick="removeDetail('${productNumber}', ${index})">×</button>
                    `;
                }
                
                grid.appendChild(item);
            });
        });
        
        preview.style.display = Object.keys(this.app.detailImages).length > 0 ? 'block' : 'none';
    }
    
    // 画像グループ表示の更新
    updateImageGroups() {
        const container = document.getElementById('imageGroups');
        const allProductNumbers = new Set([
            ...Object.keys(this.app.thumbnailImages),
            ...Object.keys(this.app.detailImages)
        ]);
        
        if (allProductNumbers.size === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = '<h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">商品番号ごとの画像</h3>';
        
        // 商品番号でソート
        const sortedNumbers = Array.from(allProductNumbers).sort();
        
        sortedNumbers.forEach(productNumber => {
            const group = document.createElement('div');
            group.className = 'product-group';
            
            // 商品番号ラベル
            const label = document.createElement('div');
            label.className = 'product-number-label';
            label.textContent = `商品番号: ${productNumber}`;
            group.appendChild(label);
            
            // 商品名を表示（データがある場合）
            if (this.app.productData[productNumber]) {
                const productName = document.createElement('div');
                productName.style.fontSize = '12px';
                productName.style.color = '#666666';
                productName.style.marginBottom = '10px';
                productName.textContent = this.app.productData[productNumber].productName;
                group.appendChild(productName);
            }
            
            // サムネイル情報
            if (this.app.thumbnailImages[productNumber]) {
                const section = document.createElement('div');
                section.className = 'image-type-section';
                const imageType = this.app.thumbnailImages[productNumber].isUrl ? 'URL' : 'ローカル';
                section.innerHTML = `<div class="image-type-label">サムネイル: 1枚（${imageType}）</div>`;
                group.appendChild(section);
            }
            
            // 詳細画像情報
            if (this.app.detailImages[productNumber] && this.app.detailImages[productNumber].length > 0) {
                const section = document.createElement('div');
                section.className = 'image-type-section';
                const urlCount = this.app.detailImages[productNumber].filter(img => img.isUrl).length;
                const localCount = this.app.detailImages[productNumber].length - urlCount;
                
                let detailInfo = `詳細画像: ${this.app.detailImages[productNumber].length}枚`;
                if (urlCount > 0 && localCount > 0) {
                    detailInfo += ` （URL: ${urlCount}枚、ローカル: ${localCount}枚）`;
                } else if (urlCount > 0) {
                    detailInfo += ' （URL）';
                } else {
                    detailInfo += ' （ローカル）';
                }
                
                section.innerHTML = `<div class="image-type-label">${detailInfo}</div>`;
                group.appendChild(section);
            }
            
            container.appendChild(group);
        });
    }
    
    // すべての表示をクリア
    clearAllDisplays() {
        // データプレビューをクリア
        document.getElementById('dataPreview').style.display = 'none';
        document.getElementById('previewBody').innerHTML = '';
        
        // 画像プレビューをクリア
        document.getElementById('thumbnailPreview').style.display = 'none';
        document.getElementById('thumbnailGrid').innerHTML = '';
        
        document.getElementById('detailPreview').style.display = 'none';
        document.getElementById('detailGrid').innerHTML = '';
        
        // 画像グループをクリア
        document.getElementById('imageGroups').style.display = 'none';
        document.getElementById('imageGroups').innerHTML = '';
        
        // ログをクリア
        document.getElementById('logArea').innerHTML = '';
        document.getElementById('logArea').style.display = 'none';
        
        // 生成ボタンを無効化
        document.getElementById('generateBtn').disabled = true;
    }
    
    // プログレスバーの表示（将来の実装用）
    showProgress(current, total, message = '') {
        // プログレスバーUIの実装
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${percentage}% - ${message}`);
    }
    
    // モーダル表示（将来の実装用）
    showModal(title, content, buttons = []) {
        // モーダルUIの実装
        console.log(`Modal: ${title} - ${content}`);
    }
}