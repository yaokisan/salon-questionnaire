// 郵便番号から住所を取得する関数
export const fetchAddressFromPostalCode = async (postalCode: string): Promise<string | null> => {
  try {
    const cleanPostalCode = postalCode.replace(/[^0-9]/g, '')
    if (cleanPostalCode.length !== 7) return null

    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`)
    const data = await response.json()
    
    if (data.status === 200 && data.results && data.results.length > 0) {
      const result = data.results[0]
      return `${result.address1}${result.address2}${result.address3}`
    }
    return null
  } catch (error) {
    console.error('住所取得エラー:', error)
    return null
  }
}

// 簡易的なふりがな生成（漢字→ひらがな変換辞書）
const kanjiToHiragana: Record<string, string> = {
  '田中': 'たなか',
  '佐藤': 'さとう',
  '鈴木': 'すずき',
  '高橋': 'たかはし',
  '伊藤': 'いとう',
  '渡辺': 'わたなべ',
  '山本': 'やまもと',
  '中村': 'なかむら',
  '小林': 'こばやし',
  '加藤': 'かとう',
  '吉田': 'よしだ',
  '山田': 'やまだ',
  '佐々木': 'ささき',
  '山口': 'やまぐち',
  '松本': 'まつもと',
  '井上': 'いのうえ',
  '木村': 'きむら',
  '林': 'はやし',
  '斎藤': 'さいとう',
  '清水': 'しみず',
  '山崎': 'やまざき',
  '森': 'もり',
  '阿部': 'あべ',
  '池田': 'いけだ',
  '橋本': 'はしもと',
  '山下': 'やました',
  '石川': 'いしかわ',
  '中島': 'なかじま',
  '前田': 'まえだ',
  '藤田': 'ふじた'
}

export const generateFurigana = (name: string): string => {
  // 完全一致で検索
  if (kanjiToHiragana[name]) {
    return kanjiToHiragana[name]
  }
  
  // 部分一致で検索
  for (const [kanji, hiragana] of Object.entries(kanjiToHiragana)) {
    if (name.includes(kanji)) {
      return name.replace(kanji, hiragana)
    }
  }
  
  // 見つからない場合は空文字を返す
  return ''
}

// 郵便番号フォーマット関数
export const formatPostalCode = (value: string): string => {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) return numbers
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`
}

// 電話番号フォーマット関数
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}