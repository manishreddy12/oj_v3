import axios from 'axios';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const SubmissionTable = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.log('No userId found in localStorage');
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_EXEC_URL}/api/submissions/user/${userId}`
        );
        // Limit to 30 most recent (backend already does this, but ensure client-side too)
        const subs = response.data.data?.submissions || [];
        setSubmissions(subs.slice(0, 30));
      } catch (err) {
        console.log('Error fetching submissions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const dateObj = new Date(time);
    if (isNaN(dateObj)) return time;
    return dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ', ' +
      dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Wrong Answer': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Time Limit Exceeded': return 'bg-orange-100 text-orange-800';
      case 'Runtime Error': return 'bg-red-100 text-red-800';
      case 'Compilation Error': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const langLabel = (lang) => {
    switch (lang) {
      case 'cpp': return 'C++';
      case 'python': return 'Python';
      case 'c': return 'C';
      default: return lang;
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Submissions</h2>
          <span className="text-sm text-gray-500">Recent 30 submissions</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No submissions yet. Start solving problems!
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub, index) => (
                    <>
                      <tr
                        key={sub._id || index}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === sub._id ? 'bg-indigo-50' : ''}`}
                        onClick={() => toggleExpand(sub._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                          {sub.problemTitle || sub.problem || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                            {langLabel(sub.language)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sub.executionTime ? `${sub.executionTime}ms` : '-'}
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(sub.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                          <span className="hover:underline">
                            {expandedId === sub._id ? '▲ Hide' : '▼ Show'}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Detail Row */}
                      {expandedId === sub._id && (
                        <tr key={`${sub._id}-detail`} className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Test Cases Info */}
                              {sub.totalTestCases > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-700">Test Cases</p>
                                  <p className="text-gray-600">
                                    {sub.failedTestCase
                                      ? `Failed on test case ${sub.failedTestCase} of ${sub.totalTestCases}`
                                      : `All ${sub.totalTestCases} test cases passed`}
                                  </p>
                                </div>
                              )}

                              {/* Execution Stats */}
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-700">Execution Stats</p>
                                <p className="text-gray-600">
                                  Time: {sub.executionTime || 0}ms | Memory: {sub.memoryUsed || 0}KB
                                </p>
                              </div>

                              {/* Output */}
                              {sub.output && sub.status !== 'Accepted' && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-700">Your Output</p>
                                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                                    {sub.output}
                                  </pre>
                                </div>
                              )}

                              {/* Expected Output */}
                              {sub.expectedOutput && sub.status === 'Wrong Answer' && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-700">Expected Output</p>
                                  <pre className="bg-green-50 border border-green-200 rounded p-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                                    {sub.expectedOutput}
                                  </pre>
                                </div>
                              )}

                              {/* Error */}
                              {sub.error && (
                                <div className="md:col-span-2 space-y-1">
                                  <p className="font-semibold text-red-700">Error</p>
                                  <pre className="bg-red-50 border border-red-200 rounded p-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap text-red-800">
                                    {sub.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionTable;
