import psycopg2

def check_nulls():
    try:
        conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
        cur = conn.cursor()
        
        print("--- Checking for Sessions with NULL Assessment Candidate ---")
        cur.execute("SELECT id FROM exam_sessions WHERE assessment_candidate_id IS NULL")
        null_sessions = cur.fetchall()
        for s in null_sessions:
            print(f"Session ID {s[0]} has NULL AssessmentCandidate")
            
        print("\n--- Checking for Assessment Candidates with NULL Candidate ---")
        cur.execute("SELECT id FROM assessment_candidates WHERE candidate_id IS NULL")
        null_acs = cur.fetchall()
        for ac in null_acs:
            print(f"AC ID {ac[0]} has NULL Candidate")

        print("\n--- Checking for Assessment Candidates with NULL Assessment ---")
        cur.execute("SELECT id FROM assessment_candidates WHERE assessment_id IS NULL")
        null_acas = cur.fetchall()
        for ac in null_acas:
            print(f"AC ID {ac[0]} has NULL Assessment")

        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_nulls()
