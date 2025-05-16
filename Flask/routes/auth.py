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

bcrypt = Bcrypt()
auth_bp = Blueprint('auth', __name__)

# --- VALIDATION MOT DE PASSE ---
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
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip() 
    profile_picture = data.get('profile_picture')
    pseudo = data.get('pseudo', '').strip()
    private = data.get('private', False)

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
        roles='user', 
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture,
        pseudo=pseudo, 
        private=private
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur créé avec succès', 'user_id': new_user.id}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if user and bcrypt.check_password_hash(user.password, password):
        # NextAuth will handle token creation. Return user details.
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
    
    return jsonify({'error': 'Email ou mot de passe invalide'}), 401

@auth_bp.route('/api/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé."}), 200


    # Create a short-lived token specifically for password reset
    # The identity can be user.id or user.email
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
        mail = current_app.extensions.get('mail')
        mail.send(msg)
        return jsonify({'message': 'Un lien de réinitialisation a été envoyé à votre adresse email.'}), 200
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi de l'email de réinitialisation : {e}")
        return jsonify({'error': "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard."}), 500

@auth_bp.route('/api/reset-password', methods=['POST'])
def reset_password_with_token(): 
    data = request.get_json()
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

    except Exception as e: # Catches expired tokens, malformed tokens, etc.
        current_app.logger.error(f"Erreur lors de la réinitialisation du mot de passe : {e}")
        return jsonify({'error': 'Token invalide, expiré ou une erreur est survenue'}), 401