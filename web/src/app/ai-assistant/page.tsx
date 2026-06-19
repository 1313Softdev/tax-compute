'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  Bot, 
  Send, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { token, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message on mount
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        text: "Namaste! I am your AI Tax Assistant. I can analyze your income details, deductions u/s Chapter VI-A, and recommend the most optimal tax saving plan under the Indian Income Tax Act.\n\nAsk me anything or select a prompt below!",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    
    const activeQuery = textOverride || query;
    if (!activeQuery.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: activeQuery,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: activeQuery })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.response,
          timestamp: new Date()
        }]);
      } else {
        const errData = await res.json();
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: errData.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'Failed to connect to the AI Assistant service.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    { label: 'How can I save more tax?', icon: TrendingUp },
    { label: 'Should I choose Old or New Regime?', icon: HelpCircle },
    { label: 'What are the benefits of Section 80C?', icon: FileCheck }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-12rem)] min-h-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* CHAT HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">AI Tax Planner</h3>
              <p className="text-3xs text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Gemini CA Brain active
              </p>
            </div>
          </div>
        </div>

        {/* CHAT SCREEN VIEWPORT */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/60 whitespace-pre-line'
                }`}>
                  {msg.text}
                  <div className={`text-4xs text-right mt-2 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* STARTER PROMPTS PILLS */}
        {messages.length === 1 && !loading && (
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-center">
            {starterPrompts.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(undefined, prompt.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full text-3xs font-bold transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  {prompt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* CHAT INPUT FORM */}
        <form 
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Ask AI Tax Advisor (e.g. How can I optimize my 80D?)..."
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-5.5 h-5.5" />
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
}
