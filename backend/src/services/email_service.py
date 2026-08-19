"""Small SMTP adapter. Mailpit works without credentials in development."""
from email.message import EmailMessage
import smtplib

from src.config import settings


class EmailService:
    def send(self, recipient: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.MAIL_FROM
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as client:
            if settings.SMTP_USE_TLS:
                client.starttls()
            if settings.SMTP_USERNAME:
                client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            client.send_message(message)
