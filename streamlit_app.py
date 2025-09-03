import streamlit as st
import pandas as pd

# アプリのページ設定
st.set_page_config(
    page_title="文字のデジタル表現を学ぶ",
    page_icon="🔤",
    layout="wide"
)

# タイトルとクレジット
st.title("🔤 文字のデジタル表現")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

# 文字コード体系の情報
ENCODING_INFO = {
    "UTF-8": {
        "description": "世界各国の文字体系に対応するために開発された文字コード体系。可変長で1バイトから4バイトで文字を表現します。",
        "example": "日本語、絵文字、世界中の文字に対応"
    },
    "Shift_JIS": {
        "description": "ひらがなやカタカナ、漢字の全角文字を2バイトで表現する文字コード体系。",
        "example": "主に日本語のWindows環境で使用"
    },
    "EUC-JP": {
        "description": "UNIXやLinuxでよく使われる日本語の文字コード体系。1文字を2バイトまたは3バイトで表現します。",
        "example": "Unix/Linuxシステムで日本語を扱う際に使用"
    },
    "ASCII": {
        "description": "アルファベットや記号を1バイトで表現する基本的な文字コード体系。",
        "example": "英数字と基本記号のみ（a-z, A-Z, 0-9, !@#など）"
    }
}

def bytes_to_hex(byte_data):
    """バイトデータを16進数文字列に変換"""
    return ' '.join(f'{b:02X}' for b in byte_data)

def hex_to_binary(hex_str):
    """16進数文字列を2進数に変換"""
    return ' '.join(f'{int(h, 16):08b}' for h in hex_str.split())

def safe_encode(text, encoding):
    """安全にエンコードを実行し、エラーハンドリング"""
    try:
        if encoding == "ASCII":
            # ASCII範囲外の文字をチェック
            for char in text:
                if ord(char) > 127:
                    return None, f"'{char}'はASCII文字ではありません（コード: {ord(char)}）"
        
        encoded = text.encode(encoding)
        return encoded, None
    except UnicodeEncodeError as e:
        return None, f"エンコードエラー: {str(e)}"
    except LookupError:
        return None, f"サポートされていない文字コード: {encoding}"

# メイン画面の構成
st.markdown("---")

# 1. 文字コードの選択セクション
st.header("📋 1. 文字コードを選択")

col1, col2 = st.columns([1, 2])

with col1:
    selected_encoding = st.selectbox(
        "文字コード体系を選択してください:",
        options=list(ENCODING_INFO.keys()),
        index=0  # UTF-8をデフォルトに
    )

with col2:
    st.info(f"**{selected_encoding}**\n\n{ENCODING_INFO[selected_encoding]['description']}")
    st.caption(f"💡 使用例: {ENCODING_INFO[selected_encoding]['example']}")

st.markdown("---")

# 2. 文字入力セクション
st.header("✍️ 2. 文字を入力")

input_text = st.text_input(
    "変換したい文字を入力してください:",
    value="あ",
    help="任意の文字列を入力できます。文字コードによって対応文字が異なります。"
)

# 入力文字の詳細情報を表示
if input_text:
    st.write(f"**入力文字**: `{input_text}`")
    st.write(f"**文字数**: {len(input_text)}文字")
    
    # 各文字のUnicodeコードポイントを表示
    if len(input_text) <= 10:  # 長すぎる場合は省略
        unicode_info = []
        for char in input_text:
            unicode_info.append({
                "文字": char,
                "Unicodeコードポイント": f"U+{ord(char):04X}",
                "10進数": ord(char)
            })
        
        df = pd.DataFrame(unicode_info)
        st.dataframe(df, hide_index=True)

# 変換実行ボタン
if input_text:
    if st.button("🔄 変換実行", type="primary"):
        # エンコード実行
        encoded_bytes, error = safe_encode(input_text, selected_encoding)
        
        if error:
            st.error(f"❌ {error}")
            if selected_encoding == "ASCII":
                st.info("💡 ASCII文字コードは英数字と基本記号のみに対応しています。日本語を試すには他の文字コードを選択してください。")
        else:
            st.success("✅ 変換が完了しました！")
            
            # ステップ1: 文字から文字コードへの変換
            st.markdown("---")
            st.header("🔸 ステップ1: 文字から文字コードへの変換")
            
            hex_representation = bytes_to_hex(encoded_bytes)
            
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.metric("入力文字", input_text)
                st.metric("文字コード", selected_encoding)
            
            with col2:
                st.metric("バイト数", f"{len(encoded_bytes)} bytes")
                st.metric("16進数表現", hex_representation)
            
            # 詳細表示
            st.subheader("📊 詳細な変換結果")
            
            # バイトごとの詳細表示
            byte_details = []
            for i, byte_val in enumerate(encoded_bytes):
                byte_details.append({
                    "バイト位置": i + 1,
                    "16進数": f"{byte_val:02X}",
                    "10進数": byte_val,
                    "2進数": f"{byte_val:08b}"
                })
            
            df_bytes = pd.DataFrame(byte_details)
            st.dataframe(df_bytes, hide_index=True)
            
            # ステップ2: バイト列の2進数表現
            st.markdown("---")
            st.header("🔹 ステップ2: バイト列の2進数表現")
            
            st.write("コンピュータが実際に扱う2進数（0と1の並び）への変換:")
            
            # 16進数から2進数への変換を視覚的に表示
            for i, hex_byte in enumerate(hex_representation.split()):
                binary = f"{int(hex_byte, 16):08b}"
                col1, col2, col3 = st.columns([1, 1, 2])
                
                with col1:
                    st.code(hex_byte, language=None)
                with col2:
                    st.write("→")
                with col3:
                    st.code(binary, language=None)
            
            # 完全な2進数表現
            complete_binary = hex_to_binary(hex_representation)
            st.subheader("🔢 完全な2進数表現")
            st.code(complete_binary, language=None)
            st.caption(f"合計: {len(encoded_bytes) * 8} ビット")

# 3. ビットとバイトの解説
st.markdown("---")
st.header("📚 3. ビットとバイトについて")

col1, col2 = st.columns(2)

with col1:
    st.subheader("🔸 ビット (bit)")
    st.write("""
    - コンピュータが扱う **最小単位** のデータ
    - **「0」または「1」** の2つの値のみ
    - Binary Digit（二進数字）の略
    - 情報の最も基本的な単位
    """)
    
    # ビットの視覚化
    st.write("**ビットの例:**")
    bit_example = "1 0 1 1 0 0 1 0"
    st.code(bit_example, language=None)

with col2:
    st.subheader("🔹 バイト (byte)")
    st.write("""
    - **8つのビット** をまとめた単位
    - **256通り** の値を表現可能 (2^8 = 256)
    - 文字コードの **基本単位**
    - コンピュータのメモリやストレージの単位
    """)
    
    # バイトの視覚化
    st.write("**1バイトの例:**")
    byte_example = "10110010"
    st.code(f"{byte_example} = {int(byte_example, 2)} (10進数)", language=None)

# ビット・バイトの関係を図で表示
st.subheader("🔄 ビットとバイトの関係")
st.write("1バイト = 8ビット")

# 視覚的な表現
example_byte = "10110010"
bit_data = {f"Bit{i+1}": [int(example_byte[7-i])] for i in range(8)}
df_bits = pd.DataFrame(bit_data)
st.dataframe(df_bits, hide_index=True)
st.write("↑ これで1バイト（右から左へ: Bit1→Bit8）こうではなく、10110010このようにと表示されるようにして下さい")

# 4. まとめと関連情報
st.markdown("---")
st.header("📝 4. まとめ")

st.subheader("🤔 文字コードとは？")
st.write("""
このアプリケーションで体験したように、**文字コード**は人間が読める文字を、
コンピュータが理解できる**0と1の数字の並び**に置き換えるためのルールです。

**つまり:**
- 文字「あ」→ コンピュータは直接理解できない
- 文字コードで変換 → 0と1の並び → コンピュータが理解可能
""")

st.subheader("🌐 なぜ複数の文字コードがあるの？")
st.write("""
**歴史的背景:**
1. **ASCII** (1963年) - 英語圏の文字のみ
2. **Shift_JIS** (1980年代) - 日本語対応
3. **EUC-JP** (1980年代) - Unix系での日本語
4. **Unicode/UTF-8** (1990年代) - 世界中の文字に対応

**現在の状況:**
- インターネットでは **UTF-8** が主流 (約95%のWebサイト)
- 古いシステムでは従来の文字コードも使用
- 異なるシステム間でのデータ交換時に文字化けが発生することも
""")

# 追加機能: 文字コード比較
st.markdown("---")
st.header("⚖️ 5. 文字コード比較（追加機能）")

if input_text:
    st.subheader(f"「{input_text}」の各文字コードでの表現比較")
    
    comparison_data = []
    for encoding in ENCODING_INFO.keys():
        encoded_bytes, error = safe_encode(input_text, encoding)
        if error:
            comparison_data.append({
                "文字コード": encoding,
                "バイト数": "N/A",
                "16進数表現": error,
                "効率性": "対応外"
            })
        else:
            byte_count = len(encoded_bytes)
            hex_repr = bytes_to_hex(encoded_bytes)
            
            # 効率性の評価
            if byte_count <= 4:
                efficiency = "高効率"
            elif byte_count <= 8:
                efficiency = "中効率"
            else:
                efficiency = "低効率"
            
            comparison_data.append({
                "文字コード": encoding,
                "バイト数": f"{byte_count} bytes",
                "16進数表現": hex_repr,
                "効率性": efficiency
            })
    
    df_comparison = pd.DataFrame(comparison_data)
    st.dataframe(df_comparison, hide_index=True)

# 学習ポイント
st.markdown("---")
st.header("🎯 学習ポイント")

learning_points = [
    "文字はコンピュータ内部では数値（0と1）として保存されている",
    "文字コードは文字と数値の対応関係を定めるルール",
    "同じ文字でも文字コードによってバイト数や表現が異なる",
    "UTF-8は現在最も広く使われている文字コード",
    "1バイト = 8ビット、1ビットは0または1の値"
]

for i, point in enumerate(learning_points, 1):
    st.write(f"**{i}.** {point}")

# フッター
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray; padding: 20px;'>
<p>このアプリケーションを通じて、文字のデジタル表現について理解を深めていただけたでしょうか？</p>
<p>さまざまな文字や文字コードを試して、コンピュータの内部動作を体験してみてください！</p>
</div>
""", unsafe_allow_html=True)