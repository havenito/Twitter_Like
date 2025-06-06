from flask import Blueprint, request, jsonify
from models import db
from models.poll import Poll
import sqlalchemy as sa
from models.pollvote import PollVote

polls_bp = Blueprint('polls', __name__)

@polls_bp.route('/api/polls', methods=['GET'])
def get_polls():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 3))
    query = Poll.query.order_by(Poll.date_created.desc())
    total = query.count()
    polls = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    return jsonify({
        "polls": [p.to_dict() for p in polls],
        "total_pages": total_pages
    })

@polls_bp.route('/api/polls', methods=['POST'])
def create_poll():
    data = request.get_json()
    question = data.get('question')
    options = [opt.strip() for opt in data.get('options', []) if opt.strip()]
    user_id = data.get('user_id')

    if not question or len(options) < 2 or not user_id:
        return jsonify({'error': 'Question, options et user_id requis'}), 400

    poll = Poll(
        question=question,
        options=options,
        votes=[0]*len(options),
        user_id=int(user_id)  # <-- Force en entier ici !
    )
    db.session.add(poll)
    db.session.commit()
    return jsonify({"poll": poll.to_dict()}), 201

@polls_bp.route('/api/polls/<int:poll_id>', methods=['GET'])
def get_poll(poll_id):
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({'error': 'Sondage introuvable'}), 404
    return jsonify({'poll': poll.to_dict()})

@polls_bp.route('/api/polls/<int:poll_id>/vote', methods=['POST'])
def vote_poll(poll_id):
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({'error': 'Sondage introuvable'}), 404

    data = request.get_json()
    option = data.get('option')
    user_id = data.get('user_id')
    if option is None or not isinstance(option, int) or option < 0 or option >= len(poll.options):
        return jsonify({'error': 'Option invalide'}), 400
    if not user_id:
        return jsonify({'error': 'user_id requis'}), 400

    # Vérifie si ce user a déjà voté pour ce poll
    existing_vote = PollVote.query.filter_by(poll_id=poll_id, user_id=int(user_id)).first()
    if existing_vote:
        return jsonify({'error': 'Vous avez déjà voté pour ce sondage.'}), 400

    poll.votes[option] += 1
    sa.orm.attributes.flag_modified(poll, "votes")
    db.session.add(PollVote(poll_id=poll_id, user_id=int(user_id), option=option))
    db.session.commit()
    return jsonify({'poll': poll.to_dict()})