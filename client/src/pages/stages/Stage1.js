import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

function Stage1({ togglePending, isPending }) {
  const [timeLeft, setTimeLeft] = useState(10); // 10초 타이머
  const [text, setText] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(true);

  useEffect(() => {
    togglePending(); // Stage1이 마운트될 때 바로 togglePending 호출

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setModalIsOpen(false); // 10초 후 모달 창 닫기
    }
  }, [timeLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.length <= 50) {
      console.log('Submitted text:', text);
      setText('');
    } else {
      alert('Text must be 50 characters or less.');
    }
  };

  return (
    <div>
      <h2>질문 수집 단계</h2>
      <Modal isOpen={modalIsOpen} ariaHideApp={false}>
        <h2>Time left: {timeLeft}s</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Input Text (50 characters max):</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={50}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </Modal>
    </div>
  );
}

export default Stage1;
