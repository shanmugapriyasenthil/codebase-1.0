import sqlite3


DATABASE_NAME = "employees.db"


def get_connection():
    return sqlite3.connect(DATABASE_NAME)


def initialize_database():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            department TEXT,
            salary REAL
        )
    """)

    connection.commit()
    connection.close()


def insert_employee(name, email, department, salary):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO employees
        (name, email, department, salary)
        VALUES (?, ?, ?, ?)
    """, (name, email, department, salary))

    connection.commit()
    connection.close()


def find_employee(employee_id):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, name, email, department, salary
        FROM employees
        WHERE id = ?
    """, (employee_id,))

    employee = cursor.fetchone()

    connection.close()

    return employee