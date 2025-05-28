from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from models.follow import Follow
from datetime import datetime

follows_api = Blueprint('follows_api', __name__)

# Route pour récupérer les utilisateurs qu'une personne suit (following)
@follows_api.route('/api/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    try:
        # Vérifier si l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            # Au lieu de retourner une erreur 404, retourner une liste vide
            return jsonify({
                'user_id': user_id,
                'following_count': 0,
                'following': [],
                'message': 'Utilisateur non trouvé, liste vide retournée'
            }), 200
        
        # Récupérer tous les utilisateurs que cette personne suit
        following_relationships = Follow.query.filter_by(follower_id=user_id).all()
        
        following_list = []
        for relationship in following_relationships:
            followed_user = User.query.get(relationship.followed_id)
            if followed_user:
                following_list.append({
                    'id': followed_user.id,
                    'username': followed_user.username if hasattr(followed_user, 'username') else None,
                    'email': followed_user.email,
                    'profile_picture': followed_user.profile_picture if hasattr(followed_user, 'profile_picture') else None
                })
        
        return jsonify({
            'user_id': user_id,
            'following_count': len(following_list),
            'following': following_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

# Route pour récupérer les utilisateurs qui suivent une personne (followers)
@follows_api.route('/api/users/<int:user_id>/followers', methods=['GET'])
def get_followers(user_id):
    try:
        # Vérifier si l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'user_id': user_id,
                'followers_count': 0,
                'followers': [],
                'message': 'Utilisateur non trouvé, liste vide retournée'
            }), 200
        
        # Récupérer tous les utilisateurs qui suivent cette personne
        follower_relationships = Follow.query.filter_by(followed_id=user_id).all()
        
        followers_list = []
        for relationship in follower_relationships:
            follower_user = User.query.get(relationship.follower_id)
            if follower_user:
                followers_list.append({
                    'id': follower_user.id,
                    'username': follower_user.username if hasattr(follower_user, 'username') else None,
                    'email': follower_user.email,
                    'profile_picture': follower_user.profile_picture if hasattr(follower_user, 'profile_picture') else None
                })
        
        return jsonify({
            'user_id': user_id,
            'followers_count': len(followers_list),
            'followers': followers_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

# Fonction pour vérifier si un utilisateur en suit un autre
@follows_api.route('/api/users/<int:follower_id>/follows/<int:followed_id>', methods=['GET'])
def check_follow_status(follower_id, followed_id):
    try:
        # Vérifier si les deux utilisateurs existent
        follower = User.query.get(follower_id)
        followed = User.query.get(followed_id)
        
        if not follower or not followed:
            return jsonify({'error': 'Un ou plusieurs utilisateurs non trouvés'}), 404
        
        # Vérifier si la relation de suivi existe
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

# Route pour suivre un utilisateur
@follows_api.route('/api/follows', methods=['POST'])
def follow_user():
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        # Vérifier que les IDs sont fournis
        if not follower_id or not followed_id:
            return jsonify({'error': 'Les IDs follower_id et followed_id sont requis'}), 400
        
        # Vérifier que l'utilisateur ne tente pas de se suivre lui-même
        if follower_id == followed_id:
            return jsonify({'error': 'Un utilisateur ne peut pas se suivre lui-même'}), 400
            
        # Vérifier que les deux utilisateurs existent
        follower = User.query.get(follower_id)
        followed = User.query.get(followed_id)
        
        if not follower or not followed:
            return jsonify({'error': 'Un ou plusieurs utilisateurs n\'existent pas'}), 404
            
        # Vérifier si la relation existe déjà
        existing_follow = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if existing_follow:
            return jsonify({'message': 'Cette relation de suivi existe déjà'}), 200
            
        # Créer la nouvelle relation de suivi
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

# Route pour arrêter de suivre un utilisateur
@follows_api.route('/api/follows', methods=['DELETE'])
def unfollow_user():
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        # Vérifier que les IDs sont fournis
        if not follower_id or not followed_id:
            return jsonify({'error': 'Les IDs follower_id et followed_id sont requis'}), 400
            
        # Rechercher la relation de suivi
        follow = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if not follow:
            return jsonify({'error': 'Relation de suivi non trouvée'}), 404
            
        # Supprimer la relation de suivi
        db.session.delete(follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Relation de suivi supprimée avec succès'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500



