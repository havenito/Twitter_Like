from models import db

class PostMedia(db.Model):
    __tablename__ = 'post_media'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id', ondelete='CASCADE'), nullable=False)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(20), nullable=False)  # 'image', 'video', etc.
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'url': self.media_url,
            'type': self.media_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }