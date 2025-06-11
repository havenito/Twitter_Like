from flask import Blueprint, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db
from models.user import User
from models.chat import Chat
from models.group import Group, GroupMember, GroupMessages
from datetime import datetime, timedelta
import traceback

group_chat_bp = Blueprint('group_chat', __name__)
socketio = SocketIO()

@group_chat_bp.route('/group_chat', methods=['POST'])
def create_group_chat():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'created_by' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        name = data['name']
        created_by = data['created_by']
        user_ids = data.get('user_ids', [])

        # Check if user exists
        user = User.query.get(created_by)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create the group chat
        new_chat = Chat(name=name, created_by=created_by, created_at=datetime.utcnow())
        db.session.add(new_chat)
        db.session.flush()  # To get new_chat.id before commit

        # Add users to the group (including creator)
        all_user_ids = set(user_ids)
        all_user_ids.add(created_by)
        users = User.query.filter(User.id.in_(all_user_ids)).all()
        if len(users) != len(all_user_ids):
            return jsonify({'error': 'One or more users not found'}), 404

        # Assuming Chat has a 'users' relationship (many-to-many)
        new_chat.users.extend(users)
        db.session.commit()

        return jsonify({'message': 'Group chat created successfully', 'chat_id': new_chat.id}), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:chat_id>', methods=['GET'])
def get_group_chat(chat_id):
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Chat not found'}), 404

        # Serialize chat data
        chat_data = {
            'id': chat.id,
            'name': chat.name,
            'created_by': chat.created_by,
            'created_at': chat.created_at.isoformat(),
            'users': [user.id for user in chat.users]  # Assuming Chat has a 'users' relationship
        }

        return jsonify(chat_data), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('/group_chat/<int:chat_id>/users', methods=['POST'])
def add_users_to_group_chat(chat_id):
    try:
        data = request.get_json()
        if not data or 'user_ids' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        user_ids = data['user_ids']
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Chat not found'}), 404

        # Check if users exist
        users = User.query.filter(User.id.in_(user_ids)).all()
        if len(users) != len(user_ids):
            return jsonify({'error': 'One or more users not found'}), 404

        # Add users to the chat
        chat.users.extend(users)
        db.session.commit()

        return jsonify({'message': 'Users added to group chat successfully'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('/group_chat/<int:group_id>/messages', methods=['POST'])
def send_message_to_group_chat(group_id):
    try:
        data = request.get_json()
        if not data or 'sender_id' not in data or 'content' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        sender_id = data['sender_id']
        content = data['content']

        # Check if group exists
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        # Check if sender is a member of the group
        member = GroupMember.query.filter_by(group_id=group_id, user_id=sender_id, is_active=True).first()
        if not member:
            return jsonify({'error': 'Sender not part of the group'}), 403

        # Create and save the group message
        new_message = GroupMessages(
            group_id=group_id,
            sender_id=sender_id,
            content=content,
            sent_at=datetime.utcnow()
        )
        db.session.add(new_message)
        db.session.commit()

        return jsonify({'message': 'Message sent successfully', 'message_id': new_message.id}), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:group_id>/messages', methods=['GET'])
def get_group_chat_messages(group_id):
    try:
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        messages = GroupMessages.query.filter_by(group_id=group_id, is_deleted=False).all()
        message_list = [{
            'id': msg.id,
            'sender_id': msg.sender_id,
            'content': msg.content,
            'sent_at': msg.sent_at.isoformat(),
            'message_type': msg.message_type,
            'reply_to': msg.reply_to
        } for msg in messages]

        return jsonify({'messages': message_list}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('/group_chat/<int:group_id>/messages/<int:message_id>', methods=['DELETE'])
def delete_group_chat_message(group_id, message_id):
    try:
        message = GroupMessages.query.get(message_id)
        if not message or message.group_id != group_id:
            return jsonify({'error': 'Message not found in this group'}), 404

        # Soft delete the message
        message.is_deleted = True
        db.session.commit()

        return jsonify({'message': 'Message deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('/group_chat/<int:group_id>/members', methods=['GET'])
def get_group_members(group_id):
    try:
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        members = GroupMember.query.filter_by(group_id=group_id, is_active=True).all()
        member_list = [{
            'id': member.id,
            'user_id': member.user_id,
            'joined_at': member.joined_at.isoformat(),
            'role': member.role
        } for member in members]

        return jsonify({'members': member_list}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:group_id>/members/<int:user_id>', methods=['DELETE'])

def remove_member_from_group(group_id, user_id):
    try:
        member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, is_active=True).first()
        if not member:
            return jsonify({'error': 'Member not found in this group'}), 404

        # Soft delete the member
        member.is_active = False
        db.session.commit()

        return jsonify({'message': 'Member removed from group successfully'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:group_id>/members/<int:user_id>', methods=['PUT'])
def update_member_role(group_id, user_id):
    try:
        data = request.get_json()
        if not data or 'role' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        new_role = data['role']
        member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, is_active=True).first()
        if not member:
            return jsonify({'error': 'Member not found in this group'}), 404

        # Update the member's role
        member.role = new_role
        db.session.commit()

        return jsonify({'message': 'Member role updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:group_id>/messages/<int:message_id>', methods=['PUT'])
def update_group_chat_message(group_id, message_id):
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        content = data['content']
        message = GroupMessages.query.get(message_id)
        if not message or message.group_id != group_id:
            return jsonify({'error': 'Message not found in this group'}), 404

        # Update the message content
        message.content = content
        db.session.commit()

        return jsonify({'message': 'Message updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@group_chat_bp.route('/group_chat/<int:group_id>/messages/<int:message_id>/reply', methods=['POST'])
def reply_to_group_chat_message(group_id, message_id):
    try:
        data = request.get_json()
        if not data or 'sender_id' not in data or 'content' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        sender_id = data['sender_id']
        content = data['content']

        # Check if group exists
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        # Check if sender is a member of the group
        member = GroupMember.query.filter_by(group_id=group_id, user_id=sender_id, is_active=True).first()
        if not member:
            return jsonify({'error': 'Sender not part of the group'}), 403

        # Check if the original message exists
        original_message = GroupMessages.query.get(message_id)
        if not original_message or original_message.group_id != group_id:
            return jsonify({'error': 'Original message not found in this group'}), 404

        # Create and save the reply message
        new_reply = GroupMessages(
            group_id=group_id,
            sender_id=sender_id,
            content=content,
            sent_at=datetime.utcnow(),
            reply_to=message_id
        )
        db.session.add(new_reply)
        db.session.commit()

        return jsonify({'message': 'Reply sent successfully', 'message_id': new_reply.id}), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('', methods=['GET'])
def get_groups():
    """Récupérer tous les groupes"""
    try:
        groups = Group.query.all()
        return jsonify({
            'groups': [{'id': g.id, 'name': g.name, 'created_by': g.created_by} for g in groups]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@group_chat_bp.route('', methods=['OPTIONS'])
def options():
    """Gérer les requêtes préflight CORS"""
    return '', 200

@socketio.on('send_group_message')
def handle_send_group_message(data):
    """Gérer l'envoi d'un message dans un groupe"""
    group_id = data.get('group_id')
    sender_id = data.get('sender_id')
    content = data.get('content')

    if not group_id or not sender_id or not content:
        emit('message_error', {'error': 'Données manquantes'}, room=request.sid)
        return

    # Vérifier que le groupe existe
    group = Group.query.get(group_id)
    if not group:
        emit('message_error', {'error': 'Groupe non trouvé'}, room=request.sid)
        return

    # Vérifier que l'utilisateur est membre du groupe
    membership = GroupMember.query.filter_by(group_id=group_id, user_id=sender_id).first()
    if not membership:
        emit('message_error', {'error': 'Utilisateur non membre du groupe'}, room=request.sid)
        return

    # Créer le message
    new_message = Chat(
        conversation_id=group_id,
        sender_id=sender_id,
        content=content
    )
    db.session.add(new_message)
    db.session.commit()

    # Diffuser le message à tous les membres du groupe
    emit('new_group_message', {
        'id': new_message.id,
        'group_id': group_id,
        'sender_id': sender_id,
        'content': content,
        'send_at': new_message.send_at.isoformat()
    }, room=f'group_{group_id}')

@socketio.on('join_group')
def handle_join_group(data):
    """Rejoindre un groupe"""
    group_id = data.get('group_id')
    user_id = data.get('user_id')

    if not group_id or not user_id:
        emit('join_error', {'error': 'Données manquantes'}, room=request.sid)
        return

    # Vérifier que le groupe existe
    group = Group.query.get(group_id)
    if not group:
        emit('join_error', {'error': 'Groupe non trouvé'}, room=request.sid)
        return

    # Vérifier que l'utilisateur est membre du groupe
    membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not membership:
        emit('join_error', {'error': 'Utilisateur non membre du groupe'}, room=request.sid)
        return

    # Rejoindre la room du groupe
    join_room(f'group_{group_id}')
    emit('join_success', {'message': f'Utilisateur {user_id} a rejoint le groupe {group_id}'}, room=f'group_{group_id}')


@socketio.on('leave_group')
def handle_leave_group(data):
    """Quitter un groupe"""
    group_id = data.get('group_id')
    user_id = data.get('user_id')

    if not group_id or not user_id:
        emit('leave_error', {'error': 'Données manquantes'}, room=request.sid)
        return

    # Quitter la room du groupe
    leave_room(f'group_{group_id}')
    emit('leave_success', {'message': f'Utilisateur {user_id} a quitté le groupe {group_id}'}, room=f'group_{group_id}')


@group_chat_bp.route('', methods=['POST'])
def create_group():
    """Créer un nouveau groupe"""
    data = request.get_json()
    name = data.get('name')
    created_by = data.get('created_by')
    user_ids = data.get('user_ids', [])

    if not name or not created_by or not user_ids:
        return jsonify({'error': 'Champs requis manquants'}), 400

    try:
        group = Group(name=name, created_by=created_by)
        db.session.add(group)
        db.session.flush()

        for user_id in user_ids:
            member = GroupMember(group_id=group.id, user_id=user_id)
            db.session.add(member)

        db.session.commit()

        return jsonify({'success': True, 'group_id': group.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
