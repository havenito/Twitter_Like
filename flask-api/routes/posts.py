from flask import Blueprint, request, jsonify
from models import db
from models.post import Post
from services.file_upload import upload_file, determine_media_type
import os

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/api/upload', methods=['POST'])
def upload_file_route():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    url, file_type = upload_file(file)
    
    if not url:
        return jsonify({'error': 'File upload failed'}), 500
        
    return jsonify({'url': url, 'file_type': file_type})

@posts_bp.route('/api/create_post', methods=['POST'])
def create_post():
    try:
        title = request.form['title']
        content = request.form['content']
        published_at = request.form['published_at']
        post_id = request.form.get('post_id')
        user_id = request.form['user_id']
        category_id = request.form['category_id']
        
        # Valeurs par défaut pour media_url et media_type
        default_media_url = None
        default_media_type = None
        
        # Créer le post avec des valeurs par défaut pour les colonnes NOT NULL
        post = Post(
            title=title, 
            content=content, 
            published_at=published_at,
            user_id=user_id, 
            category_id=category_id, 
            post_id=post_id,
            media_url=default_media_url,
            media_type=default_media_type
        )
        
        db.session.add(post)
        db.session.commit()
        
        # Maintenant traiter les médias
        media_files = []
        
        # Cas 1: Un seul fichier avec la clé 'file'
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                media_files.append(file)
                
        # Cas 2: Plusieurs fichiers avec les clés 'files[]'
        if 'files[]' in request.files:
            files = request.files.getlist('files[]')
            for file in files:
                if file.filename:
                    media_files.append(file)
        
        # Traiter chaque fichier média
        first_media_url = None
        first_media_type = None
        
        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue  # Ignorer les fichiers qui échouent
                
            media_type = determine_media_type(file_type)
            if not media_type:
                continue  # Ignorer les fichiers de type non supporté
            
            # Garder le premier média pour mettre à jour le post
            if first_media_url is None:
                first_media_url = url
                first_media_type = media_type
                
            # Créer un enregistrement PostMedia
            from models.post_media import PostMedia
            post_media = PostMedia(
                post_id=post.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(post_media)
        
        # Mettre à jour le post avec le premier média si disponible
        if first_media_url:
            post.media_url = first_media_url
            post.media_type = first_media_type
            db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully', 
            'post_id': post.id,
            'media_count': len(media_files)
        })
    
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create post: {str(e)}'}), 500

@posts_bp.route('/api/update_post/<int:post_id>', methods=['PUT', 'POST'])
def update_post(post_id):
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
            
        if 'title' in request.form:
            post.title = request.form['title']
        
        if 'content' in request.form:
            post.content = request.form['content']
            
        if 'category_id' in request.form:
            post.category_id = request.form['category_id']
        
        # Gestion des nouveaux fichiers
        media_files = []
        
        # Cas 1: Un seul fichier avec la clé 'file'
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                media_files.append(file)
                
        # Cas 2: Plusieurs fichiers avec les clés 'files[]'
        if 'files[]' in request.files:
            files = request.files.getlist('files[]')
            for file in files:
                if file.filename:
                    media_files.append(file)
        
        # Suppression de médias
        if 'remove_media_ids' in request.form:
            from models.post_media import PostMedia
            media_ids_to_remove = request.form.getlist('remove_media_ids')
            for media_id in media_ids_to_remove:
                media_to_delete = PostMedia.query.get(media_id)
                if media_to_delete:
                    db.session.delete(media_to_delete)
        
        # Si demande de supprimer tous les médias
        if request.form.get('remove_all_media') == 'true':
            from models.post_media import PostMedia
            PostMedia.query.filter_by(post_id=post.id).delete()
            post.media_url = None
            post.media_type = None
        
        # Traiter chaque nouveau fichier média
        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue
                
            media_type = determine_media_type(file_type)
            if not media_type:
                continue
                
            # Créer un enregistrement PostMedia
            from models.post_media import PostMedia
            post_media = PostMedia(
                post_id=post.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(post_media)
        
        # Mise à jour de media_url et media_type pour rétrocompatibilité
        if media_files and hasattr(post, 'media_url'):
            from models.post_media import PostMedia
            first_media = PostMedia.query.filter_by(post_id=post.id).first()
            if first_media:
                post.media_url = first_media.media_url
                post.media_type = first_media.media_type

        db.session.commit()
        
        # Récupérer tous les médias pour la réponse
        from models.post_media import PostMedia
        media_list = PostMedia.query.filter_by(post_id=post.id).all()
        media = []
        
        for item in media_list:
            media.append({
                'id': item.id,
                'url': item.media_url,
                'type': item.media_type
            })
        
        return jsonify({
            'message': 'Post updated successfully',
            'post': {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'media_url': post.media_url,
                'media_type': post.media_type,
                'media': media
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update post: {str(e)}'}), 500

@posts_bp.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Récupérer les médias associés au post
    from models.post_media import PostMedia
    media_list = PostMedia.query.filter_by(post_id=post.id).all()
    media = []
    
    for item in media_list:
        media.append({
            'id': item.id,
            'url': item.media_url,
            'type': item.media_type
        })
        
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'published_at': post.published_at,
        'media_url': post.media_url,  # Pour rétrocompatibilité
        'media_type': post.media_type,  # Pour rétrocompatibilité
        'media': media,  # Nouvelle liste de tous les médias
        'user_id': post.user_id,
        'category_id': post.category_id
    })

@posts_bp.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
            
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete post: {str(e)}'}), 500

@posts_bp.route('/api/posts', methods=['GET'])
def get_all_posts():
    try:
        posts = Post.query.order_by(Post.published_at.desc()).all()
        result = []
        
        for post in posts:
            # Récupérer les médias pour chaque post
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = []
            
            for item in media_list:
                media.append({
                    'id': item.id,
                    'url': item.media_url,
                    'type': item.media_type
                })
                
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'published_at': post.published_at,
                'media_url': post.media_url,
                'media_type': post.media_type,
                'media': media,
                'user_id': post.user_id,
                'category_id': post.category_id
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch posts: {str(e)}'}), 500

@posts_bp.route('/api/media/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    try:
        from models.post_media import PostMedia
        
        # Récupérer le média par son ID
        media = PostMedia.query.get(media_id)
        if not media:
            return jsonify({'error': 'Média non trouvé'}), 404
        
        # Tenter de supprimer le fichier physique
        if media.media_url:
            file_path = os.path.join(os.getcwd(), media.media_url.lstrip('/'))
            if os.path.exists(file_path):
                os.remove(file_path)
            else:
                # Si le chemin absolu ne fonctionne pas, essayer avec le chemin relatif
                relative_path = media.media_url.lstrip('/')
                if os.path.exists(relative_path):
                    os.remove(relative_path)
        
        # Stocker l'ID du post pour la mise à jour éventuelle
        post_id = media.post_id
        
        # Supprimer l'enregistrement de la base de données
        db.session.delete(media)
        db.session.commit()
        
        # Mettre à jour le post parent si nécessaire (pour rétrocompatibilité)
        post = Post.query.get(post_id)
        if post and post.media_url == media.media_url:
            # Le média supprimé était le média principal du post, mise à jour nécessaire
            first_media = PostMedia.query.filter_by(post_id=post_id).first()
            if first_media:
                post.media_url = first_media.media_url
                post.media_type = first_media.media_type
            else:
                post.media_url = None
                post.media_type = None
            db.session.commit()
        
        return jsonify({'message': 'Média supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la suppression du média: {str(e)}'}), 500

