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
        console.log("checklogin", response)
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
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <Link className="navbar-brand" to="/">Anonymous Game</Link>
      <div className="collapse navbar-collapse">
        {loggedIn ? (
          <div className="ml-auto">
            <span>{userId}님 반갑습니다.</span>
            <button className="ml-2 btn btn-secondary" onClick={handleLogout}>로그아웃</button>
          </div>
        ) : (
          <form className="ml-auto form-inline" onSubmit={handleLogin}>
            <input type="text" className="mr-2 form-control" name="user_id" placeholder="User ID" onChange={handleChange} required />
            <input type="password" className="mr-2 form-control" name="password" placeholder="Password" onChange={handleChange} required />
            <button type="submit" className="btn btn-primary">로그인</button>
          </form>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
