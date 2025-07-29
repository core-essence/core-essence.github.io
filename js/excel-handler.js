// Excel処理クラス
class ExcelHandler {
    constructor(app) {
        this.app = app;
    }
    
    async handleFiles(files) {
        for (const file of files) {
            if (isExcelFile(file)) {
                await this.processExcel(file);
            }
        }
    }
    
    async processExcel(file) {
        addLog(`Excel ファイル読み込み開始: ${file.name}`, 'info');
        
        try {
            const data = await this.readExcelFile(file);
            const products = this.parseExcelData(data);
            
            if (Object.keys(products).length === 0) {
                addLog('商品データが見つかりませんでした', 'error');
                return;
            }
            
            this.app.updateProductData(products);
            addLog(`${Object.keys(products).length}件の商品を読み込みました`, 'success');
            
        } catch (error) {
            addLog(`Excel 読み込みエラー: ${error.message}`, 'error');
        }
    }
    
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    parseExcelData(jsonData) {
        const products = {};
        
        // ヘッダー行の検証
        if (jsonData.length < 2) {
            throw new Error('Excelファイルにデータがありません');
        }
        
        const headers = jsonData[CONFIG.EXCEL.HEADER_ROW];
        if (!this.validateHeaders(headers)) {
            throw new Error('Excelファイルのヘッダーが正しくありません');
        }
        
        // データ行の処理
        for (let row = CONFIG.EXCEL.DATA_START_ROW; row < jsonData.length; row++) {
            const rowData = jsonData[row];
            
            if (rowData && rowData[0]) {  // 商品番号がある行のみ処理
                try {
                    const product = this.createProductFromRow(rowData);
                    products[product.productNumber] = product;
                    addLog(`商品登録: ${product.productNumber} - ${product.productName}`, 'success');
                } catch (error) {
                    addLog(`行 ${row + 1} の処理エラー: ${error.message}`, 'error');
                }
            }
        }
        
        return products;
    }
    
    validateHeaders(headers) {
        // 必須ヘッダーの確認
        const requiredHeaders = ['商品番号', 'ブランド名', '商品名', '販売価格'];
        return requiredHeaders.every(header => 
            headers.some(h => h && h.toString().includes(header))
        );
    }
    
    createProductFromRow(rowData) {
        // 商品オブジェクトの作成
        const product = {
            productNumber: rowData[0].toString().trim(),
            brandName: rowData[1] ? rowData[1].toString().trim() : '',
            productName: rowData[2] ? rowData[2].toString().trim() : '',
            salePrice: this.parsePrice(rowData[3]),
            originalPrice: this.parsePrice(rowData[4]),
            material: rowData[5] ? rowData[5].toString().trim() : '',
            origin: rowData[6] ? rowData[6].toString().trim() : '',
            colors: parseArrayField(rowData[7]),
            sizes: parseArrayField(rowData[8])
        };
        
        // 必須フィールドの検証
        if (!product.productNumber) {
            throw new Error('商品番号が空です');
        }
        if (!product.productName) {
            throw new Error('商品名が空です');
        }
        if (!product.salePrice) {
            throw new Error('販売価格が不正です');
        }
        
        return product;
    }
    
    parsePrice(value) {
        if (!value) return '';
        
        // 数値に変換（カンマや円記号を除去）
        const price = String(value)
            .replace(/[,，円¥]/g, '')
            .trim();
        
        const numPrice = parseFloat(price);
        return isNaN(numPrice) ? '' : numPrice.toString();
    }
}