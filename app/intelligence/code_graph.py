import networkx as nx
import matplotlib.pyplot as plt


class CodeGraph:

    def __init__(self):
        self.graph = nx.DiGraph()

    def add_relationship(self, caller, callee):

        self.graph.add_edge(
            caller,
            callee
        )

    def get_dependencies(self, function_name):

        return list(
            self.graph.successors(
                function_name
            )
        )

    def get_related_functions(self, function_names):

        related_functions = set()

        for function_name in function_names:

            if self.graph.has_node(function_name):

                # Functions called by this function
                related_functions.update(
                    self.graph.successors(
                        function_name
                    )
                )

                # Functions that call this function
                related_functions.update(
                    self.graph.predecessors(
                        function_name
                    )
                )

        return list(
            related_functions
        )

    def get_subgraph(self, function_names):

        nodes = set(function_names)

        for function_name in function_names:

            if self.graph.has_node(function_name):

                nodes.update(
                    self.graph.successors(
                        function_name
                    )
                )

                nodes.update(
                    self.graph.predecessors(
                        function_name
                    )
                )

        subgraph = self.graph.subgraph(
            nodes
        ).copy()

        return subgraph

    def show_graph(self):

        print("\nCODE RELATIONSHIPS")

        for caller, callee in self.graph.edges:

            print(
                f"{caller} -> {callee}"
            )

    def visualize(self):

        plt.figure(
            figsize=(10, 6)
        )

        positions = nx.spring_layout(
            self.graph,
            seed=42
        )

        nx.draw(
            self.graph,
            positions,
            with_labels=True,
            node_size=3000,
            arrows=True,
            font_size=10
        )

        plt.title(
            "Codebase Function Relationships"
        )

        plt.show()