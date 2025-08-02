import requests
import json
from datetime import datetime

# Workerのエンドポイント
WORKER_URL = "https://ec-image-uploader.archiver0922.workers.dev"

print("=" * 60)
print("R2 アップロードテスト開始")
print("=" * 60)

# 1. ヘルスチェック
print("\n[1] ヘルスチェック...")
try:
    response = requests.get(f"{WORKER_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"エラー: {e}")

# 2. 基本的な接続テスト
print("\n[2] 基本接続テスト...")
try:
    response = requests.get(WORKER_URL)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"エラー: {e}")

# 3. テスト画像アップロード
print("\n[3] 画像アップロードテスト...")
print("テスト用の1x1ピクセルの画像を作成しています...")

# 最小限のPNG画像データ（1x1ピクセル、赤色）
png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

# テスト用のファイル名とパス
test_filename = f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
test_path = f"test/{test_filename}"

# FormDataを作成
files = {
    'file': (test_filename, png_data, 'image/png'),
}
data = {
    'path': test_path
}

print(f"アップロードファイル: {test_filename}")
print(f"アップロードパス: {test_path}")
print(f"ファイルサイズ: {len(png_data)} bytes")

try:
    # POSTリクエストを送信
    response = requests.post(
        f"{WORKER_URL}/upload",
        files=files,
        data=data
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    # レスポンスボディを表示
    try:
        json_response = response.json()
        print(f"\nResponse Body (JSON):")
        print(json.dumps(json_response, indent=2, ensure_ascii=False))
        
        # エラーメッセージがある場合は強調表示
        if 'error' in json_response:
            print(f"\n⚠️ エラーメッセージ: {json_response['error']}")
            if 'hint' in json_response:
                print(f"💡 ヒント: {json_response['hint']}")
                
    except json.JSONDecodeError:
        print(f"\nResponse Body (Text):")
        print(response.text)
        
except requests.exceptions.RequestException as e:
    print(f"\nリクエストエラー: {e}")
except Exception as e:
    print(f"\n予期しないエラー: {e}")

# 4. 生成されるはずのURL
expected_url = f"https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev/{test_path}"
print(f"\n[4] 期待されるURL:")
print(expected_url)

# 5. 実際にそのURLにアクセスしてみる
print(f"\n[5] 生成されたURLへのアクセステスト...")
try:
    check_response = requests.head(expected_url)
    print(f"Status Code: {check_response.status_code}")
    if check_response.status_code == 200:
        print("✅ 画像が正常にアップロードされています！")
    elif check_response.status_code == 404:
        print("❌ 画像が見つかりません（アップロードが失敗している可能性）")
    else:
        print(f"⚠️ 予期しないステータスコード")
except Exception as e:
    print(f"エラー: {e}")

print("\n" + "=" * 60)
print("テスト完了")
print("=" * 60)