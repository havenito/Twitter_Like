from flask import Blueprint, request, jsonify
from models import db, Signalement

signalement_api = Blueprint('signalement_api', __name__)

@signalement_api.route('/signalements', methods=['GET'])
def get_signalements():
    signalements = Signalement.query.all()
    return jsonify([signalement.to_dict() for signalement in signalements])

@signalement_api.route('/signalements/<int:id>', methods=['GET'])
def get_signalement(id):
    signalement = Signalement.query.get_or_404(id)
    return jsonify(signalement.to_dict())

@signalement_api.route('/signalements', methods=['POST'])
def create_signalement():
    data = request.get_json()
    new_signalement = Signalement(
        user_id=data['user_id'],
        content=data['content'],
        date_signalement=data['date_signalement'],
        statut=data['statut']
    )
    db.session.add(new_signalement)
    db.session.commit()
    return jsonify(new_signalement.to_dict()), 201

@signalement_api.route('/signalements/<int:id>', methods=['PUT'])
def update_signalement(id):
    data = request.get_json()
    signalement = Signalement.query.get_or_404(id)
    signalement.user_id = data['user_id']
    signalement.content = data['content']
    signalement.date_signalement = data['date_signalement']
    signalement.statut = data['statut']
    db.session.commit()
    return jsonify(signalement.to_dict())

@signalement_api.route('/signalements/<int:id>', methods=['DELETE'])
def delete_signalement(id):
    signalement = Signalement.query.get_or_404(id)
    db.session.delete(signalement)
    db.session.commit()
    return '', 204
