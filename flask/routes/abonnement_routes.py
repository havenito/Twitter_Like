from flask import Blueprint, request, jsonify
from models import db, Abonnements

abonnements_api = Blueprint('abonnements_api', __name__)

@abonnements_api.route('/abonnements', methods=['GET'])
def get_abonnements():
    abonnements = Abonnements.query.all()
    return jsonify([abonnement.to_dict() for abonnement in abonnements])

@abonnements_api.route('/abonnements/<int:id>', methods=['GET'])
def get_abonnement(id):
    abonnement = Abonnements.query.get_or_404(id)
    return jsonify(abonnement.to_dict())

@abonnements_api.route('/abonnements', methods=['POST'])
def create_abonnement():
    data = request.get_json()
    new_abonnement = Abonnements(
        abonné_id=data['abonné_id'],
        abonnement_id=data['abonnement_id'],
        date_suivi=data['date_suivi']
    )
    db.session.add(new_abonnement)
    db.session.commit()
    return jsonify(new_abonnement.to_dict()), 201

@abonnements_api.route('/abonnements/<int:id>', methods=['PUT'])
def update_abonnement(id):
    data = request.get_json()
    abonnement = Abonnements.query.get_or_404(id)
    abonnement.abonné_id = data['abonné_id']
    abonnement.abonnement_id = data['abonnement_id']
    abonnement.date_suivi = data['date_suivi']
    db.session.commit()
    return jsonify(abonnement.to_dict())

@abonnements_api.route('/abonnements/<int:id>', methods=['DELETE'])
def delete_abonnement(id):
    abonnement = Abonnements.query.get_or_404(id)
    db.session.delete(abonnement)
    db.session.commit()
    return '', 204
