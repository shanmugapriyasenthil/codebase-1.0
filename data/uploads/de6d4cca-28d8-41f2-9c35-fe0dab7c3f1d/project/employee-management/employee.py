from database import find_employee, insert_employee
from utils import validate_email


def get_employee(employee_id):
    employee = find_employee(employee_id)

    if employee:
        return {
            "id": employee[0],
            "name": employee[1],
            "email": employee[2],
            "department": employee[3],
            "salary": employee[4]
        }

    return None


def add_employee(name, email, department, salary):
    if not validate_email(email):
        print("Invalid email address.")
        return False

    insert_employee(
        name,
        email,
        department,
        salary
    )

    return True