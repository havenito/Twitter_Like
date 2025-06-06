from models import db

class PollVote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    option = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint('poll_id', 'user_id', name='_poll_user_uc'),)