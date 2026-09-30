"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ─── Super Admin Hardcoded Credentials (with default fallback) ────────────────
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "saad.superadmin@gmail.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026!";
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "Super Admin";

// ─── Login Action ─────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const rawIdentifier = (formData.get("identifier") as string) || "";
  const rawPassword = (formData.get("password") as string) || "";

  const identifier = rawIdentifier.trim();
  const password = rawPassword.trim();

  if (!identifier || !password) {
    return { success: false, error: "Please provide both Email/Phone and Password." };
  }

  try {
    // 1. Check Super Admin first (hardcoded, no DB lookup)
    if (
      SUPER_ADMIN_EMAIL &&
      identifier.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      password === SUPER_ADMIN_PASSWORD
    ) {
      const cookieStore = await cookies();
      cookieStore.set(
        "mess_session",
        JSON.stringify({ userId: "SUPER_ADMIN", role: "SUPER_ADMIN", name: SUPER_ADMIN_NAME }),
        {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        }
      );
      return { success: true, redirectTo: "/admin", user: { name: SUPER_ADMIN_NAME, role: "SUPER_ADMIN" } };
    }

    // 2. Normal DB lookup for ADMIN and MEMBER
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { member: { phone: identifier } },
        ],
      },
      include: { member: true },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid credentials. User not found." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid credentials. Incorrect password." };
    }

    const cookieStore = await cookies();
    cookieStore.set(
      "mess_session",
      JSON.stringify({ userId: user.id, role: user.role, name: user.name }),
      {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    );

    let redirectTo = "/member";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      redirectTo = "/admin";
    }

    return { success: true, redirectTo, user: { name: user.name, role: user.role } };
  } catch (err: any) {
    return { success: false, error: "Server error during login: " + err.message };
  }
}

// ─── Get Current Session ──────────────────────────────────────────────────────

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("mess_session");
    if (!session) return null;
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

// ─── Logout Action ────────────────────────────────────────────────────────────

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("mess_session");
  return { success: true };
}

// ─── Manager Management (Super Admin only) ────────────────────────────────────

export async function getManagersAction() {
  const managers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      member: {
        select: { phone: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return managers;
}

export async function addManagerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || "";
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "ADMIN";

  if (!name || !email || !password) {
    return { success: false, error: "Name, email, and password are required." };
  }

  // Prevent adding another Super Admin if that email matches hardcoded one
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, error: "This email is reserved for the system Super Admin." };
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        status: "ACTIVE",
        // Managers do NOT get a Member record — so they have no meal tracking
      },
    });

    // If phone is provided, store it via a Member record tagged with the admin user
    // But we deliberately do NOT create a Member for managers (meal tracking excluded)
    // Phone can be stored in a future profile table if needed

    return { success: true, manager: user };
  } catch (err: any) {
    return { success: false, error: "Failed to add manager: " + err.message };
  }
}

export async function removeManagerAction(userId: string) {
  if (!userId) return { success: false, error: "User ID is required." };

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to remove manager: " + err.message };
  }
}
