<!-- LANG-NAV -->
[English](README.md) · [Português](README.pt.md) · [Español](README.es.md) · **Deutsch** · [Français](README.fr.md) · [Italiano](README.it.md)

# 🪙 Trevi

> Ein Wunschlisten-Manager für Obsidian. Wirf eine Münze in den Brunnen und wünsch dir etwas — jeder Wunsch ist ein Eintrag, der in deinem eigenen Vault gespeichert wird. Keine sozialen Funktionen, keine KI: lokal, portabel und elegant.

Trevi verwandelt deinen Vault in eine persönliche Sammlung von Wunschlisten. Erstelle benannte Listen, füge Einträge mit Foto, Preis und Link hinzu, führe eine Preishistorie und sieh dir alles auf einem leichtgewichtigen SVG-Dashboard an — wobei alles in einfachen Dateien gespeichert wird, die dir vollständig gehören und sich mühelos zwischen Geräten synchronisieren lassen, das Smartphone eingeschlossen.

## Funktionen

- **Piazza** — ein Startbildschirm mit jeder Liste als Karte (Titelbild, Anzahl der Einträge, Gesamtwert).
- **Listen & Einträge** — vollständiges CRUD, Textsuche, Filter (Status, Priorität, Tag) und Sortierung (Preis, Priorität, Datum, Titel). Tippe auf einen Eintrag, um ihn zu öffnen.
- **„Wirf eine Münze"** — der Ablauf zum Hinzufügen von Einträgen, mit **Metadaten-Erfassung aus einer URL** (Open Graph + JSON-LD, abgerufen über Obsidians `requestUrl`, sodass es auf Mobilgeräten und trotz CORS funktioniert), und manueller Eingabe als Rückfalloption.
- **Bilder** — in einem flachen Ordner gespeichert, nach UUID benannt und in der Datendatei nur per UUID referenziert. Vom Gerät hinzufügen oder von einer URL herunterladen.
- **Preise** — nur manuelle Aktualisierungen (je Eintrag oder alle auf einmal). Jede Änderung wird an eine Preishistorie angehängt, die Trend-Sparklines speist.
- **Statistiken** — Summen je Währung, Anzahl nach Status/Priorität/Tag und Preistrends. Beschränke das Dashboard auf alle Listen oder eine einzelne.
- **Listen-Titelbild** — lege das Titelbild einer Liste aus einem Gerätebild oder dem Foto eines beliebigen Eintrags fest.
- **Verschieben · Duplizieren · Als gekauft markieren · Link öffnen · Exportieren** — nur einen Fingertipp von jedem Eintrag oder aus dem Menü einer Liste entfernt.
- **Export nach Markdown** — verwandle jede Liste in eine Notiz mit einer Tabelle ihrer Einträge.
- **Papierkorb** — sicheres, wiederherstellbares Löschen mit konfigurierbarem Aufbewahrungszeitraum; Wiederherstellen oder endgültig Entfernen; verwaiste Bilder werden nur auf Anforderung bereinigt.
- **Palette** — die ruhige „Trevi"-Palette plus Voreinstellungen (Travertino, Acquamarina, Notturno) und farbweise Überschreibungen. Farbe wird nur auf die Daten angewendet; alles andere übernimmt dein Theme, in Hell und Dunkel.
- **Backups & Wiederherstellung** — atomare Schreibvorgänge, eine `.bak`-Datei, rotierende tägliche Snapshots, automatische Wiederherstellung aus dem neuesten lesbaren Backup und ein schreibgeschützter abgesicherter Modus, der unlesbare Daten niemals überschreibt.
- **Internationalisierung** — English, Português, Español, Deutsch, Français, Italiano.
- **Barrierefrei & mobile-first** — per Tastatur navigierbar, Theme-bewusst, responsiv bis hinunter zur Smartphone-Breite.

## Screenshots

<p align="center">
  <img src="docs/en-piazza.png" width="24%" alt="Piazza">
  <img src="docs/en-list.png" width="24%" alt="List view">
  <img src="docs/en-stats.png" width="24%" alt="Statistics">
  <img src="docs/en-modal.png" width="24%" alt="Item editor">
</p>

## Erste Schritte

**Manuelle Installation**

1. Kopiere `main.js`, `manifest.json` und `styles.css` nach `<dein Vault>/.obsidian/plugins/trevi/`.
2. In Obsidian: Einstellungen → Community-Plugins → **Trevi** aktivieren.

**BRAT (Beta)**

Füge das Repository im BRAT-Plugin hinzu, um Updates ohne manuelles Kopieren zu erhalten.

**Community-Plugins**

Sobald es gelistet ist, installiere es über Einstellungen → Community-Plugins → Durchsuchen.

## Verwendung

1. Öffne **Trevi** über die Symbolleiste (das Brunnen-Symbol) oder die Befehlspalette (`Trevi: Open Piazza`).
2. Erstelle eine Liste, dann **Wirf eine Münze**, um einen Eintrag hinzuzufügen — füge eine Produkt-URL ein und tippe auf **Abrufen**, oder trage ihn von Hand ein.
3. Tippe auf einen Eintrag, um ihn zu bearbeiten; verwende das **⋯**-Menü eines Eintrags, um seinen Link zu öffnen, seinen Preis zu aktualisieren, ihn zu verschieben, zu duplizieren, als Listen-Titelbild festzulegen oder zu löschen.
4. Verwende das **⋯**-Menü der Liste, um ein Titelbild festzulegen, umzubenennen, nach Markdown zu exportieren oder zu löschen.
5. Öffne **Statistiken** für Summen und Preistrends.

## Daten, Speicherung & Datenschutz

- **Single Source of Truth**: eine JSON-Datei in deinem Vault (Standard `core/trevi/trevi.json`), atomar geschrieben.
- **Bilder**: ein flacher Ordner (Standard `core/trevi/assets`), eine Datei je UUID.
- **Kein Netzwerkzugriff außer bei deiner Aktion**: die einzigen Anfragen sind Metadaten-/Preis-/Bildabrufe, die du auslöst, alle über `requestUrl`. Keine Telemetrie, keine Hintergrundprozesse, keine Konten.
- **Keine KI, keine sozialen Funktionen** — keine Empfehlungen, kein Teilen, keine Reservierungen oder Geschenke.
- Beide Pfade sind in den Einstellungen konfigurierbar; eine Änderung migriert deine vorhandenen Daten sicher.

## Backups & Wiederherstellung

- Jeder Speichervorgang behält eine `.bak`-Datei und einmal pro Tag einen rotierenden, datierten Snapshot (die fünf neuesten werden aufbewahrt).
- Beim Start lädt Trevi die neueste lesbare Datei und versucht dabei `trevi.json` → `.bak` → tägliche Snapshots.
- Wenn alles unlesbar ist, wechselt Trevi in einen **schreibgeschützten abgesicherten Modus** und überschreibt deine Dateien niemals, sodass du sie von Hand wiederherstellen kannst.
- Wenn es Synchronisierungs-Konfliktdateien im Datenordner erkennt, warnt es dich.

## Einstellungen

| Einstellung | Funktion |
|---|---|
| Datendatei | Pfad der JSON-Datei in deinem Vault (verschiebt vorhandene Daten bei Änderung). |
| Bilderordner | Wo Bilder gespeichert werden, nach UUID (verschiebt vorhandene Bilder bei Änderung). |
| Standardwährung | ISO 4217-Code für neue Einträge. |
| Sprache | Sprache der Benutzeroberfläche (6 unterstützt). |
| Papierkorb-Aufbewahrung (Tage) | Wie lange gelöschte Einträge wiederherstellbar bleiben. |
| Anfangspreis anlegen | Speichert beim Erstellen eines Eintrags den ersten Preiseintrag, damit Trends Daten haben. |
| Palette | Voreinstellung + farbweise Überschreibung für Diagrammfarben. |
| Verwaiste Bilder bereinigen | Entfernt nicht referenzierte Bilder — nur auf Anforderung. |

## Kompatibilität

- **Desktop und Mobil.** `isDesktopOnly` ist `false`; das Plugin nutzt keine Node-Module und der gesamte Netzwerkverkehr läuft über `requestUrl`.
- Diagramme sind handgezeichnetes SVG, das die Variablen deines Themes übernimmt und in Hell und Dunkel funktioniert.

## Entwicklung

Trevi wird als eine einzige handgeschriebene `main.js` ausgeliefert (plus `manifest.json` und `styles.css`) — kein Build-Schritt erforderlich. Die funktionale Spezifikation befindet sich in `trevi-spec.md`.

## Nicht-Ziele

- Keine sozialen Funktionen (Teilen, Geschenkreservierungen, Wichteln, Geldgeschenke).
- Keine KI (Empfehlungen, Entdeckung, Inhaltserzeugung).
- Keine Hintergrundprozesse — nichts läuft, während Obsidian geschlossen ist.

## Lizenz

[MIT](LICENSE) © Fagner Candido
