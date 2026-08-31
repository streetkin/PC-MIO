<div align="center">

  <img src="logo.png" alt="PC MIO Logo" width="140" />

  # PC MIO
  ### Assistente Intelligente per la Salute, Pulizia e Ottimizzazione del PC
  **100% Locale • Privato • Scudo Personalizzato • AI Sovrana**

  [![Windows](https://img.shields.io/badge/Piattaforma-Windows%2010%20%2F%2011-0078D4.svg?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/streetkin/PC-MIO)
  [![AI](https://img.shields.io/badge/AI%20Locale-Ollama%20(Qwen%20%2F%20Llama)-059669.svg?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
  [![Design](https://img.shields.io/badge/Design-Google%20Material%203-1A73E8.svg?style=for-the-badge&logo=materialdesign&logoColor=white)](https://github.com/streetkin/PC-MIO)
  [![Licenza](https://img.shields.io/badge/Codice-Open%20Source-6366F1.svg?style=for-the-badge)](https://github.com/streetkin/PC-MIO)
  [![Made In Italy](https://img.shields.io/badge/Progetto-100%25%20Italiano%20%F0%9F%87%AE%F0%9F%87%B9-DC2626.svg?style=for-the-badge)](https://github.com/streetkin/PC-MIO)

  <p align="center">
    <b>Nessun cloud. Nessun abbonamento. Nessun allarmismo. Nessuna cancellazione distruttiva a freddo.</b><br/>
    Un assistente pensato per capire chi sei, proteggere i tuoi file essenziali e spiegarti ogni operazione con chiarezza e trasparenza.
  </p>

</div>

---

## 💡 Perché PC MIO è Diverso dai Soliti Pulitori?

I classici software di pulizia usano spesso strategie aggressive: mostrano finti allarmi con *"Migliaia di errori nel registro"*, cancellano file senza spiegare cosa sono e rischiano di distruggere progetti importanti, file di gioco o librerie audio.

**PC MIO ribalta completamente questo approccio:**

1. **Prima ti chiede chi sei:** Attraverso un onboarding guidato, definisce il tuo profilo (Studente, Gamer, Musicista, Creator, Sviluppatore, Lavoro) e crea uno **Scudo Protettivo su misura** che rende inviolabili i tuoi percorsi chiave.
2. **Niente allarmismi ingiustificati:** Ogni anomalia trovata viene valutata con criteri oggettivi e linguaggio trasparente (*Rischio basso*, *Informativo*, mai *"Rischio zero"* fittizio).
3. **Cassaforte Reversibile:** Nessun file viene eliminato sul colpo. I file rimossi vengono isolati in una **Quarantena sicura per 14 giorni**, ripristinabili al loro posto esatto con un solo clic.
4. **Intelligenza Artificiale Sovrana:** Sfrutta un modello AI in esecuzione direttamente sulla tua macchina tramite **Ollama**. I tuoi dati, percorsi e file non escono **mai** dal tuo computer.

---

## ✨ Funzionalità Chiave

### 🛡️ 1. Scudo Protettivo Dinamico
All'avvio, PC MIO configura uno scudo deterministico con regole di esclusione operative:
* 🎓 **Studio & Scuola:** Protezione cartelle Documenti, Desktop, PDF, tesine e note.
* 🎮 **Gaming:** Tutela di Steam, Epic Games, librerie e file di salvataggio (`Saved Games`).
* 🎹 **Musica & Produzione:** Blindatura totale di plugin VST3, cartelle Steinberg e progetti DAW.
* 🎨 **Grafica & Video:** Tutela cartelle Immagini, Video, progetti Adobe e asset Blender.
* 💻 **Programmazione & AI:** Protezione repository Git, ambienti `.vscode`, pesi modelli e ambienti Python.
* 💼 **Lavoro & Famiglia:** Protezione cartelle OneDrive, fatture, fogli di calcolo e documenti contabili.
* ⚙️ **Sistema Operativo:** Protezione ferrea e immutabile su `C:\Windows`, cartelle `System32` e file di programma.

### 🚀 2. Gestione Intelligente dei Programmi all'Avvio
* **Riconoscimento Automatico:** Identifica programmi noti (Edge, OneDrive, Discord, Canva, antivirus) fornendo descrizione chiara, grado di impatto sull'avvio (Alto, Medio, Basso) e consigli pratici.
* **Prudenza per le App Sconosciute:** Le app non catalogate vengono etichettate come `⚠️ Non riconosciuto`, consigliando all'utente di verificare prima di disattivare.
* **Interruttore Reversibile & Rimozione Definitiva:** Puoi spegnere un'applicazione all'avvio con un semplice toggle iOS-style senza toccare il programma, oppure rimuoverla dal registro se non ti serve più.

### 📦 3. Cassaforte di Sicurezza (Quarantena a 14 Giorni)
* **Interventi Chirurgici:** Sposta solo i singoli file temporanei individuati (es. crash dump, archivi duplicati), senza toccare o amputare le cartelle genitore.
* **Rollback Istantaneo:** Annulla l'ultima operazione con ripristino automatico e gestione intelligente di eventuali conflitti di nomi (`.bak`).
* **Protezione Cancellazione:** Lo svuotamento permanente della cassaforte richiede di digitare esplicitamente la parola **`ELIMINA`**, prevenendo perdite accidentali.

### 🧠 4. Cervello AI e Memoria Adattiva Locale
* Dialoga con il motore open source **Ollama** locale (`qwen2.5-coder:1.5b` o `llama3.2`).
* Genera sintesi discorsive personalizzate che spiegano all'utente cosa è stato trovato e perché è sicuro procedere.
* Salva le impronte digitali delle pulizie confermate nel database locale SQLite (`pcmio_memory.sqlite`), creando uno storico permanente consultabile in qualsiasi momento.

### 🔒 5. Architettura di Sicurezza Operativa
* **Token di Sessione Crittografico (`X-PC-MIO-Token`):** Tutte le chiamate di sistema (scansione, quarantena, modifiche all'avvio) richiedono un token crittografico univoco generato all'avvio del server. Richieste non autorizzate vengono bloccate con codice HTTP 403 Forbidden.
* **CORS Restrittivo:** Accessibile solo dall'interfaccia locale di PC MIO.
* **Black Box / Logging Strutturato:** Registro eventi persistente con rotazione automatica in `logs/pcmio.log`.

---

## 🎨 Interfaccia Google Clean Material 3

L'interfaccia è progettata seguendo i principi di usabilità moderni di Google:
* Sfondo chiaro riposante (`#F8FAFC`), tipografia curata con font **Inter**, icone ad alto contrasto.
* Schede modulari interattive per verificare lo spazio su disco, lo stato dello Scudo e le regole apprese.
* Finestre modali animate per la gestione guidata dell'avvio, della quarantena e delle raccomandazioni per i file sensibili.

---

## 🧠 Configurazione Consigliata: Ollama (AI Locale)

PC MIO funziona perfettamente anche in modalità stand-alone. Per attivare le spiegazioni discorsive dell'assistente AI locale:

1. Scarica e installa **Ollama per Windows** dal sito ufficiale: [ollama.com/download/windows](https://ollama.com/download/windows)
2. Apri il terminale (PowerShell o Prompt dei comandi) e scarica il modello compatto consigliato:
   ```bash
   ollama run qwen2.5-coder:1.5b
   ```
   *(Pesa circa 900 MB, risponde in pochi decimi di secondo ed è ottimizzato per consumare pochissima RAM)*.
3. Fatto! PC MIO rileverà in automatico la presenza del servizio locale mostrando l'indicatore verde **"Cervello AI: Attivo"**.

---

## 💻 Installazione ed Esecuzione

### Opzione A: Installer Windows (.exe)
È disponibile l'installer nativo pronto all'uso generato con Inno Setup 6:
* Esegui **`PC_MIO_Setup.exe`**
* Installa l'applicazione con collegamenti automatici sul Desktop e nel Menu Start.

### Opzione B: Esecuzione da Codice Sorgente (Sviluppatori)
Requisiti: **Python 3.10+**

```bash
# 1. Clona il repository
git clone https://github.com/streetkin/PC-MIO.git
cd PC-MIO

# 2. Installa le dipendenze
pip install pywebview

# 3. Avvia l'applicazione desktop
python app_desktop.py
```

Oppure avvia direttamente il backend server:
```bash
python backend/server.py
```
E apri l'interfaccia nel browser su: `http://127.0.0.1:8765`

---

## 📐 Schema Architetturale

```text
┌─────────────────────────────────────────────────────────────┐
│             INTERFACCIA DESKTOP (Google Material 3)         │
│           HTML5 • TailwindCSS • Inter • pywebview           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST + X-PC-MIO-Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               CORE ENGINE SERVER (Porta 8765)               │
│                                                             │
│  ├─► Gestore Scudo & Guardrail Reali (real_paths)           │
│  ├─► Scanner File & Calcolo Dimensioni Reali (os.walk)      │
│  ├─► Gestore Avvio Windows (Registro HKCU Run)              │
│  ├─► Cassaforte Quarantena Chirurgica (C:\PC_MIO_Quarantine)│
│  └─► Logger di Sistema con Rotazione (logs/pcmio.log)       │
└──────────────────┬──────────────────────────┬───────────────┘
                   │                          │
                   ▼                          ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      DATABASE MEMORIA        │ │      CERVELLO AI LOCALE    │
│  SQLite (pcmio_memory.sqlite)│ │   Ollama (127.0.0.1:11434) │
│   - Profili Utente & Scudo   │ │   - Qwen 2.5 Coder 1.5B    │
│   - Registro Quarantena      │ │   - Nessun dato su Cloud   │
│   - Impronte Apprese         │ │   - Spiegazioni in italiano│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 🛡️ Trasparenza e Sicurezza

PC MIO non include tracker, componenti pubblicitari o telemetria esterna.  
Tutto il codice sorgente è aperto e verificabile:
- Nessun dato personale viene mai trasmesso fuori dalla macchina.
- Nessuna modifica al registro viene applicata senza il consenso esplicito dell'utente.
- Tutti i file rimossi restano recuperabili in ogni momento dalla Quarantena.

---

## 🇮🇹 Progetto Italiano
Ideato e sviluppato con passione per dare agli utenti Windows un'alternativa sicura, trasparente e moderna per la cura del proprio computer.
