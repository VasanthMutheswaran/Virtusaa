import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

context = "What is polymorphism?"
correct_answer = "Polymorphism allows objects of different classes to be treated as objects of a common superclass."

prompt = f"""
Generate ONE standalone technical follow-up question that explores the underlying CONCEPT of the technical topic provided.
Do NOT refer to previous options or question numbers.

TOPIC/CONTEXT: {context}
CORRECT ANSWER FOR CONTEXT: {correct_answer}

Return a JSON object with:
1. "question": The conceptual follow-up question (concise, max 15 words).
2. "keywords": A list of 3-5 specific technical keywords/concepts that should be present in a good answer.

Goal: Probe deeper into the "How" or "Why" of the concept rather than just re-asking the base question.
Return ONLY JSON.
"""

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("models/gemini-flash-latest")
    response = model.generate_content(prompt)
    res_text = response.text.strip()
    print(f"RAW RESPONSE:\n{res_text}\n")
    
    if "```" in res_text:
        res_text = res_text.split("```")[1]
        if res_text.startswith("json"):
            res_text = res_text[4:]
    
    print(f"CLEANED TEXT:\n{res_text.strip()}\n")
    result = json.loads(res_text.strip())
    print("SUCCESS:", result)
except Exception as e:
    print("ERROR:", str(e))
