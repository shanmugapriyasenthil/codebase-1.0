from database import get_connection
from utils import hash_password


def login(username, password):
    connection = get_connection()

    cursor = connection.cursor()

    password_hash = hash_password(password)

    query = """
        SELECT id
        FROM users
        WHERE username = ? AND password = ?
    """

    cursor.execute(query, (username, password_hash))

    user = cursor.fetchone()

    connection.close()

    return user is not None