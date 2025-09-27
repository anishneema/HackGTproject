import React, { useState, useRef } from 'react';
import './ChatInput.css';

const ChatInput = ({ value, onChange, onSend, placeholder }) => {
  const textareaRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
      // Clear the textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="chat-input"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="send-button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div className="input-hint">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};

export default ChatInput;
