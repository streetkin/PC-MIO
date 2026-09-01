import os
import sys
import time
import webview

# Assicura percorsi corretti
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import socket
import json
import urllib.request
from backend.server import start_background_server, PORT

def is_port_in_use(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def is_pcmio_server(port):
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/api/status")
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                return data.get("app_id") == "pcmio"
    except Exception:
        pass
    return False

def find_available_port(start_port=8765):
    for p in range(start_port, start_port + 20):
        if not is_port_in_use(p):
            return p
    return None

def main():
    target_port = PORT
    if is_port_in_use(target_port):
        if is_pcmio_server(target_port):
            print(f"[PC MIO] Server PC MIO già attivo e verificato su porta {target_port}.")
        else:
            print(f"[PC MIO] Porta {target_port} occupata da un altro processo. Ricerca porta libera...")
            free_port = find_available_port(target_port + 1)
            if not free_port:
                print("[PC MIO] Errore: nessuna porta libera disponibile.")
                return
            target_port = free_port
            print(f"[PC MIO] Avvio server su porta alternativa {target_port}...")
            start_background_server(target_port)
            time.sleep(0.4)
    else:
        print(f"[PC MIO] Avvio server su porta {target_port}...")
        start_background_server(target_port)
        time.sleep(0.4)
    
    print(f"[PC MIO] Apertura Finestra Desktop Nativa su porta {target_port}...")
    window = webview.create_window(
        title="PC MIO - Assistente di Ottimizzazione e Sicurezza",
        url=f"http://127.0.0.1:{target_port}",
        width=1320,
        height=860,
        min_size=(1024, 700),
        background_color="#F8FAFC"
    )
    
    webview.start(debug=False)

if __name__ == "__main__":
    main()
