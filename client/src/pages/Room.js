import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Room() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [hintSettings, setHintSettings] = useState([]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/games/${roomId}`);
        setRoom(response.data);
        setHintSettings(response.data.hintSettings);
      } catch (error) {
        console.error('Error fetching room:', error.response.data);
      }
    };
    fetchRoom();
  }, [roomId]);

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleJoin = async () => {
    try {
      await axios.post(`http://localhost:8080/api/games/join/${roomId}`, { userInfo });
      console.log('User joined the room');
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
            {hintSettings.map((setting, index) => (
              <div key={index} className="form-group">
                <label>{setting.infoType}</label>
                <input type="text" className="form-control" name={setting.infoType} onChange={handleChange} required />
              </div>
            ))}
            <button className="btn btn-primary" onClick={handleJoin}>Join Room</button>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Room;
