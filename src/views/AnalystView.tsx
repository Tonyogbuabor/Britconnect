/**
 * BritConnect Dedicated AI Analyst View
 * Full-screen conversational intelligence console with live pre-computed facts transparency
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  ShieldCheck,
  RefreshCw,
  Code,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { compilePrecomputedFacts } from '../chat/analystService';

export const AnalystView: React.FC = () => {
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const isChatLoading = useAppStore((s) => s.isChatLoading);
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const championModel = useAppStore((s) => s.championModel);
  const appSettings = useAppStore((s) => s.appSettings);

  const [inputVal, setInputVal] = useState('');
  const [showFactsModal, setShowFactsModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const facts = compilePrecomputedFacts(engineeredDataset, championModel);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isChatLoading) return;
    const q = inputVal.trim();
    setInputVal('');
    sendChatMessage(q);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
                AI Retention Analyst Console
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#BFE3CF] text-[#0B3D2E] text-xs font-semibold">
                Grounded Facts
              </span>
            </div>
            <p className="text-xs text-[#7A877F] mt-0.5">
              Natural language answers strictly grounded in pre-computed portfolio metrics. Zero arithmetic hallucination.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFactsModal(!showFactsModal)}
          className="px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] text-[#0B3D2E] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Code className="w-3.5 h-3.5 text-[#14633F]" />
          <span>{showFactsModal ? 'Hide Fact Bundle' : 'Inspect Pre-computed Facts JSON'}</span>
        </button>
      </div>

      {/* Facts Drawer / Inspector */}
      {showFactsModal && (
        <div className="bg-[#0B3D2E] text-[#F0E2B0] border border-[#D4AF37] rounded-2xl p-5 shadow-xl animate-fadeIn space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E9E6B]" />
              Exact Pre-computed Facts Bundle Provided to Model
            </span>
            <span className="text-[11px] text-white/60">Strict Grounding Protocol</span>
          </div>
          <pre className="font-mono text-[11px] overflow-x-auto max-h-[220px] bg-black/30 p-3 rounded-lg text-emerald-200">
            {JSON.stringify(facts, null, 2)}
          </pre>
        </div>
      )}

      {/* Main Chat Stream */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs h-[520px] flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#14633F] text-white rounded-br-xs'
                    : 'bg-[#FAF6EC] text-[#2B3A33] border border-[#E6DFC8] rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line space-y-1.5">
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

                <div className="mt-2.5 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] opacity-75">
                  <span>{msg.timestamp}</span>
                  {msg.verified && (
                    <span className="flex items-center gap-1 text-[#14633F] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Grounded by Dataset Facts
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center gap-2 p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl text-xs text-[#0B3D2E] w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B8860B]" />
              <span>Synthesizing portfolio facts and cross-validation statistics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-[#E6DFC8] flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask a question about churn drivers, rolling contracts, or customer risk..."
            className="flex-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl px-4 py-2.5 text-xs text-[#2B3A33] focus:border-[#14633F] outline-hidden"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isChatLoading}
            className="px-4 py-2.5 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <span>Ask Analyst</span>
            <Send className="w-3.5 h-3.5 text-[#F0E2B0]" />
          </button>
        </form>
      </div>
    </div>
  );
};
