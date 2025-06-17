from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.history import History  # À créer si besoin

history_bp = Blueprint('history', __name__)

@history_bp.route('/api/user/history', methods=['GET'])
@jwt_required()
def get_user_history():
    user_id = get_jwt_identity()
    history_items = History.query.filter_by(user_id=user_id).order_by(History.timestamp.desc()).all()
    return jsonify({'history': [item.to_dict() for item in history_items]})