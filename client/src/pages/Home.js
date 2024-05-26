import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h2>Welcome to Anonymous Game</h2>
      <Link to="/create-room" className="btn btn-primary">Create Room</Link>
      <Link to="/register" className="ml-2 btn btn-secondary">Register</Link>
    </div>
  );
}

export default Home;
