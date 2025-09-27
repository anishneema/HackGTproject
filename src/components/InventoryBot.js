import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import ChatMessage from './chatbot/ChatMessage';
import ChatInput from './chatbot/ChatInput';
import IngredientTracker from './chatbot/IngredientTracker';
import './InventoryBot.css';

const InventoryBot = ({ currentPage, onPageChange }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Inventory Assistant. I can help you manage your ingredients, track inventory levels, and provide insights about your food usage. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call OpenAI API for intelligent response
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          context: {
            // Add any relevant context here
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const result = await response.json();
      const botResponse = result.response || generateBotResponse(message);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Fallback to local response generation
      const botResponse = generateBotResponse(message);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Inventory management responses
    if (message.includes('inventory') || message.includes('stock')) {
      return "I can help you track your inventory! Here are some common inventory management tasks:\n\n• Check current stock levels\n• Set reorder points for ingredients\n• Track expiration dates\n• Generate shopping lists\n• Analyze usage patterns\n\nWhat specific ingredient or task would you like to focus on?";
    }
    
    if (message.includes('expir') || message.includes('spoiled')) {
      return "Managing expiration dates is crucial for reducing waste! I can help you:\n\n• Track ingredients approaching expiration\n• Suggest recipes to use expiring items\n• Set up alerts for items expiring soon\n• Recommend donation opportunities for excess items\n\nWould you like me to check what items are expiring in the next few days?";
    }
    
    if (message.includes('recipe') || message.includes('cook')) {
      return "I'd love to help you create recipes from your available ingredients! I can:\n\n• Suggest recipes based on what you have\n• Help you use up ingredients before they expire\n• Recommend substitutions for missing items\n• Calculate portion sizes and costs\n\nWhat ingredients do you currently have that you'd like to use?";
    }
    
    if (message.includes('waste') || message.includes('throw away')) {
      return "Reducing food waste is one of my specialties! Here's how I can help:\n\n• Track waste patterns and identify problem areas\n• Suggest portion adjustments\n• Recommend donation opportunities\n• Provide storage tips to extend shelf life\n• Calculate the financial impact of waste\n\nWhat type of waste are you seeing most frequently?";
    }
    
    if (message.includes('cost') || message.includes('budget') || message.includes('price')) {
      return "I can help you manage food costs and budgeting:\n\n• Track ingredient costs over time\n• Calculate cost per serving\n• Identify the most expensive waste items\n• Suggest cost-effective alternatives\n• Monitor seasonal price changes\n\nWould you like me to analyze your current cost trends?";
    }
    
    if (message.includes('donate') || message.includes('charity')) {
      return "Great thinking! Donating excess food helps your community and reduces waste. I can:\n\n• Find local donation hubs near you\n• Suggest what items are best for donation\n• Help you track tax deductions\n• Connect you with food rescue organizations\n\nWould you like me to show you nearby donation opportunities?";
    }
    
    // Default responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hi there! I'm here to help you manage your restaurant's inventory more efficiently. Whether you need help tracking ingredients, reducing waste, or optimizing costs, I'm ready to assist. What's on your mind today?";
    }
    
    if (message.includes('help')) {
      return "I'm your Inventory Assistant! Here's what I can help you with:\n\n📦 **Inventory Management**\n• Track stock levels and expiration dates\n• Set up reorder alerts\n• Generate shopping lists\n\n🍳 **Recipe Planning**\n• Suggest recipes from available ingredients\n• Help use up expiring items\n• Recommend substitutions\n\n💰 **Cost Optimization**\n• Analyze spending patterns\n• Identify waste costs\n• Suggest budget improvements\n\n🤝 **Waste Reduction**\n• Track waste patterns\n• Find donation opportunities\n• Provide storage tips\n\nWhat would you like to explore first?";
    }
    
    // Fallback response
    return "I understand you're asking about: \"" + userMessage + "\". I'm here to help with inventory management, recipe suggestions, waste reduction, and cost optimization. Could you be more specific about what you'd like assistance with? For example, you could ask about specific ingredients, inventory levels, or waste reduction strategies.";
  };

  const handleQuickAction = (action) => {
    const quickMessages = {
      'Check Inventory': 'Can you show me my current inventory levels?',
      'Expiring Soon': 'What ingredients are expiring in the next few days?',
      'Recipe Ideas': 'What recipes can I make with my current ingredients?',
      'Waste Report': 'Show me my waste patterns for this week',
      'Cost Analysis': 'Give me a cost analysis of my food waste'
    };
    
    handleSendMessage(quickMessages[action]);
  };

  return (
    <div className="inventory-bot">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Inventory Assistant</h1>
            <p className="page-description">
              Your AI-powered inventory management assistant. Track ingredients, reduce waste, and optimize costs.
            </p>
          </div>

          <div className="chat-container">
            <div className="chat-sidebar">
              <IngredientTracker />
            </div>
            
            <div className="chat-main">
              <div className="chat-header">
                <div className="bot-info">
                  <div className="bot-avatar">🤖</div>
                  <div className="bot-details">
                    <h3>Inventory Assistant</h3>
                    <span className="bot-status">Online</span>
                  </div>
                </div>
                
                <div className="quick-actions">
                  <button 
                    className="quick-action-btn"
                    onClick={() => handleQuickAction('Check Inventory')}
                  >
                    Check Inventory
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => handleQuickAction('Expiring Soon')}
                  >
                    Expiring Soon
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => handleQuickAction('Recipe Ideas')}
                  >
                    Recipe Ideas
                  </button>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                placeholder="Ask me about inventory, recipes, waste reduction, or costs..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryBot;
