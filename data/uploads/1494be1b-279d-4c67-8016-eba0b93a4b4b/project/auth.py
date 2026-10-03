def login(username, password):
    if verify_user(username, password):
        return "Login successful"

    return "Login failed"


def verify_user(username, password):
    return username == "admin" and password == "1234"