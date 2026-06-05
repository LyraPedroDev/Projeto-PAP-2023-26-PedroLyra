import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, X } from 'lucide-react';


interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5, // 500ms de abertura
      ease: 'easeOut',
      delay: 0,
    },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    transition: {
      duration: 0.3, // 300ms de fecho
      ease: 'easeIn',
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.25, ease: 'easeOut' } 
  }
};

export function AIModal({ isOpen, onClose, isDarkMode = false }: AIModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! 👋 Sou o EcoBot, o teu assistente para um planeta mais verde. Escreve a tua pergunta abaixo sobre água, energia, reciclagem, etc. 🌍',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para simular pseudo-classes (hover, focus, active) em inline styles
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isSendHovered, setIsSendHovered] = useState(false);
  const [isSendActive, setIsSendActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Monitorizar redimensionamento do ecrã
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sendMessageToBackend = async (message: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      return data.response;
    } catch (error) {
      console.error("Erro ao conectar ao backend:", error);
      return "Desculpa, não consegui ligar ao servidor. 😕";
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setLoading(true);

    const botText = await sendMessageToBackend(userInput);

    const botMessage: Message = {
      id: Date.now() + 1,
      text: botText,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // --- Estilos Inline Requisitos do Professor ---
  
  const modalStyle = {
    position: 'fixed' as const,
    bottom: isMobile ? '80px' : '100px',
    right: isMobile ? '10px' : '20px',
    width: isMobile ? 'calc(100% - 20px)' : '380px',
    maxWidth: '380px',
    height: isMobile ? '70vh' : '480px',
    borderRadius: '16px',
    backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15)',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    fontFamily: '"Inter", sans-serif',
  };

  const headerStyle = {
    padding: '16px 20px',
    backgroundColor: isDarkMode ? '#1F5A3B' : '#00B45A', // Verde EcoChat
    borderRadius: '16px 16px 0 0',
    borderBottom: `2px solid ${isDarkMode ? '#2D7A4A' : '#009d47'}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const headerTextStyle = {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
    margin: '0',
  };

  const statusStyle = {
    color: '#FFFFFF',
    fontSize: '12px',
    opacity: 0.9,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const closeButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
    backgroundColor: isCloseHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  };

  const chatContainerStyle = {
    padding: '16px', // Espaço respirável
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    overflow: 'hidden',
  };

  const messagesAreaStyle = {
    flex: 1,
    overflowY: 'auto' as const,
    marginBottom: '12px', // Gap antes do input
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px', // Gap entre mensagens
    paddingBottom: '8px',
  };

  const messageStyle = {
    marginBottom: '8px', // Garantir espaço
    borderRadius: '12px',
    maxWidth: '85%',
  };

  const inputContainerStyle = {
    display: 'flex',
    gap: '8px', // Gap entre input e botão
    padding: '0',
    marginTop: '12px', // Separação do scroll area
  };

  const inputStyle = {
    flex: 1,
    padding: '12px 14px',
    border: isInputFocused 
      ? '2px solid #00B45A' 
      : isInputHovered 
        ? '1.5px solid rgba(0, 180, 90, 0.4)' 
        : '1.5px solid rgba(0, 180, 90, 0.25)',
    borderRadius: '8px',
    backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F5F5',
    color: isDarkMode ? '#E0E0E0' : '#333333',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxShadow: isInputFocused ? '0 0 0 3px rgba(0, 180, 90, 0.1)' : 'none',
    transition: 'all 0.2s ease',
    paddingLeft: isInputFocused ? '13px' : '14px', // Compensar a largura da borda
    paddingRight: isInputFocused ? '13px' : '14px',
  };

  const sendButtonStyle = {
    padding: '10px 14px',
    backgroundColor: '#00B45A', // Verde EcoChat
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: (!inputValue.trim() || loading) ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    height: '44px',
    transform: isSendActive ? 'scale(0.98)' : isSendHovered ? 'scale(1.05)' : 'scale(1)',
    opacity: (!inputValue.trim() || loading) ? 0.5 : 1,
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="ai-chat-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none"
        >
          {/* Overlay invisível/semi-transparente para fechar ao clicar fora */}
          <div 
            className="absolute inset-0 bg-black/15 dark:bg-black/40 backdrop-blur-[1.5px] pointer-events-auto"
            onClick={onClose}
          />

          {/* Modal / Popup de Chat */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={modalStyle}
            className="pointer-events-auto"
          >
            {/* Header do Chat (Verde EcoChat c/ Sombra) */}
            <div style={headerStyle}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 flex items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF'
                  }}
                >
                  <Bot className="text-white w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 style={headerTextStyle}>EcoBot Assistant</h3>
                  <div style={statusStyle}>
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Online • Sempre disponível
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                onMouseEnter={() => setIsCloseHovered(true)}
                onMouseLeave={() => setIsCloseHovered(false)}
                style={closeButtonStyle}
                aria-label="Fechar chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Container Geral (Respirável) */}
            <div style={chatContainerStyle}>
              {/* Histórico de Mensagens */}
              <div style={messagesAreaStyle} className="scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex gap-2.5 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex-shrink-0 border flex items-center justify-center text-white"
                      style={{
                        background: message.sender === 'bot'
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : 'linear-gradient(135deg, #059669, #0F766E)',
                        borderColor: message.sender === 'bot' ? '#34D399' : '#10B981'
                      }}
                    >
                      {message.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
                    </div>

                    <div 
                      className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                      style={{
                        maxWidth: messageStyle.maxWidth,
                        marginBottom: messageStyle.marginBottom
                      }}
                    >
                      <div 
                        className={`text-sm leading-relaxed whitespace-pre-line shadow-xs transition-all duration-300 ${
                          message.sender === 'bot'
                            ? 'rounded-tl-none border ' + (isDarkMode ? 'border-green-900/50' : 'border-green-100')
                            : 'rounded-tr-none'
                        }`}
                        style={{
                          backgroundColor: message.sender === 'bot'
                            ? (isDarkMode ? '#2D5A1F' : '#E8F5E9')
                            : '#00B45A',
                          color: message.sender === 'bot'
                            ? (isDarkMode ? '#E0E0E0' : '#333333')
                            : '#FFFFFF',
                          padding: '12px',
                          borderRadius: messageStyle.borderRadius
                        }}
                      >
                        {message.text}
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex gap-2.5 items-center"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex-shrink-0 border flex items-center justify-center text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        borderColor: '#34D399'
                      }}
                    >
                      <Bot size={14} className="text-white" />
                    </div>
                    <div 
                      className={`px-4 py-3 rounded-[12px] rounded-tl-none text-xs border ${
                        isDarkMode ? 'border-green-900/50' : 'border-green-100'
                      }`}
                      style={{
                        backgroundColor: isDarkMode ? '#2D5A1F' : '#E8F5E9',
                        color: isDarkMode ? '#E0E0E0' : '#333333'
                      }}
                    >
                      <div className="flex gap-1.5 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div style={inputContainerStyle}>
                <input
                  type="text"
                  placeholder="Escreve a tua pergunta..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onMouseEnter={() => setIsInputHovered(true)}
                  onMouseLeave={() => setIsInputHovered(false)}
                  disabled={loading}
                  style={inputStyle}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading}
                  onMouseEnter={() => setIsSendHovered(true)}
                  onMouseLeave={() => { setIsSendHovered(false); setIsSendActive(false); }}
                  onMouseDown={() => setIsSendActive(true)}
                  onMouseUp={() => setIsSendActive(false)}
                  style={sendButtonStyle}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
