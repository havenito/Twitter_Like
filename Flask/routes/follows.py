from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from models.follow import Follow
from datetime import datetime
from models.notification import Notification

follows_api = Blueprint('follows_api', __name__)

# Route pour récupérer les utilisateurs qu'une personne suit (following)
@follows_api.route('/api/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    try:
        # Vérifier si l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'user_id': user_id,
                'following_count': 0,
                'following': [],
                'message': 'Utilisateur non trouvé'
            }), 200
        
        # Récupérer tous les utilisateurs que cette personne suit (statut accepté uniquement)
        following_relationships = Follow.query.filter_by(
            follower_id=user_id, 
            status='accepted'
        ).all()
        
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
                    'private': followed_user.private,
                    'subscription': followed_user.subscription,
                    'followed_at': relationship.created_at.isoformat() if hasattr(relationship, 'created_at') else None
                })
        
        return jsonify({
            'user_id': user_id,
            'following_count': len(following_list),
            'following': following_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des abonnements: {str(e)}'}), 500

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
                'message': 'Utilisateur non trouvé'
            }), 200
        
        # Récupérer tous les utilisateurs qui suivent cette personne (statut accepté uniquement)
        follower_relationships = Follow.query.filter_by(
            followed_id=user_id,
            status='accepted'
        ).all()
        
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
                    'private': follower_user.private,
                    'subscription': follower_user.subscription,
                    'followed_at': relationship.created_at.isoformat() if hasattr(relationship, 'created_at') else None
                })
        
        return jsonify({
            'user_id': user_id,
            'followers_count': len(followers_list),
            'followers': followers_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des abonnés: {str(e)}'}), 500

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
                'status': True,
                'follow_status': relationship.status,
                'is_pending': relationship.status == 'pending',
                'is_accepted': relationship.status == 'accepted',
                'can_view_private_content': relationship.status == 'accepted'
            }), 200
        else:
            return jsonify({
                'status': False,
                'follow_status': None,
                'is_pending': False,
                'is_accepted': False,
                'can_view_private_content': False
            }), 200
        
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
            
        # Vérifier que l'utilisateur ne se suit pas lui-même
        if follower_id == followed_id:
            return jsonify({'error': 'Vous ne pouvez pas vous suivre vous-même'}), 400
            
        # Vérifier si les utilisateurs existent
        follower = User.query.get(follower_id)
        followed = User.query.get(followed_id)
        
        if not follower or not followed:
            return jsonify({'error': 'Un ou plusieurs utilisateurs non trouvés'}), 404
            
        # Vérifier si la relation existe déjà
        existing_follow = Follow.query.filter_by(
            follower_id=follower_id,
            followed_id=followed_id
        ).first()
        
        if existing_follow:
            if existing_follow.status == 'pending':
                return jsonify({
                    'message': 'Demande de suivi déjà en attente',
                    'follow': {
                        'follower_id': follower_id,
                        'followed_id': followed_id,
                        'status': 'pending'
                    }
                }), 200
            elif existing_follow.status == 'accepted':
                return jsonify({
                    'message': 'Vous suivez déjà cet utilisateur',
                    'follow': {
                        'follower_id': follower_id,
                        'followed_id': followed_id,
                        'status': 'accepted'
                    }
                }), 200
            
        # Vérifier si le compte est privé
        if followed.private:
            new_follow = Follow(
                follower_id=follower_id,
                followed_id=followed_id,
                status='pending'
            )
            db.session.add(new_follow)
            db.session.commit()

            notify_user_on_follow_request(new_follow)
            return jsonify({
                'message': 'Demande de suivi envoyée avec succès',
                'follow': {
                    'follower_id': follower_id,
                    'followed_id': followed_id,
                    'status': 'pending'
                }
            }), 201
        else:
            new_follow = Follow(
                follower_id=follower_id,
                followed_id=followed_id,
                status='accepted'
            )
            db.session.add(new_follow)
            db.session.commit()

            notify_user_on_new_follow(new_follow)
            return jsonify({
                'message': 'Utilisateur suivi avec succès',
                'follow': {
                    'follower_id': follower_id,
                    'followed_id': followed_id,
                    'status': 'accepted'
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
        
        # Supprimer les notifications associées
        notifications = Notification.query.filter_by(follow_id=follow.id).all()
        for notification in notifications:
            db.session.delete(notification)
            
        # Supprimer la relation de suivi
        db.session.delete(follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Vous ne suivez plus cet utilisateur',
            'unfollowed': {
                'follower_id': follower_id,
                'followed_id': followed_id
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

# Route pour accepter ou rejeter une demande de suivi
@follows_api.route('/api/follows/<int:follow_id>/<action>', methods=['PUT'])
def handle_follow_request(follow_id, action):
    try:
        follow = Follow.query.get(follow_id)
        if not follow:
            return jsonify({'error': 'Relation de suivi non trouvée'}), 404

        if action not in ['accept', 'reject']:
            return jsonify({'error': 'Action non valide'}), 400

        if follow.status != 'pending':
            return jsonify({'error': 'Cette demande a déjà été traitée'}), 400

        if action == 'accept':
            follow.status = 'accepted'
            db.session.commit()
            
            # Supprimer la notification de demande de suivi
            notification = Notification.query.filter_by(
                follow_id=follow_id, 
                type='follow_request'
            ).first()
            if notification:
                db.session.delete(notification)
            
            # Créer une notification d'acceptation
            notify_user_on_accept_follow_request(follow)
            
            # Créer une notification de type "follow" pour le suivi accepté
            notify_user_on_new_follow(follow)

            return jsonify({
                'message': 'Demande de suivi acceptée avec succès',
                'follow': {
                    'id': follow.id,
                    'follower_id': follow.follower_id,
                    'followed_id': follow.followed_id,
                    'status': 'accepted'
                }
            }), 200

        else:  # action == 'reject'
            # Supprimer la notification de demande de suivi
            notification = Notification.query.filter_by(
                follow_id=follow_id, 
                type='follow_request'
            ).first()
            if notification:
                db.session.delete(notification)
            
            # Supprimer la relation de suivi
            db.session.delete(follow)
            db.session.commit()

            return jsonify({
                'message': 'Demande de suivi rejetée avec succès'
            }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue: {str(e)}'}), 500

# Fonctions de notification
def notify_user_on_accept_follow_request(follow):
    try:
        followed_user = User.query.get(follow.followed_id)
        follower_user = User.query.get(follow.follower_id)
        if not followed_user or not follower_user:
            print("Erreur : Utilisateur suivi ou follower introuvable.")
            return
        
        notification = Notification(
            user_id=follower_user.id,
            follow_id=follow.id,
            type="follow_request_accepted"
        )
        db.session.add(notification)
        db.session.commit()
        print(f"Notification acceptation d'une invitation envoyée à {follower_user.pseudo}.")
    except Exception as e:
        print(f"Erreur lors de la notification d'acceptation de demande de suivi: {e}")
    
def notify_user_on_follow_request(follow):
    try:
        followed_user = User.query.get(follow.followed_id)
        follower_user = User.query.get(follow.follower_id)

        if not followed_user or not follower_user:
            print("Erreur : Utilisateur suivi ou follower introuvable.")
            return

        notification = Notification(
            user_id=followed_user.id,
            follow_id=follow.id,
            type="follow_request"
        )

        db.session.add(notification)
        db.session.commit()

        print(f"Notification de demande de suivi envoyée à {followed_user.pseudo}.")

    except Exception as e:
        print(f"Erreur lors de la notification de demande de suivi: {e}")

def notify_user_on_new_follow(follow):
    try:
        followed_user = User.query.get(follow.followed_id) 
        follower_user = User.query.get(follow.follower_id) 

        if not followed_user or not follower_user:
            print("Erreur : Utilisateur suivi ou follower introuvable.")
            return

        notification = Notification(
            post_id=None, 
            comments_id=None,  
            user_id=follow.followed_id,
            replie_id=None,  
            follow_id=follow.id,
            type="follow"  
        )

        db.session.add(notification)
        db.session.commit()

        print(f"Notification envoyée à {followed_user.pseudo} : {follower_user.pseudo} vient de vous suivre.")

    except Exception as e:
        print(f"Erreur lors de la notification de suivi: {e}")