from models import db
from models.category import Category

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    published_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)  # Post parent
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)

    # Relation pour le post parent
    parent_post = db.relationship('Post', remote_side=[id], backref='retweets')

    # Relation pour les médias
    media = db.relationship('PostMedia', backref='post', lazy=True)

    def to_dict(self):
        parent_post_data = self.parent_post.to_dict() if self.parent_post else None
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'post_id': self.post_id,
            'parent_post': parent_post_data,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'media': [media.to_dict() for media in self.media] if self.media else []
        }