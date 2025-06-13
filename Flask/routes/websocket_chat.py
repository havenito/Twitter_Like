from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db
from models.user import User
from models.chat import Chat
import json
from datetime import datetime, timezone, timedelta

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
        print(f"\n🚀 === SENDING MESSAGE VIA WEBSOCKET ===")
        print(f"📨 Received data: {data}")
        
        sender_id = data.get('sender_id')
        recipient_id = data.get('recipient_id')
        content = data.get('content')
        conversation_id = data.get('conversation_id')
        temp_id = data.get('tempId')

        if not all([sender_id, recipient_id, content]):
            print("❌ Missing required data")
            emit('error', {'message': 'Données manquantes'})
            return

        # Vérifier que les utilisateurs existent
        sender = User.query.get(sender_id)
        recipient = User.query.get(recipient_id)
        
        if not sender or not recipient:
            print("❌ User not found")
            emit('error', {'message': 'Utilisateur non trouvé'})
            return

        # Générer l'ID de conversation
        if not conversation_id or isinstance(conversation_id, str):
            sorted_ids = sorted([sender_id, recipient_id])
            conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")
        
        try:
            conversation_id = int(conversation_id)
        except (ValueError, TypeError):
            sorted_ids = sorted([sender_id, recipient_id])
            conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")

        print(f"💡 Final conversation_id: {conversation_id}")

        # VÉRIFICATION ANTI-DOUBLON : Regarder s'il n'y a pas déjà un message identique récent
        recent_threshold = datetime.now(timezone.utc) - timedelta(seconds=5)
        existing_message = Chat.query.filter(
            Chat.conversation_id == conversation_id,
            Chat.sender_id == sender_id,
            Chat.content == content,
            Chat.send_at >= recent_threshold
        ).first()
        
        if existing_message:
            print(f"⚠️ Duplicate message detected, returning existing message: {existing_message.id}")
            
            # Retourner le message existant au lieu d'en créer un nouveau
            message_data = {
                'id': existing_message.id,
                'conversation_id': conversation_id,
                'sender_id': sender_id,
                'content': content,
                'send_at': existing_message.send_at.isoformat().replace('+00:00', 'Z'),
                'sender_info': {
                    'id': sender.id,
                    'first_name': getattr(sender, 'first_name', ''),
                    'last_name': getattr(sender, 'last_name', ''),
                    'email': sender.email
                }
            }
            
            # Confirmer l'envoi à l'expéditeur avec le message existant
            emit('message_sent', {
                'success': True,
                'message_id': existing_message.id,
                'conversation_id': conversation_id,
                'timestamp': existing_message.send_at.isoformat().replace('+00:00', 'Z'),
                'tempId': temp_id,
                'message_data': message_data
            })
            
            return

        # Créer le nouveau message
        new_chat = Chat(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            reply_to_id=None
        )
        
        new_chat.send_at = datetime.now(timezone.utc)
        
        db.session.add(new_chat)
        db.session.commit()
        
        print(f"💾 NEW message saved to DB with ID: {new_chat.id}")

        # Préparer les données du message
        message_data = {
            'id': new_chat.id,
            'conversation_id': conversation_id,
            'sender_id': sender_id,
            'content': content,
            'send_at': new_chat.send_at.isoformat().replace('+00:00', 'Z'),
            'sender_info': {
                'id': sender.id,
                'first_name': getattr(sender, 'first_name', ''),
                'last_name': getattr(sender, 'last_name', ''),
                'email': sender.email
            }
        }

        # Envoyer le message aux participants de la conversation
        room_name = f"conv_{conversation_id}"
        print(f"📡 Broadcasting to room: {room_name}")
        socketio.emit('new_message', message_data, room=room_name, include_self=False)
        
        # Envoyer notification au destinataire
        user_room = f"user_{recipient_id}"
        socketio.emit('message_notification', {
            'conversation_id': conversation_id,
            'sender_id': sender_id,
            'content': content,
            'timestamp': new_chat.send_at.isoformat().replace('+00:00', 'Z')
        }, room=user_room)

        # Confirmer l'envoi à l'expéditeur
        emit('message_sent', {
            'success': True,
            'message_id': new_chat.id,
            'conversation_id': conversation_id,
            'timestamp': new_chat.send_at.isoformat().replace('+00:00', 'Z'),
            'tempId': temp_id,
            'message_data': message_data
        })

        print(f"✅ Message successfully sent from {sender_id} to {recipient_id}")
        print(f"=== END SENDING MESSAGE ===\n")

    except Exception as e:
        db.session.rollback()
        print(f"💥 CRITICAL ERROR in send_message: {str(e)}")
        import traceback
        traceback.print_exc()
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