from models import db
from datetime import datetime

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
    comments_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    follow_id = db.Column(db.Integer, db.ForeignKey('follows.id'), nullable=True)
    replie_id = db.Column(db.Integer, db.ForeignKey('replies.id'), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    signalement_id = db.Column(db.Integer, db.ForeignKey('signalement.id'), nullable=True)