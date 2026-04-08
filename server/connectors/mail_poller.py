import imaplib
import email
from email.header import decode_header
import time
import os
import asyncio
from typing import Optional
from support_triage_env.server.mailbox import MAILBOX

class IMAPPoller:
    def __init__(self, host: str, user: str, password: str, folder: str = "INBOX"):
        self.host = host
        self.user = user
        self.password = password
        self.folder = folder
        self.is_running = False

    def decode_str(self, s):
        value, encoding = decode_header(s)[0]
        if isinstance(value, bytes):
            return value.decode(encoding or 'utf-8')
        return value

    async def poll_once(self):
        try:
            # Connect and Login
            mail = imaplib.IMAP4_SSL(self.host)
            mail.login(self.user, self.password)
            mail.select(self.folder)

            # Search for UNSEEN messages
            status, messages = mail.search(None, 'UNSEEN')
            if status != 'OK':
                return

            for num in messages[0].split():
                # Fetch the email body
                status, data = mail.fetch(num, '(RFC822)')
                if status != 'OK':
                    continue

                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)

                # Extract metadata
                subject = self.decode_str(msg.get("Subject", "No Subject"))
                from_addr = self.decode_str(msg.get("From", "unknown@it.corp"))
                
                # Extract plain text body
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            break
                else:
                    body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

                # Push to the Gateway
                print(f"📡 IMAP POLLER: Received new email from {from_addr}")
                await MAILBOX.push_email(from_addr, subject, body)

            mail.logout()
        except Exception as e:
            print(f"📡 IMAP POLLER ERROR: {e}")

    async def start(self, interval: int = 20):
        print(f"📡 IMAP POLLER: Starting listener for {self.user} on {self.host}...")
        self.is_running = True
        while self.is_running:
            await self.poll_once()
            await asyncio.sleep(interval)

    def stop(self):
        self.is_running = False
