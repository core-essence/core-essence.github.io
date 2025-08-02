#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
指定した文字列を含むファイルを検索（Python/JavaScript/HTML対応、複数キーワード対応）
使用例: 
  python 検索.py "drop"
  python 検索.py "Desk" "Desktop" "create"
  python 検索.py --or "crawl" "scrape" "fetch"
  python 検索.py --regex "create_\w+" "def\s+\w+_ui"
  python 検索.py --ext py js html "drop"  # 特定の拡張子のみ検索
"""

import os
import sys
from pathlib import Path
import re
from collections import defaultdict

# 対応ファイル拡張子
DEFAULT_EXTENSIONS = ['py', 'js', 'html', 'htm', 'jsx', 'ts', 'tsx', 'vue']

def find_strings_usage(search_strings, mode='AND', extensions=None):
    """指定した文字列を含むファイルを検索（複数キーワード対応）"""
    
    base_dir = Path(r"C:\Users\archi\Desktop\hp")
    
    if extensions is None:
        extensions = DEFAULT_EXTENSIONS
    
    # 検索文字列から括弧を除去
    search_strings_clean = [s.rstrip('()') for s in search_strings]
    
    print(f"🔍 検索キーワード ({mode}モード):")
    for s in search_strings_clean:
        print(f"   • {s}")
    print(f"📂 対象拡張子: {', '.join(extensions)}")
    print("=" * 50)
    
    found_files = defaultdict(lambda: defaultdict(list))  # ファイル名: {キーワード: [(行番号, 行内容)]}
    
    try:
        if not base_dir.exists():
            print(f"❌ ディレクトリが見つかりません: {base_dir}")
            return
        
        # 各キーワードの検索パターンを作成
        search_patterns = {
            keyword: re.compile(re.escape(keyword), re.IGNORECASE)
            for keyword in search_strings_clean
        }
        
        # 指定された拡張子のファイルを検索
        for ext in extensions:
            for file_path in base_dir.rglob(f"*.{ext}"):
                # 除外ディレクトリをスキップ
                if any(exclude in str(file_path) for exclude in ['__pycache__', '.git', 'venv', 'node_modules', 'dist', 'build']):
                    continue
                
                try:
                    # ファイルエンコーディングを判定して読み込み
                    encoding = detect_encoding(file_path)
                    with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
                        lines = f.readlines()
                    
                    file_matches = defaultdict(list)
                    
                    # 各行で全キーワードを検索
                    for line_num, line in enumerate(lines, 1):
                        for keyword, pattern in search_patterns.items():
                            if pattern.search(line):
                                file_matches[keyword].append((line_num, line.strip()))
                    
                    if file_matches:
                        rel_path = str(file_path.relative_to(base_dir))
                        
                        # ANDモード: 全てのキーワードが含まれるファイルのみ
                        if mode == 'AND' and len(file_matches) == len(search_strings_clean):
                            found_files[rel_path] = dict(file_matches)
                        # ORモード: いずれかのキーワードが含まれるファイル
                        elif mode == 'OR':
                            found_files[rel_path] = dict(file_matches)
                            
                except Exception:
                    continue
        
        # 結果を表示
        if found_files:
            print(f"\n📄 マッチしたファイル:")
            print()
            
            # ファイル種別ごとに分類して表示
            files_by_type = defaultdict(list)
            for file_path in sorted(found_files.keys()):
                ext = Path(file_path).suffix.lower()
                files_by_type[ext].append(file_path)
            
            for ext in sorted(files_by_type.keys()):
                if files_by_type[ext]:
                    print(f"🔸 {ext.upper() if ext else 'その他'} ファイル:")
                    for file_path in files_by_type[ext]:
                        print(f"   📁 {file_path}")
                        
                        # 各キーワードのマッチを表示
                        for keyword in search_strings_clean:
                            if keyword in found_files[file_path]:
                                matches = found_files[file_path][keyword]
                                print(f"      🔹 「{keyword}」: {len(matches)}件")
                                
                                # 最初の2件を表示
                                for i, (line_num, line_content) in enumerate(matches[:2]):
                                    display_line = line_content[:80] + ('...' if len(line_content) > 80 else '')
                                    print(f"         L{line_num}: {display_line}")
                                
                                if len(matches) > 2:
                                    print(f"         ... 他 {len(matches) - 2} 件")
                        print()
                    print()
            
            # 統計情報
            total_files = len(found_files)
            keyword_stats = defaultdict(int)
            type_stats = defaultdict(int)
            
            for file_path, file_data in found_files.items():
                ext = Path(file_path).suffix.lower()
                type_stats[ext] += 1
                for keyword, matches in file_data.items():
                    keyword_stats[keyword] += len(matches)
            
            print("📊 統計:")
            print(f"   マッチしたファイル数: {total_files}")
            print("   ファイル種別:")
            for ext, count in sorted(type_stats.items()):
                print(f"      • {ext.upper() if ext else 'その他'}: {count}件")
            print("   キーワード別マッチ数:")
            for keyword in search_strings_clean:
                if keyword in keyword_stats:
                    print(f"      • {keyword}: {keyword_stats[keyword]}件")
            
        else:
            if mode == 'AND':
                print(f"❌ 全てのキーワードを含むファイルが見つかりませんでした")
                print("\n💡 ヒント: --or オプションを使うと、いずれかのキーワードを含むファイルを検索できます")
            else:
                print(f"❌ いずれのキーワードも含むファイルが見つかりませんでした")
            
    except Exception as e:
        print(f"❌ 検索処理中にエラーが発生しました: {e}")

def find_regex_patterns(regex_patterns, extensions=None):
    """複数の正規表現パターンで検索"""
    
    base_dir = Path(r"C:\Users\archi\Desktop\hp")
    
    if extensions is None:
        extensions = DEFAULT_EXTENSIONS
    
    print(f"🔍 正規表現パターン検索:")
    for p in regex_patterns:
        print(f"   • {p}")
    print(f"📂 対象拡張子: {', '.join(extensions)}")
    print("=" * 50)
    
    found_files = defaultdict(lambda: defaultdict(int))
    
    try:
        # 正規表現をコンパイル
        patterns = {}
        for pattern_str in regex_patterns:
            try:
                patterns[pattern_str] = re.compile(pattern_str, re.IGNORECASE | re.MULTILINE)
            except re.error as e:
                print(f"⚠️  無効な正規表現 '{pattern_str}': {e}")
                continue
        
        if not patterns:
            print("❌ 有効な正規表現パターンがありません")
            return
        
        for ext in extensions:
            for file_path in base_dir.rglob(f"*.{ext}"):
                if any(exclude in str(file_path) for exclude in ['__pycache__', '.git', 'venv', 'node_modules', 'dist', 'build']):
                    continue
                
                try:
                    encoding = detect_encoding(file_path)
                    with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
                        content = f.read()
                    
                    rel_path = str(file_path.relative_to(base_dir))
                    
                    for pattern_str, pattern in patterns.items():
                        matches = list(pattern.finditer(content))
                        if matches:
                            found_files[rel_path][pattern_str] = len(matches)
                            
                except Exception:
                    continue
        
        if found_files:
            print(f"\n📄 マッチしたファイル:")
            for file_path in sorted(found_files.keys()):
                ext = Path(file_path).suffix.upper()
                print(f"\n📁 {file_path} [{ext}]")
                for pattern, count in found_files[file_path].items():
                    print(f"   🔹 パターン「{pattern}」: {count}件")
            
            print(f"\n✅ 合計: {len(found_files)} ファイル")
        else:
            print(f"❌ パターンにマッチするファイルが見つかりませんでした")
            
    except Exception as e:
        print(f"❌ 検索処理中にエラーが発生しました: {e}")

def detect_encoding(file_path):
    """ファイルのエンコーディングを判定"""
    # よく使われるエンコーディングを試行
    encodings = ['utf-8', 'shift_jis', 'cp932', 'euc-jp', 'latin1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                f.read(1024)  # 最初の1KBを読んでテスト
            return encoding
        except (UnicodeDecodeError, UnicodeError):
            continue
    
    return 'utf-8'  # デフォルト

def print_usage():
    """使用方法を表示"""
    print("使用方法:")
    print("\n基本的な使い方（AND検索）:")
    print('  python 検索.py "キーワード1" "キーワード2" ...')
    print('  例: python 検索.py "create" "button" "ui"')
    print("\nOR検索（いずれかのキーワード）:")
    print('  python 検索.py --or "キーワード1" "キーワード2" ...')
    print('  例: python 検索.py --or "crawl" "scrape" "fetch"')
    print("\n正規表現検索:")
    print('  python 検索.py --regex "パターン1" "パターン2" ...')
    print('  例: python 検索.py --regex "create_\\w+" "function\\s+\\w+"')
    print("\n特定の拡張子のみ検索:")
    print('  python 検索.py --ext py js "キーワード"')
    print('  python 検索.py --ext html htm "drop"')
    print("\n💡 対応ファイル形式:")
    print('  • Python: .py')
    print('  • JavaScript: .js, .jsx, .ts, .tsx')
    print('  • HTML: .html, .htm')
    print('  • Vue.js: .vue')
    print("\n💡 推奨検索例:")
    print('  # JavaScriptの関数を検索')
    print('  python 検索.py --ext js jsx "function" "arrow"')
    print('  # HTMLのイベントハンドラーを検索')
    print('  python 検索.py --ext html htm "onclick" "onchange"')
    print('  # dropイベント関連を全ファイルから検索')
    print('  python 検索.py --or "drop" "drag" "ondrop" "dragover"')

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    # オプションの解析
    if sys.argv[1] == "--or":
        if len(sys.argv) < 3:
            print("❌ --or オプションには少なくとも1つのキーワードが必要です")
            sys.exit(1)
        search_strings = sys.argv[2:]
        find_strings_usage(search_strings, mode='OR')
    
    elif sys.argv[1] == "--regex":
        if len(sys.argv) < 3:
            print("❌ --regex オプションには少なくとも1つのパターンが必要です")
            sys.exit(1)
        regex_patterns = sys.argv[2:]
        find_regex_patterns(regex_patterns)
    
    elif sys.argv[1] == "--ext":
        if len(sys.argv) < 4:
            print("❌ --ext オプションには拡張子とキーワードが必要です")
            print("例: python 検索.py --ext js html 'drop'")
            sys.exit(1)
        
        # 拡張子とキーワードを分離
        args = sys.argv[2:]
        extensions = []
        keywords = []
        
        # 最後の引数がキーワード、それ以外は拡張子として扱う
        if len(args) >= 2:
            extensions = args[:-1]
            keywords = [args[-1]]
        else:
            print("❌ 拡張子とキーワードの両方を指定してください")
            sys.exit(1)
        
        find_strings_usage(keywords, mode='AND', extensions=extensions)
    
    else:
        # 通常のAND検索モード（全拡張子対象）
        search_strings = sys.argv[1:]
        find_strings_usage(search_strings, mode='AND')