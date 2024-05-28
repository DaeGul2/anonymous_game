import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import socket from '../../socket';
import { Table, Button, Form, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage2({ roomId, isOwner, onStageChange, setSelectedQuestionId }) {
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
      setTimeLeft(30);
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
    setSelectedQuestionId(selectedQuestion._id); // questionId를 설정
    onStageChange(3); // Stage3로 이동
    socket.emit('stageChanged', roomId, 3); // 모든 사용자에게 Stage3로 변경 알림
    socket.emit('questionSelected', roomId, selectedQuestion._id, isOwner); // 선택된 질문 및 isOwner 정보 전송
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
    <div className="container mt-4">
      <Card className="mb-4">
        <Card.Header as="h2" className="text-center">
          Choose Question
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr key={question._id}>
                  <td>{index + 1}</td>
                  <td>{question.content}</td>
                  <td className="text-center">
                    {question.isFinished ? (
                      <FontAwesomeIcon icon={solidHeart} className="text-muted" />
                    ) : (
                      isOwner && (
                        <Button variant="link" onClick={() => handleSelectQuestion(question)}>
                          <FontAwesomeIcon icon={regularHeart} className="text-danger" />
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal isOpen={modalIsOpen} ariaHideApp={false} className="modal-dialog-centered">
        <Card>
          <Card.Header>
            <h2>Time left: {timeLeft}s</h2>
          </Card.Header>
          <Card.Body>
            <h3>question: {selectedQuestion?.content}</h3>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Yes/No</Form.Label>
                <Form.Select value={response} onChange={(e) => setResponse(Number(e.target.value))}>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Explanation(not necessary)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </Form.Group>
              <Button variant="secondary" onClick={() => setModalIsOpen(false)}>
                Close
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Modal>
    </div>
  );
}

export default Stage2;
