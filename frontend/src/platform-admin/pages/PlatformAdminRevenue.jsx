import { useEffect, useState } from 'react';
import { platformAdminRequest } from '../../services/platformAdminApi';
import '../styles/PlatformAdminRevenue.css';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const rowsFrom = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

function RevenueChart({ corporations }) {
  if (!corporations.length) return <p className="pa-revenue-chart-empty">No revenue data available to display chart.</p>;
  const chartMax = Math.max(1000, Math.ceil(Math.max(...corporations.map((row) => Number(row.tradezo_revenue) || 0)) * 1.25));
  const width = Math.max(700, corporations.length * 190 + 140);
  const height = 300; const left = 110; const right = 40; const top = 40; const bottom = 70;
  const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const ticks = [0, .25, .5, .75, 1];
  return <div className="pa-revenue-chart-scroll"><svg width={width} height={height} role="img" aria-label="TradeZo revenue by municipality">
    {ticks.map((fraction) => { const y = top + plotHeight - fraction * plotHeight; return <g key={fraction}><line x1={left} y1={y} x2={width-right} y2={y} stroke="#e2e8f0" strokeDasharray={fraction ? '4,4' : undefined} /><text x={left-12} y={y+4} textAnchor="end" fontSize="11" fill="#64748b">{money(chartMax*fraction)}</text></g>; })}
    {corporations.map((row, index) => { const revenue = Number(row.tradezo_revenue) || 0; const slot = plotWidth / corporations.length; const barWidth = Math.min(64, slot * .55); const x = left + index * slot + slot / 2 - barWidth / 2; const barHeight = revenue / chartMax * plotHeight; const label = row.name || row.corporation_id || 'Municipality'; return <g key={row.corporation_id || row.municipality_id || label}><title>{label}: {money(revenue)}</title><rect x={x} y={top+plotHeight-barHeight} width={barWidth} height={barHeight} rx="4" fill="#102a72" /><text x={x+barWidth/2} y={top+plotHeight-barHeight-8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#102a72">{money(revenue)}</text><text x={x+barWidth/2} y={height-30} textAnchor="middle" fontSize="11" fill="#334155">{label.length>20 ? `${label.slice(0,18)}…` : label}</text><text x={x+barWidth/2} y={height-13} textAnchor="middle" fontSize="10" fill="#64748b">({row.corporation_id || row.municipality_id || '—'})</text></g>; })}
  </svg></div>;
}

export default function PlatformAdminRevenue() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    platformAdminRequest('platform-admin/revenue').then((result) => { if (active) setRevenue(result); }).catch((requestError) => { if (active) setError(requestError.message || 'Unable to load revenue data.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const corporations = rowsFrom(revenue?.corporations);
  const totals = corporations.reduce((acc, row) => ({ gross: acc.gross + (Number(row.gross_collection) || 0), tradezo: acc.tradezo + (Number(row.tradezo_revenue) || 0), municipal: acc.municipal + (Number(row.municipal_share) || 0) }), { gross: 0, tradezo: 0, municipal: 0 });
  return <section className="pa-revenue"><header className="pa-revenue-header"><h1>TradeZo Platform Revenue &amp; Pricing</h1><p>Gross collections and revenue share distribution by municipality</p></header>
    {loading ? <p className="pa-revenue-state" role="status">Loading revenue data…</p> : error ? <p className="pa-revenue-error" role="alert">{error}</p> : <>
      <div className="pa-revenue-metrics"><article><span>Total Revenue</span><strong>{money(totals.tradezo)}</strong><small>TradeZo Platform Share</small></article><article><span>Total Gross Collection</span><strong>{money(totals.gross)}</strong><small>All application collections</small></article><article><span>Total Municipal Share</span><strong>{money(totals.municipal)}</strong><small>Municipal / Government Share</small></article></div>
      <div className="pa-revenue-chart"><RevenueChart corporations={corporations} /></div>
      <header className="pa-revenue-table-heading"><h2>Municipality Revenue Breakdown</h2></header>
      {corporations.length ? <div className="pa-revenue-table-scroll"><table><thead><tr><th>Corporation ID</th><th>Name</th><th>Applications</th><th>Gross Collection</th><th>Revenue</th><th>Municipal Share</th></tr></thead><tbody>{corporations.map((row) => <tr key={row.corporation_id || row.municipality_id}><td>{row.corporation_id || row.municipality_id || '—'}</td><td>{row.name || '—'}</td><td>{row.applications ?? 0}</td><td>{money(row.gross_collection)}</td><td>{money(row.tradezo_revenue)}</td><td>{money(row.municipal_share)}</td></tr>)}</tbody></table></div> : <p className="pa-revenue-state">No municipality revenue records are available.</p>}
    </>}
  </section>;
}
