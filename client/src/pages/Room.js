import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';  // 소켓 인스턴스를 import 합니다.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [hintSettings, setHintSettings] = useState([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userId, setUserId] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/games/${roomId}`);
        setRoom(response.data);
        setHintSettings(response.data.hintSettings);
        setIsParticipant(response.data.participants.includes(userId));
        setIsOwner(response.data.ownerId === userId);
      } catch (error) {
        console.error('Error fetching room:', error.response.data);
      }
    };

    const fetchUserId = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/status');
        if (response.data.loggedIn) {
          setUserId(response.data.user_id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error.response.data);
      }
    };

    fetchUserId();
    fetchRoom();

    socket.on('roomUpdated', (updatedRoom) => {
      if (updatedRoom._id === roomId) {
        setRoom(updatedRoom);
        setIsParticipant(updatedRoom.participants.includes(userId));
        setIsOwner(updatedRoom.ownerId === userId);
      }
    });

    return () => {
      socket.off('roomUpdated');
    };
  }, [roomId, userId]);

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleJoin = async () => {
    try {
      await axiosInstance.post(`/api/games/join/${roomId}`, { userInfo: { ...userInfo } });
      console.log('User joined the room');
      alert('방에 접속하였습니다');
      setIsParticipant(true);  // 상태를 업데이트하여 중복 접속을 방지
      socket.emit('joinRoom', roomId);
    } catch (error) {
      console.error('Error joining room:', error.response.data);
    }
  };

  return (
    <div>
      {room ? (
        <>
          <h2>{room.roomName}</h2>
          <div>
            {isParticipant ? (
              <>
                {isOwner ? (
                  <button className="mt-4 btn btn-success">Play Game</button>
                ) : (
                  <p className="mt-4">Wait until start</p>
                )}
              </>
            ) : (
              <>
                {hintSettings.map((setting, index) => (
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
              </>
            )}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Room;
