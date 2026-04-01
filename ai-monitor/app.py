"""
@project: AI-Powered Proctoring & Automated Assessment System
@version: Virtusa Jatayu Season 5 - Stage 2 (POC)
@description: AI Monitor Service handling real-time computer vision (MediaPipe/YOLOv8) 
              and generative AI (Google Gemini) for candidate behavior analysis and question generation.
@author: <YOUR_TEAM_NAME>
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
import logging
import google.generativeai as genai
import PyPDF2
import os
import json
import mediapipe as mp
import cv2
from ultralytics import YOLO
from dotenv import load_dotenv

import asyncio
import uuid
from flask import send_file
import random

from detectors.face_detector import FaceDetector

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# -----------------------------
# YOLO MODEL
# -----------------------------

try:
    # Use yolov8s.pt as requested
    yolo_model = YOLO("yolov8s.pt")
except Exception as e:
    logger.error(f"YOLO load error: {e}")
    yolo_model = None


# -----------------------------
# APP INIT
# -----------------------------

app = Flask(__name__)
CORS(app)


# -----------------------------
# GEMINI CONFIG
# -----------------------------

# Use .env key as priority
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found. Gemini features will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)


def generate_fallback_questions(count, q_type, difficulty, topic):
    """
    Premium fallback database with LeetCode Classics.
    Returns authentic, recognizable coding tasks and MCQ.
    """
    import sys
    try:
        count = int(count)
    except:
        count = 3
    if count < 1: count = 3
    
    topic_clean = str(topic).lower()
    diff_clean = str(difficulty).upper()
    
    # --- EXPANDED CODING DATABASE ---
    LEETCODE_CLASSICS = [
        # Arrays / Strings
        {
            "title": "Two Sum", "difficulty": "EASY", "topics": ["array", "hash map"], 
            "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
            "testCases": [
                {"input": "nums=[2,7,11,15], target=9", "expectedOutput": "[0,1]", "hidden": False},
                {"input": "nums=[3,2,4], target=6", "expectedOutput": "[1,2]", "hidden": True}
            ]
        },
        {
            "title": "Valid Parentheses", "difficulty": "EASY", "topics": ["stack", "string"], 
            "description": "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            "testCases": [
                {"input": "s=\"()[]{}\"", "expectedOutput": "true", "hidden": False},
                {"input": "s=\"(]\"", "expectedOutput": "false", "hidden": True}
            ]
        },
        {
            "title": "Palindrome Number", "difficulty": "EASY", "topics": ["math"], 
            "description": "Determine whether an integer is a palindrome. An integer is a palindrome when it reads the same backward as forward.",
            "testCases": [
                {"input": "121", "expectedOutput": "true", "hidden": False},
                {"input": "-121", "expectedOutput": "false", "hidden": True}
            ]
        },
        {
            "title": "Reverse Linked List", "difficulty": "EASY", "topics": ["linked list"], 
            "description": "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
            "testCases": [
                {"input": "head=[1,2,3]", "expectedOutput": "[3,2,1]", "hidden": False},
                {"input": "head=[]", "expectedOutput": "[]", "hidden": True}
            ]
        },
        {
            "title": "Number of Islands", "difficulty": "MEDIUM", "topics": ["graph", "dfs", "bfs"], 
            "description": "Given an `m x n` 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
            "testCases": [
                {"input": "[[\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"0\"]]", "expectedOutput": "1", "hidden": False},
                {"input": "[[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\"]]", "expectedOutput": "2", "hidden": True}
            ]
        },
        {
            "title": "3Sum", "difficulty": "MEDIUM", "topics": ["array", "two pointers"], 
            "description": "Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that the sum is zero.",
            "testCases": [
                {"input": "nums=[-1,0,1,2,-1,-4]", "expectedOutput": "[[-1,-1,2],[-1,0,1]]", "hidden": False}
            ]
        },
        {
            "title": "LRU Cache", "difficulty": "MEDIUM", "topics": ["design", "hash map", "linked list"], 
            "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
            "testCases": [
                {"input": "[\"LRUCache\", \"put\", \"put\", \"get\"]", "expectedOutput": "[null, null, null, 1]", "hidden": False}
            ]
        },
        # General filler for other classics to avoid crashes
        {"title": "Search in Rotated Sorted Array", "difficulty": "MEDIUM", "topics": ["binary search", "array"], "description": "Find the index of a target value in a rotated array.", "testCases": [{"input": "[4,5,6,7,0,1,2], target=0", "expectedOutput": "4", "hidden": False}]},
        {"title": "Climbing Stairs", "difficulty": "EASY", "topics": ["dynamic programming"], "description": "How many distinct ways can you climb to the top of n steps?", "testCases": [{"input": "2", "expectedOutput": "2", "hidden": False}, {"input": "3", "expectedOutput": "3", "hidden": True}]}
    ]
    
    # --- CURATED QUIZ DATABASE ---
    QUIZ_CLASSICS = [
        {"question": "What is the time complexity of searching an element in a Hash Map (Average Case)?", "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"], "answer": "A", "topic": "Data Structures"},
        {"question": "Which sorting algorithm has a worst-case time complexity of O(n log n)?", "options": ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"], "answer": "C", "topic": "Algorithms"},
        {"question": "What does ACID stand for in Database Transactions?", "options": ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Completeness, Isolation, Durability", "Atomicity, Consistency, Integrity, Durability", "Access, Control, Inheritance, Durability"], "answer": "A", "topic": "Databases"},
        {"question": "In Java, what is the parent class of all classes?", "options": ["Main", "Base", "Object", "Root"], "answer": "C", "topic": "OOP"},
    ]

    quiz_results = []
    coding_results = []

    # Filter/Select functions
    def get_matches(db, topic_str):
        # Find direct matches
        matches = [item for item in db if any(t in topic_str for t in item.get('topics', [item.get('topic', '')]))]
        
        # If too few matches, add from general pool to reach target count
        if len(matches) < count:
            other_items = [item for item in db if item not in matches]
            random.shuffle(other_items)
            matches.extend(other_items[:count - len(matches)])
            
        random.shuffle(matches)
        return matches

    if q_type in ["quiz", "both"]:
        pool = get_matches(QUIZ_CLASSICS, topic_clean)
        # Unique selection
        selected = pool[:count]
        for item in selected:
            quiz_results.append({
                "question": item["question"],
                "optionA": item["options"][0], "optionB": item["options"][1], "optionC": item["options"][2], "optionD": item["options"][3],
                "correctOption": item["answer"], "topic": item.get("topic", topic), "marks": 1
            })

    if q_type in ["coding", "both"]:
        # Filter coding by topic but also respect difficulty if possible
        all_topic_pool = get_matches(LEETCODE_CLASSICS, topic_clean)
        
        # Prioritize difficulty matches if requested
        diff_priority = [item for item in all_topic_pool if item["difficulty"] == diff_clean]
        others = [item for item in all_topic_pool if item not in diff_priority]
        
        pool = diff_priority + others
        
        # Take unique count
        selected = pool[:count]
        for item in selected:
            coding_results.append({
                "title": f"{item['title']} (LeetCode Style)",
                "description": item["description"],
                "difficulty": item["difficulty"], "marks": 10,
                "sampleInput": item["testCases"][0]["input"] if item.get("testCases") else "Refer to description",
                "sampleOutput": item["testCases"][0]["expectedOutput"] if item.get("testCases") else "See constraints",
                "testCases": item.get("testCases", [
                    {"input": "sample_input", "expectedOutput": "sample_output", "hidden": False}
                ])
            })

    sys.stderr.write(f"[AI MONITOR] Premium unique fallback generated: {count} items for {topic}\n")
    return {"quizQuestions": quiz_results, "codingQuestions": coding_results}


# -----------------------------
# DETECTORS
# -----------------------------

face_detector = FaceDetector()

mp_face_mesh = mp.solutions.face_mesh
mesh_detector = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

mp_hands = mp.solutions.hands
hand_detector = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.6
)

phone_frame_counter = 0


# -----------------------------
# IMAGE DECODER
# -----------------------------

def decode_image(base64_str):

    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    img_bytes = base64.b64decode(base64_str)

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    image = np.array(img)

    # convert RGB -> OpenCV BGR
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    return image


# -----------------------------
# FACE MESH ANALYSIS (TALKING & LOOKING AWAY)
# -----------------------------

def analyze_face_mesh(image):

    # Fix: ensure internal RGB conversion for mediapipe if image is BGR
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = mesh_detector.process(rgb)
    
    analysis = {
        "talking": False,
        "looking_away": False
    }

    if results.multi_face_landmarks:

        for face_landmarks in results.multi_face_landmarks:

            # Looking away detection
            nose = face_landmarks.landmark[1]
            if nose.x < 0.3 or nose.x > 0.7:
                analysis["looking_away"] = True

            # Talking detection
            upper_lip = face_landmarks.landmark[13]
            lower_lip = face_landmarks.landmark[14]

            mouth_gap = abs(upper_lip.y - lower_lip.y)

            if mouth_gap > 0.04:
                analysis["talking"] = True

    return analysis


# -----------------------------
# HAND DETECTION
# -----------------------------

def detect_hand(image):

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = hand_detector.process(rgb)

    return results.multi_hand_landmarks is not None


# -----------------------------
# OBJECT DETECTION
# -----------------------------

def detect_objects(image, face_result):

    global phone_frame_counter

    detections = []

    if yolo_model is None:
        return detections

    try:

        # User's logic: resize to 1280, 720 and run with imgsz 640
        image_resized = cv2.resize(image,(1280,720))

        results = yolo_model(
            image_resized,
            conf=0.35,
            iou=0.45,
            imgsz=640,
            verbose=False
        )

        phone_detected = False
        phone_box = None

        for r in results:

            for box in r.boxes:

                cls = int(box.cls[0])
                label = yolo_model.names[cls]
                confidence = float(box.conf[0])

                x1,y1,x2,y2 = map(int,box.xyxy[0])

                width = x2-x1
                height = y2-y1
                area = width*height

                # PHONE
                if label == "cell phone" and confidence > 0.25:

                    if area > 300:
                        phone_detected = True
                        phone_box = (x1,y1,x2,y2)

                # BOTTLE SAFE
                if label == "bottle" and confidence > 0.55:

                    detections.append({
                        "type":"BOTTLE_DETECTED",
                        "severity":"SAFE",
                        "description":"Water bottle detected"
                    })


        # MULTI FRAME PHONE CONFIRM

        if phone_detected:
            phone_frame_counter += 1
        else:
            phone_frame_counter = max(phone_frame_counter-1,0)

        if phone_frame_counter >= 2:

            detections.append({
                "type":"PHONE_DETECTED",
                "severity":"HIGH",
                "description":"Mobile phone detected"
            })

            phone_frame_counter = 0


        # PHONE NEAR FACE

        if phone_box and face_result.get("face_box"):

            # Note: face_box from FaceDetector needs to be scaled to the 1280x720 space used here
            fx_orig, fy_orig, fw_orig, fh_orig = face_result["face_box"]
            h_orig, w_orig = image.shape[:2]
            scale_x = 1280 / w_orig
            scale_y = 720 / h_orig
            
            fx, fy = fx_orig * scale_x, fy_orig * scale_y
            fw, fh = fw_orig * scale_x, fh_orig * scale_y

            px1,py1,px2,py2 = phone_box

            face_center_x = fx + fw/2
            face_center_y = fy + fh/2

            phone_center_x = (px1+px2)/2
            phone_center_y = (py1+py2)/2

            distance = ((face_center_x-phone_center_x)**2 +
                        (face_center_y-phone_center_y)**2)**0.5

            if distance < 200:

                detections.append({
                    "type":"PHONE_NEAR_FACE",
                    "severity":"HIGH",
                    "description":"Phone near candidate face"
                })


        # PHONE IN HAND

        if phone_box and detect_hand(image_resized):

            detections.append({
                "type":"PHONE_IN_HAND",
                "severity":"HIGH",
                "description":"Phone detected in candidate hand"
            })


    except Exception as e:

        logger.error(f"YOLO detection error: {e}")

    return detections


# -----------------------------
# HEALTH CHECK
# -----------------------------

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status":"ok",
        "service":"AI Proctoring Monitor"
    })


# -----------------------------
# QUESTION GENERATION
# -----------------------------

@app.route("/generate", methods=["POST"])
def generate():

    try:

        if "file" not in request.files:
            return jsonify({"error":"No file uploaded"}),400

        file = request.files["file"]
        count = request.form.get("count","5")
        difficulty = request.form.get("difficulty", "MEDIUM")
        gen_type = request.form.get("type", "both")

        pdf_reader = PyPDF2.PdfReader(file)

        text = ""

        for page in pdf_reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        text = text[:10000]

        # Use gemini-2.0-flash for reliability and availability
        model = genai.GenerativeModel(
            "models/gemini-2.0-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        prompt = f"""
        Generate EXACTLY {count} questions based on the provided text.
        Difficulty: {difficulty}
        Types: {gen_type}

        INSTRUCTIONS:
        - You must return EXACTLY {count} questions in the requested format.
        - If type is 'quiz', return {count} unique multiple-choice questions.
        - If type is 'coding', return {count} unique coding problems.
        - If type is 'both', return {count} total questions distributed between quiz and coding.
        - Ensure questions are technically accurate and derived from the provided TEXT.

        RESPONSE FORMAT:
        {{
            "quizQuestions": [
                {{
                    "question": "string",
                    "optionA": "string",
                    "optionB": "string",
                    "optionC": "string",
                    "optionD": "string",
                    "correctOption": "A/B/C/D",
                    "topic": "string",
                    "marks": 1
                }}
            ],
            "codingQuestions": [
                {{
                    "title": "string",
                    "description": "string",
                    "difficulty": "{difficulty}",
                    "marks": 10,
                    "sampleInput": "string",
                    "sampleOutput": "string"
                }}
            ]
        }}

        TEXT:
        {text}
        """

        logger.info(f"AI Generation Request: count={count}, target={gen_type}, diff={difficulty}")
        response = model.generate_content(prompt)

        response_text = response.text.strip()
        logger.info(f"AI Generation Raw Response: {response_text[:200]}...")

        start = response_text.find("{")
        end = response_text.rfind("}") + 1

        json_text = response_text[start:end]

        questions = json.loads(json_text)

        return jsonify(questions)

    except Exception as e:
        logger.error(f"Generation error: {e}")
        # Always return the requested number of questions even on failure
        # Fix: ensure count is integer and use gen_type instead of undefined target_type
        try:
            icount = int(count)
        except:
            icount = 5
        fallback = generate_fallback_questions(icount, gen_type, difficulty, "the provided text")
        return jsonify(fallback)


@app.route("/suggest", methods=["POST"])
def suggest():
    """
    Generate random technical questions based on difficulty, NOT from a PDF.
    """
    try:
        difficulty = request.json.get("difficulty", "MEDIUM")
        gen_type = request.json.get("type", "both")
        count = request.json.get("count", 3)

        topic = request.json.get("topic", "general computer science")

        logger.info(f"AI Suggestion Request: diff={difficulty}, type={gen_type}, count={count}, topic={topic}")

        if not GEMINI_API_KEY:
             logger.error("GEMINI_API_KEY is missing!")
             raise Exception("Gemini API Key is not configured")

        model = genai.GenerativeModel(
            "models/gemini-2.0-flash",
            generation_config={"response_mime_type": "application/json", "temperature": 0.8}
        )
        
        prompt = f"""
        Generate EXACTLY {count} random {difficulty} level technical questions related to the requested topic: {topic}.
        The questions should be authentic and challenging, similar to patterns found on platforms like LeetCode or GeeksForGeeks.
        
        Type: {gen_type}

        INSTRUCTIONS:
        - Return EXACTLY {count} items total.
        - For CODING: Provide clear function signatures, constraints (e.g., n < 10^5), and edge cases.
        - For QUIZ: Ensure options are plausible and cover core concepts.
        - Avoid repeating common questions.
        - Ensure technical accuracy.

        RESPONSE FORMAT:
        {{
            "quizQuestions": [
                {{
                    "question": "string",
                    "optionA": "string",
                    "optionB": "string",
                    "optionC": "string",
                    "optionD": "string",
                    "correctOption": "A/B/C/D",
                    "topic": "string",
                    "marks": 1
                }}
            ],
            "codingQuestions": [
                {{
                    "title": "string",
                    "description": "string",
                    "difficulty": "{difficulty}",
                    "marks": 10,
                    "sampleInput": "string",
                    "sampleOutput": "string",
                    "testCases": [
                        {{"input": "string", "expectedOutput": "string", "hidden": false}},
                        {{"input": "string", "expectedOutput": "string", "hidden": true}}
                    ]
                }}
            ]
        }}
        """

        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            logger.info(f"AI Raw Response: {response_text[:100]}...")
        except Exception as ai_err:
            logger.error(f"Gemini Call Failed: {ai_err}")
            raise ai_err

        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        json_text = response_text[start:end]

        result = json.loads(json_text)
        
        # Check if we got zero questions but requested more. If so, use fallback.
        quiz_len = len(result.get('quizQuestions', []))
        coding_len = len(result.get('codingQuestions', []))
        
        if (gen_type == "both" and quiz_len == 0 and coding_len == 0) or \
           (gen_type == "quiz" and quiz_len == 0) or \
           (gen_type == "coding" and coding_len == 0):
            logger.warning("AI returned empty lists. Forcing fallback.")
            return jsonify(generate_fallback_questions(count, gen_type, difficulty, topic))

        logger.info(f"AI Parsed Result: Quiz={quiz_len}, Coding={coding_len}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Suggestion error: {e}", exc_info=True)
        # FALLBACK: Provide generic questions matching requested count
        fallback = generate_fallback_questions(count, gen_type, difficulty, topic)
        return jsonify(fallback)


# -----------------------------
# AUDIO GENERATION
# -----------------------------

@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
            
        text = data['text']
        voice = "en-US-AriaNeural"
        output_filename = f"tts_{uuid.uuid4().hex}.mp3"
        
        async def _generate():
            import edge_tts
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_filename)
            
        asyncio.run(_generate())
        return send_file(output_filename, mimetype="audio/mpeg")
    except Exception as e:
        logger.error(f"Audio generation failed: {e}")
        return jsonify({"error": "Audio generation failed"}), 500


# -----------------------------
# BEHAVIOR SUMMARIZATION
# -----------------------------

@app.route('/summarize', methods=['POST'])
def summarize_behavior():
    """
    Generate an AI summary of candidate behavior based on proctoring logs.
    """
    data = request.get_json()
    logs = data.get('logs', [])
    candidate_name = data.get('candidateName', 'Candidate')

    if not logs:
        return jsonify({'summary': f'{candidate_name} maintained perfect integrity with no violations detected.'})
    
    try:
        log_text = "\n".join([f"- {l.get('violationType')}: {l.get('description')} at {l.get('occurredAt')}" for l in logs])
        
        prompt = f"""
        Summarize the proctoring behavior for {candidate_name}.
        The following violations were recorded during their exam:
        {log_text}
        
        Provide a professional, concise 2-3 sentence summary for an HR recruiter. 
        Focus on the pattern of behavior and the overall focus level.
        Return ONLY the summary text.
        """
        
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        return jsonify({'summary': response.text.strip()})
    except Exception as e:
        logger.error(f"Summarization error (checking for quota): {e}")
        
        # Fallback to flash-lite
        try:
            logger.info("Attempting fallback to gemini-2.0-flash-lite for summary")
            model = genai.GenerativeModel('models/gemini-2.0-flash-lite')
            response = model.generate_content(prompt)
            return jsonify({'summary': response.text.strip()})
        except Exception as fallback_e:
            logger.error(f"Fallback summarization also failed: {fallback_e}")
            # Final hardcoded fallback for summary
            fallback_summary = f"{candidate_name} had several recorded violations requiring manual review by the proctoring team."
            return jsonify({'summary': fallback_summary}), 200


# -----------------------------
# MAIN ANALYSIS
# -----------------------------

@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    if not data or "image" not in data:
        return jsonify({"error":"No image"}),400

    try:

        # Base image decoding from Base64 string sent by the frontend
        image = decode_image(data["image"])

        violations = []

        # Step 1: Detect presence of face and count people in frame
        face_result = face_detector.detect(image)

        if face_result["face_count"] == 0:
            violations.append({
                "type":"NO_FACE",
                "severity":"HIGH",
                "description":"Candidate not visible"
            })

        elif face_result["face_count"] > 1:
            violations.append({
                "type":"MULTIPLE_FACES",
                "severity":"HIGH",
                "description":"Multiple people detected"
            })

        # Step 2: If Exactly one face, perform Gaze and Talking analysis
        if face_result["face_count"] == 1:

            mesh_analysis = analyze_face_mesh(image)

            if mesh_analysis["talking"]:
                violations.append({
                    "type":"TALKING_DETECTED",
                    "severity":"MEDIUM",
                    "description":"Candidate appears to be talking"
                })

            if mesh_analysis["looking_away"]:
                violations.append({
                    "type":"LOOKING_AWAY",
                    "severity":"MEDIUM",
                    "description":"Candidate looking away from screen"
                })

        # Step 3: Use YOLOv8 to detect forbidden objects (mobiles, etc.)
        object_results = detect_objects(image,face_result)

        violations.extend(object_results)

        return jsonify({
            "violations":violations,
            "face_count":face_result.get("face_count",0),
            "analysis_complete":True
        })


    except Exception as e:

        logger.error(e)

        return jsonify({
            "violations":[],
            "error":str(e)
        })


# -----------------------------
# VOICE FOLLOW-UP INTERVIEW
# -----------------------------

@app.route("/follow-up-voice", methods=["POST"])
def follow_up_voice():
    """
    Handles voice-only post-submission interview.
    Input: Audio file (candidate response), problem details, and history.
    Output: AI Response text + Audio.
    """
    try:
        # Check for inputs
        if "audio" not in request.files:
            # First interaction might not have audio (initial question)
            audio_file = None
        else:
            audio_file = request.files["audio"]

        problem_context = request.form.get("problemContext", "")
        solution_code = request.form.get("solutionCode", "")
        chat_history = request.form.get("chatHistory", "[]") # JSON string
        
        history = json.loads(chat_history)
        
        model = genai.GenerativeModel("models/gemini-2.0-flash")
        
        prompt_parts = [
            f"""
            You are an AI coding assistant that interacts with users after they have solved a coding problem. Your task is to ask intelligent follow-up questions based on the user’s solution.
            Focus on understanding their approach, time and space complexity, possible optimizations, edge cases, and alternative methods.
            Ask ONE question at a time in a clear and concise manner.
            Keep the interaction natural and engaging, helping the user think deeper about their solution.
            
            PROBLEM CONTEXT:
            {problem_context}
            
            USER SOLUTION:
            {solution_code}
            
            INTERACTION HISTORY:
            {json.dumps(history, indent=2)}
            """
        ]

        if audio_file:
            # Save temporary audio file for Gemini
            temp_audio_path = f"temp_rec_{uuid.uuid4().hex}.wav"
            audio_file.save(temp_audio_path)
            
            # Use Gemini to transcribe and respond
            # For simplicity, we transcribe first or just send both to multimodal
            uploaded_file = genai.upload_file(path=temp_audio_path, display_name="user_response")
            
            # Wait for processing
            import time
            while uploaded_file.state.name == "PROCESSING":
                time.sleep(1)
                uploaded_file = genai.get_file(uploaded_file.name)
            
            prompt_parts.append("\nTHE USER JUST RESPONDED WITH THIS AUDIO. Transcribe it and then provide your next follow-up question.")
            prompt_parts.append(uploaded_file)
            
            # Clean up
            os.remove(temp_audio_path)
        else:
            # Initial prompt - no user audio yet
            prompt_parts.append("\nThis is the start of the interview. Analyze the solution and ask the first follow-up question (e.g., explain approach or complexity).")

        response = model.generate_content(prompt_parts)
        ai_text = response.text.strip()

        # Convert AI response to audio
        voice = "en-US-AriaNeural"
        output_filename = f"ai_resp_{uuid.uuid4().hex}.mp3"
        
        async def _generate_tts():
            import edge_tts
            communicate = edge_tts.Communicate(ai_text, voice)
            await communicate.save(output_filename)
            
        import asyncio
        asyncio.run(_generate_tts())

        # Read audio to base64
        with open(output_filename, "rb") as f:
            audio_base64 = base64.b64encode(f.read()).decode("utf-8")
        
        # Clean up
        os.remove(output_filename)

        return jsonify({
            "text": ai_text,
            "audio": audio_base64
        })

    except Exception as e:
        logger.error(f"Follow-up error: {e}")
        return jsonify({"error": str(e)}), 500


# -----------------------------
# MICRO-ORAL EVALUATION
# -----------------------------

@app.route("/evaluate-oral", methods=["POST"])
def evaluate_oral():
    """
    Evaluates a candidate's transcript for a micro-oral question.
    """
    try:
        data = request.get_json()
        transcript = data.get("transcript", "")
        question = data.get("question", "")
        expected_keywords = data.get("expectedKeywords", [])

        if not transcript:
            return jsonify({"score": 0, "isCorrect": False, "feedback": "No transcript provided."})

        model = genai.GenerativeModel("models/gemini-flash-latest")
        
        prompt = f"""
        Evaluate the following candidate's answer to a technical micro-oral question.
        
        QUESTION: {question}
        EXPECTED KEYWORDS/CONCEPTS: {", ".join(expected_keywords)}
        CANDIDATE TRANSCRIPT: {transcript}
        
        Provide a JSON response with:
        1. "score" (0-100 based on technical accuracy and clarity)
        2. "isCorrect" (boolean, true if they captured the core concept)
        3. "feedback" (string, 1-2 sentences of professional feedback)
        
        Return ONLY JSON.
        """

        response = model.generate_content(prompt)
        res_text = response.text.strip()
        
        # Extract JSON
        start = res_text.find("{")
        end = res_text.rfind("}") + 1
        result = json.loads(res_text[start:end])

        return jsonify(result)

    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        try:
            logger.info("Attempting fallback to gemini-flash-lite-latest for evaluation")
            fallback_model = genai.GenerativeModel("models/gemini-flash-lite-latest")
            fallback_response = fallback_model.generate_content(prompt)
            res_text = fallback_response.text.strip()
            start = res_text.find("{")
            end = res_text.rfind("}") + 1
            result = json.loads(res_text[start:end])
            return jsonify(result)
        except Exception as fallback_e:
            logger.error(f"Fallback generation also failed: {fallback_e}")
            return jsonify({"score": 0, "isCorrect": False, "feedback": f"Error: {str(fallback_e)}"}), 500


@app.route("/generate-clarity", methods=["POST"])
def generate_clarity():
    """
    Generates a follow-up conceptual question based on the candidate's code or previous answer.
    """
    try:
        data = request.get_json()
        item_type = data.get("type", "coding") # "coding" or "mcq"
        code = data.get("code", "")
        context = data.get("context", "")
        correct_answer = data.get("correctAnswer", "")

        model = genai.GenerativeModel("models/gemini-flash-latest")
        
        if item_type == "coding":
            prompt = f"""
            Task: Act as a Senior Technical Interviewer.
            Analyze the following coding PROBLEM and the candidate's SPECIFIC IMPLEMENTATION.
            Generate ONE deep technical follow-up question that probes their understanding of their OWN code.
            
            PROBLEM: {context}
            CANDIDATE CODE: {code}
            
            The question must focus on one of:
            - Time or Space Complexity of THEIR specific solution.
            - Why they chose a specific data structure or algorithm over an alternative.
            - How their code handles a specific edge case (e.g. empty input, large values).
            - A potential optimization they could make to their specific lines of code.
            
            Return ONLY a JSON object with:
            1. "question": The deep-dive question (concise, max 20 words).
            2. "keywords": 3-5 technical keywords/concepts that MUST be in a good answer.
            
            Return ONLY JSON.
            """
        else: # mcq
            prompt = f"""
            Task: Act as a Technical Concept Evaluator.
            Based on the technical topic and correct answer below, generate ONE standalone conceptual question.
            Goal: Explore the "Theory" or "Inner Workings" of the concept to verify if the candidate understands the "Why" and "How" behind it.
            
            TOPIC/CONTEXT: {context}
            CORRECT ANSWER: {correct_answer}
            
            The question should:
            - NOT refer to previous options (A, B, C, D) or question numbers.
            - Focus on abstract theory, architectural patterns, or common industry trade-offs related to the topic.
            - Be different from a coding implementation question; focus on conceptual understanding.
            
            Return ONLY a JSON object with:
            1. "question": The theory-based question (concise, max 15 words).
            2. "keywords": 3-5 specific technical keywords/concepts that MUST be in a good answer.
            
            Return ONLY JSON.
            """

        response = model.generate_content(prompt)
        res_text = response.text.strip()
        
        # More robust JSON cleaning
        if "```" in res_text:
            res_text = res_text.split("```")[1]
            if res_text.startswith("json"):
                res_text = res_text[4:]
        
        result = json.loads(res_text.strip())
        return jsonify(result)

    except Exception as e:
        logger.error(f"Clarity generation error: {e}")
        # Try fallback model
        try:
            model = genai.GenerativeModel("models/gemini-flash-lite-latest")
            response = model.generate_content(prompt)
            res_text = response.text.strip()
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            result = json.loads(res_text.strip())
            return jsonify(result)
        except Exception as fallback_e:
            logger.error(f"Fallback clarity generation error: {fallback_e}")
            # Final hardcoded fallback so we never break the UI
            fallback_q = "Can you explain the time and space complexity of your specific solution?" if item_type == "coding" else "Can you explain this concept in more detail?"
            return jsonify({"question": fallback_q, "keywords": ["complexity", "optimization"] if item_type == "coding" else ["concept", "technical"]})


# -----------------------------
# RUN SERVER
# -----------------------------

if __name__ == "__main__":

    logger.info("Starting AI Proctoring Monitor")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
