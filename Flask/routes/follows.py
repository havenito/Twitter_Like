from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.follow import Follow

follows_api = Blueprint('follows_api', __name__)

@follows_api.route('/api/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'user_id': user_id,
                'following_count': 0,
                'following': [],
                'message': 'Utilisateur non trouvé'
            }), 200
        
        following_relationships = Follow.query.filter_by(follower_id=user_id).all()
        
        following_list = []
        for relationship in following_relationships:
            followed_user = User.query.get(relationship.followed_id)
            if followed_user:
                following_list.append({
                    'id': followed_user.id,
                    'pseudo': followed_user.pseudo,
                    'first_name': followed_user.first_name,
                    'last_name': followed_user.last_name,
                    'profile_picture': followed_user.profile_picture,
                    'private': followed_user.private
                })
        
        return jsonify({
            'user_id': user_id,
            'following_count': len(following_list),
            'following': following_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

@follows_api.route('/api/users/<int:user_id>/followers', methods=['GET'])
def get_followers(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'user_id': user_id,
                'followers_count': 0,
                'followers': [],
                'message': 'Utilisateur non trouvé'
            }), 200
        
        follower_relationships = Follow.query.filter_by(followed_id=user_id).all()
        
        followers_list = []
        for relationship in follower_relationships:
            follower_user = User.query.get(relationship.follower_id)
            if follower_user:
                followers_list.append({
                    'id': follower_user.id,
                    'pseudo': follower_user.pseudo,
                    'first_name': follower_user.first_name,
                    'last_name': follower_user.last_name,
                    'profile_picture': follower_user.profile_picture,
                    'private': follower_user.private
                })
        
        return jsonify({
            'user_id': user_id,
            'followers_count': len(followers_list),
            'followers': followers_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

@follows_api.route('/api/users/<int:follower_id>/follows/<int:followed_id>', methods=['GET'])
def check_follow_status(follower_id, followed_id):
    try:
        follower = User.query.get(follower_id)
        followed = User.query.get(followed_id)
        
        if not follower or not followed:
            return jsonify({'error': 'Un ou plusieurs utilisateurs non trouvés'}), 404
        
        relationship = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if relationship:
            return jsonify({
                'status': True
            }), 200
        else:
            return jsonify({'status': False}), 200
        
    except Exception as e:
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500


@follows_api.route('/api/follows', methods=['POST'])
def follow_user():
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        if not follower_id or not followed_id:
            return jsonify({'error': 'Les IDs follower_id et followed_id sont requis'}), 400
        
        if follower_id == followed_id:
            return jsonify({'error': 'Un utilisateur ne peut pas se suivre lui-même'}), 400
            
        follower = User.query.get(follower_id)
        followed = User.query.get(followed_id)
        
        if not follower or not followed:
            return jsonify({'error': 'Un ou plusieurs utilisateurs n\'existent pas'}), 404
            
        existing_follow = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if existing_follow:
            return jsonify({'message': 'Cette relation de suivi existe déjà'}), 200
            
        new_follow = Follow(
            follower_id=follower_id,
            followed_id=followed_id,
        )
        
        db.session.add(new_follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Relation de suivi créée avec succès',
            'follow': {
                'follower_id': follower_id,
                'followed_id': followed_id,
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

@follows_api.route('/api/follows', methods=['DELETE'])
def unfollow_user():
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        if not follower_id or not followed_id:
            return jsonify({'error': 'Les IDs follower_id et followed_id sont requis'}), 400
            
        follow = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if not follow:
            return jsonify({'error': 'Relation de suivi non trouvée'}), 404
            
        db.session.delete(follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Relation de suivi supprimée avec succès'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500