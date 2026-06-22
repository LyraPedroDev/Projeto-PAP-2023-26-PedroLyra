from ..models.tasks import Tarefa, TarefaUsuario
from ..models.user import UserStats
from ..extensions import db
from .gamification_service import adicionar_pontos, atualizar_streak, calcular_nivel
from datetime import datetime, timedelta


def _periodo_atual(categoria: str) -> tuple[datetime, datetime] | None:
    agora = datetime.now()

    if categoria == "daily":
        inicio = agora.replace(hour=0, minute=0, second=0, microsecond=0)
        fim = inicio + timedelta(days=1)
        return inicio, fim

    if categoria == "weekly":
        inicio = agora.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=agora.weekday())
        fim = inicio + timedelta(days=7)
        return inicio, fim

    if categoria == "monthly":
        inicio = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if inicio.month == 12:
            proximo_mes = inicio.replace(year=inicio.year + 1, month=1)
        else:
            proximo_mes = inicio.replace(month=inicio.month + 1)
        fim = proximo_mes.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return inicio, fim

    return None


def _query_conclusao_periodo(user_id: int, tarefa_id: int, categoria: str):
    query = TarefaUsuario.query.filter_by(user_id=user_id, tarefa_id=tarefa_id)
    periodo = _periodo_atual(categoria)

    if periodo is None:
        return query

    inicio, fim_exclusivo = periodo
    return query.filter(
        TarefaUsuario.completada_em >= inicio,
        TarefaUsuario.completada_em < fim_exclusivo
    )


def get_user_tasks(user_id: int) -> list:
    todas_tarefas = Tarefa.query.all()

    tarefas = []
    for t in todas_tarefas:
        concluida_no_periodo = _query_conclusao_periodo(user_id, t.id, t.categoria).first() is not None
        tarefas.append({
            "id": t.id, "titulo": t.titulo, "descricao": t.descricao,
            "pontos": t.pontos, "categoria": t.categoria, "icone": t.icone,
            "completada": concluida_no_periodo,
        })

    return tarefas


def completar_tarefa(user_id: int, tarefa_id: int):
    tarefa = Tarefa.query.get(tarefa_id)
    if not tarefa:
        return None, "Tarefa não encontrada"

    if _query_conclusao_periodo(user_id, tarefa_id, tarefa.categoria).first():
        return None, "Tarefa já foi completada"

    db.session.add(TarefaUsuario(user_id=user_id, tarefa_id=tarefa_id))

    stats = UserStats.query.filter_by(user_id=user_id).first()
    novo_nivel = None

    if stats:
        novo_nivel = adicionar_pontos(stats, tarefa.pontos)
        stats.tarefas_completas += 1
        atualizar_streak(stats)

    db.session.commit()

    return {
        "sucesso": True,
        "mensagem": f"Parabéns! +{tarefa.pontos} pontos",
        "novos_pontos": stats.pontos if stats else 0,
        "nivel": stats.nivel if stats else "Eco Iniciante",
        "novo_nivel": novo_nivel,
        "streak": stats.streak_atual if stats else 1,
    }, None


def desmarcar_tarefa(user_id: int, tarefa_id: int):
    tarefa = Tarefa.query.get(tarefa_id)
    if not tarefa:
        return None, "Tarefa não encontrada"

    tarefa_usuario = (
        _query_conclusao_periodo(user_id, tarefa_id, tarefa.categoria)
        .order_by(TarefaUsuario.completada_em.desc())
        .first()
    )
    if not tarefa_usuario:
        return None, "Tarefa não estava completada"

    db.session.delete(tarefa_usuario)

    stats = UserStats.query.filter_by(user_id=user_id).first()
    if stats and tarefa:
        stats.pontos = max(0, stats.pontos - tarefa.pontos)
        stats.tarefas_completas = max(0, stats.tarefas_completas - 1)
        stats.nivel = calcular_nivel(stats.pontos)

    db.session.commit()

    return {
        "sucesso": True,
        "mensagem": "Tarefa desmarcada",
        "novos_pontos": stats.pontos if stats else 0,
    }, None
