import psycopg2

def check():
    try:
        conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
        cur = conn.cursor()
        
        print("--- Exam Sessions ---")
        cur.execute("SELECT id, status, assessment_candidate_id FROM exam_sessions")
        sessions = cur.fetchall()
        for s in sessions:
            print(f"Session ID {s[0]}: Status={s[1]}, AC_ID={s[2]}")
            
        print("\n--- Results ---")
        cur.execute("SELECT id, session_id, verdict, total_score FROM results")
        results = cur.fetchall()
        for r in results:
            print(f"Result ID {r[0]}: SessionID={r[1]}, Verdict={r[2]}, Score={r[3]}")
            
        print("\n--- Admins ---")
        cur.execute("SELECT id, email FROM admins")
        admins = cur.fetchall()
        for a in admins:
            print(f"Admin ID {a[0]}: Email={a[1]}")

        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check()
