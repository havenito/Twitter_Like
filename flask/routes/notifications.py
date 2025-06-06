from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification
from models.user import User
from models.post import Post
from models.comment import Comment
from models.follow import Follow
from models.replie import Replie  
from models.signalement import Signalement  

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
                'replie_id': notification.replie_id,
                'follow_id': notification.follow_id,
                'user_id': notification.user_id,
                'type': notification.type,
                'date': notification.date.isoformat() if notification.date else None
            }

            # Récupérer les informations selon le type de notification
            if notification.type == "post" and notification.post_id:
                post = Post.query.get(notification.post_id)
                if post:
                    notification_data['post_title'] = post.title
                    notification_data['post_content'] = post.content

            if notification.type == "comment" and notification.comments_id:
                comment = Comment.query.get(notification.comments_id)
                if comment:
                    notification_data['comment_content'] = comment.content
                    notification_data['post_id'] = comment.post_id  

            if notification.type == "reply" and notification.replie_id:
                replie = Replie.query.get(notification.replie_id)
                if replie:
                    notification_data['replie_content'] = replie.content
                    notification_data['comment_id'] = replie.comment_id  

            if notification.type in ["follow", "follow_request","follow_request_accepted"] and notification.follow_id:
                follow = Follow.query.get(notification.follow_id)
                if follow:
                    follower_user = User.query.get(follow.follower_id)
                    if follower_user:
                        notification_data.update({
                            'follower_user': follower_user.pseudo,
                            'follower_id': follower_user.id
                        })
            if notification.type == "signalement" and notification.signalement_id:
                signalement = Signalement.query.get(notification.signalement_id)
                if signalement:
                    notification_data['signalement_content'] = signalement.content
                    notification_data['signalement_id'] = signalement.id
                    notification_data['report_type'] = signalement.report_type

            result.append(notification_data)

        return jsonify(result)

    except Exception as e:
        print(f"Erreur lors de la récupération des notifications: {e}")  
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500    

@notifications_api.route('/api/user_notifications/<int:user_id>', methods=['DELETE'])
def delete_all_user_notifications(user_id):
    try:
        notifications = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.type != 'follow_request'
        ).all()

        if not notifications:
            return jsonify({'message': 'No notifications to delete'}), 200

        for notification in notifications:
            db.session.delete(notification)

        db.session.commit()
        return jsonify({'message': 'All non-follow-request notifications deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
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
                'replie_id': notification.replie_id,
                'follow_id': notification.follow_id,
                'user_id': notification.user_id,
                'type': notification.type,
                'date': notification.date.isoformat() if notification.date else None
            }

            # Gestion des types de notifications
            if notification.type == "post" and notification.post_id:
                post = Post.query.get(notification.post_id)
                if post:
                    notification_data['post_title'] = post.title
                    notification_data['post_content'] = post.content

            if notification.type == "comment" and notification.comments_id:
                comment = Comment.query.get(notification.comments_id)
                if comment:
                    notification_data['comment_content'] = comment.content
                    notification_data['post_id'] = comment.post_id

            if notification.type == "reply" and notification.replie_id:
                replie = Replie.query.get(notification.replie_id)
                if replie:
                    notification_data['replie_content'] = replie.content
                    notification_data['comment_id'] = replie.comment_id

            if notification.type in ["follow", "follow_request","follow_request_accepted"] and notification.follow_id:
                follow = Follow.query.get(notification.follow_id)
                if follow:
                    follower_user = User.query.get(follow.follower_id)
                    if follower_user:
                        notification_data.update({
                            'follower_user': follower_user.pseudo,
                            'follower_id': follower_user.id
                        })

            if notification.type == "signalement" and notification.signalement_id:
                signalement = Signalement.query.get(notification.signalement_id)
                if signalement:
                    notification_data['signalement_content'] = signalement.content
                    notification_data['signalement_id'] = signalement.id
                    notification_data['report_type'] = signalement.report_type
                    post = Post.query.get(signalement.post_id)
                    if post:
                        notification_data['post_title'] = post.title
            result.append(notification_data)

        return jsonify(result)

    except Exception as e:
        print(f"Erreur lors de la récupération de toutes les notifications: {e}")
        return jsonify({'error': f'Failed to fetch all notifications: {str(e)}'}), 500
