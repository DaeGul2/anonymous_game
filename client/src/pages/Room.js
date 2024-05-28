// Room.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import Stage0 from './stages/Stage0';
import Stage1 from './stages/Stage1';
import Stage2 from './stages/Stage2';
import Stage3 from './stages/Stage3';
import Stage4 from './stages/Stage4';
import Stage5 from './stages/Stage5';
import Stage6 from './stages/Stage6';
import Stage7 from './stages/Stage7';
import Owner from './stages/Owner';
import Player from './stages/Player';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Room() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [isPending, setIsPending] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/games/${roomId}`);
        setRoom(response.data);
        setCurrentStage(response.data.currentStage);
        setIsPending(response.data.isPending);
      } catch (error) {
        console.error('Error fetching room:', error.response?.data || error.message);
      }
    };

    const fetchUserId = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/status');
        if (response.data.loggedIn) {
          setUserId(response.data.user_id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error.response?.data || error.message);
      }
    };

    const initialize = async () => {
      await fetchUserId();
      await fetchRoom();
    };

    initialize();

    const handleRoomUpdated = (updatedRoom) => {
      if (updatedRoom._id === roomId) {
        setRoom(updatedRoom);
        setCurrentStage(updatedRoom.currentStage);
        setIsParticipant(updatedRoom.participants.includes(userId));
        setIsPending(updatedRoom.isPending);
      }
    };

    const handleStageChanged = (stage) => {
      setCurrentStage(stage);
    };

    const handleGameStarted = (stage) => {
      setCurrentStage(stage);
    };

    const handlePendingToggled = (isPending) => {
      setIsPending(isPending);
      if (isPending) {
        setTimeout(async () => {
          try {
            await axiosInstance.post(`/api/rooms/togglePending/${roomId}`);
          } catch (error) {
            console.error('Error toggling pending:', error.response?.data || error.message);
          }
        }, 10000); // 10초 후 isPending을 false로 설정
      }
    };

    const handleQuestionSelected = (roomId, questionId, isOwner) => {
      setSelectedQuestionId(questionId);
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('stageChanged', handleStageChanged);
    socket.on('gameStarted', handleGameStarted);
    socket.on('pendingToggled', handlePendingToggled);
    socket.on('questionSelected', handleQuestionSelected);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('stageChanged', handleStageChanged);
      socket.off('gameStarted', handleGameStarted);
      socket.off('pendingToggled', handlePendingToggled);
      socket.off('questionSelected', handleQuestionSelected);
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (room && userId) {
      setIsOwner(room.ownerId === userId);
      setIsParticipant(room.participants.includes(userId));
      socket.emit('joinRoom', roomId); // 방에 다시 참여
    }
  }, [room, userId, roomId]);

  useEffect(() => {
    if (isPending) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isPending]);

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleJoin = async () => {
    try {
      await axiosInstance.post(`/api/games/join/${roomId}`, { userInfo });
      alert('방에 접속하였습니다');
      socket.emit('joinRoom', roomId);

      // 방 정보를 다시 가져와서 업데이트
      const response = await axiosInstance.get(`/api/games/${roomId}`);
      setRoom(response.data);
      setIsParticipant(response.data.participants.includes(userId));
    } catch (error) {
      console.error('Error joining room:', error.response?.data || error.message);
    }
  };

  const handleStageChange = (newStage) => {
    setCurrentStage(newStage);
    socket.emit('stageChanged', roomId, newStage);
  };

  const togglePending = async () => {
    try {
      await axiosInstance.post(`/api/rooms/togglePending/${roomId}`);
    } catch (error) {
      console.error('Error toggling pending:', error.response?.data || error.message);
    }
  };

  return (
    <div>
      <div>
        <h2>{room?.roomName}</h2>
        {/* <p>Room ID: {room?._id}</p>
        <p>Current Stage: {currentStage}</p>
        <p>Participants: {room?.participants.length}</p>
        <p>Max Participants: {room?.maxParticipants}</p>
        <p>Owner: {room?.ownerId}</p> */}
         {room?.hintSettings.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>정보</th>
                <th>벌칙</th>
              </tr>
            </thead>
            <tbody>
              {room?.hintSettings.map((setting, index) => (
                <tr key={index}>
                  <td>{setting.infoType}</td>
                  <td>{setting.punishment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* <p>Current User ID: {userId}</p>
        <p>Is Owner: {isOwner ? 'Yes' : 'No'}</p>
        <p>Is Participant: {isParticipant ? 'Yes' : 'No'}</p>
        <p>Is Pending: {isPending ? 'Yes' : 'No'}</p> */}
        <p>참가인원 {room?.currentParticipants}/{room?.maxParticipants}</p>
      </div>
      {!isParticipant && (
        <div>
          <h3>Fill in your info to join the room:</h3>
          {room?.hintSettings.map((setting, index) => (
            <div key={index} className="form-group">
              <label>{setting.infoType}</label>
              <input
                type="text"
                className="form-control"
                name={setting.infoType}
                onChange={handleChange}
                required
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleJoin}>Join Room</button>
        </div>
      )}
      {isParticipant && (
        <div>
          {isOwner ? <Owner roomId={roomId} onStageChange={handleStageChange} currentStage={currentStage}/> : <Player />}
          {currentStage === 0 && <Stage0 />}
          {currentStage === 1 && <Stage1 togglePending={togglePending} isPending={isPending} roomId={roomId} />}
          {currentStage === 2 && <Stage2 isOwner={isOwner} roomId={roomId} onStageChange={handleStageChange} setSelectedQuestionId={setSelectedQuestionId} />}
          {currentStage === 3 && <Stage3 isOwner={isOwner} roomId={roomId} questionId={selectedQuestionId} />}
          {currentStage === 4 && <Stage4 />}
          {currentStage === 5 && <Stage5 />}
          {currentStage === 6 && <Stage6 />}
          {currentStage === 7 && <Stage7 />}
        </div>
      )}
    </div>
  );
}

export default Room;
