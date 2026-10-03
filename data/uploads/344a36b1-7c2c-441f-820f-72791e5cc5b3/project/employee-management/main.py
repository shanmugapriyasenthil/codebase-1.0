from auth import login
from employee import get_employee, add_employee
from database import initialize_database


def main():
    initialize_database()

    username = input("Username: ")
    password = input("Password: ")

    if login(username, password):
        print("Login successful!")

        employee_id = int(input("Enter Employee ID: "))

        employee = get_employee(employee_id)

        if employee:
            print("Employee Details:")
            print(employee)
        else:
            print("Employee not found.")
    else:
        print("Invalid username or password.")


if __name__ == "__main__":
    main()