# Tema natalizio annuale — piano di implementazione

Specifica approvata: anteprima v3, con lucine statiche, neve sui bordi, rametti e stelline. Nessun albero, pupazzo o suono. Stile e contenuti esistenti conservati. Attivazione annuale dal 1 dicembre al 6 gennaio compreso, fuso Europe/Rome.

Architettura: un piccolo script classico autonomo, identico nei due siti, con CSS incluso e SVG statici. Nessuna libreria, animazione o richiesta aggiuntiva per immagini. Un controllo al caricamento, al ritorno sulla scheda e alla successiva mezzanotte italiana. Parametro natale=anteprima per vedere la versione fuori stagione.

- [x] Testare prima i confini temporali, il fuso italiano e la prossima mezzanotte.
- [x] Implementare scripts/js/winter-theme.js e collegarlo a index.html nei due siti.
- [x] Verificare calendario, assenza decorazioni fuori stagione, anteprima, navigazione, desktop/mobile, disattivazione e assenza audio.
- [x] Eseguire le regressioni, lint/build applicabili e revisione indipendente.
- [ ] Pubblicare sui due siti autorizzati e verificare le versioni online.

Arcamis: checkout isolato .arcamis-imprese, branch dedicato codex/natale-stagionale basato su origin/main. La PR 9 della biblioteca resta separata. Mestieri: worktree gestito natale-mestieri, basato su main. Non includere robots.txt preesistente né file di anteprima.

Verifiche: calendario e cambio fuso, rendering e attivazione/disattivazione nei due siti a 1440/390/320 px, anteprima fuori stagione, revisione indipendente senza rilievi. Mestieri: 13 test di regressione e 40 browser superati (10 casi non applicabili al dispositivo saltati).
