import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, UserPlus, Trash2, Users, Check, X, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface Friend {
  id: number;
  nome: string;
  email: string;
}

interface PendingRequest {
  amizade_id: number;
  id: number;
  nome: string;
  email: string;
}

interface FriendsSectionProps {
  userId: number;
  onOpenChat?: (friendId: number, friendName: string) => void;
}

export function FriendsSection({ userId, onOpenChat }: FriendsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addValue, setAddValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadFriends = async () => {
    try {
      const res = await fetch(`/api/friends/${userId}`);
      if (!res.ok) throw new Error("Erro");
      const data: Friend[] = await res.json();
      setFriends(data);
    } catch (err) {
      console.error("Erro ao carregar amigos:", err);
      toast.error("Erro ao carregar amigos");
    }
  };

  const loadPending = async () => {
    try {
      const res = await fetch(`/api/friends/pending/${userId}`);
      if (!res.ok) throw new Error("Erro");
      const data: PendingRequest[] = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Erro ao carregar pendentes:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([loadFriends(), loadPending()]);
        setLoading(false);
      };
      loadData();
    }
  }, [userId]);

  const addFriend = async () => {
    if (!addValue.trim()) {
      toast.error("Digite email, nome ou ID");
      return;
    }

    try {
      setIsAdding(true);
      const alvo = isNaN(Number(addValue)) ? addValue : Number(addValue);

      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, alvo }),
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        toast.success(data.mensagem || "Pedido enviado!");
        setAddValue("");
        loadFriends();
      } else {
        toast.error(data.erro || "Erro ao adicionar");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao enviar convite");
    } finally {
      setIsAdding(false);
    }
  };

  const acceptRequest = async (friendId: number) => {
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, friend_id: friendId }),
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        toast.success("Amizade aceita! 🎉");
        await Promise.all([loadFriends(), loadPending()]);
      } else {
        toast.error(data.erro || "Erro ao aceitar");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao aceitar pedido");
    }
  };

  const declineRequest = async (friendId: number) => {
    try {
      const res = await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, friend_id: friendId }),
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        toast.info("Pedido recusado");
        loadPending();
      } else {
        toast.error(data.erro || "Erro ao recusar");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao recusar pedido");
    }
  };

  const removeFriend = async (friendId: number) => {
    if (!confirm("Remover este amigo?")) return;

    try {
      const res = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, friend_id: friendId }),
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        toast.success("Amigo removido");
        loadFriends();
      } else {
        toast.error(data.erro || "Erro ao remover");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao remover amigo");
    }
  };

  // Abrir chat com amigo
  const openChat = (friend: Friend) => {
    if (onOpenChat) {
      onOpenChat(friend.id, friend.nome);
    } else {
      toast.info(`Chat com ${friend.nome} — Em desenvolvimento 🚧`);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex items-center gap-3"
      >
        <Users className="text-green-600 dark:text-green-400" size={32} />
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-300">Amigos</h1>
      </motion.div>

      {/* 🎨 ADICIONAR AMIGO - BOTÃO COM ESTILO FORÇADO */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <UserPlus size={20} className="text-green-600 dark:text-green-400" />
            Adicionar Amigo
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Digite email, nome ou ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="email@exemplo.com, Nome ou ID"
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
              disabled={isAdding}
              className="flex-1"
            />
            {/* 🎨 BOTÃO COM CORES FORÇADAS */}
            <button
              onClick={addFriend}
              disabled={isAdding}
              style={{
                padding: '0 24px',
                height: '40px',
                backgroundColor: isAdding ? '#9ca3af' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => !isAdding && (e.currentTarget.style.backgroundColor = '#15803d')}
              onMouseLeave={(e) => !isAdding && (e.currentTarget.style.backgroundColor = '#16a34a')}
            >
              {isAdding ? "Enviando..." : "Adicionar"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* PEDIDOS PENDENTES */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              Pedidos Pendentes ({pendingRequests.length})
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Pessoas que querem ser suas amigas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-yellow-300 dark:border-yellow-700 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-700 dark:text-yellow-300 font-bold text-lg">
                    {req.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{req.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate hidden md:block">{req.email}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                      title="Aceitar pedido"
                    >
                      <Check size={22} strokeWidth={3} />
                    </button>

                    <button
                      onClick={() => declineRequest(req.id)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      title="Recusar pedido"
                    >
                      <X size={22} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BUSCAR */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              placeholder="Buscar amigos..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardContent>
      </Card>

      {/* 🔥 LISTA DE AMIGOS - COM BOTÃO DE CHAT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Meus Amigos</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {friends.length === 0 ? "Nenhum amigo ainda" : `${friends.length} amigos`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? "Nenhum amigo encontrado" : "Sua lista está vazia"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <div 
                  key={friend.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold">
                    {friend.nome.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{friend.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate hidden md:block">{friend.email}</p>
                  </div>

                  {/* 🔥 BOTÕES: CHAT + REMOVER */}
                  <div className="flex gap-2">
                    {/* BOTÃO CHAT - AZUL */}
                    <button
                      onClick={() => openChat(friend)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      title={`Chat com ${friend.nome}`}
                    >
                      <MessageCircle size={20} />
                    </button>

                    {/* BOTÃO REMOVER - VERMELHO */}
                    <button
                      onClick={() => removeFriend(friend.id)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      title="Remover amigo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}