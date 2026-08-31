import os
import sys
import time
import webview

# Assicura percorsi corretti
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import socket
from backend.server import start_background_server, PORT

def is_port_in_use(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def main():
    if not is_port_in_use(PORT):
        print(f"[PC MIO] Avvio server su porta {PORT}...")
        start_background_server(PORT)
        time.sleep(0.4)
    else:
        print(f"[PC MIO] Server già attivo su porta {PORT}.")
    
    print("[PC MIO] Apertura Finestra Desktop Nativa...")
    window = webview.create_window(
        title="PC MIO - Street AI Edition",
        url=f"http://127.0.0.1:{PORT}",
        width=1320,
        height=860,
        min_size=(1024, 700),
        background_color="#080B11"
    )
    
    webview.start(debug=False)

if __name__ == "__main__":
    main()
