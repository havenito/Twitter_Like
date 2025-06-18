from models import db
from datetime import datetime, timezone

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    send_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reply_to_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=True)
    
    sender = db.relationship('User', backref=db.backref('sent_chats', lazy=True))
    reply_to = db.relationship('Chat', remote_side=[id], backref='replies')
    
    def __init__(self, conversation_id, sender_id, content, reply_to_id=None):
        self.conversation_id = int(conversation_id) if conversation_id else None
        self.sender_id = int(sender_id) if sender_id else None
        self.content = content
        self.reply_to_id = reply_to_id
        self.send_at = datetime.now(timezone.utc)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'send_at': self.send_at.isoformat().replace('+00:00', 'Z') if self.send_at else None,
            'reply_to_id': self.reply_to_id
        }
