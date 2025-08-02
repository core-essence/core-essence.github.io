/**
 * ProductAPIHandler - 外部API連携クラス
 * 
 * 機能：
 * - Gemini APIとの連携（商品説明文生成）
 * - R2へのアップロード（画像）
 * - 画像処理
 */

class ProductAPIHandler {
    constructor() {
        this.r2Uploader = new R2UploaderSimple();
        this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }
    
    // 画像処理
    async processImages(productNumber, thumbnailData, detailsData = []) {
        let thumbnailUrl = null;
        const detailUrls = [];
        
        // サムネイル画像の処理
        if (thumbnailData) {
            if (thumbnailData.isUrl) {
                // URLの場合はそのまま使用
                thumbnailUrl = thumbnailData.url;
                addLog(`サムネイルURL使用: ${thumbnailUrl}`, 'info');
            } else if (thumbnailData.file) {
                // ファイルの場合はR2にアップロード
                try {
                    const path = `products/${productNumber}-thumb.jpg`;
                    thumbnailUrl = await this.r2Uploader.uploadImage(thumbnailData.file, path);
                    addLog(`サムネイルアップロード成功: ${path}`, 'success');
                } catch (error) {
                    addLog(`サムネイルアップロード失敗: ${error.message}`, 'error');
                    // フォールバックとしてローカルURLを使用
                    thumbnailUrl = thumbnailData.url;
                }
            }
        }
        
        // 詳細画像の処理
        for (let i = 0; i < detailsData.length; i++) {
            const detailData = detailsData[i];
            
            if (detailData.isUrl) {
                // URLの場合はそのまま使用
                detailUrls.push(detailData.url);
                addLog(`詳細画像URL使用: ${detailData.url}`, 'info');
            } else if (detailData.file) {
                // ファイルの場合はR2にアップロード
                try {
                    const path = `products/${productNumber}-detail-${i + 1}.jpg`;
                    const url = await this.r2Uploader.uploadImage(detailData.file, path);
                    detailUrls.push(url);
                    addLog(`詳細画像アップロード成功: ${path}`, 'success');
                } catch (error) {
                    addLog(`詳細画像アップロード失敗: ${error.message}`, 'error');
                    // フォールバックとしてローカルURLを使用
                    detailUrls.push(detailData.url);
                }
            }
        }
        
        return {
            thumbnail: thumbnailUrl,
            details: detailUrls
        };
    }
    
    // 商品説明文の生成
    async generateDescription(product) {
        // APIキーの取得
        let apiKey = '';
        if (window.adminSettings) {
            apiKey = window.adminSettings.get('geminiApiKey');
        }
        
        // APIキーがある場合はGemini APIを使用
        if (apiKey) {
            try {
                const description = await this.callGeminiAPI(product, apiKey);
                addLog('Gemini APIで説明文を生成しました', 'success');
                return description;
            } catch (error) {
                addLog('Gemini API エラー、デフォルト説明文を使用します: ' + error.message, 'warning');
            }
        }
        
        // デフォルトの説明文を生成
        return this.generateDefaultDescription(product);
    }
    
    // Gemini API呼び出し
    async callGeminiAPI(product, apiKey) {
        const prompt = this.createPrompt(product);
        
        const response = await fetch(`${this.geminiEndpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
    
    // Gemini API用のプロンプト作成
    createPrompt(product) {
        let prompt = `以下の商品の魅力的な説明文を日本語で生成してください：\n\n`;
        prompt += `商品名: ${product.productName}\n`;
        
        if (product.brandName) {
            prompt += `ブランド: ${product.brandName}\n`;
        }
        
        if (product.category) {
            prompt += `カテゴリー: ${product.category}\n`;
        }
        
        if (product.material) {
            prompt += `素材: ${product.material}\n`;
        }
        
        if (product.colors && product.colors.length > 0) {
            prompt += `カラー: ${product.colors.join(', ')}\n`;
        }
        
        if (product.sizes && product.sizes.length > 0) {
            prompt += `サイズ: ${product.sizes.join(', ')}\n`;
        }
        
        prompt += `\n説明文は4-5段落で、各段落は1-2文程度にしてください。`;
        prompt += `商品の特徴、素材の良さ、使用シーン、お手入れ方法などを含めてください。`;
        
        return prompt;
    }
    
    // デフォルトの説明文生成
    generateDefaultDescription(product) {
        const descriptions = [];
        
        // 基本的な商品説明
        descriptions.push(`${product.productName}は、${product.brandName || 'AMINATI'}の人気アイテムです。`);
        
        // カテゴリーに基づく説明
        if (product.category) {
            const categoryDescriptions = {
                'Tシャツ': 'シンプルで着回しやすいデザインが特徴的で、デイリーユースに最適です。',
                'シャツ': '上品な仕上がりで、ビジネスからカジュアルまで幅広いシーンで活躍します。',
                'パンツ': 'シルエットにこだわり、快適な履き心地を実現しています。',
                'ジャケット': '季節の変わり目に重宝する、スタイリッシュなアウターです。',
                'ニット': '柔らかな肌触りと暖かさを兼ね備えた、秋冬の定番アイテムです。',
                'バッグ': '機能性とデザイン性を両立した、使い勝手の良いアイテムです。',
                'シューズ': '快適な履き心地と洗練されたデザインが魅力です。'
            };
            
            const categoryDesc = categoryDescriptions[product.category] || 
                                `${product.category}カテゴリーの中でも特に人気の高いアイテムです。`;
            descriptions.push(categoryDesc);
        }
        
        // 素材についての説明
        if (product.material) {
            descriptions.push(`素材には${product.material}を使用し、品質にこだわって製作されています。`);
        } else {
            descriptions.push('上質な素材を使用し、快適な着心地を実現しています。');
        }
        
        // 価格についての説明
        if (product.originalPrice && product.originalPrice > product.salePrice) {
            const discountRate = Math.round((1 - product.salePrice / product.originalPrice) * 100);
            descriptions.push(`今なら特別価格、${discountRate}%OFFでご提供中です。`);
        }
        
        // カラーバリエーション
        if (product.colors && product.colors.length > 1) {
            descriptions.push(`${product.colors.length}色のカラーバリエーションからお選びいただけます。`);
        }
        
        // サイズ展開
        if (product.sizes && product.sizes.length > 0) {
            descriptions.push(`サイズは${product.sizes.join('、')}をご用意しています。`);
        }
        
        // お手入れと品質
        descriptions.push('丁寧な仕上げで長くご愛用いただける品質です。');
        descriptions.push('お手入れも簡単で、日常使いに最適なアイテムです。');
        
        // 締めの文
        descriptions.push('ぜひこの機会にお買い求めください。');
        
        return descriptions.join('\n');
    }
}

// R2アップローダー（簡易版）
class R2UploaderSimple {
    constructor() {
        this.publicUrl = 'https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev';
        this.workerUrl = 'https://ec-image-uploader.archiver0922.workers.dev';
    }
    
    async uploadImage(file, path) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        
        const response = await fetch(this.workerUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.url) {
            return result.url;
        } else {
            // フォールバック：公開URLを推測
            return `${this.publicUrl}/${path}`;
        }
    }
}