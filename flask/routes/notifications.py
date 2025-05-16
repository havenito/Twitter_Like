from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification

notifications_api = Blueprint('notifications_api', __name__)

@notifications_api.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.get_json()
    post_id = data.get('post_id')
    comments_id = data.get('comments_id')
    user_id = data.get('user_id')

    if not post_id or not comments_id or not user_id:
        return jsonify({'error': 'Post ID, Comments ID, and User ID are required'}), 400

    new_notification = Notification(post_id=post_id, comments_id=comments_id, user_id=user_id)
    db.session.add(new_notification)
    db.session.commit()

    return jsonify({'message': 'Notification created successfully', 'notification_id': new_notification.id}), 201
@notifications_api.route('/api/notifications', methods=['GET'])
def get_notifications():
    notifications = Notification.query.all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/<int:notification_id>', methods=['PUT'])
def update_notification(notification_id):
    data = request.get_json()
    post_id = data.get('post_id')
    comments_id = data.get('comments_id')
    user_id = data.get('user_id')

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    if post_id:
        notification.post_id = post_id
    if comments_id:
        notification.comments_id = comments_id
    if user_id:
        notification.user_id = user_id

    db.session.commit()

    return jsonify({'message': 'Notification updated successfully'}), 200
@notifications_api.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification deleted successfully'}), 200
@notifications_api.route('/api/notifications/<int:notification_id>', methods=['GET'])
def get_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    notification_data = {
        'id': notification.id,
        'post_id': notification.post_id,
        'comments_id': notification.comments_id,
        'user_id': notification.user_id
    }

    return jsonify({'notification': notification_data}), 200
@notifications_api.route('/api/notifications/user/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    notifications = Notification.query.filter_by(user_id=user_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/post/<int:post_id>', methods=['GET'])
def get_post_notifications(post_id):
    notifications = Notification.query.filter_by(post_id=post_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/comment/<int:comments_id>', methods=['GET'])
def get_comment_notifications(comments_id):
    notifications = Notification.query.filter_by(comments_id=comments_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/user/<int:user_id>/post/<int:post_id>', methods=['GET'])
def get_user_post_notifications(user_id, post_id):
    notifications = Notification.query.filter_by(user_id=user_id, post_id=post_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/user/<int:user_id>/comment/<int:comments_id>', methods=['GET'])
def get_user_comment_notifications(user_id, comments_id):
    notifications = Notification.query.filter_by(user_id=user_id, comments_id=comments_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/post/<int:post_id>/comment/<int:comments_id>', methods=['GET'])
def get_post_comment_notifications(post_id, comments_id):
    notifications = Notification.query.filter_by(post_id=post_id, comments_id=comments_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
@notifications_api.route('/api/notifications/user/<int:user_id>/post/<int:post_id>/comment/<int:comments_id>', methods=['GET'])
def get_user_post_comment_notifications(user_id, post_id, comments_id):
    notifications = Notification.query.filter_by(user_id=user_id, post_id=post_id, comments_id=comments_id).all()
    notifications_list = [{'id': notification.id, 'post_id': notification.post_id, 'comments_id': notification.comments_id, 'user_id': notification.user_id} for notification in notifications]
    
    return jsonify({'notifications': notifications_list}), 200
