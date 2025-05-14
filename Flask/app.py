# app.py
from dotenv import load_dotenv
load_dotenv()  # charge .env dans os.environ

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, decode_token
)
from flask_mail import Mail, Message
from datetime import timedelta
import os, re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- CONFIG DB & BCRYPT ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or (
    'postgresql://postgres.wubjzcnmqyvehftmoieo:Enzolise1976...@aws-0-eu-west-3.pooler.supabase.com:6543/postgres'
)
db     = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# --- CONFIG JWT ---
app.config['JWT_SECRET_KEY']                = os.environ['JWT_SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES']      = timedelta(hours=1)
app.config['JWT_ALGORITHM']                 = 'HS256'
jwt = JWTManager(app)

# --- CONFIG MAIL ---
app.config.update(
    MAIL_SERVER        = os.environ['MAIL_SERVER'],
    MAIL_PORT          = int(os.environ['MAIL_PORT']),
    MAIL_USE_TLS       = True,
    MAIL_USERNAME      = os.environ['MAIL_USERNAME'],
    MAIL_PASSWORD      = os.environ['MAIL_PASSWORD'],
    MAIL_DEFAULT_SENDER= os.environ['MAIL_DEFAULT_SENDER']
)
mail = Mail(app)

# --- MODELE USER ---
class User(db.Model):
    id              = db.Column(db.Integer, primary_key=True)
    email           = db.Column(db.String(255), unique=True, nullable=False)
    password        = db.Column(db.String(255), nullable=False)
    roles           = db.Column(db.String(50),  nullable=False)
    first_name      = db.Column(db.String(50),  nullable=False)
    last_name       = db.Column(db.String(50),  nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at      = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at      = db.Column(db.DateTime, nullable=False,
                                default=db.func.current_timestamp(),
                                onupdate=db.func.current_timestamp())
    is_accepted     = db.Column(db.Boolean, nullable=False, default=True)
    private         = db.Column(db.Boolean, default=False)
    pseudo          = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'

with app.app_context():
    db.create_all()

# --- VALIDATION MOT DE PASSE ---
def validate_password(password):
    if len(password) < 8:
        return "Le mot de passe doit contenir au moins 8 caractères."
    if not re.search(r'[A-Z]', password):
        return "Le mot de passe doit contenir au moins une lettre majuscule."
    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        return "Le mot de passe doit contenir au moins un caractère spécial."
    return None

# --- INSCRIPTION ---
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    email      = data.get('email', '').strip().lower()
    password   = data.get('password', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name  = data.get('last_name', '').strip()
    pseudo     = data.get('pseudo', '').strip()
    roles      = data.get('roles', 'user')
    picture    = data.get('profile_picture')
    accepted   = data.get('is_accepted', True)
    private    = data.get('private', False)

    if not all([email, password, first_name, last_name, pseudo]):
        return jsonify({'error': 'Tous les champs obligatoires doivent être fournis'}), 400
    if err := validate_password(password):
        return jsonify({'error': err}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email déjà utilisé'}), 409
    if User.query.filter_by(pseudo=pseudo).first():
        return jsonify({'error': 'Pseudo déjà utilisé'}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(email=email, password=hashed_pw, roles=roles,
                first_name=first_name, last_name=last_name,
                profile_picture=picture, is_accepted=accepted,
                private=private, pseudo=pseudo)
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Utilisateur créé', 'user_id': user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur interne'}), 500

# --- LOGIN ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'error': 'Identifiants invalides'}), 401

    token = create_access_token(identity={'id': user.id, 'email': user.email, 'roles': user.roles})
    return jsonify({
        'message': 'Connexion réussie',
        'token': token,
        'user': {
            'id': user.id, 'email': user.email, 'first_name': user.first_name,
            'last_name': user.last_name, 'roles': user.roles,
            'profile_picture': user.profile_picture, 'private': user.private, 'pseudo': user.pseudo
        }
    }), 200

# --- MOT DE PASSE OUBLIÉ ---
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Si un compte existe, un email a été envoyé'}), 200

    token = create_access_token(
        identity={'id': user.id, 'email': user.email},
        expires_delta=timedelta(minutes=15),
        additional_claims={'reset_password': True}
    )
    reset_url = f"http://localhost:3000/reset-password?token={token}"

    msg = Message(
        subject="Réinitialisation du mot de passe Minouverse",
        recipients=[user.email],
        body=f"Bonjour {user.first_name},\n\n"
             f"Clique ici pour réinitialiser ton mot de passe : {reset_url}\n\n"
             f"Ce lien expire dans 15 minutes."
    )
    mail.send(msg)
    return jsonify({'message': 'Un lien de réinitialisation a été envoyé'}), 200

# --- RÉINITIALISATION DU MOT DE PASSE ---
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token')
    new_password = data.get('new_password', '').strip()

    if not token or not new_password:
        return jsonify({'error': 'Token et nouveau mot de passe requis'}), 400

    try:
        decoded = decode_token(token)
        if not decoded.get('claims', {}).get('reset_password'):
            return jsonify({'error': 'Token invalide'}), 401

        user_id = decoded['sub']['id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur introuvable'}), 404

        if err := validate_password(new_password):
            return jsonify({'error': err}), 400

        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        return jsonify({'message': 'Mot de passe mis à jour'}), 200

    except Exception as e:
        return jsonify({'error': 'Token invalide ou expiré'}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)