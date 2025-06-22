import { supabase } from './supabase'

/**
 * OCR画像をSupabase Storageに保存
 * @param file アップロードする画像ファイル
 * @param questionnaireId アンケートID（ファイル名の一部として使用）
 * @returns アップロードされた画像のURL
 */
export async function uploadOCRImage(file: File, questionnaireId: string): Promise<string> {
  try {
    // ファイル名を生成（重複を避けるためにタイムスタンプを含む）
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `questionnaire_${questionnaireId}_${timestamp}.${fileExtension}`

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('ocr-images') // バケット名
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // 同名ファイルがあっても上書きしない
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
    }

    // 公開URLを取得
    const { data: publicData } = supabase.storage
      .from('ocr-images')
      .getPublicUrl(fileName)

    return publicData.publicUrl

  } catch (error) {
    console.error('Upload OCR image error:', error)
    throw new Error('画像のアップロード中にエラーが発生しました')
  }
}

/**
 * OCR画像を削除
 * @param imageUrl 削除する画像のURL
 */
export async function deleteOCRImage(imageUrl: string): Promise<void> {
  try {
    // URLからファイル名を抽出
    const fileName = imageUrl.split('/').pop()
    if (!fileName) {
      throw new Error('無効な画像URLです')
    }

    const { error } = await supabase.storage
      .from('ocr-images')
      .remove([fileName])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error(`画像の削除に失敗しました: ${error.message}`)
    }

  } catch (error) {
    console.error('Delete OCR image error:', error)
    throw new Error('画像の削除中にエラーが発生しました')
  }
}

/**
 * 画像のファイルサイズとタイプをバリデーション
 * @param file チェックするファイル
 * @param maxSizeMB 最大ファイルサイズ（MB）
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): void {
  // ファイルタイプのチェック
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('サポートされていないファイル形式です。JPEG、PNG、WebP形式のファイルを選択してください。')
  }

  // ファイルサイズのチェック
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`ファイルサイズが大きすぎます。${maxSizeMB}MB以下のファイルを選択してください。`)
  }
}