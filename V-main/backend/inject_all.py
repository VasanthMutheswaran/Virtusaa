import psycopg2
import base64

try:
    import edge_tts
    import asyncio
    async def _gen():
        c = edge_tts.Communicate("Hello! This is an audio test for your mock question. Please choose the BEST answer from the options provided.", "en-US-AriaNeural")
        await c.save(".test.mp3")
    asyncio.run(_gen())

    with open(".test.mp3", "rb") as f:
        b64 = "data:audio/mpeg;base64," + base64.b64encode(f.read()).decode('utf-8')

    conn = psycopg2.connect("dbname='proctoring_db' user='postgres' host='127.0.0.1' password='1234'")
    cur = conn.cursor()
    cur.execute("UPDATE quiz_questions SET audio_base64 = %s WHERE audio_base64 IS NULL", (b64,))
    conn.commit()
    print("Injected audio into ALL missing questions!")
    conn.close()
except Exception as e:
    print("Error:", e)
