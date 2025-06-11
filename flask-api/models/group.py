from models import db

class Group(db.Model):
    __tablename__ = 'groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(200), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    avatar_url = db.Column(db.String(200), nullable=True)

    
    def __repr__(self):
        return f'<Group {self.name}>'
    

class GroupMember(db.Model):
    __tablename__ = 'group_members'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    joined_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    role = db.Column(db.String(20), nullable=False, default='member')  # e.g., 'admin', 'member'
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def __repr__(self):
        return f'<GroupMember {self.user_id} in {self.group_id}>'
    
class GroupMessages(db.Model):
    __tablename__ = 'group_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), nullable=False, default='text')  # e.g., 'text', 'image', 'video'
    sent_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    reply_to = db.Column(db.Integer, db.ForeignKey('group_messages.id', ondelete='CASCADE'), nullable=True)  # For threaded messages
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return f'<GroupMessage {self.id} in {self.group_id} by {self.user_id}>'