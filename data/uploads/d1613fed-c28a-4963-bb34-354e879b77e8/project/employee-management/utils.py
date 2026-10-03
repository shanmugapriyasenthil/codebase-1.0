import hashlib
import re


def hash_password(password):
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


def validate_email(email):
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    return re.match(pattern, email) is not None


def format_salary(salary):
    return f"₹{salary:,.2f}"