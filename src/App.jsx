import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Footer from './Footer';
import Body from './Body';
import { useState } from 'react';
import Profile from './Profile';

const App = () => {

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Routes>
      {/* Route for the login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/signup" element={<Signup />} />

      {/* Route for the main app */}
      <Route
        path="/"
        element={
          <>
            <Body />
            <Header onSearch={setSearchQuery} />
            <Hero/>
            <Features searchQuery={searchQuery} />
            <Footer />
          </>
        }
      />
    </Routes>
  );
};

export default App;