from flask import Blueprint, request, jsonify
from models import db
from models.post import Post
from models.user import User
from models.category import Category
from services.file_upload import upload_file, determine_media_type

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
        
        # Créer le post sans médias
        post = Post(
            title=title, 
            content=content, 
            published_at=published_at,
            user_id=user_id, 
            category_id=category_id, 
            post_id=post_id
        )
        
        db.session.add(post)
        db.session.commit()
        
        # Gérer les médias uniquement dans PostMedia
        media_files = []
        
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                media_files.append(file)
                
        if 'files[]' in request.files:
            files = request.files.getlist('files[]')
            for file in files:
                if file.filename:
                    media_files.append(file)
        
        # Ajouter tous les médias dans PostMedia uniquement
        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue 
                
            media_type = determine_media_type(file_type)
            if not media_type:
                continue 
                
            from models.post_media import PostMedia
            post_media = PostMedia(
                post_id=post.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(post_media)
        
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
        
        # Gérer la suppression des médias existants
        if 'delete_media_ids' in request.form:
            import json
            from models.post_media import PostMedia
            try:
                media_ids_to_delete = json.loads(request.form['delete_media_ids'])
                
                if isinstance(media_ids_to_delete, list):
                    for media_id in media_ids_to_delete:
                        media_to_delete = PostMedia.query.get(media_id)
                        if media_to_delete and media_to_delete.post_id == post.id:
                            db.session.delete(media_to_delete)
                            
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Erreur lors du parsing des IDs de médias à supprimer: {e}")
        
        # Ajouter nouveaux médias
        media_files = []
        
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                media_files.append(file)
                
        if 'new_files[]' in request.files:
            files = request.files.getlist('new_files[]')
            for file in files:
                if file.filename:
                    media_files.append(file)
        
        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue
                 
            media_type = determine_media_type(file_type)
            if not media_type:
                continue
                 
            from models.post_media import PostMedia
            post_media = PostMedia(
                post_id=post.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(post_media)

        db.session.commit()
        
        # Récupérer la liste mise à jour des médias
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
    
    from models.post_media import PostMedia
    media_list = PostMedia.query.filter_by(post_id=post.id).all()
    media = []
    
    for item in media_list:
        media.append({
            'id': item.id,
            'url': item.media_url,
            'type': item.media_type
        })
    user = User.query.get(post.user_id)
        
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'published_at': post.published_at,
        'media': media,
        'user_id': post.user_id,
        'category_id': post.category_id,
        'user_pseudo': user.pseudo if user else 'Utilisateur supprimé'
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
            # Récupérer les informations de l'utilisateur
            user = User.query.get(post.user_id)
            
            # Récupérer les informations de la catégorie
            category = Category.query.get(post.category_id)
            
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in media_list]
            
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'publishedAt': post.published_at.isoformat(),
                'media': media,
                'userId': post.user_id,
                'categoryId': post.category_id,
                # Ajout des informations utilisateur
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else 'Utilisateur supprimé',
                    'profilePicture': user.profile_picture if user else None,
                    'firstName': user.first_name if user else None,
                    'lastName': user.last_name if user else None
                },
                # Ajout des informations de catégorie
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else 'Catégorie supprimée',
                    'description': category.description if category else None
                }
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/api/media/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    try:
        from models.post_media import PostMedia
        media_to_delete = PostMedia.query.get(media_id)
        
        if not media_to_delete:
            return jsonify({'error': 'Média non trouvé'}), 404
        
        db.session.delete(media_to_delete)
        db.session.commit()
        
        return jsonify({'message': 'Média supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la suppression du média: {str(e)}'}), 500

@posts_bp.route('/api/users/<int:user_id>/posts', methods=['GET'])
def get_user_posts(user_id):
    try:
        posts = Post.query.filter_by(user_id=user_id).order_by(Post.published_at.desc()).all()
        result = []
        
        # Récupérer les informations de l'utilisateur une fois
        user = User.query.get(user_id)
        
        for post in posts:
            # Récupérer les informations de la catégorie
            category = Category.query.get(post.category_id)
            
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = []
            
            for item in media_list:
                media.append({
                    'id': item.id,
                    'url': item.media_url,
                    'type': item.media_type,
                    'created_at': item.created_at.isoformat() if item.created_at else None
                })
                
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'published_at': post.published_at.isoformat() if post.published_at else None,
                'publishedAt': post.published_at.isoformat() if post.published_at else None,
                'media': media,
                'user_id': post.user_id,
                'userId': post.user_id,
                'category_id': post.category_id,
                'categoryId': post.category_id,
                # Ajout des informations utilisateur
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else 'Utilisateur supprimé',
                    'profilePicture': user.profile_picture if user else None,
                    'firstName': user.first_name if user else None,
                    'lastName': user.last_name if user else None
                },
                # Ajout des informations de catégorie
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else 'Catégorie supprimée',
                    'description': category.description if category else None
                }
            })
        
        return jsonify({'posts': result})
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user posts: {str(e)}'}), 500

@posts_bp.route('/api/posts/foryou', methods=['GET'])
def get_foryou_posts():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 20

        # Ne garder que les posts dont l'auteur est public (private == False)
        posts = (
            Post.query
                .join(User, Post.user_id == User.id)
                .filter(User.private == False)
                .order_by(Post.published_at.desc())
                .paginate(page=page, per_page=per_page, error_out=False)
        )

        result = []
        for post in posts.items:
            # Récupérer les informations de l'utilisateur
            user = User.query.get(post.user_id)
            
            # Récupérer les informations de la catégorie
            category = Category.query.get(post.category_id)
            
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in media_list]
            
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'publishedAt': post.published_at.isoformat(),
                'media': media,
                'userId': post.user_id,
                'categoryId': post.category_id,
                # Ajout des informations utilisateur
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else 'Utilisateur supprimé',
                    'profilePicture': user.profile_picture if user else None,
                    'firstName': user.first_name if user else None,
                    'lastName': user.last_name if user else None
                },
                # Ajout des informations de catégorie
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else 'Catégorie supprimée',
                    'description': category.description if category else None
                }
            })
        
        return jsonify({
            'posts': result,
            'hasNext': posts.has_next,
            'nextPage': posts.next_num if posts.has_next else None,
            'totalPages': posts.pages,
            'currentPage': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/api/posts/following/<int:user_id>', methods=['GET'])
def get_following_posts(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 20
        
        from models.follow import Follow
        following_ids = db.session.query(Follow.followed_id).filter_by(follower_id=user_id).all()
        following_ids = [f[0] for f in following_ids]
        
        if not following_ids:
            return jsonify({
                'posts': [],
                'hasNext': False,
                'nextPage': None,
                'totalPages': 0,
                'currentPage': page
            })
        
        posts = Post.query.filter(Post.user_id.in_(following_ids)).order_by(Post.published_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for post in posts.items:
            # Récupérer les informations de l'utilisateur
            user = User.query.get(post.user_id)
            
            # Récupérer les informations de la catégorie
            category = Category.query.get(post.category_id)
            
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in media_list]
            
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'publishedAt': post.published_at.isoformat(),
                'media': media,
                'userId': post.user_id,
                'categoryId': post.category_id,
                # Ajout des informations utilisateur
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else 'Utilisateur supprimé',
                    'profilePicture': user.profile_picture if user else None,
                    'firstName': user.first_name if user else None,
                    'lastName': user.last_name if user else None
                },
                # Ajout des informations de catégorie
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else 'Catégorie supprimée',
                    'description': category.description if category else None
                }
            })
        
        return jsonify({
            'posts': result,
            'hasNext': posts.has_next,
            'nextPage': posts.next_num if posts.has_next else None,
            'totalPages': posts.pages,
            'currentPage': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    