from models import db
from datetime import datetime

class Chat(db.Model):
    __tablename__ = 'chats'  # Utiliser 'chats' au lieu de 'chat'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, nullable=False)  # SUPPRIMER unique=True si présent
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    send_at = db.Column(db.DateTime, default=datetime.utcnow)
    reply_to_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=True)
    
    # Relations
    sender = db.relationship('User', backref=db.backref('sent_chats', lazy=True))
    reply_to = db.relationship('Chat', remote_side=[id], backref='replies')
    
    def __init__(self, conversation_id, sender_id, content, reply_to_id=None):
        self.conversation_id = conversation_id
        self.sender_id = sender_id
        self.content = content
        self.reply_to_id = reply_to_id
        self.send_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'send_at': self.send_at.isoformat() if self.send_at else None,
            'reply_to_id': self.reply_to_id
        }
