from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.chat import Chat
from datetime import datetime, timedelta, timezone  # Ajouter timezone ici
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
        
        # Forcer la date UTC
        new_chat.send_at = datetime.now(timezone.utc)
        
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
            'username': sender.pseudo,
            'email': sender.email,
            'first_name': getattr(sender, 'first_name', None),
            'last_name': getattr(sender, 'last_name', None),
            'profile_picture': getattr(sender, 'profile_picture', None),
            'subscription': getattr(sender, 'subscription', 'free')  # Ajouter cette ligne avec fallback
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
                    'username': user.pseudo,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                    'subscription': user.subscription  # Ajouter cette ligne
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
        print(f"=== Getting conversations for user_id: {user_id} ===")
        
        # Vérifier que l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            print(f"❌ User {user_id} not found")
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        print(f"✅ User found: {user.email}")

        def extract_participants_from_conversation_id(conv_id):
            """
            Extrait les IDs des participants à partir de l'ID de conversation
            Format attendu: {user1_id}{user2_id:03d} ou {user1_id}0{user2_id}
            Exemple: 1002 -> participants [1, 2], 71072 -> participants [71, 72]
            """
            conv_str = str(conv_id)
            print(f"🔍 Analyzing conversation ID: {conv_str}")
            
            # Si l'ID contient un 0 au milieu, le diviser à ce point
            if '0' in conv_str[1:-1]:  # Ignorer les 0 en début/fin
                zero_index = conv_str.find('0', 1)  # Chercher à partir du 2ème caractère
                if zero_index > 0:
                    user1_id = int(conv_str[:zero_index])
                    user2_id = int(conv_str[zero_index+1:])
                    print(f"  → Method 1 (split by 0): [{user1_id}, {user2_id}]")
                    return [user1_id, user2_id]
            
            # Méthode alternative: essayer de diviser en supposant que le 2ème ID fait 3 chiffres
            if len(conv_str) >= 4:
                try:
                    # Supposer que les 3 derniers chiffres sont l'ID du 2ème utilisateur
                    user1_id = int(conv_str[:-3])
                    user2_id = int(conv_str[-3:])
                    print(f"  → Method 2 (last 3 digits): [{user1_id}, {user2_id}]")
                    return [user1_id, user2_id]
                except ValueError:
                    pass
            
            # Méthode de fallback: essayer différentes positions de split
            for split_pos in range(1, len(conv_str)):
                try:
                    user1_id = int(conv_str[:split_pos])
                    user2_id = int(conv_str[split_pos:])
                    
                    # Vérifier que les deux IDs sont raisonnables (> 0 et < 100000)
                    if 0 < user1_id < 100000 and 0 < user2_id < 100000 and user1_id != user2_id:
                        print(f"  → Method 3 (split at {split_pos}): [{user1_id}, {user2_id}]")
                        return [user1_id, user2_id]
                except ValueError:
                    continue
            
            print(f"  → ❌ Could not extract participants from {conv_str}")
            return []

        # Récupérer toutes les conversations uniques
        all_conversations = db.session.query(Chat.conversation_id).distinct().all()
        print(f"📊 Total conversations in database: {len(all_conversations)}")
        
        user_conversations = []
        conversation_ids = set()
        
        # Analyser chaque conversation pour voir si l'utilisateur y participe
        for (conv_id,) in all_conversations:
            participants = extract_participants_from_conversation_id(conv_id)
            
            if user_id in participants:
                conversation_ids.add(conv_id)
                print(f"✅ User {user_id} found in conversation {conv_id} with participants {participants}")
        
        # Double vérification: ajouter les conversations où l'utilisateur a envoyé des messages
        sent_conversations = db.session.query(Chat.conversation_id).filter_by(sender_id=user_id).distinct().all()
        for conv in sent_conversations:
            conversation_ids.add(conv[0])
        
        print(f"🎯 Final conversation_ids for user {user_id}: {conversation_ids}")
        
        # Construire les détails de chaque conversation
        for conv_id in conversation_ids:
            try:
                print(f"\n--- Processing conversation {conv_id} ---")
                
                # Récupérer tous les participants réels de cette conversation
                participants_query = db.session.query(Chat.sender_id).filter_by(conversation_id=conv_id).distinct().all()
                actual_participants = [p[0] for p in participants_query]
                print(f"📋 Actual participants from messages: {actual_participants}")
                
                # Combiner avec les participants extraits de l'ID
                id_participants = extract_participants_from_conversation_id(conv_id)
                all_participants = list(set(actual_participants + id_participants))
                
                # Trouver l'autre participant (pas l'utilisateur actuel)
                other_participant_id = None
                for p_id in all_participants:
                    if p_id != user_id:
                        other_participant_id = p_id
                        break
                
                if not other_participant_id:
                    print(f"⚠️ No other participant found for conversation {conv_id}")
                    continue
                
                # Récupérer les infos de l'autre participant
                other_user = User.query.get(other_participant_id)
                if not other_user:
                    print(f"❌ Other participant {other_participant_id} not found in database")
                    continue
                
                # Récupérer le dernier message
                last_message = Chat.query.filter_by(conversation_id=conv_id)\
                    .order_by(Chat.send_at.desc()).first()
                
                # Compter les messages
                total_messages = Chat.query.filter_by(conversation_id=conv_id).count()
                
                # Construire l'objet conversation
                conversation_data = {
                    'conversation_id': conv_id,
                    'other_user': {
                        'id': other_user.id,
                        'username': getattr(other_user, 'pseudo', None) or getattr(other_user, 'username', None),
                        'email': other_user.email,
                        'first_name': getattr(other_user, 'first_name', None),
                        'last_name': getattr(other_user, 'last_name', None),
                        'profile_picture': getattr(other_user, 'profile_picture', None)
                    },
                    'last_message': last_message.to_dict() if last_message else None,
                    'unread_count': 0,
                    'total_messages': total_messages,
                    'participants': all_participants  # Debug info
                }
                
                user_conversations.append(conversation_data)
                print(f"✅ Added conversation {conv_id} with {other_user.email} ({total_messages} messages)")
                
            except Exception as e:
                print(f"❌ Error processing conversation {conv_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Trier par date du dernier message
        user_conversations.sort(
            key=lambda x: x['last_message']['send_at'] if x.get('last_message') and x['last_message'].get('send_at') else '1970-01-01T00:00:00Z', 
            reverse=True
        )
        
        print(f"🎉 Returning {len(user_conversations)} conversations for user {user_id}")
        
        # Debug: afficher le résultat final
        for conv in user_conversations:
            print(f"  - Conv {conv['conversation_id']}: {conv['other_user']['email']} ({conv['total_messages']} messages)")
        
        return jsonify({
            'user_id': user_id,
            'conversations': user_conversations,
            'total_conversations': len(user_conversations)
        }), 200
        
    except Exception as e:
        print(f"💥 ERROR in get_user_conversations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Erreur interne: {str(e)}',
            'user_id': user_id,
            'conversations': [],
            'total_conversations': 0
        }), 500

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
def create_private_message():
    try:
        data = request.get_json()
        print(f"📨 HTTP Message request: {data}")
        
        sender_id = data.get('sender_id')
        recipient_id = data.get('recipient_id')
        content = data.get('content')

        if not all([sender_id, recipient_id, content]):
            return jsonify({'error': 'Données manquantes'}), 400

        # Vérifier que les utilisateurs existent
        sender = User.query.get(sender_id)
        recipient = User.query.get(recipient_id)
        
        if not sender or not recipient:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Générer l'ID de conversation
        sorted_ids = sorted([sender_id, recipient_id])
        conversation_id = int(f"{sorted_ids[0]}{sorted_ids[1]:03d}")

        # VÉRIFICATION ANTI-DOUBLON : Regarder s'il n'y a pas déjà un message identique récent
        recent_threshold = datetime.now(timezone.utc) - timedelta(seconds=5)
        existing_message = Chat.query.filter(
            Chat.conversation_id == conversation_id,
            Chat.sender_id == sender_id,
            Chat.content == content,
            Chat.send_at >= recent_threshold
        ).first()
        
        if existing_message:
            print(f"⚠️ HTTP: Duplicate message detected, returning existing message: {existing_message.id}")
            
            response_data = {
                'success': True,
                'message': 'Message déjà existant',
                'chat': {
                    'id': existing_message.id,
                    'conversation_id': conversation_id,
                    'sender_id': sender_id,
                    'content': content,
                    'send_at': existing_message.send_at.isoformat().replace('+00:00', 'Z'),
                    'reply_to_id': None
                }
            }
            
            return jsonify(response_data), 200

        # Créer le nouveau message
        new_chat = Chat(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content
        )
        
        new_chat.send_at = datetime.now(timezone.utc)
        
        db.session.add(new_chat)
        db.session.commit()

        print(f"✅ HTTP: NEW message saved with ID: {new_chat.id}")

        # Retourner les données du message
        response_data = {
            'success': True,
            'message': 'Message envoyé avec succès',
            'chat': {
                'id': new_chat.id,
                'conversation_id': conversation_id,
                'sender_id': sender_id,
                'content': content,
                'send_at': new_chat.send_at.isoformat().replace('+00:00', 'Z'),
                'reply_to_id': None
            }
        }

        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in HTTP message creation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la création du message: {str(e)}'}), 500

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
