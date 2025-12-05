/**
 * Writing Stats Panel — Productivity tracking
 * 
 * Final Draft 13 parity: Writing stats and productivity insights
 */

import { useState, useEffect } from 'react';

interface WritingSession {
  date: string;
  wordCount: number;
  pageCount: number;
  durationMinutes: number;
}

export default function WritingStatsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [todayWords, setTodayWords] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Load from localStorage (in production, use SurrealDB)
    const stored = localStorage.getItem('writing-sessions');
    if (stored) {
      setSessions(JSON.parse(stored));
    }

    // Track current session
    const today = new Date().toISOString().split('T')[0];
    const currentSession = sessions.find(s => s.date === today);
    setTodayWords(currentSession?.wordCount || 0);
  }, [isOpen, sessions]);

  const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
  const avgWordsPerDay = sessions.length > 0 ? Math.round(totalWords / sessions.length) : 0;

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-white/10 bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="font-semibold text-sm text-white">Writing Stats</h3>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="p-3 space-y-3">
        <div className="p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
          <h4 className="text-xs font-medium text-white/50 mb-3">Today</h4>
          <div className="text-3xl font-bold text-violet-400 mb-1">{todayWords}</div>
          <div className="text-xs text-white/40">words written</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
            <div className="text-xl font-bold text-violet-400">{totalWords}</div>
            <div className="text-xs text-white/40">Total Words</div>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
            <div className="text-xl font-bold text-violet-400">{avgWordsPerDay}</div>
            <div className="text-xs text-white/40">Avg/Day</div>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
            <div className="text-xl font-bold text-violet-400">{sessions.length}</div>
            <div className="text-xs text-white/40">Days</div>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
            <div className="text-xl font-bold text-violet-400">
              {sessions.reduce((sum, s) => sum + s.pageCount, 0)}
            </div>
            <div className="text-xs text-white/40">Pages</div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 overflow-y-auto p-3">
        <h4 className="text-xs font-medium text-white/50 mb-2">Recent Sessions</h4>
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-white/30 text-sm">
             <span className="text-2xl block mb-2">📝</span>
            Start writing to track your progress
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(-7).reverse().map((session, i) => (
              <div key={i} className="p-2 bg-white/[0.02] rounded border border-white/[0.05]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70">{new Date(session.date).toLocaleDateString()}</span>
                  <span className="text-xs text-violet-400 font-medium">{session.wordCount} words</span>
                </div>
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: `${(session.wordCount / (avgWordsPerDay || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 text-xs text-white/40 text-center">
        Keep writing! 🚀
      </div>
    </div>
  );
}
