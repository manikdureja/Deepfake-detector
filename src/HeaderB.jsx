import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import logo from './assets/logo.png';
import Search_icon from './assets/search_icon.png';
import { signout } from './Auth';

const Header = ({ onSearch }) => {

  return (
    <header className="sleek-video-header">
      <div className="header-content">
        <div className="left-section">
          <div className="logo-container">
            <img className="logo" src={logo} alt="LOGO" />
            <h1 className="heading">Deepfake Detector</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;