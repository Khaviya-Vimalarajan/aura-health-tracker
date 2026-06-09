import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Bot, Sparkles, User, MessageCircleWarning } from 'lucide-react';

export default function CoachDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am Aura Coach, your personal health advisor. I have access to your daily logs. Ask me to analyze your habits, ask for sleep recommendations, or request hydration tips!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e, textOverride = '') => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    
    if (!textOverride) setInput('');
    setLoading(true);
    setError('');

    try {
      const chatHistory = [...messages, userMessage];
      const response = await axios.post('http://localhost:5000/api/coach/chat', {
        messages: chatHistory
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
    } catch (err) {
      console.error(err);
      setError('Aura Coach is taking a break. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Analyze my sleep this week",
    "How can I drink more water?",
    "Give me a wellness challenge",
    "Why was my energy score low?"
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      {/* Background Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Aura AI Coach</h2>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Connected to Logs
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-450' 
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Chat Bubble */}
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-tr-none font-medium'
                  : 'bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-850 text-gray-500 border border-gray-100 dark:border-gray-850 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
                </span>
                Analyzing health records...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/60 p-3 rounded-xl flex items-start gap-2 text-xs">
              <MessageCircleWarning className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-50 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/20">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(null, s)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-500 text-gray-600 dark:text-gray-400 rounded-full shadow-sm transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-850 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="input py-2 px-4 flex-1 text-sm bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border-none rounded-xl"
            placeholder="Ask Aura Coach..."
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
