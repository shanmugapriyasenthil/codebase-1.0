from app.ingestion.scanner import scan_codebase
from app.ingestion.reader import read_source_file
from app.ingestion.parser import analyze_code_file
from app.ingestion.chunker import create_chunks
from app.ingestion.embedder import CodeEmbedder
from app.retrieval.vector_store import CodeVectorStore
import os
from pathlib import Path
from dotenv import load_dotenv
from app.rag.generator import RAGGenerator
from app.intelligence.code_graph import CodeGraph
# 1. Find all source files
project_path = "workspace/sample_project"

files = scan_codebase(project_path)

print("FILES FOUND:")
for file in files:
    print(file)


# 2. Analyze files and create chunks
all_chunks = []
code_graph = CodeGraph()    
for file in files:

    source_code = read_source_file(file)

    code_file = analyze_code_file(
        file,
        source_code
    )

    chunks = create_chunks(code_file)

    all_chunks.extend(chunks)
    for relationship in code_file.relationships:

        code_graph.add_relationship(
            relationship["caller"],
            relationship["callee"]
        )
print("\nCODE RELATIONSHIPS")

code_graph.show_graph()
code_graph.visualize()
print("\nLOGIN DEPENDENCIES")

dependencies = code_graph.get_dependencies("login")

for dependency in dependencies:
    print(dependency)

print("\nTOTAL CHUNKS:", len(all_chunks))


# 3. Create embedding model
embedder = CodeEmbedder()


# 4. Create ChromaDB vector store
vector_store = CodeVectorStore()
load_dotenv()

from pathlib import Path
from dotenv import load_dotenv
import os


env_path = Path(__file__).parent / ".env"

load_dotenv(env_path, override=True)

api_key = os.getenv("GROQ_API_KEY")

print("API KEY FOUND:", api_key is not None)
print("API KEY PREFIX:", api_key[:4] if api_key else None)

generator = RAGGenerator(api_key)

 
# 5. Store all code chunks in ChromaDB
vector_store.add_chunks(
    all_chunks,
    embedder
)

print("\nCODE STORED IN CHROMA")


# 6. Create a query
query = "How does login verify the user?"

query_vector = embedder.embed(query)


# 7. Search ChromaDB
results = vector_store.search(
    query_vector,
    top_k=3
)


# 8. Display results
# Create context from retrieved code
context_parts = []

for i in range(len(results["documents"][0])):

    file_path = results["metadatas"][0][i]["file_path"]
    function_name = results["metadatas"][0][i]["name"]
    code = results["documents"][0][i]

    context_parts.append(
        f"""
File: {file_path}
Function: {function_name}

{code}
"""
    )


context = "\n".join(context_parts)


# Generate answer using LLM
answer = generator.generate(
    query,
    context
)


print("\nCOPILOT ANSWER")
print(answer)