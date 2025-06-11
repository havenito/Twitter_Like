from flask import Blueprint, request, jsonify
from models import db
from models.repost import Repost

reposts_bp = Blueprint('repost', __name__)




@reposts_bp.route('/api/repost', methods=['POST'])
def create_repost():
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 415

        data = request.get_json()
        user_id = data.get('user_id')
        post_id = data.get('post_id')

        if not user_id or not post_id:
            return jsonify({'error': 'Champs requis manquants'}), 400

        # Vérifier si le repost existe déjà
        existing_repost = Repost.query.filter_by(user_id=user_id, post_id=post_id).first()
        if existing_repost:
            return jsonify({'error': 'Vous avez déjà Reposter ce Post'}), 400

        # Créer un nouveau repost
        new_repost = Repost(user_id=user_id, post_id=post_id)
        db.session.add(new_repost)
        db.session.commit()

        return jsonify({'message': 'Repost créé avec succès', 'repost_id': new_repost.id}), 201

    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500


@reposts_bp.route('/api/posts/<int:post_id>/repost_count', methods=['GET'])
def get_repost_count(post_id):
    try:
        # Vérifier si le post existe dans la table Repost
        repost_count = Repost.query.filter_by(post_id=post_id).count()
        
        # Retourner le compteur de reposts (0 si aucun repost n'existe)
        return jsonify({'post_id': post_id, 'repost_count': repost_count}), 200
    except Exception as e:
        print(f"Erreur dans get_repost_count: {e}")  # Log de l'erreur
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500


@reposts_bp.route('/api/reposts/<int:post_id>', methods=['GET'])
def get_reposts(post_id):
    try:
        reposts = Repost.query.filter_by(post_id=post_id).all()
        result = [repost.to_dict() for repost in reposts]

        return jsonify({'reposts': result}), 200

    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500