from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification

notification_api = Blueprint('notification_api', __name__)

@notification_api.route('/api/notifications', methods=['GET'])
def get_notifications():
    try:
        notifications = Notification.query.all()
        return jsonify([notification.to_dict() for notification in notifications])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500

@notification_api.route('/api/notifications/<int:id>', methods=['GET'])
def get_notification(id):
    try:
        notification = Notification.query.get_or_404(id)
        return jsonify(notification.to_dict())
    except Exception as e:
        return jsonify({'error': f'Notification not found: {str(e)}'}), 404

@notification_api.route('/api/notifications', methods=['POST'])
def create_notification():
    try:
        data = request.get_json()
        new_notification = Notification(
            post_id=data['post_id'],
            comments_id=data['comments_id'],
            user_id=data['user_id'],
            date=data['date']
        )
        db.session.add(new_notification)
        db.session.commit()
        return jsonify({'message': 'Notification created successfully', 'notification_id': new_notification.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create notification: {str(e)}'}), 500

@notification_api.route('/api/notifications/<int:id>', methods=['PUT'])
def update_notification(id):
    try:
        data = request.get_json()
        notification = Notification.query.get_or_404(id)

        if 'post_id' in data:
            notification.post_id = data['post_id']

        if 'comments_id' in data:
            notification.comments_id = data['comments_id']

        if 'user_id' in data:
            notification.user_id = data['user_id']

        if 'date' in data:
            notification.date = data['date']

        db.session.commit()
        return jsonify({
            'message': 'Notification updated successfully',
            'notification': {
                'id': notification.id,
                'post_id': notification.post_id,
                'comments_id': notification.comments_id,
                'user_id': notification.user_id,
                'date': notification.date
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update notification: {str(e)}'}), 500

@notification_api.route('/api/notifications/<int:id>', methods=['DELETE'])
def delete_notification(id):
    try:
        notification = Notification.query.get_or_404(id)
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'message': 'Notification deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 500
