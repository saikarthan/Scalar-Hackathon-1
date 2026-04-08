import json
import os
import time
import jwt # PyJWT
from typing import List, Dict, Optional, Any

SECRET_KEY = os.environ.get("JWT_SECRET", "scaler_hackathon_super_secret_shield")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "users.json")

class AuthManager:
    def __init__(self):
        self.users: List[Dict[str, Any]] = []
        self._load_users()

    def _load_users(self):
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, "r", encoding="utf-8") as f:
                    self.users = json.load(f)
            except (json.JSONDecodeError, UnicodeError):
                # RULE 1: Self-Healing (Reset if corrupted)
                self._reset_to_default()
        else:
            self._reset_to_default()

    def _reset_to_default(self):
        # DEFAULT ROOT ADMIN (Rule 1: Bootstrapped)
        self.users = [
            {"uid": "admin", "username": "admin", "password": "password", "role": "admin"}
        ]
        self._save_users()

    def _save_users(self):
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(self.users, f, indent=2)

    def login(self, username, password) -> Optional[str]:
        for user in self.users:
            if user["username"] == username and user["password"] == password:
                # Generate JWT (Rule 2: Scoped Sessions)
                token = jwt.encode({
                    "uid": user["uid"],
                    "role": user["role"],
                    "exp": time.time() + (3600 * 24) # 24 hours
                }, SECRET_KEY, algorithm="HS256")
                
                # Ensure compatibility across PyJWT versions (bytes vs str)
                if isinstance(token, bytes):
                    token = token.decode('utf-8')
                return token
        return None

    def add_member(self, username, password, role="analyst") -> bool:
        if any(u["username"] == username for u in self.users):
            return False
        
        new_user = {
            "uid": f"user_{len(self.users) + 1}",
            "username": username,
            "password": password,
            "role": role
        }
        self.users.append(new_user)
        self._save_users()
        return True

    def list_members(self) -> List[Dict[str, str]]:
        # Return sanitized list (Rule 3: No passwords in logs/API)
        return [{"uid": u["uid"], "username": u["username"], "role": u["role"]} for u in self.users]

# GLOBAL SINGLETON
AUTH = AuthManager()
