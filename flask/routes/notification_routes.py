from flask import Blueprint, request, jsonify
from models import db, Notifications

notification_api = Blueprint('notification_api', __name__)

@notification_api.route('/notifications', methods=['GET'])
def get_notifications():
    notifications = Notifications.query.all()
    return jsonify([notification.to_dict() for notification in notifications])

@notification_api.route('/notifications/<int:id>', methods=['GET'])
def get_notification(id):
    notification = Notifications.query.get_or_404(id)
    return jsonify(notification.to_dict())

@notification_api.route('/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    new_notification = Notifications(
        post_id=data['post_id'],
        comments_id=data['comments_id'],
        user_id=data['user_id'],
        date=data['date']
    )
    db.session.add(new_notification)
    db.session.commit()
    return jsonify(new_notification.to_dict()), 201

@notification_api.route('/notifications/<int:id>', methods=['PUT'])
def update_notification(id):
    data = request.get_json()
    notification = Notifications.query.get_or_404(id)
    notification.post_id = data['post_id']
    notification.comments_id = data['comments_id']
    notification.user_id = data['user_id']
    notification.date = data['date']
    db.session.commit()
    return jsonify(notification.to_dict())

@notification_api.route('/notifications/<int:id>', methods=['DELETE'])
def delete_notification(id):
    notification = Notifications.query.get_or_404(id)
    db.session.delete(notification)
    db.session.commit()
    return '', 204
