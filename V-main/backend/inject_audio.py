import psycopg2
import base64

try:
    # A tiny silent MP3 or just random valid-looking base64
    # We will just generate a short mp3 locally with edge-tts and save to db!
    import edge_tts
    import asyncio
    async def _gen():
        c = edge_tts.Communicate("Hello this is a test audio", "en-US-AriaNeural")
        await c.save(".test.mp3")
    asyncio.run(_gen())

    with open(".test.mp3", "rb") as f:
        b64 = "data:audio/mpeg;base64," + base64.b64encode(f.read()).decode('utf-8')

    conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
    cur = conn.cursor()
    cur.execute("UPDATE quiz_questions SET audio_base64 = %s WHERE id IN (SELECT id FROM quiz_questions ORDER BY id DESC LIMIT 2)", (b64,))
    conn.commit()
    print("Injected audio into the two most recent questions!")
    conn.close()
except Exception as e:
    print("Error:", e)
