// 画像処理クラス
class ImageHandler {
    constructor(app) {
        this.app = app;
    }
    
    handleThumbnailFiles(files) {
        Array.from(files).forEach(file => {
            if (isImageFile(file)) {
                this.processThumbnail(file);
            }
        });
    }
    
    handleDetailFiles(files) {
        Array.from(files).forEach(file => {
            if (isImageFile(file)) {
                this.processDetail(file);
            }
        });
    }
    
    processThumbnail(file) {
        const productNumber = extractProductNumber(file.name);
        
        if (!productNumber) {
            addLog(`商品番号を抽出できません: ${file.name}`, 'error');
            return;
        }
        
        // ファイルタイプの詳細情報を取得
        const fileInfo = extractProductInfo(file.name);
        
        // 詳細画像形式のファイルがサムネイルドロップゾーンに入れられた場合の警告
        if (fileInfo && fileInfo.type === 'detail') {
            addLog(`⚠️ 詳細画像形式のファイル(${file.name})をサムネイルとして登録します`, 'warning');
        }
        
        // 既存のサムネイルがある場合は確認
        if (this.app.thumbnailImages[productNumber]) {
            if (!confirm(`商品番号 ${productNumber} のサムネイル画像を上書きしますか？`)) {
                return;
            }
        }
        
        const imageData = {
            file: file,
            name: file.name,
            url: URL.createObjectURL(file),
            isLocal: true,
            fileType: fileInfo ? fileInfo.type : 'unknown'
        };
        
        this.app.addThumbnailImage(productNumber, imageData);
        addLog(`サムネイル登録: ${file.name} → 商品番号 ${productNumber}`, 'success');
    }
    
    processDetail(file) {
        const productNumber = extractProductNumber(file.name);
        
        if (!productNumber) {
            addLog(`商品番号を抽出できません: ${file.name}`, 'error');
            return;
        }
        
        // ファイルタイプの詳細情報を取得
        const fileInfo = extractProductInfo(file.name);
        
        // サムネイル形式のファイルが詳細画像ドロップゾーンに入れられた場合の警告
        if (fileInfo && fileInfo.type === 'thumbnail') {
            addLog(`⚠️ サムネイル形式のファイル(${file.name})を詳細画像として登録します`, 'warning');
        }
        
        const imageData = {
            file: file,
            name: file.name,
            url: URL.createObjectURL(file),
            isLocal: true,
            fileType: fileInfo ? fileInfo.type : 'unknown',
            index: fileInfo ? fileInfo.index : null
        };
        
        const success = this.app.addDetailImage(productNumber, imageData);
        if (success) {
            // 詳細画像のインデックス情報も含めてログ出力
            const indexInfo = fileInfo && fileInfo.index ? ` (画像${fileInfo.index})` : '';
            addLog(`詳細画像登録: ${file.name}${indexInfo} → 商品番号 ${productNumber}`, 'success');
        }
    }
    
    // 画像のリサイズ（将来の実装用）
    async resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // アスペクト比を保ちながらリサイズ
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.9);
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // 画像の検証
    validateImage(file) {
        // ファイルサイズチェック（10MB以下）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('画像ファイルが大きすぎます（10MB以下にしてください）');
        }
        
        // ファイルタイプチェック
        if (!CONFIG.IMAGE.ACCEPTED_TYPES.includes(file.type)) {
            throw new Error('対応していない画像形式です');
        }
        
        return true;
    }
    
    // 詳細画像のソート（インデックス番号がある場合）
    sortDetailImages(detailImages) {
        return detailImages.sort((a, b) => {
            // インデックス番号がある場合はそれでソート
            if (a.index !== null && b.index !== null) {
                return a.index - b.index;
            }
            // インデックス番号がない場合はファイル名でソート
            return a.name.localeCompare(b.name);
        });
    }
}