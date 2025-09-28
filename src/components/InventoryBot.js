import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import ChatMessage from './chatbot/ChatMessage';
import ChatInput from './chatbot/ChatInput';
import InventoryTable from './inventory/InventoryTable';
import './InventoryBot.css';

const InventoryBot = ({ currentPage, onPageChange }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your intelligent inventory management assistant. I can automatically add items to your inventory, record waste and donations, update quantities, and provide smart recommendations. I also know about local food bank needs and can suggest specific donations! Try asking "Who do I donate chicken to?" or "What should I do with my expiring food?"',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInventory, setShowInventory] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiActions, setAiActions] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [missingInfo, setMissingInfo] = useState([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  // Only scroll to bottom when bot is typing or when a bot message is added, and user is near bottom
  useEffect(() => {
    if (shouldAutoScroll && (isTyping || (messages.length > 0 && messages[messages.length - 1].type === 'bot'))) {
      scrollToBottom();
    }
  }, [messages, isTyping, shouldAutoScroll]);

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
      // Check if the message is asking for inventory recommendations or donation advice
      // But NOT if it's a statement about already completed donations
      const isDonationStatement = message.toLowerCase().includes('i just donated') || 
                                 message.toLowerCase().includes('i donated') ||
                                 message.toLowerCase().includes('gave away') ||
                                 message.toLowerCase().includes('donated to');
      
      if ((message.toLowerCase().includes('recommendation') || 
          message.toLowerCase().includes('suggest') ||
          message.toLowerCase().includes('donation') ||
          message.toLowerCase().includes('donate') ||
          message.toLowerCase().includes('waste') ||
          message.toLowerCase().includes('optimize') ||
          message.toLowerCase().includes('who do i') ||
          message.toLowerCase().includes('where should i') ||
          message.toLowerCase().includes('food bank') ||
          message.toLowerCase().includes('expiring') ||
          message.toLowerCase().includes('expires')) && !isDonationStatement) {
        
        // Get AI recommendations with inventory context
        const response = await fetch("http://127.0.0.1:5000/api/inventory/ai-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: message
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setAiRecommendations(result);
          
          // Format recommendations for display
          let botResponse = "Here are my recommendations based on your current inventory:\n\n";
          
          if (result.recommendations && result.recommendations.length > 0) {
            botResponse += "📋 **Recommendations:**\n";
            result.recommendations.forEach((rec, index) => {
              botResponse += `${index + 1}. **${rec.title}** (${rec.priority} priority)\n`;
              botResponse += `   ${rec.description}\n`;
              botResponse += `   Action: ${rec.action}\n\n`;
            });
          }
          
          if (result.donation_opportunities && result.donation_opportunities.length > 0) {
            botResponse += "🤝 **Donation Opportunities:**\n";
            result.donation_opportunities.forEach((donation, index) => {
              botResponse += `${index + 1}. **${donation.item}** - ${donation.quantity}\n`;
              botResponse += `   Reason: ${donation.reason}\n`;
              if (donation.food_bank_match) {
                botResponse += `   🎯 **Perfect Match**: ${donation.food_bank_match}\n`;
                if (donation.priority_level) {
                  const priorityText = {4: "CRITICAL", 3: "HIGH", 2: "MEDIUM", 1: "LOW"}[donation.priority_level] || "UNKNOWN";
                  botResponse += `   ⚡ **Priority Level**: ${priorityText}\n`;
                }
                if (donation.contact_info) {
                  botResponse += `   📞 **Contact**: ${donation.contact_info}\n`;
                }
                if (donation.match_reasoning) {
                  botResponse += `   💡 **Why this match**: ${donation.match_reasoning}\n`;
                }
              } else {
                botResponse += `   Suggested recipient: ${donation.suggested_recipient}\n`;
              }
              botResponse += "\n";
            });
          }
          
          if (result.alerts && result.alerts.length > 0) {
            botResponse += "⚠️ **Alerts:**\n";
            result.alerts.forEach((alert, index) => {
              botResponse += `${index + 1}. **${alert.item}**: ${alert.message}\n`;
            });
          }
          
          if (result.raw_analysis) {
            botResponse += "\n" + result.raw_analysis;
          }
          
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: botResponse,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botMessage]);
        } else {
          throw new Error("Failed to get recommendations");
        }
      } else {
        // Regular chat response
        const response = await fetch("http://127.0.0.1:5000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            context: {}
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
        
        // Handle missing information requests
        if (result.needs_info) {
          setPendingAction(result.pending_action);
          setMissingInfo(result.missing_info || []);
          setShowInfoForm(true);
          
          // Show questions in chat
          if (result.questions && result.questions.length > 0) {
            const questionsMessage = {
              id: Date.now() + 2,
              type: 'bot',
              content: `**Please provide the following information:**\n${result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, questionsMessage]);
          }
        }
        
        // Handle automatic actions if they were executed
        if (result.has_actions && result.actions_executed) {
          // Refresh inventory to show changes
          setAiActions(prev => [...prev, { type: 'refresh', timestamp: Date.now() }]);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
          
          // Show action results in chat
          const actionResults = result.actions_executed.map(action => {
            const status = action.success ? '✅' : '❌';
            return `${status} ${action.message}`;
          }).join('\n');
          
          if (actionResults) {
            const actionMessage = {
              id: Date.now() + 2,
              type: 'bot',
              content: `**Actions Executed:**\n${actionResults}`,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, actionMessage]);
          }
        }
      }
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

  const handleAiAction = async (actionType, actionData) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/inventory/ai-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action_type: actionType,
          action_data: actionData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: `✅ ${result.message}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Refresh inventory if needed
        if (actionType === 'add_item' || actionType === 'record_transaction') {
          // Trigger inventory refresh by updating a state that the InventoryTable can watch
          setAiActions(prev => [...prev, { type: 'refresh', timestamp: Date.now() }]);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        }
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing AI action:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      throw error;
    }
  };

  const handleCompleteAction = async (userInfo) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/complete-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pending_action: pendingAction,
          user_info: userInfo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: `✅ ${result.result.message}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Refresh inventory
        setAiActions(prev => [...prev, { type: 'refresh', timestamp: Date.now() }]);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        
        // Clear pending action
        setPendingAction(null);
        setShowInfoForm(false);
        setMissingInfo([]);
        
      } else {
        const errorData = await response.json();
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `❌ Error: ${errorData.error}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error completing action:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: `❌ Error completing action: ${error.message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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

  const handleQuickAction = async (action) => {
    if (action === 'Add Common Items') {
      // AI will suggest and add common restaurant items
      handleSendMessage('Add common restaurant inventory items like chicken, rice, vegetables, and spices');
    } else if (action === 'Record Waste') {
      // AI will help identify and record waste
      handleSendMessage('Help me identify and record any food waste from today');
    } else if (action === 'Find Donations') {
      // AI will find donation opportunities
      try {
        const result = await handleAiAction('suggest_donation', {});
        if (result.donation_candidates && result.donation_candidates.length > 0) {
          const donationMessage = {
            id: Date.now(),
            type: 'bot',
            content: `🤝 **Donation Opportunities Found:**\n\n${result.ai_analysis}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, donationMessage]);
        }
      } catch (error) {
        // Error already handled in handleAiAction
      }
    } else {
    const quickMessages = {
        'Check Inventory': 'Show me my current inventory levels and status',
        'Get Recommendations': 'Give me recommendations for optimizing my inventory',
        'Waste Analysis': 'Analyze my waste patterns and suggest improvements',
        'Cost Optimization': 'How can I reduce my inventory costs?'
    };
    
    handleSendMessage(quickMessages[action]);
    }
  };

  return (
    <div className="inventory-bot">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Inventory Management</h1>
            <p className="page-description">
              Your AI-powered inventory management system. Track ingredients, reduce waste, optimize costs, and get donation recommendations.
            </p>
            <div className="header-actions">
              <button 
                className={`toggle-btn ${showInventory ? 'active' : ''}`}
                onClick={() => setShowInventory(!showInventory)}
              >
                {showInventory ? 'Hide Inventory' : 'Show Inventory'}
              </button>
            </div>
          </div>

          <div className="chat-container">
            <div className="chat-main">
              <div className="chat-header">
                <div className="bot-info">
                  <div className="bot-avatar">🤖</div>
                  <div className="bot-details">
                    <h3>Inventory Assistant</h3>
                    <span className="bot-status">Online</span>
                  </div>
                </div>
                
              </div>

              <div 
                className="chat-messages" 
                ref={chatContainerRef}
                onScroll={handleScroll}
              >
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
                placeholder="Try: 'Who do I donate chicken to?' or 'Add 50 pounds of chicken breast' or 'What should I do with my expiring food?'..."
              />
            </div>
          </div>

          {showInventory && (
            <InventoryTable aiActions={aiActions} onAiAction={handleAiAction} />
          )}
          
          {showInfoForm && (
            <InfoForm 
              missingInfo={missingInfo}
              onComplete={handleCompleteAction}
              onCancel={() => {
                setShowInfoForm(false);
                setPendingAction(null);
                setMissingInfo([]);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// Info Form Component for collecting missing information
const InfoForm = ({ missingInfo, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    cost_per_unit: '',
    expiration_date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only include non-empty values
    const userInfo = {};
    if (formData.cost_per_unit) {
      userInfo.cost_per_unit = formData.cost_per_unit;
    }
    if (formData.expiration_date) {
      userInfo.expiration_date = formData.expiration_date;
    }
    
    onComplete(userInfo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Additional Information Required</h3>
        <form onSubmit={handleSubmit}>
          {missingInfo.includes('cost_per_unit') && (
            <div className="form-row">
              <label>Cost per unit ($):</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter cost per unit"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                required
              />
            </div>
          )}
          
          {missingInfo.includes('expiration_date') && (
            <div className="form-row">
              <label>Expiration date (optional):</label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
              />
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">Complete Action</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryBot;
