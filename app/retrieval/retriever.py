import numpy as np


class CodeRetriever:
    def __init__(self, embedder):
        self.embedder = embedder
        self.chunks = []
        self.vectors = []

    def add_chunks(self, chunks):
        for chunk in chunks:
            vector = self.embedder.embed(chunk.code)

            self.chunks.append(chunk)
            self.vectors.append(vector)

    def search(self, query, top_k=3):
        query_vector = self.embedder.embed(query)

        scores = []

        for chunk, vector in zip(self.chunks, self.vectors):
            similarity = self._cosine_similarity(
                query_vector,
                vector
            )

            scores.append((chunk, similarity))

        scores.sort(
            key=lambda item: item[1],
            reverse=True
        )

        return scores[:top_k]

    @staticmethod
    def _cosine_similarity(vector_a, vector_b):
        return np.dot(vector_a, vector_b) / (
            np.linalg.norm(vector_a) *
            np.linalg.norm(vector_b)
        )