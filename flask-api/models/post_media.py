from models import db

class PostMedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id', ondelete='CASCADE'), nullable=False)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(20), nullable=False)  # 'image', 'video', etc.
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    def __repr__(self):
        return f'<PostMedia {self.id} for Post {self.post_id}>'