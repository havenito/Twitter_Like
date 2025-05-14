from flask import Blueprint, request, jsonify
from models import db, Replies

replie_api = Blueprint('replie_api', __name__)

@replie_api.route('/replies', methods=['GET'])
def get_replies():
    replies = Replies.query.all()
    return jsonify([reply.to_dict() for reply in replies])

@replie_api.route('/replies/<int:id>', methods=['GET'])
def get_reply(id):
    reply = Replies.query.get_or_404(id)
    return jsonify(reply.to_dict())

@replie_api.route('/replies', methods=['POST'])
def create_reply():
    data = request.get_json()
    new_reply = Replies(
        comment_id=data['comment_id'],
        user_id=data['user_id'],
        content=data['content'],
        created_at=data['created_at']
    )
    db.session.add(new_reply)
    db.session.commit()
    return jsonify(new_reply.to_dict()), 201

@replie_api.route('/replies/<int:id>', methods=['PUT'])
def update_reply(id):
    data = request.get_json()
    reply = Replies.query.get_or_404(id)
    reply.comment_id = data['comment_id']
    reply.user_id = data['user_id']
    reply.content = data['content']
    reply.created_at = data['created_at']
    db.session.commit()
    return jsonify(reply.to_dict())

@replie_api.route('/replies/<int:id>', methods=['DELETE'])
def delete_reply(id):
    reply = Replies.query.get_or_404(id)
    db.session.delete(reply)
    db.session.commit()
    return '', 204
