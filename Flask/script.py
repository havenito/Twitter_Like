from flask import Flask
from flask_mail import Mail, Message

app = Flask(__name__)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'enzomartinez682@gmail.com'
app.config['MAIL_PASSWORD'] = 'qnrnrrmkctuorijy'  # Mot de passe d'application
app.config['MAIL_DEFAULT_SENDER'] = 'enzomartinez682@gmail.com'

mail = Mail(app)

@app.route('/send-email')
def send_email():
    try:
        msg = Message(
            subject="Test Flask-Mail",
            recipients=["henrypierredu78@gmail.com"],  # Remplacez par un email valide
            body="Ceci est un test d'email envoyé avec Flask-Mail."
        )
        mail.send(msg)
        return "Email envoyé avec succès !"
    except Exception as e:
        return f"Erreur lors de l'envoi de l'email : {e}"

if __name__ == '__main__':
    app.run(debug=True)