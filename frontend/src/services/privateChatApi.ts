const BASE = '';

/** Opções comuns — credentials: 'include' envia o cookie de sessão Flask */
const OPTS: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

export interface Conversation {
  friend: { id: number; nome: string; email: string };
  last_message: string;
  last_at: string;
  unread_count: number;
}

export interface PrivateMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_nome: string | null;
}

/**
 * GET /api/private-chat/conversations
 * Retorna as conversas recentes do utilizador logado.
 */
export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/api/private-chat/conversations`, OPTS);
  if (!res.ok) throw new Error('Erro ao carregar conversas');
  return res.json();
}

/**
 * GET /api/private-chat/messages/<friendId>
 * Retorna o histórico com um amigo e marca mensagens como lidas.
 */
export async function getMessages(friendId: number): Promise<PrivateMessage[]> {
  const res = await fetch(`${BASE}/api/private-chat/messages/${friendId}`, OPTS);
  if (!res.ok) throw new Error('Erro ao carregar mensagens');
  return res.json();
}
