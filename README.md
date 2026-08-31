<div align="center">

  <img src="logo.png" alt="PC MIO Logo" width="160" />

  # PC MIO
  ### Il Tuo Assistente di Ottimizzazione e Sicurezza con AI Locale

  [![Windows](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-blue.svg?style=flat-square&logo=windows)](https://github.com/streetkin/PC-MIO)
  [![AI](https://img.shields.io/badge/AI-Ollama%20Locale%20(100%25%20Privato)-emerald.svg?style=flat-square&logo=ollama)](https://ollama.ai)
  [![Design](https://img.shields.io/badge/Style-Google%20Clean%20Material%203-blueviolet.svg?style=flat-square)](https://github.com/streetkin/PC-MIO)
  [![License](https://img.shields.io/badge/Made%20in-Italy%20%F0%9F%87%AE%F0%9F%87%B9-red.svg?style=flat-square)](https://github.com/streetkin/PC-MIO)

  <p align="center">
    <b>Trasparente. Rassicurante. 100% Locale e Sovrano sui Tuoi Dati.</b><br/>
    Nessun cloud, nessun abbonamento, nessuna cancellazione a freddo senza controllo.
  </p>

</div>

---

## 🌟 Caratteristiche Principali

* 🔍 **Analisi a 1 Clic (Stile Google Clean):** Niente menu dispersivi o gergo da hacker. Un unico stato del computer e soluzioni immediate a portata di mano.
* 🚀 **Gestore Avvio di Windows Integrato:** Individua le applicazioni in background che rallentano l'accensione del PC e ti permette di disattivarle con un semplice interruttore ON/OFF.
* 🛡️ **Cassaforte di Sicurezza (Quarantena a 14 Giorni):** I file non vengono mai distrutti a freddo. Vengono custoditi in una stanza di quarantena con **Rollback in 1 clic** e auto-eliminazione programmata.
* 🧠 **Cervello AI con Auto-Apprendimento:** Utilizza un modello locale open source (Ollama: `qwen2.5-coder` / `llama3.2`) e memorizza nel database SQLite locale le impronte approvate, migliorando a ogni scansione.
* 🔒 **Guardrail di Protezione Totale:** Protegge in modo rigoroso file di sistema (`C:\Windows`), progetti utente e cartelle VST3/DAW audio da qualsiasi cancellazione errata.

---

## 💻 Come Avviare o Installare

### Metodo 1: Installer Ufficiale Windows
Puoi compilare o eseguire l'installer dedicato:
* Generato tramite lo script `installer.iss` con **Inno Setup**.
* Crea l'applicazione in `%LOCALAPPDATA%\Programs\PC MIO` con scorciatoia sul Desktop e nel Menu Start.

### Metodo 2: Esecuzione Diretta da Sorgente
Requisiti: **Python 3.10+** e **Ollama** (opzionale per l'inferenza AI).

```bash
# 1. Clona il repository
git clone https://github.com/streetkin/PC-MIO.git
cd PC-MIO

# 2. Installa le dipendenze
pip install pywebview

# 3. Avvia la finestra desktop nativa
python app_desktop.py
```

Oppure fai doppio clic su:
👉 **`AVVIA_PC_MIO.bat`**

---

## 🏗️ Architettura del Software

```
[ FRONTEND ]   Google Material 3 Clean UI (HTML5, TailwindCSS, Inter Font, Toggle iOS-style)
      │
      ▼
[ BACKEND ]    Python Micro-Core Server (Porta 8765)
      ├─► Scanner Win32 / Registro HKCU Run (Gestione avvio)
      ├─► Modulo Quarantena Reversibile & Rollback (C:\PC_MIO_Quarantine)
      ├─► Guardrail Deterministici (Whitelist DAW, VST3, System32)
      │
      ▼
[ MEMORIA ]    SQLite Locale (`pcmio_memory.sqlite`) + Ollama Local API (`127.0.0.1:11434`)
```

---

## 🇮🇹 Orgoglio Italiano
Sviluppato con passione per offrire agli utenti Windows uno strumento di pulizia e ottimizzazione che rispetti la privacy, i file personali e la semplicità d'uso quotidiana.
