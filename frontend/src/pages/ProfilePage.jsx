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
