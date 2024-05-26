import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pagination from 'react-js-pagination';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Home() {
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axiosInstance.get(`/api/games?page=${page}`);
        setRooms(response.data.rooms);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching rooms:', error.response.data);
      }
    };

    fetchRooms();
  }, [page]);

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom) return;
    try {
      const response = await axiosInstance.post(`/api/games/isAvailable/${selectedRoom}`, { password });
      if (response.status === 200) {
        navigate(`/room/${selectedRoom}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert(error.response.data.message);
      } else {
        console.error('Error joining room:', error.response.data);
      }
    }
  };

  return (
    <div>
      <h2>현재 진행 중인 게임들</h2>
      <div className="row">
        {rooms.map(room => (
          <div key={room._id} className="col-md-4">
            <div className="mb-4 card">
              <div className="card-body">
                <h5 className="card-title">{room.roomName}</h5>
                <p className="card-text">{room.currentParticipants} / {room.maxParticipants}</p>
                <button className="btn btn-primary" onClick={() => setSelectedRoom(room._id)}>입장</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        activePage={page}
        itemsCountPerPage={10}
        totalItemsCount={totalPages * 10}
        pageRangeDisplayed={5}
        onChange={handlePageChange}
        itemClass="page-item"
        linkClass="page-link"
      />

      {selectedRoom && (
        <div className="modal show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">방 입장</h5>
                <button type="button" className="close" onClick={() => setSelectedRoom(null)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRoom(null)}>취소</button>
                <button type="button" className="btn btn-primary" onClick={handleJoinRoom}>입장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
