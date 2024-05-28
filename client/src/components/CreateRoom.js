import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, InputGroup, Col, Row } from 'react-bootstrap';

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
    <div className="container mt-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Create Room</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formRoomName" className="form-group">
              <Form.Label>Room Name</Form.Label>
              <Form.Control type="text" name="roomName" onChange={handleChange} required />
            </Form.Group>
            <Form.Group controlId="formPassword" className="form-group">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" onChange={handleChange} required />
            </Form.Group>
            <Form.Group controlId="formMaxParticipants" className="form-group">
              <Form.Label>Max Participants</Form.Label>
              <Form.Control type="number" name="maxParticipants" onChange={handleChange} required />
            </Form.Group>
            <Form.Group controlId="formHintSettings" className="form-group">
              <Form.Label>Hint Settings</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Info Type"
                  name="infoType"
                  value={hintSetting.infoType}
                  onChange={handleHintSettingChange}
                />
                <Form.Control
                  placeholder="Punishment"
                  name="punishment"
                  value={hintSetting.punishment}
                  onChange={handleHintSettingChange}
                />
                <Button variant="secondary" onClick={handleAddHintSetting}>Add</Button>
              </InputGroup>
              <ul className="list-group">
                {formData.hintSettings.map((setting, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    {setting.infoType} || {setting.punishment}
                    <Button variant="danger" size="sm" onClick={() => handleDeleteHintSetting(index)}>Delete</Button>
                  </li>
                ))}
              </ul>
            </Form.Group>
            <div className="text-center">
              <Button variant="primary" type="submit">Create Room</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default CreateRoom;
