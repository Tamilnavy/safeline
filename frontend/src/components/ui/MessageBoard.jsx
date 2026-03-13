import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Send, User, Shield } from 'lucide-react';

const MessageBoard = ({ complaintId, trackingId, pin, isStaff = false }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [complaintId, trackingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      let resp;
      if (isStaff) {
        resp = await api.get(`/communication/messages-staff/${complaintId}`);
      } else {
        resp = await api.get(`/communication/messages-reporter?trackingId=${trackingId}&pin=${pin}`);
      }
      setMessages(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Failed to load messages', err);
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      if (isStaff) {
        await api.post(`/communication/send-staff/${complaintId}`, content, {
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        await api.post('/communication/send-reporter', {
          trackingId,
          pin,
          content
        });
      }
      setContent('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Safe map check
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col h-full glass" style={{ minHeight: '400px', maxHeight: '600px', display: 'flex' }}>
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={16} color="white" />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Case Communication</h4>
          <p className="text-muted" style={{ fontSize: '0.7rem' }}>Secure encrypted channel</p>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {safeMessages.length === 0 ? (
          <div className="text-muted text-center" style={{ margin: 'auto', fontSize: '0.9rem' }}>
            No messages yet. Start the conversation.
          </div>
        ) : (
          safeMessages.map((m, idx) => {
            const isMe = (isStaff && m.senderRole === 'STAFF') || (!isStaff && m.senderRole === 'REPORTER');
            return (
              <div key={idx} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '1rem',
                  borderBottomRightRadius: isMe ? '0.2rem' : '1rem',
                  borderBottomLeftRadius: !isMe ? '0.2rem' : '1rem',
                  background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: isMe ? 'white' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {m.content}
                </div>
                <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '0.25rem', padding: '0 0.5rem' }}>
                  {m.senderRole === 'STAFF' ? 'Investigator' : 'Reporter'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)' }} className="flex gap-2">
        <input 
          type="text" 
          className="input-field" 
          placeholder="Type your message..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          style={{ padding: '0.75rem 1.25rem' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !content.trim()} style={{ padding: '0.75rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageBoard;
