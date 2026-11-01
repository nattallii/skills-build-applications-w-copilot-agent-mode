import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadLeaderboard = () => getJson<{ leaderboard: unknown[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard);

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loadData={loadLeaderboard} emptyMessage="No leaderboard rankings available." />;
}
