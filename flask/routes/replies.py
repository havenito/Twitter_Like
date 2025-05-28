from flask import Blueprint, request, jsonify
from models import db
from models.replie import Replie
from models.post import Post
from models.comment import Comment
from models.notification import Notification

replies_api = Blueprint('replies_api', __name__)

@replies_api.route('/api/replies', methods=['POST'])
def create_replie():
    data = request.get_json()
    content = data.get('content')
    comment_id = data.get('comment_id')
    user_id = data.get('user_id')

    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    new_replie = Replie(content=content, comment_id=comment_id, user_id=user_id)
    db.session.add(new_replie)
    db.session.commit()
    notify_user_on_new_reply(new_replie)
    return jsonify({'message': 'Replie created successfully', 'replie_id': new_replie.id}), 201

def notify_user_on_new_reply(reply):
    # Récupérer le commentaire associé à cette réponse
    comment = Comment.query.get(reply.comment_id)
    if not comment:
        print("Commentaire introuvable pour la réponse donnée.")
        return

    # Récupérer le post associé à ce commentaire
    post = Post.query.get(comment.post_id)
    if not post:
        print("Post introuvable pour le commentaire donné.")
        return

    # Utilisateurs à notifier : créateur du post + créateur du commentaire
    users_to_notify = set([post.user_id, comment.user_id])

    for user_id in users_to_notify:
        notification = Notification(
            post_id=post.id,
            comments_id=comment.id,
            user_id=user_id,
        )
        db.session.add(notification)

    db.session.commit()
    print(f"Notifications créées pour les utilisateurs {users_to_notify} suite à un nouveau reply.")




@replies_api.route('/api/replies', methods=['GET'])
def get_replies():
    replies = Replie.query.all()
    replies_list = [{'id': replie.id, 'content': replie.content, 'comment_id': replie.comment_id, 'user_id': replie.user_id} for replie in replies]
    
    return jsonify({'replies': replies_list}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['PUT'])
def update_replie(replie_id):
    data = request.get_json()
    content = data.get('content')

    replie = Replie.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Replie not found'}), 404

    if content:
        replie.content = content

    db.session.commit()

    return jsonify({'message': 'Replie updated successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['DELETE'])
def delete_replie(replie_id):
    replie = Replie.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Replie not found'}), 404

    db.session.delete(replie)
    db.session.commit()

    return jsonify({'message': 'Replie deleted successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['GET'])
def get_replie(replie_id):
    replie = Replie.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Replie not found'}), 404

    replie_data = {
        'id': replie.id,
        'content': replie.content,
        'comment_id': replie.comment_id,
        'user_id': replie.user_id
    }

    return jsonify({'replie': replie_data}), 200

@replies_api.route('/api/replies/<int:replie_id>/comments', methods=['GET'])
def get_replie_comments(replie_id):
    replie = Replie.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Replie not found'}), 404

    comments = replie.comments
    comments_list = [{'id': comment.id, 'content': comment.content, 'created_at': comment.created_at} for comment in comments]
    
    return jsonify({'comments': comments_list}), 200