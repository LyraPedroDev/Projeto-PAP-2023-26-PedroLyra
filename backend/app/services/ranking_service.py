from ..models.user import Usuario, UserStats

LEGACY_EXCLUDED_EMAILS = {
    'teste@eco.com',
    'maria@email.com',
    'joao@email.com',
    'ana@email.com',
}

DISPLAY_NAME_BY_EMAIL = {
    'pedro@gmail.com': 'Pedro',
    'gabriel@gmail.com': 'Gabriel',
    'carla@gmail.com': 'Carla',
    'admin@ecochat.com': 'Admin',
}


def get_ranking() -> list:
    usuarios = Usuario.query.all()

    ranking = []
    for usuario in usuarios:
        if usuario.email in LEGACY_EXCLUDED_EMAILS:
            continue
        if bool(usuario.is_admin):
            continue

        stats = UserStats.query.filter_by(user_id=usuario.id).first()
        if stats:
            ranking.append({
                "id": usuario.id,
                "nome": DISPLAY_NAME_BY_EMAIL.get(usuario.email, usuario.nome),
                "pontos": stats.pontos,
                "nivel": stats.nivel,
                "tarefas_completas": stats.tarefas_completas,
            })

    ranking.sort(key=lambda x: x['pontos'], reverse=True)

    for i, user in enumerate(ranking):
        user['posicao'] = i + 1

    return ranking
