from flask import Blueprint, request, jsonify, current_app, make_response
from models import db
from models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, decode_token, get_jwt_identity
from flask_mail import Message
from datetime import timedelta
import re
import os
from urllib.parse import quote
from services.file_upload import upload_file 

bcrypt = Bcrypt()
auth_bp = Blueprint('auth', __name__)

SUBSCRIPTION_TYPES = ['free', 'plus', 'premium']

# Pseudos réservés interdits
RESERVED_PSEUDOS = [
    'login', 'register', 'comment', 'edit-profile', 'favorites', 'followers', 
    'following', 'post', 'reply', 'foryou', 'message', 'home', 'polls', 
    'search', 'premium', 'api', 'auth', 'forgot-password', 'reset-password', 
    'notifications', 'admin', 'user', 'reports', 'dashboard', 'settings',
    'profile', 'about', 'help', 'support', 'contact', 'terms', 'privacy',
    'www', 'mail', 'email', 'ftp', 'blog', 'news', 'static', 'assets',
    'css', 'js', 'img', 'images', 'upload', 'download', 'test', 'demo'
]

def validate_subscription_type(subscription_type):
    """Valide que le type d'abonnement est autorisé par l'ENUM"""
    if subscription_type not in SUBSCRIPTION_TYPES:
        raise ValueError(f"Type d'abonnement invalide: {subscription_type}. Valeurs autorisées: {SUBSCRIPTION_TYPES}")
    return subscription_type

def validate_pseudo(pseudo):
    """Valide que le pseudo n'est pas réservé et respecte les critères"""
    if not pseudo:
        return "Le pseudo est requis."
    
    normalized_pseudo = pseudo.strip().lower()
    
    if normalized_pseudo in [reserved.lower() for reserved in RESERVED_PSEUDOS]:
        return f"Le pseudo '{pseudo}' est réservé et ne peut pas être utilisé."
    
    if len(pseudo) < 3:
        return "Le pseudo doit contenir au moins 3 caractères."
    
    if len(pseudo) > 30:
        return "Le pseudo ne peut pas dépasser 30 caractères."
    
    if not re.match(r'^[a-zA-Z0-9_.-]+$', pseudo):
        return "Le pseudo ne peut contenir que des lettres, chiffres, points, tirets et underscores."
    
    if pseudo.startswith(('.', '-', '_')) or pseudo.endswith(('.', '-', '_')):
        return "Le pseudo ne peut pas commencer ou finir par un point, tiret ou underscore."
    
    return None

# --- Password verification ---
def validate_password(password):
    if len(password) < 8:
        return "Le mot de passe doit contenir au moins 8 caractères."
    if not re.search(r'[A-Z]', password):
        return "Le mot de passe doit contenir au moins une lettre majuscule."
    if not re.search(r'[a-z]', password):
        return "Le mot de passe doit contenir au moins une lettre minuscule."
    if not re.search(r'[0-9]', password):
        return "Le mot de passe doit contenir au moins un chiffre."
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_-]', password):
        return "Le mot de passe doit contenir au moins un caractère spécial."
    return None

def validate_image_file(file, user_subscription, file_type='image'):
    """
    Valide un fichier image selon le type d'abonnement de l'utilisateur
    """
    if not file:
        return None, None
    
    # Vérifier que c'est bien un fichier image
    if not file.content_type or not file.content_type.startswith('image/'):
        return None, f"Le fichier doit être une image pour {file_type}."
    
    # Vérifier si c'est un GIF
    is_gif = file.content_type == 'image/gif'
    
    # Si c'est un GIF et que l'utilisateur n'a pas d'abonnement premium/plus
    if is_gif and user_subscription not in ['plus', 'premium']:
        return None, f"Les GIFs ne sont disponibles que pour les abonnements Plus et Premium. Votre {file_type} doit être une image statique (JPEG, PNG, WebP)."
    
    # Types d'images autorisés
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if user_subscription in ['plus', 'premium']:
        allowed_types.append('image/gif')
    
    if file.content_type not in allowed_types:
        if user_subscription in ['plus', 'premium']:
            return None, f"Format non supporté. Formats autorisés: JPEG, PNG, WebP, GIF."
        else:
            return None, f"Format non supporté. Formats autorisés: JPEG, PNG, WebP. Les GIFs sont réservés aux abonnements Plus et Premium."
    
    return file, None

@auth_bp.route('/api/users', methods=['POST'])
def create_user():
    profile_picture_to_save = None
    banner_image_to_save = None 
    data_source = None
    biography_data = None

    if request.content_type and 'multipart/form-data' in request.content_type:
        data_source = request.form
        email = data_source.get('email', '').strip().lower()
        password = data_source.get('password', '').strip()
        first_name = data_source.get('first_name', '').strip()
        last_name_data = data_source.get('last_name')
        last_name = last_name_data.strip() if isinstance(last_name_data, str) else last_name_data
        pseudo = data_source.get('pseudo', '').strip()
        biography_data = data_source.get('biography', '').strip() or None
        
        is_public_str = data_source.get('isPublic', 'true')
        private = not (is_public_str.lower() == 'true')
        
        roles = data_source.get('roles', 'user').strip()
        
        # Pour les nouveaux utilisateurs, l'abonnement par défaut est 'free'
        user_subscription = 'free'

        if 'profile_picture' in request.files:
            profile_picture_file = request.files['profile_picture']
            validated_file, error_msg = validate_image_file(profile_picture_file, user_subscription, 'photo de profil')
            if error_msg:
                return jsonify({'error': error_msg}), 400
            if validated_file:
                url, file_type = upload_file(validated_file)
                if url:
                    profile_picture_to_save = url
                else:
                    return jsonify({'error': 'Erreur lors du téléchargement de la photo de profil'}), 500
        
        if 'banner_image' in request.files: 
            banner_file = request.files['banner_image']
            validated_file, error_msg = validate_image_file(banner_file, user_subscription, 'bannière')
            if error_msg:
                return jsonify({'error': error_msg}), 400
            if validated_file:
                url, file_type = upload_file(validated_file)
                if url:
                    banner_image_to_save = url
                else:
                    return jsonify({'error': 'Erreur lors du téléchargement de la bannière'}), 500
    else:
        json_data = request.get_json()
        if not json_data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        data_source = json_data
        
        email = data_source.get('email', '').strip().lower()
        password = data_source.get('password', '').strip()
        first_name = data_source.get('first_name', '').strip()
        last_name_data = data_source.get('last_name')
        last_name = last_name_data.strip() if isinstance(last_name_data, str) else last_name_data
        profile_picture_to_save = data_source.get('profile_picture')
        banner_image_to_save = data_source.get('banner')
        pseudo = data_source.get('pseudo', '').strip()
        biography_data = data_source.get('biography', '').strip() or None
        private = data_source.get('private', False) 
        roles = data_source.get('roles', 'user').strip()

    if not all([email, password, first_name, pseudo]):
        return jsonify({'error': 'Les champs email, mot de passe, prénom et pseudo sont obligatoires'}), 400
    
    if pseudo_error := validate_pseudo(pseudo):
        return jsonify({'error': pseudo_error}), 400
    
    if err := validate_password(password):
        return jsonify({'error': err}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Un utilisateur avec cet email existe déjà'}), 400
    
    if User.query.filter_by(pseudo=pseudo).first():
        return jsonify({'error': 'Ce pseudo est déjà utilisé'}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    default_subscription = 'free'
    validate_subscription_type(default_subscription)
    
    new_user = User(
        email=email,
        password=hashed_password,
        roles=roles, 
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture_to_save,
        pseudo=pseudo, 
        private=private,
        biography=biography_data,
        banner=banner_image_to_save,
        subscription=default_subscription
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur créé avec succès', 
        'user_id': new_user.id,
        'profile_picture': new_user.profile_picture,
        'banner': new_user.banner,
        'subscription': new_user.subscription
    }), 201

@auth_bp.route('/api/upload', methods=['POST'])
def upload_profile_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        url, file_type = upload_file(file)
        if url:
            return jsonify({'url': url, 'type': file_type}), 200
        else:
            return jsonify({'error': 'Failed to upload file'}), 500
    return jsonify({'error': 'File processing error'}), 400

from datetime import datetime

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
            
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': "Aucun compte n'existe avec cet email."}), 401 

    # Vérification du ban temporaire
    if user.is_banned and user.ban_until:
        if datetime.utcnow() > user.ban_until:
            user.is_banned = False
            user.ban_until = None
            db.session.commit()

    if user.is_banned:
        # Message plus précis si ban temporaire
        if user.ban_until:
            return jsonify({'error': f'Votre compte est banni jusqu\'au {user.ban_until.strftime("%d/%m/%Y %H:%M:%S")}.'}), 403
        return jsonify({'error': 'Votre compte a été banni.'}), 403

    if user.password is None: 
        return jsonify({'error': 'Ce compte a été créé via un fournisseur externe (Google/GitHub). Veuillez vous connecter en utilisant le bouton correspondant.'}), 401

    if bcrypt.check_password_hash(user.password, password):
        user_data = {
            'id': user.id,
            'email': user.email,
            'roles': user.roles, 
            'first_name': user.first_name,
            'last_name': user.last_name,
            'pseudo': user.pseudo,
            'profile_picture': user.profile_picture,
            'private': user.private,
            'biography': user.biography,
            'banner': user.banner,
            'subscription': user.subscription_level 
        }
        return jsonify({'message': 'Connexion réussie', 'user': user_data}), 200
    else:
        return jsonify({'error': 'Mot de passe incorrect.'}), 401

@auth_bp.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    result = []
    
    for user_obj in users:
        result.append({
            'id': user_obj.id,
            'email': user_obj.email,
            'first_name': user_obj.first_name,
            'last_name': user_obj.last_name, 
            'roles': user_obj.roles,
            'profile_picture': user_obj.profile_picture,
            'pseudo': user_obj.pseudo,
            'private': user_obj.private,
            'created_at': user_obj.created_at.isoformat() if hasattr(user_obj, 'created_at') and user_obj.created_at else None,
            'updated_at': user_obj.updated_at.isoformat() if hasattr(user_obj, 'updated_at') and user_obj.updated_at else None,
            'banner': user_obj.banner,
            'subscription': user_obj.subscription
        })
    
    return jsonify(result)

@auth_bp.route('/api/users/<int:user_id>', methods=['PUT', 'OPTIONS'])
def update_user(user_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response
        
    user_to_update = User.query.get(user_id)
    if not user_to_update:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    profile_picture_url_to_set = user_to_update.profile_picture
    banner_image_url_to_set = user_to_update.banner
    data_source = None

    if request.content_type and 'multipart/form-data' in request.content_type:
        data_source = request.form
        
        user_subscription = user_to_update.subscription or 'free'
        
        if 'profile_picture' in request.files:
            profile_picture_file = request.files['profile_picture']
            validated_file, error_msg = validate_image_file(profile_picture_file, user_subscription, 'photo de profil')
            if error_msg:
                return jsonify({'error': error_msg}), 400
            if validated_file:
                url, file_type = upload_file(validated_file)
                if url:
                    profile_picture_url_to_set = url
                else:
                    return jsonify({'error': 'Erreur lors du téléchargement de la photo de profil'}), 500
        elif data_source.get('delete_profile_picture') == 'true':
            profile_picture_url_to_set = None

        if 'banner_image' in request.files:
            banner_file = request.files['banner_image']
            validated_file, error_msg = validate_image_file(banner_file, user_subscription, 'bannière')
            if error_msg:
                return jsonify({'error': error_msg}), 400
            if validated_file:
                url, file_type = upload_file(validated_file)
                if url:
                    banner_image_url_to_set = url
                else:
                    return jsonify({'error': 'Erreur lors du téléchargement de la bannière'}), 500
        elif data_source.get('delete_banner_image') == 'true':
            banner_image_url_to_set = None

    elif request.is_json:
        data_source = request.get_json()
        if not data_source:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
    else:
        return jsonify({'error': 'Type de contenu non supporté'}), 400

    if data_source:
        if 'first_name' in data_source:
            user_to_update.first_name = data_source['first_name']
        if 'last_name' in data_source:
            user_to_update.last_name = data_source['last_name']
        if 'pseudo' in data_source:
            new_pseudo = data_source['pseudo'].strip()
            if new_pseudo != user_to_update.pseudo:
                if pseudo_error := validate_pseudo(new_pseudo):
                    return jsonify({'error': pseudo_error}), 400
                if User.query.filter_by(pseudo=new_pseudo).first():
                    return jsonify({'error': 'Ce pseudo est déjà utilisé'}), 400
                user_to_update.pseudo = new_pseudo
        if 'biography' in data_source:
            user_to_update.biography = data_source['biography']
        if 'isPublic' in data_source:
            is_public = data_source['isPublic']
            if isinstance(is_public, str):
                user_to_update.private = not (is_public.lower() == 'true')
            else:
                user_to_update.private = not bool(is_public)
            
    user_to_update.profile_picture = profile_picture_url_to_set
    user_to_update.banner = banner_image_url_to_set 
    
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur mis à jour avec succès',
        'user': {
            'id': user_to_update.id,
            'first_name': user_to_update.first_name,
            'last_name': user_to_update.last_name,
            'pseudo': user_to_update.pseudo,
            'profile_picture': user_to_update.profile_picture,
            'banner': user_to_update.banner,
            'biography': user_to_update.biography,
            'private': user_to_update.private,
            'subscription': user_to_update.subscription
        }
    }), 200

@auth_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user_to_delete = User.query.get(user_id)
        if not user_to_delete:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        from models.subscription import Subscription
        subscriptions = Subscription.query.filter_by(user_id=user_id).all()
        for subscription in subscriptions:
            if subscription.stripe_subscription_id:
                try:
                    import stripe
                    import os
                    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
                    stripe.Subscription.cancel(subscription.stripe_subscription_id)
                except Exception as stripe_error:
                    print(f"Erreur lors de l'annulation de l'abonnement Stripe: {stripe_error}")
            
            db.session.delete(subscription)
        
        from models.like import Like
        likes = Like.query.filter_by(user_id=user_id).all()
        for like in likes:
            db.session.delete(like)
        
        from models.follow import Follow
        follows_as_follower = Follow.query.filter_by(follower_id=user_id).all()
        follows_as_followed = Follow.query.filter_by(followed_id=user_id).all()
        
        for follow in follows_as_follower + follows_as_followed:
            db.session.delete(follow)
        
        from models.comment import Comment
        comments = Comment.query.filter_by(user_id=user_id).all()
        for comment in comments:
            db.session.delete(comment)
        
        from models.reply import Reply
        replies = Reply.query.filter_by(user_id=user_id).all()
        for reply in replies:
            db.session.delete(reply)
        
        from models.post import Post
        from models.post_media import PostMedia
        posts = Post.query.filter_by(user_id=user_id).all()
        for post in posts:
            post_media = PostMedia.query.filter_by(post_id=post.id).all()
            for media in post_media:
                db.session.delete(media)
            
            post_likes = Like.query.filter_by(post_id=post.id).all()
            for like in post_likes:
                db.session.delete(like)
            
            post_comments = Comment.query.filter_by(post_id=post.id).all()
            for comment in post_comments:
                comment_replies = Reply.query.filter_by(comment_id=comment.id).all()
                for reply in comment_replies:
                    db.session.delete(reply)
                db.session.delete(comment)
            
            db.session.delete(post)
        
        db.session.delete(user_to_delete)
        db.session.commit()
        
        return jsonify({'message': 'Utilisateur et toutes ses données supprimés avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la suppression de l'utilisateur: {e}")
        return jsonify({'error': f'Erreur lors de la suppression: {str(e)}'}), 500

@auth_bp.route('/api/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid or missing JSON data'}), 400
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé."}), 200

    if user.password is None:
        return jsonify({'error': 'Ce compte a été créé via un fournisseur externe (Google/GitHub). La réinitialisation de mot de passe n\'est pas applicable.'}), 400

    reset_token = create_access_token(
        identity=str(user.id), 
        expires_delta=timedelta(minutes=15),
        additional_claims={'reset_password': True}
    )
    
    reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password?token={quote(reset_token)}"

    msg = Message(
        subject="Réinitialisation de votre mot de passe Minouverse",
        recipients=[user.email],
        body=f"Bonjour {user.first_name or user.pseudo},\n\n"
             f"Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :\n{reset_url}\n\n"
             f"Ce lien expirera dans 15 minutes.\n\n"
             f"Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\n"
             f"L'équipe Minouverse"
    )
    try:
        mail_ext = current_app.extensions.get('mail')
        if not mail_ext:
            current_app.logger.error("Flask-Mail extension not initialized.")
            return jsonify({'error': "Erreur de configuration du service d'email."}), 500
        mail_ext.send(msg)
        return jsonify({'message': 'Un lien de réinitialisation a été envoyé à votre adresse email.'}), 200
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi de l'email de réinitialisation : {e}")
        return jsonify({'error': "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard."}), 500

@auth_bp.route('/api/reset-password', methods=['POST'])
def reset_password_with_token(): 
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid or missing JSON data'}), 400
        
    token = data.get('token')
    new_password = data.get('new_password', '').strip()

    if not token or not new_password:
        return jsonify({'error': 'Token et nouveau mot de passe requis'}), 400

    if err := validate_password(new_password):
        return jsonify({'error': err}), 400

    try:
        decoded_token = decode_token(token)
        if not decoded_token.get('reset_password'):
            return jsonify({'error': 'Token invalide ou non destiné à la réinitialisation du mot de passe'}), 401
        
        user_id = decoded_token['sub'] 
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'Utilisateur introuvable ou token invalide'}), 404
        
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        return jsonify({'message': 'Mot de passe mis à jour avec succès'}), 200

    except Exception as e: 
        current_app.logger.error(f"Erreur lors de la réinitialisation du mot de passe : {e}")
        return jsonify({'error': 'Token invalide, expiré ou une erreur est survenue'}), 401

@auth_bp.route('/api/users/profile/<string:pseudo>', methods=['GET'])
def get_user_by_pseudo(pseudo):
    user = User.query.filter_by(pseudo=pseudo).first()
    
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    from models.follow import Follow
    followers_count = Follow.query.filter_by(followed_id=user.id).count()
    following_count = Follow.query.filter_by(follower_id=user.id).count()
    
    from models.post import Post
    from models.post_media import PostMedia
    
    user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.published_at.desc()).all()
    posts = []
    media = []
    
    for post in user_posts:
        post_media_list = PostMedia.query.filter_by(post_id=post.id).all()
        post_media = []
        
        for media_item in post_media_list:
            media_data = {
                'id': media_item.id,
                'url': media_item.media_url,
                'type': media_item.media_type,
                'created_at': media_item.created_at.isoformat() if media_item.created_at else None
            }
            post_media.append(media_data)
            
            media.append(media_data)
        
        post_data = {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'published_at': post.published_at.isoformat() if post.published_at else None,
            'media': post_media,
            'category_id': post.category_id,
            'user_id': post.user_id
        }
        posts.append(post_data)
    
    likes = []
    
    result = {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'roles': user.roles,
        'profile_picture': user.profile_picture,
        'pseudo': user.pseudo,
        'private': user.private,
        'biography': user.biography,
        'banner': user.banner,
        'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
        'updated_at': user.updated_at.isoformat() if hasattr(user, 'updated_at') and user.updated_at else None,
        'followers_count': followers_count,
        'following_count': following_count,
        'posts': posts,
        'media': media,
        'likes': likes,
        'subscription': user.subscription_level
    }
    
    return jsonify(result)

@auth_bp.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """Récupérer un utilisateur par son ID"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        return jsonify({
            'id': user.id,
            'pseudo': user.pseudo,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture,
            'biography': user.biography,
            'private': user.private,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@auth_bp.route('/api/users/<int:user_id>/comments-replies', methods=['GET'])
def get_user_comments_and_replies(user_id):
    """Récupérer tous les commentaires et réponses d'un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        from models.comment import Comment
        from models.reply import Reply
        from models.post import Post
        from models.comment_media import CommentMedia
        from models.reply_media import ReplyMedia
        from models.comment_like import CommentLike
        from models.reply_like import ReplyLike
        
        comments_and_replies = []
        
        comments = Comment.query.filter_by(user_id=user_id).order_by(Comment.created_at.desc()).all()
        
        for comment in comments:
            original_post = Post.query.get(comment.post_id)
            original_post_data = None
            
            if original_post:
                post_user = User.query.get(original_post.user_id)
                original_post_data = {
                    'id': original_post.id,
                    'title': original_post.title,
                    'content': original_post.content,
                    'user': {
                        'id': post_user.id if post_user else None,
                        'pseudo': post_user.pseudo if post_user else None,
                        'first_name': post_user.first_name if post_user else None,
                        'last_name': post_user.last_name if post_user else None,
                        'profile_picture': post_user.profile_picture if post_user else None
                    } if post_user else None
                }
            
            comment_media = CommentMedia.query.filter_by(comment_id=comment.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in comment_media]
            
            likes_count = CommentLike.query.filter_by(comment_id=comment.id).count()
            replies_count = Reply.query.filter_by(comment_id=comment.id).count()
            
            comments_and_replies.append({
                'id': comment.id,
                'type': 'comment',
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'media': media,
                'likes_count': likes_count,
                'replies_count': replies_count,
                'originalPost': original_post_data
            })
        
        replies = Reply.query.filter_by(user_id=user_id).order_by(Reply.created_at.desc()).all()
        
        for reply in replies:
            original_post_data = None
            
            if reply.comment_id:
                original_comment = Comment.query.get(reply.comment_id)
                if original_comment:
                    original_post = Post.query.get(original_comment.post_id)
                    if original_post:
                        post_user = User.query.get(original_post.user_id)
                        original_post_data = {
                            'id': original_post.id,
                            'title': original_post.title,
                            'content': original_post.content,
                            'user': {
                                'id': post_user.id if post_user else None,
                                'pseudo': post_user.pseudo if post_user else None,
                                'first_name': post_user.first_name if post_user else None,
                                'last_name': post_user.last_name if post_user else None,
                                'profile_picture': post_user.profile_picture if post_user else None
                            } if post_user else None
                        }
            elif reply.replies_id:
                def find_original_post(reply_obj):
                    if reply_obj.comment_id:
                        comment = Comment.query.get(reply_obj.comment_id)
                        return Post.query.get(comment.post_id) if comment else None
                    elif reply_obj.replies_id:
                        parent_reply = Reply.query.get(reply_obj.replies_id)
                        return find_original_post(parent_reply) if parent_reply else None
                    return None
                
                original_post = find_original_post(reply)
                if original_post:
                    post_user = User.query.get(original_post.user_id)
                    original_post_data = {
                        'id': original_post.id,
                        'title': original_post.title,
                        'content': original_post.content,
                        'user': {
                            'id': post_user.id if post_user else None,
                            'pseudo': post_user.pseudo if post_user else None,
                            'first_name': post_user.first_name if post_user else None,
                            'last_name': post_user.last_name if post_user else None,
                            'profile_picture': post_user.profile_picture if post_user else None
                        } if post_user else None
                    }
            
            reply_media = ReplyMedia.query.filter_by(replies_id=reply.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in reply_media]
            
            likes_count = ReplyLike.query.filter_by(replies_id=reply.id).count()
            sub_replies_count = Reply.query.filter_by(replies_id=reply.id).count()
            
            comments_and_replies.append({
                'id': reply.id,
                'type': 'reply',
                'content': reply.content,
                'created_at': reply.created_at.isoformat(),
                'media': media,
                'likes_count': likes_count,
                'replies_count': sub_replies_count,
                'originalPost': original_post_data
            })
        
        comments_and_replies.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({'commentsAndReplies': comments_and_replies}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500