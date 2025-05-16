from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification
from models.user import User
from models.post import Post
from models.comment import Comment

notifications_api = Blueprint('notifications_api', __name__)

# Obtenir toutes les notifications (admin ou debug)
@notifications_api.route('/api/notifications', methods=['GET'])
def get_all_notifications():
    notifications = Notification.query.all()
    notifications_list = [
        {
            'id': n.id,
            'post_id': n.post_id,
            'comments_id': n.comments_id,
            'user_id': n.user_id
        } for n in notifications
    ]
    return jsonify({'notifications': notifications_list}), 200

# Obtenir toutes les notifications d'un utilisateur
@notifications_api.route('/api/notifications/user/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    notifications = Notification.query.filter_by(user_id=user_id).all()
    notifications_list = [
        {
            'id': n.id,
            'post_id': n.post_id,
            'comments_id': n.comments_id,
            'user_id': n.user_id
        } for n in notifications
    ]
    return jsonify({'notifications': notifications_list}), 200

# Supprimer une notification (autorisé pour l'utilisateur destinataire uniquement)
@notifications_api.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()
    return jsonify({'message': 'Notification deleted successfully'}), 200

# Obtenir une notification précise
@notifications_api.route('/api/notifications/<int:notification_id>', methods=['GET'])
def get_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    return jsonify({
        'notification': {
            'id': notification.id,
            'post_id': notification.post_id,
            'comments_id': notification.comments_id,
            'user_id': notification.user_id
        }
    }), 200

# Fonction utilitaire à appeler lors de la création d'un post ou d'un commentaire
def create_notifications_on_event(creator_id, post_id=None, comment_id=None):
    all_users = User.query.all()
    for user in all_users:
        if user.id != creator_id:
            notif = Notification(
                user_id=user.id,
                post_id=post_id,
                comments_id=comment_id
            )
            db.session.add(notif)
    db.session.commit()

# NOTE : Pas de route POST ni PUT exposée pour éviter toute création ou modification manuelle
