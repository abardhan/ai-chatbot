import os
from groq import Groq
from dotenv import load_dotenv
from http.server import BaseHTTPRequestHandler
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)

        user_message = data.get("message", "")

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": user_message}],
            model="llama3-8b-8192",
        )

        response_text = chat_completion.choices[0].message.content

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"response": response_text}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()