import NodeDetail from '@/components/tree/NodeDetail';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default function NodePage({ params }: Props) {
  return <NodeDetail nodeId={params.id} />;
}
