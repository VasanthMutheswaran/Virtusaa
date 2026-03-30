import psycopg2

try:
    conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
    cur = conn.cursor()
    
    cur.execute("SELECT id, email, first_name, last_name FROM candidates WHERE id = 17")
    print("Candidate 17:", cur.fetchall())
    
    conn.close()
except Exception as e:
    print(e)
