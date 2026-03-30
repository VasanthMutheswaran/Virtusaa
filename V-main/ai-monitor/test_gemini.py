import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded key: {api_key}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    response = model.generate_content("Hello")
    print("Response:", response.text)
except Exception as e:
    print("Exception:", str(e))
