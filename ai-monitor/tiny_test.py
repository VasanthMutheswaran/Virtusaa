import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("models/gemini-flash-latest")
    response = model.generate_content("Hi")
    print("SUCCESS:", response.text)
except Exception as e:
    print("ERROR:", str(e))
