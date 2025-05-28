from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification
from models.user import User
from models.post import Post
from models.comment import Comment

notifications_api = Blueprint('notifications_api', __name__)

@notifications_api.route('/api/user_notifications/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    try:
        notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.date.desc()).all()

        result = []
        for notification in notifications:
            notification_data = {
                'id': notification.id,
                'post_id': notification.post_id,
                'comments_id': notification.comments_id,
                'user_id': notification.user_id,
                'date': notification.date.isoformat() if notification.date else None
            }

            if notification.post_id:
                post = Post.query.get(notification.post_id)
                if post:
                    notification_data['post_title'] = post.title
                    notification_data['post_content'] = post.content

            if notification.comments_id:
                comment = Comment.query.get(notification.comments_id)
                if comment:
                    notification_data['comment_content'] = comment.content

            result.append(notification_data)

        return jsonify(result)

    except Exception as e:
        print(f"Erreur lors de la récupération des notifications: {e}")  # log serveur
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500
    


    

@notifications_api.route('/api/user_notifications/<int:user_id>', methods=['DELETE'])
def delete_all_user_notifications(user_id):
    try:
        notifications = Notification.query.filter_by(user_id=user_id).all()
        if not notifications:
            return jsonify({'message': 'No notifications to delete'}), 200

        for notification in notifications:
            db.session.delete(notification)

        db.session.commit()
        return jsonify({'message': 'All notifications deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete notifications: {str(e)}'}), 500


@notifications_api.route('/api/user_notifications/<int:user_id>/<int:notification_id>', methods=['DELETE'])
def delete_user_notification(user_id, notification_id):
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404

        db.session.delete(notification)
        db.session.commit()

        return jsonify({'message': 'Notification deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 500

@notifications_api.route('/api/notifications', methods=['GET'])
def get_all_notifications():
    try:
        notifications = Notification.query.order_by(Notification.date.desc()).all()

        result = []
        for notification in notifications:
            notification_data = {
                'id': notification.id,
                'post_id': notification.post_id,
                'comments_id': notification.comments_id,
                'user_id': notification.user_id,
                'date': notification.date.isoformat() if notification.date else None
            }

            if notification.post_id:
                post = Post.query.get(notification.post_id)
                if post:
                    notification_data['post_title'] = post.title
                    notification_data['post_content'] = post.content

            if notification.comments_id:
                comment = Comment.query.get(notification.comments_id)
                if comment:
                    notification_data['comment_content'] = comment.content

            result.append(notification_data)

        return jsonify(result)

    except Exception as e:
        print(f"Erreur lors de la récupération de toutes les notifications: {e}")
        return jsonify({'error': f'Failed to fetch all notifications: {str(e)}'}), 500
