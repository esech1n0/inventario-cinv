import nodemailer from "nodemailer";

/**
 * Servicio de envío de correos electrónicos transaccionales para Inventario CINV.
 * Soporta:
 * 1. Servidor SMTP (Gmail, Outlook, correo institucional propio).
 * 2. API de Resend (si está configurada la variable RESEND_API_KEY).
 * 3. Modo simulación en consola de desarrollo si no hay credenciales configuradas en .env.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : smtpPort === 465;

  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Enviar vía SMTP (Gmail o institucional)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const fromAddress =
        process.env.EMAIL_FROM || `"Inventario CINV" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ [SMTP] Correo enviado a ${to} (ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido en transporte SMTP";
      console.error("❌ [SMTP Error] No se pudo enviar el correo:", errorMsg);
      return {
        success: false,
        error: `Error de envío SMTP: ${errorMsg}`,
      };
    }
  }

  // 2. Enviar vía Resend API (si está configurado)
  if (resendApiKey) {
    try {
      const from = process.env.EMAIL_FROM || "Inventario CINV <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error en API de Resend:", errorData);
        return {
          success: false,
          error: errorData.message || `Error de Resend (${response.status})`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Error de red en Resend";
      console.error("Error al enviar email por Resend:", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  // 3. Modo simulación en desarrollo (si no hay SMTP ni Resend configurados en .env)
  console.log("\n=======================================================");
  console.log("📨 [SIMULADOR DE EMAIL - DESARROLLO]");
  console.log("⚠️ No se han configurado credenciales SMTP ni RESEND_API_KEY en .env.");
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Contenido:\n${text}`);
  console.log("=======================================================\n");

  return {
    success: true,
    simulated: true,
  };
}

/**
 * Plantilla HTML con diseño profesional para el código 2FA OTP.
 */
export async function sendOTPEmail(toEmail: string, otpCode: string): Promise<SendEmailResult> {
  const subject = `Código de verificación: ${otpCode} - Inventario CINV`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de verificación 2FA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con degradado suave -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Inventario CINV
              </h1>
              <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">
                Verificación de Seguridad en Dos Pasos (2FA)
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                Hola,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Has solicitado iniciar sesión en el <strong>Sistema de Gestión de Inventario CINV</strong>. Utiliza el siguiente código de verificación de un solo uso (OTP) para completar tu acceso:
              </p>

              <!-- Bloque del Código OTP -->
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">
                  Tu código de un solo uso
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; display: inline-block;">
                  ${otpCode}
                </span>
                <span style="display: block; margin-top: 10px; font-size: 12px; color: #94a3b8; font-weight: 500;">
                  ⏱ Expira en 10 minutos
                </span>
              </div>

              <!-- Advertencia de seguridad -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 12px 16px; margin: 24px 0 16px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #991b1b;">
                  <strong>Importante:</strong> Nunca compartas este código con nadie. El personal de CINV jamás te solicitará tu código por mensaje ni teléfono.
                </p>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                Si tú no intentaste iniciar sesión en el sistema, te recomendamos cambiar tu contraseña de inmediato para proteger tu cuenta.
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 Coordinación CINV · Sistema Seguro de Inventario
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Inventario CINV - Verificación de Seguridad en Dos Pasos (2FA)

Tu código de verificación de un solo uso (OTP) es:
${otpCode}

Este código expira en 10 minutos. Nunca compartas este código con nadie.
Si no solicitaste este acceso, por favor cambia tu contraseña inmediatamente.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}
