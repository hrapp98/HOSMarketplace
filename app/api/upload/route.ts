import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { uploadFile } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string // 'resume', 'portfolio', 'avatar'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type and size based on upload type
    const validationRules = {
      resume: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        allowedFormats: ['pdf', 'doc', 'docx']
      },
      portfolio: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
      },
      avatar: {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
      }
    }

    const rules = validationRules[fileType as keyof typeof validationRules]
    
    if (!rules) {
      return NextResponse.json(
        { error: "Invalid file type specified" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > rules.maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${rules.maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!rules.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${rules.allowedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create data URL for Cloudinary
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    // Upload to Cloudinary
    const uploadResult = await uploadFile(dataUrl, {
      folder: `hireoverseas/${fileType}s`,
      filename: `${session.user.id}_${Date.now()}`,
      resource_type: fileType === 'resume' ? 'raw' : 'image',
      allowed_formats: rules.allowedFormats,
      max_bytes: rules.maxSize
    })

    return NextResponse.json({
      success: true,
      file: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        original_name: file.name,
        size: uploadResult.bytes,
        format: uploadResult.format,
        type: fileType
      }
    })

  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}