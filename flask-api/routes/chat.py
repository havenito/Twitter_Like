from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.chat import Chat
from datetime import datetime, timedelta
import traceback

chats_bp = Blueprint('chats_api', __name__)

# Créer un nouveau message
@chats_bp.route('/api/chats', methods=['POST'])
def create_chat():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        conversation_id = data.get('conversation_id')
        sender_id = data.get('sender_id')
        content = data.get('content')
        reply_to_id = data.get('reply_to_id')

        if not conversation_id or not sender_id or not content:
            return jsonify({'error': 'conversation_id, sender_id et content sont requis'}), 400

        # Vérifier que l'utilisateur existe
        sender = User.query.get(sender_id)
        if not sender:
            return jsonify({'error': 'Utilisateur expéditeur non trouvé'}), 404

        # Créer le nouveau chat
        new_chat = Chat(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            reply_to_id=reply_to_id
        )
        
        db.session.add(new_chat)
        db.session.commit()

        return jsonify({
            'message': 'Message créé avec succès', 
            'chat_id': new_chat.id,
            'chat': new_chat.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la création du chat: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer tous les messages
@chats_bp.route('/api/chats', methods=['GET'])
def get_chats():
    try:
        chats = Chat.query.order_by(Chat.send_at.asc()).all()
        chats_list = [chat.to_dict() for chat in chats]
        
        return jsonify({
            'chats': chats_list,
            'total': len(chats_list)
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des chats: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer un message spécifique
@chats_bp.route('/api/chats/<int:chat_id>', methods=['GET'])
def get_chat(chat_id):
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Message non trouvé'}), 404

        return jsonify(chat.to_dict()), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération du chat {chat_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Mettre à jour un message
@chats_bp.route('/api/chats/<int:chat_id>', methods=['PUT'])
def update_chat(chat_id):
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Message non trouvé'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400

        # Mettre à jour les champs fournis
        if 'content' in data:
            chat.content = data['content']
        if 'reply_to_id' in data:
            chat.reply_to_id = data['reply_to_id']

        db.session.commit()

        return jsonify({
            'message': 'Message mis à jour avec succès',
            'chat': chat.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la mise à jour du chat {chat_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Supprimer un message
@chats_bp.route('/api/chats/<int:chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Message non trouvé'}), 404

        db.session.delete(chat)
        db.session.commit()

        return jsonify({'message': 'Message supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la suppression du chat {chat_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer les réponses d'un message
@chats_bp.route('/api/chats/<int:chat_id>/replies', methods=['GET'])
def get_replies(chat_id):
    try:
        # Vérifier que le message parent existe
        parent_chat = Chat.query.get(chat_id)
        if not parent_chat:
            return jsonify({'error': 'Message parent non trouvé'}), 404

        # Récupérer toutes les réponses
        replies = Chat.query.filter_by(reply_to_id=chat_id).order_by(Chat.send_at.asc()).all()
        replies_list = [reply.to_dict() for reply in replies]

        return jsonify({
            'parent_chat_id': chat_id,
            'replies': replies_list,
            'total_replies': len(replies_list)
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des réponses pour le chat {chat_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer les informations de l'expéditeur d'un message
@chats_bp.route('/api/chats/<int:chat_id>/sender', methods=['GET'])
def get_chat_sender(chat_id):
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Message non trouvé'}), 404

        sender = User.query.get(chat.sender_id)
        if not sender:
            return jsonify({'error': 'Expéditeur non trouvé'}), 404

        return jsonify({
            'id': sender.id,
            'username': sender.pseudo,  # Utiliser 'username' au lieu de 'pseudo'
            'email': sender.email,
            'first_name': getattr(sender, 'first_name', None),
            'last_name': getattr(sender, 'last_name', None)
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération de l'expéditeur pour le chat {chat_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer les messages d'une conversation spécifique
@chats_bp.route('/api/conversations/<int:conversation_id>/chats', methods=['GET'])
def get_conversation_chats(conversation_id):
    try:
        chats = Chat.query.filter_by(conversation_id=conversation_id).order_by(Chat.send_at.asc()).all()
        chats_list = [chat.to_dict() for chat in chats]
        
        # Récupérer les informations des participants
        participants_ids = set(chat.sender_id for chat in chats)
        participants = []
        
        for user_id in participants_ids:
            user = User.query.get(user_id)
            if user:
                participants.append({
                    'id': user.id,
                    'username': user.pseudo,  # Utiliser 'pseudo' au lieu de 'username'
                    'email': user.email
                })

        return jsonify({
            'conversation_id': conversation_id,
            'chats': chats_list,
            'total_messages': len(chats_list),
            'participants': participants
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des chats de la conversation {conversation_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer toutes les conversations d'un utilisateur
@chats_bp.route('/api/chats/conversations/<int:user_id>', methods=['GET'])
def get_user_conversations(user_id):
    try:
        # Vérifier que l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Récupérer toutes les conversations où l'utilisateur a participé
        user_chats = Chat.query.filter_by(sender_id=user_id).all()
        conversation_ids = set(chat.conversation_id for chat in user_chats)
        
        # Ajouter les conversations où l'utilisateur pourrait avoir reçu des messages
        all_chats = Chat.query.all()
        for chat in all_chats:
            conv_id_str = str(chat.conversation_id)
            user_id_str = str(user_id)
            if user_id_str in conv_id_str:
                conversation_ids.add(chat.conversation_id)
        
        conversations = []
        for conv_id in conversation_ids:
            # Récupérer le dernier message de chaque conversation
            last_message = Chat.query.filter_by(conversation_id=conv_id).order_by(Chat.send_at.desc()).first()
            
            # Récupérer tous les participants de cette conversation
            conv_chats = Chat.query.filter_by(conversation_id=conv_id).all()
            participants_ids = set(chat.sender_id for chat in conv_chats)
            
            # Trouver l'autre participant
            other_participant_id = None
            for p_id in participants_ids:
                if p_id != user_id:
                    other_participant_id = p_id
                    break
            
            if other_participant_id:
                other_participant = User.query.get(other_participant_id)
                if other_participant:
                    conversations.append({
                        'conversation_id': conv_id,
                        'other_user': {
                            'id': other_participant.id,
                            'username': getattr(other_participant, 'pseudo', None),  # Utilise pseudo si disponible
                            'email': other_participant.email,
                            'first_name': other_participant.first_name,
                            'last_name': other_participant.last_name
                        },
                        'last_message': last_message.to_dict() if last_message else None,
                        'unread_count': 0,
                        'total_messages': len([c for c in conv_chats if c.conversation_id == conv_id])
                    })
        
        # Trier par date du dernier message
        conversations.sort(key=lambda x: x['last_message']['send_at'] if x['last_message'] else '', reverse=True)

        return jsonify({
            'user_id': user_id,
            'conversations': conversations,
            'total_conversations': len(conversations)
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des conversations pour l'utilisateur {user_id}: {str(e)}")
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Récupérer les messages d'une conversation spécifique (nouvelle route)
@chats_bp.route('/api/chats/conversation/<int:conversation_id>', methods=['GET'])
def get_conversation_messages(conversation_id):
    since_timestamp = request.args.get('since')
    
    query = Chat.query.filter_by(conversation_id=conversation_id)
    
    if since_timestamp:
        # Seulement les messages après ce timestamp
        query = query.filter(Chat.send_at > since_timestamp)
    
    messages = query.order_by(Chat.send_at.asc()).all()
    
    return jsonify({
        'messages': [message.to_dict() for message in messages]
    })

# Créer une nouvelle conversation privée
@chats_bp.route('/api/chats/private', methods=['POST'])
def create_private_conversation():
    """Route de fallback pour l'envoi de messages sans WebSocket"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        sender_id = data.get('sender_id')
        recipient_id = data.get('recipient_id')
        content = data.get('content')

        if not sender_id or not recipient_id or not content:
            return jsonify({'error': 'sender_id, recipient_id et content sont requis'}), 400

        if sender_id == recipient_id:
            return jsonify({'error': 'Vous ne pouvez pas vous envoyer un message à vous-même'}), 400

        # Vérifier que les utilisateurs existent
        sender = User.query.get(sender_id)
        recipient = User.query.get(recipient_id)
        
        if not sender:
            return jsonify({'error': 'Expéditeur non trouvé'}), 404
        if not recipient:
            return jsonify({'error': 'Destinataire non trouvé'}), 404

        # Créer un ID de conversation unique basé sur les IDs des utilisateurs
        sorted_ids = sorted([sender_id, recipient_id])
        conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")

        # Créer le nouveau message
        new_chat = Chat(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            reply_to_id=None
        )
        
        db.session.add(new_chat)
        db.session.commit()

        # Récupérer le message avec sa date exacte
        created_chat = Chat.query.get(new_chat.id)

        # Si WebSocket est disponible, émettre le message
        try:
            from websocket_chat import socketio
            message_data = {
                'id': created_chat.id,
                'conversation_id': conversation_id,
                'sender_id': sender_id,
                'content': content,
                'send_at': created_chat.send_at.isoformat(),
            }
            socketio.emit('new_message', message_data, room=f"conv_{conversation_id}")
        except:
            pass  # WebSocket non disponible, continuer sans

        return jsonify({
            'success': True,
            'message': 'Message envoyé avec succès',
            'chat_id': created_chat.id,
            'conversation_id': conversation_id,
            'chat': created_chat.to_dict(),
            'recipient': {
                'id': recipient.id,
                'pseudo': getattr(recipient, 'pseudo', None),
                'email': recipient.email,
                'first_name': getattr(recipient, 'first_name', None),
                'last_name': getattr(recipient, 'last_name', None)
            },
            'timestamp': created_chat.send_at.isoformat()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la création du message privé: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500

# Remplacez la route message_stream par celle-ci

@chats_bp.route('/api/chats/new/<int:user_id>')
def get_new_messages_simple(user_id):
    """
    Récupère les nouveaux messages pour un utilisateur depuis un timestamp donné
    """
    try:
        since_param = request.args.get('since')
        
        if since_param:
            # Convertir le timestamp ISO en datetime
            try:
                since_timestamp = datetime.fromisoformat(since_param.replace('Z', '+00:00'))
            except:
                since_timestamp = datetime.utcnow() - timedelta(seconds=30)
        else:
            since_timestamp = datetime.utcnow() - timedelta(seconds=30)
        
        # Récupérer toutes les conversations de l'utilisateur
        user_chats = Chat.query.filter_by(sender_id=user_id).all()
        conversation_ids = set(chat.conversation_id for chat in user_chats)
        
        # Ajouter les conversations où l'utilisateur pourrait avoir reçu des messages
        all_chats = Chat.query.all()
        for chat in all_chats:
            conv_id_str = str(chat.conversation_id)
            user_id_str = str(user_id)
            if user_id_str in conv_id_str:
                conversation_ids.add(chat.conversation_id)
        
        # Récupérer les nouveaux messages dans ces conversations
        new_messages = []
        for conv_id in conversation_ids:
            messages = Chat.query.filter(
                Chat.conversation_id == conv_id,
                Chat.send_at > since_timestamp,
                Chat.sender_id != user_id  # Exclure les messages de l'utilisateur lui-même
            ).order_by(Chat.send_at.asc()).all()
            
            for message in messages:
                message_dict = message.to_dict()
                message_dict['conversation_id'] = conv_id
                new_messages.append(message_dict)
        
        return jsonify({
            'success': True,
            'messages': new_messages,
            'timestamp': datetime.utcnow().isoformat(),
            'count': len(new_messages)
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des nouveaux messages: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Dans routes/chat.py, ajoutez cette route
@chats_bp.route('/api/chats/conversation/<int:conversation_id>', methods=['OPTIONS'])
def handle_conversation_options(conversation_id):
    """Gérer les requêtes preflight CORS"""
    return '', 200
