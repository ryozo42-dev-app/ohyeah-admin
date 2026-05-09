import { supabase } from "@/lib/supabase"

export const deleteImage = async (
  imageUrl?: string | null
) => {

  if (!imageUrl) {
    return
  }

  try {

    if (
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith("http")
    ) {
      return
    }

    const url = new URL(imageUrl)

    const path =
      decodeURIComponent(
        url.pathname.split("/object/public/news/")[1] || ""
      )

    if (!path) {
      return
    }

    const { error } = await supabase.storage
      .from("news")
      .remove([path])

    if (error) {

      console.error(
        "IMAGE DELETE ERROR:",
        error
      )

    } else {

      console.log(
        "IMAGE DELETE SUCCESS:",
        path
      )

    }

  } catch (err) {

    console.error(
      "DELETE IMAGE ERROR:",
      err
    )

  }

}