import json

import networkx as nx
from pulp import LpVariable, LpProblem, LpMaximize, lpSum, LpStatus


class FlowLp:
    def __init__(self, json_graph):
        self.graph = FlowLp.build_graph(json_graph)
        self._detect_storage()
        self.graph.add_node('source')
        self.graph.add_node('sink')
        self._normalize_multi_source_sink()

        self._variables = {}

        for edge in self.graph.edges:
            self._variables[edge] = LpVariable(str(edge), lowBound=0,
                                               upBound=int(self.graph[edge[0]][edge[1]]['weight']))

        self._model = LpProblem('flow_problem', sense=LpMaximize)

        self._add_constraints_to_mode()

        # objective function
        self._model += lpSum([variable for k, variable in self._variables.items()])

    def solve(self):
        return LpStatus[self._model.solve()]

    @property
    def status(self):
        return LpStatus[self._model.status]

    def report(self):
        rep = ''
        rep += f"status: {self._model.status}, {LpStatus[self._model.status]}\n\n"
        rep += f"objective: {self._model.objective.value()}\n\n"
        rep += 'variables:\n'
        for var in self._model.variables():
            rep += f"{var.name.replace('_', ' ')}: {var.value()}\n"

        rep += '\nconstraints:\n'
        for name, constraint in self._model.constraints.items():
            rep += f"{name.replace('_', ' ')}: {constraint.value()}\n"

        return rep

    @property
    def model(self):
        return str(self._model).replace('_', ' ')

    @staticmethod
    def build_graph(json_str):
        j = json.loads(json_str)
        j_graph_nodes = j['nodes']
        j_graph_edges = j['links']

        DG = nx.DiGraph()
        DG.add_nodes_from([
            (node['id'], {'prod_rate': int(node['prod_rate']), 'use_rate': int(node['use_rate']), 'storage': False})
            for node in j_graph_nodes
        ])

        DG.add_weighted_edges_from([(e['from'], e['to'], e['weight']) for e in j_graph_edges])

        return DG

    def _detect_storage(self):
        for node in self.graph.nodes:
            in_edges = self.graph.in_edges(node)
            out_edges = self.graph.out_edges(node)

            if len(in_edges) and len(out_edges) and self.graph.nodes[node]['use_rate']:
                self.graph.nodes[node]['storage'] = True

    def _normalize_multi_source_sink(self):
        # normalize multi-source to single source
        for node in self.graph.nodes:
            in_edges = self.graph.in_edges(node)
            out_edges = self.graph.out_edges(node)

            if len(in_edges) == 0 and node not in ['source', 'sink']:
                self.graph.add_edge('source', node, weight=self.graph.nodes[node]['prod_rate'])

        # normalize multi-sink to single sink
        for node in self.graph.nodes:
            in_edges = self.graph.in_edges(node)
            out_edges = self.graph.out_edges(node)

            if len(out_edges) == 0 and node not in ['source', 'sink']:
                self.graph.add_edge(node, 'sink', weight=self.graph.nodes[node]['use_rate'])

    def _add_constraints_to_mode(self):
        for node in self.graph.nodes:
            # if node is not source or sink
            in_edges = self.graph.in_edges(node)
            out_edges = self.graph.out_edges(node)
            if len(in_edges) and len(out_edges):  # don't calculate source and sink
                if not self.graph.nodes[node]['storage']:
                    constraint = (
                        lpSum([self._variables[x] for x in in_edges]) <=
                        lpSum([self._variables[x] for x in out_edges]),
                        f'sum({str([x for x in in_edges])}) <= sum({str([x for x in out_edges])})')
                else:
                    constraint = (
                        (lpSum([self._variables[x] for x in in_edges])) - self.graph.nodes[node]['use_rate'] <=
                        lpSum([self._variables[x] for x in out_edges]),
                        f'sum({str([x for x in in_edges])}) - {self.graph.nodes[node]["use_rate"]} <= '
                        f'sum({str([x for x in out_edges])})')

                self._model += constraint
