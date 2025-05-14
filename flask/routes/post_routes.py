from flask import Blueprint, request, jsonify
from models import db, Post

post_api = Blueprint('post_api', __name__)

@post_api.route('/posts', methods=['GET'])
def get_posts():
    posts = Post.query.all()
    return jsonify([post.to_dict() for post in posts])

@post_api.route('/posts/<int:id>', methods=['GET'])
def get_post(id):
    post = Post.query.get_or_404(id)
    return jsonify(post.to_dict())

@post_api.route('/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    new_post = Post(
        title=data['title'],
        content=data['content'],
        published_at=data['published_at'],
        media_url=data['media_url'],
        media_type=data['media_type'],
        post_id=data.get('post_id'),  # Optional field
        user_id=data['user_id'],
        category_id=data['category_id']
    )
    db.session.add(new_post)
    db.session.commit()
    return jsonify(new_post.to_dict()), 201

@post_api.route('/posts/<int:id>', methods=['PUT'])
def update_post(id):
    data = request.get_json()
    post = Post.query.get_or_404(id)
    post.title = data['title']
    post.content = data['content']
    post.published_at = data['published_at']
    post.media_url = data['media_url']
    post.media_type = data['media_type']
    post.post_id = data.get('post_id')
    post.user_id = data['user_id']
    post.category_id = data['category_id']
    db.session.commit()
    return jsonify(post.to_dict())

@post_api.route('/posts/<int:id>', methods=['DELETE'])
def delete_post(id):
    post = Post.query.get_or_404(id)
    db.session.delete(post)
    db.session.commit()
    return '', 204
