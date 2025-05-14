from flask import Blueprint, request, jsonify
from models import db, Comments

comment_api = Blueprint('comment_api', __name__)

@comment_api.route('/comments', methods=['GET'])
def get_comments():
    comments = Comments.query.all()
    return jsonify([comment.to_dict() for comment in comments])

@comment_api.route('/comments/<int:id>', methods=['GET'])
def get_comment(id):
    comment = Comments.query.get_or_404(id)
    return jsonify(comment.to_dict())

@comment_api.route('/comments', methods=['POST'])
def create_comment():
    data = request.get_json()
    new_comment = Comments(
        content=data['content'],
        created_at=data['created_at'],
        status=data['status'],
        user_id=data['user_id'],
        post_id=data['post_id'],
        comment_id=data.get('comment_id')
    )
    db.session.add(new_comment)
    db.session.commit()
    return jsonify(new_comment.to_dict()), 201

@comment_api.route('/comments/<int:id>', methods=['PUT'])
def update_comment(id):
    data = request.get_json()
    comment = Comments.query.get_or_404(id)
    comment.content = data['content']
    comment.created_at = data['created_at']
    comment.status = data['status']
    comment.user_id = data['user_id']
    comment.post_id = data['post_id']
    comment.comment_id = data.get('comment_id')
    db.session.commit()
    return jsonify(comment.to_dict())

@comment_api.route('/comments/<int:id>', methods=['DELETE'])
def delete_comment(id):
    comment = Comments.query.get_or_404(id)
    db.session.delete(comment)
    db.session.commit()
    return '', 204
