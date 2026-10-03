def connect_database():
    print("Database connected")


def get_user(username):
    connect_database()
    return {"username": username}