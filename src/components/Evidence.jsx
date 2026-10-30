import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  FileLock,
  Upload,
  Copy,
  Check,
  Download,
  Shield,
  Loader2,
  FileText
} from 'lucide-react';
import { sha256 } from '../lib/hash';
import { t } from '../i18n/strings';
import { tierLabel } from '../lib/engine';
import { getPotentialLegalSections } from '../lib/legal';

/**
 * Generates and downloads a client-side Draft Complaint PDF.
 *
 * @param {string} lang - Active language code ('en', 'hi', 'mr', 'ta', 'bn')
 * @param {object} intake - Active intake state
 * @param {object|null} result - Resolved routing result
 * @param {object|null} fileData - Hashed evidence metadata { fileName, fileSize, fileType, fileHash }
 */
export function downloadComplaintDraft(lang = 'en', intake = {}, result = null, fileData = null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, pageW, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DRAFT CYBERCRIME COMPLAINT — FOR REVIEW AND SUBMISSION', margin, 38);

  y = 80;

  // Marathi Support: If lang === 'mr', render bold banner at top
  if (lang === 'mr') {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.roundedRect(margin, y, contentW, 26, 4, 4, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Marathi font not loaded. Generating English draft.', margin + 12, y + 17);
    y += 34;
  }

  // Warning banner
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, contentW, 28, 4, 4, 'FD');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'This is a generated draft. It is NOT a registered FIR or an official police document.',
    margin + 12,
    y + 18
  );
  y += 40;

  // Local Reference ID
  const refId = intake?.localRefId || `RR-${Date.now()}`;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const refText = `Local Ref ID: ${refId}`;
  doc.text(refText, margin, y);
  const refWidth = doc.getTextWidth(refText + '  ');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('(Local Reference Only.)', margin + refWidth, y);
  y += 16;
  doc.text(`Generated Timestamp: ${new Date().toISOString()}`, margin, y);
  y += 24;

  // Incident Narrative
  ensureSpace(120);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Incident Narrative', margin, y);
  y += 16;

  const categoryLabels = {
    account: 'Account or Device Takeover',
    fraud: 'Financial Cyber Fraud',
    ncii: 'Non-Consensual Intimate Imagery (NCII)',
    stalking: 'Cyber Stalking / Harassment'
  };

  const formatBool = (val) => {
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    return 'Not Provided.';
  };

  const formatField = (val, map = {}) => {
    if (val === undefined || val === null || val === '') return 'Not Provided.';
    return map[val] || String(val);
  };

  const activeCategory = intake?.category || (result?.matchedOn?.find(m => m.key === 'category')?.value) || '';
  const catText = activeCategory ? (categoryLabels[activeCategory] || activeCategory.toUpperCase()) : 'Not Provided.';
  const dangerText = formatBool(intake?.physicalDanger);
  const minorText = formatBool(intake?.minor);

  // Concise narrative summary line as requested: e.g. "Category: NCII. Physical Danger: Yes. Minor: No."
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  const summaryLine = `Category: ${catText}. Physical Danger: ${dangerText}. Minor: ${minorText}.`;
  const summaryLines = doc.splitTextToSize(summaryLine, contentW);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 8;

  // Key-value narrative entries looping through intake state
  const narrativeFields = [
    { label: 'Category', value: catText },
    { label: 'Physical Danger', value: dangerText },
    { label: 'Minor Involved (<18)', value: minorText },
    { label: 'Active Threat / Extortion', value: formatBool(intake?.threatened) },
    {
      label: 'Media Origin / Ownership',
      value: formatField(intake?.ownership, {
        self: 'Self-created (Consensual/Private)',
        consented: 'Created by someone else with consent',
        nonconsented: 'Created or obtained without consent'
      })
    },
    {
      label: 'Fraud Classification',
      value: formatField(intake?.fraudType, {
        upi: 'UPI / QR Code Fraud',
        otp: 'OTP / Banking Credential Theft',
        phishing: 'Phishing / Fake Website',
        other: 'Other Cyber Fraud'
      })
    },
    { label: 'Financial Loss Incurred', value: formatBool(intake?.moneyLost) },
    {
      label: 'Account Issue Type',
      value: formatField(intake?.accountType, {
        hacked: 'Account Takeover / Password Altered',
        locked: 'Account Locked / Access Denied',
        compromised: 'Suspicious Activity Detected'
      })
    },
    { label: 'Ongoing Incident', value: formatBool(intake?.ongoing) }
  ];

  narrativeFields.forEach(field => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• ${field.label}: `, margin, y);
    const labelW = doc.getTextWidth(`• ${field.label}: `);
    doc.setFont('helvetica', 'normal');
    if (field.value === 'Not Provided.') {
      doc.setTextColor(148, 163, 184);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(field.value, margin + labelW, y);
    y += 14;
  });
  y += 12;

  // Legal Mapping
  ensureSpace(110);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Potential Legal Sections (Statutory Mapping)', margin, y);
  y += 16;

  const legalSections = getPotentialLegalSections(activeCategory);
  legalSections.forEach(item => {
    ensureSpace(42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    const titleStr = `• ${item.act}, ${item.section}: ${item.title}`;
    doc.text(titleStr, margin, y);
    const titleW = doc.getTextWidth(titleStr + ' ');

    // Highly visible REVIEW_REQUIRED badge
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.roundedRect(margin + titleW, y - 9, 118, 13, 2, 2, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`[${item.status}]`, margin + titleW + 6, y);

    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(`Note: ${item.note}`, contentW - 14);
    doc.text(noteLines, margin + 14, y);
    y += noteLines.length * 12 + 6;
  });
  y += 10;

  // Evidence Integrity
  ensureSpace(90);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Evidence Integrity Reference', margin, y);
  y += 16;

  const activeFileName = fileData?.fileName || 'Not Provided.';
  const activeFileSize = fileData?.fileSize || 'Not Provided.';
  const activeFileType = fileData?.fileType || 'Not Provided.';
  const activeHash = fileData?.fileHash || 'Not Provided.';

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('• File Name: ', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(activeFileName === 'Not Provided.' ? 148 : 15, activeFileName === 'Not Provided.' ? 163 : 23, activeFileName === 'Not Provided.' ? 184 : 42);
  doc.text(activeFileName, margin + doc.getTextWidth('• File Name: '), y);
  y += 14;

  if (fileData?.fileSize) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('• File Size: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(activeFileSize, margin + doc.getTextWidth('• File Size: '), y);
    y += 14;
  }

  if (fileData?.fileType) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('• File Type: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(activeFileType, margin + doc.getTextWidth('• File Type: '), y);
    y += 14;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('• SHA-256 Hash: ', margin, y);
  y += 14;

  if (activeHash !== 'Not Provided.') {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const hashLines = doc.splitTextToSize(activeHash, contentW - 14);
    doc.text(hashLines, margin + 14, y);
    y += hashLines.length * 11 + 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Not Provided.', margin + 14, y);
    y += 14;
  }

  // Disclaimer and page numbers in footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'This is a generated draft for review and submission. It is not an official FIR.',
      margin,
      pageH - 24
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageW - margin - 50,
      pageH - 24
    );
  }

  doc.save(`RightRoute-Draft-Complaint-${refId}.pdf`);
}

/**
 * Downloads a structured Action Plan PDF based on engine route recommendations.
 */
function downloadActionPlan(result, fileRecord) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header band
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RightRoute — Action Plan', margin, 44);

  y = 100;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toISOString()}`, margin, y);
  y += 14;
  if (result) {
    doc.text(`Rule: ${result.ruleId} · ${tierLabel(result.tier)} · ruleset v${result.rulesetVersion}`, margin, y);
    y += 24;
  } else {
    y += 12;
  }

  if (result) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Suggested route', margin, y);
    y += 16;
    doc.setFontSize(14);
    doc.text(result.label, margin, y);
    y += 22;

    doc.setFontSize(12);
    doc.text('Why this route', margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    for (const w of result.why) {
      const lines = doc.splitTextToSize(`• ${w}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 13;
    }
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Do this now', margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    result.actions.forEach((a, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${a}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 13;
    });
    y += 10;

    if (y > 620) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Preserve this', margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    for (const e of result.evidence) {
      const lines = doc.splitTextToSize(`• ${e}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 13;
    }
    y += 10;

    if (y > 620) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Official resources', margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    for (const r of result.resources) {
      doc.setFont('helvetica', 'bold');
      doc.text(r.name, margin, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      const urlLines = doc.splitTextToSize(r.url, pageW - margin * 2);
      doc.text(urlLines, margin, y);
      y += urlLines.length * 12 + 4;
    }
  }

  if (fileRecord?.fileHash && fileRecord?.fileName) {
    if (y > 620) { doc.addPage(); y = margin; }
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('File integrity reference', margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`File: ${fileRecord.fileName} (${fileRecord.fileSize})`, margin, y);
    y += 14;
    doc.text('SHA-256:', margin, y);
    y += 14;
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const hashLines = doc.splitTextToSize(fileRecord.fileHash, pageW - margin * 2);
    doc.text(hashLines, margin, y);
    y += hashLines.length * 11;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a personal integrity reference, not a legal certificate. The original file never left your device.',
    margin,
    doc.internal.pageSize.getHeight() - 40
  );

  doc.save('rightroute-action-plan.pdf');
}

export default function Evidence({
  lang,
  result,
  intake = {},
  evidenceData = null,
  onEvidenceChange = null,
  onDraftDownloaded = null
}) {
  const [file, setFile] = useState(null);
  const [fileRecord, setFileRecord] = useState(evidenceData);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (evidenceData && !fileRecord) {
      setFileRecord(evidenceData);
    }
  }, [evidenceData]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setBusy(true);
    try {
      const calculatedHash = await sha256(f);
      const sizeKb = (f.size / 1024).toFixed(2);
      const record = {
        fileName: f.name,
        fileSize: `${sizeKb} KB`,
        fileType: f.type || 'application/octet-stream',
        fileHash: calculatedHash
      };
      setFileRecord(record);
      if (onEvidenceChange) {
        onEvidenceChange(record);
      }
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    const activeHash = fileRecord?.fileHash;
    if (!activeHash) return;
    navigator.clipboard.writeText(activeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const activeRecord = fileRecord || evidenceData;

  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <FileLock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
              Module F
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {t(lang, 'evidenceSectionTitle')}
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-medium text-white">
          <Shield className="w-3 h-3" />
          Local only
        </span>
      </div>

      <div className="p-6">
        <p className="text-xs text-slate-500 mb-4">{t(lang, 'evidenceSectionDesc')}</p>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-2 block">
            {t(lang, 'uploadLabel')}
          </span>
          <div className="relative">
            <input
              type="file"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-teal-50 file:to-cyan-50 file:text-teal-700 hover:file:from-teal-100 hover:file:to-cyan-100 file:cursor-pointer cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-2 hover:border-teal-300 transition"
            />
            <Upload className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none hidden sm:block" />
          </div>
        </label>

        {activeRecord && (
          <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t(lang, 'evidenceIntegrityRecord')}
                </h4>
              </div>
              {activeRecord.fileHash && !busy && (
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 px-2.5 py-1 rounded-lg bg-white border border-teal-200 hover:border-teal-300 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? t(lang, 'copied') : 'Copy'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 mb-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">File Name</span>
                <span className="font-semibold text-slate-800 break-all">{activeRecord.fileName}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">File Size</span>
                <span className="font-semibold text-slate-800">{activeRecord.fileSize}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">File Type</span>
                <span className="font-semibold text-slate-800 break-all">{activeRecord.fileType}</span>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {t(lang, 'hashLabel')} (SHA-256)
            </div>
            <div className="font-mono text-[11px] bg-slate-900 text-emerald-300 p-3 rounded-lg break-all">
              {busy ? (
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                  {t(lang, 'hashing')}
                </span>
              ) : (
                activeRecord.fileHash
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-500 italic leading-relaxed">
              This SHA-256 hash verifies the file has not been altered since this moment. It does not establish chain of custody or authenticity. The file never left your device.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              downloadComplaintDraft(lang, intake, result, activeRecord);
              if (onDraftDownloaded) onDraftDownloaded();
            }}
            disabled={busy}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              !busy
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t(lang, 'downloadDraft')}
          </button>
          <button
            type="button"
            onClick={() => downloadActionPlan(result, activeRecord)}
            disabled={busy}
            className="py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            {t(lang, 'downloadPdf')}
          </button>
        </div>
      </div>
    </section>
  );
}