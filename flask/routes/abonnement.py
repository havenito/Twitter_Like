from flask import Blueprint, request, jsonify
from models import db, Abonnements

abonnements_api = Blueprint('abonnements_api', __name__)

@abonnements_api.route('/api/abonnements', methods=['GET'])
def get_abonnements():
    try:
        abonnements = Abonnements.query.all()
        return jsonify([abonnement.to_dict() for abonnement in abonnements])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch abonnements: {str(e)}'}), 500

@abonnements_api.route('/api/abonnements/<int:id>', methods=['GET'])
def get_abonnement(id):
    try:
        abonnement = Abonnements.query.get_or_404(id)
        return jsonify(abonnement.to_dict())
    except Exception as e:
        return jsonify({'error': f'Abonnement not found: {str(e)}'}), 404

@abonnements_api.route('/api/abonnements', methods=['POST'])
def create_abonnement():
    try:
        data = request.get_json()
        new_abonnement = Abonnements(
            abonne_id=data['abonne_id'],
            abonnement_id=data['abonnement_id'],
            date_suivi=data['date_suivi']
        )
        db.session.add(new_abonnement)
        db.session.commit()
        return jsonify({'message': 'Abonnement created successfully', 'abonnement_id': new_abonnement.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create abonnement: {str(e)}'}), 500

@abonnements_api.route('/api/abonnements/<int:id>', methods=['PUT'])
def update_abonnement(id):
    try:
        data = request.get_json()
        abonnement = Abonnements.query.get_or_404(id)

        if 'abonne_id' in data:
            abonnement.abonne_id = data['abonne_id']

        if 'abonnement_id' in data:
            abonnement.abonnement_id = data['abonnement_id']

        if 'date_suivi' in data:
            abonnement.date_suivi = data['date_suivi']

        db.session.commit()
        return jsonify({
            'message': 'Abonnement updated successfully',
            'abonnement': {
                'id': abonnement.id,
                'abonne_id': abonnement.abonne_id,
                'abonnement_id': abonnement.abonnement_id,
                'date_suivi': abonnement.date_suivi
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update abonnement: {str(e)}'}), 500

@abonnements_api.route('/api/abonnements/<int:id>', methods=['DELETE'])
def delete_abonnement(id):
    try:
        abonnement = Abonnements.query.get_or_404(id)
        db.session.delete(abonnement)
        db.session.commit()
        return jsonify({'message': 'Abonnement deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete abonnement: {str(e)}'}), 500
