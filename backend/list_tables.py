import psycopg2

def list_tables():
    try:
        conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cur.fetchall()
        print("--- Tables ---")
        for t in tables:
            print(t[0])
            
        cur.execute("SELECT count(*) FROM exam_sessions")
        print(f"\nExam Sessions count: {cur.fetchone()[0]}")
        
        cur.execute("SELECT count(*) FROM results")
        print(f"Results count: {cur.fetchone()[0]}")
        
        cur.execute("SELECT count(*) FROM proctoring_logs")
        print(f"Proctoring Logs count: {cur.fetchone()[0]}")

        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_tables()
