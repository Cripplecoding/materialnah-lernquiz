# Materialnah – Lernquiz

Materialgebundenes Lerntraining mit OpenAI: 15 Fragen je Durchgang, offene Antworten, Multiple Choice und Begriffszuordnung. Statt Wörter aus Sätzen auszublenden werden Verständnisfragen und ausschließlich belegte Zusammenhänge abgefragt.

## Lokal starten

Node.js 22 oder neuer ist erforderlich. Es gibt keine npm-Abhängigkeiten und keinen Installationsschritt.

1. Eine lokale `.env.local` im Projektordner anlegen und `OPENAI_API_KEY` sicher konfigurieren. `.env.example` dokumentiert die Variablen. Niemals Schlüssel in HTML, JavaScript für den Browser oder Git speichern.
2. `npm start` ausführen.
3. `http://127.0.0.1:3000` öffnen.

Ein bereits extern gespeicherter Schlüssel kann ohne Kopieren verwendet werden:

```powershell
node --env-file="C:\Pfad\zur\.env.local" server.mjs
```

Standardmodell: `gpt-4.1`. `OPENAI_MODEL` kann ein anderes für Responses und Structured Outputs freigeschaltetes Modell festlegen. `PORT` ändert den lokalen Port. Der Server bindet ausschließlich an `127.0.0.1` und ist für persönlichen lokalen Gebrauch vorgesehen. GitHub Pages reicht für diese Version nicht: API-Schlüssel und Bewertung benötigen den Node-Server. Öffnen der HTML-Datei per Doppelklick ist nicht mehr der Startweg.

## Lernen

1. Eigene UTF-8-Dateien in TXT/Markdown importieren oder Text einfügen. Bis zu 20 Quellen, insgesamt 60.000 Zeichen und 160 Textabschnitte. PDF/DOCX vorher als Text exportieren und die Textübernahme prüfen; OCR und Binärdateien werden nicht unterstützt.
2. „Material auswerten“ erstellt eine Übersicht von Lernaspekten mit Originalzitaten. Jeder Textabschnitt muss mindestens einem Aspekt oder einer ausdrücklich ausgewiesenen nicht verwendbaren Stelle zugeordnet werden. Übersicht auf Vollständigkeit prüfen.
3. „15 Fragen starten“ erzeugt exakt fünf Aufgaben je Format. Bis zu fünf bislang ungeübte Aspekte werden als Pflichtabdeckung vorgegeben und nachgeprüft. Eine zusätzliche KI-Prüfung beurteilt Belege, Lösungen, Kriterien, Eindeutigkeit und inhaltliche Neuheit. Fehlgeschlagene Durchgänge werden vollständig verworfen.
4. „Antwort prüfen“ gibt grüne oder rote Rückmeldung, Musterlösung und Originalbelege. Offene Antworten werden sinngemäß anhand vorab festgelegter Kriterien beurteilt. Die Lösung bleibt bis „Nächste Frage“ sichtbar. Auswahl- und Zuordnungsaufgaben werden ohne zusätzlichen KI-Aufruf geprüft.
5. Nach 15 Aufgaben: Prozentwert, Antwortübersicht und Wahl zwischen denselben Fragen in garantiert anderer Reihenfolge und 15 neuen Fragen. Neue Fragen dürfen nicht bloß umformuliert oder in ein anderes Format überführt sein. Dafür gibt es einen exakten Duplikatfilter und eine zusätzliche semantische KI-Prüfung. Wenn keine 15 geeigneten neuen Fragen entstehen, bleibt Wiederholen möglich.

## Bewertung und Quellenbindung

- Jede vollständig richtige Aufgabe zählt einen Punkt. Zuordnungen erfordern drei richtige Paare. Freie Antworten erfordern alle notwendigen Kriterien und dürfen der Quelle nicht widersprechen. Keine Teilpunkte. Ergebnis = richtige Aufgaben / 15 × 100, Anzeige auf eine Nachkommastelle gerundet.
- Aussagen, Kriterien, Musterlösungen und Verknüpfungen dürfen ausschließlich auf den hochgeladenen Quellen beruhen. Die API erhält keine Websuche oder externen Recherchewerkzeuge.
- Jedes Zitat muss technisch überprüfbar als unverändertes Textstück im referenzierten Originalabschnitt vorkommen. MC-Optionen und beide Seiten einer Zuordnung müssen zusätzlich wörtlich in den zugehörigen Zitaten vorkommen. Ablenker sind andere Begriffe aus dem Material, keine neu erfundenen Tatsachenbehauptungen.
- Unlesbare und nicht eindeutig verwertbare Stellen werden angezeigt. Kein stilles Abschneiden zu großer Materialien.
- **KI-Prüfungen garantieren weder absolute Fehlerfreiheit noch vollständige Erfassung aller fachlichen Aspekte.** Ein korrektes Zitat allein beweist noch keine richtige Schlussfolgerung. Deshalb zusätzliche Quellenprüfung und sichtbare Originalbelege; bei strittigen Fragen ist eine fachliche Prüfung nötig. Die Anwendung ist ein Lernwerkzeug, keine benotete oder manipulationssichere Abiturprüfung.
- Die Fortschrittsanzeige zählt beantwortete, erkannte Aspekte – nicht automatisch beherrschtes Wissen. Umfangreicher Stoff verteilt sich über mehrere Durchgänge.
- Es werden keine erfundenen Lernbeispiele ausgeliefert. Synthetische Daten in `tests/` dienen ausschließlich isolierten Softwaretests und werden weder in die App geladen noch an die echte API gesendet.

## Daten, Schlüssel und Fehlerfälle

Material, Fragen und schriftliche Antworten werden zur Verarbeitung an OpenAI übertragen. Die Nutzung kann API-Kosten verursachen. Responses-Anfragen verwenden `store: false`. Das ist keine Zusage, dass beim API-Anbieter keinerlei betriebliche Speicherung erfolgt; dessen Datenrichtlinien gelten zusätzlich.

Der Schlüssel bleibt serverseitig. Es gibt nur vier ausdrücklich freigegebene statische Dateien; `.env`-Dateien, Backend und Git-Inhalte werden nicht ausgeliefert. Sitzungen sind durch zufällige HttpOnly-/SameSite-Cookies getrennt. Host- und Origin-Prüfungen verhindern fremde Browserseiten als Aufrufer. Pro Sitzung läuft höchstens eine Mutation gleichzeitig. Wiederholtes Absenden derselben bereits bewerteten Antwort zählt keinen zweiten Punkt.

Lernmaterial und Fortschritt liegen nur im Serverspeicher, bleiben bei einem Neuladen im selben Browser erhalten und verfallen nach vier Stunden Inaktivität oder beim Serverneustart. Die Bereinigung abgelaufener Sitzungen erfolgt bei der nächsten API-Anfrage. Maximal 50 Sitzungen und 150 neue Fragen je Sitzung. Neues Auswerten setzt den bisherigen Verlauf zurück. Keine Nutzerdaten werden in Dateien protokolliert.

API-Ausfälle, unvollständige Antworten, ungültige Zitate und abgelehnte Prüfungen werden als Fehler angezeigt und niemals als falsche Lernantwort gewertet. HTTP 429 kann durch Anfrage-/Tokenlimits oder Kontingente entstehen; vor erneutem Versuch OpenAI-Projektlimits prüfen. Fehlendes Guthaben wird bei entsprechendem API-Fehlercode gesondert angezeigt.

## Entwicklung und Prüfung

```sh
npm test
```

Die Tests verwenden injizierte API-Antworten ohne Netzwerk und prüfen insbesondere Quellenvalidierung, Textabdeckung, Formate, Wiederholung, Bewertung, Prozentwert, verlorene API-Anfragen, idempotentes Absenden sowie gesperrte Dateien und fremde Origins. Ein bestandener Testlauf beweist nicht die Qualität tatsächlicher KI-Fragen.

Dateien: `server.mjs` (HTTP/Sitzungen), `quiz.mjs` (Validierung/Quizlogik), `openai.mjs` (Responses API), `app.js`/`styles.css`/`lernquiz.html` (Oberfläche).

API-Grundlage: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
