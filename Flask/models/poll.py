from models import db

class Poll(db.Model):
    __tablename__ = "poll"
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    options = db.Column(db.PickleType, nullable=False)  # Stocke une liste d'options
    votes = db.Column(db.PickleType, nullable=False)    # Stocke une liste de votes
    date_created = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # nullable=True pour coller à ta table

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "options": self.options,
            "votes": self.votes,
            "date_created": self.date_created.isoformat() if self.date_created else None,
            "user_id": self.user_id
        }