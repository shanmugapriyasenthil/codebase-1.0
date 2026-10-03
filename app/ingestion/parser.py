from pathlib import Path
import ast

from app.ingestion.models import CodeFile
from app.ingestion.models import CodeFile, CodeFunction

def parse_source_code(source_code):
    return ast.parse(source_code)


def extract_functions(syntax_tree):
    functions = []

    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.FunctionDef):
            functions.append(node.name)

    return functions


def extract_imports(syntax_tree):
    imports = []

    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.append(name.name)

        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)

    return imports


def extract_function_calls(syntax_tree):
    relationships = []

    builtins = {
        "print",
        "len",
        "str",
        "int",
        "float",
        "list",
        "dict",
        "set",
        "tuple",
        "range",
        "enumerate",
        "open",
    }

    for node in ast.walk(syntax_tree):

        if isinstance(node, ast.FunctionDef):

            for child in ast.walk(node):

                if isinstance(child, ast.Call):

                    if isinstance(child.func, ast.Name):

                        callee = child.func.id

                        if callee not in builtins:
                            relationships.append({
                                "caller": node.name,
                                "callee": callee
                            })

    return relationships
def analyze_code_file(file_path, source_code):
    syntax_tree = parse_source_code(source_code)

    functions = extract_functions(syntax_tree, source_code)
    imports = extract_imports(syntax_tree)
    relationships = extract_function_calls(syntax_tree)

    return CodeFile(
        path=str(file_path),
        language="python",
        functions=functions,
        imports=imports,
        relationships=relationships,
    )
def extract_functions(syntax_tree, source_code):
    functions = []

    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.FunctionDef):
            code = ast.get_source_segment(source_code, node)

            functions.append(
                CodeFunction(
                    name=node.name,
                    code=code,
                )
            )

    return functions