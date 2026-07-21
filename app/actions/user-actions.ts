"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { userService } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"
import type { User } from "@/lib/supabase"

interface UpdateProfileResult {
  success: boolean
  message: string
  user?: User | null
}

export async function updateUserProfile(formData: FormData): Promise<UpdateProfileResult> {
  const userId = formData.get("userId") as string
  const fullName = formData.get("full_name") as string
  const profilePictureFile = formData.get("profile_picture") as File | null

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured")
  }
  if (!userId) {
    return { success: false, message: "User ID is required." }
  }

  try {
    const updates: Partial<User> = { full_name: fullName }

    // Handle profile picture upload
    if (profilePictureFile && profilePictureFile.size > 0) {
      const fileExtension = profilePictureFile.name.split(".").pop()
      const uniqueFileName = `${userId}-${uuidv4()}.${fileExtension}`
      const filePath = `profile-pictures/${uniqueFileName}` // Store in a 'profile-pictures' folder

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("documents") // Using the existing 'documents' bucket, but in a specific folder
        .upload(filePath, profilePictureFile, {
          cacheControl: "3600",
          upsert: true, // Allow overwriting if file name is the same (though UUID makes it unique)
        })

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError)
        return { success: false, message: `Failed to upload profile picture: ${uploadError.message}` }
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("documents").getPublicUrl(uploadData.path)
      if (!publicUrlData || !publicUrlData.publicUrl) {
        return { success: false, message: "Failed to get public URL for profile picture." }
      }
      updates.profile_picture_url = publicUrlData.publicUrl
    }

    // Update user in database (password changes go through
    // supabase.auth.updateUser on the client — Supabase Auth owns credentials now)
    const updatedUser = await userService.update(userId, updates)

    if (!updatedUser) {
      return { success: false, message: "Failed to update user profile in database." }
    }

    return { success: true, message: "บันทึกสำเร็จ", user: updatedUser }
  } catch (error: any) {
    console.error("Error updating user profile:", error)
    return { success: false, message: `An unexpected error occurred: ${error.message}` }
  }
}
