from flask import Blueprint, jsonify
from models import db
from models.user import User
from datetime import datetime, timedelta
from flask import request

warn_bp = Blueprint('warn_bp', __name__)

@warn_bp.route('/api/warn/<int:user_id>', methods=['POST'])
def warn_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    user.warn_count = (user.warn_count or 0) + 1
    # Ban automatique si 3 warns
    if user.warn_count >= 3:
        user.is_banned = True
    db.session.commit()
    return jsonify({'message': 'Warn ajouté', 'warn_count': user.warn_count, 'is_banned': user.is_banned})

@warn_bp.route('/api/ban/<int:user_id>', methods=['POST'])
def ban_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    data = request.get_json() or {}
    duration = data.get('duration', 0)  # en jours, 0 = à vie

    user.is_banned = True
    if duration and int(duration) > 0:
        user.ban_until = datetime.utcnow() + timedelta(days=int(duration))
    else:
        user.ban_until = None  # ban à vie

    db.session.commit()
    return jsonify({'message': 'Utilisateur banni'})

@warn_bp.route('/api/unban/<int:user_id>', methods=['POST'])
def unban_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    user.is_banned = False
    user.ban_until = None
    db.session.commit()
    return jsonify({'message': 'Utilisateur débanni'})