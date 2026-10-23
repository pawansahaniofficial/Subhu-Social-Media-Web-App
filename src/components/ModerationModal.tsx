import React, { useState, useEffect } from 'react';
import { User, Report, AuditLog } from '../types/index.js';
import { api } from '../services/api.js';
import {
  ShieldAlert,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ModerationModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  reportTargetId?: string | null;
  reportTargetType?: 'post' | 'user' | 'comment';
}

export const ModerationModal: React.FC<ModerationModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  reportTargetId,
  reportTargetType = 'post',
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'admin_queue' | 'audit_logs'>('report');
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Admin state
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin && (activeTab === 'admin_queue' || activeTab === 'audit_logs')) {
      loadAdminData();
    }
  }, [isAdmin, activeTab]);

  const loadAdminData = async () => {
    try {
      if (activeTab === 'admin_queue') {
        const res = await api.getReports();
        setReports(res.reports);
      } else if (activeTab === 'audit_logs') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId) return;

    setIsSubmitting(true);
    try {
      await api.reportContent({
        targetId: reportTargetId,
        targetType: reportTargetType,
        reason,
        details,
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'action_taken' | 'dismissed') => {
    try {
      await api.resolveReport(reportId, action, moderatorNotes || 'Reviewed according to community standards');
      setResolvingId(null);
      setModeratorNotes('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subhu Trust & Safety Center
              </h3>
              <p className="text-[11px] text-slate-400">
                Audited community protection, content integrity, and human escalation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Tabs */}
        {isAdmin && (
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'report'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Report Form
            </button>
            <button
              onClick={() => setActiveTab('admin_queue')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'admin_queue'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Moderation Queue
            </button>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'audit_logs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Security Audit Logs
            </button>
          </div>
        )}

        {/* Tab 1: User Report Form */}
        {activeTab === 'report' && (
          <div className="mt-4">
            {submittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Report Received</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Thank you for keeping Subhu safe. Our safety operations team reviews every flag promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Flagging
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
                  >
                    <option value="spam">Spam or unwanted advertising</option>
                    <option value="harassment">Harassment or bullying</option>
                    <option value="hate_speech">Hate speech or discrimination</option>
                    <option value="false_information">Misinformation or deception</option>
                    <option value="privacy_violation">Unauthorized private media / dox</option>
                    <option value="other">Other violation of Community Guidelines</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Details or Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide additional details to help our safety moderators..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                  Subhu employs strict anti-retaliation rules. Reports are strictly confidential and will never be disclosed to the author of the reported content.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Admin Moderation Queue */}
        {activeTab === 'admin_queue' && isAdmin && (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                All clear! No pending reports in the moderation queue.
              </p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-600 dark:text-rose-400 capitalize">
                      {rep.reason.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Target:</strong> {rep.targetType} ({rep.targetId})
                  </p>
                  {rep.details && (
                    <p className="text-slate-500 text-[11px] italic">
                      "{rep.details}"
                    </p>
                  )}

                  {rep.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Moderator notes..."
                        value={resolvingId === rep.id ? moderatorNotes : ''}
                        onChange={(e) => {
                          setResolvingId(rep.id);
                          setModeratorNotes(e.target.value);
                        }}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        onClick={() => handleResolve(rep.id, 'action_taken')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-[11px]"
                      >
                        Take Action
                      </button>
                      <button
                        onClick={() => handleResolve(rep.id, 'dismissed')}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[11px]"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Security & Audit Logs */}
        {activeTab === 'audit_logs' && isAdmin && (
          <div className="mt-4 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No audit logs recorded.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold mr-2">
                      {log.action}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
