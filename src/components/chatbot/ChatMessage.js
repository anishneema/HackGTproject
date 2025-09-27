import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatContent = (content) => {
    // Convert line breaks to <br> tags and handle bullet points
    return content.split('\n').map((line, index) => {
      if (line.trim().startsWith('•')) {
        return (
          <div key={index} className="bullet-point">
            {line.replace('•', '').trim()}
          </div>
        );
      }
      return (
        <div key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </div>
      );
    });
  };

  return (
    <div className={`message ${message.type}`}>
      <div className="message-avatar">
        {message.type === 'bot' ? '🤖' : '👤'}
      </div>
      <div className="message-content">
        <div className="message-text">
          {formatContent(message.content)}
        </div>
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
