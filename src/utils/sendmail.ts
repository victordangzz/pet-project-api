import 'dotenv/config'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

type SendMail = {
  email: string
  subject: string
  html: string
}
type MailOptions = Pick<SendMail, 'subject' | 'html'> & {
  from: string
  to: string
}

const htmlverifySendMail = fs.readFileSync(path.resolve('src/templates/mail.html'), 'utf8')

export const sendMail = ({ email, subject, html }: SendMail) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.MAIL_FROM_ADDRESS,
      pass: process.env.MAIL_PASSWORD
    }
  })

  const mailOptions: MailOptions = {
    from: process.env.MAIL_FROM_ADDRESS as string,
    to: email,
    subject,
    html
  }

  return transporter.sendMail(mailOptions)
}

export const verifySendMail = ({ email, subject, token }: { email: string; subject: string; token: string }) => {
  const html = htmlverifySendMail
    .replace('{{title}}', 'Please verify your email')
    .replace('{{content}}', 'Click button below to verify your email')
    .replace('{{button}}', 'Verify your email')
    .replace('{{link}}', `${process.env.CLIENT_URL}/verify-email?token=${token}`)
    .replace('{{titleLink}}', 'Button')
  return sendMail({ email, subject, html })
}

export const resetPasswordSendMail = ({ email, subject, token }: { email: string; subject: string; token: string }) => {
  const html = htmlverifySendMail
    .replace('{{title}}', 'Reset your password')
    .replace('{{content}}', 'Click button below to reset your password')
    .replace('{{button}}', 'Reset your password')
    .replace('{{link}}', `${process.env.CLIENT_URL}/reset-password?token=${token}`)
    .replace('{{titleLink}}', 'Button')
  return sendMail({ email, subject, html })
}

