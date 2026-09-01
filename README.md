<div align="center">

  <img src="logo.png" alt="PC MIO Logo" width="140" />

  # PC MIO
  ### Assistente Intelligente per la Salute, Pulizia e Ottimizzazione del PC
  **Scanner Universale V2 • 100% Locale • Privato • Scudo Dinamico • AI Sovrana**

  [![Windows](https://img.shields.io/badge/Piattaforma-Windows%2010%20%2F%2011-0078D4.svg?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/streetkin/PC-MIO)
  [![Scanner V2](https://img.shields.io/badge/Scanner-V2%20Universale%20Windows-10B981.svg?style=for-the-badge&logo=speedtest&logoColor=white)](https://github.com/streetkin/PC-MIO)
  [![AI](https://img.shields.io/badge/AI%20Locale-Ollama%20(Qwen%20%2F%20Llama)-059669.svg?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
  [![Design](https://img.shields.io/badge/Design-Google%20Material%203-1A73E8.svg?style=for-the-badge&logo=materialdesign&logoColor=white)](https://github.com/streetkin/PC-MIO)
  [![Sicurezza](https://img.shields.io/badge/Sicurezza-Token%20%2B%20Guardrail-6366F1.svg?style=for-the-badge)](https://github.com/streetkin/PC-MIO)
  [![Made In Italy](https://img.shields.io/badge/Progetto-100%25%20Italiano%20%F0%9F%87%AE%F0%9F%87%B9-DC2626.svg?style=for-the-badge)](https://github.com/streetkin/PC-MIO)

  <p align="center">
    <b>Nessun cloud. Nessun abbonamento. Nessun allarmismo. Nessuna cancellazione cieca.</b><br/>
    L'unico assistente che prima impara chi sei per blindare i tuoi file personali, poi analizza qualunque Windows con motori universali e mette tutto al sicuro in una quarantena reversibile.
  </p>

</div>

---

## ⚖️ A Confronto: PC MIO vs I Vecchi Pulitori

| Caratteristica | I Classici Pulitori (es. CCleaner) | 🛡️ PC MIO (Approccio Moderno) |
| :--- | :--- | :--- |
| **Allarmismi** | ❌ *"15.420 Errori Gravi nel Registro!"* per spaventare | ✅ Valutazioni oggettive: *Rischio basso*, *Informativo* |
| **Protezione File** | ❌ Cancella alla cieca rischiando di eliminare progetti | ✅ **Scudo Personale:** blindatura preventiva su misura |
| **Cancellazione** | ❌ Eliminazione immediata e distruttiva | ✅ **Cassaforte Reversibile a 14 giorni** (Rollback a 1 clic) |
| **Numeri e Misure** | ❌ Spesso stime fittizie o non verificabili | ✅ **Dimensioni reali al byte** calcolate sul disco |
| **Privacy & Rete** | ❌ Telemetria continua e pubblicità | ✅ **100% Locale e Offline**, zero dati all'esterno |
| **Spiegazione Azioni** | ❌ Nessuna: o accetti o rifiuti | ✅ **AI Locale integrata (Ollama)** che spiega ogni voce |

---

## 🚀 Lo Scanner V2 Universale Windows

PC MIO integra un motore di scansione modulare multi-engine in grado di analizzare **qualsiasi computer Windows 10 e 11** senza bisogno di configurazioni manuali:

```
                          ┌───────────────────────────┐
                          │   SCANNER V2 UNIVERSALE   │
                          └─────────────┬─────────────┘
                                        │
     ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
     ▼                  ▼               ▼               ▼                  ▼
┌──────────┐    ┌──────────────┐ ┌─────────────┐ ┌─────────────┐    ┌─────────────┐
│ %TEMP% & │    │  Windows     │ │   Browser   │ │  Installer  │    │  Cestino    │
│ Win Temp │    │  Update      │ │    Cache    │ │  Downloads  │    │  Windows    │
│ (>24h)   │    │  (Residui)   │ │  (Chromium) │ │   (>30gg)   │    │  (Nativo)   │
└──────────┘    └──────────────┘ └─────────────┘ └─────────────┘    └─────────────┘
```

1. 🧹 **File Temporanei di Sistema & Utente (`%TEMP%` & `C:\Windows\Temp`):**  
   Individua file `.tmp`, log orfani e residui di installazioni chiuse da oltre 24 ore, preservando le sessioni aperte.
2. 🔄 **Residui Pacchetti Windows Update (`C:\Windows\SoftwareDistribution\Download`):**  
   Rileva e propone la rimozione delle patch e dei file di setup già installati con successo, recuperando centinaia di megabyte sul disco principale.
3. 🌐 **Cache Temporanea Browser Web (Chrome, Edge, Brave):**  
   Isola solo gli elementi grafici e la cache HTTP. **Regola invalicabile:** password, cookie di accesso, preferiti e cronologia non vengono **mai** toccati.
4. 📦 **Installer Obsoleti in Download (> 30 giorni):**  
   Trova pacchetti di installazione (`.exe`, `.msi`, `.iso`) scaricati e dimenticati nella cartella Download da più di un mese.
5. 🗑️ **Cestino di Windows Intelligente:**  
   Interroga le API native (`SHQueryRecycleBinW`) e offre uno svuotamento controllato in un clic.
6. 🎯 **Residui di Applicazioni e Crash Dumps:**  
   Scansione chirurgica di dump di errore e residui noti di build desktop (Electron, DAW, emulatori).

---

## 🛡️ Le Altre Funzionalità Chiave

### 1. Scudo Protettivo Dinamico & Onboarding Profilato
Al primo avvio, l'onboarding ti chiede come usi il computer e crea una protezione deterministica con percorsi reali (`real_paths`):
* 🎓 **Studio & Scuola:** Documenti, Desktop, PDF, tesine, appunti di studio.
* 🎮 **Gaming:** Librerie Steam, Epic Games, salvataggi (`Saved Games`).
* 🎹 **Musica & Produzione:** Plugin VST3, progetti DAW e directory Steinberg.
* 🎨 **Grafica & Video:** Progetti Adobe, cartelle Rendering, asset Blender 3D.
* 💻 **Programmazione & AI:** Repository Git, impostazioni VS Code, pesi modelli e ambienti Python.
* 💼 **Lavoro & Ufficio:** Cartelle OneDrive, fatture, fogli Excel e contabilità.
* ⚙️ **Sistema Operativo:** Protezione assoluta su `C:\Windows`, `System32` e Program Files.

### 2. Gestione Intelligente dell'Avvio (Startup Optimizer)
* **Analisi di Impatto:** Valuta ogni programma attivo all'accensione (Impatto Alto, Medio, Basso).
* **Consigli Pratici:** Spiega a cosa serve ciascun programma e suggerisce se conviene tenerlo attivo.
* **Prudenza per le App Sconosciute:** I programmi non catalogati vengono contrassegnati con `⚠️ Non riconosciuto`, invitando alla verifica prima di spegnerli.
* **Interruttore Reversibile o Rimozione:** Disattivazione pulita tramite chiave di backup nel registro, oppure eliminazione definitiva a scelta dell'utente.

### 3. Cassaforte di Sicurezza (Quarantena a 14 Giorni)
* **Pulizia Chirurgica:** Sposta solo i singoli file temporanei (mai intere cartelle genitore).
* **Rollback in 1 Clic:** Ripristina i file nella posizione originaria. Se il file esiste già, crea automaticamente una copia `.bak` di sicurezza.
* **Conferma Protetta:** Per svuotare definitivamente la cassaforte, l'utente deve digitare esplicitamente la parola **`ELIMINA`**.

### 4. Cervello AI e Memoria Adattiva Locale
* Dialoga con il motore open source **Ollama** locale (`qwen2.5-coder:1.5b` o `llama3.2`).
* Genera spiegazioni vocali/testuali immediate che riassumono la salute del computer.
* Registra le impronte approvate nel database SQLite locale (`pcmio_memory.sqlite`) per non richiedere le stesse conferme in futuro.

### 5. Sicurezza Operativa e Sovranità Dati
* **Token di Sessione Crittografico (`X-PC-MIO-Token`):** Generato casualmente ad ogni avvio. Nessun sito web o programma terzo può impartire comandi a PC MIO.
* **CORS Restrittivo:** Accetta comandi solo dall'interfaccia autorizzata.
* **Logging con Rotazione:** Registro eventi continuo e verificabile in `logs/pcmio.log`.

---

## 🎨 Interfaccia Google Clean Material 3

Progettata per garantire la massima leggibilità e usabilità:
* Palette colori chiara Google Clean (`#F8FAFC`, `#1A73E8`, `#059669`).
* Schede interattive per disco, scudo e memoria.
* Modali guidate con transizioni fluide e interruttori in stile iOS.

---

## 🧠 Guida Veloce: Attivare l'AI Locale (Ollama)

PC MIO funziona regolarmente anche senza AI. Per abilitare il cervello intelligente locale:

1. Scarica e installa **Ollama per Windows**: [ollama.com/download/windows](https://ollama.com/download/windows)
2. Apri il terminale (PowerShell o CMD) e lancia il modello compatto consigliato:
   ```bash
   ollama run qwen2.5-coder:1.5b
   ```
   *(Pesa ~900 MB, consuma pochissima RAM e risponde all'istante)*.
3. PC MIO rileverà in automatico il servizio mostrando l'indicatore verde **"Cervello AI: Attivo"**.

---

## 💻 Installazione ed Esecuzione

### Metodo 1: Installer Ufficiale Windows (.exe)
Scarica ed esegui l'installer creato con Inno Setup:
* File: **`PC_MIO_Setup.exe`**
* Installa l'applicazione con scorciatoie sul Desktop e nel Menu Start.

### Metodo 2: Esecuzione da Codice Sorgente (Sviluppatori)
Requisiti: **Python 3.10+**

```bash
# 1. Clona il repository
git clone https://github.com/streetkin/PC-MIO.git
cd PC-MIO

# 2. Installa le dipendenze
pip install pywebview

# 3. Avvia la finestra desktop nativa
python app_desktop.py
```

Oppure avvia direttamente il server backend:
```bash
python backend/server.py
```
E accedi all'interfaccia via browser su `http://127.0.0.1:8765`.

---

## 📐 Schema Architetturale

```text
┌─────────────────────────────────────────────────────────────┐
│             INTERFACCIA DESKTOP (Google Material 3)         │
│           HTML5 • TailwindCSS • Inter • pywebview           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST + Header X-PC-MIO-Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               CORE ENGINE SERVER (Porta 8765)               │
│                                                             │
│  ├─► Scanner V2 Universale (%TEMP%, Update, Browser, Cestino)
│  ├─► Scudo Dinamico & Guardrail Reali (os.path.commonpath)  │
│  ├─► Gestore Avvio Windows (Registro HKCU Run)              │
│  ├─► Cassaforte Quarantena Chirurgica (C:\PC_MIO_Quarantine)│
│  └─► Logger con Rotazione Automatica (logs/pcmio.log)       │
└──────────────────┬──────────────────────────┬───────────────┘
                   │                          │
                   ▼                          ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      DATABASE MEMORIA        │ │      CERVELLO AI LOCALE    │
│  SQLite (pcmio_memory.sqlite)│ │   Ollama (127.0.0.1:11434) │
│   - Profili Utente & Scudo   │ │   - Qwen 2.5 Coder 1.5B    │
│   - Registro Quarantena      │ │   - 100% Sovrano e Privato │
│   - Impronte Apprese         │ │   - Spiegazioni in Italiano│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 🛡️ Privacy e Trasparenza
- Zero tracciamento, zero metriche inviate a server remoti.
- Codice sorgente completamente aperto e verificabile.
- Tutti i dati rimangono sulla tua macchina.

---

## 🇮🇹 Progetto Italiano
Sviluppato con passione per offrire una soluzione moderna, trasparente e sicura per la cura del proprio PC Windows.
