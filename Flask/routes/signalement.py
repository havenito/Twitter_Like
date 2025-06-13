from flask import Blueprint, request, jsonify
from models.signalement import Signalement
from models.user import User
from models import db

bp_signalement = Blueprint('signalement', __name__)

@bp_signalement.route('/api/signalement', methods=['POST'])
def create_signalement():
    data = request.json
    user_id = data.get('user_id')
    post_id = data.get('post_id')
    reported_user_id = data.get('reported_user_id')
    comment_id = data.get('comment_id')
    report_type = data.get('report_type')
    content = data.get('content')
    if not user_id or not content or not report_type:
        return jsonify({'error': 'Missing fields'}), 400
    signalement = Signalement(
        user_id=user_id,
        post_id=post_id,
        reported_user_id=reported_user_id,
        comment_id=comment_id,
        report_type=report_type,
        content=content
    )
    db.session.add(signalement)
    db.session.commit()
    return jsonify({'message': 'Signalement envoyé'}), 201

@bp_signalement.route('/api/signalement/<int:report_id>/status', methods=['PUT'])
def update_signalement_status(report_id):
    data = request.get_json()
    statut = data.get('statut')
    signalement = Signalement.query.get(report_id)
    if not signalement:
        return jsonify({'error': 'Signalement non trouvé'}), 404
    signalement.statut = statut
    db.session.commit()
    return jsonify({'message': 'Statut mis à jour'})

@bp_signalement.route('/api/signalement', methods=['GET'])
def get_signalements():
    signalements = Signalement.query.all()
    result = []
    for s in signalements:
        user = User.query.get(s.user_id)
        result.append({
            'id': s.id,
            'reported_user_id': s.user_id,
            'reported_user_pseudo': getattr(user, 'pseudo', None),
            'post_id': s.post_id,
            'report_type': s.report_type,
            'content': s.content,
            'statut': s.statut,
            'date_signalement': s.date_signalement.strftime('%Y-%m-%d %H:%M:%S') if hasattr(s, 'date_signalement') else '',
            'reported_user_warns': getattr(user, 'warn_count', 0) if user else 0,
            'reported_user_is_banned': getattr(user, 'is_banned', False) if user else False,
        })
    return jsonify(result)

@bp_signalement.route('/api/signalements', methods=['GET'])
def get_signalements_alias():
    return get_signalements()