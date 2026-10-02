# Materialnah – Lernquiz

Öffne `lernquiz.html` durch Doppelklick in einer aktuellen Version von Chrome, Edge oder Firefox. Kein Server, keine Installation, kein API-Schlüssel. Die Anwendung verwendet keine externen Bibliotheken und versendet keine Daten. Beim Neuladen wird der Lernstand zurückgesetzt.

## Verwendung

1. Eigene UTF-8-Dateien im TXT- oder Markdown-Format auswählen oder Text einfügen. PDF und DOCX vorher als Text exportieren.
2. „Material auswerten“ anklicken. Mindestens 15 geeignete Originalsätze und vier verschiedene Lösungswörter sind erforderlich.
3. Einen Durchgang mit 15 Aufgaben starten: je fünf Multiple-Choice-, schriftliche und Zuordnungsaufgaben.
4. Nach jeder Eingabe „Antwort prüfen“ anklicken. Grün und ein Häkchen kennzeichnen richtige Antworten; Rot und ein Kreuz falsche. Die richtige Lösung und die Originalstelle bleiben bis zur nächsten Frage stehen.
5. Am Ende erscheinen der Prozentsatz und alle Antworten. Derselbe Satz Fragen lässt sich in garantiert anderer Fragenreihenfolge wiederholen. „Neue Fragen“ verwendet noch nicht gestartete Fragevarianten. Bei erschöpftem Vorrat verlangt die Anwendung mehr Material, statt Inhalte zu erfinden.

## Grenzen und bewusste Entscheidungen

- Es liegen keine fachlichen Lernunterlagen bei. Die Anwendung startet ohne erfundene Beispielinhalte.
- Die automatische Extraktion ist deterministisch: Sie nimmt Originalsätze und verdeckt jeweils ein markantes Wort. Sie erzeugt keine fachlichen Erklärungen oder neuen Behauptungen. Auswahlalternativen stammen aus anderen Stellen desselben Materials.
- Das Verfahren unterstützt Erinnern und Wiedererkennen. Es erzeugt **keine fachlich geprüften Abitur-, Transfer- oder freien Erörterungsaufgaben**. Begriffszuordnung ist keine automatische Analyse inhaltlicher Zusammenhänge. Solche Fragen benötigen redaktionelle Aufbereitung anhand des tatsächlichen Materials.
- Abdeckung bedeutet hier Anzahl bearbeiteter geeigneter Sätze, nicht garantierte Vollständigkeit aller Aspekte. Nicht geeignete Textstellen werden separat angezeigt. Bereits geübte Textstellen können in anderer Aufgabenform erneut vorkommen. In einer Zuordnungsaufgabe können frühere Textstellen als zusätzliche Zuordnungspartner vorkommen.
- Neue Varianten sind pro Sitzung durch Aufgabenformat und Ankertextstelle identifiziert. Eine begonnene Variante gilt als verwendet. Material erneut auszuwerten setzt diesen Verlauf zurück.
- Satzsegmentierung, Auswahl eines langen Wortes und Markdown-Struktur können sprachlich ungeeignete Aufgaben erzeugen. Originalbelege erlauben die Prüfung. Unterlagen sollten aus vollständigen, eindeutigen Sätzen bestehen. Fachliche Freigabe ist vor einem benoteten Einsatz erforderlich.
- Schriftliche Eingaben sind Lückentextantworten. Groß-/Kleinschreibung, Unicode-Normalisierung, äußere einfache Satzzeichen und Leerzeichen werden normalisiert. Synonyme werden nicht semantisch bewertet.
- Eine Aufgabe zählt genau einen Punkt, eine Zuordnung erst bei drei korrekten Paaren. Keine Teilpunkte. Prozent = richtige Aufgaben / 15 × 100, Anzeige auf eine Nachkommastelle gerundet.
- Lösungen sind im Browser verfügbar. Das ist ein Lernwerkzeug, keine manipulationssichere Prüfung.

## Code

HTML, CSS und JavaScript stehen vollständig in `lernquiz.html`. Die Funktionen `extract`, `makeRound`, `normalize` und `differentOrder` enthalten die Kernlogik. Nutzertext wird ausschließlich über `textContent` bzw. Textknoten dargestellt.
