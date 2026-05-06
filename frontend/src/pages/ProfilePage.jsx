import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [imageMode, setImageMode] = useState('file'); // 'file' or 'url'
  const [imagePreview, setImagePreview] = useState('');
  const [stats, setStats] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your profile.');
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/profile`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setUser(response.data.data?.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_EXEC_URL}/api/submissions/user/${userId}`
        );
        const subs = res.data.data?.submissions || [];
        const accepted = subs.filter(s => s.status === 'Accepted');
        const uniqueSolved = new Set(accepted.map(s => s.problem)).size;
        setStats({
          total: subs.length,
          accepted: accepted.length,
          rate: subs.length > 0 ? Math.round((accepted.length / subs.length) * 100) : 0,
          solved: uniqueSolved,
        });
      } catch {
        // not critical
      }
    };
    fetchStats();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUpdateMsg('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUpdateMsg('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateImage = async () => {
    if (!imageUrl.trim()) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/profile/image`,
        { imageUrl },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const updatedUser = response.data.data?.user;
      setUser(updatedUser);
      setShowImageInput(false);
      setImageUrl('');

      // Sync to localStorage and notify Header
      if (updatedUser?.userimage) {
        localStorage.setItem('userimage', updatedUser.userimage);
      } else {
        localStorage.removeItem('userimage');
      }
      window.dispatchEvent(new Event('profileUpdated'));

      setUpdateMsg('Profile image updated!');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      setUpdateMsg(err.response?.data?.message || 'Error updating image');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwMsg('All fields are required.');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg('New passwords do not match.');
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg('New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    setPwMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/profile/password`,
        { currentPassword: pwForm.current, newPassword: pwForm.newPw },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setPwMsg('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => { setPwMsg(''); setShowPasswordForm(false); }, 2500);
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Error changing password');
    } finally {
      setPwLoading(false);
    }
  };

  const roleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'problem_setter': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gray-500">Loading profile...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 max-w-md w-full text-center">
            {error}
          </div>
        ) : user ? (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-2 overflow-hidden">
                  {user.userimage ? (
                    <img src={user.userimage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-indigo-600">
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="absolute bottom-1 right-0 bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-indigo-700 transition-colors shadow-md"
                  title="Change profile image"
                >
                  📷
                </button>
              </div>

              {/* Image Input Panel */}
              {showImageInput && (
                <div className="mt-3 w-full space-y-2">
                  {/* Mode toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 text-sm">
                    <button
                      onClick={() => { setImageMode('file'); setImageUrl(''); setImagePreview(''); }}
                      className={`flex-1 py-1.5 ${imageMode === 'file' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => { setImageMode('url'); setImageUrl(''); setImagePreview(''); }}
                      className={`flex-1 py-1.5 ${imageMode === 'url' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Image URL
                    </button>
                  </div>

                  {imageMode === 'file' ? (
                    <div className="space-y-2">
                      <label className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 text-center cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                        {imagePreview ? 'Change file' : 'Click to select image (max 2MB)'}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-indigo-300" />
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  )}

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleUpdateImage}
                      disabled={updating || !imageUrl.trim()}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setShowImageInput(false); setImageUrl(''); setImagePreview(''); }}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {updateMsg && (
                <p className={`mt-2 text-sm ${updateMsg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {updateMsg}
                </p>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mt-2">{user.username}</h2>
              <span className={`mt-2 px-3 py-1 text-sm font-semibold rounded-full ${roleColor(user.role)}`}>
                {user.role}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Username</span>
                <span className="text-sm text-gray-900">{user.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Member since</span>
                <span className="text-sm text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Change Password */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => { setShowPasswordForm(v => !v); setPwMsg(''); }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors group"
              >
                <span>Change Password</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPasswordForm && (
                <div className="mt-3 space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={pwForm.newPw}
                    onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  {pwMsg && (
                    <p className={`text-xs ${pwMsg.includes('success') || pwMsg.includes('changed') ? 'text-green-600' : 'text-red-600'}`}>
                      {pwMsg}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwLoading}
                      className="flex-1 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {pwLoading ? 'Saving...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setPwForm({ current: '', newPw: '', confirm: '' }); setPwMsg(''); }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submission Stats */}
            {stats !== null && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Submission Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{stats.solved}</p>
                    <p className="text-xs text-indigo-500 font-medium mt-0.5">Problems Solved</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{stats.rate}%</p>
                    <p className="text-xs text-green-500 font-medium mt-0.5">Acceptance Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Total Submissions</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700">{stats.accepted}</p>
                    <p className="text-xs text-yellow-500 font-medium mt-0.5">Accepted</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No profile data available.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
