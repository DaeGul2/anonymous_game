import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Dynamically load Google Fonts
const loadGoogleFonts = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

loadGoogleFonts();

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);