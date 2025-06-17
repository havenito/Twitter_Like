from models import db
from datetime import datetime

class CommentMedia(db.Model):
    __tablename__ = 'comments_media'
    
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)
    media_url = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    comment = db.relationship('Comment', backref=db.backref('media', lazy=True, cascade='all, delete-orphan'))