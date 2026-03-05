/**
 * Knowledge Graph Layer
 * Builds relationships between vehicles, error codes, symptoms, procedures, and components
 * Enables multi-dimensional queries and intelligent recommendations
 */

export interface KnowledgeNode {
  id: string;
  type: "vehicle" | "dtc" | "symptom" | "procedure" | "component" | "torque_spec";
  data: any;
  confidence: number;
  sources: string[];
}

export interface KnowledgeEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  relationship:
    | "has_engine"
    | "produces_error"
    | "has_symptom"
    | "fixed_by"
    | "requires_component"
    | "requires_torque"
    | "similar_to";
  confidence: number;
  metadata?: any;
}

export interface QueryPath {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  totalConfidence: number;
  distance: number;
}

/**
 * Knowledge Graph
 */
export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map(); // node -> connected nodes
  private edgeIndex: Map<string, Set<string>> = new Map(); // relationship type -> edges

  /**
   * Add node to graph
   */
  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);

    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
  }

  /**
   * Add edge to graph
   */
  addEdge(edge: KnowledgeEdge): void {
    // Validate nodes exist
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(
        `Edge references non-existent nodes: ${edge.source} -> ${edge.target}`
      );
    }

    this.edges.set(edge.id, edge);

    // Update adjacency list
    this.adjacencyList.get(edge.source)?.add(edge.target);
    this.adjacencyList.get(edge.target)?.add(edge.source);

    // Index by relationship type
    if (!this.edgeIndex.has(edge.relationship)) {
      this.edgeIndex.set(edge.relationship, new Set());
    }
    this.edgeIndex.get(edge.relationship)?.add(edge.id);
  }

  /**
   * Find vehicle by make/model/year
   */
  findVehicle(make: string, model: string, year: number): KnowledgeNode | null {
    let result: KnowledgeNode | null = null;
    this.nodes.forEach((node) => {
      if (
        node.type === "vehicle" &&
        node.data.make === make &&
        node.data.model === model &&
        node.data.year === year
      ) {
        result = node;
      }
    });
    return result;
  }

  /**
   * Find DTC code node
   */
  findDTC(code: string): KnowledgeNode | null {
    let result: KnowledgeNode | null = null;
    this.nodes.forEach((node) => {
      if (node.type === "dtc" && node.data.code === code) {
        result = node;
      }
    });
    return result;
  }

  /**
   * Find procedures for a DTC
   */
  findProceduresForDTC(dtcCode: string): KnowledgeNode[] {
    const dtcNode = this.findDTC(dtcCode);
    if (!dtcNode) return [];

    const procedures: KnowledgeNode[] = [];
    const connectedNodes = this.adjacencyList.get(dtcNode.id) || new Set();

    connectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node?.type === "procedure") {
        procedures.push(node);
      }
    });

    return procedures;
  }

  /**
   * Find all symptoms for a DTC
   */
  findSymptomsForDTC(dtcCode: string): KnowledgeNode[] {
    const dtcNode = this.findDTC(dtcCode);
    if (!dtcNode) return [];

    const symptoms: KnowledgeNode[] = [];
    const connectedNodes = this.adjacencyList.get(dtcNode.id) || new Set();

    connectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node?.type === "symptom") {
        symptoms.push(node);
      }
    });

    return symptoms;
  }

  /**
   * Find components required for a procedure
   */
  findComponentsForProcedure(procedureId: string): KnowledgeNode[] {
    const components: KnowledgeNode[] = [];
    const connectedNodes = this.adjacencyList.get(procedureId) || new Set();

    connectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node?.type === "component") {
        components.push(node);
      }
    });

    return components;
  }

  /**
   * Find torque specifications for a component
   */
  findTorqueSpecsForComponent(componentId: string): KnowledgeNode[] {
    const specs: KnowledgeNode[] = [];
    const connectedNodes = this.adjacencyList.get(componentId) || new Set();

    connectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node?.type === "torque_spec") {
        specs.push(node);
      }
    });

    return specs;
  }

  /**
   * Find shortest path between two nodes (BFS)
   */
  findShortestPath(sourceId: string, targetId: string): QueryPath | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    const queue: Array<{ nodeId: string; path: string[]; edges: string[] }> = [
      { nodeId: sourceId, path: [sourceId], edges: [] },
    ];
    const visited = new Set<string>();
    visited.add(sourceId);

    while (queue.length > 0) {
      const { nodeId, path, edges: pathEdges } = queue.shift()!;

      if (nodeId === targetId) {
        // Found path - reconstruct
        const nodes = path.map((id) => this.nodes.get(id)!);
        const edgeObjs = pathEdges.map((id) => this.edges.get(id)!);

        const totalConfidence = edgeObjs.reduce((sum, e) => sum * e.confidence, 1);

        return {
          nodes,
          edges: edgeObjs,
          totalConfidence,
          distance: path.length - 1,
        };
      }

      const neighbors = this.adjacencyList.get(nodeId) || new Set();

      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);

      // Find edge connecting nodeId to neighborId
      let connectingEdgeId = "";
      this.edges.forEach((edge, edgeId) => {
        if (
          (edge.source === nodeId && edge.target === neighborId) ||
          (edge.source === neighborId && edge.target === nodeId)
        ) {
          connectingEdgeId = edgeId;
        }
      });

          queue.push({
            nodeId: neighborId,
            path: [...path, neighborId],
            edges: [...pathEdges, connectingEdgeId],
          });
        }
      });
    }

    return null;
  }

  /**
   * Find all nodes of a specific type
   */
  findNodesByType(type: string): KnowledgeNode[] {
    const results: KnowledgeNode[] = [];

    this.nodes.forEach((node) => {
      if (node.type === type) {
        results.push(node);
      }
    });

    return results;
  }

  /**
   * Find edges by relationship type
   */
  findEdgesByRelationship(relationship: string): KnowledgeEdge[] {
    const edgeIds = this.edgeIndex.get(relationship) || new Set();
    const results: KnowledgeEdge[] = [];

    edgeIds.forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        results.push(edge);
      }
    });

    return results;
  }

  /**
   * Recommend solutions for symptom
   */
  recommendSolutions(symptom: string, vehicle: any): any[] {
    const solutions: any[] = [];

    // Find symptom node
    let symptomNode: KnowledgeNode | null = null;
    this.nodes.forEach((node) => {
      if (node.type === "symptom" && node.data.name === symptom) {
        symptomNode = node;
      }
    });

    if (!symptomNode) return [];

    // Find connected DTCs
    const connectedNodes = this.adjacencyList.get((symptomNode as KnowledgeNode).id) || new Set();
    const dtcs: KnowledgeNode[] = [];

    connectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node?.type === "dtc") {
        dtcs.push(node);
      }
    });

    // For each DTC, find procedures
    dtcs.forEach((dtc) => {
      const procedures = this.findProceduresForDTC(dtc.data.code);

      procedures.forEach((procedure) => {
        const components = this.findComponentsForProcedure(procedure.id);

        solutions.push({
          dtc: dtc.data,
          procedure: procedure.data,
          components: components.map((c) => c.data),
          confidence: Math.min(
            dtc.confidence,
            procedure.confidence,
            symptomNode!.confidence
          ),
        });
      });
    });

    // Sort by confidence
    solutions.sort((a, b) => b.confidence - a.confidence);

    return solutions;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      totalNodes: this.nodes.size,
      nodesByType: this.getNodeCountByType(),
      totalEdges: this.edges.size,
      edgesByRelationship: this.getEdgeCountByRelationship(),
      averageConnections: this.getAverageConnections(),
    };
  }

  /**
   * Get node count by type
   */
  private getNodeCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    this.nodes.forEach((node) => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get edge count by relationship
   */
  private getEdgeCountByRelationship(): Record<string, number> {
    const counts: Record<string, number> = {};

    this.edges.forEach((edge) => {
      counts[edge.relationship] = (counts[edge.relationship] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get average connections per node
   */
  private getAverageConnections(): number {
    let totalConnections = 0;

    this.adjacencyList.forEach((connections) => {
      totalConnections += connections.size;
    });

    return this.nodes.size > 0 ? totalConnections / this.nodes.size : 0;
  }

  /**
   * Export graph as JSON
   */
  export() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      stats: this.getStats(),
    };
  }

  /**
   * Import graph from JSON
   */
  import(data: any): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.edgeIndex.clear();

    for (const node of data.nodes) {
      this.addNode(node);
    }

    for (const edge of data.edges) {
      this.addEdge(edge);
    }
  }
}

export default KnowledgeGraph;
