from langchain_groq import ChatGroq


class RAGGenerator:

    def __init__(self, api_key):

        self.llm = ChatGroq(
            model="openai/gpt-oss-20b",
            api_key=api_key,
            temperature=0
        )


    def generate(
        self,
        question,
        context,
        chat_history=""
    ):

        prompt = f"""
You are a Codebase Intelligence Copilot.

Answer the user's question using the provided code context
and previous conversation when relevant.

Previous Conversation:
{chat_history}

Current Question:
{question}

Code Context:
{context}

Instructions:

- Use the code context as the primary source of truth.
- Use previous conversation to understand follow-up questions.
- If the user refers to "that function", "that file", "it",
  or similar words, use the previous conversation to resolve
  what they are referring to.
- Explain the answer clearly.
- Do not invent code or relationships that are not present
  in the provided context.
"""

        response = self.llm.invoke(
            prompt
        )

        return response.content