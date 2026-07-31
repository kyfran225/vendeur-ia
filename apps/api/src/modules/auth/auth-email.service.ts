import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import axios from "axios";

type AuthEmailInput = {
  to: string;
  displayName: string;
  token: string;
  clientUrl?: string;
};

type AuthEmailTemplate = {
  subject: string;
  preview: string;
  title: string;
  intro: string;
  ctaLabel: string;
  url: string;
  footnote: string;
  footer: string;
};

const resendEndpoint = "https://api.resend.com/emails";

function buildUrl(path: string, token?: string, clientUrl?: string) {
  const url = new URL(path, clientUrl ?? env.CLIENT_URL);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function renderHtml(template: AuthEmailTemplate) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#100d0a;color:#f8f1dc;font-family:sans-serif;padding:20px;">
    <div style="background:#17120e;border:1px solid #34291c;border-radius:20px;padding:36px 32px;max-width:600px;margin:0 auto;">
      <h1 style="color:#f8f1dc;">${template.title}</h1>
      <p style="color:#cfc0a4;font-size:16px;">${template.intro}</p>
      <div style="margin:28px 0;">
        <a href="${template.url}" style="background:#d9aa3f;color:#100d0a;text-decoration:none;font-weight:800;padding:16px 20px;border-radius:14px;">${template.ctaLabel}</a>
      </div>
      <p style="color:#8f826d;font-size:13px;">${template.footnote}</p>
    </div>
  </body>
</html>`;
}

export class AuthEmailService {
  async sendVerificationEmail(input: AuthEmailInput) {
    const template = {
      subject: "Vérifiez votre email Vendeur IA",
      preview: "Confirmez votre email pour sécuriser votre compte.",
      title: "Vérifiez votre email",
      intro: `Bonjour ${input.displayName}, confirmez votre adresse email pour sécuriser votre compte.`,
      ctaLabel: "Vérifier mon email",
      url: buildUrl("/auth/verify-email", input.token, input.clientUrl),
      footnote: "Ce lien expire dans 24 heures.",
      footer: "Vendeur IA"
    };
    await this.sendEmail(input.to, template);
  }

  async sendPasswordResetEmail(input: AuthEmailInput) {
    const template = {
      subject: "Réinitialisation de votre mot de passe Vendeur IA",
      preview: "Choisissez un nouveau mot de passe.",
      title: "Réinitialisez votre mot de passe",
      intro: `Bonjour ${input.displayName}, utilisez ce lien sécurisé pour choisir un nouveau mot de passe.`,
      ctaLabel: "Choisir un nouveau mot de passe",
      url: buildUrl("/auth/reset-password", input.token, input.clientUrl),
      footnote: "Ce lien expire dans 1 heure.",
      footer: "Vendeur IA"
    };
    await this.sendEmail(input.to, template);
  }

  private async sendEmail(to: string, template: AuthEmailTemplate) {
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
      console.log("Email logic:", { to, subject: template.subject, url: template.url });
      return;
    }

    try {
      await axios.post(resendEndpoint, {
        from: env.FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: renderHtml(template),
        text: `${template.title}\n\n${template.intro}\n\n${template.url}`
      }, {
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error: any) {
      console.error("Resend error:", error.response?.data || error.message);
    }
  }
}

export const authEmailService = new AuthEmailService();
