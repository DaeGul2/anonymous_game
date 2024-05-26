import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Register() {
  const [formData, setFormData] = useState({
    user_id: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        user_id: formData.user_id,
        password: formData.password
      });
      alert('회원가입에 성공하였습니다!');
      navigate('/');
    } catch (error) {
      setError(error.response.data.message || 'Error registering user');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>User ID</label>
          <input type="text" className="form-control" name="user_id" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control" name="password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" className="form-control" name="confirmPassword" onChange={handleChange} required />
        </div>
        {error && <p className="text-danger">{error}</p>}
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
    </div>
  );
}

export default Register;
