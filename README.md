# ⚡ GhostTrace AI — Privacy-First Local AI System Auditor & Optimizer

> **Audit del PC trasparente, intelligente e 100% offline.**  
> Nessuna telemetria, nessun cloud, nessun abbonamento. Alimentato dal tuo modello locale (Ollama).

---

## 🌟 La Visione

La maggior parte dei software di pulizia esistenti sono scatole nere che cancellano file a caso o basati su elenchi rigidi.  
**GhostTrace AI** introduce un assistente sistemistico intelligente che:
1. **Analizza in sola lettura** il file system, i registri e i software realmente installati.
2. **Usa l'IA Locale (Ollama)** per ragionare sulle discrepanze e scovare residui, cartelle orfane e file anomali.
3. **Genera un `REPORT.md` chiaro** in linguaggio naturale con spiegazioni sul perché ogni singolo file o cartella è lì.
4. **Applica solo le modifiche approvate** con semplici caselle di spunta (checkbox).
5. **Non cancella a freddo:** sposta i file in una **Quarantena Reversibile** con ripristino (Rollback) in 1 clic.
6. **Impara autonomamente:** ogni report arricchisce la base di conoscenza locale dell'IA con i pattern di impronta dei vari programmi.

---

## 🧱 Architettura del Sistema

```
[ FRONTEND ]   Tauri / Modern UI (Dashboard, Spunte, Report Markdown, Rollback)
      │
      ▼
[ BACKEND ]    Core Engine (Rust / Go / Python)
      ├─► Scanner Win32 / PowerShell (Lettura registri, AppData, ProgramData)
      ├─► Guardrail Deterministici (Whitelist C:\Windows, VST3, System32)
      ├─► Modulo Quarantena Reversibile & Rollback (Staging protetto)
      │
      ▼
[ LOCAL AI ]   Ollama Local API (http://127.0.0.1:11434)
      ├─► Modelli supportati: Llama 3.2 (3B), Mistral, Qwen 2.5
      └─► Memory Engine (SQLite: Impronte software imparate e Audit Trail)
```

---

## 🚀 Prototipo Interattivo della UI

Puoi aprire il file **`index.html`** con qualsiasi browser (Chrome, Edge) per esplorare l'interfaccia completa con:
- **Dashboard di Sistema** (metriche hardware e software censiti)
- **Scanner con Caselle di Spunta** (seleziona cosa scansionare)
- **Generatore Report Markdown** (visualizzatore interattivo)
- **Centro Azioni & Quarantena** (gestione reversibile dei file con Rollback)
- **Cervello & Knowledge Base** (le 40 regole e impronte imparate oggi sul campo)
