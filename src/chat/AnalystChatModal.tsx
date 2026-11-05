/**
 * BritConnect AI Analyst Chat Drawer
 * Conversational Assistant strictly grounded in pre-computed facts
 */
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const SAMPLE_PROMPTS = [
  'Why are Rolling Monthly customers churning at higher rates?',
  'What is the total monthly revenue exposure in High and Critical risk bands?',
  'Which customer segment has the highest financial vulnerability?',
  'How do network outages interact with customer satisfaction?',
];

export const AnalystChatModal: React.FC = () => {
  const isChatOpen = useAppStore((s) => s.isChatOpen);
  const toggleChat = useAppStore((s) => s.toggleChat);
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const isChatLoading = useAppStore((s) => s.isChatLoading);
  const appSettings = useAppStore((s) => s.appSettings);

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  if (!isChatOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isChatLoading) return;
    const query = inputVal.trim();
    setInputVal('');
    sendChatMessage(query);
  };

  const handleSampleClick = (prompt: string) => {
    if (isChatLoading) return;
    sendChatMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFDF7] border-l border-[#E6DFC8] h-full flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-[#E6DFC8] bg-[#FAF6EC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">BritConnect AI Analyst</h3>
                <span className="px-1.5 py-0.2 bg-[#BFE3CF] text-[#0B3D2E] text-[10px] font-semibold rounded-xs">
                  Grounded Facts
                </span>
              </div>
              <p className="text-[11px] text-[#7A877F]">Cites deterministic portfolio figures only</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="p-1.5 rounded-lg text-[#7A877F] hover:text-[#0B3D2E] hover:bg-[#E6DFC8]/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Note Strip */}
        <div className="px-4 py-1.5 bg-[#FAF6EC] border-b border-[#E6DFC8]/80 flex items-center justify-between text-[11px] text-[#7A877F]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#2E9E6B]" />
            Privacy Mode: Customer IDs {appSettings.maskCustomerIds ? 'Masked' : 'Unmasked'}
          </span>
          <span className="text-[#B8860B]">No Arithmetic Hallucinations</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#14633F] text-white rounded-br-xs'
                    : 'bg-[#FAF6EC] text-[#2B3A33] border border-[#E6DFC8] rounded-bl-xs'
                }`}
              >
                {/* Formatted markdown-like lines */}
                <div className="whitespace-pre-line space-y-1">
                  {msg.content.split('\n\n').map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? (
                          <strong key={cIdx} className="font-semibold text-[#0B3D2E]">
                            {chunk}
                          </strong>
                        ) : (
                          chunk
                        )
                      )}
                    </p>
                  ))}
                </div>

                {/* Footer Badges */}
                <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] opacity-75">
                  <span>{msg.timestamp}</span>
                  {msg.verified && (
                    <span className="flex items-center gap-1 text-[#14633F] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Verified by Data
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center gap-2 p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl text-xs text-[#0B3D2E] w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B8860B]" />
              <span>Analyzing customer records and cross-validation facts...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-t border-[#E6DFC8] bg-[#FAF6EC]/60 space-y-1.5">
          <span className="text-[10px] font-semibold text-[#7A877F] uppercase tracking-wider block">
            Suggested Queries
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(prompt)}
                className="text-left text-[11px] px-2.5 py-1 bg-white hover:bg-[#BFE3CF]/30 border border-[#E6DFC8] rounded-md text-[#2B3A33] hover:text-[#0B3D2E] transition-colors truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-[#E6DFC8] bg-[#FFFDF7] flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask questions about churn risk, drivers, or campaigns..."
            className="flex-1 bg-[#FAF6EC] border border-[#E6DFC8] focus:border-[#14633F] rounded-lg px-3 py-2 text-xs text-[#2B3A33] outline-hidden"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isChatLoading}
            className="p-2 bg-[#14633F] hover:bg-[#0B3D2E] text-white disabled:opacity-40 rounded-lg transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
