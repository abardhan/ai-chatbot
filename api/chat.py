from groq import Groq
import json
import os

def handler(request):
    # OPTIONS request handle করো
    if request.method == "OPTIONS":
        return Response(
            "",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

    body = json.loads(request.body)
    messages = body.get("messages", [])

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "system",
            "content": "তুমি একজন helpful AI assistant। বাংলায় উত্তর দাও।"
        }] + messages,
        max_tokens=1000
    )

    reply = response.choices[0].message.content

    return Response(
        json.dumps({"reply": reply}),
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        }
    )