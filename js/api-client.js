// Gemini APIクライアント
class GeminiAPIClient {
    constructor() {
        this.endpoint = CONFIG.API.GEMINI_ENDPOINT;
        this.timeout = 30000; // 30秒のタイムアウト
        this.maxRetries = 3; // 最大リトライ回数
    }
    
    async generateDescription(productName, apiKey) {
        if (!apiKey) {
            throw new Error('APIキーが設定されていません');
        }
        
        const prompt = this.createPrompt(productName);
        
        // リトライロジック付きでAPIを呼び出し
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                addLog(`Gemini API 呼び出し中... (試行 ${attempt}/${this.maxRetries})`, 'info');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(`${this.endpoint}?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 500,
                        }
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `API Error: ${response.status}`;
                    
                    // 429エラー（レート制限）の場合は少し待ってリトライ
                    if (response.status === 429 && attempt < this.maxRetries) {
                        addLog(`レート制限エラー。${attempt * 2}秒後にリトライします...`, 'warning');
                        await this.sleep(attempt * 2000);
                        continue;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const generatedText = data.candidates[0].content.parts[0].text;
                    addLog('商品説明文の生成成功', 'success');
                    return this.cleanDescription(generatedText);
                }
                
                throw new Error('予期しないAPIレスポンス形式');
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    addLog(`タイムアウトエラー (${this.timeout / 1000}秒)`, 'error');
                    if (attempt < this.maxRetries) {
                        addLog(`${attempt + 1}回目の試行を開始します...`, 'info');
                        await this.sleep(1000);
                        continue;
                    }
                } else {
                    addLog(`Gemini API エラー: ${error.message}`, 'error');
                    if (attempt < this.maxRetries && !error.message.includes('401')) {
                        await this.sleep(1000);
                        continue;
                    }
                }
                
                if (attempt === this.maxRetries) {
                    throw error;
                }
            }
        }
    }
    
    createPrompt(productName) {
        return `以下の商品名から、ECサイト用の商品説明文を生成してください。

商品名: ${productName}

以下の条件で説明文を作成してください：
- 200-300文字程度
- 商品の魅力を抽象的に表現
- 具体的な仕様や数値は書かない
- 上質さ、快適さ、デザイン性を強調
- どんな商品にも適用できる汎用的な内容
- 「です・ます」調で統一
- 改行は2回まで

説明文のみを出力してください。前置きや補足は不要です。`;
    }
    
    cleanDescription(text) {
        // 不要な前置きや後書きを削除
        let cleaned = text
            .replace(/^.*?説明文[:：]\s*/s, '')
            .replace(/^.*?以下.*?[:：]\s*/s, '')
            .replace(/\n{3,}/g, '\n\n')  // 3つ以上の改行を2つに
            .trim();
        
        // 300文字を超える場合は切り詰め
        if (cleaned.length > 300) {
            // 最後の句点で切る
            const lastPeriod = cleaned.lastIndexOf('。', 300);
            if (lastPeriod > 200) {
                cleaned = cleaned.substring(0, lastPeriod + 1);
            } else {
                cleaned = cleaned.substring(0, 297) + '...';
            }
        }
        
        return cleaned;
    }
    
    // APIキーの検証
    validateApiKey(apiKey) {
        if (!apiKey) {
            return false;
        }
        
        // Gemini APIキーの基本的な形式チェック
        // AIzaSy で始まる39文字
        return /^AIzaSy[a-zA-Z0-9_-]{33}$/.test(apiKey);
    }
    
    // スリープ関数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// R2 APIクライアント（将来の実装用）
class R2APIClient {
    constructor() {
        this.baseUrl = CONFIG.R2.BASE_URL;
        this.productsPath = CONFIG.R2.PRODUCTS_PATH;
    }
    
    // 画像アップロード（実装例）
    async uploadImage(file, productNumber, type) {
        // 実際のR2アップロードには、サーバーサイドのAPIが必要
        // ここでは構造のみ示す
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productNumber', productNumber);
        formData.append('type', type);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            
            const result = await response.json();
            return result.url;
            
        } catch (error) {
            addLog(`画像アップロードエラー: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 画像URLの生成
    generateImageUrl(productNumber, type) {
        return `${this.baseUrl}${this.productsPath}${productNumber}-${type}.jpg`;
    }
}