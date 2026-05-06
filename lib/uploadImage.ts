// /lib/uploadImage.ts

import { supabase } from "@/lib/supabase"

export const uploadImage = async (
  file: File,
  folder: string = "news-images"
) => {

  if (!file) {
    throw new Error("画像が選択されていません")
  }

  const fileExt = file.name.split(".").pop()

  const fileName = `${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(folder)
    .upload(fileName, file)

  if (uploadError) {
    console.error(uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from(folder)
    .getPublicUrl(fileName)

  if (!data?.publicUrl) {
    throw new Error("公開URL取得失敗")
  }

  return data.publicUrl
}