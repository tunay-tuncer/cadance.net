import { NextRequest, NextResponse } from "next/server";
import nodemailer, { SendMailOptions } from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { to, subject, html, text, cc, bcc, fromName } = body;

        // Check recipient and subject
        if (!to || typeof to !== "string" || !to.trim()) {
            return NextResponse.json(
                { error: "Geçerli bir alıcı e-posta adresi (to) belirtilmelidir." },
                { status: 400 }
            );
        }

        if (!subject || typeof subject !== "string" || !subject.trim()) {
            return NextResponse.json(
                { error: "E-posta konusu (subject) boş bırakılamaz." },
                { status: 400 }
            );
        }

        if (!html || typeof html !== "string") {
            return NextResponse.json(
                { error: "E-posta HTML içeriği bulunamadı." },
                { status: 400 }
            );
        }

        // Environment variables: supports both Email_User / Email_Pass and EMAIL_USER / EMAIL_PASS
        const emailUser =
            process.env.Email_User ||
            process.env.EMAIL_USER ||
            process.env.email_user;

        const emailPass =
            process.env.Email_Pass ||
            process.env.EMAIL_PASS ||
            process.env.email_pass;

        const emailHost =
            process.env.Email_Host ||
            process.env.EMAIL_HOST;

        const emailPort =
            process.env.Email_Port ||
            process.env.EMAIL_PORT;

        if (!emailUser || !emailPass) {
            return NextResponse.json(
                {
                    error:
                        "Email_User veya Email_Pass çevre değişkenleri tanımlanmamış. Lütfen .env veya .env.local dosyanıza Email_User ve Email_Pass (Gmail Uygulama Şifresi) değerlerini ekleyin.",
                },
                { status: 500 }
            );
        }

        // Configure transport
        let transporter;
        if (emailHost) {
            const port = Number(emailPort) || 587;
            transporter = nodemailer.createTransport({
                host: emailHost,
                port: port,
                secure: port === 465,
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            });
        } else {
            // Default to Gmail service
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            });
        }

        // Sender format: e.g. "Cadance Studio" <email@gmail.com>
        const senderDisplayName = fromName || "Cadance Studio";
        const fromAddress = `"${senderDisplayName}" <${emailUser}>`;

        // Send mail
        const mailOptions: SendMailOptions = {
            from: fromAddress,
            to: to.trim(),
            subject: subject.trim(),
            html: html,
            text: text || "Cadance Studio E-Posta",
        };

        if (cc && typeof cc === "string" && cc.trim()) {
            mailOptions.cc = cc.trim();
        }
        if (bcc && typeof bcc === "string" && bcc.trim()) {
            mailOptions.bcc = bcc.trim();
        }

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            response: info.response,
        });
    } catch (error: any) {
        console.error("Error in /api/send-mail:", error);
        return NextResponse.json(
            {
                error:
                    error.message ||
                    "E-posta gönderilirken beklenmeyen bir hata meydana geldi.",
            },
            { status: 500 }
        );
    }
}
