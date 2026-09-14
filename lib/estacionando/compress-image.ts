/**
 * Resizes and re-encodes an image client-side before upload. Phone photos routinely land at
 * 4000px+ and several MB — this brings them down to something that uploads fast, fits well
 * under the server's size limits, and still looks sharp for a card thumbnail or avatar.
 */
export async function compressImage(file: File, options?: { maxWidth?: number; maxHeight?: number; quality?: number }): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const maxWidth = options?.maxWidth ?? 1600
  const maxHeight = options?.maxHeight ?? 1600
  const quality = options?.quality ?? 0.82

  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    // If compression fails for any reason (unsupported format, decode error), fall back to
    // the original file and let the server-side size/type checks decide.
    return file
  }
}
