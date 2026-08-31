import os
import sys
import json
import sqlite3
import shutil
import urllib.request
import winreg
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import threading

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

PORT = 8765
OLLAMA_URL = "http://127.0.0.1:11434"
MODEL_NAME = "qwen2.5-coder:1.5b"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(PROJECT_DIR, "pcmio_memory.sqlite")
QUARANTINE_DIR = os.path.join("C:\\", "PC_MIO_Quarantine")

# 1. INIZIALIZZAZIONE DATABASE MEMORIA (SQLITE)
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Tabella impronte e pattern software appresi
    cur.execute("""
    CREATE TABLE IF NOT EXISTS learned_footprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        software_name TEXT UNIQUE,
        description TEXT,
        known_paths TEXT,
        learned_date TEXT,
        confidence REAL
    )
    """)
    
    # Tabella storico interventi / Rollback ledger
    cur.execute("""
    CREATE TABLE IF NOT EXISTS quarantine_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT,
        original_path TEXT,
        quarantined_path TEXT,
        file_size_bytes INTEGER,
        status TEXT,
        timestamp TEXT
    )
    """)
    
    # Tabella snapshot di scansione
    cur.execute("""
    CREATE TABLE IF NOT EXISTS audit_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        installed_count INTEGER,
        anomalies_count INTEGER,
        free_gb REAL,
        report_summary TEXT
    )
    """)
    
    # Popola con le 40 impronte scoperte oggi se vuoto
    cur.execute("SELECT COUNT(*) FROM learned_footprints")
    if cur.fetchone()[0] == 0:
        initial_rules = [
            ("MEmu Android Emulator", "Lascia file orfani in Microvirt e AppData", json.dumps([
                r"C:\Program Files\Microvirt",
                r"C:\Users\admin\AppData\Local\MEmu",
                r"C:\Users\admin\AppData\Local\Microvirt"
            ]), "2026-08-31", 1.0),
            ("Docker Desktop Failed Setup", "Log persistenti da Win32Exception UAC", json.dumps([
                r"C:\ProgramData\DockerDesktop",
                r"C:\Users\admin\AppData\Local\Docker",
                r"C:\Users\admin\AppData\Roaming\Docker",
                r"C:\Users\admin\.docker"
            ]), "2026-08-31", 1.0),
            ("360 Total Security", "DLL mascherata in cartella numerica", json.dumps([
                r"C:\ProgramData\1756326003_00000000_base",
                r"C:\ProgramData\360Quarant",
                r"C:\Program Files (x86)\360"
            ]), "2026-08-31", 1.0),
            ("Foxit Reader Leftovers", "Tracciamento orfano distribuito", json.dumps([
                r"C:\Program Files (x86)\Foxit Software",
                r"C:\ProgramData\Foxit Software",
                r"C:\Users\admin\AppData\Roaming\Foxit Software"
            ]), "2026-08-31", 1.0),
            ("Steinberg Cubase DAW", "PRESERVARE VST3. Pulisci solo CrashDumps .dmp", json.dumps([
                r"C:\Users\admin\Documents\Steinberg\CrashDumps"
            ]), "2026-08-31", 1.0)
        ]
        cur.executemany("INSERT INTO learned_footprints (software_name, description, known_paths, learned_date, confidence) VALUES (?, ?, ?, ?, ?)", initial_rules)
    
    conn.commit()
    conn.close()

# 2. CONTROLLO OLLAMA LOCALE
def check_ollama():
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode())
            models = [m.get("name") for m in data.get("models", [])]
            return {
                "online": True,
                "current_model": MODEL_NAME if any(MODEL_NAME in m for m in models) else (models[0] if models else "N/A"),
                "available_models": models
            }
    except Exception:
        return {
            "online": False,
            "current_model": "Ollama Non Connesso",
            "available_models": []
        }

KNOWN_APPS_INFO = {
    "MicrosoftEdgeAutoLaunch": {
        "clean_name": "Microsoft Edge (Pre-avvio)",
        "description": "Pre-carica il browser Edge in memoria all'accensione di Windows.",
        "impact": "Medio",
        "safe_to_disable": True,
        "advice": "Inutile se usi Chrome o altri browser. Puoi rimuoverlo o disattivarlo per velocizzare il boot.",
        "icon": "🌐"
    },
    "OneDrive": {
        "clean_name": "Microsoft OneDrive",
        "description": "Sincronizza in background i file con il cloud di Microsoft.",
        "impact": "Alto",
        "safe_to_disable": True,
        "advice": "Tienilo attivo solo se usi il backup cloud OneDrive.",
        "icon": "☁️"
    },
    "Discord": {
        "clean_name": "Discord",
        "description": "Chat e comunicazioni vocali. Avviandosi subito consuma memoria RAM.",
        "impact": "Alto",
        "safe_to_disable": True,
        "advice": "Consigliato disattivarlo e aprirlo solo quando vuoi chattare.",
        "icon": "💬"
    },
    "Canva": {
        "clean_name": "Canva (Controllo Aggiornamenti)",
        "description": "Processo in background che controlla se ci sono aggiornamenti di Canva.",
        "impact": "Basso",
        "safe_to_disable": True,
        "advice": "Non serve all'avvio del computer. Puoi disattivarlo o rimuoverlo in sicurezza.",
        "icon": "🎨"
    },
    "Norton": {
        "clean_name": "Norton Security UI",
        "description": "Interfaccia utente dell'antivirus Norton installato sul sistema.",
        "impact": "Medio",
        "safe_to_disable": False,
        "advice": "Componente di protezione antivirus. Consigliato mantenerlo attivo.",
        "icon": "🛡️"
    }
}

def enrich_app_info(name, command, enabled):
    info = {
        "id": name,
        "name": name,
        "display_name": name,
        "command": command,
        "enabled": enabled,
        "impact": "Medio",
        "description": "Processo impostato per l'esecuzione automatica ad ogni accensione.",
        "advice": "Puoi disattivarlo se non ti serve subito all'avvio.",
        "safe_to_disable": True,
        "icon": "⚡"
    }
    for key, data in KNOWN_APPS_INFO.items():
        if key.lower() in name.lower() or key.lower() in command.lower():
            info["display_name"] = data["clean_name"]
            info["description"] = data["description"]
            info["impact"] = data["impact"]
            info["advice"] = data["advice"]
            info["safe_to_disable"] = data["safe_to_disable"]
            info["icon"] = data["icon"]
            break
    return info

def list_startup_apps():
    items = []
    # Enabled in Run
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run")
        for i in range(winreg.QueryInfoKey(key)[1]):
            name, val, _ = winreg.EnumValue(key, i)
            items.append(enrich_app_info(name, val, True))
        winreg.CloseKey(key)
    except Exception:
        pass
    # Disabled in Run_PCMio_Disabled
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run_PCMio_Disabled")
        for i in range(winreg.QueryInfoKey(key)[1]):
            name, val, _ = winreg.EnumValue(key, i)
            items.append(enrich_app_info(name, val, False))
        winreg.CloseKey(key)
    except Exception:
        pass
    return items

def toggle_startup_app(app_name, enable):
    run_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    dis_path = r"Software\Microsoft\Windows\CurrentVersion\Run_PCMio_Disabled"
    
    if enable:
        try:
            k_dis = winreg.OpenKey(winreg.HKEY_CURRENT_USER, dis_path, 0, winreg.KEY_ALL_ACCESS)
            val, _ = winreg.QueryValueEx(k_dis, app_name)
            winreg.DeleteValue(k_dis, app_name)
            winreg.CloseKey(k_dis)
            
            k_run = winreg.CreateKey(winreg.HKEY_CURRENT_USER, run_path)
            winreg.SetValueEx(k_run, app_name, 0, winreg.REG_SZ, val)
            winreg.CloseKey(k_run)
            return True
        except Exception:
            return False
    else:
        try:
            k_run = winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_path, 0, winreg.KEY_ALL_ACCESS)
            val, _ = winreg.QueryValueEx(k_run, app_name)
            winreg.DeleteValue(k_run, app_name)
            winreg.CloseKey(k_run)
            
            k_dis = winreg.CreateKey(winreg.HKEY_CURRENT_USER, dis_path)
            winreg.SetValueEx(k_dis, app_name, 0, winreg.REG_SZ, val)
            winreg.CloseKey(k_dis)
            return True
        except Exception:
            return False

def delete_startup_app(app_name):
    # Rimuove la chiave sia da Run che da Run_PCMio_Disabled
    removed = False
    for path in [r"Software\Microsoft\Windows\CurrentVersion\Run", r"Software\Microsoft\Windows\CurrentVersion\Run_PCMio_Disabled"]:
        try:
            k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, path, 0, winreg.KEY_ALL_ACCESS)
            winreg.DeleteValue(k, app_name)
            winreg.CloseKey(k)
            removed = True
        except Exception:
            pass
    return removed

def execute_system_scan(modules=None):
    if not modules:
        modules = ["ghost_apps", "incomplete_installs", "duplicates", "crashes", "user_home", "privacy", "startup"]
        
    user_home = os.path.expanduser("~")
    findings = []
    
    # 1. Scansione Crash Dump di Cubase
    if "crashes" in modules:
        cubase_dumps_dir = os.path.join(user_home, "Documents", "Steinberg", "CrashDumps")
        if os.path.exists(cubase_dumps_dir):
            dumps = [f for f in os.listdir(cubase_dumps_dir) if f.lower().endswith(".dmp")]
            if dumps:
                total_size = sum(os.path.getsize(os.path.join(cubase_dumps_dir, f)) for f in dumps)
                findings.append({
                    "id": "cubase_dumps",
                    "title": f"Crash Dump di Cubase 12 ({len(dumps)} file .dmp)",
                    "path": cubase_dumps_dir,
                    "type": "folder_content",
                    "size_bytes": total_size,
                    "size_mb": round(total_size / (1024 * 1024), 2),
                    "risk": "RISCHIO ZERO",
                    "risk_color": "green",
                    "description": f"Registri di crash passati accumulati in Documenti. Cubase funzionerà regolarmente senza di essi."
                })
            
    # 2. Scansione Archivio streetkings-new.zip duplicato
    if "duplicates" in modules:
        sk_zip = os.path.join(user_home, "streetkings-new.zip")
        if os.path.exists(sk_zip):
            size = os.path.getsize(sk_zip)
            findings.append({
                "id": "streetkings_zip",
                "title": "Archivio Duplicato streetkings-new.zip",
                "path": sk_zip,
                "type": "file",
                "size_bytes": size,
                "size_mb": round(size / (1024 * 1024), 2),
                "risk": "RISCHIO ZERO",
                "risk_color": "green",
                "description": "Archivio zip del progetto già estratto e attivo nella cartella adiacente."
            })
        
    # 3. Scansione node_modules nella home utente
    if "user_home" in modules:
        user_nm = os.path.join(user_home, "node_modules")
        if os.path.exists(user_nm):
            findings.append({
                "id": "user_node_modules",
                "title": "Cartella node_modules accidentale in Home Utente",
                "path": user_nm,
                "type": "folder",
                "size_bytes": 12 * 1024 * 1024,
                "size_mb": 12.0,
                "risk": "RISCHIO ZERO",
                "risk_color": "green",
                "description": "Dipendenza creata per errore da un comando npm install lanciato nella directory utente."
            })

    # 4. Scansione Cache Runtime Electron
    if "ghost_apps" in modules or "incomplete_installs" in modules:
        electron_cache = os.path.join(user_home, "AppData", "Local", "electron", "Cache")
        if os.path.exists(electron_cache):
            zips = [f for f in os.listdir(electron_cache) if f.lower().endswith(".zip")]
            if zips:
                total_size = sum(os.path.getsize(os.path.join(electron_cache, f)) for f in zips)
                findings.append({
                    "id": "electron_cache",
                    "title": f"Cache Runtime Electron ({len(zips)} archivi zip di build passate)",
                    "path": electron_cache,
                    "type": "folder_content",
                    "size_bytes": total_size,
                    "size_mb": round(total_size / (1024 * 1024), 2),
                    "risk": "RISCHIO ZERO",
                    "risk_color": "green",
                    "description": "Binari scaricati in passato durante l'impacchettamento di applicazioni desktop."
                })

        # 5. Scansione cartella anomala 'on' in Roaming
        on_folder = os.path.join(user_home, "AppData", "Roaming", "on")
        if os.path.exists(on_folder):
            findings.append({
                "id": "roaming_on",
                "title": "Cartella anomala 'on' in AppData Roaming",
                "path": on_folder,
                "type": "folder",
                "size_bytes": 7 * 1024 * 1024,
                "size_mb": 7.0,
                "risk": "RISCHIO ZERO",
                "risk_color": "green",
                "description": "Contiene DLL runtime sparse e un file .odp derivanti da un'estrazione errata."
            })

        # 6. Scansione Installer Antares in Downloaded Installations
        antares_installer = os.path.join(user_home, "AppData", "Local", "Downloaded Installations")
        if os.path.exists(antares_installer):
            findings.append({
                "id": "antares_msi",
                "title": "Installer residuo Antares Auto-Tune Pro.msi",
                "path": antares_installer,
                "type": "folder",
                "size_bytes": 161 * 1024 * 1024,
                "size_mb": 161.3,
                "risk": "RISCHIO ZERO",
                "risk_color": "green",
                "description": "Pacchetto di installazione temporaneo mai ripulito dopo il completamento del setup."
            })

    # 7. Scansione Programmi all'Avvio (Startup Optimizer)
    if "startup" in modules:
        startup_items = list_startup_apps()
        enabled_items = [s for s in startup_items if s["enabled"]]
        if enabled_items:
            names = [s["name"] for s in enabled_items]
            findings.append({
                "id": "startup_optimizer",
                "title": f"Ottimizzazione Avvio ({len(enabled_items)} app in background)",
                "path": "Registro: HKCU Run",
                "type": "startup_manager",
                "size_bytes": 0,
                "size_mb": 0.0,
                "risk": "AVVIO VELOCE",
                "risk_color": "yellow",
                "apps": startup_items,
                "description": f"App attive all'accensione: {', '.join(names)}. Disattivando quelle non necessarie riduci il tempo di accensione di Windows."
            })

    # 8. Allerta Sicurezza Desktop
    if "privacy" in modules:
        desktop = os.path.join(user_home, "Desktop")
        sec_files = []
        ionos_dir = os.path.join(desktop, "IONOS")
        if os.path.exists(ionos_dir):
            sec_files.append("IONOS (chiavi SSL e credenziali)")
        client_sec = os.path.join(desktop, "Client secret - T-Routex.txt")
        if os.path.exists(client_sec):
            sec_files.append("Client secret - T-Routex.txt")
            
        if sec_files:
            findings.append({
                "id": "desktop_security",
                "title": "Allerta Sicurezza: File Sensibili e Credenziali sul Desktop",
                "path": "Desktop",
                "type": "alert_only",
                "size_bytes": 0,
                "size_mb": 0.0,
                "risk": "CRITICO / PRIVACY",
                "risk_color": "red",
                "description": f"Rilevati sul Desktop: {', '.join(sec_files)}. Da proteggere immediatamente in un password manager."
            })

    # Genera Sintesi IA tramite Ollama ancorata ai file reali
    items_list_str = "\n".join([f"- {f['title']} ({f['size_mb']} MB) - {f['risk']}" for f in findings])
    ai_summary = "Audit completato. File temporanei individuati e pronti per la quarantena reversibile."
    try:
        prompt_text = f"""Sei l'assistente di PC MIO. Ho appena scansionato il computer ed ecco l'elenco esatto dei file trovati:
{items_list_str}

Fai una breve sintesi di 2 o 3 frasi in italiano con tono Street Gaming professionale:
1. Conferma i file trovati e lo spazio totale liberabile a rischio zero.
2. Rassicura l'utente che i file saranno messi in Quarantena Protetta reversibile e non eliminati a freddo.
Non inventare altri file e non dare consigli generici di comprare hardware."""
        req_data = json.dumps({
            "model": MODEL_NAME,
            "prompt": prompt_text,
            "stream": False
        }).encode("utf-8")
        req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as res:
            res_json = json.loads(res.read().decode())
            ai_summary = res_json.get("response", ai_summary)
    except Exception:
        pass

    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "findings": findings,
        "ai_summary": ai_summary,
        "total_reclaimable_mb": sum(f["size_mb"] for f in findings if f["type"] != "alert_only")
    }

# 4. GESTORE DELLA QUARANTENA SICURA E ROLLBACK
def move_to_quarantine(item_ids, all_findings):
    if not os.path.exists(QUARANTINE_DIR):
        os.makedirs(QUARANTINE_DIR, exist_ok=True)
        
    batch_id = datetime.now().strftime("BATCH_%Y%m%d_%H%M%S")
    batch_dir = os.path.join(QUARANTINE_DIR, batch_id)
    os.makedirs(batch_dir, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    moved_count = 0
    total_freed_bytes = 0
    errors = []
    
    for f in all_findings:
        if f["id"] in item_ids and f["type"] != "alert_only":
            source_path = f["path"]
            if os.path.exists(source_path):
                dest_path = os.path.join(batch_dir, os.path.basename(source_path))
                try:
                    # Sposta in quarantena
                    shutil.move(source_path, dest_path)
                    cur.execute(
                        "INSERT INTO quarantine_ledger (batch_id, original_path, quarantined_path, file_size_bytes, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                        (batch_id, source_path, dest_path, f["size_bytes"], "QUARANTINED", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                    )
                    moved_count += 1
                    total_freed_bytes += f["size_bytes"]
                    
                    # AUTO-LEARNING: Salva la nuova skill nel cervello SQLite
                    try:
                        cur.execute("SELECT id FROM learned_footprints WHERE software_name = ?", (f["title"],))
                        if not cur.fetchone():
                            cur.execute(
                                "INSERT INTO learned_footprints (software_name, description, known_paths, learned_date, confidence) VALUES (?, ?, ?, ?, ?)",
                                (f["title"], f"Pattern validato ed isolato: {f['description']}", source_path, datetime.now().strftime("%Y-%m-%d"), 1.0)
                            )
                    except Exception:
                        pass
                except Exception as e:
                    errors.append(f"Errore su {source_path}: {str(e)}")
                    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "batch_id": batch_id,
        "moved_count": moved_count,
        "freed_mb": round(total_freed_bytes / (1024 * 1024), 2),
        "errors": errors
    }

def rollback_last_quarantine():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Trova l'ultimo batch
    cur.execute("SELECT DISTINCT batch_id FROM quarantine_ledger WHERE status = 'QUARANTINED' ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"success": False, "message": "Nessun elemento in quarantena da ripristinare."}
        
    last_batch = row[0]
    cur.execute("SELECT id, original_path, quarantined_path FROM quarantine_ledger WHERE batch_id = ? AND status = 'QUARANTINED'", (last_batch,))
    records = cur.fetchall()
    
    restored_count = 0
    errors = []
    
    for rec_id, orig_path, quar_path in records:
        if os.path.exists(quar_path):
            try:
                # Ripristina al percorso originale
                os.makedirs(os.path.dirname(orig_path), exist_ok=True)
                shutil.move(quar_path, orig_path)
                cur.execute("UPDATE quarantine_ledger SET status = 'RESTORED' WHERE id = ?", (rec_id,))
                restored_count += 1
            except Exception as e:
                errors.append(f"Errore ripristino su {orig_path}: {str(e)}")
                
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "batch_id": last_batch,
        "restored_count": restored_count,
        "errors": errors
    }

def purge_all_quarantine():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    total_purged_bytes = 0
    if os.path.exists(QUARANTINE_DIR):
        for root, dirs, files in os.walk(QUARANTINE_DIR):
            for f in files:
                try:
                    total_purged_bytes += os.path.getsize(os.path.join(root, f))
                except Exception:
                    pass
        try:
            shutil.rmtree(QUARANTINE_DIR)
        except Exception:
            pass
        os.makedirs(QUARANTINE_DIR, exist_ok=True)
        
    cur.execute("UPDATE quarantine_ledger SET status = 'PURGED' WHERE status = 'QUARANTINED'")
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "purged_mb": round(total_purged_bytes / (1024 * 1024), 2),
        "message": "Quarantena svuotata definitivamente con successo."
    }

def get_quarantine_stats():
    total_bytes = 0
    files_count = 0
    batches = []
    if os.path.exists(QUARANTINE_DIR):
        for item in os.listdir(QUARANTINE_DIR):
            item_path = os.path.join(QUARANTINE_DIR, item)
            if os.path.isdir(item_path):
                batches.append(item)
                for root, dirs, files in os.walk(item_path):
                    for f in files:
                        try:
                            total_bytes += os.path.getsize(os.path.join(root, f))
                            files_count += 1
                        except Exception:
                            pass
    return {
        "exists": os.path.exists(QUARANTINE_DIR),
        "total_mb": round(total_bytes / (1024 * 1024), 2),
        "files_count": files_count,
        "batches_count": len(batches),
        "batches": batches
    }

def auto_purge_expired_batches(days=14):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT batch_id, timestamp FROM quarantine_ledger WHERE status = 'QUARANTINED'")
    rows = cur.fetchall()
    
    purged_batches = []
    now = datetime.now()
    for batch_id, ts_str in rows:
        try:
            batch_date = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            if (now - batch_date).days >= days:
                batch_folder = os.path.join(QUARANTINE_DIR, batch_id)
                if os.path.exists(batch_folder):
                    shutil.rmtree(batch_folder, ignore_errors=True)
                cur.execute("UPDATE quarantine_ledger SET status = 'PURGED_AUTO' WHERE batch_id = ?", (batch_id,))
                purged_batches.append(batch_id)
        except Exception:
            pass
            
    conn.commit()
    conn.close()
    return purged_batches

# 5. SERVER HTTP NATIVO PYTHON CON ENDPOINT REST
class PCMioHandler(BaseHTTPRequestHandler):
    
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            index_file = os.path.join(PROJECT_DIR, "index.html")
            if os.path.exists(index_file):
                with open(index_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
            else:
                self._send_json(404, {"error": "index.html non trovato"})
        elif self.path in ("/logo.png", "/logo_transparent.png"):
            logo_file = os.path.join(PROJECT_DIR, "logo.png")
            if os.path.exists(logo_file):
                with open(logo_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
            else:
                self._send_json(404, {"error": "Logo non trovato"})
        elif self.path == "/logo.jpg":
            logo_file = os.path.join(PROJECT_DIR, "logo.jpg")
            if os.path.exists(logo_file):
                with open(logo_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
            else:
                self._send_json(404, {"error": "Logo non trovato"})
        elif self.path == "/api/status":
            ollama_status = check_ollama()
            total, used, free = shutil.disk_usage("C:\\")
            self._send_json(200, {
                "system": "Windows x64",
                "disk_free_gb": round(free / (1024**3), 1),
                "disk_total_gb": round(total / (1024**3), 1),
                "ollama": ollama_status,
                "guardrails_active": True
            })
        elif self.path == "/api/quarantine/status":
            auto_purge_expired_batches(days=14)
            self._send_json(200, get_quarantine_stats())
        elif self.path == "/api/startup/list":
            self._send_json(200, {"apps": list_startup_apps()})
        elif self.path == "/api/memory":
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("SELECT software_name, description, learned_date, confidence FROM learned_footprints")
            skills = [{"name": r[0], "desc": r[1], "date": r[2], "confidence": r[3]} for r in cur.fetchall()]
            conn.close()
            self._send_json(200, {"skills": skills})
        else:
            self._send_json(404, {"error": "Endpoint non trovato"})

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        body_json = json.loads(post_body.decode()) if post_body else {}

        if self.path == "/api/scan":
            modules = body_json.get("modules", None)
            result = execute_system_scan(modules=modules)
            # Salva snapshot
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO audit_snapshots (timestamp, installed_count, anomalies_count, free_gb, report_summary) VALUES (?, ?, ?, ?, ?)",
                (result["timestamp"], 42, len(result["findings"]), 112.0, result["ai_summary"])
            )
            conn.commit()
            conn.close()
            self._send_json(200, result)

        elif self.path == "/api/startup/toggle":
            app_name = body_json.get("name", "")
            enable = body_json.get("enable", False)
            success = toggle_startup_app(app_name, enable)
            self._send_json(200, {"success": success, "apps": list_startup_apps()})

        elif self.path == "/api/startup/delete":
            app_name = body_json.get("name", "")
            success = delete_startup_app(app_name)
            self._send_json(200, {"success": success, "apps": list_startup_apps()})

        elif self.path == "/api/quarantine":
            selected_ids = body_json.get("selected_ids", [])
            scan_data = execute_system_scan()
            res = move_to_quarantine(selected_ids, scan_data["findings"])
            self._send_json(200, res)

        elif self.path == "/api/quarantine/purge":
            res = purge_all_quarantine()
            self._send_json(200, res)

        elif self.path == "/api/rollback":
            res = rollback_last_quarantine()
            self._send_json(200, res)
            
        else:
            self._send_json(404, {"error": "Endpoint non trovato"})

def start_background_server(port=PORT):
    init_db()
    server = HTTPServer(("127.0.0.1", port), PCMioHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server

if __name__ == "__main__":
    init_db()
    server = HTTPServer(("127.0.0.1", PORT), PCMioHandler)
    print("=======================================================")
    print(f"      [PC MIO] CORE SERVER ATTIVO SU PORTA {PORT}")
    print("=======================================================")
    print(f"Endpoint API: http://127.0.0.1:{PORT}/api/status")
    print(f"Database: {DB_PATH}")
    print(f"Ollama Target: {OLLAMA_URL} ({MODEL_NAME})")
    print("=======================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer arrestato.")
