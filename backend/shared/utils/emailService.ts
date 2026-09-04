import nodemailer from 'nodemailer';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ionos.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.CLIENT_URL || 'https://test-keplayas.kemarketing.mx';
const SCHOOL_LOGO = `${BASE_URL}/logo.jpeg`;
const SYSTEM_LOGO = `${BASE_URL}/logo%201%20%281%29.png`;
const CLIENT_URL = BASE_URL;

const getEmailTemplate = (nombre: string, email: string, password?: string, roleName?: string): string => {
  let welcomeMessage = '';
  let roleMessage = '';
  let accentColor = '#4A5568';

  switch (roleName?.toUpperCase()) {
    case 'ALUMNO':
      welcomeMessage = '¡Bienvenido a tu viaje artístico!';
      roleMessage = 'Estamos emocionados de tenerte como estudiante. Aquí encontrarás todo lo necesario para tus clases.';
      accentColor = '#48BB78';
      break;
    case 'PROFESOR':
      welcomeMessage = '¡Bienvenido al equipo docente!';
      roleMessage = 'Gracias por formar parte de nuestra facultad. Accede al portal para gestionar tus clases y alumnos.';
      accentColor = '#4299E1';
      break;
    case 'ADMIN':
      welcomeMessage = 'Nuevo Acceso Administrativo';
      roleMessage = 'Se ha creado tu cuenta de administrador para la gestión del sistema escolar.';
      accentColor = '#ED8936';
      break;
    default:
      welcomeMessage = '¡Bienvenido a KePlayas!';
      roleMessage = 'Se ha creado tu cuenta en el sistema de gestión.';
      accentColor = '#805AD5';
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background-color: ${accentColor}; padding: 30px; text-align: center; }
          .header img { max-height: 80px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); }
          .content { padding: 40px; color: #2d3748; }
          .welcome-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a202c; text-align: center; }
          .welcome-text { font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px; text-align: center; }
          .credentials-box { background-color: #edf2f7; border-left: 5px solid ${accentColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .credential-item { margin-bottom: 10px; font-size: 15px; }
          .label { font-weight: bold; color: #718096; text-transform: uppercase; font-size: 12px; }
          .value { font-family: monospace; font-size: 16px; color: #2d3748; background: #fff; padding: 2px 6px; border-radius: 4px; }
          .btn-container { text-align: center; margin-top: 30px; }
          .btn { background-color: ${accentColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background-color 0.2s; }
          .footer { background-color: #f7fafc; color: #4a5568; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0; }
          .system-logo { height: 50px; margin-top: 10px; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="${SCHOOL_LOGO}" alt="Logo Escuela">
          </div>
          <div class="content">
              <div class="welcome-title">Hola ${nombre},</div>
              <div class="welcome-title" style="font-size: 20px; color: ${accentColor}; margin-top: 5px;">
                  ${welcomeMessage}
              </div>
              <p class="welcome-text">
                  ${roleMessage}<br>
                  A continuación encontrarás tus credenciales de acceso provisionales.
                  Te recomendamos cambiarlas al ingresar.
              </p>
              ${password ? `
              <div class="credentials-box">
                  <div class="credential-item">
                      <span class="label">Correo Electrónico</span><br>
                      <span class="value">${email}</span>
                  </div>
                  <div class="credential-item">
                      <span class="label">Contraseña Temporal</span><br>
                      <span class="value">${password}</span>
                  </div>
              </div>` : ''}
              <div class="btn-container">
                  <a href="${CLIENT_URL}" class="btn">Iniciar Sesión en el Portal</a>
              </div>
          </div>
          <div class="footer">
              <p>Escuela de Arte - Sistema de Gestión Escolar</p>
              <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 15px;">
                  <span>Sistema</span>
                  <img src="${SYSTEM_LOGO}" alt="KePlayas Logo" class="system-logo">
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
};

export const sendEmail = async (options: { to: string; subject: string; html: string }): Promise<void> => {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL !== 'true') return;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`📧 Correo enviado a ${options.to}. MessageId: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
  }
};

export const sendCredentialsEmail = async (
  user: { nombre: string; email: string },
  rawPassword?: string,
  roleName: string = 'Usuario',
  overrideTo?: string
): Promise<void> => {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL !== 'true') {
    console.log('ℹ️ Envío de correos deshabilitado en configuración.');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Credenciales SMTP no encontradas en .env');
    return;
  }

  try {
    const htmlContent = getEmailTemplate(user.nombre, user.email, rawPassword, roleName);
    const to = overrideTo || user.email;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: 'Bienvenido a KePlayas - Tus Credenciales de Acceso',
      html: htmlContent,
    });

    console.log(`📧 Correo de bienvenida enviado a ${to}. MessageId: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
  }
};
