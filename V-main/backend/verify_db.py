import psycopg2

try:
    conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
    cur = conn.cursor()
    cur.execute("SELECT id, question, length(audio_base64) FROM quiz_questions ORDER BY id DESC")
    print("ID | Question Snippet | Audio Length")
    print("-" * 40)
    for r in cur.fetchall():
        q_snippet = r[1][:30] + "..." if r[1] else "None"
        audio_len = r[2] if r[2] is not None else "NULL"
        print(f"{r[0]} | {q_snippet} | {audio_len}")
    conn.close()
except Exception as e:
    print("Error:", e)
