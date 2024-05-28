import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Navigation() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/status');
        if (response.data.loggedIn) {
          setLoggedIn(true);
          setUserId(response.data.user_id);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    checkLoginStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      setLoggedIn(true);
      setUserId(response.data.user_id);
      navigate('/');
    } catch (error) {
      console.error('Error logging in:', error.response.data);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
      setLoggedIn(false);
      setUserId('');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.response.data);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">Anonymous Game</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {loggedIn ? (
            <div className="ml-auto d-flex align-items-center">
              <span className="navbar-text mr-3">{userId}님 반갑습니다.</span>
              <button className="btn btn-secondary" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <form className="ml-auto form-inline d-flex align-items-center" onSubmit={handleLogin}>
              <input type="text" className="form-control mr-2" name="user_id" placeholder="User ID" onChange={handleChange} required />
              <input type="password" className="form-control mr-2" name="password" placeholder="Password" onChange={handleChange} required />
              <button type="submit" className="btn btn-primary mr-2">로그인</button>
              <Link to="/register" className="btn btn-secondary">회원가입</Link>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
