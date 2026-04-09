import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  display_image?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ChatPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorParam = searchParams.get('vendor');
  const { toast } = useToast();
  const { user, roles } = useAuth();

  const isVendor = roles.includes('vendor');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations().then(() => {
      if (vendorParam && !isVendor) {
        openOrCreateConversation(vendorParam);
      }
      setLoading(false);
    });
  }, [user]); // eslint-disable-line

  const loadConversations = async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!convos?.length) { setConversations([]); return; }

    // Enrich with display info
    const vendorIds = [...new Set(convos.map(c => c.vendor_id))];
    const customerIds = [...new Set(convos.map(c => c.customer_id))];

    const [vendorRes, profileRes] = await Promise.all([
      supabase.from('vendor_profiles').select('id, business_name, image_url, user_id').in('id', vendorIds),
      isVendor ? supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', customerIds) : Promise.resolve({ data: [] }),
    ]);

    const vendors = vendorRes.data || [];
    const profiles = profileRes.data || [];

    const enriched = convos.map(c => {
      if (isVendor) {
        const profile = profiles.find((p: any) => p.user_id === c.customer_id);
        return { ...c, display_name: profile?.full_name || (language === 'sw' ? 'Mteja' : 'Customer'), display_image: profile?.avatar_url || '' };
      } else {
        const vendor = vendors.find((v: any) => v.id === c.vendor_id);
        return { ...c, display_name: vendor?.business_name || 'Unknown', display_image: vendor?.image_url || '' };
      }
    });

    setConversations(enriched);
  };

  const openOrCreateConversation = async (vendorId: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('customer_id', user.id)
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (existing) {
      setSelectedConvo(existing.id);
      return;
    }

    const { data: newConvo, error } = await supabase
      .from('chat_conversations')
      .insert({ customer_id: user.id, vendor_id: vendorId })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (newConvo) {
      await loadConversations();
      setSelectedConvo(newConvo.id);
    }
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  // Realtime subscription
  useEffect(() => {
    if (!selectedConvo) return;
    loadMessages(selectedConvo);

    const channel = supabase
      .channel(`chat-${selectedConvo}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConvo}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConvo || !user) return;
    const content = input.trim();
    setInput('');

    await supabase.from('chat_messages').insert({
      conversation_id: selectedConvo,
      sender_id: user.id,
      content,
      user_id: user.id, // required by schema
    });

    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() } as any)
      .eq('id', selectedConvo);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Conversation list
  if (!selectedConvo) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8 pt-14">
        <div className="container max-w-2xl py-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">
            {language === 'sw' ? 'Mazungumzo' : 'Messages'}
          </h1>
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'sw' ? 'Hakuna mazungumzo bado' : 'No conversations yet'}
              </p>
              {!isVendor && (
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'sw' ? 'Tembelea wasifu wa mtoa huduma kuanza mazungumzo' : 'Visit a vendor profile to start chatting'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo, i) => (
                <motion.button
                  key={convo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedConvo(convo.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-gold"
                >
                  {convo.display_image ? (
                    <img src={convo.display_image} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm truncate">{convo.display_name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(convo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentConvo = conversations.find(c => c.id === selectedConvo);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={() => setSelectedConvo(null)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        {currentConvo?.display_image && (
          <img src={currentConvo.display_image} alt="" className="h-9 w-9 rounded-full object-cover" />
        )}
        <h3 className="font-semibold text-sm">{currentConvo?.display_name || ''}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {language === 'sw' ? 'Anza mazungumzo...' : 'Start the conversation...'}
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isMine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3 pb-20 md:pb-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={language === 'sw' ? 'Andika ujumbe...' : 'Type a message...'}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="rounded-xl bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
