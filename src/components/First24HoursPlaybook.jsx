import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { t } from '../i18n/strings';

/**
 * Returns prioritized immediate actions for the first 24 hours of a cyber crisis.
 */
function getPlaybookSteps(category = '', ruleId = '') {
  const cat = typeof category === 'string' ? category.trim().toLowerCase() : '';

  if (cat === 'ncii' || cat === 'stalking' || ruleId.includes('NCII') || ruleId.includes('STALKING')) {
    return [
      {
        id: 'step-1',
        title: 'Do NOT delete the chat/evidence',
        description: 'Crucial for judicial proceedings and digital forensics. Keep original uncropped screenshots and exported chat archives.'
      },
      {
        id: 'step-2',
        title: 'Do NOT pay or negotiate',
        description: 'Blackmailers and extortionists consistently demand higher sums once initial payment is made. Cut off extortion lines.'
      },
      {
        id: 'step-3',
        title: 'Preserve the URLs and handles',
        description: 'Record full profile links, usernames, phone numbers, and unique message timestamps before perpetrators delete accounts.'
      },
      {
        id: 'step-4',
        title: 'Report to NCRP',
        description: 'Lodge draft complaint on cybercrime.gov.in (National Cyber Crime Reporting Portal) or call emergency helpline 1930.'
      }
    ];
  }

  if (cat === 'fraud' || ruleId.includes('FRAUD')) {
    return [
      {
        id: 'step-1',
        title: 'Call 1930 immediately',
        description: 'National Cyber Fraud Helpline. The first 2-3 hours are the "Golden Hour" for financial freeze before funds are siphoned.'
      },
      {
        id: 'step-2',
        title: 'Freeze UPI/Bank account',
        description: 'Contact your bank fraud desk immediately to block net banking, debit cards, and UPI IDs linked to the compromised account.'
      },
      {
        id: 'step-3',
        title: 'Report to NCRP',
        description: 'File a complaint on cybercrime.gov.in with bank account details, transaction UTR numbers, and SMS notifications.'
      }
    ];
  }

  if (cat === 'account' || ruleId.includes('ACCOUNT')) {
    return [
      {
        id: 'step-1',
        title: 'Terminate all active sessions',
        description: 'Access security settings from a clean device and select "Sign out of all other sessions" immediately.'
      },
      {
        id: 'step-2',
        title: 'Reset password & recovery methods',
        description: 'Change login credentials and verify that the attacker has not changed your linked recovery email or phone number.'
      },
      {
        id: 'step-3',
        title: 'Enable Multi-Factor Authentication (MFA)',
        description: 'Configure an authenticator app (TOTP) rather than SMS OTP to prevent SIM-swap vulnerabilities.'
      },
      {
        id: 'step-4',
        title: 'Alert your close contacts',
        description: 'Notify friends and family that your account was compromised so they do not click links or send emergency funds.'
      }
    ];
  }

  // Fallback Playbook
  return [
    {
      id: 'step-1',
      title: 'Do NOT delete the chat/evidence',
      description: 'Preserve original files, message logs, and call recordings without altering metadata.'
    },
    {
      id: 'step-2',
      title: 'Preserve usernames, handles, and URLs',
      description: 'Document profile URLs and communication timestamps.'
    },
    {
      id: 'step-3',
      title: 'Call 1930 helpline',
      description: 'Immediate toll-free national assistance for digital offenses.'
    },
    {
      id: 'step-4',
      title: 'Report to NCRP',
      description: 'Submit an incident report on cybercrime.gov.in.'
    }
  ];
}

export default function First24HoursPlaybook({ category, ruleId, lang = 'en' }) {
  const steps = getPlaybookSteps(category, ruleId);
  const [checked, setChecked] = useState({});

  function toggleStep(id) {
    setChecked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  const completedCount = Object.values(checked).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-white rounded-2xl border-2 border-rose-200/90 shadow-lg p-5 sm:p-6 my-5">
      {/* Playbook Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-200/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 flex-shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                Critical Window
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                0h – 24h
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              {t(lang, 'playbookTitle') || 'The "First 24 Hours" Emergency Playbook'}
            </h3>
          </div>
        </div>

        {/* Completion Counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/90 border border-rose-200 px-3 py-1.5 rounded-xl shadow-sm">
          <CheckCircle2 className={`w-4 h-4 ${completedCount === steps.length ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold text-slate-700">
            {completedCount} of {steps.length} completed
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-rose-500 to-amber-500 h-1.5 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="mt-4 space-y-2.5">
        {steps.map((step, idx) => {
          const isDone = !!checked[step.id];
          return (
            <label
              key={step.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                isDone
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 shadow-sm'
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleStep(step.id)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isDone ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isDone ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Emergency Guidance footer */}
      <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
        <span>Check off each protocol as completed to safeguard evidentiary validity.</span>
      </div>
    </div>
  );
}
