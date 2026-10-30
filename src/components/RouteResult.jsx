import { useState, useEffect } from 'react';
import {
  Award, Users, FileText, Clock, FolderLock, ExternalLink,
  ChevronRight, CircleCheck, CircleX, Route, Lightbulb, History
} from 'lucide-react';
import { t } from '../i18n/strings';
import { tierLabel } from '../lib/engine';

import First24HoursPlaybook from './First24HoursPlaybook';

const TIER_STYLES = {
  1: { grad: 'from-rose-500 to-red-600', soft: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  2: { grad: 'from-orange-500 to-amber-600', soft: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  3: { grad: 'from-purple-500 to-pink-600', soft: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  4: { grad: 'from-slate-600 to-slate-700', soft: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' }
};

function ModuleHeader({ icon: Icon, index, title, tone = 'teal' }) {
  const tones = {
    teal: 'from-teal-500 to-cyan-600',
    indigo: 'from-indigo-500 to-violet-600',
    slate: 'from-slate-500 to-slate-700',
    amber: 'from-amber-500 to-orange-600'
  };
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${tones[tone]} text-white flex items-center justify-center shadow-md`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Module {index}
        </div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          {title}
        </h3>
      </div>
    </div>
  );
}

export default function RouteResult({ result, lang, onRestart }) {
  if (!result) return null;

  const style = TIER_STYLES[result.tier] || TIER_STYLES[4];
  const category = result.matchedOn?.find(m => m.key === 'category')?.value || '';

  return (
    <section className="animate-fade-in space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Tier band */}
        <div className={`bg-gradient-to-r ${style.grad} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white/90" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              {tierLabel(result.tier)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/80 bg-white/15 px-2 py-1 rounded">
            {result.ruleId}
          </span>
        </div>

        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            {t(lang, 'routeTitle')}
          </p>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">{result.label}</h2>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            priority {result.priority} · ruleset v{result.rulesetVersion} · {result.evaluated} rules evaluated
          </p>
        </div>

        {/* Module B — Why this route */}
        <div className={`px-6 py-5 border-b ${style.border} ${style.soft}`}>
          <ModuleHeader icon={Lightbulb} index="B" title={t(lang, 'whyTitle')} tone="teal" />

          <div className="mb-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Matched conditions
            </div>
            <div className="flex flex-wrap gap-2">
              {result.matchedOn.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-xs"
                >
                  <CircleCheck className="w-3 h-3 text-teal-600" />
                  <span className="font-mono text-slate-700">
                    {m.key}=<span className="font-semibold text-teal-700">{String(m.value)}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {result.why.map((w, i) => (
              <li key={i} className="text-sm text-slate-700 leading-relaxed flex gap-2">
                <span className="text-teal-500 font-bold flex-shrink-0">→</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Provenance */}
        {result.rejectedBecause && result.rejectedBecause.length > 0 && (
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <ModuleHeader icon={History} index="B+" title={t(lang, 'provenanceTitle')} tone="slate" />
            <p className="text-xs text-slate-500 mb-3 -mt-1">{t(lang, 'provenanceSubtitle')}</p>
            <ul className="space-y-2">
              {result.rejectedBecause.map((r, i) => (
                <li key={i} className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CircleX className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono text-[10px] text-slate-500">{r.ruleId}</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-400">
                      T{r.tier} · P{r.priority}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800 pl-5">{r.label}</div>
                  <div className="text-xs text-slate-500 mt-1 pl-5">{r.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-6 py-6 space-y-6">
          {/* Feature 2: The "First 24 Hours" Emergency Playbook */}
          <First24HoursPlaybook category={category} ruleId={result.ruleId} lang={lang} />

          {/* Module C — Actions */}
          <div>
            <ModuleHeader icon={Route} index="C" title={t(lang, 'actionsTitle')} tone="teal" />
            <ol className="space-y-3">
              {result.actions.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/20">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed pt-0.5">{a}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Module D — Evidence */}
          <div>
            <ModuleHeader icon={FolderLock} index="D" title={t(lang, 'evidenceTitle')} tone="amber" />
            <p className="text-xs text-slate-500 italic mb-3 -mt-1">{t(lang, 'evidenceNote')}</p>
            <ul className="space-y-2">
              {result.evidence.map((e, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2 bg-amber-50/40 px-3 py-2 rounded-lg border border-amber-100">
                  <span className="text-amber-500 flex-shrink-0">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Module E — Resources */}
          <div>
            <ModuleHeader icon={ExternalLink} index="E" title={t(lang, 'resourcesTitle')} tone="teal" />
            <div className="grid sm:grid-cols-2 gap-3">
              {result.resources.map(r => (
                <a
                  key={r.short}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group block p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {r.kind}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-500 transition" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.note}</p>
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/40 transition-all flex items-center justify-center gap-2"
          >
            {t(lang, 'startOver')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed px-1">{t(lang, 'disclaimer')}</p>
    </section>
  );
}