import { env } from "../../config/env.js";
import axios from "axios";

type BillingEmailTemplate = {
  subject: string;
  title: string;
  intro: string;
  ctaLabel: string;
  url: string;
  footnote: string;
};

const resendEndpoint = "https://api.resend.com/emails";

function renderHtml(template: BillingEmailTemplate) {
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

export class BillingEmailService {
  async sendExpirationReminder(email: string, displayName: string, daysLeft: number) {
    const template = {
      subject: `⚠️ Votre abonnement Vendeur IA expire dans ${daysLeft} jours`,
      title: "Rappel de réabonnement",
      intro: `Bonjour ${displayName}, votre abonnement arrive à expiration le ${new Date(Date.now() + daysLeft * 86400000).toLocaleDateString()}. Renouvelez maintenant pour assurer la continuité de votre service client IA.`,
      ctaLabel: "Renouveler mon abonnement",
      url: `${env.CLIENT_URL}/settings/billing`,
      footnote: "Si vous avez déjà renouvelé, merci d'ignorer cet email."
    };
    await this.sendEmail(email, template);
  }

  async sendSuspensionNotice(email: string, displayName: string) {
    const template = {
      subject: "🛑 Service Vendeur IA suspendu",
      title: "Action requise : Service Suspendu",
      intro: `Bonjour ${displayName}, votre abonnement a expiré. Votre IA ne répond plus à vos clients sur WhatsApp et les autres canaux.`,
      ctaLabel: "Réactiver mon service",
      url: `${env.CLIENT_URL}/settings/billing`,
      footnote: "Une fois le paiement effectué, votre service sera réactivé instantanément."
    };
    await this.sendEmail(email, template);
  }

  private async sendEmail(to: string, template: BillingEmailTemplate) {
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
      console.log("[BillingEmailService] Mock email to:", to, "Subject:", template.subject);
      return;
    }

    try {
      await axios.post(resendEndpoint, {
        from: env.FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: renderHtml(template),
        text: `${template.title}\n\n${template.intro}\n\nLien : ${template.url}`
      }, {
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
    } catch (error: any) {
      console.error("[BillingEmailService] Error:", error.response?.data || error.message);
    }
  }
}

export const billingEmailService = new BillingEmailService();
