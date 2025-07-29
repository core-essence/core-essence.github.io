// R2アップロードクラス
class R2Uploader {
    constructor() {
        this.endpoint = 'https://ec-site-images.9fbec0624aa8ebb5cb470d4b32662108.r2.cloudflarestorage.com';
        this.publicUrl = 'https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev';
        this.accessKeyId = '016edad8d98f07ad63d2496fa598910a';
        this.secretAccessKey = '873f37fbf751f5c157e7a861d70f6af683fa2d37bccfa5bbc25cb4ab3551d9c6';
        this.bucketName = 'ec-site-images';
    }
    
    // 画像をR2にアップロード
    async uploadImage(file, path) {
        try {
            addLog(`画像アップロード開始: ${path}`, 'info');
            
            // S3互換APIを使用してアップロード
            const date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
            const dateStamp = date.substr(0, 8);
            const region = 'auto';
            const service = 's3';
            
            // ファイルを読み込む
            const fileContent = await this.readFileAsArrayBuffer(file);
            
            // リクエストの準備
            const method = 'PUT';
            const canonicalUri = '/' + path;
            const canonicalQueryString = '';
            const payloadHash = await this.sha256(fileContent);
            
            // ヘッダーの準備
            const headers = {
                'Host': this.endpoint.replace('https://', ''),
                'Content-Type': file.type || 'application/octet-stream',
                'x-amz-content-sha256': payloadHash,
                'x-amz-date': date
            };
            
            // 正規リクエストの作成
            const canonicalHeaders = Object.keys(headers)
                .sort()
                .map(key => `${key.toLowerCase()}:${headers[key]}`)
                .join('\n') + '\n';
            
            const signedHeaders = Object.keys(headers)
                .sort()
                .map(key => key.toLowerCase())
                .join(';');
            
            const canonicalRequest = [
                method,
                canonicalUri,
                canonicalQueryString,
                canonicalHeaders,
                signedHeaders,
                payloadHash
            ].join('\n');
            
            // 署名の作成
            const algorithm = 'AWS4-HMAC-SHA256';
            const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
            const stringToSign = [
                algorithm,
                date,
                credentialScope,
                await this.sha256(canonicalRequest)
            ].join('\n');
            
            // 署名キーの生成
            const signingKey = await this.getSignatureKey(dateStamp, region, service);
            const signature = await this.hmacSHA256(signingKey, stringToSign);
            
            // Authorizationヘッダーの作成
            headers['Authorization'] = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
            
            // アップロードの実行
            const response = await fetch(`${this.endpoint}/${path}`, {
                method: 'PUT',
                headers: headers,
                body: fileContent
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            // 公開URLを返す
            const publicUrl = `${this.publicUrl}/${path}`;
            addLog(`画像アップロード成功: ${publicUrl}`, 'success');
            return publicUrl;
            
        } catch (error) {
            addLog(`画像アップロードエラー: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // ファイルをArrayBufferとして読み込む
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    // SHA256ハッシュの計算
    async sha256(data) {
        if (typeof data === 'string') {
            data = new TextEncoder().encode(data);
        }
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    // HMAC-SHA256の計算
    async hmacSHA256(key, data) {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            new TextEncoder().encode(data)
        );
        
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    // 署名キーの生成
    async getSignatureKey(dateStamp, region, service) {
        const kDate = await this.hmacSHA256Bytes(
            new TextEncoder().encode('AWS4' + this.secretAccessKey),
            dateStamp
        );
        const kRegion = await this.hmacSHA256Bytes(kDate, region);
        const kService = await this.hmacSHA256Bytes(kRegion, service);
        const kSigning = await this.hmacSHA256Bytes(kService, 'aws4_request');
        return kSigning;
    }
    
    // HMAC-SHA256（バイト配列を返す）
    async hmacSHA256Bytes(key, data) {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            new TextEncoder().encode(data)
        );
        
        return new Uint8Array(signature);
    }
}

// より簡単な代替実装（Cloudflare Workers経由）
class R2UploaderSimple {
    constructor() {
        this.publicUrl = 'https://pub-a2319224352d4abda31352be3c2b1c19.r2.dev';
        this.workerUrl = 'https://ec-image-uploader.archiver0922.workers.dev';
    }
    
    // 画像をアップロード
    async uploadImage(file, path) {
        try {
            addLog(`画像処理中: ${path}`, 'info');
            
            // ステップ6: FormDataを作成
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);
            
            // FormDataの内容をログに出力（確認用）
            addLog(`FormData作成完了:`, 'info');
            addLog(`- ファイル: ${file.name}`, 'info');
            addLog(`- パス: ${path}`, 'info');
            addLog(`- サイズ: ${(file.size / 1024).toFixed(2)} KB`, 'info');
            addLog(`- タイプ: ${file.type}`, 'info');
            
            // ステップ7: FormDataをCloudflare WorkerにPOST
            addLog(`Workerへの送信開始: ${this.workerUrl}/upload`, 'info');
            
            const response = await fetch(`${this.workerUrl}/upload`, {
                method: 'POST',
                body: formData
                // FormDataを送信する際、Content-Typeヘッダーは自動設定される
                // multipart/form-dataとboundaryが自動的に設定される
            });
            
            // レスポンスのステータスをチェック
            addLog(`Workerレスポンス: ${response.status} ${response.statusText}`, 'info');
            
            if (!response.ok) {
                // エラーレスポンスの詳細を取得
                let errorMessage = `Worker error: ${response.status}`;
                try {
                    const errorData = await response.text();
                    errorMessage += ` - ${errorData}`;
                } catch (e) {
                    // エラーテキストの取得に失敗した場合は無視
                }
                throw new Error(errorMessage);
            }
            
            // 成功レスポンスを解析
            const result = await response.json();
            addLog(`Worker応答: ${JSON.stringify(result)}`, 'success');
            
            // 【ステップ8-10はWorker側で処理される】
            // Worker側で画像がR2に保存される
            
            // 公開URLを返す
            const publicUrl = `${this.publicUrl}/${path}`;
            addLog(`画像URL: ${publicUrl}`, 'success');
            
            return publicUrl;
            
        } catch (error) {
            addLog(`画像処理エラー: ${error.message}`, 'error');
            
            // エラーが発生してもURLは返す（フォールバック）
            const publicUrl = `${this.publicUrl}/${path}`;
            addLog(`フォールバック - URL生成のみ: ${publicUrl}`, 'warning');
            return publicUrl;
        }
    }
}