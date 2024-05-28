import React, { useState, useEffect } from 'react';
import { Collapse, Card, Button, Form } from 'react-bootstrap';
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
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/games/${roomId}`);
        setRoom(response.data);
        setCurrentStage(response.data.currentStage);
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
      }
    };

    const handleStageChanged = (stage) => {
      setCurrentStage(stage);
    };

    const handleGameStarted = (stage) => {
      setCurrentStage(stage);
    };

    

    const handleQuestionSelected = (roomId, questionId, isOwner) => {
      setSelectedQuestionId(questionId);
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('stageChanged', handleStageChanged);
    socket.on('gameStarted', handleGameStarted);
    socket.on('questionSelected', handleQuestionSelected);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('stageChanged', handleStageChanged);
      socket.off('gameStarted', handleGameStarted);
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



  const [open, setOpen] = useState(false);

  return (
    <div className="container mt-4">
      <Card className="mb-4">
        <Card.Header as="h2" className="text-center">
          {room?.roomName}
        </Card.Header>
        <Card.Body>
          <p className="text-muted">참가인원 {room?.currentParticipants}/{room?.maxParticipants}</p>

          <Button
            onClick={() => setOpen(!open)}
            aria-controls="hint-settings-collapse"
            aria-expanded={open}
            variant="primary"
            className="mb-3"
          >
            {open ? 'close' : 'open'}
          </Button>

          <Collapse in={open}>
            <div id="hint-settings-collapse">
              {room?.hintSettings.length > 0 && (
                <table className="table table-striped">
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
            </div>
          </Collapse>
        </Card.Body>
      </Card>

      {!isParticipant && (
        <Card className="mb-4">
          <Card.Header as="h3">Fill in your info to join the room:</Card.Header>
          <Card.Body>
            <Form>
              {room?.hintSettings.map((setting, index) => (
                <Form.Group key={index} className="mb-3">
                  <Form.Label>{setting.infoType}</Form.Label>
                  <Form.Control
                    type="text"
                    name={setting.infoType}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              ))}
              <Button className="btn btn-primary" onClick={handleJoin}>Join Room</Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {isParticipant && (
        <Card className="mb-4">
          <Card.Body>
            {isOwner ? (
              <Owner roomId={roomId} onStageChange={handleStageChange} currentStage={currentStage} />
            ) : (
              <Player />
            )}

            {currentStage === 0 && <Stage0 />}
            {currentStage === 1 && <Stage1 roomId={roomId} />}
            {currentStage === 2 && (
              <Stage2
                isOwner={isOwner}
                roomId={roomId}
                onStageChange={handleStageChange}
                setSelectedQuestionId={setSelectedQuestionId}
              />
            )}
            {currentStage === 3 && (
              <Stage3
                isOwner={isOwner}
                roomId={roomId}
                questionId={selectedQuestionId}
                hintSettings={room?.hintSettings}
              />
            )}
            {currentStage === 4 && <Stage4 />}
            {currentStage === 5 && <Stage5 />}
            {currentStage === 6 && <Stage6 />}
            {currentStage === 7 && <Stage7 />}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Room;
