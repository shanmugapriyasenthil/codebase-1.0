from auth import login

def start_application():
    result = login("admin", "1234")
    print(result)


start_application()