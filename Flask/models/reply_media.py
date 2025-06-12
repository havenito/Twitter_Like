from models import db
from datetime import datetime

class ReplyMedia(db.Model):
    __tablename__ = 'replies_media'
    
    id = db.Column(db.Integer, primary_key=True)
    replies_id = db.Column(db.Integer, db.ForeignKey('replies.id'), nullable=False) 
    media_url = db.Column(db.Text, nullable=False)
    media_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reply = db.relationship('Reply', backref=db.backref('media', lazy=True, cascade='all, delete-orphan'))