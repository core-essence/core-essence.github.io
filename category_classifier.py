#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from typing import Dict, List, Tuple

class CategoryClassifier:
    """商品名からカテゴリーを判定するクラス"""
    
    def __init__(self):
        # カテゴリー判定用のキーワード辞書
        self.category_keywords = {
            "Tシャツ": ["tシャツ", "t-shirt", "ティーシャツ", "tee"],
            "カットソー": ["カットソー", "cut and sewn"],
            "シャツ": ["シャツ", "shirt", "ブラウス", "blouse"],
            "パンツ": ["パンツ", "pants", "ズボン", "トラウザー", "スラックス", "ジーンズ", "デニム"],
            "スカート": ["スカート", "skirt"],
            "ワンピース": ["ワンピース", "dress", "ドレス"],
            "ジャケット": ["ジャケット", "jacket", "ブルゾン"],
            "コート": ["コート", "coat"],
            "アウター": ["アウター", "パーカー", "フーディー", "ウィンドブレーカー"],
            "ニット": ["ニット", "knit", "セーター", "sweater", "カーディガン"],
            "バッグ": ["バッグ", "bag", "かばん", "鞄", "リュック", "トート"],
            "シューズ": ["シューズ", "shoes", "靴", "スニーカー", "ブーツ", "サンダル"],
            "アクセサリー": ["アクセサリー", "accessory", "ネックレス", "ブレスレット", "リング", "ピアス"],
            "帽子": ["帽子", "キャップ", "cap", "ハット", "hat"],
            "ベルト": ["ベルト", "belt"],
            "財布": ["財布", "wallet", "ウォレット"],
            "トップス": ["トップス", "tops"]  # 汎用カテゴリー
        }
        
        # 優先度（より具体的なカテゴリーを優先）
        self.priority_order = [
            "Tシャツ", "カットソー", "シャツ", "ニット",  # 具体的なトップス
            "パンツ", "スカート", "ワンピース",  # ボトムス・ワンピース
            "ジャケット", "コート", "アウター",  # アウター類
            "バッグ", "シューズ", "財布", "ベルト", "帽子", "アクセサリー",  # 小物
            "トップス"  # 汎用
        ]
        
        # 既存のカテゴリーリスト（動的に追加される）
        self.existing_categories = set(self.category_keywords.keys())
    
    def classify(self, product_name: str) -> str:
        """商品名からカテゴリーを判定"""
        product_name_lower = product_name.lower()
        
        # 優先度順にカテゴリーをチェック
        for category in self.priority_order:
            if category in self.category_keywords:
                keywords = self.category_keywords[category]
                for keyword in keywords:
                    if keyword in product_name_lower:
                        return category
        
        # マッチしない場合は「その他」
        return "その他"
    
    def add_category(self, category: str):
        """新しいカテゴリーを追加"""
        if category not in self.existing_categories:
            self.existing_categories.add(category)
            print(f"✅ 新しいカテゴリー '{category}' を追加しました")
    
    def get_categories(self) -> List[str]:
        """既存のカテゴリーリストを取得"""
        return sorted(list(self.existing_categories))
    
    def analyze_products(self, products: List[Dict]) -> Dict[str, List[str]]:
        """商品リストを分析してカテゴリー別に分類"""
        category_map = {}
        
        for product in products:
            product_name = product.get('productName', '')
            product_number = product.get('productNumber', '')
            
            category = self.classify(product_name)
            
            if category not in category_map:
                category_map[category] = []
            
            category_map[category].append(f"{product_number}: {product_name}")
        
        return category_map


def test_classifier():
    """分類器のテスト"""
    classifier = CategoryClassifier()
    
    # テスト用の商品データ
    test_products = [
        {"productNumber": "21765", "productName": "リラックスルーズベーシックT オーバーサイズ ラスティックコットンカットソー"},
        {"productNumber": "21766", "productName": "プレミアムコットンシャツ メンズ"},
        {"productNumber": "21767", "productName": "ストレッチデニムパンツ スキニーフィット"},
        {"productNumber": "21768", "productName": "フェイクレザートートバッグ A4サイズ対応"},
        {"productNumber": "21769", "productName": "ウール混ニットセーター Vネック"},
        {"productNumber": "21770", "productName": "防水マウンテンパーカー メンズ"},
        {"productNumber": "21771", "productName": "プリーツスカート ミディ丈"},
        {"productNumber": "21772", "productName": "キャンバススニーカー ローカット"},
        {"productNumber": "21773", "productName": "リネンワンピース ロング丈"},
        {"productNumber": "21774", "productName": "本革ベルト イタリアンレザー"}
    ]
    
    print("="*60)
    print("カテゴリー分類テスト")
    print("="*60)
    
    # 個別テスト
    print("\n【個別分類結果】")
    for product in test_products:
        category = classifier.classify(product["productName"])
        print(f"{product['productNumber']}: {product['productName']}")
        print(f"  → カテゴリー: {category}")
        print()
    
    # カテゴリー別集計
    print("\n【カテゴリー別集計】")
    category_map = classifier.analyze_products(test_products)
    
    for category, products in sorted(category_map.items()):
        print(f"\n■ {category} ({len(products)}件)")
        for product in products:
            print(f"  - {product}")
    
    # カテゴリー一覧
    print("\n【登録されているカテゴリー】")
    for category in classifier.get_categories():
        print(f"  • {category}")
    
    return classifier


def load_products_from_json(filepath: str) -> List[Dict]:
    """JSONファイルから商品データを読み込む"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ ファイルが見つかりません: {filepath}")
        return []
    except json.JSONDecodeError:
        print(f"❌ JSONの解析エラー: {filepath}")
        return []


def save_categorized_products(products: List[Dict], classifier: CategoryClassifier, output_file: str):
    """カテゴリー付きの商品データを保存"""
    categorized_products = []
    
    for product in products:
        category = classifier.classify(product.get('productName', ''))
        product_with_category = product.copy()
        product_with_category['category'] = category
        categorized_products.append(product_with_category)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(categorized_products, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ カテゴリー付き商品データを保存しました: {output_file}")


def main():
    print("商品カテゴリー分類システム")
    print("="*60)
    
    # 基本テストを実行
    classifier = test_classifier()
    
    # ファイルからの読み込みテスト
    print("\n" + "="*60)
    print("JSONファイルから商品データを読み込みますか？")
    choice = input("1. はい / 2. いいえ (1/2): ")
    
    if choice == "1":
        filepath = input("JSONファイルのパス: ")
        products = load_products_from_json(filepath)
        
        if products:
            print(f"\n{len(products)}件の商品を読み込みました")
            
            # カテゴリー分類
            category_map = classifier.analyze_products(products)
            
            print("\n【カテゴリー別分類結果】")
            for category, product_list in sorted(category_map.items()):
                print(f"\n■ {category} ({len(product_list)}件)")
                for product in product_list[:5]:  # 最初の5件のみ表示
                    print(f"  - {product}")
                if len(product_list) > 5:
                    print(f"  ... 他 {len(product_list) - 5}件")
            
            # 保存オプション
            save_choice = input("\n\nカテゴリー付きデータを保存しますか？ (y/n): ")
            if save_choice.lower() == 'y':
                output_file = input("出力ファイル名 (例: categorized_products.json): ")
                save_categorized_products(products, classifier, output_file)


if __name__ == "__main__":
    main()