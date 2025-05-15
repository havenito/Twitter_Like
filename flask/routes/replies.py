from flask import Blueprint, request, jsonify
from models import db
from models.replie import Replie

replies_api = Blueprint('replies_api', __name__)

@replies_api.route('/api/replies', methods=['GET'])
def get_replies():
    try:
        replies = Replie.query.all()
        return jsonify([reply.to_dict() for reply in replies])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch replies: {str(e)}'}), 500

@replies_api.route('/api/replies/<int:id>', methods=['GET'])
def get_reply(id):
    try:
        reply = Replie.query.get_or_404(id)
        return jsonify(reply.to_dict())
    except Exception as e:
        return jsonify({'error': f'Reply not found: {str(e)}'}), 404

@replies_api.route('/api/replies', methods=['POST'])
def create_reply():
    try:
        data = request.get_json()
        new_reply = Replie(
            comment_id=data['comment_id'],
            user_id=data['user_id'],
            content=data['content'],
            created_at=data['created_at']
        )
        db.session.add(new_reply)
        db.session.commit()
        return jsonify({'message': 'Reply created successfully', 'reply_id': new_reply.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create reply: {str(e)}'}), 500

@replies_api.route('/api/replies/<int:id>', methods=['PUT'])
def update_reply(id):
    try:
        data = request.get_json()
        reply = Replie.query.get_or_404(id)

        if 'comment_id' in data:
            reply.comment_id = data['comment_id']

        if 'user_id' in data:
            reply.user_id = data['user_id']

        if 'content' in data:
            reply.content = data['content']

        if 'created_at' in data:
            reply.created_at = data['created_at']

        db.session.commit()
        return jsonify({
            'message': 'Reply updated successfully',
            'reply': {
                'id': reply.id,
                'comment_id': reply.comment_id,
                'user_id': reply.user_id,
                'content': reply.content,
                'created_at': reply.created_at
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update reply: {str(e)}'}), 500

@replies_api.route('/api/replies/<int:id>', methods=['DELETE'])
def delete_reply(id):
    try:
        reply = Replie.query.get_or_404(id)
        db.session.delete(reply)
        db.session.commit()
        return jsonify({'message': 'Reply deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete reply: {str(e)}'}), 500
