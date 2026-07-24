/**
 * Image Management Utilities for Admin Portal
 * 
 * Handles image uploads with proper state management:
 * - Validates files before upload
 * - Prevents accidental deletion of existing images
 * - Tracks upload status
 * - Provides detailed error messages
 */

import { put } from "@vercel/blob"

export type ImageUploadResult = 
  | { success: true; url: string; filename: string }
  | { success: false; error: string }

export type ImageValidationError = 
  | "NO_FILE"
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_NAME"
  | "UPLOAD_FAILED"

export const IMAGE_VALIDATION_RULES = {
  maxSize: 4 * 1024 * 1024, // 4 MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  maxFilenameLength: 255,
}

/**
 * Validates an image file before upload
 */
export function validateImageFile(file: File | null): { valid: boolean; error?: ImageValidationError; message?: string } {
  if (!file || file.size === 0) {
    return { valid: false, error: "NO_FILE", message: "No file provided" }
  }

  if (!IMAGE_VALIDATION_RULES.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "INVALID_TYPE",
      message: `Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, SVG`,
    }
  }

  if (file.size > IMAGE_VALIDATION_RULES.maxSize) {
    const maxMB = IMAGE_VALIDATION_RULES.maxSize / (1024 * 1024)
    return {
      valid: false,
      error: "FILE_TOO_LARGE",
      message: `File size exceeds ${maxMB}MB limit. Please upload a smaller file.`,
    }
  }

  if (!file.name || file.name.length > IMAGE_VALIDATION_RULES.maxFilenameLength) {
    return {
      valid: false,
      error: "INVALID_NAME",
      message: "Invalid filename",
    }
  }

  return { valid: true }
}

/**
 * Upload an image to Vercel Blob with proper error handling
 */
export async function uploadImage(
  file: File,
  folder: string,
  makePublic: boolean = true,
): Promise<ImageUploadResult> {
  // Validate first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.message || "File validation failed",
    }
  }

  try {
    const ext = file.name.split(".").pop() ?? "png"
    const suffix = Math.random().toString(36).slice(2, 7)
    const timestamp = Date.now()
    const filename = `${folder}/${timestamp}-${suffix}.${ext}`

    const blob = await put(filename, file, {
      access: makePublic ? "public" : "private",
      contentType: file.type,
    })

    return {
      success: true,
      url: blob.url,
      filename: blob.pathname,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[image] Upload failed:", message)
    return {
      success: false,
      error: `Upload failed: ${message}. Please try again.`,
    }
  }
}

/**
 * Handle image field updates - NEVER blindly overwrite
 * Returns the URL to save:
 * - New URL if upload succeeded
 * - Existing URL if no new file provided
 * - null if admin explicitly cleared the field
 */
export function resolveImageUrl(
  newUrl: string | undefined,
  existingUrl: string | null | undefined,
  uploadedUrl: string | null,
): string | null {
  // If a new URL was provided from upload, use it
  if (uploadedUrl) {
    return uploadedUrl
  }

  // If admin explicitly set newUrl (even to null), respect that
  if (newUrl !== undefined) {
    return newUrl || null
  }

  // Otherwise, preserve existing URL
  return existingUrl || null
}

/**
 * Format error messages for display to admin
 */
export function formatImageError(error: string): string {
  if (error.includes("Blob")) {
    return "Image storage service error. Please contact support."
  }
  if (error.includes("timeout")) {
    return "Upload timed out. Please check your connection and try again."
  }
  if (error.includes("network")) {
    return "Network error. Please check your connection and try again."
  }
  return error
}
