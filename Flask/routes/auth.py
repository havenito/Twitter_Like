from flask import Blueprint, request, jsonify, current_app
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

@auth_bp.route('/api/users', methods=['POST'])
def create_user():
    profile_picture_to_save = None
    data_source = None

    if request.content_type and 'multipart/form-data' in request.content_type:
        data_source = request.form
        email = data_source.get('email', '').strip().lower()
        password = data_source.get('password', '').strip()
        first_name = data_source.get('first_name', '').strip()
        last_name_data = data_source.get('last_name')
        last_name = last_name_data.strip() if isinstance(last_name_data, str) else last_name_data
        pseudo = data_source.get('pseudo', '').strip()
        
        is_public_str = data_source.get('isPublic', 'true')
        private = not (is_public_str.lower() == 'true')
        
        roles = data_source.get('roles', 'user').strip()

        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                uploaded_url, _ = upload_file(file)
                if uploaded_url:
                    profile_picture_to_save = uploaded_url
    else:
        json_data = request.get_json()
        if not json_data:
            return jsonify({'error': 'Invalid or missing JSON data'}), 400
        data_source = json_data
        
        email = data_source.get('email', '').strip().lower()
        password = data_source.get('password', '').strip()
        first_name = data_source.get('first_name', '').strip()
        last_name_data = data_source.get('last_name')
        last_name = last_name_data.strip() if isinstance(last_name_data, str) else last_name_data
        profile_picture_to_save = data_source.get('profile_picture')
        pseudo = data_source.get('pseudo', '').strip()
        private = data_source.get('private', False) 
        roles = data_source.get('roles', 'user').strip()

    if not all([email, password, first_name, pseudo]):
        return jsonify({'error': 'Les champs email, mot de passe, prénom et pseudo sont obligatoires'}), 400
    
    if err := validate_password(password):
        return jsonify({'error': err}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email déjà enregistré'}), 400
    
    if User.query.filter_by(pseudo=pseudo).first():
        return jsonify({'error': 'Pseudo déjà utilisé'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        email=email,
        password=hashed_password,
        roles=roles, 
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture_to_save,
        pseudo=pseudo, 
        private=private
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur créé avec succès', 
        'user_id': new_user.id,
        'profile_picture': new_user.profile_picture
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
            'private': user.private 
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
            'updated_at': user_obj.updated_at.isoformat() if hasattr(user_obj, 'updated_at') and user_obj.updated_at else None
        })
    
    return jsonify(result)

@auth_bp.route('/api/users/<int:user_id>', methods=['PUT', 'OPTIONS'])
def update_user(user_id):
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OPTIONS request successful'})
        response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        return response, 200
        
    user_to_update = User.query.get(user_id)
    if not user_to_update:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    profile_picture_url_to_set = user_to_update.profile_picture
    data_source = None

    if request.content_type and 'multipart/form-data' in request.content_type:
        data_source = request.form
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                uploaded_url, _ = upload_file(file)
                if uploaded_url:
                    profile_picture_url_to_set = uploaded_url
    elif request.is_json:
        data_source = request.get_json()
        if not data_source:
             return jsonify({'error': 'Invalid or missing JSON data'}), 400
        if 'profile_picture' in data_source:
            profile_picture_url_to_set = data_source.get('profile_picture')
    else:
        return jsonify({'error': 'Unsupported content type or no data provided'}), 415

    if data_source:
        if 'email' in data_source and data_source.get('email', '').strip():
            new_email = data_source.get('email').strip().lower()
            if new_email != user_to_update.email:
                existing_user = User.query.filter(User.email == new_email, User.id != user_id).first()
                if existing_user:
                    return jsonify({'error': 'Email déjà enregistré par un autre utilisateur'}), 400
                user_to_update.email = new_email

        if 'first_name' in data_source:
            user_to_update.first_name = data_source.get('first_name', '').strip()
        if 'last_name' in data_source:
            user_to_update.last_name = data_source.get('last_name', '').strip()
        if 'password' in data_source and data_source.get('password', '').strip():
            new_password = data_source.get('password').strip()
            if err := validate_password(new_password):
                return jsonify({'error': err}), 400
            user_to_update.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        if 'pseudo' in data_source:
            new_pseudo = data_source.get('pseudo', '').strip()
            if new_pseudo != user_to_update.pseudo:
                if new_pseudo:
                    existing_user_pseudo = User.query.filter(User.pseudo == new_pseudo, User.id != user_id).first()
                    if existing_user_pseudo:
                        return jsonify({'error': 'Pseudo déjà utilisé par un autre utilisateur'}), 409
                user_to_update.pseudo = new_pseudo

        if request.is_json:
            if 'private' in data_source:
                user_to_update.private = bool(data_source.get('private'))
        elif 'isPublic' in data_source:
            is_public_str = data_source.get('isPublic')
            user_to_update.private = not (is_public_str.lower() == 'true')

    user_to_update.profile_picture = profile_picture_url_to_set
    
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur mis à jour avec succès',
        'user': {
            'id': user_to_update.id,
            'email': user_to_update.email,
            'first_name': user_to_update.first_name,
            'last_name': user_to_update.last_name,
            'roles': user_to_update.roles,
            'profile_picture': user_to_update.profile_picture,
            'pseudo': user_to_update.pseudo,
            'private': user_to_update.private
        }
    }), 200

@auth_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    db.session.delete(user_to_delete)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200

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