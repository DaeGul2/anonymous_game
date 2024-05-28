import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../../socket';
import Modal from 'react-modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage3({ roomId, isOwner, questionId, hintSettings }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [userInfos, setUserInfos] = useState([]);
  const [creatorInfo, setCreatorInfo] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfoType, setSelectedInfoType] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axiosInstance.get(`/api/answers/${questionId}`);
        setQuestion(response.data);
        setAnswers(response.data.answers);
      } catch (error) {
        console.error('Error fetching question:', error.response?.data || error.message);
      }
    };

    fetchQuestion();

    socket.on('revealResults', async (questionId) => {
      try {
        const response = await axiosInstance.get(`/api/answers/${questionId}`);
        console.log(response.data);
        setQuestion(response.data);
        setAnswers(response.data.answers);
      } catch (error) {
        console.error('Error fetching answers:', error.response?.data || error.message);
      }
    });

    return () => {
      socket.off('revealResults');
    };
  }, [questionId]);

  const handleRevealResults = async () => {
    try {
      const response = await axiosInstance.get(`/api/answers/${questionId}`);
      setQuestion(response.data);
      setAnswers(response.data.answers);
      socket.emit('revealResults', questionId); // 결과 공개 이벤트 전송
    } catch (error) {
      console.error('Error revealing results:', error.response?.data || error.message);
    }
  };

  const handleShowUserInfos = async (infoType) => {
    try {
      const response = await axiosInstance.get(`/api/questions/getUserInfosForQuestion/${roomId}/${questionId}/${infoType}`);
      const { userInfos, creatorInfo } = response.data;
      const userInfosWithAnswers = userInfos.map((info) => {
        const answer = answers.find(answer => answer.userId === info.userId);
        return {
          ...info,
          response: answer ? (answer.response === 1 ? 'Yes' : 'No') : 'No response',
          explanation: answer ? answer.explanation : 'No explanation'
        };
      });
      setUserInfos(userInfosWithAnswers);
      setCreatorInfo(creatorInfo);
      setSelectedInfoType(infoType);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching user infos:', error.response?.data || error.message);
    }
  };

  return (
    <div>
      {isOwner ? (
        <div>
          <h3>질문: {question?.content}</h3>
          <button className="btn btn-primary" onClick={handleRevealResults}>결과 공개</button>
        </div>
      ) : (
        <div>
          <h2>질문: {question?.content}</h2>
        </div>
      )}
      {answers.length > 0 && (
        <div>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>답변</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer, index) => (
                <tr key={index}>
                  <td></td>
                  <td>{answer.response === 1 ? 'Yes' : 'No'}</td>
                  <td>{answer.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hintSettings?.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>정보</th>
              <th>벌칙</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hintSettings.map((setting, index) => (
              <tr key={index}>
                <td>{setting.infoType}</td>
                <td>{setting.punishment}</td>
                <td>
                  <button className='btn btn-success' onClick={() => handleShowUserInfos(setting.infoType)}>수행하고 정보공개</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} ariaHideApp={false}>
        <h1>Question : {question?.content}</h1>
        <h2>who ask this question?
          <p>{selectedInfoType} : {creatorInfo.infoValue}</p></h2>

        <table className="table">
          <thead>
            <tr>

              <th>{selectedInfoType}</th>
              <th>Response</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            {userInfos.map((info, index) => (
              <tr key={index}>

                <td>{info.infoValue}</td>
                <td>{info.response}</td>
                <td>{info.explanation}</td>
              </tr>
            ))}





          </tbody>
        </table>
        <button onClick={() => setIsModalOpen(false)} className="btn btn-primary">닫기</button>
      </Modal>
    </div>
  );
}

export default Stage3;
