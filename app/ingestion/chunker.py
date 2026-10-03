from app.ingestion.models import CodeChunk


def create_chunks(code_file):
    chunks = []

    for function in code_file.functions:
        chunks.append(
            CodeChunk(
                file_path=code_file.path,
                chunk_type="function",
                name=function.name,
                code=function.code,
            )
        )

    return chunks