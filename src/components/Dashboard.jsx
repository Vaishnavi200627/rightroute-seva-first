import { useState, useEffect } from 'react';
import { RULESET_META, listRules } from '../lib/engine';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    setRules(listRules());
  }, []);

  useEffect(() => {
    if (!API_URL) {
      setStatsError(true);
      return;
    }
    fetch(`${API_URL}/api/stats`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setStatsError(true));
  }, []);

  return (
    <section className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Ruleset</h2>
        <p className="text-sm text-slate-500 mb-4">
          Version {RULESET_META.version} · {RULESET_META.ruleCount} rules ·{' '}
          {RULESET_META.resourceCount} resources · reviewed {RULESET_META.lastReviewed}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Rule ID</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2">Conditions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3 font-mono text-xs text-slate-500">{r.priority}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-800">{r.id}</td>
                  <td className="py-2 pr-3 text-slate-700">{r.label}</td>
                  <td className="py-2 font-mono text-[11px] text-slate-500">
                    {Object.keys(r.when).length
                      ? Object.entries(r.when).map(([k, v]) => `${k}=${v}`).join(' · ')
                      : '(fallback)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Anonymous counters</h2>
        {statsError && (
          <p className="text-sm text-slate-500">
            Counters unavailable. This does not affect routing — the engine runs entirely in your browser.
          </p>
        )}
        {stats && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                By category
              </p>
              {Object.keys(stats.byCategory || {}).length === 0 && (
                <p className="text-sm text-slate-400">No events yet</p>
              )}
              {Object.entries(stats.byCategory || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-600 capitalize">{k}</span>
                  <span className="font-mono text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                By language
              </p>
              {Object.keys(stats.byLanguage || {}).length === 0 && (
                <p className="text-sm text-slate-400">No events yet</p>
              )}
              {Object.entries(stats.byLanguage || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-600 uppercase">{k}</span>
                  <span className="font-mono text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Privacy</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          RightRoute does not store your answers, does not upload your files, and does not
          send your input to any server. The routing engine runs entirely in your browser
          against{' '}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            crisis-rules.json
          </span>
          .
        </p>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          The only network activity is loading this page. If a deployment has opted into
          anonymous counters, they record category and language totals — never your answers,
          never your files.
        </p>
      </div>
    </section>
  );
}