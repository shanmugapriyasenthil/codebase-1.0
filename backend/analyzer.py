from pathlib import Path
from zipfile import ZipFile

from app.ingestion.embedder import CodeEmbedder
from app.retrieval.vector_store import CodeVectorStore
from app.ingestion.scanner import scan_codebase
from app.ingestion.reader import read_source_file
from app.ingestion.parser import analyze_code_file
from app.ingestion.chunker import create_chunks
from app.intelligence.code_graph import CodeGraph


# Store graphs for uploaded projects
PROJECT_GRAPHS = {}


def extract_zip(zip_path, extract_path):

    extract_path = Path(extract_path)
    extract_path.mkdir(
        parents=True,
        exist_ok=True
    )

    with ZipFile(zip_path, "r") as zip_file:

        for member in zip_file.infolist():

            target_path = extract_path / member.filename

            # Prevent ZIP path traversal attacks
            if not target_path.resolve().is_relative_to(
                extract_path.resolve()
            ):
                raise ValueError("Unsafe ZIP file")

            if member.is_dir():

                target_path.mkdir(
                    parents=True,
                    exist_ok=True
                )

            else:

                target_path.parent.mkdir(
                    parents=True,
                    exist_ok=True
                )

                with zip_file.open(member) as source:

                    with open(
                        target_path,
                        "wb"
                    ) as target:

                        target.write(
                            source.read()
                        )

    return extract_path


def analyze_project(project_path, project_id):

    # Create embedding model
    embedder = CodeEmbedder()

    # Create project-specific vector store
    vector_store = CodeVectorStore(
        collection_name=f"codebase_{project_id}"
    )

    # Find source files
    files = scan_codebase(project_path)

    all_chunks = []

    # Create graph for this project
    code_graph = CodeGraph()

    analyzed_files = []

    # Analyze every file
    for file in files:

        # Currently supporting Python
        if file.suffix != ".py":
            continue

        # Read source code
        source_code = read_source_file(file)

        # Parse and analyze code
        code_file = analyze_code_file(
            file,
            source_code
        )

        # Create chunks
        chunks = create_chunks(
            code_file
        )

        all_chunks.extend(
            chunks
        )

        # Add relationships to graph
        for relationship in code_file.relationships:

            code_graph.add_relationship(
                relationship["caller"],
                relationship["callee"]
            )

        analyzed_files.append(
            str(file)
        )

    # Store code chunks in Chroma
    vector_store.add_chunks(
        all_chunks,
        embedder
    )

    # Convert graph relationships
    # into JSON-friendly data
    relationships = []

    for caller, callee in code_graph.graph.edges:

        relationships.append({
            "caller": caller,
            "callee": callee
        })

    # IMPORTANT:
    # Save graph using project ID
    PROJECT_GRAPHS[project_id] = code_graph

    return {
        "files": analyzed_files,
        "file_count": len(analyzed_files),
        "chunk_count": len(all_chunks),
        "relationships": relationships
    }