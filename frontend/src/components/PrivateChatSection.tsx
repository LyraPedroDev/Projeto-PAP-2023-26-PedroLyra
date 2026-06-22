import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquareDot, Search, ChevronLeft, Loader2, WifiOff } from 'lucide-react';
import { theme } from '../theme';
import { socket } from '../services/socket';
import {
  getConversations,
  getMessages,
  type Conversation,
  type PrivateMessage,
} from '../services/privateChatApi';

interface PrivateChatSectionProps {
  userId: number;
  isDarkMode: boolean;
  /** Se definido, abre automaticamente o chat com este amigo ao montar */
  initialFriendId?: number | null;
  initialFriendName?: string;
  onGoToFriends?: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return formatTime(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

function avatarInitials(nome: string): string {
  return nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── componente ───────────────────────────────────────────────────────────────

export function PrivateChatSection({
  userId,
  isDarkMode,
  initialFriendId = null,
  initialFriendName = '',
  onGoToFriends,
}: PrivateChatSectionProps) {
  const T = theme(isDarkMode);

  // Estado da lista de conversas
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);

  // Conversa activa
  const [activeFriend, setActiveFriend] = useState<{ id: number; nome: string } | null>(
    initialFriendId ? { id: initialFriendId, nome: initialFriendName } : null
  );
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // Input
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // "a digitar..."
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Socket — inicializar com o estado actual (socket já ligou com autoConnect:true)
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  // Busca na lista
  const [search, setSearch] = useState('');

  // Mobile: mostrar lista ou chat
  const [showList, setShowList] = useState(!initialFriendId);

  // Scroll
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── carregar conversas ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // silencioso — lista pode estar vazia
    } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── carregar mensagens ao seleccionar amigo ───────────────────────────────

  const loadMessages = useCallback(async (friendId: number) => {
    setMsgsLoading(true);
    try {
      const data = await getMessages(friendId);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFriend) {
      loadMessages(activeFriend.id);
      setShowList(false);
    }
  }, [activeFriend, loadMessages]);

  // ── auto scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── socket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Sincronizar estado imediatamente (socket pode já estar ligado)
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onNewMessage = (msg: PrivateMessage) => {
      const partnerId = activeFriend?.id;
      // Só adicionar se a mensagem pertence à conversa activa
      if (
        (msg.sender_id === userId && msg.receiver_id === partnerId) ||
        (msg.sender_id === partnerId && msg.receiver_id === userId)
      ) {
        setMessages(prev => {
          // Evitar duplicados
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Actualizar lista de conversas (última mensagem, badge)
      loadConversations();
    };

    const onTyping = (data: { sender_id: number; is_typing: boolean }) => {
      if (data.sender_id === activeFriend?.id) {
        setIsTyping(data.is_typing);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_private_message', onNewMessage);
    socket.on('user_typing', onTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_private_message', onNewMessage);
      socket.off('user_typing', onTyping);
    };
  }, [activeFriend, userId, loadConversations]);

  // ── enviar mensagem ───────────────────────────────────────────────────────

  const handleSend = () => {
    if (!input.trim() || !activeFriend || isSending) return;

    setIsSending(true);
    socket.emit('private_message', {
      receiver_id: activeFriend.id,
      content: input.trim(),
    });
    setInput('');
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── typing indicator ──────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeFriend) return;

    socket.emit('typing', { receiver_id: activeFriend.id, is_typing: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { receiver_id: activeFriend.id, is_typing: false });
    }, 2000);
  };

  // ── seleccionar amigo da lista ────────────────────────────────────────────

  const selectFriend = (friend: { id: number; nome: string }) => {
    setActiveFriend(friend);
    setMessages([]);
    setShowList(false);
  };

  // ── filtrar conversas ─────────────────────────────────────────────────────

  const filtered = conversations.filter(c =>
    c.friend.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.friend.email.toLowerCase().includes(search.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const sidebarStyle: React.CSSProperties = {
    width: 300,
    flexShrink: 0,
    borderRight: `1px solid ${T.border}`,
    display: 'flex',
    flexDirection: 'column',
    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'linear-gradient(180deg,#ffffff 0%,#f7fdf9 100%)',
    height: '100%',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        background: T.bg,
        borderRadius: 24,
        overflow: 'hidden',
        border: `1px solid ${T.border}`,
        boxShadow: isDarkMode
          ? '0 4px 32px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.08)',
        fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
      }}
    >
      {/* ── LISTA DE CONVERSAS (sidebar esquerda) ─────────────────────────── */}
      <div
        style={{
          ...sidebarStyle,
          display: showList || window.innerWidth >= 768 ? 'flex' : 'none',
        }}
        className="chat-sidebar"
      >
        {/* Header da lista */}
        <div style={headerStyle}>
          <MessageSquareDot size={20} color={T.accent} />
          <span style={{ fontWeight: 700, fontSize: 16, color: T.text, flex: 1 }}>
            Mensagens
          </span>
          {/* Indicador de socket */}
          <div
            title={socketConnected ? 'Conectado' : 'Sem ligação'}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: socketConnected ? T.accent : '#ef4444',
              boxShadow: socketConnected
                ? isDarkMode ? `0 0 8px ${T.accent}` : 'none'
                : 'none',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              color={T.textMuted}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.bgInput,
                color: T.text,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {convsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={22} color={T.accent} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: T.textMuted,
                fontSize: 13,
              }}
            >
              <MessageSquareDot size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>Nenhuma conversa ainda.</p>
              <button
                type="button"
                onClick={onGoToFriends}
                style={{ marginTop: 10, fontSize: 12, color: T.accent, fontWeight: 800, cursor: 'pointer', border: 0, background: 'transparent' }}
              >
                Ver amigos e iniciar conversa →
              </button>
              <p style={{ marginTop: 4, fontSize: 12 }}>
                Vai a <strong style={{ color: T.accent }}>Amigos</strong> e clica no ícone 💬
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = activeFriend?.id === conv.friend.id;
              return (
                <motion.button
                  key={conv.friend.id}
                  onClick={() => selectFriend(conv.friend)}
                  whileHover={{ backgroundColor: T.bgCardHover }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    border: 'none',
                    background: isActive ? T.accentSub : 'transparent',
                    borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: isActive
                        ? `linear-gradient(135deg, ${T.accent}, #059669)`
                        : isDarkMode
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: localStorage.getItem(`user_avatar_${conv.friend.id}`) ? 20 : 14,
                      fontWeight: 800,
                      color: isActive ? '#fff' : T.textSub,
                      flexShrink: 0,
                    }}
                  >
                    {localStorage.getItem(`user_avatar_${conv.friend.id}`) || avatarInitials(conv.friend.nome)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: conv.unread_count > 0 ? 700 : 600,
                          color: T.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 130,
                        }}
                      >
                        {conv.friend.nome}
                      </span>
                      <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>
                        {formatDate(conv.last_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: conv.unread_count > 0 ? T.accent : T.textMuted,
                          fontWeight: conv.unread_count > 0 ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 150,
                        }}
                      >
                        {conv.last_message || 'Sem mensagens'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span
                          style={{
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            background: T.accent,
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px',
                            flexShrink: 0,
                          }}
                        >
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ── ÁREA DE MENSAGENS ──────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: (!showList || window.innerWidth >= 768) && activeFriend ? 'flex' : 'flex',
          flexDirection: 'column',
          background: T.bg,
          minWidth: 0,
        }}
      >
        {!activeFriend ? (
          /* Estado vazio */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.textMuted,
              gap: 16,
              padding: 32,
              textAlign: 'center',
              background: isDarkMode
                ? 'radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, transparent 60%)'
                : 'radial-gradient(circle at center, rgba(16,185,129,0.10) 0%, transparent 60%)',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 28,
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                border: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDarkMode ? 'none' : '0 20px 40px rgba(15,23,42,0.06)',
              }}
            >
              <MessageSquareDot size={44} color={T.accent} />
            </motion.div>
            <div style={{ maxWidth: 320 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>
                Selecione uma conversa
              </p>
              <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>
                Escolha uma conversa existente na barra lateral ou vá à secção de amigos para iniciar uma nova mensagem.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header do chat */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: T.bgCard,
                flexShrink: 0,
              }}
            >
              {/* Botão voltar (mobile) */}
              <button
                onClick={() => setShowList(true)}
                className="lg:hidden"
                style={{
                  background: 'none',
                  border: 'none',
                  color: T.accent,
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <ChevronLeft size={22} />
              </button>

              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.accent}, #059669)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: localStorage.getItem(`user_avatar_${activeFriend.id}`) ? 18 : 13,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {localStorage.getItem(`user_avatar_${activeFriend.id}`) || avatarInitials(activeFriend.nome)}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: T.text, margin: 0 }}>
                  {activeFriend.nome}
                </p>
                <AnimatePresence mode="wait">
                  {isTyping ? (
                    <motion.p
                      key="typing"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      style={{ fontSize: 12, color: T.accent, margin: 0 }}
                    >
                      a digitar...
                    </motion.p>
                  ) : (
                    <motion.p
                      key="online"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: T.textMuted, margin: 0 }}
                    >
                      {socketConnected ? 'online' : <span style={{ color: '#ef4444' }}>sem ligação</span>}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {!socketConnected && (
                <WifiOff size={18} color="#ef4444" title="Sem ligação ao servidor" />
              )}
            </div>

            {/* Mensagens */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {msgsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                  <Loader2 size={28} color={T.accent} className="animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: T.textMuted,
                    fontSize: 13,
                    marginTop: 40,
                  }}
                >
                  Nenhuma mensagem ainda. Diz olá! 👋
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === userId;
                    const showDate =
                      idx === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(messages[idx - 1].created_at).toDateString();

                    return (
                      <div key={msg.id}>
                        {/* Separador de data */}
                        {showDate && (
                          <div
                            style={{
                              textAlign: 'center',
                              margin: '12px 0 8px',
                              fontSize: 11,
                              color: T.textMuted,
                            }}
                          >
                            <span
                              style={{
                                background: T.bgCard,
                                padding: '3px 12px',
                                borderRadius: 20,
                                border: `1px solid ${T.border}`,
                              }}
                            >
                              {new Date(msg.created_at).toLocaleDateString('pt-PT', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Bolha de mensagem */}
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            marginBottom: 2,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%',
                              padding: '9px 14px',
                              borderRadius: isMine
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                              background: isMine
                                ? `linear-gradient(135deg, ${T.accent}, #059669)`
                                : isDarkMode
                                ? 'rgba(255,255,255,0.07)'
                                : 'rgba(0,0,0,0.06)',
                              color: isMine ? '#fff' : T.text,
                              fontSize: 14,
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              boxShadow: isMine
                                ? isDarkMode
                                  ? `0 2px 12px rgba(16,185,129,0.25)`
                                  : '0 2px 8px rgba(5,150,105,0.2)'
                                : 'none',
                            }}
                          >
                            <p style={{ margin: 0 }}>{msg.content}</p>
                            <p
                              style={{
                                margin: '4px 0 0',
                                fontSize: 10,
                                opacity: 0.7,
                                textAlign: 'right',
                              }}
                            >
                              {formatTime(msg.created_at)}
                              {isMine && msg.read_at && ' ✓✓'}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${T.border}`,
                background: T.bgCard,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  background: T.bgInput,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: '6px 6px 6px 16px',
                }}
              >
                <input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    socketConnected
                      ? `Mensagem para ${activeFriend.nome}...`
                      : 'A ligar ao servidor...'
                  }
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: T.text,
                    fontSize: 14,
                    minWidth: 0,
                    opacity: socketConnected ? 1 : 0.6,
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending || !socketConnected}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background:
                      input.trim() && socketConnected
                        ? `linear-gradient(135deg, ${T.accent}, #059669)`
                        : T.border,
                    color: input.trim() && socketConnected ? '#fff' : T.textMuted,
                    cursor: input.trim() && socketConnected ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
              {!socketConnected && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, textAlign: 'center' }}>
                  Sem ligação ao servidor — a tentar reconectar...
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
