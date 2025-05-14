import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables first
load_dotenv('../.flaskenv')  # Adjust path if needed

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'postgresql://postgres.wubjzcnmqyvehftmoieo:Enzolise1976...@localhost:6543/postgres'
db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Define required models if they don't exist elsewhere
class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    nb_publications = db.Column(db.Integer, default=0)
    # Add other fields as needed

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    published_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())    
    media_url = db.Column(db.String(200))
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    media_type = db.Column(db.String(50), nullable=True)  # 'image', 'video', 'gif'

# Add prefix to routes for consistency
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    file_type = file.content_type
    response = cloudinary.uploader.upload(file, resource_type='auto')
    url = response['secure_url']
    return jsonify({'url': url, 'file_type': file_type})

@app.route('/api/create_post', methods=['POST'])
def create_post():
    try:
        title = request.form['title']
        content = request.form['content']
        published_at = request.form['published_at']
        post_id = request.form.get('post_id')
        user_id = request.form['user_id']
        category_id = request.form['category_id']
        
        # Handle file upload if present
        if 'file' in request.files:
            file = request.files['file']
            file_type = file.content_type
            response = cloudinary.uploader.upload(file, resource_type='auto')
            url = response['secure_url']
            
            post = Post(title=title, content=content, published_at=published_at, 
                       media_url=url, user_id=user_id, category_id=category_id, post_id=post_id)
                       
            if file_type.startswith('image'):
                post.media_type = 'image'
            elif file_type.startswith('video'):
                post.media_type = 'video'
            elif file_type.startswith('image/gif'):
                post.media_type = 'gif'
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
        else:
            post = Post(title=title, content=content, published_at=published_at,
                       user_id=user_id, category_id=category_id, post_id=post_id)
        
        db.session.add(post)
        db.session.commit()
        return jsonify({'message': 'Post created successfully', 'post_id': post.id})
    
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create post: {str(e)}'}), 500

@app.route('/api/update_post/<int:post_id>', methods=['PUT', 'POST'])
def update_post(post_id):
    try:
        # Find the post by ID
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
            
        # Update basic fields if provided
        if 'title' in request.form:
            post.title = request.form['title']
        
        if 'content' in request.form:
            post.content = request.form['content']
            
        if 'category_id' in request.form:
            post.category_id = request.form['category_id']
            
        # Handle file update if present
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:  # Check if a new file was actually provided
                file_type = file.content_type
                response = cloudinary.uploader.upload(file, resource_type='auto')
                url = response['secure_url']
                
                # Update media info
                post.media_url = url
                
                if file_type.startswith('image'):
                    post.media_type = 'image'
                elif file_type.startswith('video'):
                    post.media_type = 'video'
                elif file_type.startswith('image/gif'):
                    post.media_type = 'gif'
                else:
                    return jsonify({'error': 'Unsupported file type'}), 400
                    
        # Handle media removal if requested
        if request.form.get('remove_media') == 'true':
            post.media_url = None
            post.media_type = None
        
        # Commit changes
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

@app.route('/api/posts/<int:post_id>', methods=['GET'])
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

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
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

# Create tables before running
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)