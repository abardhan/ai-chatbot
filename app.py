from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = Flask(__name__)
CORS(app, origins="*")

# Groq API Key এখানে বসাও
client = Groq(api_key=GROQ_API_KEY)

@app.route('/')
def home():
    return "Server চলছে! ✅"

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    data = request.json
    messages = data.get('messages', [])

    # System prompt — AI-এর personality
    system_prompt = {
        "role": "system",
        "content": "তুমি একজন helpful AI assistant। বাংলায় উত্তর দাও।"
    }

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # Groq-এর fast free model
        messages=[system_prompt] + messages,
        max_tokens=1000
    )

    reply = response.choices[0].message.content
    result = jsonify({"reply": reply})
    result.headers.add('Access-Control-Allow-Origin', '*')
    return result

if __name__ == '__main__':
    app.run(port=5000, debug=True)