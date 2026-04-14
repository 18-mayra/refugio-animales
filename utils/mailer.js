// utils/mailer.js - Ethereal (correo de prueba)
const nodemailer = require("nodemailer");

let transporter = null;
let testAccount = null;

const enviarCorreo = async (para, asunto, texto) => {
    try {
        if (!transporter) {
            testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log("📧 Ethereal configurado");
            console.log("   👤 Usuario:", testAccount.user);
        }
        
        const info = await transporter.sendMail({
            from: `"Refugio de Animales" <${testAccount.user}>`,
            to: para,
            subject: asunto,
            text: texto
        });
        
        console.log("✅ Correo enviado!");
        console.log("📧 VER EL CÓDIGO MFA AQUÍ:", nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error("❌ Error:", error.message);
        return false;
    }
};

module.exports = enviarCorreo;