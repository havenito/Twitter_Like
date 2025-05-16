from flask import Blueprint, request, jsonify, redirect, url_for
from models import db
from models.abonnement import Abonnement
from models.user import User
from datetime import datetime

abonnements_api = Blueprint('abonnements_api', __name__)

# Obtenir tous les abonnements d'un utilisateur
@abonnements_api.route('/api/abonnements/user/<int:user_id>', methods=['GET'])
def get_user_abonnements(user_id):
    abonnements = Abonnement.query.filter_by(user_id=user_id).all()
    abonnements_list = [
        {
            'id': a.id,
            'user_id': a.user_id,
            'abonne_id': a.abonne_id,
            'date_abonnement': a.date_abonnement
        } for a in abonnements
    ]
    return jsonify({'abonnements': abonnements_list}), 200
# Changer d'abonnement
@abonnements_api.route('/api/abonnements', methods=['POST'])
def change_abonnement():
    data = request.get_json()
    user_id = data.get('user_id')
    abonne_id = data.get('abonne_id')

    # Vérifier si l'utilisateur et l'abonné existent
    user = User.query.get(user_id)
    abonne = User.query.get(abonne_id)
    if not user or not abonne:
        return jsonify({'error': 'User or abonne not found'}), 404

    # Vérifier si l'abonnement existe déjà
    abonnement = Abonnement.query.filter_by(user_id=user_id, abonne_id=abonne_id).first()
    if abonnement:
        return jsonify({'error': 'Already subscribed'}), 400

    # Créer un nouvel abonnement
    new_abonnement = Abonnement(user_id=user_id, abonne_id=abonne_id, date_abonnement=datetime.utcnow())
    db.session.add(new_abonnement)
    db.session.commit()

    return jsonify({'message': 'Subscription successful'}), 201

#obtenir tous les abonnements 
@abonnements_api.route('/api/abonnements', methods=['GET'])
def get_all_abonnements():
    abonnements = Abonnement.query.all()
    abonnements_list = [
        {
            'id': a.id,
            'user_id': a.user_id,
            'abonne_id': a.abonne_id,
            'date_abonnement': a.date_abonnement
        } for a in abonnements
    ]
    return jsonify({'abonnements': abonnements_list}), 200

#Obtenir tous abonné des abonnements
@abonnements_api.route('/api/abonnements/<int:abonne_id>', methods=['GET'])
def get_abonne_abonnements(abonne_id):
    abonnements = Abonnement.query.filter_by(abonne_id=abonne_id).all()
    abonnements_list = [
        {
            'id': a.id,
            'user_id': a.user_id,
            'abonne_id': a.abonne_id,
            'date_abonnement': a.date_abonnement
        } for a in abonnements
    ]
    return jsonify({'abonnements': abonnements_list}), 200