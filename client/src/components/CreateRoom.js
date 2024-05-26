import React, { useState } from 'react';
import axios from 'axios';

function CreateRoom() {
  const [formData, setFormData] = useState({
    roomName: '',
    password: '',
    maxParticipants: '',
    gameMode: 1,
    hintSettings: [],
    questions: []
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/games/create', formData);
      console.log('Room created:', response.data);
    } catch (error) {
      console.error('Error creating room:', error.response.data);
    }
  };

  return (
    <div>
      <h2>Create Room</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Room Name</label>
          <input type="text" className="form-control" name="roomName" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control" name="password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Max Participants</label>
          <input type="number" className="form-control" name="maxParticipants" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Game Mode</label>
          <select className="form-control" name="gameMode" onChange={handleChange}>
            <option value={1}>100% Anonymous</option>
            <option value={2}>With Hints</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Create Room</button>
      </form>
    </div>
  );
}

export default CreateRoom;
