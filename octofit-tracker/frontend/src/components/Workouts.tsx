import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadSuggestions = () => getJson<{ suggestions: unknown[] }>('/api/workouts/suggestions/mona%40example.com').then(({ suggestions }) => suggestions);

export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loadData={loadSuggestions} emptyMessage="No workout suggestions available." />;
}
