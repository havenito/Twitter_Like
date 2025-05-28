from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from services.file_upload import upload_file  # Importer le service d'upload

bcrypt = Bcrypt()
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/users', methods=['POST'])
def create_user():
    # Vérifier si la requête est multipart (avec fichier) ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Traiter les données du formulaire
        email = request.form.get('email')
        password = request.form.get('password')
        roles = request.form.get('roles', 'user')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        profile_picture = None
        
        # Traiter le fichier de photo de profil s'il existe
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file.filename:
                profile_picture_url, _ = upload_file(file)
                profile_picture = profile_picture_url
    else:
        # Traiter les données JSON
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        roles = data.get('roles', 'user')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        profile_picture = data.get('profile_picture')  # URL déjà existante

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        email=email,
        password=hashed_password,
        roles=roles,
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully', 
        'user_id': new_user.id,
        'profile_picture': profile_picture
    }), 201

# Route d'upload d'image spécifique
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

# Conserver les autres fonctions existantes
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    roles = data.get('roles', 'user')
    
    user = User.query.filter_by(email=email).first()

    if roles == 'admin':
        user = User.query.filter_by(email=email, roles='admin').first()
        if user and bcrypt.check_password_hash(user.password, password):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'roles': user.roles,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture
                }
            })

    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'roles': user.roles,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_picture': user.profile_picture
            }
        })
    
    return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    result = []
    
    for user in users:
        result.append({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name, 
            'roles': user.roles,
            'profile_picture': user.profile_picture,
            'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None
        })
    
    return jsonify(result)

@auth_bp.route('/api/users/<int:user_id>', methods=['PUT', 'OPTIONS'])
def update_user(user_id):
    # Ajouter le support pour OPTIONS
    if request.method == 'OPTIONS':
        return '', 200
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    # Vérifier si la requête est multipart (avec fichier) ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Traiter les données du formulaire
        if 'email' in request.form:
            user.email = request.form.get('email')
        if 'first_name' in request.form:
            user.first_name = request.form.get('first_name')
        if 'last_name' in request.form:
            user.last_name = request.form.get('last_name')
        if 'roles' in request.form:
            user.roles = request.form.get('roles')
        if 'password' in request.form and request.form.get('password'):
            user.password = bcrypt.generate_password_hash(request.form.get('password')).decode('utf-8')
            
        # Traiter le fichier de photo de profil s'il existe
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file.filename:
                profile_picture_url, _ = upload_file(file)
                user.profile_picture = profile_picture_url
    else:
        # Traiter les données JSON
        data = request.get_json()
        
        if 'email' in data:
            user.email = data['email']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'roles' in data:
            user.roles = data['roles']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        if 'password' in data and data['password']:
            user.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur mis à jour avec succès',
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'roles': user.roles,
            'profile_picture': user.profile_picture
        }
    })

@auth_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur supprimé avec succès'})