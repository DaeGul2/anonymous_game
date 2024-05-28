// Owner.js
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
      const nextStage = currentStage + 1;
      socket.emit('stageChanged', roomId, nextStage);
      onStageChange(nextStage);

      // 방 정보 업데이트
      const roomResponse = await axiosInstance.get(`/api/games/${roomId}`);
      const updatedRoom = roomResponse.data;
      socket.emit('roomUpdated', updatedRoom);
    } catch (error) {
      console.error('Error changing stage:', error.response?.data || error.message);
    }
  };

  const handleBackStage = async () => {
    try {
      const nextStage = currentStage - 1;
      socket.emit('stageChanged', roomId, nextStage);
      onStageChange(nextStage);

      // 방 정보 업데이트
      const roomResponse = await axiosInstance.get(`/api/games/${roomId}`);
      const updatedRoom = roomResponse.data;
      socket.emit('roomUpdated', updatedRoom);
    } catch (error) {
      console.error('Error changing stage:', error.response?.data || error.message);
    }
  };

  const handleStartGame = async () => {
    try {
      const newStage = 1; // 게임 시작 시 첫 번째 스테이지로 설정
      socket.emit('gameStarted', roomId, newStage);
      onStageChange(newStage);

      // 방 정보 업데이트
      const roomResponse = await axiosInstance.get(`/api/games/${roomId}`);
      const updatedRoom = roomResponse.data;
      socket.emit('roomUpdated', updatedRoom);
    } catch (error) {
      console.error('Error starting game:', error.response?.data || error.message);
    }
  };

  return (
    <div>
      
      {currentStage === 0 ? (
        <button className="mt-4 btn btn-success" onClick={handleStartGame}>Play Game</button>
      ) : (
        <div>
          {currentStage > 2 && <button className="mt-4 btn btn-danger" onClick={handleBackStage}>Back Stage</button>}
          {currentStage < 7 && <button className="mt-4 btn btn-primary" onClick={handleNextStage}>Next Stage</button>}
        </div>
      )}
    </div>
  );
}

export default Owner;
