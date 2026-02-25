import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Bot, User, MapPin, Phone, Truck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocation, getDistanceKm, estimateETA } from '../shared/LocationProvider';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatbot({ hospitals, ambulances }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Emergency Health Assistant. I can help you find nearby ICUs, check bed availability, locate ambulances, suggest routes, and provide first-aid instructions. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { location } = useLocation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    if (!hospitals || hospitals.length === 0) return 'No hospital data available currently.';
    let ctx = `Patient Location: ${location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Unknown'}\n\n`;
    ctx += 'NEARBY HOSPITALS:\n';
    hospitals.forEach((h) => {
      const dist = location ? getDistanceKm(location.lat, location.lng, h.latitude, h.longitude).toFixed(1) : '?';
      ctx += `- ${h.name} (${dist} km): ICU=${h.icu_beds_available || 0}/${h.icu_beds_total || 0}, General=${h.general_beds_available || 0}/${h.general_beds_total || 0}, Emergency=${h.emergency_beds_available || 0}/${h.emergency_beds_total || 0}, Ventilator=${h.ventilator_beds_available || 0}/${h.ventilator_beds_total || 0}, Phone: ${h.phone || 'N/A'}, Rating: ${h.rating || 'N/A'}, ICU Load: ${h.icu_load_prediction || 'safe'}\n`;
    });
    ctx += '\nAMBULANCES WITHIN 4KM:\n';
    const nearbyAmb = (ambulances || [])
      .filter(a => a.is_available && location && getDistanceKm(location.lat, location.lng, a.latitude, a.longitude) <= 4)
      .map(a => ({ ...a, dist: getDistanceKm(location.lat, location.lng, a.latitude, a.longitude) }));
    if (nearbyAmb.length === 0) ctx += 'None available within 4 KM.\n';
    else nearbyAmb.forEach(a => {
      ctx += `- ${a.vehicle_number} (${a.type}): ${a.dist.toFixed(1)} km, ETA ~${estimateETA(a.dist)} min, Driver: ${a.driver_phone || 'N/A'}\n`;
    });
    return ctx;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = buildContext();
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI Emergency Health Assistant chatbot for a hospital emergency management app. You have access to real-time hospital and ambulance data.

CONTEXT DATA:
${context}

USER QUERY: ${userMsg.content}

Instructions:
- Answer based on the real-time data above.
- For nearest ICU queries, find hospitals with available ICU beds sorted by distance (within 5 KM).
- For ambulance queries, show only those within 4 KM radius.
- For first-aid queries (heart attack, accident, bleeding, breathing difficulty), provide step-by-step emergency instructions.
- Provide distances, ETAs, phone numbers, and bed counts where relevant.
- Be concise, helpful, and reassuring.
- Use markdown formatting for clarity.
- If asked about routes, provide general traffic-aware directions.`,
    });

    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ height: '520px' }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                <span className="font-semibold text-sm">Emergency Assistant</span>
              </div>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-blue-700" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about ICU, ambulance, first-aid..."
                  className="flex-1 text-sm"
                />
                <Button size="icon" onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {['Nearest ICU', 'Ambulance near me', 'Heart attack first-aid'].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
