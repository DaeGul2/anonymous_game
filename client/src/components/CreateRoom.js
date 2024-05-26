import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// navigate를 초기화합니다.


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function CreateRoom() {
  const [formData, setFormData] = useState({
    roomName: '',
    password: '',
    maxParticipants: '',
    gameMode: 1,
    hintSettings: [],
    questions: []
  });

  const [hintSetting, setHintSetting] = useState({ infoType: '', punishment: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleHintSettingChange = (e) => {
    setHintSetting({ ...hintSetting, [e.target.name]: e.target.value });
  };

  const handleAddHintSetting = () => {
    setFormData({
      ...formData,
      hintSettings: [...formData.hintSettings, hintSetting]
    });
    setHintSetting({ infoType: '', punishment: '' });
  };

  const handleDeleteHintSetting = (index) => {
    const newHintSettings = formData.hintSettings.filter((_, i) => i !== index);
    setFormData({ ...formData, hintSettings: newHintSettings });
  };

  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axiosInstance.post('/api/games/create', formData);
    console.log('Room created:', response.data);
    alert('방이 만들어졌습니다!');
    navigate('/'); // 홈 화면으로 이동합니다.
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
        {formData.gameMode == 2 && (
          <div className="form-group">
            <label>Hint Settings</label>
            <div className="mb-2 form-inline">
              <input type="text" className="mr-2 form-control" placeholder="Info Type" name="infoType" value={hintSetting.infoType} onChange={handleHintSettingChange} />
              <input type="text" className="mr-2 form-control" placeholder="Punishment" name="punishment" value={hintSetting.punishment} onChange={handleHintSettingChange} />
              <button type="button" className="btn btn-secondary" onClick={handleAddHintSetting}>Add</button>
            </div>
            <ul className="list-group">
              {formData.hintSettings.map((setting, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {setting.infoType} || {setting.punishment}
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteHintSetting(index)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="submit" className="btn btn-primary">Create Room</button>
      </form>
    </div>
  );
}

export default CreateRoom;
