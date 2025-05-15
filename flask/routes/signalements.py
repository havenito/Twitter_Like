from flask import Blueprint, request, jsonify
from models import db, Signalement

signalement_api = Blueprint('signalement_api', __name__)

@signalement_api.route('/api/signalements', methods=['GET'])
def get_signalements():
    try:
        signalements = Signalement.query.all()
        return jsonify([signalement.to_dict() for signalement in signalements])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch signalements: {str(e)}'}), 500

@signalement_api.route('/api/signalements/<int:id>', methods=['GET'])
def get_signalement(id):
    try:
        signalement = Signalement.query.get_or_404(id)
        return jsonify(signalement.to_dict())
    except Exception as e:
        return jsonify({'error': f'Signalement not found: {str(e)}'}), 404

@signalement_api.route('/api/signalements', methods=['POST'])
def create_signalement():
    try:
        data = request.get_json()
        new_signalement = Signalement(
            user_id=data['user_id'],
            content=data['content'],
            date_signalement=data['date_signalement'],
            statut=data['statut']
        )
        db.session.add(new_signalement)
        db.session.commit()
        return jsonify({'message': 'Signalement created successfully', 'signalement_id': new_signalement.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create signalement: {str(e)}'}), 500

@signalement_api.route('/api/signalements/<int:id>', methods=['PUT'])
def update_signalement(id):
    try:
        data = request.get_json()
        signalement = Signalement.query.get_or_404(id)

        if 'user_id' in data:
            signalement.user_id = data['user_id']

        if 'content' in data:
            signalement.content = data['content']

        if 'date_signalement' in data:
            signalement.date_signalement = data['date_signalement']

        if 'statut' in data:
            signalement.statut = data['statut']

        db.session.commit()
        return jsonify({
            'message': 'Signalement updated successfully',
            'signalement': {
                'id': signalement.id,
                'user_id': signalement.user_id,
                'content': signalement.content,
                'date_signalement': signalement.date_signalement,
                'statut': signalement.statut
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update signalement: {str(e)}'}), 500

@signalement_api.route('/api/signalements/<int:id>', methods=['DELETE'])
def delete_signalement(id):
    try:
        signalement = Signalement.query.get_or_404(id)
        db.session.delete(signalement)
        db.session.commit()
        return jsonify({'message': 'Signalement deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete signalement: {str(e)}'}), 500
