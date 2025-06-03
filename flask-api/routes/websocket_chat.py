from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db
from models.user import User
from models.chat import Chat
import json

# Initialiser SocketIO globalement
socketio = SocketIO()

# Stockage des utilisateurs connectés
connected_users = {}

def init_socketio(app):
    """Initialiser SocketIO avec l'application Flask"""
    socketio.init_app(app, 
                     cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "null"],
                     logger=True, 
                     engineio_logger=True)
    return socketio

# Événements WebSocket pour le chat
@socketio.on('connect')
def handle_connect():
    print(f'Client connecté: {request.sid}')
    emit('status', {'message': 'Connecté au serveur WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client déconnecté: {request.sid}')
    # Supprimer l'utilisateur de la liste des connectés
    for user_id, sid in list(connected_users.items()):
        if sid == request.sid:
            del connected_users[user_id]
            break

@socketio.on('join_user')
def handle_join_user(data):
    """L'utilisateur rejoint sa room personnelle"""
    user_id = data.get('user_id')
    if user_id:
        connected_users[user_id] = request.sid
        join_room(f"user_{user_id}")
        emit('status', {'message': f'Rejoint la room user_{user_id}'})
        print(f'Utilisateur {user_id} a rejoint sa room')

@socketio.on('join_conversation')
def handle_join_conversation(data):
    """L'utilisateur rejoint une conversation spécifique"""
    conversation_id = data.get('conversation_id')
    user_id = data.get('user_id')
    
    if conversation_id and user_id:
        join_room(f"conv_{conversation_id}")
        emit('status', {'message': f'Rejoint la conversation {conversation_id}'})
        print(f'Utilisateur {user_id} a rejoint la conversation {conversation_id}')

@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    """L'utilisateur quitte une conversation"""
    conversation_id = data.get('conversation_id')
    user_id = data.get('user_id')
    
    if conversation_id and user_id:
        leave_room(f"conv_{conversation_id}")
        emit('status', {'message': f'Quitté la conversation {conversation_id}'})
        print(f'Utilisateur {user_id} a quitté la conversation {conversation_id}')

@socketio.on('send_message')
def handle_send_message(data):
    """Envoi d'un message via WebSocket"""
    try:
        sender_id = data.get('sender_id')
        recipient_id = data.get('recipient_id')
        content = data.get('content')
        conversation_id = data.get('conversation_id')

        if not all([sender_id, recipient_id, content]):
            emit('error', {'message': 'Données manquantes'})
            return

        # Vérifier que les utilisateurs existent
        sender = User.query.get(sender_id)
        recipient = User.query.get(recipient_id)
        
        if not sender or not recipient:
            emit('error', {'message': 'Utilisateur non trouvé'})
            return

        # Créer ou utiliser l'ID de conversation - S'ASSURER QUE C'EST UN INTEGER
        if not conversation_id or isinstance(conversation_id, str):
            sorted_ids = sorted([sender_id, recipient_id])
            conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")
        
        # S'assurer que conversation_id est bien un integer
        try:
            conversation_id = int(conversation_id)
        except (ValueError, TypeError):
            sorted_ids = sorted([sender_id, recipient_id])
            conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")

        print(f'Création message avec conversation_id: {conversation_id} (type: {type(conversation_id)})')

        # Créer le message en base de données
        new_chat = Chat(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            reply_to_id=None
        )
        
        db.session.add(new_chat)
        db.session.commit()

        # Préparer les données du message
        message_data = {
            'id': new_chat.id,
            'conversation_id': conversation_id,
            'sender_id': sender_id,
            'content': content,
            'send_at': new_chat.send_at.isoformat(),
            'sender_info': {
                'id': sender.id,
                'first_name': getattr(sender, 'first_name', ''),
                'last_name': getattr(sender, 'last_name', ''),
                'email': sender.email
            }
        }

        # Envoyer le message aux participants de la conversation
        socketio.emit('new_message', message_data, room=f"conv_{conversation_id}")
        
        # Envoyer aussi aux rooms des utilisateurs pour les notifications
        socketio.emit('message_notification', {
            'conversation_id': conversation_id,
            'sender_id': sender_id,
            'content': content,
            'timestamp': new_chat.send_at.isoformat()
        }, room=f"user_{recipient_id}")

        # Confirmer l'envoi à l'expéditeur avec les données du message
        emit('message_sent', {
            'success': True,
            'message_id': new_chat.id,
            'conversation_id': conversation_id,
            'timestamp': new_chat.send_at.isoformat(),
            'message_data': message_data  # Inclure les données pour affichage local
        })

        print(f'Message envoyé de {sender_id} à {recipient_id} dans la conversation {conversation_id}')

    except Exception as e:
        db.session.rollback()
        print(f'Erreur lors de l\'envoi du message: {str(e)}')
        emit('error', {'message': f'Erreur lors de l\'envoi: {str(e)}'})

@socketio.on('typing')
def handle_typing(data):
    """Gestion du statut "en train d'écrire" """
    conversation_id = data.get('conversation_id')
    user_id = data.get('user_id')
    is_typing = data.get('is_typing', False)
    
    if conversation_id and user_id:
        # Envoyer à tous les autres participants de la conversation
        emit('user_typing', {
            'user_id': user_id,
            'is_typing': is_typing,
            'conversation_id': conversation_id
        }, room=f"conv_{conversation_id}", include_self=False)