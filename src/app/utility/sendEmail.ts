import nodeMailer from "nodemailer";

import SMTPTransport from "nodemailer/lib/smtp-transport";

import path from "path";
import ejs from "ejs";
import dbConfig from "../config/db.config";
import AppError from "../errorHelpers/AppError";

const transporter = nodeMailer.createTransport({
  secure: true,
  auth: {
    user: dbConfig.smtp.smtp_user,
    pass: dbConfig.smtp.smtp_pass,
  },
  port: Number(dbConfig.smtp.smtp_port),
  host: dbConfig.smtp.smtp_host,
} as SMTPTransport.Options);

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
  try {
    const templatePath = path.join(__dirname, `templates/${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transporter.sendMail({
      from: dbConfig.smtp.smtp_from,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.log("email sending error", error.message);
    throw new AppError(401, "Email error", error);
  }
};
