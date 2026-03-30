import urllib.request
import json

url = "https://api.codex.jaagrav.in/"
data = {
    "language": "py",
    "code": "print('Hello from CodeX')"
}

req = urllib.request.Request(url, json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
