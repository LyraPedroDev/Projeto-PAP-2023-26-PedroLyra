import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Send, X, Leaf, Image, Trophy, 
  Zap, Flame, MoreVertical, Edit2, Trash2, Share2, Bookmark 
} from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '../theme';
import { socket } from '../services/socket';

// --- Interfaces de Tipagem Consistentes ---
interface Post {
  id: number;
  descricao: string;
  categoria: string;
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
  usuario: {
    id: number;
    nome: string;
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  is_owner: boolean;
  edited: boolean;
}

interface Comentario {
  id: number;
  post_id: number;
  usuario: {
    id: number;
    nome: string;
    username: string;
    avatar: string;
  };
  conteudo: string;
  created_at: string;
  user_can_delete: boolean;
}

interface FeedSectionProps {
  userId: number;
  isDarkMode: boolean;
  toggleTheme?: () => void;
}

// --- Categorias Ecológicas com Cores HSL Vibrantes ---
const CATS = [
  { id: 'geral', label: 'Geral', emoji: '🌍', color: '#10b981' },
  { id: 'reciclagem', label: 'Reciclagem', emoji: '♻️', color: '#06b6d4' },
  { id: 'agua', label: 'Água', emoji: '💧', color: '#3b82f6' },
  { id: 'energia', label: 'Energia', emoji: '⚡', color: '#f59e0b' },
  { id: 'transporte', label: 'Transporte', emoji: '🚴', color: '#8b5cf6' },
  { id: 'alimentacao', label: 'Alimentação', emoji: '🥗', color: '#ec4899' },
];

function ago(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (d < 60) return 'agora mesmo';
  if (d < 3600) return `há ${Math.floor(d / 60)}min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)}h`;
  return `há ${Math.floor(d / 86400)}d`;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// --- Componente Shimmer Loading Placeholder ---
function PostSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const T = theme(isDarkMode);
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 12, background: T.border }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="shimmer" style={{ width: 120, height: 12, borderRadius: 6, background: T.border }} />
          <div className="shimmer" style={{ width: 60, height: 8, borderRadius: 4, background: T.border }} />
        </div>
      </div>
      <div className="shimmer" style={{ width: '100%', height: 60, borderRadius: 10, background: T.border }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="shimmer" style={{ width: 60, height: 26, borderRadius: 8, background: T.border }} />
        <div className="shimmer" style={{ width: 60, height: 26, borderRadius: 8, background: T.border }} />
      </div>
    </div>
  );
}

// --- Componente de Comentário Individual ---
function CommentItem({ comment, onDelete, currentUserId }: { comment: Comentario; onDelete: (id: number) => void; currentUserId: number }) {
  const [deleting, setDeleting] = useState(false);
  const showDelete = comment.usuario.id === currentUserId || comment.user_can_delete;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
        {comment.usuario.nome[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{comment.usuario.nome}</span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>{ago(comment.created_at)}</span>
          {showDelete && (
            <button 
              onClick={() => { setDeleting(true); onDelete(comment.id); }}
              disabled={deleting}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.5 }}>
              <Trash2 size={12} style={{ color: '#ef4444' }} />
            </button>
          )}
        </div>
        <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.4 }}>{comment.conteudo}</div>
      </div>
    </div>
  );
}

// --- Card de Publicação Individual ---
function PostCard({ 
  post, 
  userId, 
  onLike, 
  onUnlike,
  onDelete, 
  onEdit,
  isDarkMode 
}: { 
  post: Post; 
  userId: number; 
  onLike: (id: number) => void; 
  onUnlike: (id: number) => void;
  onDelete: (id: number) => void; 
  onEdit: (id: number, text: string, cat: string) => void;
  isDarkMode: boolean; 
}) {
  const T = theme(isDarkMode);
  
  // --- Estados de Comentários e Menus ---
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(false);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.descricao);
  const [editCat, setEditCat] = useState(post.categoria);

  const catObj = CATS.find(c => c.id === post.categoria) || CATS[0];
  const color = catObj.color;
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Sincronizar Likes do Socket ---
  useEffect(() => {
    setLiked(post.user_liked);
    setLikeCount(post.likes_count);
  }, [post.user_liked, post.likes_count]);

  // --- Menu Dropdown Click Outside ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Carregar Comentários Paginados ---
  const loadComments = async (pageToLoad = 1) => {
    if (commentsLoading) return;
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments?page=${pageToLoad}&limit=5`);
      const resData = await response.json();
      if (response.ok && resData.success) {
        if (pageToLoad === 1) {
          setComments(resData.data.comentarios);
        } else {
          setComments(prev => [...prev, ...resData.data.comentarios]);
        }
        setHasMoreComments(resData.data.pagination.has_more);
        setCommentPage(pageToLoad);
      }
    } catch {
      toast.error('Erro ao carregar comentários');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments(1);
    }
    setShowComments(prev => !prev);
  };

  // --- Enviar Comentário ---
  const sendComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: commentText }),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setCommentText('');
        // O Socket.IO emitirá e inserirá o comentário em tempo real se o listener estiver ativo,
        // mas adicionamos localmente de imediato para feedback instantâneo da UX
        if (!comments.some(c => c.id === resData.data.id)) {
          setComments(prev => [...prev, resData.data]);
        }
        toast.success("Comentário publicado! 💬");
      } else {
        toast.error(resData.error || "Erro ao publicar comentário");
      }
    } catch {
      toast.error("Erro na conexão");
    } finally {
      setSendingComment(false);
    }
  };

  // --- Deletar Comentário ---
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success("Comentário removido!");
      } else {
        toast.error(resData.error || "Erro ao excluir comentário");
      }
    } catch {
      toast.error("Falha ao comunicar exclusão");
    }
  };

  // --- Curtir / Descurtir ---
  const doLike = async () => {
    // Otimistic update
    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      if (liked) {
        await onUnlike(post.id);
      } else {
        await onLike(post.id);
      }
    } catch {
      // Reverter se der erro
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  // --- Salvar / Bookmark ---
  const doSave = () => {
    setSaved(!saved);
    toast.success(saved ? "Removido dos itens salvos! 🔖" : "Publicação salva nos favoritos! 🔖");
  };

  // --- Compartilhar Link ---
  const doShare = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Link ecológico copiado! Compartilhe com amigos! 🚀");
  };

  // --- Deletar Post ---
  const executeDelete = () => {
    if (window.confirm("Tens a certeza que queres eliminar esta publicação? Esta ação é irreversível.")) {
      onDelete(post.id);
      setMenuOpen(false);
    }
  };

  // --- Editar Post ---
  const executeEdit = () => {
    if (!editText.trim()) return;
    onEdit(post.id, editText, editCat);
    setEditing(false);
    setMenuOpen(false);
  };

  return (
    <motion.div
      style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', transition: 'all 0.3s' }}
      whileHover={{ y: -3, boxShadow: isDarkMode ? '0 16px 48px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)' }}>
      
      {/* Header do Post */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px' }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 12, 
          background: `linear-gradient(135deg, ${color}, ${color}99)`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 
        }}>
          {initials(post.usuario.nome)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{post.usuario.nome}</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>@{post.usuario.username}</span>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted }}>{ago(post.created_at)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}35`, color }}>
            {catObj.emoji} {catObj.label}
          </span>
          {post.is_owner && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 4 }}>
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div style={{ 
                  position: 'absolute', top: 24, right: 0, 
                  background: T.bgCard, border: `1px solid ${T.border}`, 
                  borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', 
                  zIndex: 10, display: 'flex', flexDirection: 'column', width: 120, overflow: 'hidden' 
                }}>
                  <button 
                    onClick={() => { setEditing(true); setMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'none', color: T.text, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                    <Edit2 size={13} /> Editar
                  </button>
                  <button 
                    onClick={executeDelete}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor Inline do Card */}
      {editing ? (
        <div style={{ padding: '10px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea 
            value={editText} 
            onChange={e => setEditText(e.target.value)} 
            rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, outline: 'none', resize: 'none', fontSize: 13 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATS.map(c => (
              <button 
                key={c.id} 
                onClick={() => setEditCat(c.id)}
                style={{ 
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', 
                  border: `1px solid ${editCat === c.id ? c.color : T.border}`, 
                  background: editCat === c.id ? `${c.color}18` : 'transparent', 
                  color: editCat === c.id ? c.color : T.textMuted 
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 8, marginTop: 4 }}>
            <button 
              onClick={() => setEditing(false)}
              style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 12, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button 
              onClick={executeEdit}
              style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Salvar Alterações
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mídia/Imagem */}
          {post.imagem_url && (
            <div style={{ overflow: 'hidden', maxHeight: 340, background: '#000' }}>
              <img 
                src={`${post.imagem_url}`} 
                alt="Upload Ecológico" 
                style={{ width: '100%', objectFit: 'cover', display: 'block', opacity: 0.95 }} 
              />
            </div>
          )}

          {/* Descrição */}
          <div style={{ padding: '14px 20px 12px' }}>
            <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{post.descricao}</p>
          </div>
        </>
      )}

      {/* Social Proof (Likes / Ações) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 20px 14px', borderTop: `1px solid ${T.border}` }}>
        <motion.button 
          onClick={doLike} 
          whileTap={{ scale: 1.3 }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, 
            border: 'none', cursor: 'pointer', 
            background: liked ? 'rgba(239,68,68,0.1)' : T.bgCardHover, 
            color: liked ? '#ef4444' : T.textMuted, transition: 'all 0.2s' 
          }}>
          <Heart size={16} style={{ fill: liked ? '#ef4444' : 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{likeCount}</span>
        </motion.button>

        <button 
          onClick={handleToggleComments}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, 
            border: 'none', cursor: 'pointer', 
            background: showComments ? T.accentSub : T.bgCardHover, 
            color: showComments ? T.accent : T.textMuted, transition: 'all 0.2s' 
          }}>
          <MessageCircle size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{post.comments_count}</span>
        </button>

        <button 
          onClick={doShare}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, 
            border: 'none', cursor: 'pointer', background: T.bgCardHover, color: T.textMuted, transition: 'all 0.2s' 
          }}>
          <Share2 size={15} />
        </button>

        <button 
          onClick={doSave}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, 
            border: 'none', cursor: 'pointer', 
            background: saved ? `${color}18` : T.bgCardHover, 
            color: saved ? color : T.textMuted, transition: 'all 0.2s', marginLeft: 4 
          }}>
          <Bookmark size={15} style={{ fill: saved ? color : 'none' }} />
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, background: T.accentSub, border: `1px solid ${T.accentBorder}` }}>
          <Leaf size={12} style={{ color: T.accent }} />
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>+5 pts</span>
        </div>
      </div>

      {/* Caixa de Comentários Inline */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              {/* Comentários */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.length === 0 && !commentsLoading ? (
                  <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '8px 0' }}>🌱 Sê o primeiro a apoiar e comentar!</p>
                ) : (
                  comments.map(c => (
                    <CommentItem key={c.id} comment={c} onDelete={handleDeleteComment} currentUserId={userId} />
                  ))
                )}
              </div>

              {/* Botão Ver Mais Comentários */}
              {hasMoreComments && (
                <button 
                  onClick={() => loadComments(commentPage + 1)}
                  disabled={commentsLoading}
                  style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4 }}>
                  {commentsLoading ? 'A carregar...' : 'Ver mais comentários...'}
                </button>
              )}

              {/* Input para Comentar */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && sendComment()}
                  placeholder="Escreve uma palavra de apoio..."
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: 13, outline: 'none' }} 
                />
                <button 
                  onClick={sendComment} 
                  disabled={sendingComment || !commentText.trim()}
                  style={{ 
                    padding: '9px 16px', borderRadius: 10, border: 'none', 
                    background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', 
                    cursor: 'pointer', opacity: sendingComment || !commentText.trim() ? 0.5 : 1 
                  }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Painel Direito (Widgets & Rankings) ---
function RightPanel({ isDarkMode }: { isDarkMode: boolean }) {
  const T = theme(isDarkMode);
  
  const tips = [
    'Usa sacos reutilizáveis nas compras para diminuir o plástico de uso único! 🛍️',
    'Tenta reduzir o consumo de carne 2x por semana. O planeta agradece! 🥗',
    'Fecha a torneira ao escovar os dentes, pouparás cerca de 12 litros! 💧',
    'Desliga da tomada aparelhos no modo stand-by para poupar energia passiva! ⚡',
    'Se for perto, vai a pé ou de bicicleta. Fortalece o coração e o ambiente! 🚴'
  ];
  const tip = tips[new Date().getDay() % tips.length];

  const top5 = [
    { name: 'Ana Silva', pts: 980, emoji: '🥇' }, 
    { name: 'João Costa', pts: 860, emoji: '🥈' },
    { name: 'Maria Lopes', pts: 720, emoji: '🥉' }, 
    { name: 'Rui Santos', pts: 610, emoji: '4️⃣' },
    { name: 'Pedro Lyra', pts: 540, emoji: '5️⃣' },
  ];

  const blockStyle = { 
    background: T.bgCard, border: `1px solid ${T.border}`, 
    borderRadius: 16, padding: '18px 20px', marginBottom: 14 
  };

  return (
    <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 28 }}>
      {/* Widget 1: Missão do Dia */}
      <div style={blockStyle}>
        <p style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 10 }}>Missão do Dia</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 42, height: 42, borderRadius: 12, background: T.accentSub, 
            border: `1px solid ${T.accentBorder}`, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: 20 
          }}>♻️</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recicla 3 itens hoje</p>
            <p style={{ fontSize: 11, color: T.textMuted }}>+30 pontos</p>
          </div>
        </div>
        <div style={{ marginTop: 12, height: 5, background: T.border, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '33%', background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 10 }} />
        </div>
        <p style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>1 de 3 completo</p>
      </div>

      {/* Widget 2: Streak e Pontos */}
      <div style={{ ...blockStyle, display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Flame size={22} style={{ color: '#f97316', margin: '0 auto 6px' }} />
          <p style={{ fontSize: 22, fontWeight: 900, color: T.text }}>5</p>
          <p style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streak</p>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Zap size={22} style={{ color: T.accent, margin: '0 auto 6px' }} />
          <p style={{ fontSize: 22, fontWeight: 900, color: T.text }}>145</p>
          <p style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pontos</p>
        </div>
      </div>

      {/* Widget 3: Top Líderes */}
      <div style={blockStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Trophy size={15} style={{ color: '#f59e0b' }} />
          <p style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>Top Comunidade</p>
        </div>
        {top5.map((u, i) => (
          <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 14 }}>{u.emoji}</span>
            <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: i === 0 ? '#fbbf24' : T.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{u.pts}</p>
          </div>
        ))}
      </div>

      {/* Widget 4: Dica Ecológica */}
      <div style={{ ...blockStyle, background: T.accentSub, border: `1px solid ${T.accentBorder}` }}>
        <p style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 8 }}>💡 Dica do Dia</p>
        <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>{tip}</p>
      </div>
    </div>
  );
}

// --- Componente Container Principal Feed ---
export function FeedSection({ userId, isDarkMode }: FeedSectionProps) {
  const T = theme(isDarkMode);
  
  // --- Estados do Feed ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtro, setFiltro] = useState('para-voce'); // Abas
  const [catFiltro, setCatFiltro] = useState('todos'); // Chips
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Estados do Criador de Post ---
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('geral');
  const [img, setImg] = useState<File | null>(null);
  const [imgPrev, setImgPrev] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- 1. Carregar Feed de APIs ---
  const loadFeed = async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const catQuery = catFiltro !== 'todos' ? `&categoria=${catFiltro}` : '';
      const response = await fetch(`/api/feed/${userId}?page=${pageToLoad}&limit=5&filtro=${filtro}${catQuery}`);
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        if (append) {
          setPosts(prev => {
            // Evitar ids duplicados na paginação por causa do Socket.IO
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = resData.data.posts.filter((p: Post) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(resData.data.posts);
        }
        setHasMore(resData.data.pagination.has_more);
        setPage(pageToLoad);
      } else {
        toast.error(resData.error || "Erro ao renderizar posts");
      }
    } catch {
      toast.error('Erro de conexão ao carregar posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Carregar ao mudar filtros/abas
  useEffect(() => {
    loadFeed(1, false);
  }, [userId, filtro, catFiltro]);

  // --- 2. Infinite Scroll Listener ---
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (documentHeight - (scrollTop + windowHeight) < 120) {
      loadFeed(page + 1, true);
    }
  }, [loading, loadingMore, hasMore, page]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // --- 3. Tratamento de Arquivos/Preview ---
  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // Validar tamanho máximo do cliente (5MB)
      if (f.size > 5 * 1024 * 1024) {
        toast.error("🚫 O arquivo é muito grande! Limite de 5MB.");
        return;
      }
      
      // Validar extensão do cliente
      const ext = f.name.rsplit ? f.name.rsplit('.', 1)[1].lower() : f.name.split('.').pop()?.toLowerCase();
      if (ext && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        toast.error("🚫 Formato inválido! Use apenas JPG, PNG ou WebP.");
        return;
      }

      setImg(f);
      const r = new FileReader();
      r.onloadend = () => setImgPrev(r.result as string);
      r.readAsDataURL(f);
    }
  };

  // --- 4. Publicar Post (Upload Integrado - Opção A) ---
  const publish = async () => {
    if (!desc.trim()) {
      toast.error('Por favor, escreva algo antes de postar! 🌱');
      return;
    }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', String(userId));
      fd.append('descricao', desc);
      fd.append('categoria', cat);
      if (img) fd.append('imagem', img);

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: fd
      });
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        toast.success(resData.message || 'Publicação criada! +5 pontos 🌱');
        setDesc('');
        setCat('geral');
        setImg(null);
        setImgPrev(null);
        // O Socket.IO emitirá e inserirá o post no início em tempo real no feed
        // para todos, inclusive para nós. O useEffect garante a inserção sem duplicados.
      } else {
        // Humanizar erros com toasts amigáveis baseados nos status HTTP e do mapa de erros
        if (response.status === 413) {
          toast.error("📦 O arquivo é muito grande! Limite de 5MB.");
        } else if (response.status === 415) {
          toast.error("🖼️ Apenas formatos JPG, PNG e WebP são aceitos.");
        } else {
          toast.error(resData.error || 'Erro ao publicar');
        }
      }
    } catch {
      toast.error('🚫 Erro de conexão com o servidor.');
    } finally {
      setPosting(false);
    }
  };

  // --- 5. Operações de Curtidas ---
  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const resData = await response.json();
      if (!response.ok) {
        toast.error(resData.error || "Erro ao curtir post");
        throw new Error();
      }
    } catch {
      throw new Error();
    }
  };

  const handleUnlike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'DELETE' });
      const resData = await response.json();
      if (!response.ok) {
        toast.error(resData.error || "Erro ao remover like");
        throw new Error();
      }
    } catch {
      throw new Error();
    }
  };

  // --- 6. Operações de CRUD do Post ---
  const handleDeletePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success("Iniciativa removida com sucesso.");
      } else {
        if (response.status === 403) {
          toast.error("🚫 Você pode apenas excluir seus próprios posts!");
        } else {
          toast.error(resData.error || "Erro ao excluir post");
        }
      }
    } catch {
      toast.error("Erro na conexão");
    }
  };

  const handleEditPost = async (postId: number, text: string, category: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: text, categoria: category })
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success("Post editado com sucesso! 🌱");
      } else {
        if (response.status === 403) {
          toast.error("🚫 Você pode apenas editar seus próprios posts!");
        } else {
          toast.error(resData.error || "Erro ao editar");
        }
      }
    } catch {
      toast.error("Falha ao comunicar com o servidor");
    }
  };

  // --- 7. Listeners Socket.IO (Tempo Real) ---
  useEffect(() => {
    // Escuta Novo Post
    const onNewPost = (post: Post) => {
      // Inserir apenas se no filtro correto ou feed geral
      setPosts(current => {
        if (current.some(p => p.id === post.id)) return current; // Evitar duplicado
        if (filtro === 'seguindo' || (filtro === 'minhas-categorias' && post.usuario.id !== userId)) {
          return current; // Ignora se não condiz com as abas privadas
        }
        return [post, ...current];
      });
    };

    // Escuta Likes
    const onUpdateLike = (data: any) => {
      setPosts(current => current.map(p => {
        if (p.id === data.post_id) {
          // Atualiza user_liked apenas se a ação foi disparada por nós
          const isUserAction = data.user_liked_by === userId;
          return { 
            ...p, 
            likes_count: data.likes_count,
            user_liked: isUserAction ? (data.acao === 'adicionado') : p.user_liked
          };
        }
        return p;
      }));
    };

    // Escuta Novo Comentário
    const onNewComment = (data: any) => {
      setPosts(current => current.map(p => {
        if (p.id === data.post_id) {
          return { ...p, comments_count: data.comments_count };
        }
        return p;
      }));
    };

    // Escuta Exclusão de Comentário
    const onDeleteComment = (data: any) => {
      setPosts(current => current.map(p => {
        if (p.id === data.post_id) {
          return { ...p, comments_count: data.comments_count };
        }
        return p;
      }));
    };

    // Escuta Edição de Post
    const onEditPost = (data: any) => {
      setPosts(current => current.map(p => {
        if (p.id === data.post_id) {
          return { ...p, descricao: data.descricao, categoria: data.categoria, edited: true };
        }
        return p;
      }));
    };

    // Escuta Deleção de Post
    const onDeletePost = (data: any) => {
      setPosts(current => current.filter(p => p.id !== data.post_id));
    };

    socket.on('novo_post', onNewPost);
    socket.on('update_like', onUpdateLike);
    socket.on('novo_comentario', onNewComment);
    socket.on('deletar_comentario', onDeleteComment);
    socket.on('editar_post', onEditPost);
    socket.on('deletar_post', onDeletePost);

    return () => {
      socket.off('novo_post', onNewPost);
      socket.off('update_like', onUpdateLike);
      socket.off('novo_comentario', onNewComment);
      socket.off('deletar_comentario', onDeleteComment);
      socket.off('editar_post', onEditPost);
      socket.off('deletar_post', onDeletePost);
    };
  }, [userId, filtro]);

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: 40 }}>
      <div style={{ flex: 1, minWidth: 0, maxWidth: 640 }}>
        
        {/* Header Superior - Abas Animadas (Estilo Twitter/X) */}
        <div style={{ 
          display: 'flex', borderBottom: `1px solid ${T.border}`, 
          marginBottom: 20, position: 'sticky', top: 0, background: T.bgCard + 'E6', 
          backdropFilter: 'blur(10px)', zIndex: 10, borderRadius: 12 
        }}>
          {[
            { id: 'para-voce', label: 'Para Você 🌍' },
            { id: 'seguindo', label: 'Seguindo 👥' },
            { id: 'trending', label: 'Trending 🔥' },
            { id: 'minhas-categorias', label: 'Minhas Iniciativas 🎖️' }
          ].map(aba => (
            <button
              key={aba.id}
              onClick={() => setFiltro(aba.id)}
              style={{
                flex: 1, padding: '16px 0', border: 'none', background: 'none',
                color: filtro === aba.id ? T.accent : T.textMuted,
                fontWeight: 700, fontSize: 13, cursor: 'pointer', position: 'relative',
                transition: 'color 0.2s'
              }}>
              {aba.label}
              {filtro === aba.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  style={{
                    position: 'absolute', bottom: 0, left: '20%', right: '20%',
                    height: 3, borderRadius: '3px 3px 0 0', background: T.accent
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Composer de Postagem Ecológica */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ 
              width: 38, height: 38, borderRadius: 10, 
              background: 'linear-gradient(135deg,#10b981,#059669)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 
            }}>
              EC
            </div>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              rows={2} 
              placeholder="O que fizeste hoje pelo planeta? 🌱"
              style={{ 
                flex: 1, padding: '10px 14px', borderRadius: 12, 
                border: `1px solid ${T.border}`, background: T.bgInput, 
                color: T.text, fontSize: 14, outline: 'none', resize: 'none', 
                transition: 'border 0.2s' 
              }} 
            />
          </div>

          {/* Selecionador de Categorias no Composer */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {CATS.map(c => (
              <button 
                key={c.id} 
                onClick={() => setCat(c.id)}
                style={{ 
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', 
                  border: `1px solid ${cat === c.id ? c.color : T.border}`, 
                  background: cat === c.id ? `${c.color}18` : 'transparent', 
                  color: cat === c.id ? c.color : T.textMuted, transition: 'all 0.2s' 
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Preview de Mídia */}
          {imgPrev && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <img src={imgPrev} alt="Anexo Ecológico" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10 }} />
              <button 
                onClick={() => { setImg(null); setImgPrev(null); }}
                style={{ 
                  position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', 
                  border: 'none', borderRadius: '50%', width: 26, height: 26, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' 
                }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Rodapé do Composer (Botões de Mídia & Publicar) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => fileRef.current?.click()}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, 
                border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 13, cursor: 'pointer' 
              }}>
              <Image size={15} /> Adicionar Imagem
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display: 'none' }} />
            
            <motion.button 
              onClick={publish} 
              disabled={posting || !desc.trim()} 
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
              style={{ 
                marginLeft: 'auto', padding: '9px 22px', borderRadius: 10, border: 'none', 
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', 
                fontSize: 14, fontWeight: 700, cursor: 'pointer', 
                opacity: posting || !desc.trim() ? 0.55 : 1, display: 'flex', 
                alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(16,185,129,0.3)' 
              }}>
              <Leaf size={15} />{posting ? 'A publicar…' : 'Publicar'}
            </motion.button>
          </div>
        </motion.div>

        {/* Chips de Categoria para Filtragem Combinada */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {[{ id: 'todos', label: '🌍 Todos os Temas', color: T.accent }, ...CATS].map(f => (
            <button 
              key={f.id} 
              onClick={() => setCatFiltro(f.id)}
              style={{ 
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', 
                border: `1px solid ${catFiltro === f.id ? f.color : T.border}`, 
                background: catFiltro === f.id ? `${f.color}18` : 'transparent', 
                color: catFiltro === f.id ? f.color : T.textMuted, transition: 'all 0.2s' 
              }}>
              {f.emoji ? `${f.emoji} ` : ''}{f.label}
            </button>
          ))}
        </div>

        {/* Posts Renderizados */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(n => <PostSkeleton key={n} isDarkMode={isDarkMode} />)}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bgCard, borderRadius: 18, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Nenhuma iniciativa sustentável por aqui</p>
            <p style={{ fontSize: 14, color: T.textMuted }}>Muda a aba ou sê o primeiro a inspirar a comunidade!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.2) }}>
                <PostCard 
                  post={post} 
                  userId={userId} 
                  onLike={handleLike} 
                  onUnlike={handleUnlike}
                  onDelete={handleDeletePost} 
                  onEdit={handleEditPost}
                  isDarkMode={isDarkMode} 
                />
              </motion.div>
            ))}
            
            {/* Shimmer de Scroll Infinito */}
            {loadingMore && <PostSkeleton isDarkMode={isDarkMode} />}
            
            {/* Indicador de Fim do Feed */}
            {!hasMore && posts.length > 0 && (
              <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '20px 0' }}>
                Tu estás totalmente atualizado! 🌱 Nenhuma outra publicação encontrada.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Widgets / RightPanel (Escondido em Mobile e Responsivo) */}
      <div className="hidden xl:block">
        <RightPanel isDarkMode={isDarkMode} />
      </div>

      {/* Estilos CSS do Shimmer Loading */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, ${T.border} 25%, ${T.bgCardHover} 50%, ${T.border} 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
