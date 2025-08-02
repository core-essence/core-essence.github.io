import os
import shutil
from datetime import datetime
from pathlib import Path

# 必要なファイル（これらは移動しない）
REQUIRED_FILES = {
    # === 管理画面（ローカル環境用） ===
    'admin.html',           # 商品登録画面
    'admin-manual.html',    # 使用説明書
    'admin-orders.html',    # 注文管理画面
    'admin-products.html',  # 商品管理画面
    
    # === 公開ページ（GitHub Pages用） ===
    'index.html',           # トップページ（商品一覧）
    'trade.html',           # お取引について
    'company.html',         # 会社概要  
    'contact.html',         # お問い合わせ
    
    # === システムファイル ===
    'category_classifier.py',  # カテゴリー分類システム
    
    # === ドキュメント ===
    'readme-md.md',         # 運用マニュアル
    
    # このクリーンアップスクリプト自体
    'cleanup_aminati_ec.py'
}

# 必要なJSファイル（jsフォルダ内）
REQUIRED_JS_FILES = {
    # === 基盤・設定系 ===
    'config.js',            # 設定ファイル
    'admin-settings.js',    # 管理設定
    'utils.js',             # ユーティリティ関数
    
    # === API・サービス系 ===
    'api-client.js',        # API通信
    'r2-uploader.js',       # Cloudflare R2画像アップロード
    'email-notification.js', # メール通知
    
    # === データ処理系 ===
    'excel-handler.js',     # Excel処理
    'image-handler.js',     # 画像処理
    'url-handler.js',       # URL処理
    'product-storage.js',   # 商品データ保存
    
    # === UI・生成系 ===
    'html-template-generator.js',    # HTMLテンプレート生成
    'javascript-code-generator.js',  # JavaScriptコード生成
    'post-generation-manager.js',    # 生成後処理管理
    'product-generator.js',          # 商品ページ生成
    
    # === UI管理・アプリ統合 ===
    'ui-manager.js',        # UI管理
    'app.js',              # メインアプリケーション
    
    # === 購入フロー ===
    'purchase-flow.js',     # 購入フロー処理
}

# 必要なフォルダ（これらは移動しない）
REQUIRED_FOLDERS = {
    'css',      # スタイルシート
    'js',       # JavaScriptファイル（中身は選別）
    'products', # 商品ページ保存用（もし存在すれば）
}

def create_backup_folder():
    """バックアップフォルダを作成"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_folder = f'_archive_unused_{timestamp}'
    os.makedirs(backup_folder, exist_ok=True)
    return backup_folder

def should_move_file(filepath, is_js_folder=False):
    """ファイルを移動すべきか判定"""
    filename = os.path.basename(filepath)
    
    if is_js_folder:
        # jsフォルダ内のファイルは必要リストで判定
        return filename not in REQUIRED_JS_FILES
    else:
        # ルートフォルダのファイルは必要リストで判定
        return filename not in REQUIRED_FILES

def analyze_folder_contents(folder_path):
    """フォルダの中身を分析"""
    contents = []
    try:
        for item in folder_path.iterdir():
            if item.is_file():
                contents.append(f"  └─ {item.name}")
    except Exception as e:
        contents.append(f"  └─ エラー: {e}")
    return contents

def organize_files():
    """ファイルを整理"""
    print("=" * 60)
    print("🧹 AMINATI_EC 不要ファイル整理スクリプト")
    print("=" * 60)
    
    # 現在のディレクトリ
    current_dir = Path.cwd()
    print(f"📁 作業ディレクトリ: {current_dir}")
    
    # バックアップフォルダ作成
    backup_folder = create_backup_folder()
    backup_path = current_dir / backup_folder
    print(f"📦 アーカイブフォルダ: {backup_folder}")
    
    # 移動したファイルのカウント
    moved_count = 0
    moved_items = []
    
    print("\n📋 ファイルの移動を開始します...")
    
    # ルートディレクトリのファイルを処理
    for item in current_dir.iterdir():
        # バックアップフォルダ自体はスキップ
        if item.name.startswith('_archive_unused_'):
            continue
            
        # フォルダの処理
        if item.is_dir():
            # 必要なフォルダ以外は移動
            if item.name not in REQUIRED_FOLDERS:
                dest = backup_path / item.name
                print(f"  📁 {item.name}/ → アーカイブへ移動")
                # フォルダの中身を表示
                contents = analyze_folder_contents(item)
                for content in contents:
                    print(content)
                shutil.move(str(item), str(dest))
                moved_count += 1
                moved_items.append(('folder', item.name))
            continue
        
        # ファイルの処理
        if should_move_file(item.name):
            dest = backup_path / item.name
            print(f"  📄 {item.name} → アーカイブへ移動")
            shutil.move(str(item), str(dest))
            moved_count += 1
            moved_items.append(('file', item.name))
    
    # jsフォルダ内のファイルを処理
    js_dir = current_dir / 'js'
    if js_dir.exists():
        print("\n📂 jsフォルダ内の整理...")
        for item in js_dir.iterdir():
            if item.is_file() and should_move_file(item.name, is_js_folder=True):
                dest = backup_path / 'js_files' / item.name
                dest.parent.mkdir(exist_ok=True)
                print(f"  📄 js/{item.name} → アーカイブへ移動")
                shutil.move(str(item), str(dest))
                moved_count += 1
                moved_items.append(('js', item.name))
    
    print(f"\n✅ 完了: {moved_count}個のファイル/フォルダを移動しました")
    
    # 結果サマリー
    print("\n📊 整理結果:")
    
    # カテゴリ別に集計
    test_files = [item for type, item in moved_items if 'test' in item.lower() or 'debug' in item.lower()]
    backup_folders = [item for type, item in moved_items if type == 'folder' and ('バックアップ' in item or 'backup' in item.lower())]
    package_files = [item for type, item in moved_items if 'package' in item]
    
    print(f"  テスト・デバッグ関連: {len(test_files)}個")
    if test_files:
        for f in test_files[:3]:
            print(f"    - {f}")
        if len(test_files) > 3:
            print(f"    ... 他 {len(test_files) - 3}個")
    
    print(f"\n  バックアップフォルダ: {len(backup_folders)}個")
    if backup_folders:
        for f in backup_folders:
            print(f"    - {f}/")
    
    print(f"\n  package関連: {len(package_files)}個")
    if package_files:
        for f in package_files:
            print(f"    - {f}")
    
    # 残ったファイルの確認
    print("\n✅ 本番システムファイル（残されたファイル）:")
    
    print("\n【管理画面】")
    admin_files = sorted([f for f in current_dir.glob('admin*.html')])
    for file in admin_files:
        print(f"  ✓ {file.name}")
    
    print("\n【公開ページ】")
    public_files = ['index.html', 'trade.html', 'company.html', 'contact.html']
    for filename in public_files:
        if (current_dir / filename).exists():
            print(f"  ✓ {filename}")
    
    print("\n【システムファイル】")
    if (current_dir / 'category_classifier.py').exists():
        print(f"  ✓ category_classifier.py")
    
    print("\n【JavaScriptファイル】")
    if js_dir.exists():
        js_files = sorted(js_dir.glob('*.js'))
        for file in js_files[:10]:  # 最初の10個
            print(f"  ✓ js/{file.name}")
        if len(js_files) > 10:
            print(f"  ... 他 {len(js_files) - 10}個")
    
    print(f"\n💡 アーカイブフォルダ '{backup_folder}' を確認後、")
    print("   不要であれば削除してください")
    print(f"   削除コマンド: rmdir /s {backup_folder}")

def show_files_to_be_moved():
    """移動予定のファイル一覧を表示"""
    current_dir = Path.cwd()
    files_to_move = []
    
    # ルートディレクトリ
    for item in current_dir.iterdir():
        if item.name.startswith('_archive_unused_'):
            continue
        if item.is_dir() and item.name not in REQUIRED_FOLDERS:
            files_to_move.append(f"📁 {item.name}/")
        elif item.is_file() and should_move_file(item.name):
            files_to_move.append(f"📄 {item.name}")
    
    # jsフォルダ
    js_dir = current_dir / 'js'
    if js_dir.exists():
        for item in js_dir.iterdir():
            if item.is_file() and should_move_file(item.name, is_js_folder=True):
                files_to_move.append(f"📄 js/{item.name}")
    
    print("\n🗑️ アーカイブされるファイル・フォルダ:")
    
    # カテゴリ別に表示
    test_debug = [f for f in files_to_move if any(keyword in f.lower() for keyword in ['test', 'debug'])]
    backups = [f for f in files_to_move if any(keyword in f for keyword in ['バックアップ', 'backup'])]
    others = [f for f in files_to_move if f not in test_debug and f not in backups]
    
    if test_debug:
        print("\n【テスト・デバッグ関連】")
        for item in sorted(test_debug):
            print(f"  {item}")
    
    if backups:
        print("\n【バックアップ関連】")
        for item in sorted(backups):
            print(f"  {item}")
    
    if others:
        print("\n【その他】")
        for item in sorted(others):
            print(f"  {item}")
    
    return len(files_to_move)

if __name__ == "__main__":
    print("=" * 60)
    print("AMINATI_EC クリーンアップツール")
    print("=" * 60)
    print("\nこのスクリプトは不要なファイルをアーカイブフォルダに移動します。")
    print("READMEに基づいて、本番システムに必要なファイルのみを残します。")
    
    print("\n【残すファイル】")
    print("\n▼ HTMLファイル:")
    for file in sorted([f for f in REQUIRED_FILES if f.endswith('.html')]):
        print(f"  ✓ {file}")
    
    print("\n▼ JavaScriptファイル:")
    print("  基盤系:")
    for file in ['config.js', 'admin-settings.js', 'utils.js']:
        print(f"    ✓ js/{file}")
    print("  API系:")
    for file in ['api-client.js', 'r2-uploader.js', 'email-notification.js']:
        print(f"    ✓ js/{file}")
    print("  その他、必要なJSファイル...")
    
    print("\n▼ システムファイル:")
    print(f"  ✓ category_classifier.py")
    print(f"  ✓ readme-md.md")
    
    # 移動予定のファイルを表示
    count = show_files_to_be_moved()
    
    if count == 0:
        print("\n✅ 移動するファイルはありません。")
    else:
        print(f"\n📊 合計: {count}個のファイル/フォルダがアーカイブされます")
        response = input("\n実行しますか？ (y/n): ")
        if response.lower() == 'y':
            organize_files()
        else:
            print("キャンセルしました")