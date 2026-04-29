import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const getStatus = (contest) => {
  const now = new Date();
  if (now < new Date(contest.startTime)) return 'upcoming';
  if (now <= new Date(contest.endTime))  return 'active';
  return 'ended';
};

const formatDate = (d) =>
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUS_COLORS = {
  active:   'bg-emerald-500',
  upcoming: 'bg-blue-500',
  ended:    'bg-gray-400',
};
const STATUS_BADGE = {
  active:   'bg-emerald-100 text-emerald-800 ring-emerald-300',
  upcoming: 'bg-blue-100 text-blue-800 ring-blue-300',
  ended:    'bg-gray-100 text-gray-600 ring-gray-300',
};
const STATUS_ICON = { active: '🟢', upcoming: '📅', ended: '🏁' };

const FILTERS = ['all', 'active', 'upcoming', 'ended'];

const ContestList = () => {
  const [contests, setContests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [registering, setRegistering] = useState(null);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('role') === 'admin';

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests`);
        setContests(data.data?.contests || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRegister = async (e, contestId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setRegistering(contestId);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contests/${contestId}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests`);
      setContests(data.data?.contests || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const userId = localStorage.getItem('userId');

  const tagged = contests.map((c) => ({ ...c, _status: getStatus(c) }));
  const visible = filter === 'all' ? tagged : tagged.filter((c) => c._status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? tagged.length : tagged.filter((c) => c._status === f).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contests</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {tagged.length} total — {counts.active} active, {counts.upcoming} upcoming
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/contests/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              + Create Contest
            </Link>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-9 w-9 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-600 font-semibold">No {filter !== 'all' ? filter : ''} contests found.</p>
            {isAdmin && (
              <Link
                to="/contests/create"
                className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium"
              >
                Create the first one →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((contest) => {
              const status = contest._status;
              const isRegistered = contest.participants?.some(
                (p) => (p._id || p) === userId
              );

              return (
                <div
                  key={contest._id}
                  onClick={() => navigate(`/contests/${contest._id}`)}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 overflow-hidden group"
                >
                  {/* Colour stripe */}
                  <div className={`h-1.5 w-full ${STATUS_COLORS[status]}`} />

                  <div className="p-5">
                    {/* Status badge + published badge */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ${STATUS_BADGE[status]}`}>
                        {status === 'active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {STATUS_ICON[status]} {status}
                      </span>
                      {contest.rankingsPublished && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300">
                          🏆 Results Out
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                      {contest.title}
                    </h3>
                    {contest.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                        {contest.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">🕐</span>
                        <span>{formatDate(contest.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">🏁</span>
                        <span>{formatDate(contest.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <span>👥</span>
                          <span className="font-semibold text-gray-700">{contest.participants?.length || 0}</span>
                          <span>participants</span>
                        </span>
                        {contest.problems != null && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-1">
                              <span>📝</span>
                              <span className="font-semibold text-gray-700">{contest.problems.length}</span>
                              <span>problems</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2">
                      {(status === 'active' || status === 'upcoming') && !isRegistered && (
                        <button
                          onClick={(e) => handleRegister(e, contest._id)}
                          disabled={registering === contest._id}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                            status === 'active'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          } disabled:opacity-60`}
                        >
                          {registering === contest._id ? 'Registering…' : 'Register'}
                        </button>
                      )}
                      {isRegistered && (
                        <span className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg ring-1 ring-emerald-200">
                          ✓ Registered
                        </span>
                      )}
                      <span className="ml-auto text-indigo-500 text-xs font-medium group-hover:text-indigo-700 transition-colors">
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ContestList;
