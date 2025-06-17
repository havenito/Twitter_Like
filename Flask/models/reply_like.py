from models import db

class ReplyLike(db.Model):
    __tablename__ = 'replies_like'
    
    id = db.Column(db.Integer, primary_key=True)
    replies_id = db.Column(db.Integer, db.ForeignKey('replies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'replies_id', name='unique_user_reply_like'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'replies_id': self.replies_id
        }