import psycopg2

def fix():
    try:
        conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
        cur = conn.cursor()
        
        # Get existing columns
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'results'")
        existing_cols = [row[0] for row in cur.fetchall()]
        print(f"Existing columns: {existing_cols}")
        
        # Columns that SHOULD be there based on Result.java
        target_cols = [
            'sql_score', 'sql_total', 
            'oral_score', 'oral_total', 
            'total_score', 'violation_count', 
            'tab_switch_count', 'phone_count', 
            'multiple_faces_count', 'no_face_count', 
            'window_blur_count', 'looking_away_count', 
            'suspicious_movement_count', 'person_mismatch_count'
        ]
        
        for col in target_cols:
            if col not in existing_cols:
                print(f"Adding column {col} to results...")
                try:
                    cur.execute(f"ALTER TABLE results ADD COLUMN {col} INTEGER DEFAULT 0")
                    cur.execute(f"UPDATE results SET {col} = 0 WHERE {col} IS NULL")
                    cur.execute(f"ALTER TABLE results ALTER COLUMN {col} SET NOT NULL")
                except Exception as e:
                    print(f"Error adding {col} to results: {e}")
                    conn.rollback()
                    continue
            else:
                cur.execute(f"UPDATE results SET {col} = 0 WHERE {col} IS NULL")

        # Fix Assessments table
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'assessments'")
        existing_assess_cols = [row[0] for row in cur.fetchall()]
        if 'clarity_check_enabled' not in existing_assess_cols:
            print("Adding clarity_check_enabled to assessments...")
            cur.execute("ALTER TABLE assessments ADD COLUMN clarity_check_enabled BOOLEAN DEFAULT TRUE")
            cur.execute("UPDATE assessments SET clarity_check_enabled = TRUE WHERE clarity_check_enabled IS NULL")
            cur.execute("ALTER TABLE assessments ALTER COLUMN clarity_check_enabled SET NOT NULL")
        else:
            print("Fixing NULLs in clarity_check_enabled...")
            cur.execute("UPDATE assessments SET clarity_check_enabled = TRUE WHERE clarity_check_enabled IS NULL")
                
        conn.commit()
        print("Database schema fix complete.")
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    fix()
