import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import logo from './assets/logo.png';
import Search_icon from './assets/search_icon.png';
import { signout } from './Auth';

const Header = ({ onSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const navigate = useNavigate(); // Initialize useNavigate

  // Simulate checking login status (replace with actual logic)
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Check if a token exists
    setIsLoggedIn(!!token); // Set login status based on token presence
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (typeof onSearch === 'function') {
      onSearch(query);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
      if (typeof onSearch === 'function') {
        onSearch('');
      }
    }
  };

  const handleLogout = () => {
    try {
      signout();
      localStorage.removeItem('authToken'); // Remove token from localStorage
      setIsLoggedIn(false); // Update login status
      navigate('/'); // Redirect to the home or login page
      window.location.reload(); // Refresh the page to reflect the updated state
    } catch (error) {
      alert('Error', 'Failed to sign out'); // Use alert instead of Alert.alert for web
    }
  };

  return (
    <header className="sleek-video-header">
      <div className="header-content">
        <div className="left-section">
          <div className="logo-container">
            <img className="logo" src={logo} alt="LOGO" />
            <h1 className="heading">Deepfake Detector</h1>
          </div>
        </div>
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <button className="login-btn" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="signup-btn" onClick={() => navigate('/signup')}>
                Signup
              </button>
            </>
          ) : (
            <>
              <button className="profile-btn" onClick={() => navigate('/profile')}>
                Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
        <div className="search-container">
          {!isSearchOpen ? (
            <button className="search-icon" onClick={toggleSearch}>
              <img className="Search_icon" src={Search_icon} alt="Search Icon" />
            </button>
          ) : (
            <>
              <input
                type="text"
                className="search-input"
                placeholder="Search for features..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <button className="clear-btn" onClick={toggleSearch}>×</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;