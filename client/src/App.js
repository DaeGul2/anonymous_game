import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Room from './pages/Room';
import Navigation from './components/Navigation';
import CreateRoom from './components/CreateRoom';
import './App.css';

function App() {
  return (
    <div className="container">
      <Navigation />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
