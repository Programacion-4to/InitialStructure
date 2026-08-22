import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
url = os.getenv("DATABASE_URL")
print(f"Probando conexion a: {url}")

try:
    conn = psycopg2.connect(url)
    print("¡CONEXION EXITOSA!")
    conn.close()
except Exception as e:
    # Mostramos la representación cruda para esquivar el fallo de codificación
    print("Error de conexion capturado:")
    print(repr(e))