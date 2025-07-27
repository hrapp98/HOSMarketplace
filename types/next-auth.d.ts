import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      emailVerified: Date | null
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    emailVerified: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    emailVerified: Date | null
  }
}