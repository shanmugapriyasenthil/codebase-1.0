import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from tavily import TavilyClient

load_dotenv(dotenv_path=".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)

search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

class ChatRequest(BaseModel):
    question: str

@app.get("/")
def home():
    return {"message": "AskWeb 2.0 backend is running"}

@app.post("/search")
def search(request: ChatRequest):
    try:
        results = search_client.search(
            query=request.question,
            max_results=3
        )
        return results
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        search_response = search_client.search(
            query=request.question,
            max_results=3
        )

        results = search_response.get("results", [])

        if not results:
            return {
                "answer": "No search results found.",
                "sources": []
            }

        context = "\n\n".join(
            [
                f"Title: {item.get('title')}\n"
                f"URL: {item.get('url')}\n"
                f"Content: {item.get('content')}"
                for item in results
            ]
        )

        prompt = f"""
You are AskWeb 2.0, an AI assistant with live web search.

Instructions:
- Answer using only the search results given below.
- Keep the answer very simple and easy to understand.
- Use short sentences.
- Do not use difficult words unless necessary.
- Keep the tone natural and friendly.
- Do not make up facts.
- If useful, give the answer in 3 to 5 short points.
- At the end, give a short conclusion in one line.

User Question:
{request.question}

Search Results:
{context}
"""

        response = llm.invoke(prompt)

        return {
            "answer": response.content.strip(),
            "sources": [item.get("url") for item in results]
        }

    except Exception as e:
        return {"error": str(e)}