import React from 'react';
import socket from '../../socket';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Owner({ roomId, onStageChange, currentStage }) {
  const handleNextStage = async () => {
    try {
      const response = await axiosInstance.post(`/api/rooms/changeStage/${roomId}`);
      const nextStage = response.data.next_stage;
      socket.emit('stageChanged', roomId, nextStage);
      onStageChange(nextStage);

      // 방 정보 업데이트
      const roomResponse = await axiosInstance.get(`/api/games/${roomId}`);
      const updatedRoom = roomResponse.data;
      socket.emit('roomUpdated', updatedRoom);
    } catch (error) {
      console.error('Error changing stage:', error.response.data);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await axiosInstance.post(`/api/rooms/start/${roomId}`);
      const newStage = response.data.stage;
      socket.emit('gameStarted', roomId, newStage);
      onStageChange(newStage);

      // 방 정보 업데이트
      const roomResponse = await axiosInstance.get(`/api/games/${roomId}`);
      const updatedRoom = roomResponse.data;
      socket.emit('roomUpdated', updatedRoom);
    } catch (error) {
      console.error('Error starting game:', error.response.data);
    }
  };

  return (
    <div>
      <h3>Owner Controls</h3>
      {currentStage === 0 ? (

        <button className="mt-4 btn btn-success" onClick={handleStartGame}>Play Game</button>
      ) : (
        <button className="mt-4 btn btn-primary" onClick={handleNextStage}>Next Stage</button>
      )}
    </div>
  );
}

export default Owner;
