import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@prisma/client"
import { sendWelcomeEmail } from "@/lib/email"
import { withMiddleware } from "@/lib/middleware"
import { validateRequest, sanitizeString, sanitizeEmail } from "@/lib/security"
import { registerValidationRules } from "@/lib/validations/auth"

async function registerHandler(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request data
    const validationErrors = validateRequest(body, registerValidationRules)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationErrors 
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const email = sanitizeEmail(body.email)
    const password = body.password // Don't sanitize password as it may contain special chars
    const role = body.role as UserRole
    const firstName = sanitizeString(body.firstName, 50)
    const lastName = sanitizeString(body.lastName, 50)
    const country = body.country.toUpperCase()

    if (!email || !password || !role || !firstName || !lastName || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            country,
          },
        },
        subscription: {
          create: {
            tier: "FREE",
          },
        },
      },
      include: {
        profile: true,
      },
    })

    const { password: _, ...userWithoutPassword } = user

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
      })
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Apply rate limiting and security middleware
export const POST = withMiddleware(registerHandler, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 registration attempts per window
  },
  security: {
    requireAuth: false,
    validateCSRF: false,
    logRequests: true,
    checkSuspicious: true,
  },
})