import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Email invalide"),
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Le token est requis"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Le token est requis"),
  })
});

export const googleAuthSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Le token Google est requis"),
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Le refresh token est requis"),
  })
});
