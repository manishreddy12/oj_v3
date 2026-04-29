import { useState, useEffect } from 'react';
import codeview from '../assets/codeview.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/home',       label: 'Problems',       always: true  },
  { to: '/contests',   label: 'Contests',        always: true  },
  { to: '/submissions',label: 'Submissions',     auth: true    },
  { to: '/ai-tools',   label: 'AI Tools',        auth: true    },
];

const Header = () => {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [role,       setRole]       = useState(() => localStorage.getItem('role') || '');
  const [userimage,  setUserimage]  = useState(() => localStorage.getItem('userimage') || '');
  const [username,   setUsername]   = useState(() => localStorage.getItem('username') || '');
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const sync = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setRole(localStorage.getItem('role') || '');
      setUserimage(localStorage.getItem('userimage') || '');
      setUsername(localStorage.getItem('username') || '');
    };
    window.addEventListener('profileUpdated', sync);
    return () => window.removeEventListener('profileUpdated', sync);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    ['token','role','userId','username','userimage'].forEach((k) => localStorage.removeItem(k));
    setIsLoggedIn(false); setRole(''); setUserimage(''); setUsername('');
    navigate('/login');
  };

  const isAdmin         = role === 'admin';
  const canCreateProblem = role === 'admin' || role === 'problem_setter';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (to) =>
    `text-sm font-medium transition-colors px-1 py-0.5 rounded ${
      isActive(to)
        ? 'text-white'
        : 'text-slate-300 hover:text-white'
    }`;

  const mobileLinkClass = (to) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-white/15 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className={`sticky top-0 z-30 transition-shadow ${
      scrolled ? 'shadow-lg' : 'shadow-md'
    } bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800`}>
      <nav className="max-w-screen-xl mx-auto flex items-center justify-between px-4 md:px-6 h-14">

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <img src={codeview} alt="CodeView" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold text-white tracking-tight">CodeView</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.filter((l) => l.always || (l.auth && isLoggedIn)).map((l) => (
            <Link key={l.to} to={l.to} className={`${linkClass(l.to)} px-3 py-1.5`}>
              {l.label}
            </Link>
          ))}
          {isLoggedIn && canCreateProblem && (
            <Link to="/createproblem" className={`${linkClass('/createproblem')} px-3 py-1.5`}>
              Create Problem
            </Link>
          )}
          {isLoggedIn && isAdmin && (
            <Link to="/admin" className={`${linkClass('/admin')} px-3 py-1.5`}>
              Admin
            </Link>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {userimage ? (
                  <img
                    src={userimage}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-white/40"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <span
                  className="w-7 h-7 rounded-full bg-indigo-500 items-center justify-center text-white text-xs font-bold ring-2 ring-white/40"
                  style={{ display: userimage ? 'none' : 'flex' }}
                >
                  {username?.charAt(0).toUpperCase() || '?'}
                </span>
                <span className="text-sm font-medium text-slate-200 max-w-[100px] truncate">
                  {username || 'Profile'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-sm font-semibold text-slate-800 bg-white rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-white rounded-lg hover:bg-white/10 transition-colors border border-white/20"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-slate-800 border-t border-white/10 px-4 py-3 space-y-1">
          {NAV_LINKS.filter((l) => l.always || (l.auth && isLoggedIn)).map((l) => (
            <Link key={l.to} to={l.to} className={mobileLinkClass(l.to)}>
              {l.label}
            </Link>
          ))}
          {isLoggedIn && canCreateProblem && (
            <Link to="/createproblem" className={mobileLinkClass('/createproblem')}>
              Create Problem
            </Link>
          )}
          {isLoggedIn && isAdmin && (
            <Link to="/admin" className={mobileLinkClass('/admin')}>
              Admin
            </Link>
          )}

          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className={mobileLinkClass('/profile')}>
                  <span className="flex items-center gap-2">
                    {userimage ? (
                      <img src={userimage} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                    {username || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-white/10 hover:text-rose-200 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login"  className={mobileLinkClass('/login')}>Log in</Link>
                <Link to="/signup" className={mobileLinkClass('/signup')}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
