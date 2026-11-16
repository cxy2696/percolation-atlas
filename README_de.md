# Perkolations-Atlas

[English](README.md) · [简体中文](README_cn.md) · **Deutsch**

[![CI](https://github.com/cxy2696/percolation-atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/cxy2696/percolation-atlas/actions/workflows/ci.yml) [![Pages](https://github.com/cxy2696/percolation-atlas/actions/workflows/pages.yml/badge.svg)](https://github.com/cxy2696/percolation-atlas/actions/workflows/pages.yml) [![Release](https://img.shields.io/github/v/release/cxy2696/percolation-atlas?label=release)](https://github.com/cxy2696/percolation-atlas/releases)

Perkolation stellt eine scheinbar einfache Frage: Wann bilden zufällige Verbindungen einen Pfad durch ein Medium? Die Antwort reicht von Kaffeesatz und porösen Elektroden über Wälder und Stromnetze bis zu Kontaktnetzwerken. Dieser Atlas sammelt Theorie, Simulation und Belege und markiert, wo jede Aussage endet.

Er enthält 23 Kapitel auf Englisch, Chinesisch und Deutsch, 17 interaktive Experimente, 13 Algorithmen-Rundgänge, fünf Referenzausgaben (C++, Python, Julia, Java, R) und 144 Quellen. JavaScript dient nur der Browser-Oberfläche; die Referenzalgorithmen liegen in `lib/`.

Die Seite besteht aus statischem Markdown, JSON und JavaScript, ohne Anwendungsserver und Laufzeit-Framework. Ein Python-Paket und eine kleine JSON-API machen dieselben Algorithmen außerhalb des Browsers nutzbar.

**Live-Seite:** <https://cxy2696.github.io/percolation-atlas/> · **Wiki:** <https://github.com/cxy2696/percolation-atlas/wiki> · **Release:** [v1.5.0](https://github.com/cxy2696/percolation-atlas/releases/tag/v1.5.0)

## Hier beginnen

- **Das Argument lesen.** Mit [Kapitel 1](https://cxy2696.github.io/percolation-atlas/#/de/atlas/01-foundations) beginnen, dann Kapitel 3–7 für den strengen Kern. Der Kapitelindex steht [hier](https://cxy2696.github.io/percolation-atlas/#/de/atlas).
- **Ein Experiment laufen lassen.** Der [Experimentindex](https://cxy2696.github.io/percolation-atlas/#/de/labs) beginnt mit drei geführten Läufen: die Durchgangswahrscheinlichkeit bei `p = 1/2` messen, drei Gittergrößen kollabieren lassen und das Suszeptibilitätsmaximum finden. Jedes Experiment hat eine Lesehilfe, ein Laufprotokoll und Links zu den geprüften Kapiteln.
- **Eine Zahl prüfen.** [Quellen](https://cxy2696.github.io/percolation-atlas/#/de/sources) listet jede Referenz mit DOI oder stabiler URL und ihrem Audit-Status. Exakte, numerische und vermutete Aussagen sind unterschiedlich gekennzeichnet; die Konvention steht auf der [Startseite](https://cxy2696.github.io/percolation-atlas/#/de/guide).

## Schnellstart

Voraussetzungen: Python 3.10+, Node.js 20+ und ein C++20-Compiler. Julia 1.9+ wird nur für die Julia-Suite gebraucht.

```sh
git clone https://github.com/cxy2696/percolation-atlas.git
cd percolation-atlas
python3 scripts/build_content.py     # Manifest, Suchindex, Code-Inventar
python3 scripts/serve.py 8788        # http://127.0.0.1:8788/
```

`http://127.0.0.1:8788/` öffnen. Die Seite muss über HTTP laufen, weil der Content-Loader `fetch()` verwendet; ein direkt geöffnetes `index.html` funktioniert nicht. Die Standardroute ist die Startseite auf Englisch im hellen Modus. Routen verwenden `#/en/...`, `#/zh/...` oder `#/de/...`; Theme und Sprache werden in `localStorage` gemerkt.

## Was enthalten ist

| Ebene | Inhalt |
|---|---|
| Kapitel | 23 Kapitel auf Englisch, vereinfachtem Chinesisch und Deutsch, von der Arbeit von 1957 über Dualität, Schärfe, Exponenten, SLE, Random-Cluster-Modelle, Netzwerke, Messung, Anwendungen, Algorithmen, gerichtete und kontinuierliche Perkolation, Transport, Beweise, Entwurf, Reproduzierbarkeit, Bäume und Epidemien. |
| Experimente | 17 interaktive Modelle: Gitterperkolation, Durchgangskollaps, Newman–Ziff, 3D-Site-Perkolation, Cardy, gerichtete Perkolation, Random-Cluster, Bootstrap, explosiv, Invasion, Netzwerkrobustheit, gekoppelte Kaskaden, Boolesches Modell, Bethe-Baum, SIR, k-Kern-Schälen und ein Algorithmenstudio. |
| Algorithmen | 13 Routinen mit Idee, Invariante, Kosten, Quelldateien und Fehlerquellen: Bernoulli-Sampler, DSU, Bond- und Site-Newman–Ziff, Leath, Bootstrap, Invasion, Achlioptas, k-Kern, Hoshen–Kopelman, Bethe-Fixpunkt, SIR-Endgröße und Message Passing. Die Referenzimplementierungen und ihre Tests sind nach Sprache in `content/algorithms.json` indexiert. |
| Code | C++20 header-only, Julia, Python, Java und R, mit demselben xoshiro128**-Strom und derselben Kantenordnung. Java und R decken Bernoulli-Sampling, DSU, Gitter und Newman–Ziff ab; JavaScript ist die Browser-Laufzeit in `assets/js/engine`, keine Referenzausgabe. |
| Daten | C++-Benchmark-Harness, Python-Analysator und ein JSON-Protokoll mit Rohzählungen, Seeds und Fits. |
| Prüfungen | Fünf Referenz-Suiten plus Browser-Laufzeittests, sprachübergreifende Paritätsproben, RNG-Golden-Werte, Übersetzungsstruktur, Prosa-Aussagen und Bibliographie-Audit. |
| Dokumentation | [`docs/ALGORITHMS.md`](docs/ALGORITHMS.md), [`docs/EXAMPLES.md`](docs/EXAMPLES.md), [`docs/RNG.md`](docs/RNG.md), [`docs/API.md`](docs/API.md), [`docs/VERIFICATION.md`](docs/VERIFICATION.md). |

## Prüfungen reproduzieren

```sh
make test          # vier Suiten + Parität + Struktur-, Aussagen-, Algorithmen- und Stilprüfung
make verify        # Übersetzungsstruktur + Prosa-Aussagen + Quellen-Audit
make bench         # C++-Harness -> data/raw_bench.json
make analyse       # Roh-JSON -> data/benchmarks.json
make content       # Manifest/Suchindex/Code-Inventar neu bauen
make audit         # Crossref/HTTP-Quellen-Audit
make package       # Wheel + sdist für das Python-Paket
make check-algorithms  # Index, Quelldateien, Tests, Dokumentationsreihenfolge
make check-style       # Untergrenze für generierte Prosa
```

Eine einzelne Suite:

```sh
node --test tests/js/*.test.js
PYTHONPATH=lib/python python3 -m unittest discover -s lib/python/tests -v
make -C lib/cpp test
julia --startup-file=no --project=lib/julia lib/julia/test/runtests.jl
```

Der Paritätsvertrag steht in `data/golden/parity.json`, die Zufallsstrom-Vektoren in `data/golden/rng-seed42.json`, die Proben für Algorithmensammlung, v4-Löser, Site-Sweep und Message Passing in `data/golden/algorithms-v3.json`. Eine Änderung an RNG, Gitterkantenordnung oder Verbrauchsreihenfolge ist eine brechende Änderung: Goldens neu erzeugen, Version erhöhen und in Kapitel 14 dokumentieren. Abdeckung und Grenzen der Prüfungen stehen in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Benchmark-Pipeline

`scripts/bench.cpp` schreibt nur Rohzählungen, Größen und den Seed. `scripts/analyse_bench.py` ergänzt abgeleitete Größen, die Cardy-Kurve, einen Kollaps-Fit und eine Einarm-Steigung. Die Datenansicht liest `data/benchmarks.json`; fehlt die Datei, zeigt sie die obigen Befehle statt einer erfundenen Kurve.

Der Benchmark ist ein Lehrdatensatz, keine Präzisionsmessung. Er ist so dimensioniert, dass er in wenigen Minuten auf einem Laptop läuft und Endlichkeitseffekte sichtbar macht. Kapitel 11 sagt, was er stützen kann und was nicht.

## Python-Paket, CLI und API

Das Python-Paket ist die distribuierbare Form der Engine. Es hat außer der Standardbibliothek keine Laufzeitabhängigkeiten.

```sh
python3 -m pip install -e lib/python

atlas-perc info
atlas-perc algorithms             # die dreizehn Routinen und ihr Code
atlas-perc algorithms nz --json   # Quellen und Tests einer Routine
atlas-perc sample    --lattice square --mode bond --L 128 --p 0.5 --seed 42
atlas-perc sweep     --lattice square --L 64 --seed 7
atlas-perc bootstrap --L 64 --p 0.55 --r 3 --seed 11
atlas-perc invasion  --L 48 --seed 3
atlas-perc explosive --n 2000 --rule product --seed 7
atlas-perc serve     --port 8080
```

`atlas-perc serve` liefert die statische Seite und eine JSON-API unter `/api` (`/api/health`, `/api/thresholds`, `/api/sample`, `/api/sweep`, `/api/bootstrap`, `/api/invasion`, `/api/explosive`, `/api/openapi.json`). Die API ist ein Referenzdienst mit begrenzten Eingaben und ohne Authentifizierung; öffentlich nur hinter einem Reverse-Proxy betreiben. Siehe [`docs/API.md`](docs/API.md).

Deployment: GitHub Pages (kanonische Seite), Docker (`Dockerfile`), Netlify, Vercel und Fly.io. Details in [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## Repository-Struktur

```
README.md / README_cn.md / README_de.md  Repository-Leitfaden in drei Sprachen
content/
  en/ zh/ de/           Kapitel-Markdown, eine Datei pro Kapitel und Sprache
  algorithms.json       maschinenlesbarer Index der dreizehn Routinen
  references.json       Primärbibliographie (DOI oder stabile Verlags-URL)
  citations.json        Kapitel -> Referenzschlüssel
  manifest.json         generiert; nicht von Hand bearbeiten
  search.json           generierter Volltextindex
  code.json             generiertes Code-Inventar
data/
  golden/               RNG-Vektoren und sprachübergreifende Paritätsproben
  raw_bench.json        generiertes Rohprotokoll
  benchmarks.json       generiertes, analysiertes Protokoll
lib/
  cpp/                  header-only C++20-Bibliothek + Makefile + Tests
  julia/                Julia-Paket + Tests
  python/               Python-Paket + Tests
  js/                   ES-Modul-Engine, die die Seite mitbenutzt
  java/                 Java-17-Kernausgabe + Paritätssuite
assets/
  js/views/             Übersicht, Atlas, Experimente, Code, Algorithmen, Daten, Suche, Quellen
  js/labs/              siebzehn Experimente mit handgeschriebenen Lesehilfen
  js/lib/               Plot-, Statistik-, Laufprotokoll- und Notizbuch-Helfer
  css/hud.css           Shell-Stile
  css/reading.css       Leseschicht: Schrift, Zeilenmaß, Farbe und Responsive-Regeln
scripts/
  build_algorithms.mjs  validiert algorithms.json und erzeugt den Reader-Index
  build_content.py      validiert Inhalte und erzeugt JSON
  check_algorithms.py   Quellen, Tests und Doku-Abdeckung der Routinen
  check_style.py        Untergrenze für generierte Prosa
  check_translations.py vergleicht Abschnittsnummern, Gleichungs-Tags und Display-Blöcke
  bench.cpp             C++-Rohdaten-Harness
  analyse_bench.py      abgeleitete Daten und Fits
  serve.py              statischer Vorschau-Server
  verify_references.py  Crossref/HTTP-Bibliographie-Audit
  parity_algorithms.py  Algorithmensammlung, v4-Löser und Message-Passing-Parität
tests/js/              Node-Tests
docs/                   API, RNG, Algorithmen, Daten, Skalierung, Verifikation und Redaktion
wiki/                  GitHub-Wiki-Quelle, veröffentlicht von scripts/push_wiki.sh
```

## Entwurf und Wartung

- **Lesen zuerst.** Kapitel verwenden ein 720-px-Serifenmaß, satzgroße Überschriften und eine helle Standardpalette. Die Messwertsprache bleibt den Live-Anzeigen vorbehalten, nicht der Prosa.
- **Inhalt.** Markdown mit YAML-Frontmatter. Jedes Kapitel hat eine stabile id und dieselbe Reihenfolge in jeder Sprache. `scripts/build_content.py` lehnt eine unvollständige Übersetzung, eine doppelte Reihenfolge oder eine unaufgelöste Zitation ab; `scripts/check_translations.py` lehnt Kapitel ab, deren Abschnittsnummern, Gleichungs-Tags oder Display-Blöcke zwischen den Ausgaben driften.
- **Übersetzungen.** Von Hand geschrieben, nicht zur Laufzeit maschinell übersetzt. Glossar und Stilregeln stehen in [`docs/EDITORIAL.md`](docs/EDITORIAL.md); technische Begriffe bleiben über die Ausgaben hinweg konsistent. Eine vierte Ausgabe ist eine Inhalts- und Redaktionsaufgabe, keine Engine-Änderung.
- **Algorithmen.** `content/algorithms.json` ist die einzige Quelle für die 13 Routinen: Reihenfolge, Gruppierung, Zusammenfassungen, Prosa, Quellen und Tests. `scripts/build_algorithms.mjs` erzeugt das Site-Modul und den Python-Index; `scripts/check_algorithms.py` prüft, dass jede Quelle und jeder Test existiert und die Dokumentation dieselbe Reihenfolge hat.
- **Experimente.** Jedes Experiment nutzt dieselbe Engine wie die Bibliotheks-Suiten. Ein Laufprotokoll hält Regler, Seed, Messwerte, App-Version und – wenn verfügbar – den Commit fest; es lässt sich als JSON laden oder in einem lokalen Notizbuch speichern.
- **Barrierefreiheit.** Tastaturnavigation, sichtbarer Fokus, semantische Überschriften, Textlabels für Diagrammreihen und eine helle/dunkle Palette mit erhaltenem Kontrast. Diagramme sind Canvas, aber jedes Experiment berichtet seine Kernzahlen auch als Text.
- **Browser.** Aktuelle Chrome-, Firefox- und Safari-Versionen mit ES-Modulen und `IntersectionObserver`. Ohne JavaScript bleibt das Markdown in `content/` lesbar.

## Umfang und Grenzen

Dies ist eine Referenz und ein Lehrinstrument. Es beansprucht keine neuen Sätze oder neuen Präzisionsmessungen. Jeder numerische Wert ist als exakt oder numerisch gekennzeichnet; die Errata-Tabelle in Kapitel 14 dokumentiert die in früheren Ausgaben gefundenen Fehler.

Bekannte Grenzen:

- Das synthetische Marktbeispiel im separaten Repository `hmm-percolation` gehört nicht zu diesem Atlas.
- Der Benchmark ist ein Lehrdatensatz mit einem Seed und endlichen Größen, keine Präzisionsmessung.
- Die 3D-Exponenten sind numerisch. Die 2D-Exponenten sind nur für Site-Perkolation auf dem Dreiecksgitter durch einen Satz gedeckt; andere planare Gitter sind Vermutung.
- Die Antworten für Bäume und Message Passing sind auf Bäumen exakt und auf lokal baumartigen Graphen asymptotisch; auf einem Gitter sind sie die Bethe-Näherung.
- Die SIR-Abbildung ist bei konstanter infektiöser Periode exakt; bei variabler Periode liefert sie die Schwelle und eine Molekularfeld-Endgröße, keine unabhängigen Kanten.
- Die Seite modelliert keine realen Markt-, Epidemie- oder Infrastrukturdaten.

## Mitwirken

Korrekturen sind willkommen, besonders solche mit Quelle. Zuerst [`CONTRIBUTING.md`](CONTRIBUTING.md) und [`docs/EDITORIAL.md`](docs/EDITORIAL.md) lesen. Eine Änderung an einem numerischen Pfad braucht `make test`, die Python-Suite und eine Regeneration wie in `scripts/reproduce.sh`; eine Änderung an einer Aussage braucht einen Beweis, eine Zitation oder eine ausdrückliche empirische Kennzeichnung.

## Lizenz

Code: MIT (`LICENSE`). Text und Abbildungen: CC BY 4.0 (`LICENSE-CONTENT`).
