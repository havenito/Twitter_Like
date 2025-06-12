from models import db

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)

    posts = db.relationship(
        'Post',
        backref='category',
        cascade="all, delete",
        passive_deletes=True,
        foreign_keys='Post.category_id'
    )