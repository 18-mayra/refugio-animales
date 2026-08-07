// utils/mailer.js - Configuración de Brevo para envío de emails
require("dotenv").config();

// ============================================================
// ✅ CÓDIGO ORIGINAL DE BREVO (ACTIVO EN PRODUCCIÓN)
// ============================================================
const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configurar Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Envía un correo usando Brevo
 * @param {string} para - Email del destinatario
 * @param {string} asunto - Asunto del correo
 * @param {string} texto - Contenido en texto plano
 * @param {string} html - Contenido en HTML (opcional)
 * @returns {Promise<object>} - Resultado del envío
 */
const enviarCorreo = async (para, asunto, texto, html = null) => {
    // Extraer código para mostrar en consola (debugging)
    let codigo = null;
    if (html) {
        const match = html.match(/\d{6}/);
        if (match) codigo = match[0];
    }
    if (!codigo && texto) {
        const match = texto.match(/\d{6}/);
        if (match) codigo = match[0];
    }
    
    if (codigo) {
        console.log(`\n🔑 Código generado para ${para}: ${codigo}`);
    }

    // ============================================================
    // ✅ ENVÍO REAL DEL EMAIL (ACTIVO EN PRODUCCIÓN)
    // ============================================================
    try {
        if (!process.env.EMAIL_USER) {
            throw new Error("EMAIL_USER no está configurado");
        }

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: para }];
        sendSmtpEmail.sender = { 
            email: process.env.EMAIL_USER, 
            name: "Refugio de Animales" 
        };
        sendSmtpEmail.subject = asunto;
        
        if (html) {
            sendSmtpEmail.htmlContent = html;
        } else {
            sendSmtpEmail.textContent = texto;
        }

        console.log(`📧 Enviando email a: ${para}`);
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email enviado a: ${para} - Message ID: ${response.messageId}`);
        return { success: true, messageId: response.messageId };
    } catch (error) {
        const errorMsg = error.response?.body || error.message;
        console.error("❌ Error Brevo:", errorMsg);
        return { success: false, error: errorMsg };
    }
};

module.exports = enviarCorreo;