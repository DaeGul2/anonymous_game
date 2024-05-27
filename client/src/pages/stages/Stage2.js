import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function Stage2({ roomId }) {
  const [questions, setQuestions] = useState([]);

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
  }, [roomId]);

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
              <td>{question.isFinished ? 'True' : 'False'}</td>
              
              {question.isFinished ? (<p></p>) : <button className="mt-4 btn btn-primary">선택</button>}
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Stage2;
