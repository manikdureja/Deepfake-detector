import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from './Auth';
import Body from './Body';
import Header from './HeaderB';
import Footer from './Footer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await signInWithEmail(email, password);
      if (error) {
        alert(error.message);
      } else {
        localStorage.setItem('authToken', data.session.access_token);
        navigate('/'); // Redirect to the app
      }
    } catch (err) {
      console.error('Error during login:', err);
    }
  };

  return (
    <>
    <Body />
    <Header />
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Signup</a>
      </p>
    </div>
    <Footer />
    </>
  );
};

export default Login;