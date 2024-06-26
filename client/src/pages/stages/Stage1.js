import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage1({ roomId }) {
  const [timeLeft, setTimeLeft] = useState(60); // 60초 타이머
  const [text, setText] = useState(' ');
  const [modalIsOpen, setModalIsOpen] = useState(true);
  const textRef = useRef(text);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    
    setIsSent(false);

    const timerId = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev === 1) {
                handleTimeout();
                clearInterval(timerId);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timerId);
}, []);


  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const handleTimeout = async () => {
    if (!isSent) {  // 이미 전송된 경우 handleTimeout을 다시 실행하지 않도록 조건 추가
        await submitQuestion(textRef.current);
        setModalIsOpen(false);
    }
};

  const submitQuestion = async (currentText) => {
    try {
      await axiosInstance.post(`/api/questions/create/${roomId}`, { content: currentText });
      setIsSent(true);
    } catch (error) {
      console.error('Error submitting question:', error.response?.data || error.message);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);

  };

  return (
    <div>
      {!isSent && (<div>
        <h2>Question Lists</h2>
        <Modal isOpen={modalIsOpen} ariaHideApp={false}>
          <h2>Time left: {timeLeft}s</h2>
          <div>
            <label>Ask questions (50 characters max):</label>
            <ul>
              <li>Guarantee that all questions will be anonymous</li>
              <li>Answer has to be <b style={{ color: 'red' }}>Yes</b> or<b style={{ color: 'red' }}> No</b></li>
            </ul>
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              maxLength={50}
              style={{ width: '100%' }}
            />
          </div>
        </Modal>
      </div>)}
      {isSent && (<h2>제출 완료</h2>)}

    </div>
  );
}

export default Stage1;
