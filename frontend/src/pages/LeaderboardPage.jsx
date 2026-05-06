import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];
const medalIcons = ['🥇', '🥈', '🥉'];

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_EXEC_URL}/api/leaderboard`);
        setLeaderboard(res.data.data?.leaderboard || []);
      } catch (err) {
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Global Leaderboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ranked by unique problems solved</p>
          </div>
          {!loading && leaderboard.length > 0 && (
            <span className="text-sm text-gray-500">{leaderboard.length} users</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center">
            {error}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No submissions yet. Be the first to solve a problem!
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, podiumIdx) => {
                  const rank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                  const heights = ['h-24', 'h-32', 'h-20'];
                  return (
                    <div key={user.userId} className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{medalIcons[rank]}</span>
                      <div className={`w-full ${heights[podiumIdx]} bg-indigo-${rank === 0 ? '600' : rank === 1 ? '400' : '300'} rounded-t-lg flex flex-col items-center justify-center text-white`}
                        style={{ backgroundColor: rank === 0 ? '#4f46e5' : rank === 1 ? '#818cf8' : '#a5b4fc' }}>
                        <p className="font-bold text-sm truncate max-w-[90%] px-1">{user.username || 'Anonymous'}</p>
                        <p className="text-xs opacity-90">{user.solved} solved</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problems Solved</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Accepted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((user, index) => (
                    <tr
                      key={user.userId}
                      className={`transition-colors ${index < 3 ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index < 3 ? (
                          <span className={`text-lg ${medalColors[index]}`}>{medalIcons[index]}</span>
                        ) : (
                          <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 font-bold text-sm">
                              {(user.username || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.username || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          {user.solved}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.totalAccepted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LeaderboardPage;
