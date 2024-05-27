import React from 'react';
import axios from 'axios';
import socket from '../../socket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Owner({ roomId }) {
  const changeStage = async () => {
    try {
      await axiosInstance.post(`/api/rooms/changeStage/${roomId}`);
      socket.emit('stageChanged', roomId);
    } catch (error) {
      console.error('Error changing stage:', error.response.data);
    }
  };

  return (
    <div>
      <h3>Owner Controls</h3>
      <button className="btn btn-primary" onClick={changeStage}>Next Stage</button>
    </div>
  );
}

export default Owner;
