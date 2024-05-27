import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import socket from '../../socket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage2({ roomId, isOwner }) {
  const [questions, setQuestions] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [response, setResponse] = useState(1); // Default to 1 for Yes
  const [explanation, setExplanation] = useState('');

  const responseRef = useRef(response);
  const explanationRef = useRef(explanation);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axiosInstance.get(`/api/questions/${roomId}`);
        setQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error.response?.data || error.message);
      }
    };

    fetchQuestions();

    socket.on('openAnswerModal', (question) => {
      setSelectedQuestion(question);
      setModalIsOpen(true);
      setTimeLeft(20);
    });

    return () => {
      socket.off('openAnswerModal');
    };
  }, [roomId]);

  useEffect(() => {
    if (modalIsOpen) {
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
    }
  }, [modalIsOpen]);

  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => {
    explanationRef.current = explanation;
  }, [explanation]);

  const handleTimeout = async () => {
    await submitAnswer();
    setModalIsOpen(false);
  };

  const submitAnswer = async () => {
    try {
      await axiosInstance.post(`/api/answers/add/${selectedQuestion._id}`, {
        response: responseRef.current,
        explanation: explanationRef.current,
      });
    } catch (error) {
      console.error('Error submitting answer:', error.response?.data || error.message);
    }
  };

  const handleSelectQuestion = (question) => {
    socket.emit('openAnswerModal', question);
  };

  return (
    <div>
      <h2>질문 선택단계</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>내용</th>
            <th>Open</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => (
            <tr key={question._id}>
              <td>{index + 1}</td>
              <td>{question.content}</td>
              <td>{question.isFinished ? '답변완료' : '답변미완료'}</td>
              {isOwner && !question.isFinished && (
                <td>
                  <button className="mt-4 btn btn-primary" onClick={() => handleSelectQuestion(question)}>
                    선택
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={modalIsOpen} ariaHideApp={false}>
        <h2>Time left: {timeLeft}s</h2>
        <div>
          <label>Yes/No</label>
          <select value={response} onChange={(e) => setResponse(Number(e.target.value))}>
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </select>
        </div>
        <div>
          <label>Explanation</label>
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

export default Stage2;
