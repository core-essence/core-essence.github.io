import requests
import json
import os
from datetime import datetime

# Workerのエンドポイント
WORKER_URL = "https://ec-image-uploader.archiver0922.workers.dev"

# テストするファイルのパス
TEST_FILE_PATH = r"C:\Users\archi\Desktop\テスト画像\test.jpg"

print("=" * 60)
print("実際のファイルでR2アップロードテスト")
print("=" * 60)

# ファイルの存在確認
if not os.path.exists(TEST_FILE_PATH):
    print(f"❌ エラー: ファイルが見つかりません: {TEST_FILE_PATH}")
    print("ファイルパスを確認してください。")
    exit(1)

# ファイル情報を表示
file_size = os.path.getsize(TEST_FILE_PATH)
print(f"\n📁 テストファイル情報:")
print(f"パス: {TEST_FILE_PATH}")
print(f"サイズ: {file_size:,} bytes ({file_size/1024:.2f} KB)")

# アップロード先のパスを生成（商品番号風に）
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
product_number = f"TEST{timestamp}"
upload_path = f"products/{product_number}-thumb.jpg"

print(f"\n📤 アップロード設定:")
print(f"商品番号: {product_number}")
print(f"アップロードパス: {upload_path}")

# ファイルを開いてアップロード
try:
    with open(TEST_FILE_PATH, 'rb') as f:
        file_data = f.read()
        
    # FormDataを作成
    files = {
        'file': ('test.jpg', file_data, 'image/jpeg'),
    }
    data = {
        'path': upload_path
    }
    
    print(f"\n🚀 アップロード実行中...")
    print(f"送信先: {WORKER_URL}/upload")
    
    # リクエストのヘッダーを追加（デバッグ用）
    headers = {
        'User-Agent': 'AMINATI-EC-Test/1.0'
    }
    
    # POSTリクエストを送信
    response = requests.post(
        f"{WORKER_URL}/upload",
        files=files,
        data=data,
        headers=headers,
        timeout=30  # 30秒のタイムアウト
    )
    
    print(f"\n📨 レスポンス情報:")
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {response.elapsed.total_seconds():.2f}秒")
    
    # レスポンスヘッダーの一部を表示
    print(f"\n📋 レスポンスヘッダー（抜粋）:")
    for key in ['Content-Type', 'CF-RAY', 'Server']:
        if key in response.headers:
            print(f"{key}: {response.headers[key]}")
    
    # レスポンスボディを解析
    print(f"\n📄 レスポンスボディ:")
    try:
        json_response = response.json()
        print(json.dumps(json_response, indent=2, ensure_ascii=False))
        
        # 重要な情報を強調表示
        if json_response.get('success'):
            print(f"\n✅ アップロード成功!")
            if 'data' in json_response and 'url' in json_response['data']:
                generated_url = json_response['data']['url']
                print(f"生成されたURL: {generated_url}")
        else:
            print(f"\n❌ アップロード失敗!")
            if 'error' in json_response:
                print(f"エラーメッセージ: {json_response['error']}")
                
    except json.JSONDecodeError:
        print("JSONとして解析できませんでした。生のレスポンス:")
        print(response.text[:500])  # 最初の500文字のみ表示
        
except requests.exceptions.Timeout:
    print(f"\n⏱️ タイムアウト: リクエストが30秒以内に完了しませんでした")
except requests.exceptions.RequestException as e:
    print(f"\n🔥 リクエストエラー: {e}")
except Exception as e:
    print(f"\n💥 予期しないエラー: {type(e).__name__}: {e}")

# アップロードされたはずのURLを確認
if 'json_response' in locals() and json_response.get('success'):
    expected_url = f"https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev/{upload_path}"
    
    print(f"\n🔍 アップロード確認:")
    print(f"確認URL: {expected_url}")
    
    import time
    print("3秒待機中...")
    time.sleep(3)  # R2への反映を待つ
    
    try:
        # HEADリクエストで存在確認
        check_response = requests.head(expected_url, timeout=10)
        print(f"Status Code: {check_response.status_code}")
        
        if check_response.status_code == 200:
            print("✅ 画像が正常にR2に保存されています！")
            print(f"Content-Type: {check_response.headers.get('Content-Type', 'N/A')}")
            print(f"Content-Length: {check_response.headers.get('Content-Length', 'N/A')} bytes")
        elif check_response.status_code == 404:
            print("❌ 画像が見つかりません - アップロードは実行されていない可能性があります")
        elif check_response.status_code == 401:
            print("⚠️ 401 Unauthorized - R2バケットへのアクセス権限の問題")
        else:
            print(f"⚠️ 予期しないステータスコード: {check_response.status_code}")
            
        # 実際に画像を取得してみる
        print(f"\n🖼️ 画像の取得テスト:")
        get_response = requests.get(expected_url, timeout=10, stream=True)
        if get_response.status_code == 200:
            content_length = int(get_response.headers.get('Content-Length', 0))
            print(f"✅ 画像を取得できました (サイズ: {content_length:,} bytes)")
        else:
            print(f"❌ 画像を取得できません (Status: {get_response.status_code})")
            
    except Exception as e:
        print(f"確認中にエラー: {e}")

print("\n" + "=" * 60)
print("テスト完了")
print("=" * 60)

# Cloudflareダッシュボードで確認すべきこと
print("\n💡 確認事項:")
print("1. Cloudflareダッシュボードにログイン")
print("2. R2 → ec-site-images → オブジェクト")
print(f"3. products/{product_number}-thumb.jpg が存在するか確認")
print("4. Workers & Pages → ec-image-uploader → Logs でエラーを確認")