import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Loader2,
  ChevronRight,
  ImagePlus,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { askSellerAIAssistant, SellerAIReport } from "@/services/aiAssistantService";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  report?: SellerAIReport;
}

interface StoredSellerImage {
  dataUrl: string;
  name: string;
}

const SELLER_AI_IMAGE_STORAGE_KEY = "seller-ai-pending-image";
const MAX_IMAGE_FILE_SIZE = 6 * 1024 * 1024;

const reportQuickActions = [
  {
    label: "Current Report",
    prompt: "Generate my current sales, stock, and review report with top sellers and low stock alerts.",
  },
  {
    label: "Sales Report",
    prompt: "Generate current sales report with total orders, pending orders, completed orders, and revenue.",
  },
  {
    label: "Stock Report",
    prompt: "Generate current stock report with active products, low stock products, and out-of-stock products.",
  },
  {
    label: "Review Report",
    prompt: "Generate review report with total reviews and average rating for my products.",
  },
];

// ─── Simulated AI Responses ─────────────────────────────────────────────────
const aiResponses: Record<string, string[]> = {
  price: [`**Price Suggestion: Brake Pad Set - Toyota Corolla**

Based on current Sri Lankan market analysis:

📊 **Market Price Range:** LKR 3,500 - 6,500

**Recommended Pricing Strategy:**
- **Economy Option:** LKR 3,800 - 4,200 (Budget buyers)
- **Standard Option:** LKR 4,500 - 5,000 (Best value) ✅
- **Premium Option:** LKR 5,500 - 6,200 (OEM quality)

**Key Factors:**
• Average competitor price: LKR 4,800
• Import cost typically: LKR 2,200 - 3,000
• Healthy margin target: 35-45%

💡 **Tip:** Price at LKR 4,499 (psychological pricing) and offer free delivery for orders over LKR 5,000 to increase average order value.`,
`**Quick Price Plan: Corolla Brake Pad Set**

You can price this item using a 3-tier plan:

- Entry: LKR 3,900-4,300
- Recommended: LKR 4,500-4,950
- Premium: LKR 5,600-6,100

What works best on marketplace:
• Keep one SKU under LKR 4,500 for budget buyers
• Use warranty text for higher-priced listings
• Show compatibility years in the title

Tip: Try LKR 4,790 with a limited-time 5% offer to increase conversions.`,
`**Pricing Suggestion for Better Sales**

For Corolla brake pad sets, consider:

- Fast-moving price: LKR 4,300-4,800
- Margin-focused price: LKR 4,900-5,400
- OEM positioning: LKR 5,700-6,200

To improve trust:
• Mention brand + material type
• Add clear return policy
• Include install recommendation

Tip: Test two price points for 7 days each and keep the one with better orders.`],

  description: [
    '**Ready-to-post product description generated from your part and model request.**',
  ],

  tips: [`**🚀 Top Sales Tips for Your Spare Parts Shop**

**1. Optimize Your Listings**
- Use high-quality product images (multiple angles)
- Include compatibility details (make, model, year)
- Add clear specifications and dimensions

**2. Competitive Pricing Strategy**
- Monitor competitor pricing weekly
- Offer bundle deals (e.g., "Brake pad + disc" combos)
- Run limited-time promotions

**3. Build Customer Trust**
- Respond to inquiries within 1 hour
- Ship orders within 24 hours
- Follow up after delivery for reviews

**4. Expand Your Range**
- Stock fast-moving items (filters, brake pads, belts)
- Add compatible parts for popular models in Sri Lanka
- Offer OEM and aftermarket options

**5. Leverage Finding Moto Features**
- Keep your shop profile complete and updated
- Use keywords in product titles
- Maintain a rating above 4.5 ⭐

📈 Sellers using these strategies see an average 35% increase in sales within 3 months.`,
`**🚀 Practical Sales Tips for Spare Parts Sellers**

1. Focus on top-demand SKUs and keep stock updated daily.
2. Add compatibility details in title + first two lines.
3. Offer two quality levels (budget and premium).
4. Reply to buyer chats quickly to improve conversion.
5. Bundle related parts to increase average order value.

Tip: Your first image should clearly show brand and part number.`],

  marketing: [`**📢 Marketing Strategies for Your Auto Parts Business**

**Online Strategies:**
1. **Social Media Presence** - Post daily on Facebook & Instagram
   - Before/after installation photos
   - Quick tip videos (60 seconds)
   - Customer testimonials

2. **WhatsApp Business** - Create a product catalog
   - Send weekly promotions
   - Offer ordering via WhatsApp

3. **Google My Business** - List your shop with photos
   - Encourage reviews from happy customers

**Finding Moto Platform:**
- Run flash sales during weekends
- Offer "Buy 2, Get 10% off" bundles
- Maintain fast response times

**Customer Retention:**
- Loyalty discount for repeat buyers (5%)
- Birthday/anniversary discount vouchers
- Referral program: LKR 500 off for each referral

💡 **Quick Win:** Add "Compatible Vehicle" tags to all your products. This can increase your search visibility by 45%.`,
`**📢 Smart Marketing Ideas for Your Parts Store**

**This week plan:**
1. Run one weekend flash deal on a popular item.
2. Post before/after install photos on social media.
3. Highlight "fast delivery" and "compatibility support".

**Retention ideas:**
• Give repeat buyers loyalty discounts
• Use referral coupons
• Ask for reviews after successful delivery

Quick Win: Add short video clips for 3 best-selling products.`],
};

const pickRandom = (items: string[]): string => {
  return items[Math.floor(Math.random() * items.length)];
};

const normalizeText = (value: string): string => {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[?.,!]+$/g, '')
    .trim();
};

const toTitleCase = (value: string): string => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && /^[a-zA-Z0-9]+$/.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const extractProductAndVehicle = (prompt: string): { product: string; vehicle: string } => {
  const cleaned = normalizeText(prompt);
  const lower = cleaned.toLowerCase();
  const fallbackProduct = 'Motorcycle Spare Part';
  const fallbackVehicle = 'Popular Bike Models';

  const forMatch = cleaned.match(/for\s+(.+)$/i);
  if (forMatch?.[1]) {
    const candidate = normalizeText(forMatch[1]);
    return {
      product: fallbackProduct,
      vehicle: toTitleCase(candidate),
    };
  }

  const descriptionIndex = lower.indexOf('description');
  if (descriptionIndex >= 0) {
    const afterDescription = normalizeText(cleaned.slice(descriptionIndex + 'description'.length));
    const vehicleHints = ['bajaj', 'honda', 'yamaha', 'suzuki', 'tvs', 'hero', 'kawasaki', 'ktm'];
    const words = afterDescription.split(' ').filter(Boolean);

    if (words.length > 2) {
      const brandIndex = words.findIndex((word) => vehicleHints.includes(word.toLowerCase()));
      if (brandIndex > 0) {
        const product = toTitleCase(words.slice(0, brandIndex).join(' '));
        const vehicle = toTitleCase(words.slice(brandIndex).join(' '));
        return {
          product: product || fallbackProduct,
          vehicle: vehicle || fallbackVehicle,
        };
      }
    }
  }

  const vehicleHints = ['bajaj', 'honda', 'yamaha', 'suzuki', 'tvs', 'hero', 'kawasaki', 'ktm'];
  const words = cleaned.split(' ').filter(Boolean);
  const brandIndex = words.findIndex((word) => vehicleHints.includes(word.toLowerCase()));

  if (brandIndex > 0) {
    return {
      product: toTitleCase(words.slice(0, brandIndex).join(' ')),
      vehicle: toTitleCase(words.slice(brandIndex).join(' ')),
    };
  }

  return {
    product: toTitleCase(cleaned) || fallbackProduct,
    vehicle: fallbackVehicle,
  };
};

const buildDescriptionFallback = (prompt: string): string => {
  const { product, vehicle } = extractProductAndVehicle(prompt);

  return `**Product Description: ${product} - ${vehicle}**

🔧 **High-Performance ${product} for ${vehicle}**

Upgrade reliability with this quality ${product.toLowerCase()} designed for ${vehicle}. Built for smooth performance, durability, and daily riding confidence.

**Key Features:**
✅ Precise fitment support for listed models
✅ Strong and durable material quality
✅ Stable performance in city and highway use
✅ Value-focused pricing for retail buyers

**Seller Listing Tips:**
• Add exact compatibility years/variants
• Mention warranty and return policy clearly
• Include real product images from 2-3 angles

📦 Island-wide delivery available | 💯 Quality checked before dispatch`;
};

const fmtCurrency = (value: number): string => `LKR ${Math.round(value).toLocaleString()}`;

function getAIResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("price") || lower.includes("pricing") || lower.includes("cost")) return pickRandom(aiResponses.price);
  if (lower.includes("description") || lower.includes("product") || lower.includes("write")) return buildDescriptionFallback(prompt);
  if (lower.includes("tip") || lower.includes("sales") || lower.includes("increase")) return pickRandom(aiResponses.tips);
  if (lower.includes("market") || lower.includes("promote") || lower.includes("strateg")) return pickRandom(aiResponses.marketing);
  return 'I can help with pricing suggestions, product descriptions, sales tips, and marketing ideas. Share your product name and vehicle model for a better answer.';
}

// ─── AI Chat Page ───────────────────────────────────────────────────────────
export default function SellerAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "👋 Hello! I'm your AI sales assistant for sellers.\n\nI can generate:\n• Live sales reports\n• Live stock reports\n• Live review reports\n• Pricing and listing guidance\n\nUse a Report Action for a real current report from your seller data.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELLER_AI_IMAGE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredSellerImage;
      if (parsed?.dataUrl && parsed?.name) {
        setSelectedImageDataUrl(parsed.dataUrl);
        setSelectedImageName(parsed.name);
        setImageError("");
      }
    } catch (error) {
      console.error("Failed to restore stored image:", error);
      localStorage.removeItem(SELLER_AI_IMAGE_STORAGE_KEY);
    }
  }, []);

  const clearSelectedImage = () => {
    setSelectedImageDataUrl(null);
    setSelectedImageName("");
    setImageError("");
    localStorage.removeItem(SELLER_AI_IMAGE_STORAGE_KEY);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setImageError("Image is too large. Please use an image under 6MB.");
      return;
    }

    setImageError("");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        return;
      }

      setSelectedImageDataUrl(dataUrl);
      setSelectedImageName(file.name);
      try {
        localStorage.setItem(
          SELLER_AI_IMAGE_STORAGE_KEY,
          JSON.stringify({ dataUrl, name: file.name } satisfies StoredSellerImage)
        );
      } catch (error) {
        console.error("Failed to persist selected image:", error);
        setImageError("Image selected, but browser storage is full. You can still send this message.");
      }
    };
    reader.onerror = () => {
      console.error("Failed to read selected image");
      setImageError("Failed to read this image. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !selectedImageDataUrl) || isTyping) return;

    const normalizedText = text.trim() || "Analyze this product image and suggest competitive pricing for the marketplace.";
    const userVisibleText = selectedImageName
      ? `${normalizedText}\n\n[Image attached: ${selectedImageName}]`
      : normalizedText;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: userVisibleText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await askSellerAIAssistant(normalizedText, {
        imageDataUrl: selectedImageDataUrl || undefined,
        productName: normalizedText,
      });
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: response.answer,
        timestamp: new Date(),
        report: response.report,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const fallback = getAIResponse(text);
      const serverMsg = error?.message || 'Live AI is temporarily unavailable.';
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: `${fallback}\n\n(${serverMsg})`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    clearSelectedImage();
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "👋 Chat cleared! How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Sales Assistant</h1>
            <p className="text-sm text-muted-foreground">Seller-only AI with live reports for sales, stock, and reviews</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> New Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Panel */}
        <div className="lg:col-span-3">
          <Card className="glass-card flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
            {/* Messages */}
            <CardContent ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    {msg.role === "assistant" && msg.report && (
                      <div className="mb-3 rounded-xl border border-blue-200 bg-white p-3 text-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-700">Current Seller Report</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-md bg-blue-50 px-2 py-1.5">Orders: <strong>{msg.report.totalOrders}</strong></div>
                          <div className="rounded-md bg-blue-50 px-2 py-1.5">Pending: <strong>{msg.report.pendingOrders}</strong></div>
                          <div className="rounded-md bg-emerald-50 px-2 py-1.5">Revenue: <strong>{fmtCurrency(msg.report.totalRevenue)}</strong></div>
                          <div className="rounded-md bg-emerald-50 px-2 py-1.5">This Month: <strong>{fmtCurrency(msg.report.monthlyRevenue)}</strong></div>
                          <div className="rounded-md bg-amber-50 px-2 py-1.5">Products: <strong>{msg.report.totalProducts}</strong></div>
                          <div className="rounded-md bg-amber-50 px-2 py-1.5">Low Stock: <strong>{msg.report.lowStockProducts}</strong></div>
                          <div className="rounded-md bg-violet-50 px-2 py-1.5">Reviews: <strong>{msg.report.reviewCount}</strong></div>
                          <div className="rounded-md bg-violet-50 px-2 py-1.5">Rating: <strong>{msg.report.averageRating}/5</strong></div>
                        </div>

                        {msg.report.topSellingProducts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[11px] font-semibold text-slate-700 mb-1">Top Sellers</p>
                            <div className="space-y-1">
                              {msg.report.topSellingProducts.slice(0, 3).map((item) => (
                                <div key={item.name} className="flex justify-between text-[10px] rounded bg-slate-50 px-2 py-1">
                                  <span className="truncate pr-2">{item.name}</span>
                                  <span className="font-semibold">Sold {item.sales}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {msg.report.lowStockList.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[11px] font-semibold text-red-600 mb-1">Low Stock Alerts</p>
                            <div className="space-y-1">
                              {msg.report.lowStockList.slice(0, 3).map((item) => (
                                <div key={item.name} className="flex justify-between text-[10px] rounded bg-red-50 px-2 py-1 text-red-700">
                                  <span className="truncate pr-2">{item.name}</span>
                                  <span className="font-semibold">Stock {item.stock}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return <strong key={i}>{part.slice(2, -2)}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                    <p className={cn(
                      "text-[10px] mt-2 opacity-60",
                      msg.role === "user" ? "text-right" : ""
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">You</span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>

            {/* Report Actions (shown when few messages) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mt-3 mb-2 font-medium">Report Actions (Seller Only)</p>
                <div className="grid grid-cols-2 gap-2">
                  {reportQuickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="flex items-center gap-2 p-3 rounded-xl text-left text-sm font-medium transition-all bg-slate-100 hover:bg-slate-200"
                    >
                      <BarChart3 className="h-4 w-4 text-slate-700" />
                      <span>{action.label}</span>
                      <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              {selectedImageDataUrl && (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={selectedImageDataUrl} alt="Selected upload" className="h-10 w-10 rounded object-cover border border-blue-200" />
                    <div className="truncate">
                      <p className="font-medium text-blue-900 truncate">{selectedImageName}</p>
                      <p className="text-blue-700">Image ready for AI analysis</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="rounded p-1 text-blue-700 hover:bg-blue-100"
                    aria-label="Remove selected image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  className="p-2.5 rounded-xl border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                  title="Attach product image"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about pricing, product analysis, descriptions, sales tips..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={(!input.trim() && !selectedImageDataUrl) || isTyping}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/25"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {imageError && (
                <p className="text-[11px] text-red-500 mt-2 text-center">{imageError}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                AI responses are for guidance only. Always verify pricing and details independently.
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar - Suggestions */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 mt-0.5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium">Live Seller Reports</p>
                  <p className="text-[10px] text-muted-foreground">Current sales, stock, and review metrics from your data</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-xs font-medium">Pricing and Listing Help</p>
                  <p className="text-[10px] text-muted-foreground">AI guidance for pricing, descriptions, and sales growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
