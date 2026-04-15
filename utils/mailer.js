// utils/mailer.js - Configuración de Brevo para envío de emails
require("dotenv").config();
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
    try {
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

        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("✅ Correo enviado a:", para);
        return { success: true, messageId: response.messageId };
    } catch (error) {
        console.error("❌ Error Brevo:", error.response?.body || error);
        return { success: false, error: error.response?.body || error.message };
    }
};

module.exports = enviarCorreo;