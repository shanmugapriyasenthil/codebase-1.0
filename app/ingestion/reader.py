from pathlib import Path


def read_source_file(file_path):
    file_path = Path(file_path)

    with file_path.open("r", encoding="utf-8") as file:
        return file.read()