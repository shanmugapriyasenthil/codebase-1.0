import chromadb


class CodeVectorStore:

    def __init__(
        self,
        collection_name="codebase"
    ):

        self.client = chromadb.PersistentClient(
            path="./data/chroma"
        )

        self.collection = (
            self.client.get_or_create_collection(
                name=collection_name
            )
        )


    def add_chunks(
        self,
        chunks,
        embedder
    ):

        documents = []
        embeddings = []
        ids = []
        metadatas = []

        for index, chunk in enumerate(chunks):

            documents.append(
                chunk.code
            )

            embeddings.append(
                embedder
                .embed(chunk.code)
                .tolist()
            )

            ids.append(
                f"{chunk.file_path}:{chunk.name}:{index}"
            )

            metadatas.append({
                "file_path": chunk.file_path,
                "chunk_type": chunk.chunk_type,
                "name": chunk.name,
            })

        self.collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )


    def search(
        self,
        query_vector,
        top_k=3
    ):

        return self.collection.query(
            query_embeddings=[
                query_vector.tolist()
            ],
            n_results=top_k,
        )


    def search_by_function_names(
        self,
        function_names
    ):

        if not function_names:

            return {
                "documents": [],
                "metadatas": []
            }

        return self.collection.get(
            where={
                "name": {
                    "$in": function_names
                }
            },
            include=[
                "documents",
                "metadatas"
            ]
        )