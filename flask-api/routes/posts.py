from flask import Blueprint, request, jsonify
from models import db
from models.post import Post
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
        
        if 'file' in request.files:
            file = request.files['file']
            url, file_type = upload_file(file)
            
            if not url:
                return jsonify({'error': 'File upload failed'}), 500
                
            media_type = determine_media_type(file_type)
            if not media_type:
                return jsonify({'error': 'Unsupported file type'}), 400
                
            post = Post(
                title=title, 
                content=content, 
                published_at=published_at, 
                media_url=url, 
                user_id=user_id, 
                category_id=category_id, 
                post_id=post_id,
                media_type=media_type
            )
        else:
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
        
        # Mise à jour du post_id dans la catégorie correspondante
        from models.category import Category
        category = Category.query.get(category_id)
        if category:
            category.post_id = post.id
            db.session.commit()
        
        return jsonify({'message': 'Post created successfully', 'post_id': post.id})
    
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
            
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                url, file_type = upload_file(file)
                if not url:
                    return jsonify({'error': 'File upload failed'}), 500
                    
                post.media_url = url
                post.media_type = determine_media_type(file_type)
                
                if not post.media_type:
                    return jsonify({'error': 'Unsupported file type'}), 400
                    

        if request.form.get('remove_media') == 'true':
            post.media_url = None
            post.media_type = None
        

        db.session.commit()
        
        return jsonify({
            'message': 'Post updated successfully',
            'post': {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'media_url': post.media_url,
                'media_type': post.media_type
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
        
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'published_at': post.published_at,
        'media_url': post.media_url,
        'media_type': post.media_type,
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
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'published_at': post.published_at,
                'media_url': post.media_url,
                'media_type': post.media_type,
                'user_id': post.user_id,
                'category_id': post.category_id
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch posts: {str(e)}'}), 500