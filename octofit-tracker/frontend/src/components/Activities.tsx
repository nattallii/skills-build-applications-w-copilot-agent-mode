import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadActivities = () => getJson<{ activities: unknown[] }>('/api/activities').then(({ activities }) => activities);

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loadData={loadActivities} emptyMessage="No activities available." />;
}
