from pathlib import Path
import uuid
import os

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.analyzer import (
    extract_zip,
    analyze_project,
    PROJECT_GRAPHS
)

from app.ingestion.embedder import CodeEmbedder
from app.retrieval.vector_store import CodeVectorStore
from app.rag.generator import RAGGenerator


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="Codebase Intelligence Copilot"
)


# --------------------------------------------------
# Environment Variables
# --------------------------------------------------

load_dotenv(
    Path(__file__).parent.parent / ".env",
    override=True
)


# --------------------------------------------------
# AI Components
# --------------------------------------------------

embedder = CodeEmbedder()

api_key = os.getenv(
    "GROQ_API_KEY"
)

generator = RAGGenerator(
    api_key
)


# --------------------------------------------------
# Chat Request Model
# --------------------------------------------------

class ChatRequest(BaseModel):

    project_id: str

    question: str

    chat_history: list[dict] = []


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# --------------------------------------------------
# Upload Directory
# --------------------------------------------------

UPLOAD_DIR = Path(
    "data/uploads"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message":
        "Codebase Intelligence Copilot API is running"
    }


# --------------------------------------------------
# Upload Codebase
# --------------------------------------------------

@app.post("/upload")
async def upload_codebase(
    file: UploadFile = File(...)
):

    # Create unique project ID

    project_id = str(
        uuid.uuid4()
    )


    # Create project directory

    project_dir = (
        UPLOAD_DIR / project_id
    )

    project_dir.mkdir(
        parents=True,
        exist_ok=True
    )


    # ZIP file location

    zip_path = (
        project_dir / file.filename
    )


    # Read uploaded file

    contents = await file.read()


    # Save ZIP

    with open(
        zip_path,
        "wb"
    ) as output_file:

        output_file.write(
            contents
        )


    # Extraction directory

    extracted_path = (
        project_dir / "project"
    )


    # Extract ZIP

    extract_zip(
        zip_path,
        extracted_path
    )


    # Analyze project

    analysis = analyze_project(
        extracted_path,
        project_id
    )


    return {

        "project_id":
        project_id,

        "filename":
        file.filename,

        "message":
        "Codebase analyzed successfully",

        "analysis":
        analysis
    }


# --------------------------------------------------
# Chat With Codebase
# --------------------------------------------------

@app.post("/chat")
def chat(
    request: ChatRequest
):

    # --------------------------------------------------
    # 1. Get project vector store
    # --------------------------------------------------

    vector_store = CodeVectorStore(
        collection_name=
        f"codebase_{request.project_id}"
    )


    # --------------------------------------------------
    # 2. Convert question into embedding
    # --------------------------------------------------

    query_vector = embedder.embed(
        request.question
    )


    # --------------------------------------------------
    # 3. Semantic search
    # --------------------------------------------------

    results = vector_store.search(
        query_vector,
        top_k=3
    )


    # --------------------------------------------------
    # 4. Get retrieved functions
    # --------------------------------------------------

    retrieved_function_names = []

    for metadata in results["metadatas"][0]:

        function_name = metadata["name"]

        retrieved_function_names.append(
            function_name
        )


    # --------------------------------------------------
    # 5. Get project graph
    # --------------------------------------------------

    graph = PROJECT_GRAPHS.get(
        request.project_id
    )


    # --------------------------------------------------
    # 6. Find related functions
    # --------------------------------------------------

    related_function_names = []

    if graph:

        related_function_names = (
            graph.get_related_functions(
                retrieved_function_names
            )
        )


    # --------------------------------------------------
    # 7. Debug information
    # --------------------------------------------------

    print(
        "RETRIEVED FUNCTIONS:",
        retrieved_function_names
    )

    print(
        "RELATED FUNCTIONS:",
        related_function_names
    )


    # --------------------------------------------------
    # 8. Retrieve related code
    # --------------------------------------------------

    related_results = (
        vector_store.search_by_function_names(
            related_function_names
        )
    )


    # --------------------------------------------------
    # 9. Build code context
    # --------------------------------------------------

    context_parts = []

    added_functions = set()


    # --------------------------------------------------
    # Semantic results
    # --------------------------------------------------

    for i in range(
        len(
            results["documents"][0]
        )
    ):

        file_path = (
            results["metadatas"][0][i]
            ["file_path"]
        )

        function_name = (
            results["metadatas"][0][i]
            ["name"]
        )

        code = (
            results["documents"][0][i]
        )


        if function_name in added_functions:

            continue


        added_functions.add(
            function_name
        )


        context_parts.append(
            f"""
File: {file_path}

Function: {function_name}

{code}
"""
        )


    # --------------------------------------------------
    # Graph-related code
    # --------------------------------------------------

    for i in range(
        len(
            related_results["documents"]
        )
    ):

        file_path = (
            related_results["metadatas"][i]
            ["file_path"]
        )

        function_name = (
            related_results["metadatas"][i]
            ["name"]
        )

        code = (
            related_results["documents"][i]
        )


        if function_name in added_functions:

            continue


        added_functions.add(
            function_name
        )


        context_parts.append(
            f"""
File: {file_path}

Function: {function_name}

{code}
"""
        )


    context = "\n".join(
        context_parts
    )


    # --------------------------------------------------
    # 10. Create query-specific graph
    # --------------------------------------------------

    query_graph = {
        "nodes": [],
        "edges": []
    }


    if graph:

        # Functions found directly
        # by semantic search

        query_functions = set(
            retrieved_function_names
        )


        # Functions connected to them
        # in the code graph

        query_functions.update(
            related_function_names
        )


        # Create smaller graph

        subgraph = graph.graph.subgraph(
            query_functions
        ).copy()


        # Add nodes

        for node in subgraph.nodes:

            query_graph["nodes"].append({

                "id":
                node,

                "label":
                node

            })


        # Add edges

        for caller, callee in (
            subgraph.edges
        ):

            query_graph["edges"].append({

                "source":
                caller,

                "target":
                callee

            })


    # --------------------------------------------------
    # 11. Debug query graph
    # --------------------------------------------------

    print(
        "QUERY GRAPH:",
        query_graph
    )


    # --------------------------------------------------
    # 12. Add full graph context
    # --------------------------------------------------

    graph_context = ""


    if graph:

        graph_context = (
            "\nCODE RELATIONSHIPS:\n"
        )


        for caller, callee in (
            graph.graph.edges
        ):

            graph_context += (
                f"{caller} -> {callee}\n"
            )


    # --------------------------------------------------
    # 13. Convert chat history into text
    # --------------------------------------------------

    history_parts = []


    for message in request.chat_history:

        role = message.get(
            "role",
            ""
        )

        content = message.get(
            "content",
            ""
        )


        if role == "user":

            history_parts.append(
                f"User: {content}"
            )


        elif role == "assistant":

            history_parts.append(
                f"Copilot: {content}"
            )


    chat_history_text = "\n".join(
        history_parts
    )


    # --------------------------------------------------
    # 14. Combine code + graph context
    # --------------------------------------------------

    full_context = (
        context
        + "\n"
        + graph_context
    )


    # --------------------------------------------------
    # 15. Generate answer
    # --------------------------------------------------

    answer = generator.generate(
        request.question,
        full_context,
        chat_history_text
    )


    # --------------------------------------------------
    # 16. Return response
    # --------------------------------------------------

    return {

        "question":
        request.question,

        "answer":
        answer,

        "query_graph":
        query_graph

    }