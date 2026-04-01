import psycopg2
import math

def fix_db():
    try:
        conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
        conn.autocommit = False
        cur = conn.cursor()
        
        print("--- Fixing Duplicate Quiz Answers ---")
        # Find duplicates
        cur.execute("""
            SELECT session_id, question_id, count(*) 
            FROM quiz_answers 
            GROUP BY session_id, question_id 
            HAVING count(*) > 1
        """)
        duplicates = cur.fetchall()
        for dup in duplicates:
            session_id, question_id, count = dup
            print(f"Fixing duplicate for session_id={session_id}, question_id={question_id} (count={count})")
            
            # Keep one (prefer true if any, else arbitrary)
            cur.execute("""
                SELECT id, is_correct FROM quiz_answers 
                WHERE session_id = %s AND question_id = %s 
                ORDER BY is_correct DESC, answered_at DESC
            """, (session_id, question_id))
            answers = cur.fetchall()
            
            # Keep answers[0], delete the rest
            ids_to_delete = [a[0] for a in answers[1:]]
            if ids_to_delete:
                cur.execute("DELETE FROM quiz_answers WHERE id = ANY(%s)", (ids_to_delete,))
        
        print("--- Recalculating Results ---")
        cur.execute("SELECT id, session_id, coding_score, oral_score, violation_count FROM results")
        results = cur.fetchall()
        
        for res in results:
            res_id, session_id, coding_score, oral_score, violation_count = res
            
            # Calculate new quiz_score from quiz_answers joined with quiz_questions
            cur.execute("""
                SELECT sum(q.marks) 
                FROM quiz_answers a 
                JOIN quiz_questions q ON a.question_id = q.id 
                WHERE a.session_id = %s AND a.is_correct = true
            """, (session_id,))
            row = cur.fetchone()
            quiz_score = row[0] if row[0] is not None else 0
            
            coding_s = coding_score if coding_score else 0
            oral_s = oral_score if oral_score else 0
            raw_score = quiz_score + coding_s + oral_s
            
            v_count = violation_count if violation_count else 0
            penalty_factor = max(0.05, 1.0 - (v_count / 200.0))
            final_score = round(raw_score * penalty_factor)
            
            cur.execute("""
                UPDATE results 
                SET quiz_score = %s, total_score = %s 
                WHERE id = %s
            """, (quiz_score, final_score, res_id))
            print(f"Updated Result {res_id}: quiz_score={quiz_score}, final_score={final_score}")

        conn.commit()
        print("Successfully fixed database.")
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    fix_db()
