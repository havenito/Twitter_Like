from flask import Blueprint, request, jsonify
from models.signalement import Signalement
from models.user import User
from models import db
from models.notification import Notification

bp_signalement = Blueprint('signalement', __name__)

@bp_signalement.route('/api/signalement', methods=['POST'])
def create_signalement():
    data = request.get_json()
    user_id = data.get('user_id')
    post_id = data.get('post_id')
    report_type = data.get('report_type')
    content = data.get('content')
    if not user_id or not content or not post_id or not report_type:
        return jsonify({'error': 'Missing fields'}), 400
    new_signalment = Signalement(
        user_id=user_id,
        post_id=post_id,
        report_type=report_type,
        content=content
    )
    db.session.add(new_signalment)
    db.session.commit()
    notify_user_on_new_signalement(new_signalment)

    return jsonify({'message': 'Signalement created successfully','signalement_id': new_signalment.id}), 201

def notify_user_on_new_signalement(signalement):
    try:
        signalement = Signalement.query.get(signalement.user_id)
        if signalement:
            notification = Notification(
                signalement_id=signalement.id,
                user_id=signalement.user_id,
                type="signalement"
            )
            db.session.add(notification)
            db.session.commit()

            print(f"Notification envoyée à l'utilisateur {signalement.user_id} pour un signalement")
        else:
            print("Erreur : Impossible de récupérer l'utilisateur lié au signalement.")
    except Exception as e:
        print(f"Erreur lors de la notification: {e}")


@bp_signalement.route('/api/signalement/<int:report_id>/status', methods=['PUT'])
def update_signalement_status(signalement_id):
    data = request.get_json()
    statut = data.get('statut')
    signalement = Signalement.query.get(signalement_id)
    if not signalement:
        return jsonify({'error': 'Signalement non trouvé'}), 404
    if statut :
        signalement.statut = statut
    db.session.commit()
    return jsonify({'message': 'Statut mis à jour'})

@bp_signalement.route('/api/signalements', methods=['GET'])
def get_signalements():
    signalements = Signalement.query.all()
    result = []
    for signalement in signalements:
        user = User.query.get(signalement.user_id)
        result.append({
            'id': signalement.id,
            'reported_user_id': signalement.user_id,
            'reported_user_pseudo': getattr(user, 'pseudo', None),
            'post_id': signalement.post_id,
            'report_type': signalement.report_type,
            'content': signalement.content,
            'statut': signalement.statut,
            'date_signalement': signalement.date_signalement.strftime('%Y-%m-%d %H:%M:%S') if hasattr(signalement, 'date_signalement') else '',
            'reported_user_warns': getattr(user, 'warn_count', 0) if user else 0,
            'reported_user_is_banned': getattr(user, 'is_banned', False) if user else False,
        })
    return jsonify(result), 200

@bp_signalement.route('/api/signalement', methods=['GET'])
def get_signalements_alias():
    return get_signalements()
