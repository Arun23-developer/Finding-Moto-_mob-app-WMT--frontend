import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { askAIAssistant } from "@/services/aiAssistantService";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface QuickAction {
  icon: string;
  label: string;
  prompt: string;
  color: string;
  bg: string;
}

// ─── Quick Actions ──────────────────────────────────────────────────────────
const quickActions: QuickAction[] = [
  {
    icon: "🏍️",
    label: "Find Parts",
    prompt: "Help me find the right brake pads for my Honda CB150R",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    icon: "💰",
    label: "Compare Prices",
    prompt: "What's a fair price for a motorcycle chain and sprocket set?",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    icon: "🔧",
    label: "Find Mechanic",
    prompt: "I need a mechanic for engine repair near me",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    icon: "📋",
    label: "Maintenance Tips",
    prompt: "What regular maintenance should I do for my motorcycle?",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
];

// ─── Simulated AI Responses ─────────────────────────────────────────────────
const aiResponses: Record<string, string> = {
  parts: `**🏍️ Finding the Right Parts**

Here's how I can help you find the perfect parts:

**For Brake Pads (Honda CB150R):**
• **OEM Option:** Honda Genuine Brake Pads — LKR 2,800 - 3,500
• **Aftermarket:** Bendix, EBC — LKR 1,800 - 2,500
• **Budget:** Local brands — LKR 900 - 1,500

**Tips for Choosing:**
✅ Always match part number with your bike model & year
✅ Check compatibility info in product listings
✅ Read buyer reviews for real-world feedback
✅ OEM parts guarantee fitment, aftermarket can save 30-40%

**Quick Search:**
Try searching "CB150R brake pad" in the product search bar on your dashboard — you'll see available options with prices and ratings.

💡 Need help with a specific part? Just tell me your bike model and what you need!`,

  price: `**💰 Price Comparison Guide**

**Chain & Sprocket Set — Typical Pricing:**

| Type | Price Range (LKR) | Quality |
|------|-------------------|---------|
| Budget/Local | 3,500 - 5,000 | Basic, shorter life |
| Mid-range | 5,500 - 8,000 | Good balance ✅ |
| Premium (DID, RK) | 8,500 - 14,000 | Best durability |
| OEM Genuine | 10,000 - 18,000 | Factory spec |

**Smart Buying Tips:**
• Always replace chain + both sprockets together
• 428-size chain is common for 150cc bikes
• Check tooth count matches your model
• Gold-colored chains (O-ring) last 2x longer

**How to Compare on Finding Moto:**
1. Search the product name
2. Sort by "Price: Low to High"
3. Filter by brand if you prefer
4. Check seller ratings before ordering

📊 I recommend the mid-range option for best value!`,

  mechanic: `**🔧 Finding a Mechanic**

Here's how to find the right mechanic for your needs:

**For Engine Repair:**
Look for mechanics with:
• ⭐ 4+ star rating
• Specialization in your bike brand
• At least 3+ years experience
• Good customer reviews

**Steps to Book:**
1. Go to **Services** from your dashboard
2. Search by location or service type
3. Check mechanic profiles & reviews
4. Contact directly to discuss the repair

**What to Ask:**
• Estimated cost for the repair
• Turnaround time
• Warranty on work done
• Whether they use OEM or aftermarket parts

**Cost Estimates (Engine Repair):**
• Minor tune-up: LKR 2,000 - 4,000
• Valve adjustment: LKR 3,000 - 5,000
• Top-end rebuild: LKR 8,000 - 15,000
• Full engine overhaul: LKR 15,000 - 35,000

💡 Always get 2-3 quotes before deciding!`,

  maintenance: `**📋 Motorcycle Maintenance Schedule**

**Every 500 km / Weekly:**
• Check tire pressure (front: 28-30 psi, rear: 32-34 psi)
• Check chain slack (20-30mm free play)
• Inspect brake lever free play
• Check lights and signals

**Every 3,000 km:**
• Change engine oil (use recommended grade)
• Clean/replace air filter
• Lubricate chain
• Check brake pads for wear

**Every 6,000 km:**
• Replace oil filter
• Check spark plug (clean or replace)
• Inspect brake fluid level
• Adjust clutch cable

**Every 12,000 km:**
• Replace spark plug
• Replace air filter
• Check valve clearance
• Inspect coolant (liquid-cooled bikes)
• Replace brake fluid

**Every 24,000 km:**
• Replace chain & sprockets
• Replace brake pads
• Full service with compression check

🔧 **Pro Tip:** Keep a maintenance log — it helps with resale value and prevents costly repairs!`,
};

function getAIResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("part") || lower.includes("find") || lower.includes("brake") || lower.includes("filter") || lower.includes("compatible"))
    return aiResponses.parts;
  if (lower.includes("price") || lower.includes("cost") || lower.includes("compare") || lower.includes("cheap") || lower.includes("worth"))
    return aiResponses.price;
  if (lower.includes("mechanic") || lower.includes("repair") || lower.includes("service") || lower.includes("workshop") || lower.includes("fix"))
    return aiResponses.mechanic;
  if (lower.includes("maintenance") || lower.includes("schedule") || lower.includes("oil") || lower.includes("chain") || lower.includes("tire"))
    return aiResponses.maintenance;

  return `Great question! I can help you with:\n\n• **Finding parts** — Tell me your bike model and what you need\n• **Comparing prices** — I'll guide you on fair market rates\n• **Finding mechanics** — Get repair services near you\n• **Maintenance tips** — Keep your bike running smooth\n\nJust ask me anything about your motorcycle!`;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function BuyerAIChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: `👋 Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm your **Finding Moto AI Assistant**.\n\nI can help you with:\n• 🏍️ **Finding the right parts** for your motorcycle\n• 💰 **Price comparisons** — know what's fair\n• 🔧 **Finding mechanics** near you\n• 📋 **Maintenance tips** to keep your bike healthy\n\nTry one of the quick actions below or ask me anything!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await askAIAssistant(text.trim(), "buyer");
      const aiMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", text: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const serverMsg = error?.message || 'Live AI is temporarily unavailable.';
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: `${getAIResponse(text)}\n\n(${serverMsg})`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const resetChat = () => {
    setMessages([{ id: Date.now(), role: "assistant", text: "👋 Chat cleared! How can I help you today?", timestamp: new Date() }]);
  };

  // Inline styles
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Inter', sans-serif",
    display: 'flex', flexDirection: 'column'
  };
  const navStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 60, background: '#fff',
    borderBottom: '1px solid #E5E7EB', flexShrink: 0
  };

  return (
    <div style={pageStyle}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 14, color: '#6B7280', fontWeight: 500
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 16 }}>🤖</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>AI Assistant</h1>
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Motorcycle expert</p>
            </div>
          </div>
        </div>
        <button onClick={resetChat} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151'
        }}>
          🔄 New Chat
        </button>
      </nav>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 900, width: '100%', margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Messages */}
        <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 14 }}>✨</span>
                </div>
              )}
              <div style={{
                maxWidth: '75%', borderRadius: 16, padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                ...(msg.role === 'user'
                  ? { background: '#4F46E5', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#fff', color: '#111827', border: '1px solid #E5E7EB', borderBottomLeftRadius: 4 })
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
                <p style={{ fontSize: 10, opacity: 0.5, marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11, color: '#4F46E5'
                }}>You</div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: 14 }}>✨</span>
              </div>
              <div style={{
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
                borderBottomLeftRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>⏳</span>
                <span style={{ fontSize: 14, color: '#6B7280' }}>Thinking...</span>
              </div>
            </div>
          )}

        </div>

        {/* Quick Actions (only show initially) */}
        {messages.length <= 1 && (
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8 }}>Quick Actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
              {quickActions.map(action => (
                <button key={action.label} onClick={() => sendMessage(action.prompt)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 12, border: '1px solid #E5E7EB', background: action.bg,
                  cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: 20 }}>{action.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: action.color }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 0 16px', borderTop: '1px solid #E5E7EB', marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about parts, prices, mechanics, maintenance..."
            disabled={isTyping}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: '1px solid #E5E7EB', fontSize: 14, color: '#111827',
              outline: 'none', background: '#fff',
              opacity: isTyping ? 0.6 : 1
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none',
              background: !input.trim() || isTyping ? '#D1D5DB' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && !isTyping ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', paddingBottom: 10 }}>
          AI responses are for guidance only. Verify details before purchasing.
        </p>
      </div>
    </div>
  );
}
