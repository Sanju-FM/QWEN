'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { QHSENode } from '@/types/qhse';
import TreeNode, { type QHSEFlowData } from './TreeNode';

const nodeTypes = { qhse: TreeNode };

interface LayoutResult {
  nodes: Node<QHSEFlowData>[];
  edges: Edge[];
}

/**
 * Simple tidy left-to-right tree layout: leaves stack vertically, each parent
 * is centred between its children. Deterministic so re-renders don't jump.
 */
function buildLayout(root: QHSENode): LayoutResult {
  const nodes: Node<QHSEFlowData>[] = [];
  const edges: Edge[] = [];
  let leafCursor = 0;

  const walk = (node: QHSENode, depth: number): number => {
    const x = depth * 280;
    let y: number;
    if (node.children.length === 0) {
      y = leafCursor * 74;
      leafCursor += 1;
    } else {
      const childYs = node.children.map((c) => walk(c, depth + 1));
      y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    }

    nodes.push({
      id: node.id,
      type: 'qhse',
      position: { x, y },
      draggable: false,
      data: {
        label: node.title,
        status: node.status,
        childCount: node.children.length,
        parentId: node.parentId,
      },
    });

    for (const child of node.children) {
      edges.push({
        id: `e-${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
        style: { stroke: '#60a5fa', strokeWidth: 1.5 },
      });
    }
    return y;
  };

  walk(root, 0);
  return { nodes, edges };
}

interface Props {
  tree: QHSENode;
  selectedId?: string | null;
  onNodeClick: (id: string) => void;
}

export default function MindMap({ tree, selectedId, onNodeClick }: Props) {
  const layout = useMemo(() => buildLayout(tree), [tree]);
  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  // Re-sync when the tree changes (edits, added/removed children)
  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  // Highlight the selected node without rebuilding the layout
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedId },
      })),
    );
  }, [selectedId, setNodes]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onNodeClick(node.id),
    [onNodeClick],
  );

  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={16} />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const d = n.data as QHSEFlowData;
            return d?.status === 'active'
              ? '#1e3a5f'
              : d?.status === 'review'
                ? '#78350f'
                : d?.status === 'closed'
                  ? '#14532d'
                  : '#374151';
          }}
          maskColor="rgba(17,24,39,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
