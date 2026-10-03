from pathlib import Path


SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".html",
    ".css",
}


def scan_codebase(project_path):
    project_path = Path(project_path)

    files = []

    for file_path in project_path.rglob("*"): # the rg.lob is used to do the recuriversly check the folder
        if file_path.is_file() and file_path.suffix in SUPPORTED_EXTENSIONS:
            files.append(file_path)

    return files