import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyMessage: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function CapabilityCard({ title, description, endpoint, collection, emptyMessage }: Props) {
  const [items, setItems] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const response = await getJson<Record<string, unknown>>(endpoint);
        const data = response[collection];
        if (!Array.isArray(data)) throw new Error(`Invalid ${title.toLowerCase()} response`);
        if (!cancelled) setItems(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'An unexpected error occurred.');
        }
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [collection, endpoint, title]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {items === null && !error && <p role="status">Loading {title.toLowerCase()}...</p>}
    {error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {items?.length === 0 && <p>{emptyMessage}</p>}
    {items && items.length > 0 && <>
      <p role="status">Loaded {title.toLowerCase()}.</p>
      <ul className="list-group">
      {items.map((item, index) => <li className="list-group-item" key={index}>
        {item !== null && typeof item === 'object' && !Array.isArray(item)
          ? <dl className="row mb-0">{Object.entries(item).filter(([field]) => field !== '_id' && field !== '__v').map(([field, value]) => <div className="col-sm-6" key={field}>
            <dt>{field}</dt><dd>{formatValue(value)}</dd>
          </div>)}</dl>
          : formatValue(item)}
      </li>)}
      </ul>
    </>}
  </div></section>;
}
