import cloudinary
import cloudinary.uploader
from flask import current_app

def init_cloudinary(app):
    """Initialize Cloudinary with app configuration"""
    cloudinary.config(
        cloud_name=app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=app.config['CLOUDINARY_API_KEY'],
        api_secret=app.config['CLOUDINARY_API_SECRET']
    )

def upload_file(file):
    """Upload a file to Cloudinary and return URL and file type"""
    if not file:
        return None, None
        
    file_type = file.content_type
    response = cloudinary.uploader.upload(file, resource_type='auto')
    url = response['secure_url']
    
    return url, file_type

def determine_media_type(file_type):
    """Determine media type from file content type"""
    if file_type.startswith('image'):
        return 'image'
    elif file_type.startswith('video'):
        return 'video'
    elif file_type.startswith('image/gif'):
        return 'gif'
    else:
        return None 