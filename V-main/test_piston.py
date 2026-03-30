import urllib.request
import json

url = "https://emkc.org/api/v2/piston/runtimes"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        print(len(result), "runtimes found. Sample:", result[0])
except Exception as e:
    print(f"Error: {e}")
