import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  vendor_image?: string;
  last_message?: string;
  last_message_time?: string;
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

  const [userId, setUserId] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: language === 'sw' ? 'Tafadhali ingia kwanza' : 'Please login first', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    setUserId(session.user.id);

    // Check if vendor
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'vendor')
      .maybeSingle();
    setIsVendor(!!roleData);

    await loadConversations(session.user.id);

    // If vendor param, auto-start or open conversation
    if (vendorParam) {
      await openOrCreateConversation(session.user.id, vendorParam);
    }

    setLoading(false);
  };

  const loadConversations = async (uid: string) => {
    const { data: convos } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!convos) return;

    // Enrich with vendor info
    const vendorIds = [...new Set(convos.map(c => c.vendor_id))];
    const { data: vendors } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, image_url, user_id')
      .in('id', vendorIds);

    const enriched = convos.map(c => {
      const vendor = vendors?.find(v => v.id === c.vendor_id);
      return {
        ...c,
        vendor_name: vendor?.business_name || 'Unknown',
        vendor_image: vendor?.image_url || '',
      };
    });

    setConversations(enriched);
  };

  const openOrCreateConversation = async (uid: string, vendorId: string) => {
    // Check existing
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('customer_id', uid)
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (existing) {
      setSelectedConvo(existing.id);
      await loadMessages(existing.id);
      return;
    }

    // Create new
    const { data: newConvo, error } = await supabase
      .from('chat_conversations')
      .insert({ customer_id: uid, vendor_id: vendorId })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (newConvo) {
      await loadConversations(uid);
      setSelectedConvo(newConvo.id);
      await loadMessages(newConvo.id);
    }
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  // Real-time subscription
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
    if (!input.trim() || !selectedConvo || !userId) return;
    const content = input.trim();
    setInput('');

    await supabase.from('chat_messages').insert({
      conversation_id: selectedConvo,
      sender_id: userId,
      content,
    });

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() } as any)
      .eq('id', selectedConvo);
  };

  const getConvoDisplayName = (convo: Conversation) => {
    if (isVendor) {
      // Show customer name for vendors - we just show "Customer" for now
      return language === 'sw' ? 'Mteja' : 'Customer';
    }
    return convo.vendor_name || 'Unknown';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-14"><p className="text-muted-foreground">{t('loading')}</p></div>;
  }

  // Conversation list
  if (!selectedConvo) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8 pt-14">
        <div className="container py-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('conversations')}</h1>
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'sw' ? 'Hakuna mazungumzo bado' : 'No conversations yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'sw' ? 'Tembelea wasifu wa mtoa huduma kuanza mazungumzo' : 'Visit a vendor profile to start chatting'}
              </p>
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
                  <div className="relative">
                    {convo.vendor_image ? (
                      <img src={convo.vendor_image} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm truncate">{getConvoDisplayName(convo)}</h3>
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

  // Chat view
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background pt-14">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={() => setSelectedConvo(null)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        {currentConvo?.vendor_image && (
          <img src={currentConvo.vendor_image} alt="" className="h-9 w-9 rounded-full object-cover" />
        )}
        <div>
          <h3 className="font-semibold text-sm">{currentConvo ? getConvoDisplayName(currentConvo) : ''}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {language === 'sw' ? 'Anza mazungumzo...' : 'Start the conversation...'}
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isMine
                  ? 'bg-gold-gradient text-primary-foreground rounded-br-md'
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
            placeholder={t('typeMessage')}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={sendMessage}
            className="rounded-xl bg-gold-gradient p-2.5 text-primary-foreground shadow-gold"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
