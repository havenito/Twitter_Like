from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

# Configuration de la base de données
conn = psycopg2.connect(
    dbname="twitterlike",
    user="admin",
    password="secret", 
    host="10.1.4.103",
    port="5433"
)

@app.route('/api/data', methods=['GET'])
def get_data():
    cur = conn.cursor()
    cur.execute("SELECT * FROM comments;")  # Remplacez par le nom de votre table
    rows = cur.fetchall()
    cur.close()

    data = [{"id": row[0], "name": row[1]} for row in rows]  # Ajustez selon votre schéma
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
