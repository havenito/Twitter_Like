from models import db
from models.category import Category

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    published_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())    
    media_url = db.Column(db.String(255), nullable=True)  # URL to the media file
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    media_type = db.Column(db.String(50), nullable=True)  # 'image', 'video', 'gif'