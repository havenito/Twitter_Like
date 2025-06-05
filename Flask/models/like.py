from models import db

class Like(db.Model):
    __tablename__ = 'like'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id
        }