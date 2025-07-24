import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from './Auth';
import Body from './Body';
import Header from './HeaderB';
import Footer from './Footer';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const { data, error } = await signUpWithEmail(email, password, name);
    if (error) {
      alert(error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <>
    <Body />
    <Header />
    <div className="auth-container">
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Signup</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
    <Footer />
    </>
  );
};

export default Signup;