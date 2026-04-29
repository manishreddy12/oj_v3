import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, dismiss };
}

const ToastContainer = ({ toasts, dismiss }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium max-w-xs ${
          t.type === 'success' ? 'bg-emerald-600' :
          t.type === 'error'   ? 'bg-red-600' : 'bg-indigo-600'
        }`}
      >
        <span className="mt-0.5 text-base shrink-0">
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
        </span>
        <span className="flex-1 leading-snug">{t.message}</span>
        <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100 text-lg leading-none -mt-0.5">×</button>
      </div>
    ))}
  </div>
);

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [diff, setDiff] = useState(() => new Date(targetDate) - new Date());
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(targetDate) - new Date()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hrs:  Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

const CountdownDisplay = ({ targetDate, label }) => {
  const t = useCountdown(targetDate);
  if (!t) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-white/60 shrink-0">{label}:</span>
      {t.days > 0 && <Chip>{t.days}d</Chip>}
      <Chip>{pad(t.hrs)}h</Chip>
      <Chip>{pad(t.mins)}m</Chip>
      <Chip>{pad(t.secs)}s</Chip>
    </div>
  );
};

const Chip = ({ children }) => (
  <span className="bg-white/20 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md tabular-nums">
    {children}
  </span>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getStatus = (c) => {
  const now = new Date();
  if (now < new Date(c.startTime)) return 'upcoming';
  if (now <= new Date(c.endTime))  return 'active';
  return 'ended';
};

const Spinner = ({ size = 8 }) => (
  <svg className={`animate-spin h-${size} w-${size} text-indigo-500`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
    status === 'active'   ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300' :
    status === 'upcoming' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' :
                            'bg-gray-100 text-gray-600 ring-1 ring-gray-300'
  }`}>
    {status === 'active' && (
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
    )}
    {status}
  </span>
);

// ─── Podium ───────────────────────────────────────────────────────────────────
const Podium = ({ top3 }) => {
  // Display order: silver (2nd), gold (1st), bronze (3rd)
  const slots = [
    { entry: top3[1], medal: '🥈', color: 'from-slate-300 to-slate-400', height: 'h-20', label: '2nd' },
    { entry: top3[0], medal: '🥇', color: 'from-yellow-400 to-amber-500',  height: 'h-28', label: '1st' },
    { entry: top3[2], medal: '🥉', color: 'from-orange-300 to-orange-400', height: 'h-16', label: '3rd' },
  ];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {slots.map(({ entry, medal, color, height, label }, i) => {
        if (!entry) return <div key={i} className={`w-28 ${height}`} />;
        return (
          <div key={entry.userId} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white">
              {(entry.username || '?').charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-semibold text-gray-800 text-center max-w-[80px] truncate">
              {entry.username}
            </p>
            <p className="text-xs text-indigo-600 font-bold">{entry.totalScore} pts</p>
            <div className={`${height} w-28 rounded-t-xl bg-gradient-to-b ${color} flex flex-col items-center justify-end pb-2 shadow-lg`}>
              <span className="text-2xl">{medal}</span>
              <span className="text-white font-bold text-xs opacity-90">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ContestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, add: toast, dismiss } = useToast();

  const [contest, setContest]         = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('problems');
  const [lbLoading, setLbLoading]     = useState(false);
  const [lbMsg, setLbMsg]             = useState('');
  const [publishing, setPublishing]   = useState(false);
  const [showModal, setShowModal]     = useState(false);

  const token  = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const role   = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const fetchContest = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContest(data.data?.contest);
    } catch {
      toast('Failed to load contest', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { if (id) fetchContest(); }, [id]);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    setLbMsg('');
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}/leaderboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.data?.message) {
        setLbMsg(data.data.message);
      } else {
        setLeaderboard(data.data);
      }
    } catch (err) {
      setLbMsg(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLbLoading(false);
    }
  }, [id, token]);

  const handleRegister = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast('Registered successfully!', 'success');
      fetchContest();
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const handlePublishRankings = async () => {
    setPublishing(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}/publish-rankings`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast('Rankings published successfully!', 'success');
      setShowModal(false);
      fetchContest();
      setActiveTab('leaderboard');
      fetchLeaderboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to publish rankings', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this contest? This cannot be undone.')) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/contests');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete contest', 'error');
    }
  };

  const switchTab = (key) => {
    setActiveTab(key);
    if (key === 'leaderboard' && !leaderboard && !lbMsg) fetchLeaderboard();
  };

  // ── Loading / not found ──
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center gap-4 flex-col">
          <Spinner size={10} />
          <p className="text-gray-400 text-sm">Loading contest…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center gap-4 text-center px-4">
          <span className="text-6xl">😕</span>
          <h2 className="text-xl font-semibold text-gray-700">Contest not found</h2>
          <button onClick={() => navigate('/contests')} className="text-indigo-600 hover:underline text-sm">
            ← Back to contests
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const status = getStatus(contest);
  const isRegistered = contest.participants?.some((p) => (p._id || p).toString() === userId);
  const top3 = leaderboard?.leaderboard?.slice(0, 3) || [];

  const heroBg =
    status === 'active'   ? 'from-emerald-600 via-teal-600 to-cyan-700' :
    status === 'upcoming' ? 'from-blue-600 via-indigo-600 to-violet-700' :
                            'from-gray-600 via-slate-700 to-gray-800';

  const tabs = [
    { key: 'problems',     label: 'Problems',      count: contest.problems?.length },
    { key: 'leaderboard',  label: 'Leaderboard',   icon: '🏆' },
    { key: 'participants', label: 'Participants',   count: contest.participants?.length },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <Header />

      {/* ── Hero Banner ── */}
      <div className={`bg-gradient-to-br ${heroBg} text-white`}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <button
            onClick={() => navigate('/contests')}
            className="text-white/60 hover:text-white text-sm flex items-center gap-1 mb-5 transition-colors"
          >
            ← All Contests
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusBadge status={status} />
                {contest.rankingsPublished && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300">
                    🏆 Rankings Published
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight break-words">
                {contest.title}
              </h1>
              {contest.description && (
                <p className="text-white/75 text-sm md:text-base mb-5 max-w-2xl leading-relaxed">
                  {contest.description}
                </p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-white/75 mb-4">
                <span>🕐 {formatDate(contest.startTime)}</span>
                <span>🏁 {formatDate(contest.endTime)}</span>
                <span>👥 {contest.participants?.length || 0} participants</span>
                <span>📝 {contest.problems?.length || 0} problems</span>
              </div>

              {(status === 'active' || status === 'upcoming') && (
                <CountdownDisplay
                  targetDate={status === 'upcoming' ? contest.startTime : contest.endTime}
                  label={status === 'upcoming' ? 'Starts in' : 'Ends in'}
                />
              )}
            </div>

            {/* Right: actions */}
            <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0 flex-wrap">
              {(status === 'active' || status === 'upcoming') && !isRegistered && (
                <button
                  onClick={handleRegister}
                  className="px-5 py-2.5 bg-white text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
                >
                  Register Now
                </button>
              )}
              {isRegistered && (
                <span className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-xl flex items-center gap-2 border border-white/30">
                  <span className="text-emerald-300">✓</span> Registered
                </span>
              )}
              {isAdmin && !contest.rankingsPublished && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-xl hover:bg-yellow-300 transition-colors shadow-md flex items-center gap-2"
                >
                  🏆 Publish Rankings
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-500/80 text-white text-sm font-semibold rounded-xl hover:bg-red-500 transition-colors shadow-md"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`relative px-4 py-3.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-t-full'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.count != null && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 md:px-8 py-6">

        {/* Problems */}
        {activeTab === 'problems' && (
          <div>
            {contest._accessDenied ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-amber-800 font-semibold mb-1">Access Restricted</p>
                <p className="text-amber-700 text-sm mb-4">You must register to view problems during an active contest.</p>
                <button
                  onClick={handleRegister}
                  className="px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors"
                >
                  Register Now
                </button>
              </div>
            ) : contest.problems?.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Problem</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                      <th className="hidden md:table-cell px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contest.problems.map((prob, idx) => (
                      <tr
                        key={prob._id || idx}
                        onClick={() => navigate(`/problem/${prob._id}`)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors text-sm">
                            {prob.title}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            prob.difficulty === 'Easy'   ? 'bg-emerald-100 text-emerald-800' :
                            prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                                           'bg-red-100 text-red-800'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(prob.tags || []).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-500 font-medium">No problems added to this contest yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div>
            {lbLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Spinner size={10} />
                <p className="text-gray-400 text-sm">Calculating rankings…</p>
              </div>
            ) : lbMsg ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-indigo-900 font-semibold mb-1">Rankings Not Available Yet</p>
                <p className="text-indigo-700 text-sm">{lbMsg}</p>
              </div>
            ) : leaderboard?.leaderboard ? (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
                    <p className="text-sm text-gray-500">
                      {leaderboard.leaderboard.length} participant{leaderboard.leaderboard.length !== 1 ? 's' : ''} ranked
                    </p>
                  </div>
                  <button
                    onClick={fetchLeaderboard}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    ↻ Refresh
                  </button>
                </div>

                {leaderboard.leaderboard.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">🏆</div>
                    <p className="text-gray-500 font-medium">No submissions yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to submit!</p>
                  </div>
                ) : (
                  <>
                    {top3.length >= 2 && <Podium top3={top3} />}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participant</th>
                            <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Solved</th>
                            <th className="hidden md:table-cell px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {leaderboard.leaderboard.map((entry) => (
                            <tr
                              key={entry.userId}
                              className={`transition-colors ${
                                entry.userId === userId
                                  ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-100'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-5 py-4">
                                <span className={`text-lg font-bold ${
                                  entry.rank === 1 ? 'text-yellow-500' :
                                  entry.rank === 2 ? 'text-slate-400'  :
                                  entry.rank === 3 ? 'text-orange-500' : 'text-gray-400 text-sm'
                                }`}>
                                  {entry.rank <= 3
                                    ? ['🥇','🥈','🥉'][entry.rank - 1]
                                    : `#${entry.rank}`}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                    entry.userId === userId
                                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                                      : 'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {(entry.username || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">{entry.username}</p>
                                    {entry.userId === userId && (
                                      <p className="text-indigo-500 text-xs font-medium">You</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="font-bold text-indigo-700 text-base">{entry.totalScore}</span>
                                <span className="text-gray-400 text-xs ml-0.5">pts</span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="text-gray-800 font-semibold text-sm">{entry.solvedCount}</span>
                                <span className="text-gray-400 text-xs"> / {contest.problems?.length ?? '?'}</span>
                              </td>
                              <td className="hidden md:table-cell px-5 py-4 text-center">
                                <span className="text-gray-500 text-sm font-mono">{entry.totalTime}ms</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-500 font-medium">Click the Leaderboard tab to load rankings.</p>
              </div>
            )}
          </div>
        )}

        {/* Participants */}
        {activeTab === 'participants' && (
          <div>
            {contest.participants?.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {contest.participants.length} registered participant{contest.participants.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {contest.participants.map((p, idx) => (
                    <div
                      key={p._id || idx}
                      className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center gap-2 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm ring-2 ring-white">
                        <span className="text-lg font-bold text-white">
                          {(p.username || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 font-medium text-center truncate w-full">
                        {p.username || p._id || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-gray-500 font-medium">No participants yet.</p>
                {!isRegistered && (status === 'active' || status === 'upcoming') && (
                  <button
                    onClick={handleRegister}
                    className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Be the First — Register!
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Publish Rankings Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Publish Rankings?</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              This will make the contest leaderboard publicly visible to all participants.
              This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={publishing}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRankings}
                disabled={publishing}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing && <Spinner size={4} />}
                {publishing ? 'Publishing…' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ContestDetail;
