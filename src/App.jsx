import { Shield, Globe, Languages, ClipboardList, LogOut, Radio, Copy, Check } from 'lucide-react';
import { resolveRoute, RULESET_META } from './lib/engine';
import { ping } from './lib/analytics';
import { t } from './i18n/strings';
import LanguagePicker from './components/LanguagePicker';
import CrisisPicker from './components/CrisisPicker';
import IntakeFlow from './components/IntakeFlow';
import RouteResult from './components/RouteResult';
import Evidence, { downloadComplaintDraft } from './components/Evidence';
import CaseSummary from './components/CaseSummary';

function Badge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-600 shadow-sm">
      <Icon className="w-3 h-3 text-teal-600" />
      {label}
    </span>
  );
}

/**
 * SOS Emergency Text Generator Modal
 */
function SosModal({ isOpen, onClose, lang }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const sosText =
    'EMERGENCY: I am feeling unsafe. I am currently documenting a cybercrime incident on RightRoute. Please call me or track my location.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-100">
              SOS Message Generator
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition text-xs"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-950 border border-red-900/80 rounded-xl p-4 text-xs sm:text-sm text-red-100 font-sans leading-relaxed select-all">
          {sosText}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sosText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              copied ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(sosText)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1.5"
          >
            WhatsApp
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(sosText)}`}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center gap-1.5"
          >
            SMS
          </a>
        </div>

        <p className="text-xs text-red-300/80 italic">
          This does not send the message automatically. Copy this text and send it via WhatsApp or SMS to a trusted person.
        </p>
      </div>
    </div>
  );
}

/**
 * Quick Exit Safety Button
 * Replaces browser location immediately with google.com so clicking "Back"
 * does not return to the application, safeguarding the user.
 */
function QuickExitButton({ lang = 'en' }) {
  function handleExit() {
    window.location.replace('https://www.google.com');
  }

  return (
    <aside
      aria-label="Safety controls"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-1 pointer-events-auto"
    >
      <button
        type="button"
        onClick={handleExit}
        className="group flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-red-500/50"
        title={t(lang, 'quickExitTooltip')}
        aria-label="Quick Exit"
      >
        <LogOut className="w-4 h-4 text-white" />
        <span>{t(lang, 'quickExit')}</span>
      </button>
      <span className="text-[10px] text-slate-600 bg-white/95 backdrop-blur px-2.5 py-0.5 rounded-full shadow-md border border-slate-200 pointer-events-none select-none font-medium">
        {t(lang, 'quickExitTooltip')}
      </span>
    </aside>
  );
}

/**
 * DPDP-Compliant Privacy Notice Component
 */
function DpdpFooter({ lang = 'en' }) {
  return (
    <footer className="max-w-3xl mx-auto px-4 py-8 text-xs text-center space-y-3">
      <div className="bg-white/80 backdrop-blur border border-teal-200/60 shadow-sm rounded-2xl p-3.5 max-w-2xl mx-auto text-slate-700">
        <p className="font-semibold text-teal-800 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          Digital Personal Data Protection (DPDP) Statement
        </p>
        <p className="leading-relaxed text-slate-600 text-xs">
          Privacy by Design: RightRoute processes all data locally in your browser. We do not upload, store, or track your evidence or personal details, in compliance with DPDP Act principles.
        </p>
      </div>
      <p className="text-slate-400">
        {t(lang, 'footerVersion')}{RULESET_META.version} · {RULESET_META.jurisdiction} · {RULESET_META.lastReviewed}
      </p>
    </footer>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [langChosen, setLangChosen] = useState(false);
  const [view, setView] = useState('navigator');
  const [category, setCategory] = useState(null);
  const [intake, setIntake] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [evidenceData, setEvidenceData] = useState(null);
  const [integrityLog, setIntegrityLog] = useState([]);
  const [showSosModal, setShowSosModal] = useState(false);

  function addLog(actionText) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      action: actionText
    };
    setIntegrityLog(prev => [...prev, entry]);
  }

  function pickLanguage(code) {
    setLang(code);
    setLangChosen(true);
  }

  function pickCategory(id) {
    const ts = Date.now();
    setCategory(id);
    setIntake({ category: id, localRefId: `RR-${ts}`, refTimestamp: ts });
    setResult(null);

    const categoryNames = {
      ncii: 'Non-Consensual Intimate Imagery (NCII)',
      fraud: 'Financial Cyber Fraud',
      account: 'Account or Device Takeover',
      stalking: 'Cyber Stalking / Harassment'
    };
    addLog(`Crisis category selected: ${categoryNames[id] || id}`);
  }

  function submitIntake() {
    setBusy(true);
    ping(category, lang);
    addLog('Intake responses submitted for ruleset evaluation');
    setTimeout(() => {
      setResult(resolveRoute(intake));
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  }

  function handleEvidenceChange(record) {
    setEvidenceData(record);
    if (record?.fileHash) {
      addLog('Evidence file integrity hashed (SHA-256 computed)');
    }
  }

  function handleDownloadDraft() {
    downloadComplaintDraft(lang, intake, result, evidenceData);
    addLog('Draft complaint PDF generated');
  }

  function reset() {
    setCategory(null);
    setIntake({});
    setResult(null);
    setEvidenceData(null);
    setIntegrityLog([]);
  }

  if (!langChosen) {
    return (
      <div className="relative">
        <LanguagePicker onPick={pickLanguage} lang={lang} />
        <DpdpFooter lang={lang} />
        <QuickExitButton lang={lang} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 relative">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => { setView('navigator'); reset(); }}
            className="flex items-center gap-3 text-left group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow">
              RR
            </span>
            <span>
              <span className="block font-bold text-slate-900 leading-tight">
                {t(lang, 'appName')}
              </span>
              <span className="block text-[11px] text-slate-500 leading-tight">
                {t(lang, 'tagline')}
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition"
              title="Generate SOS message to trusted contact"
            >
              <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              SOS
            </button>
            <button
              onClick={() => setView(view === 'summary' ? 'navigator' : 'summary')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 border border-slate-200 bg-white transition shadow-sm"
            >
              <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
              {view === 'summary' ? (t(lang, 'navigator') || 'Navigator') : t(lang, 'caseSummary')}
            </button>
            <button
              onClick={() => { setLangChosen(false); setView('navigator'); reset(); }}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold tracking-wide"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {view === 'summary' ? (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge icon={Shield} label="No data stored" />
              <Badge icon={Globe} label="Runs in your browser" />
              <Badge icon={Languages} label="5 Indian languages" />
            </div>
            <CaseSummary
              intake={intake}
              result={result}
              lang={lang}
              evidence={evidenceData}
              integrityLog={integrityLog}
              onDownloadDraft={handleDownloadDraft}
              onNavigateBack={() => setView('navigator')}
            />
          </>
        ) : (
          <>
            {!category && !result && (
              <>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge icon={Shield} label="No data stored" />
                  <Badge icon={Globe} label="Runs in your browser" />
                  <Badge icon={Languages} label="5 Indian languages" />
                </div>
                <CrisisPicker onPick={pickCategory} lang={lang} selected={category} />
              </>
            )}

            {category && !result && !busy && (
              <IntakeFlow
                category={category}
                intake={intake}
                setIntake={setIntake}
                onSubmit={submitIntake}
                lang={lang}
              />
            )}

            {busy && (
              <div className="text-center py-20">
                <div
                  className="inline-block w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full"
                  style={{ animation: 'spin 0.7s linear infinite' }}
                />
                <p className="mt-4 text-sm text-slate-500">{t(lang, 'evaluating')}</p>
              </div>
            )}

            {result && (
              <>
                <RouteResult result={result} lang={lang} onRestart={reset} />
                <Evidence
                  lang={lang}
                  result={result}
                  intake={intake}
                  evidenceData={evidenceData}
                  onEvidenceChange={handleEvidenceChange}
                  onDraftDownloaded={() => addLog('Draft complaint PDF generated')}
                />
              </>
            )}
          </>
        )}
      </main>

      <DpdpFooter lang={lang} />
      <QuickExitButton lang={lang} />
      <SosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        lang={lang}
      />
    </div>
  );
}