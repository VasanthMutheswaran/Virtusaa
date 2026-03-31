# Segment 5: AI Engine - Generative AI & Micro-Oral Evaluation

This segment covers the advanced Generative AI features of Project **ILLUSION**, powered by Google Gemini 2.0. These features automate the creation of high-quality assessments and provide deep technical evaluation of candidate responses.

## 1. AI-Powered Question Generator (ai-monitor/app.py)
The following route handles the transformation of a PDF syllabus or text document into a structured assessment containing both MCQs and Coding tasks.

```python
@app.route("/generate", methods=["POST"])
def generate():
    try:
        if "file" not in request.files:
            return jsonify({"error":"No file uploaded"}),400

        file = request.files["file"]
        count = request.form.get("count","5")
        difficulty = request.form.get("difficulty", "MEDIUM")
        gen_type = request.form.get("type", "both")

        # PDF Transcription Logic
        pdf_reader = PyPDF2.PdfReader(file)
        text = "".join([p.extract_text() for p in pdf_reader.pages])[:10000]

        # Gemini 2.0 Flash Configuration
        model = genai.GenerativeModel(
            "models/gemini-2.0-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        prompt = f"Generate EXACTLY {count} {difficulty} questions (Type: {gen_type}) from text: {text}"
        
        response = model.generate_content(prompt)
        return jsonify(json.loads(response.text))

    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify(generate_fallback_questions(count, gen_type, difficulty))
```

## 2. Micro-Oral Assessment Engine (ai-monitor/app.py)
This is a post-exam technical interview feature. It captures the candidate's voice, transcribes it, and evaluates it against the "Ground Truth" using a technical closeness algorithm.

```python
@app.route("/evaluate-oral", methods=["POST"])
def evaluate_oral():
    """
    Evaluates transcript for technical accuracy and clarity.
    Returns: JSON { score, isCorrect, feedback }
    """
    data = request.get_json()
    transcript = data.get("transcript", "")
    question = data.get("question", "")
    expected = data.get("expectedKeywords", [])

    model = genai.GenerativeModel("models/gemini-2.0-flash")
    
    prompt = f"""
    Evaluate candidate's spoken answer.
    QUESTION: {question}
    EXPECTED CONCEPTS: {expected}
    TRANSCRIPT: {transcript}
    
    Rules: Score 0-100. Be strict on technical terminology.
    Output: JSON only.
    """

    response = model.generate_content(prompt)
    return jsonify(json.loads(response.text))
```

## 3. Real-time Technical Clarity Trigger (ai-monitor/app.py)
Based on a candidate's specific code implementation, the system generates a deep-dive follow-up question.

```python
@app.route("/generate-clarity", methods=["POST"])
def generate_clarity():
    data = request.get_json()
    code = data.get("code", "")
    
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    prompt = f"Analyze this code and generate 1 follow-up question on complexity or choice of data structure: {code}"
    
    response = model.generate_content(prompt)
    return jsonify(json.loads(response.text))
```

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5
