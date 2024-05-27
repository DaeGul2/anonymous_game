import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import Modal from 'react-modal';
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
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/games/${roomId}`);
        setRoom(response.data);
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
        setIsParticipant(updatedRoom.participants.includes(userId));
      }
    };

    const handleStageChanged = (stage) => {
      setRoom((prevRoom) => ({ ...prevRoom, currentStage: stage }));
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('stageChanged', handleStageChanged);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('stageChanged', handleStageChanged);
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (room && userId) {
      setIsOwner(room.ownerId === userId);
      setIsParticipant(room.participants.includes(userId));
    }
  }, [room, userId]);

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
    setRoom((prevRoom) => ({ ...prevRoom, currentStage: newStage }));
  };

  return (
    <div>
      <div>
        <h2>{room?.roomName}</h2>
        <p>Room ID: {room?._id}</p>
        <p>Current Stage: {room?.currentStage}</p>
        <p>Participants: {room?.participants.length}</p>
        <p>Max Participants: {room?.maxParticipants}</p>
        <p>Owner: {room?.ownerId}</p>
        <p>Hint Settings: {JSON.stringify(room?.hintSettings)}</p>
        <p>Current User ID: {userId}</p>
        <p>Is Owner: {isOwner ? 'Yes' : 'No'}</p>
        <p>Is Participant: {isParticipant ? 'Yes' : 'No'}</p>
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
          {isOwner ? <Owner roomId={roomId} onStageChange={handleStageChange} /> : <Player />}
          {room.currentStage === 0 && <Stage0 />}
          {room.currentStage === 1 && <Stage1 />}
          {room.currentStage === 2 && <Stage2 />}
          {room.currentStage === 3 && <Stage3 />}
          {room.currentStage === 4 && <Stage4 />}
          {room.currentStage === 5 && <Stage5 />}
          {room.currentStage === 6 && <Stage6 />}
          {room.currentStage === 7 && <Stage7 />}
        </div>
      )}
    </div>
  );
}

export default Room;
