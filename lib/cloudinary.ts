import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  original_filename: string
  bytes: number
  format: string
  resource_type: string
}

export const uploadFile = async (
  file: Buffer | string,
  options: {
    folder?: string
    filename?: string
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
    allowed_formats?: string[]
    max_bytes?: number
  } = {}
): Promise<UploadResult> => {
  const {
    folder = 'hireoverseas',
    filename,
    resource_type = 'auto',
    allowed_formats,
    max_bytes
  } = options

  try {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
    }

    if (filename) {
      uploadOptions.public_id = `${folder}/${filename}`
    }

    if (allowed_formats) {
      uploadOptions.allowed_formats = allowed_formats
    }

    if (max_bytes) {
      uploadOptions.bytes = max_bytes
    }

    const result = await cloudinary.uploader.upload(file as string, uploadOptions)

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename || '',
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload file')
  }
}

export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete file')
  }
}

export const getOptimizedUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  } = {}
): string => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
  })
}

export { cloudinary }