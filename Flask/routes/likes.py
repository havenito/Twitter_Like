from flask import Blueprint, request, jsonify
from models import db
from models.like import Like
from models.post import Post
from models.user import User
from models.category import Category

likes_bp = Blueprint('likes', __name__)

@likes_bp.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    """Toggle like sur un post"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
            
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post non trouvé'}), 404
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
        
        if existing_like:
            db.session.delete(existing_like)
            db.session.commit()
            
            likes_count = Like.query.filter_by(post_id=post_id).count()
            
            return jsonify({
                'message': 'Like retiré',
                'liked': False,
                'likes_count': likes_count
            }), 200
        else:
            new_like = Like(user_id=user_id, post_id=post_id)
            db.session.add(new_like)
            db.session.commit()
            
            likes_count = Like.query.filter_by(post_id=post_id).count()
            
            return jsonify({
                'message': 'Post liké',
                'liked': True,
                'likes_count': likes_count
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@likes_bp.route('/api/posts/<int:post_id>/likes', methods=['GET'])
def get_post_likes(post_id):
    """Obtenir les likes d'un post"""
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post non trouvé'}), 404
            
        likes = Like.query.filter_by(post_id=post_id).all()
        likes_count = len(likes)
        
        users_who_liked = []
        for like in likes:
            user = User.query.get(like.user_id)
            if user:
                users_who_liked.append({
                    'id': user.id,
                    'pseudo': user.pseudo,
                    'profile_picture': user.profile_picture
                })
        
        return jsonify({
            'post_id': post_id,
            'likes_count': likes_count,
            'users': users_who_liked
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@likes_bp.route('/api/users/<int:user_id>/posts/<int:post_id>/like-status', methods=['GET'])
def check_like_status(user_id, post_id):
    """Vérifier si un utilisateur a liké un post"""
    try:
        like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
        return jsonify({
            'liked': like is not None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@likes_bp.route('/api/users/<int:user_id>/likes', methods=['GET'])
def get_user_likes(user_id):
    """Obtenir les posts likés par un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        likes = Like.query.filter_by(user_id=user_id).order_by(Like.id.desc()).all()
        
        liked_posts = []
        for like in likes:
            post = Post.query.get(like.post_id)
            if post:
                post_user = User.query.get(post.user_id)
                
                from models.post_media import PostMedia
                media_list = PostMedia.query.filter_by(post_id=post.id).all()
                media = [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type
                } for m in media_list]
                
                category = None
                if post.category_id:
                    from models.category import Category
                    cat = Category.query.get(post.category_id)
                    if cat:
                        category = {
                            'id': cat.id,
                            'name': cat.name,
                            'description': cat.description
                        }
                
                from models.comment import Comment
                comments_count = Comment.query.filter_by(post_id=post.id).count()
                
                likes_count = Like.query.filter_by(post_id=post.id).count()
                
                liked_posts.append({
                    'id': post.id,
                    'title': post.title,
                    'content': post.content,
                    'publishedAt': post.published_at.isoformat() if post.published_at else None,
                    'media': media,
                    'likes': likes_count,
                    'comments': comments_count,
                    'category': category,
                    'user': {
                        'id': post_user.id if post_user else None,
                        'pseudo': post_user.pseudo if post_user else None,
                        'firstName': post_user.first_name if post_user else None,
                        'lastName': post_user.last_name if post_user else None,
                        'profilePicture': post_user.profile_picture if post_user else None
                    } if post_user else None
                })
        
        return jsonify({'likes': liked_posts}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500