
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Modal from './Modal';
import { ChatMessage, View } from '../types';
import { GeminiIcon } from './Icons';

interface GeminiHubProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: View;
}

const GeminiHub: React.FC<GeminiHubProps> = ({ isOpen, onClose, activeView }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const contextMessages: { [key in View]?: string } = {
        [View.POS]: "Hello! I'm ready to help with orders. You can ask me for recipe ideas or search for nearby suppliers.",
        [View.MANAGE_MENU]: "Welcome to the Menu Manager! I can help you generate creative dish names, descriptions, or even images.",
        [View.REPORTS]: "This is the Reports dashboard. I can help analyze your sales data. Just ask!",
        [View.KITCHEN_DISPLAY]: "Welcome to the Kitchen View! I can provide cooking tips or unit conversions."
      };
      const greeting = contextMessages[activeView] || 'Hello! How can I help you manage your restaurant today?';
      
      if (messages.length === 0 || (messages.length > 0 && messages[0].text !== greeting)) {
         setMessages([{ role: 'model', text: greeting }]);
      }
    }
  }, [isOpen, activeView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let toolConfig = {};

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = position.coords;
        toolConfig = {
          retrievalConfig: { latLng: { latitude, longitude } }
        };
      } catch (geoError) {
        console.warn("Could not get geolocation:", geoError);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userMessage.text }] }], // Simplified history for now
        config: {
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
          toolConfig
        }
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col h-[70vh]">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-2xl" role="img" aria-label="Globe">🌍</span>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Assistant</h2>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white"><GeminiIcon/></div>}
              <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-2">
                        <p className="text-xs font-semibold mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, i) => {
                            const link = source.web?.uri || source.maps?.uri;
                            const title = source.web?.title || source.maps?.title;
                            if (!link) return null;
                            return (
                                <a href={link} key={i} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-md hover:underline truncate">
                                    {title || link}
                                </a>
                            )
                        })}
                        </div>
                    </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white"><GeminiIcon/></div>
               <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors disabled:bg-emerald-300">
              Send
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GeminiHub;
