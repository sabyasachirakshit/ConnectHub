import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import "./App.css";

const socket = io('http://localhost:5000');

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('welcome', (message) => {
      setMessages((prevMessages) => [...prevMessages, { user: 'System', text: message }]);
    });

    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, { user: 'Stranger', text: message }]);
    });

    return () => {
      socket.off('welcome');
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', message);
      setMessages((prevMessages) => [...prevMessages, { user: 'You', text: message }]);
      setMessage('');
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.user === 'You' ? 'sent' : 'received'}`}>
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
