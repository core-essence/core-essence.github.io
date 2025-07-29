// ブラウザのコンソールで実行するデバッグコード

// 1. 現在の状態を確認
console.log('=== 現在の状態確認 ===');
console.log('APIキー設定:', document.getElementById('geminiApiKey').value ? 'あり' : 'なし');
console.log('商品データ数:', Object.keys(app.productData).length);
console.log('処理中の商品:', app.productGenerator);

// 2. Gemini APIを直接テスト
async function testGeminiAPI() {
    const apiKey = document.getElementById('geminiApiKey').value;
    if (!apiKey) {
        console.error('APIキーが設定されていません');
        return;
    }
    
    console.log('=== Gemini API 直接テスト開始 ===');
    
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const testPrompt = 'こんにちは。これはテストです。短く返答してください。';
    
    try {
        console.time('API呼び出し時間');
        
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: testPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 100,
                }
            })
        });
        
        console.timeEnd('API呼び出し時間');
        console.log('ステータスコード:', response.status);
        console.log('ヘッダー:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('レスポンス:', data);
        
        if (!response.ok) {
            console.error('APIエラー:', data.error);
        } else {
            console.log('✅ API接続成功！');
            if (data.candidates && data.candidates[0]) {
                console.log('回答:', data.candidates[0].content.parts[0].text);
            }
        }
        
    } catch (error) {
        console.error('エラー詳細:', error);
        console.error('エラー名:', error.name);
        console.error('エラーメッセージ:', error.message);
    }
}

// 3. ネットワークタブの保留中のリクエストを確認
console.log('\n=== ネットワーク確認 ===');
console.log('ネットワークタブで以下を確認してください:');
console.log('1. "generativelanguage.googleapis.com" へのリクエスト');
console.log('2. ステータスが "Pending" になっていないか');
console.log('3. リクエストの詳細（Headers, Payload）');

// 4. 処理を強制的に続行（タイムアウト付き）
async function forceProcessWithTimeout() {
    console.log('\n=== 強制処理（タイムアウト付き）===');
    
    // APIキーを一時的に無効化
    const originalApiKey = document.getElementById('geminiApiKey').value;
    document.getElementById('geminiApiKey').value = '';
    
    console.log('APIキーを無効化しました。デフォルト値で処理を続行します。');
    
    try {
        // 処理を再開
        await app.productGenerator.generateAll();
    } finally {
        // APIキーを復元
        document.getElementById('geminiApiKey').value = originalApiKey;
    }
}

// 5. 詳細なデバッグ情報を収集
function collectDebugInfo() {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        apiKey: document.getElementById('geminiApiKey').value ? 'Set' : 'Not set',
        apiKeyLength: document.getElementById('geminiApiKey').value?.length || 0,
        productCount: Object.keys(app.productData).length,
        products: Object.keys(app.productData),
        thumbnailImages: Object.keys(app.thumbnailImages),
        detailImages: Object.keys(app.detailImages),
        browserInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        }
    };
    
    console.log('\n=== デバッグ情報 ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // クリップボードにコピー
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
        .then(() => console.log('✅ デバッグ情報をクリップボードにコピーしました'))
        .catch(err => console.error('クリップボードへのコピー失敗:', err));
}

// 実行オプション
console.log('\n=== 実行可能なコマンド ===');
console.log('1. testGeminiAPI() - Gemini APIの接続テスト');
console.log('2. forceProcessWithTimeout() - APIなしで処理を強制続行');
console.log('3. collectDebugInfo() - デバッグ情報を収集');
console.log('4. app.productGenerator.generateAll() - 処理を再実行');

// 自動でAPIテストを実行
console.log('\n自動でAPIテストを開始します...');
testGeminiAPI();