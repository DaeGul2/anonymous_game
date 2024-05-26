import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import Modal from 'react-modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

Modal.setAppElement('#root');

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [hintSettings, setHintSettings] = useState([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userId, setUserId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const timer = useRef(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/games/${roomId}`);
        setRoom(response.data);
        setHintSettings(response.data.hintSettings);
        setIsParticipant(response.data.participants.includes(userId));
        setIsOwner(response.data.ownerId === userId);

        // 소켓을 특정 방에 가입시킴
        socket.emit('joinRoom', roomId);

        // Check if game is already started
        if (localStorage.getItem('gameStarted') === 'true') {
          setShowModal(true);
          const storedTimeLeft = localStorage.getItem('timeLeft');
          if (storedTimeLeft) {
            setTimeLeft(parseInt(storedTimeLeft, 10));
          }
          startTimer();
        }
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

    fetchUserId().then(() => {
      fetchRoom(userId);
    });

    socket.on('roomUpdated', (updatedRoom) => {
      if (updatedRoom._id === roomId) {
        setRoom(updatedRoom);
        setIsParticipant(updatedRoom.participants.includes(userId));
        setIsOwner(updatedRoom.ownerId === userId);
      }
    });

    socket.on('gameStarted', () => {
      localStorage.setItem('gameStarted', 'true');
      setShowModal(true);
      startTimer();
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('gameStarted');
      socket.emit('leaveRoom', roomId); // 방 떠날 때 소켓에서 방 나가기
      clearInterval(timer.current);
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('timeLeft');
    };
  }, [roomId, userId]);

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleJoin = async () => {
    try {
      setIsParticipant(true); // 상태를 즉시 변경하여 중복 클릭 방지
      await axiosInstance.post(`/api/games/join/${roomId}`, { userInfo: { ...userInfo } });
      console.log('User joined the room');
      alert('방에 접속하였습니다');
      socket.emit('joinRoom', roomId); // 방에 가입 요청
      navigate(`/room/${roomId}`); // 방 입장 경로로 이동
    } catch (error) {
      console.error('Error joining room:', error.response.data);
      setIsParticipant(false); // 에러 발생 시 상태 원복
    }
  };

  const startGame = async () => {
    try {
      await axiosInstance.post(`/api/rooms/start/${roomId}`);
      socket.emit('startGame', roomId);
    } catch (error) {
      console.error('Error starting game:', error.response.data);
    }
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleSubmitQuestion = async () => {
    try {
      await axiosInstance.post(`/api/questions/create/${roomId}`, { content: question });
      alert('질문이 제출되었습니다');
      setShowModal(false);
      clearInterval(timer.current);
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('timeLeft');
    } catch (error) {
      console.error('Error submitting question:', error.response.data);
    }
  };

  const startTimer = () => {
    timer.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = prev - 1;
        localStorage.setItem('timeLeft', newTimeLeft);
        if (newTimeLeft <= 0) {
          clearInterval(timer.current);
          handleSubmitQuestion();
          return 0;
        }
        return newTimeLeft;
      });
    }, 1000);
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
                  <button className="mt-4 btn btn-success" onClick={startGame}>Play Game</button>
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

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="Question Modal"
      >
        <h2>Submit your question</h2>
        <textarea
          className="form-control"
          value={question}
          onChange={handleQuestionChange}
          placeholder="Write your question here..."
        />
        <p>{`Time left: ${Math.floor(timeLeft / 60)}:${timeLeft % 60}`}</p>
        <button className="btn btn-primary" onClick={handleSubmitQuestion}>Submit</button>
      </Modal>
    </div>
  );
}

export default Room;
