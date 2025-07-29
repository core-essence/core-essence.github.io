#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AMINATI_EC GASメール送信テストスクリプト
文字化けチェックを含む
"""

import requests
import json
from datetime import datetime
import time

# GASのURL（新しいデプロイ - v3）
GAS_URL = "https://script.google.com/macros/s/AKfycbw8XWKX56Kioxp0xJH2Vc5qiWDv-Y-XlIQzQ5LkJCbDoEEoIwx_-92gHFjj3MHFnQvO/exec"

def create_test_order_data():
    """テスト用の注文データを作成"""
    return {
        "orderId": f"TEST-{int(time.time())}",
        "orderDate": datetime.now().isoformat(),
        "adminEmail": "aminati.ec@gmail.com",
        "product": {
            "productNumber": "TEST-001",
            "productName": "テスト商品 🎌 日本語テスト",
            "brandName": "テストブランド あいうえお",
            "selectedColor": "ブラック 黒色",
            "selectedSize": "M サイズ",
            "price": 5000
        },
        "pricing": {
            "productPrice": 5000,
            "shippingFee": 500,
            "codFee": 330,
            "totalPrice": 5830
        },
        "customer": {
            "name": "山田太郎 やまだたろう",
            "kana": "ヤマダタロウ",
            "phone": "090-1234-5678",
            "email": "aminati.ec@gmail.com",  # テスト用に管理者メールを使用
            "zip": "123-4567",
            "address": "東京都渋谷区テスト町1-2-3 🏠"
        },
        "delivery": {
            "date": "2025-08-01",
            "time": "午前中",
            "note": "テスト配送メモ 📦 絵文字テスト"
        }
    }

def send_test_email():
    """GASにテストメールを送信"""
    print("=" * 60)
    print("🚀 AMINATI_EC GASメール送信テスト")
    print("=" * 60)
    
    # テストデータ作成
    test_data = create_test_order_data()
    print(f"📝 注文番号: {test_data['orderId']}")
    print(f"📧 送信先: {test_data['adminEmail']}")
    print("-" * 60)
    
    # 文字化けテスト用の文字列を表示
    print("🔤 文字化けテスト項目:")
    print(f"  商品名: {test_data['product']['productName']}")
    print(f"  ブランド: {test_data['product']['brandName']}")
    print(f"  顧客名: {test_data['customer']['name']}")
    print(f"  住所: {test_data['customer']['address']}")
    print(f"  配送メモ: {test_data['delivery']['note']}")
    print("-" * 60)
    
    try:
        # GASにPOSTリクエスト送信
        print("📡 GASにリクエスト送信中...")
        response = requests.post(
            GAS_URL,
            data=json.dumps(test_data),
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 ステータスコード: {response.status_code}")
        
        # レスポンスの内容を表示
        try:
            result = response.json()
            print(f"📨 レスポンス: {json.dumps(result, ensure_ascii=False, indent=2)}")
        except:
            print(f"📄 レスポンス（テキスト）: {response.text}")
        
        print("-" * 60)
        print("✅ テスト送信完了！")
        print("📧 aminati.ec@gmail.com の受信箱を確認してください")
        print("\n⚠️  文字化けチェックポイント:")
        print("  1. 件名の日本語が正しく表示されているか")
        print("  2. 本文の日本語（ひらがな、カタカナ、漢字）が正しいか")
        print("  3. 絵文字（🎌 📦 🏠）が表示されているか")
        
    except Exception as e:
        print(f"❌ エラー発生: {e}")
        print(f"   詳細: {type(e).__name__}")

def check_gas_availability():
    """GASの可用性をチェック"""
    print("\n🔍 GAS接続テスト...")
    try:
        response = requests.get(GAS_URL, timeout=5)
        print(f"✅ GASに接続可能 (ステータス: {response.status_code})")
        return True
    except:
        print("❌ GASに接続できません")
        return False

if __name__ == "__main__":
    # GAS接続確認
    if check_gas_availability():
        print("\n続行しますか？ (y/n): ", end="")
        if input().lower() == 'y':
            send_test_email()
        else:
            print("キャンセルしました")
    else:
        print("\nGASのURLを確認してください")
        print(f"現在のURL: {GAS_URL}")