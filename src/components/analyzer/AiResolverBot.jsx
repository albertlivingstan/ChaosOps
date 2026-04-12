import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Check, X, ShieldCheck, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function AiResolverBot({ issues, onRemoveIssue, onResolveComplete }) {
  const [stage, setStage] = useState('idle'); // idle, active, cancelled, fixing, complete
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (issues && issues.length > 0 && stage === 'idle') {
      setTimeout(() => {
        setStage('active');
        setMessages([
          { sender: 'bot', text: `I detected ${issues.length} bugs in the analysis. Would you like me to self-clear these bugs and deploy the auto-fixes to ensure a perfect app delivery to the client?` }
        ]);
      }, 1000);
    }
  }, [issues, stage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleApprove = () => {
    setMessages(prev => [...prev, { sender: 'user', text: 'Yes, please fix them all.' }]);
    startFixingSequence();
  };

  const handleDecline = () => {
    setStage('cancelled');
    toast({
      title: "AI Auto-Fix Skipped",
      description: "You chose to manually review the bugs.",
    });
  };

  const startFixingSequence = () => {
    setStage('fixing');
    setMessages(prev => [...prev, { sender: 'bot', text: 'Initializing auto-fix sequence. Analyzing code dependencies... 🛠️' }]);

    const total = issues.length;
    let current = 0;

    const fixNext = () => {
      if (current < total) {
        setTimeout(() => {
          onRemoveIssue(0);
          setMessages(prev => [...prev, { sender: 'bot', text: `Cleared bug ${current + 1}/${total} in real-time...` }]);
          current++;
          fixNext();
        }, 1500);
      } else {
        setTimeout(() => {
          setStage('complete');
          onResolveComplete();
          setMessages(prev => [...prev, { sender: 'bot', text: 'Fixes aggressively applied! Project is 100% clean and ready for client delivery!' }]);
          toast({
            title: "AI Auto-Fix Complete",
            description: "All detected bugs have been successfully resolved.",
            variant: "default"
          });
        }, 1500);
      }
    };

    setTimeout(fixNext, 1200);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputValue('');

    // Simulated GPT response logic
    setTimeout(() => {
      let botReply = '';
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('how sure') || lower.includes('confident')) {
        botReply = "I am 99.9% confident in these fixes. They are trained on millions of similar deployment anomalies and have been simulated in a sandbox. ChaosOps guarantees safe integration.";
      } else if (lower.includes('client') || lower.includes('speak')) {
        botReply = "If the client asks about the previous delays, you can tell them we implemented a proactive ChaosOps AI layer to guarantee 100% stable releases moving forward! 🚀";
      } else if (lower.includes('fix') || lower.includes('solve') || lower.includes('resolve')) {
        botReply = "Understood. Shall I commence the rapid resolution process now?";
      } else {
        botReply = "That's an interesting point. As an AI embedded within ChaosOps, my primary goal is ensuring zero-downtime and fixing issues instantly. How would you like to proceed with the remaining tasks?";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 1000);
  };

  if (stage === 'idle' || stage === 'cancelled') return null;

  return (
    <div className="mt-6 border overflow-hidden rounded-xl bg-card shadow-sm max-w-2xl mx-auto relative flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">ChaosOps AI Assistant</h3>
            <p className="text-[10px] text-success">● Active & Monitoring</p>
          </div>
        </div>
        {(stage === 'active' || stage === 'complete') && (
          <button onClick={handleDecline} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-primary/5">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
              msg.sender === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-secondary text-foreground rounded-tl-sm border border-border/50 shadow-sm'
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {stage === 'fixing' && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-2 text-sm flex items-center gap-2 border border-border/50 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Applying zero-downtime patches...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Area / Input */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        {stage === 'active' && (
           <div className="flex gap-2 mb-3 px-1">
             <button
               onClick={handleApprove}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow shadow-primary/20 hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98]"
             >
               <Sparkles className="w-4 h-4" />
               Approve Self-Clearing
             </button>
             <button
               onClick={handleDecline}
               className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-all active:scale-[0.98]"
             >
               Skip
             </button>
           </div>
        )}
        
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/70"
            placeholder="Ask me anything or ask about the client..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={stage === 'fixing'}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || stage === 'fixing'}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
