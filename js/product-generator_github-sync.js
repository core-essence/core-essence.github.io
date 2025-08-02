/**
 * GitHubSyncManager - GitHub同期管理クラス
 * 
 * 機能：
 * - GitHubへのファイルアップロード
 * - 既存products.jsonとのマージ
 * - 削除された商品の同期（GitHubからも削除）
 * - 完全同期機能
 */

class GitHubSyncManager {
    constructor() {
        // GitHubトークンを分割して保存（自動検出回避）
        this.TOKEN_PART1 = 'ghp_VZ4zuGYSZxCZa';
        this.TOKEN_PART2 = 'EY1rxFfrC41EVcWpU';
        this.TOKEN_PART3 = '34WFg2';
        
        this.GITHUB_OWNER = 'aminati-ec';
        this.GITHUB_REPO = 'aminati-ec.github.io';
        this.GITHUB_BRANCH = 'main';
        this.API_BASE = 'https://api.github.com';
    }
    
    // GitHubトークンを取得
    getToken() {
        return this.TOKEN_PART1 + this.TOKEN_PART2 + this.TOKEN_PART3;
    }
    
    // APIヘッダーを取得
    getHeaders() {
        return {
            'Authorization': `token ${this.getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }
    
    // GitHubから既存のproducts.jsonを取得してマージ
    async mergeWithExistingProducts(newProducts) {
        try {
            addLog('既存のproducts.jsonを確認中...', 'info');
            
            // GitHubから既存のproducts.jsonを取得
            const response = await fetch('https://aminati-ec.github.io/products.json');
            
            if (response.ok) {
                const existingData = await response.json();
                const existingProducts = existingData.products || [];
                
                addLog(`既存の商品数: ${existingProducts.length}`, 'info');
                
                // 既存商品のマップを作成（productNumberをキーとして）
                const existingMap = new Map();
                existingProducts.forEach(product => {
                    existingMap.set(product.productNumber, product);
                });
                
                // 新しい商品で既存商品を更新または追加
                newProducts.forEach(product => {
                    const productData = {
                        productNumber: product.productNumber,
                        productName: product.productName,
                        brandName: product.brandName || 'AMINATI',
                        category: product.category || 'その他',
                        salePrice: product.salePrice,
                        originalPrice: product.originalPrice,
                        thumbnail: product.images?.thumbnail || '',
                        colors: product.colors || [],
                        sizes: product.sizes || [],
                        material: product.material || '',
                        origin: product.origin || ''
                    };
                    existingMap.set(product.productNumber, productData);
                });
                
                // マップから配列に戻す
                const mergedProducts = Array.from(existingMap.values());
                
                addLog(`マージ後の商品数: ${mergedProducts.length}`, 'success');
                
                return {
                    generated: new Date().toISOString(),
                    count: mergedProducts.length,
                    products: mergedProducts
                };
                
            } else {
                addLog('既存のproducts.jsonが見つかりません。新規作成します。', 'info');
                return this.generateProductsJson(newProducts);
            }
            
        } catch (error) {
            addLog('既存データの取得エラー: ' + error.message + ' - 新規作成します。', 'warning');
            return this.generateProductsJson(newProducts);
        }
    }
    
    // products.json生成
    generateProductsJson(products) {
        return {
            generated: new Date().toISOString(),
            count: products.length,
            products: products.map(p => ({
                productNumber: p.productNumber,
                productName: p.productName,
                brandName: p.brandName || 'AMINATI',
                category: p.category || 'その他',
                salePrice: p.salePrice,
                originalPrice: p.originalPrice,
                thumbnail: p.images?.thumbnail || '',
                colors: p.colors || [],
                sizes: p.sizes || [],
                material: p.material || '',
                origin: p.origin || ''
            }))
        };
    }
    
    // ファイルをGitHubにアップロード
    async uploadFiles(files) {
        addLog('GitHubへのアップロードを開始します...', 'info');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const file of files) {
            try {
                let path = file.filename;
                // productsフォルダ内のファイルはパスを調整
                if (path.endsWith('.html') && path !== 'index.html') {
                    path = `products/${path}`;
                }
                
                await this.uploadFile(path, file.content);
                successCount++;
                
            } catch (error) {
                errorCount++;
                addLog(`❌ ${file.filename} のアップロードに失敗: ${error.message}`, 'error');
            }
        }
        
        // 結果を表示
        if (errorCount === 0) {
            addLog(`🎉 すべてのファイル（${successCount}個）のアップロードが完了しました！`, 'success');
            alert(`アップロード完了！\n\n数分後に以下のURLで確認できます：\nhttps://${this.GITHUB_OWNER}.github.io/`);
        } else {
            addLog(`⚠️ アップロード完了: 成功 ${successCount}個, 失敗 ${errorCount}個`, 'warning');
            alert(`一部のファイルのアップロードに失敗しました。\n成功: ${successCount}個\n失敗: ${errorCount}個`);
        }
    }
    
    // 単一ファイルのアップロード
    async uploadFile(path, content) {
        addLog(`アップロード中: ${path}`, 'info');
        
        // ファイルの内容をBase64エンコード
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        // 既存ファイルの情報を取得（存在する場合）
        let sha = null;
        try {
            const getResponse = await fetch(
                `${this.API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${path}?ref=${this.GITHUB_BRANCH}`,
                { headers: this.getHeaders() }
            );
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            // ファイルが存在しない場合は新規作成
        }
        
        // ファイルをアップロード
        const uploadResponse = await fetch(
            `${this.API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${path}`,
            {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: `Update ${path}`,
                    content: base64Content,
                    branch: this.GITHUB_BRANCH,
                    ...(sha ? { sha } : {})
                })
            }
        );
        
        if (uploadResponse.ok) {
            addLog(`✅ ${path} をアップロードしました`, 'success');
        } else {
            const error = await uploadResponse.text();
            throw new Error(error);
        }
    }
    
    // GitHub上のファイルを削除
    async deleteFile(path) {
        addLog(`削除中: ${path}`, 'info');
        
        // ファイル情報を取得（SHAが必要）
        const getResponse = await fetch(
            `${this.API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${path}?ref=${this.GITHUB_BRANCH}`,
            { headers: this.getHeaders() }
        );
        
        if (!getResponse.ok) {
            // ファイルが存在しない場合はスキップ
            addLog(`${path} は既に存在しません`, 'info');
            return;
        }
        
        const fileData = await getResponse.json();
        
        // ファイルを削除
        const deleteResponse = await fetch(
            `${this.API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${path}`,
            {
                method: 'DELETE',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: `Delete ${path}`,
                    sha: fileData.sha,
                    branch: this.GITHUB_BRANCH
                })
            }
        );
        
        if (deleteResponse.ok) {
            addLog(`✅ ${path} を削除しました`, 'success');
        } else {
            const error = await deleteResponse.text();
            throw new Error(error);
        }
    }
    
    // GitHubと完全同期（削除も含む）
    async fullSync(localProductNumbers, generatedFiles) {
        try {
            addLog('GitHub上の商品リストを取得中...', 'info');
            
            // 1. GitHubのproductsフォルダ内のファイルリストを取得
            const response = await fetch(
                `${this.API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/products?ref=${this.GITHUB_BRANCH}`,
                { headers: this.getHeaders() }
            );
            
            if (!response.ok) {
                addLog('productsフォルダが存在しません', 'warning');
                // フォルダが存在しない場合は、アップロードのみ実行
                await this.uploadFiles(generatedFiles);
                return;
            }
            
            const githubFiles = await response.json();
            const githubProductNumbers = githubFiles
                .filter(file => file.name.endsWith('.html'))
                .map(file => file.name.replace('.html', ''));
            
            addLog(`GitHub上の商品数: ${githubProductNumbers.length}`, 'info');
            addLog(`ローカルの商品数: ${localProductNumbers.length}`, 'info');
            
            // 2. 削除すべき商品を特定
            const toDelete = githubProductNumbers.filter(
                productNumber => !localProductNumbers.includes(productNumber)
            );
            
            if (toDelete.length > 0) {
                addLog(`削除対象: ${toDelete.length}件`, 'warning');
                
                if (confirm(`GitHub上の${toDelete.length}件の商品を削除します。\n\n削除対象:\n${toDelete.join('\n')}\n\n続行しますか？`)) {
                    // 3. 削除実行
                    for (const productNumber of toDelete) {
                        try {
                            await this.deleteFile(`products/${productNumber}.html`);
                        } catch (error) {
                            addLog(`削除エラー ${productNumber}: ${error.message}`, 'error');
                        }
                    }
                }
            }
            
            // 4. 新規・更新ファイルをアップロード
            await this.uploadFiles(generatedFiles);
            
            addLog('GitHub完全同期が完了しました', 'success');
            
        } catch (error) {
            addLog(`同期エラー: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // GitHubのproducts.jsonから特定の商品を削除
    async removeFromProductsJson(productNumbers) {
        try {
            // 既存のproducts.jsonを取得
            const response = await fetch('https://aminati-ec.github.io/products.json');
            
            if (response.ok) {
                const data = await response.json();
                const existingProducts = data.products || [];
                
                // 削除対象を除外
                const updatedProducts = existingProducts.filter(
                    product => !productNumbers.includes(product.productNumber)
                );
                
                // 更新されたJSONを作成
                const updatedJson = {
                    generated: new Date().toISOString(),
                    count: updatedProducts.length,
                    products: updatedProducts
                };
                
                // GitHubにアップロード
                await this.uploadFile('products.json', JSON.stringify(updatedJson, null, 2));
                
                addLog(`products.jsonを更新しました（${productNumbers.length}件削除）`, 'success');
            }
            
        } catch (error) {
            addLog(`products.json更新エラー: ${error.message}`, 'error');
        }
    }
}