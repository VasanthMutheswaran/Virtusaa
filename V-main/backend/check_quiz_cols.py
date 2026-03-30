import psycopg2

try:
    conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='quiz_questions'")
    cols = [r[0] for r in cur.fetchall()]
    print("Columns in quiz_questions:", cols)
    conn.close()
except Exception as e:
    print("Error:", e)
