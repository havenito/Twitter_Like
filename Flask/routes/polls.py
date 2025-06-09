from flask import Blueprint, request, jsonify
from models import db
from models.poll import Poll
from models.category import Category
from models.pollvote import PollVote
from models.user import User
import sqlalchemy as sa

polls_bp = Blueprint('polls', __name__)

@polls_bp.route('/api/polls', methods=['GET'])
def get_polls():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        polls_paginated = Poll.query.order_by(Poll.date_created.desc()).paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        polls_with_category = []
        for poll in polls_paginated.items:
            poll_dict = poll.to_dict()
            category = Category.query.get(poll.category_id)
            poll_dict['category'] = {
                'id': category.id if category else None,
                'name': category.name if category else 'Catégorie supprimée',
                'description': category.description if category else None
            }
            polls_with_category.append(poll_dict)
        
        return jsonify({
            "polls": polls_with_category,
            "page": page,
            "limit": limit,
            "has_next": polls_paginated.has_next,
            "total_pages": polls_paginated.pages,
            "current_page": polls_paginated.page
        })
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls', methods=['POST'])
def create_poll():
    try:
        data = request.get_json()
        question = data.get('question')
        description = data.get('description', '').strip()
        options = [opt.strip() for opt in data.get('options', []) if opt.strip()]
        user_id = data.get('user_id')
        category_id = data.get('category_id')

        if not question or len(options) < 2 or not user_id or category_id is None:
            return jsonify({'error': 'Données manquantes ou invalides'}), 400

        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Catégorie introuvable'}), 404

        poll = Poll(
            question=question,
            description=description if description else None,
            options=options,
            votes=[0]*len(options),
            user_id=int(user_id),
            category_id=int(category_id)
        )
        db.session.add(poll)
        db.session.commit()
        
        poll_dict = poll.to_dict()
        poll_dict['category'] = {
            'id': category.id,
            'name': category.name,
            'description': category.description
        }
        
        return jsonify({'poll': poll_dict}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls/<int:poll_id>', methods=['GET'])
def get_poll(poll_id):
    try:
        poll = Poll.query.get(poll_id)
        if not poll:
            return jsonify({'error': 'Sondage introuvable'}), 404
        
        poll_dict = poll.to_dict()
        category = Category.query.get(poll.category_id)
        poll_dict['category'] = {
            'id': category.id if category else None,
            'name': category.name if category else 'Catégorie supprimée',
            'description': category.description if category else None
        }
        
        return jsonify({'poll': poll_dict})
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls/<int:poll_id>/vote', methods=['POST'])
def vote_poll(poll_id):
    try:
        poll = Poll.query.get(poll_id)
        if not poll:
            return jsonify({'error': 'Sondage introuvable'}), 404

        data = request.get_json()
        option = data.get('option')
        user_id = data.get('user_id')
        if option is None or not isinstance(option, int) or option < 0 or option >= len(poll.options):
            return jsonify({'error': 'Option invalide'}), 400
        if not user_id:
            return jsonify({'error': 'ID utilisateur requis'}), 400

        existing_vote = PollVote.query.filter_by(poll_id=poll_id, user_id=int(user_id)).first()
        if existing_vote:
            return jsonify({'error': 'Vous avez déjà voté pour ce sondage'}), 400

        poll.votes[option] += 1
        sa.orm.attributes.flag_modified(poll, "votes")
        db.session.add(PollVote(poll_id=poll_id, user_id=int(user_id), option=option))
        db.session.commit()
        
        poll_dict = poll.to_dict()
        category = Category.query.get(poll.category_id)
        poll_dict['category'] = {
            'id': category.id if category else None,
            'name': category.name if category else 'Catégorie supprimée',
            'description': category.description if category else None
        }
        
        return jsonify({'poll': poll_dict})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls/<int:poll_id>/vote-status/<int:user_id>', methods=['GET'])
def check_vote_status(poll_id, user_id):
    """Vérifier si un utilisateur a déjà voté pour un sondage"""
    try:
        existing_vote = PollVote.query.filter_by(poll_id=poll_id, user_id=user_id).first()
        return jsonify({
            'has_voted': existing_vote is not None,
            'voted_option': existing_vote.option if existing_vote else None
        })
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls/category/<int:category_id>', methods=['GET'])
def get_polls_by_category(category_id):
    """Obtenir les sondages d'une catégorie spécifique avec pagination"""
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Catégorie introuvable'}), 404
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        polls_paginated = Poll.query.filter_by(category_id=category_id).order_by(Poll.date_created.desc()).paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        polls_with_category = []
        for poll in polls_paginated.items:
            poll_dict = poll.to_dict()
            poll_dict['category'] = {
                'id': category.id,
                'name': category.name,
                'description': category.description
            }
            polls_with_category.append(poll_dict)
        
        return jsonify({
            "polls": polls_with_category,
            "page": page,
            "limit": limit,
            "has_next": polls_paginated.has_next,
            "total_pages": polls_paginated.pages,
            "current_page": polls_paginated.page,
            "category": {
                'id': category.id,
                'name': category.name,
                'description': category.description
            }
        })
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/users/<int:user_id>/polls', methods=['GET'])
def get_user_polls(user_id):
    """Obtenir les sondages créés par un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur introuvable'}), 404
            
        polls = Poll.query.filter_by(user_id=user_id).order_by(Poll.date_created.desc()).all()
        
        result = []
        for poll in polls:
            poll_dict = poll.to_dict()
            category = Category.query.get(poll.category_id)
            poll_dict['category'] = {
                'id': category.id if category else None,
                'name': category.name if category else 'Catégorie supprimée',
                'description': category.description if category else None
            }
            result.append(poll_dict)
        
        return jsonify({'polls': result})
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@polls_bp.route('/api/polls/<int:poll_id>', methods=['DELETE'])
def delete_poll(poll_id):
    """Supprimer un sondage"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'ID utilisateur requis'}), 400
            
        poll = Poll.query.get(poll_id)
        if not poll:
            return jsonify({'error': 'Sondage introuvable'}), 404
            
        if poll.user_id != int(user_id):
            return jsonify({'error': 'Non autorisé'}), 403
            
        PollVote.query.filter_by(poll_id=poll_id).delete()
        
        db.session.delete(poll)
        db.session.commit()
        
        return jsonify({'message': 'Sondage supprimé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500