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

// 姓名共通の漢字→ひらがな変換辞書（拡張版）
const nameDict: Record<string, string> = {
  // 一般的な姓
  '田中': 'たなか', '佐藤': 'さとう', '鈴木': 'すずき', '高橋': 'たかはし',
  '伊藤': 'いとう', '渡辺': 'わたなべ', '山本': 'やまもと', '中村': 'なかむら',
  '小林': 'こばやし', '加藤': 'かとう', '吉田': 'よしだ', '山田': 'やまだ',
  '佐々木': 'ささき', '山口': 'やまぐち', '松本': 'まつもと', '井上': 'いのうえ',
  '木村': 'きむら', '林': 'はやし', '斎藤': 'さいとう', '清水': 'しみず',
  '山崎': 'やまざき', '森': 'もり', '阿部': 'あべ', '池田': 'いけだ',
  '橋本': 'はしもと', '山下': 'やました', '石川': 'いしかわ', '中島': 'なかじま',
  '前田': 'まえだ', '藤田': 'ふじた', '後藤': 'ごとう', '岡田': 'おかだ',
  '長谷川': 'はせがわ', '村上': 'むらかみ', '近藤': 'こんどう', '石田': 'いしだ',
  '原田': 'はらだ', '浜田': 'はまだ', '中川': 'なかがわ', '小川': 'おがわ',
  '中野': 'なかの', '原': 'はら', '田口': 'たぐち', '竹内': 'たけうち',
  '金子': 'かねこ', '和田': 'わだ', '中田': 'なかた', '石井': 'いしい',
  '沖縄': 'おきなわ', '難波': 'なんば', '大阪': 'おおさか', '京都': 'きょうと',
  '神戸': 'こうべ', '奈良': 'なら', '和歌山': 'わかやま', '兵庫': 'ひょうご',
  '福岡': 'ふくおか', '長崎': 'ながさき', '熊本': 'くまもと', '鹿児島': 'かごしま',
  
  // 一般的な名
  '太郎': 'たろう', '次郎': 'じろう', '三郎': 'さぶろう', '四郎': 'しろう',
  '花子': 'はなこ', '美子': 'よしこ', '恵子': 'けいこ', '由美': 'ゆみ',
  '健一': 'けんいち', '誠': 'まこと', '博': 'ひろし', '学': 'まなぶ',
  '裕子': 'ゆうこ', '直子': 'なおこ', '智子': 'ともこ', '真由美': 'まゆみ',
  '和也': 'かずや', '雄一': 'ゆういち', '秀樹': 'ひでき', '正雄': 'まさお',
  '美穂': 'みほ', '美香': 'みか', '美由紀': 'みゆき', '愛': 'あい',
  '大輔': 'だいすけ', '翔': 'しょう', '颯': 'はやて', '蓮': 'れん',
  '陽菜': 'はるな', '美咲': 'みさき', '結衣': 'ゆい', '愛美': 'まなみ',
  '拓也': 'たくや', '直樹': 'なおき', '健太': 'けんた', '雅之': 'まさゆき'
}

// ひらがなかどうかを判定する関数
const isHiragana = (str: string): boolean => {
  return /^[\u3041-\u3096\s]*$/.test(str)
}

// カタカナをひらがなに変換する関数
const katakanaToHiragana = (str: string): string => {
  return str.replace(/[\u30A1-\u30F6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60
    return String.fromCharCode(chr)
  })
}

export const generateFurigana = (lastName: string, firstName: string): { lastNameFurigana: string; firstNameFurigana: string; fullFurigana: string } => {
  try {
    let lastNameHiragana = ''
    let firstNameHiragana = ''
    
    // 姓の処理
    if (lastName) {
      if (isHiragana(lastName)) {
        // すでにひらがなの場合はそのまま使用
        lastNameHiragana = lastName
      } else {
        // 辞書で変換を試行
        lastNameHiragana = nameDict[lastName] || ''
        // 辞書にない場合、カタカナかチェックしてひらがなに変換
        if (!lastNameHiragana && /[\u30A1-\u30F6]/.test(lastName)) {
          lastNameHiragana = katakanaToHiragana(lastName)
        }
        // 漢字や変換できない文字の場合は空文字にする（ふりがなに漢字を入れない）
      }
    }
    
    // 名の処理
    if (firstName) {
      if (isHiragana(firstName)) {
        // すでにひらがなの場合はそのまま使用
        firstNameHiragana = firstName
      } else {
        // 辞書で変換を試行
        firstNameHiragana = nameDict[firstName] || ''
        // 辞書にない場合、カタカナかチェックしてひらがなに変換
        if (!firstNameHiragana && /[\u30A1-\u30F6]/.test(firstName)) {
          firstNameHiragana = katakanaToHiragana(firstName)
        }
        // 漢字や変換できない文字の場合は空文字にする（ふりがなに漢字を入れない）
      }
    }
    
    const fullFurigana = [lastNameHiragana, firstNameHiragana].filter(Boolean).join(' ')
    
    return {
      lastNameFurigana: lastNameHiragana,
      firstNameFurigana: firstNameHiragana,
      fullFurigana
    }
  } catch (error) {
    console.error('ふりがな生成エラー:', error)
    return {
      lastNameFurigana: '',
      firstNameFurigana: '',
      fullFurigana: ''
    }
  }
}

// ひらがなのみを許可する入力フィルター
export const filterHiraganaOnly = (input: string): string => {
  // ひらがなとスペースのみを許可
  return input.replace(/[^\u3041-\u3096\s]/g, '')
}

// 後方互換性のために残しておく
export const generateFuriganaLegacy = (name: string): string => {
  // 完全一致で検索
  if (nameDict[name]) {
    return nameDict[name]
  }
  
  // すでにひらがなの場合はそのまま返す
  if (isHiragana(name)) {
    return name
  }
  
  // カタカナの場合はひらがなに変換
  if (/[\u30A1-\u30F6]/.test(name)) {
    return katakanaToHiragana(name)
  }
  
  // 部分一致で検索
  for (const [kanji, hiragana] of Object.entries(nameDict)) {
    if (name.includes(kanji)) {
      return name.replace(kanji, hiragana)
    }
  }
  
  // 見つからない場合は入力された文字をそのまま返す
  return name
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