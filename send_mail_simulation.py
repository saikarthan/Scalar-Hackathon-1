import requests
import sys
import json

def send_email(sender, subject, body):
    # DEBUG: Using Port 8001 to capture server-side traceback
    url = "http://localhost:8001/api/inbound/webhook"
    payload = {
        "from": sender,
        "subject": subject,
        "body": body
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"✅ SUCCESSFULLY PUSHED TO GATEWAY: {subject}")
            res = response.json()
            print(f"🛡️ GOVERNANCE RESULT: {res.get('level')} | {res.get('category')}")
            if res.get("risks"):
                print(f"🚨 RISK DETECTED: {res.get('risks')}")
        else:
            print(f"❌ FAILED TO PUSH. Status: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        # Interactive mode
        print("--- Enterprise Gateway: Manual Mail Push ---")
        sender = input("From: ")
        subject = input("Subject: ")
        print("Body (Ctrl+D or Ctrl+Z to finish):")
        body = sys.stdin.read()
        send_email(sender, subject, body)
    else:
        # CLI mode
        send_email(sys.argv[1], sys.argv[2], sys.argv[3])
