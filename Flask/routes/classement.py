from flask import Blueprint, jsonify
from models.user import User
from models.follow import Follow
from models import db

classement_bp = Blueprint('classement', __name__)

@classement_bp.route('/api/classement/top10', methods=['GET'])
def classement_top10():
    # Top 10 users with most followers
    users = (
        db.session.query(User, db.func.count(Follow.follower_id).label('followers_count'))
        .outerjoin(Follow, User.id == Follow.followed_id)
        .group_by(User.id)
        .order_by(db.desc('followers_count'))
        .limit(10)
        .all()
    )
    result = []
    for user, followers_count in users:
        result.append({
            "id": user.id,
            "pseudo": user.pseudo,
            "profile_picture": user.profile_picture,
            "followers_count": followers_count
        })
    return jsonify({"top10": result})

@classement_bp.route('/api/classement/user/<int:user_id>', methods=['GET'])
def classement_user(user_id):
    # Classement de l'utilisateur
    users = (
        db.session.query(User.id, User.pseudo, User.profile_picture, db.func.count(Follow.follower_id).label('followers_count'))
        .outerjoin(Follow, User.id == Follow.followed_id)
        .group_by(User.id)
        .order_by(db.desc('followers_count'))
        .all()
    )
    rank = None
    for idx, (uid, pseudo, profile_picture, followers_count) in enumerate(users, start=1):
        if uid == user_id:
            rank = {
                "rank": idx,
                "pseudo": pseudo,
                "profile_picture": profile_picture,
                "followers_count": followers_count
            }
            break
    return jsonify({"rank": rank})