import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage1({ togglePending, roomId }) {
  const [timeLeft, setTimeLeft] = useState(10); // 10초 타이머
  const [text, setText] = useState(' ');
  const [modalIsOpen, setModalIsOpen] = useState(true);
  

  useEffect(() => {
    togglePending(); // Stage1이 마운트될 때 바로 togglePending 호출

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          handleTimeout(); // 타이머가 끝났을 때 호출
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const handleTimeout = async () => {
    console.log("텍스트 : ", text);
    await submitQuestion(text);
    setModalIsOpen(false);
  };

  const submitQuestion = async () => {
    try {
      await axiosInstance.post(`/api/questions/create/${roomId}`, { content: text });
      setText('');
    } catch (error) {
      console.error('Error submitting question:', error.response?.data || error.message);
    }
  };

  const handleTextChange = (e) => {
    console.log("Input Text: ", e.target.value);
    setText(e.target.value);
  };

  return (
    <div>
      <h2>질문 수집 단계</h2>
      <Modal isOpen={modalIsOpen} ariaHideApp={false}>
        <h2>Time left: {timeLeft}s</h2>
        <div>
          <label>Input Text (50 characters max):</label>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            maxLength={50}
          />
        </div>
      </Modal>
    </div>
  );
}

export default Stage1;
