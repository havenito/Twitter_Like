from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask import request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os

# Ajoutez ces importations
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

app = Flask(__name__)
bcrypt = Bcrypt(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'postgresql://postgres.wubjzcnmqyvehftmoieo:Enzolise1976...@localhost:6543/postgres'
db = SQLAlchemy(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Configurer JWT
app.config['JWT_SECRET_KEY'] = 'votre-cle-secrete-a-changer'  # À changer en production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    roles = db.Column(db.String(50), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_accepted = db.Column(db.Boolean, nullable=False, default=False)
    private = db.Column(db.Boolean, default=False)
    pseudo = db.Column(db.String(50), nullable=True)

def __repr__(self):
        return f'<User {self.name}>'

with app.app_context():
    db.create_all()

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    roles = data.get('roles')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    profile_picture = data.get('profile_picture')
    is_accepted = data.get('is_accepted', False)
    private = data.get('private', False)
    pseudo = data.get('pseudo')

    if not all([email, password, first_name, last_name, pseudo]):
        return jsonify({'error': 'Tous les champs obligatoires (email, mot de passe, prénom, nom, pseudo) doivent être fournis'}), 400
        
    try:
        # Vérifier si l'email existe déjà
        existing_user_by_email = User.query.filter_by(email=email).first()
        if existing_user_by_email:
            return jsonify({'error': 'Cet email est déjà utilisé'}), 409

        # Vérifier si le pseudo existe déjà
        existing_user_by_pseudo = User.query.filter_by(pseudo=pseudo).first()
        if existing_user_by_pseudo:
            return jsonify({'error': 'Ce pseudo est déjà utilisé'}), 409

        # Hasher le mot de passe avant de le stocker
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_user = User(
            email=email, 
            password=hashed_password, # Utiliser le mot de passe haché
            roles=roles, 
            first_name=first_name, 
            last_name=last_name, 
            profile_picture=profile_picture, 
            is_accepted=is_accepted, 
            private=private, 
            pseudo=pseudo
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Utilisateur créé avec succès', 'user_id': new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erreur lors de la création de l'utilisateur: {str(e)}")
        return jsonify({'error': 'Une erreur interne est survenue lors de la création de l\'utilisateur.'}), 500


# Ajouter la route de login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    # Rechercher l'utilisateur par email
    user = User.query.filter_by(email=email).first()
    
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Vérifier si l'utilisateur est accepté (si nécessaire)
    if not user.is_accepted:
        return jsonify({'error': 'Votre compte n\'a pas encore été approuvé'}), 403
    
    # Créer le token JWT
    access_token = create_access_token(
        identity={
            'id': user.id,
            'email': user.email,
            'roles': user.roles
        }
    )
    
    return jsonify({
        'message': 'Connexion réussie',
        'token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'roles': user.roles,
            'profile_picture': user.profile_picture,
            'private': user.private,
            'pseudo': user.pseudo
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)