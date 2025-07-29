// URL一覧処理クラス
class UrlHandler {
    constructor(app) {
        this.app = app;
    }
    
    async handleFiles(files, type) {
        for (const file of files) {
            if (isTextFile(file)) {
                await this.processTextFile(file, type);
            } else if (isExcelFile(file)) {
                await this.processExcelFile(file, type);
            }
        }
    }
    
    async processTextFile(file, type) {
        addLog(`${type === 'thumbnail' ? 'サムネイル' : '詳細'}URL一覧読み込み: ${file.name}`, 'info');
        
        try {
            const text = await file.text();
            const urls = text.split('\n')
                .map(line => line.trim())
                .filter(line => line && (line.startsWith('http://') || line.startsWith('https://')));
            
            if (urls.length === 0) {
                addLog('有効なURLが見つかりませんでした', 'error');
                return;
            }
            
            urls.forEach(url => {
                this.processUrl(url, type);
            });
            
            addLog(`${urls.length}件のURLを処理しました`, 'success');
            
        } catch (error) {
            addLog(`URL一覧読み込みエラー: ${error.message}`, 'error');
        }
    }
    
    async processExcelFile(file, type) {
        addLog(`${type === 'thumbnail' ? 'サムネイル' : '詳細'}URL一覧（Excel）読み込み: ${file.name}`, 'info');
        
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                let urlCount = 0;
                
                jsonData.forEach(row => {
                    if (row[0]) {  // A列のURL
                        const url = row[0].toString().trim();
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                            this.processUrl(url, type);
                            urlCount++;
                        }
                    }
                });
                
                if (urlCount > 0) {
                    addLog(`${urlCount}件のURLを処理しました`, 'success');
                } else {
                    addLog('有効なURLが見つかりませんでした', 'error');
                }
            };
            
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            addLog(`URL一覧（Excel）読み込みエラー: ${error.message}`, 'error');
        }
    }
    
    processUrl(url, type) {
        const productNumber = extractProductNumber(url);
        
        if (!productNumber) {
            addLog(`商品番号を抽出できません: ${url}`, 'error');
            return;
        }
        
        const imageData = {
            url: url,
            name: url.split('/').pop(),
            isUrl: true
        };
        
        if (type === 'thumbnail') {
            // サムネイルURL
            if (this.app.thumbnailImages[productNumber]) {
                if (!confirm(`商品番号 ${productNumber} のサムネイルURLを上書きしますか？`)) {
                    return;
                }
            }
            
            this.app.addThumbnailImage(productNumber, imageData);
            addLog(`サムネイルURL登録: ${url} → 商品番号 ${productNumber}`, 'success');
            
        } else {
            // 詳細URL
            const success = this.app.addDetailImage(productNumber, imageData);
            if (success) {
                addLog(`詳細URL登録: ${url} → 商品番号 ${productNumber}`, 'success');
            }
        }
    }
    
    // URLの検証
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    // URLから画像拡張子をチェック
    isImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const lowercaseUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowercaseUrl.includes(ext));
    }
}