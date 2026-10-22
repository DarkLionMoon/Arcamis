/* Dati editoriali del Pantheon: identità e testi adattati dalle pagine
   Notion (divinità, pantheon regionali e culti). Le immagini restano
   quelle già pubblicate in /images. */

export const ASPECTS_INTRO =
  'Gli Aspetti sono entità celesti di potere incalcolabile provenienti da Targon. Non possiedono una vera forma fisica: sono incarnazioni concettuali delle forze dell’universo e, per agire su Aetherion, devono discendere dal firmamento e fondersi con un ospite mortale.';

export const DEMONS_INTRO =
  'I Demoni sono entità spirituali nate dalle emozioni negative più viscerali dei mortali: paura, agonia, avidità, dipendenza. Non hanno una forma stabile e agiscono attraverso involucri, maschere e tentazioni.';

export const DEITIES = [
  {
    name: 'Anivia',
    img: '/images/pantheon-1786458644708.jpg#42,32',
    epithet: 'La Criofenice',
    alignment: 'Legale Buono',
    spheres: 'Gelo, Libertà e Speranza',
    symbol: 'Ali di uccello bianche o azzurre',
    quote: 'I am the fury of the blizzard, the bite of the wind, and the cold of the ice. I am the Freljord! — Anivia',
    personality:
      'Anivia è uno spirito alato eterno che sopporta cicli infiniti di vita, morte e rinascita per proteggere il Freljord. Nata dal permafrost e dai venti più amari, brandisce poteri elementali contro chiunque osi disturbare la sua terra. Le tribù del nord la venerano come simbolo di speranza e genitrice del grande cambiamento: attraverso il sacrificio la sua memoria perdura, e in un nuovo domani lei rinasce.',
    temple:
      'Santuari all’aperto, altari di ghiaccio e nidi di pietra sulle alture del Freljord; nessun tempio chiuso è degno di lei.',
    rituals:
      'Veglie durante le tempeste, offerte di piume bianche e preghiere pronunciate prima delle grandi migrazioni invernali.',
    followers:
      'Le tribù freljordiane, i cacciatori del nord e chi cerca speranza nel rigore della stagione fredda.'
  },
  {
    name: 'Janna',
    img: '/images/pantheon-1786460812142.jpg',
    epithet: 'Spirito della Saggezza e dell’Armonia',
    alignment: 'Caotico Buono',
    spheres: 'Conoscenza, Tempesta',
    symbol: 'Piccolo uccello blu sopra onde marine',
    quote: 'Do not fear the winds of change — they will always be at your back. — Janna',
    personality:
      'Antico e misterioso spirito, Jan’ahrem è giunta a proteggere gli oppressi di Zaun. La sua presenza si manifesta come una brezza lenitiva o una tempesta furiosa, ma può assumere anche forma corporea, offrendo conforto agli emarginati. Nel corso dei secoli ha assistito all’ascesa e alla caduta delle civiltà, restando un faro di speranza per chi è nel bisogno.',
    temple:
      'Santuari modesti nei quartieri bassi di Zaun e cappelle costruite dove il vento passa tra le ciminiere.',
    rituals:
      'Preghiere sussurrate prima di un viaggio, offerte di acqua pulita e campane di metallo leggero lasciate al vento.',
    followers:
      'Gli oppressi di Zaun, i navigatori, i profughi e chiunque abbia imparato a fidarsi del vento.'
  },
  {
    name: 'Morgana',
    img: '/images/img-1787416788495.jpg#50,50',
    epithet: 'La Dama Velata: La Caduta',
    alignment: 'Caotico Buono',
    spheres: 'Conoscenza',
    symbol: 'Ali angeliche oscure',
    quote: 'They called me a monster. I called it justice.',
    personality:
      'Sorella di Kayle, Morgana ha scelto la misericordia là dove la legge pretendeva obbedienza. La sua caduta non è stata una sconfitta: è il gesto di chi rifiuta di separare la giustizia dalla pietà. Il suo culto non vive di cattedrali luminose, ma della mano tesa a chi è stato giudicato e della voce che ricorda che nessuna colpa è senza redenzione.',
    temple:
      'Cappelle nascoste ai margini di Demacia, santuari ricavati in cripte e case abbandonate.',
    rituals:
      'Veglie per i condannati, offerte di piume nere e preghiere pronunciate senza chiedere perdono per sé.',
    followers:
      'Emarginati, esuli, carcerieri pentiti e chi cerca giustizia senza vendetta.'
  },
  {
    name: 'Taliyah',
    img: '/images/img-1787416800542.jpg#50,50',
    epithet: 'La Grande Tessitrice: Dea Shurimana del fato',
    alignment: 'Neutrale Puro',
    spheres: 'Conoscenza',
    symbol: 'Volto di donna in una luna piena',
    quote: 'Il deserto non dimentica. Io sono la sua voce.',
    personality:
      'La Grande Tessitrice intreccia i fili di ogni vita in un arazzo che nessun mortale può leggere per intero. I nomadi shurimani la invocano prima di mettersi in cammino e i suoi sacerdoti leggono il destino nelle sabbie e nelle stelle. Taliyah, la Tessimassi, è considerata dai suoi anziani una prescelta: la dea le avrebbe concesso il potere sulla terra.',
    temple:
      'Santuari nomadi sotto le stelle, cerchi di pietra eretti dove le carovane si fermano.',
    rituals:
      'Lettura dei fili del fato, offerte di sabbia e acqua, canti di viaggio all’alba.',
    followers:
      'Nomadi shurimani, carovane, indovini e chi cerca una strada nel deserto.'
  },
  {
    name: 'Kindred',
    img: '/images/pantheon-1786461145919.jpg',
    epithet: 'Lo Spirito della Morte',
    alignment: 'Neutrale Puro',
    spheres: 'Morte',
    symbol: 'Maschera bianca dell’Agnella e maschera nera del Lupo',
    quote: 'Lamb: Every life… Wolf: …ends with us. — Kindred',
    personality:
      'Da quando i popoli conoscono la morte, i Kindred camminano su Valoran. Agnella offre la freccia a chi accetta la fine; Lupo guida la caccia per chi fugge. A Demacia si invoca l’Agnella, a Noxus si onora il Lupo, nel Freljord i gruppi di guerra baciano il Lupo prima della battaglia. Nessuno sfugge per sempre al loro arco o ai loro denti.',
    temple:
      'Nessun tempio stabile: tombe, cimiteri e luoghi di passaggio sono i loro santuari.',
    rituals:
      'Riti funebri, offerte di carne e frecce, veglie per i morti senza nome.',
    followers:
      'Chi accompagna i morenti, i becchini, i guerrieri che rispettano la morte e i popoli che ne onorano il mistero.'
  },
  {
    name: 'Ornn',
    img: '/images/pantheon-1786461126719.jpg',
    epithet: 'Lo Spirito del Fuoco',
    alignment: 'Legale Neutrale',
    spheres: 'Conoscenza, Forgia',
    symbol: 'Martello fiammeggiante',
    quote: 'I made this hammer. It was so good I named it... “Hammer.” — Ornn',
    personality:
      'Ornn è il semidio del Freljord legato alla forgiatura e all’artigianato. Lavora nella solitudine di un’immensa fucina scavata nelle caverne laviche sotto il vulcano Focolare, dove plasma calderoni di metallo fuso e oggetti di qualità ineguagliabile. Quando la natura selvaggia diventa troppo caotica, cammina sulla terra e la riporta all’ordine con il martello o con il fuoco delle montagne.',
    temple:
      'Fucine e forge di montagna, spesso costruite attorno a una vena di lava o a un’antica officina.',
    rituals:
      'Offerte di metallo grezzo, il primo oggetto forgiato da un apprendista, preghiere prima di temprare una lama.',
    followers:
      'Fabbrì, artigiani, minatori e chi rispetta il lavoro ben fatto più delle parole.'
  },
  {
    name: 'Volibear',
    img: '/images/pantheon-1786461106343.jpg',
    epithet: 'Il Ruggito di Tuono',
    alignment: 'Caotico Malvagio',
    spheres: 'Tempesta, Guerra',
    symbol: 'Artigli d’orso',
    quote: 'Gods do not beg. We take what is ours! — Volibear',
    personality:
      'Per chi lo venera, Volibear è la tempesta incarnata. Distruttivo, selvaggio e ostinatamente risoluto, esisteva prima che i mortali camminassero sul Freljord. Il suo dominio si estendeva su territori incontaminati e sulla prole che egli stesso aveva creato. Odia la civiltà e le debolezze che porta con sé; combatte per il ritorno ai tempi antichi, quando la terra era selvaggia e il sangue scorreva libero.',
    temple:
      'Altari di ossa e legno nelle terre selvagge, cerchi di pietra battuti dai fulmini.',
    rituals:
      'Cacce rituali, duelli sotto la tempesta, offerte di sangue e artigli al primo tuono della stagione.',
    followers:
      'Gli Ursidi, i guerrieri del nord e chi rifiuta le catene della civiltà.'
  },
  {
    name: 'Nagakabouros',
    img: '/images/pantheon-1786461084223.jpg',
    epithet: 'Il Grande Kraken',
    alignment: 'Caotico Neutrale',
    spheres: 'Vita, Tempesta',
    symbol: 'Testa di serpente con tentacoli',
    quote: 'There are kind and gentle gods. Mine isn’t one of those. — Illaoi',
    personality:
      'Dea del movimento, Nagakabouros è originaria delle Isole del Serpente ed è conosciuta anche come la Signora della Fiamma Blu. La sua religione insegna a seguire i propri desideri e a forgiare il proprio destino: fermarsi, rifiutare la vita o tradire la propria natura significa offrire un’anima al Kraken. Il suo culto è guidato dalla prescelta Illaoi, Portatrice della Verità.',
    temple:
      'Templi sul mare, piattaforme di legno e pietra affacciate sulle baie delle Isole del Serpente.',
    rituals:
      'Prove di forza e volontà, offerte di pesce e sale, danze con maschere tentacolari durante le maree.',
    followers:
      'Gli isolani delle Isole del Serpente, i marinai di Bilgewater e chi crede che la vita vada afferrata, non attesa.'
  },
  {
    name: 'Diana',
    group: 'ASPETTI',
    img: '/images/pantheon-1786699269045.jpg#82,55',
    epithet: 'Aspetto della Luna',
    alignment: 'Caotico Neutrale',
    spheres: 'Conoscenza, Luce',
    symbol: 'Tutte le fasi della Luna',
    quote: 'I am the light coursing in the soul of the moon. — Diana',
    personality:
      'Diana è l’Aspetto della Luna e la guida dei Lunari, il culto che insegnava l’equilibrio tra Sole e Luna prima di essere soppresso dai Solari. Porta la luce fredda delle notti e la verità che le ombre rivelano: chi la segue non cerca il perdono del giorno, ma la giustizia che solo la notte sa vedere.',
    temple:
      'Templi lunari nascosti tra le montagne di Targon, aperti solo dopo il tramonto.',
    rituals:
      'Veglie notturne, letture delle fasi lunari, offerte di argento e acqua raccolta sotto la luna piena.',
    followers:
      'I Lunari, gli emarginati di Targon e chi è stato giudicato dal Sole senza essere ascoltato.'
  },
  {
    name: 'Kayle',
    img: '/images/pantheon-1786699288164.jpg#59,77',
    epithet: 'La Giusta',
    alignment: 'Legale Neutrale',
    spheres: 'Luce',
    symbol: 'Spada fiammeggiante',
    quote: 'No human is perfect. But I am not a human. — Kayle',
    personality:
      'Kayle è l’Aspetto della Giustizia: la lama che separa il colpevole dall’innocente senza concedere sfumature. La sua fede è severa e luminosa, e non ammette che la legge venga piegata all’affetto o al sangue. A Demacia il suo nome è invocato nei tribunali e sui campi di battaglia, dove la sua spada è insieme condanna e protezione.',
    temple:
      'Cattedrali e tribunali demaciani, santuari di luce bianca sulle alture di Targon.',
    rituals:
      'Giuramenti pubblici, processi, offerte di lame e candele che restano accese finché una sentenza non è pronunciata.',
    followers:
      'Magistrati, soldati demaciani, giudici e chi crede che la legge debba essere uguale per tutti.'
  },
  {
    name: 'Leona',
    img: '/images/pantheon-1786699303812.jpg#82,80',
    epithet: 'L’Alba Radiosa',
    alignment: 'Legale Neutrale',
    spheres: 'Luce, Guerra',
    symbol: 'Sole con raggi',
    quote: 'By the light of the Sun, the world is beheld. — Leona',
    personality:
      'Leona è l’Aspetto del Sole e la guida dei Solari, la setta di Rakkoriani che ha deposto le armi per consacrarsi alla luce. Porta lo scudo dell’alba e il calore che fa crescere i raccolti, ma anche l’accecante certezza di chi non conosce ombra. Il suo compito è proteggere gli indifesi e gli innocenti, non piegare la luce al proprio volere.',
    temple:
      'Templi solari sul Monte Targon, terrazze di pietra chiara orientate verso est.',
    rituals:
      'Preghiere all’alba, offerte di grano e miele, processioni con scudi lucidati fino a riflettere il sole.',
    followers:
      'I Solari, i contadini delle terre alte e chi cerca protezione sotto la luce del giorno.'
  },
  {
    name: 'Pantheon',
    img: '/images/pantheon-1786699319347.jpg',
    epithet: 'La Lancia di Targon',
    alignment: 'Legale Neutrale',
    spheres: 'Guerra',
    symbol: 'Scudo e lancia',
    quote: 'Here is my eternity… a day the gods will remember! — Pantheon',
    personality:
      'Pantheon è l’Aspetto della Guerra, ma anche il mortale che ha scelto di portarne il peso senza esserne consumato. La sua lancia non promette vittoria: promette che qualcuno combatterà. È il patrono di chi resta in piedi quando ogni dio ha già voltato le spalle, e la sua furia è tanto più temibile perché è umana.',
    temple:
      'Arene, campi di addestramento e santuari di Targon dove le armi sono lasciate in offerta.',
    rituals:
      'Duelli rituali, giuramenti prima della battaglia, offerte di lance spezzate e racconti dei caduti.',
    followers:
      'Guerrieri, mercenari, soldati e chi ha giurato di non inginocchiarsi più.'
  },
  {
    name: 'Taric',
    img: '/images/pantheon-1786699333372.jpg#89,97',
    epithet: 'Lo Scudo di Valoran',
    alignment: 'Legale Buono',
    spheres: 'Luce',
    symbol: 'Scudo incastonato di gemme',
    quote: 'The best weapon is the one you never have to draw.',
    personality:
      'Taric è l’Aspetto del Protettore: un guardiano che ha scelto la difesa invece della conquista. La sua luce non acceca, riscalda; il suo scudo non separa, custodisce. Cerca la bellezza nelle gemme e nelle persone, e crede che proteggere qualcuno sia il modo più alto di onorare la vita.',
    temple:
      'Santuari di Targon dedicati ai viaggiatori, ospizi e cappelle lungo le rotte di montagna.',
    rituals:
      'Benedizioni dei viaggi, offerte di gemme e pietre levigate, veglie per chi è lontano da casa.',
    followers:
      'Guardiani, viaggiatori, artigiani e chi preferisce difendere a oltranza invece di attaccare per primo.'
  },
  {
    name: 'Zoe',
    img: '/images/pantheon-1786699376741.jpg',
    epithet: 'Aspetto del Crepuscolo',
    alignment: 'Caotico Neutrale',
    spheres: 'Inganno',
    symbol: 'Spirale racchiusa in un cerchio',
    quote: 'The universe is a joke, and I’m the punchline.',
    personality:
      'Zoe è l’Aspetto del Crepuscolo e la messaggera degli Aspetti: una bambina eterna che gioca con il destino come con una palla di stelle. Il suo potere è immenso, la sua attenzione fugace. Porta notizie che cambiano il corso delle guerre e lo fa con l’allegria di chi non ha mai imparato a temere le conseguenze.',
    temple:
      'Santuari di Targon dedicati ai messaggeri, torri astronomiche e sentieri di montagna segnati da spirali.',
    rituals:
      'Offerte di stelle dipinte, sciarpe lasciate al vento, giochi e indovinelli invece di preghiere solenni.',
    followers:
      'Viaggiatori, bambini, messaggeri e chi crede che il caso sia una forma di saggezza.'
  },
  {
    name: 'A.A.K.',
    group: 'DEMONI',
    img: '/images/pantheon-1786803763746.jpg#52,47',
    epithet: 'Akana, Azakana, Kanmei: Demoni e spiriti minori',
    alignment: 'Neutrale Malvagio',
    spheres: 'Natura',
    symbol: 'Maschere demoniache',
    quote: '',
    personality:
      'A.A.K. non è una singola entità ma il nome che gli studiosi danno a una famiglia di spiriti minori: Akana, Azakana e Kanmei. Sono parassiti emotivi, tentatori e custodi di piccoli vizi, abbastanza deboli da non avere un culto proprio e abbastanza diffusi da avere un nome in ogni villaggio. Le loro maschere cambiano forma con la paura di chi le guarda.',
    temple:
      'Nessun tempio ufficiale: altari domestici, maschere appese alle porte e piccoli santuari ai margini dei campi.',
    rituals:
      'Offerte di sale, riso e nomi sussurrati; le maschere vengono bruciate quando un villaggio vuole liberarsi di uno spirito.',
    followers:
      'Contadini ioniani, esorcisti e culti minori che cercano un patto con poteri più grandi di loro.'
  },
  {
    name: 'Evelynn',
    img: '/images/pantheon-1786803978307.jpg#53,29',
    epithet: 'Il Demone dell’Agonia',
    alignment: 'Caotico Malvagio',
    spheres: 'Inganno',
    symbol: 'Maschere demoniache',
    quote: 'What are you doing tonight? How about we get together and unlock that vast well of torment inside you? — Evelynn',
    personality:
      'Evelynn è il demone della beatitudine e dell’agonia: si nutre del dolore che si nasconde dietro il piacere. Cambia forma per attirare le vittime, offre ciò che desiderano e poi ne assapora la disperazione. Non ha bisogno di un culto: le bastano una città, una notte e qualcuno disposto a fidarsi.',
    temple:
      'Nessun tempio riconosciuto; salotti, case di piacere e stanze private dove la sofferenza viene offerta come spettacolo.',
    rituals:
      'Patto individuale, offerte di segreti e ricordi dolorosi, giochi di seduzione che finiscono male.',
    followers:
      'Culti di piacere e crudeltà, individui disposti a offrire il dolore altrui in cambio di potere.'
  },
  {
    name: 'Fiddlesticks',
    img: '/images/pantheon-1786805263924.jpg#54,35',
    epithet: 'La Paura Primordiale',
    alignment: 'Caotico Malvagio',
    spheres: 'Inganno',
    symbol: 'Spaventapasseri',
    quote: 'It’s hunting us. It knows what we’re afraid of. — Vittima sconosciuta',
    personality:
      'Fiddlesticks è uno dei Dieci Primali, il demone nato dalla paura prima che i mortali avessero un nome per chiamarla. Non parla: imita. Prende la voce di chi hai amato, il volto di chi hai perduto, il suono di passi che si avvicinano nel buio. Chi lo incontra non muore di ferite, ma di terrore.',
    temple:
      'Nessun tempio: campi abbandonati, granai vuoti e spaventapasseri lasciati dove la paura è più forte.',
    rituals:
      'Offerte di paglia e stracci, nomi scritti su foglie, veglie per non essere chiamati per nome.',
    followers:
      'Folli, cultisti isolati e chi spera di sopravvivere offrendo qualcun altro al suo posto.'
  },
  {
    name: 'Raum',
    img: '/images/pantheon-1786805603523.jpg#59,55',
    epithet: 'Il Demone dei Segreti',
    alignment: 'Legale Malvagio',
    spheres: 'Conoscenza, Inganno',
    symbol: 'Corvo nero',
    quote: '...Cra Cra... — Sconosciuto',
    personality:
      'Raum colleziona segreti come altri collezionano monete. Conosce il valore di una confessione, di un tradimento, di un nome pronunciato troppo forte; per questo i suoi seguaci imparano a parlare piano e a scrivere tutto. Non mente quasi mai: la verità, dosata nel momento giusto, è un’arma più affilata.',
    temple:
      'Archivi clandestini, logge e stanze senza finestre dove i documenti valgono più dell’oro.',
    rituals:
      'Scambio di segreti, contratti scritti, offerte di lettere e nomi cancellati.',
    followers:
      'Spie, studiosi senza scrupoli, nobili e chiunque venda informazioni come merce.'
  },
  {
    name: 'Tahm Kench',
    img: '/images/pantheon-1786804945772.jpg#52,24',
    epithet: 'Il Demone della Dipendenza',
    alignment: 'Legale Malvagio',
    spheres: 'Inganno',
    symbol: 'Pesce gatto inciso su una moneta d’oro',
    quote: 'Boy, the whole world’s a river, and I’m its king. — Tahm Kench',
    personality:
      'Tahm Kench è il Re del Fiume, il demone della dipendenza. Non prende con la forza: offre un favore, un prestito, una seconda possibilità. Poi aspetta. Ogni debito non saldato lo nutre, ogni promessa rimandata lo rende più forte. È gentile, paziente e affamato, e il suo fiume passa per ogni città.',
    temple:
      'Tavern, banchi da gioco e banchine dove si firmano contratti senza leggere le clausole.',
    rituals:
      'Scommesse, debiti, offerte di monete e promesse pronunciate ad alta voce.',
    followers:
      'Giocatori d’azzardo, usurai, disperati e chi ha già venduto troppo di sé.'
  },
  {
    name: 'Nocturne',
    img: '',
    epithet: 'Il Demone degli Incubi',
    alignment: 'Caotico Malvagio',
    spheres: 'Inganno',
    symbol: 'Due segni di artigli orizzontali',
    quote: '',
    personality:
      'Nocturne è il demone che vive negli incubi: non una paura precisa, ma l’ombra che le tiene insieme. Attraversa i sogni come un predatore attraversa la foresta, e chi si sveglia con il suo marchio non è mai del tutto certo di essersi svegliato. Non ha un culto: ha vittime che non osano dormire.',
    temple:
      'Nessun tempio; case in cui nessuno dorme, dormitori abbandonati e stanze con le finestre murate.',
    rituals:
      'Offerte di sale sotto il cuscino, nomi scritti a rovescio e veglie per non essere trovati nel sonno.',
    followers:
      'Culti notturni, individui tormentati e chi cerca di usare gli incubi come arma.'
  }
];

export const REGIONAL_SECTIONS = [
  {
    title: 'Pantheon del Freljord',
    body: `Nel Freljord vengono venerati numerosi spiriti e semidei. Sono figure primordiali, antropomorfe o animali, e ciascuna rappresenta uno o più fenomeni o concetti fondamentali. Le più note sono Anivia, Ornn e Volibear; accanto a loro il popolo del nord onora entità minori che raramente compaiono nei libri del sud.

## Daugir, il Dio-Cinghiale

(Solidarietà, Forza, Guerra) Lo spirito instancabile del popolo freljordiano trova la sua fonte nel culto del dio cinghiale. Adornato con armature di legno e cuoio, lunghe zanne e occhi azzurri che fendono la neve, Daugir viene invocato per ottenere potere e onore nelle dispute, nei duelli e in ogni momento in cui è richiesta giustizia.

## Zelaya, la Sorella-Sigillo

(Arcano, Tempesta, Inganno) Dormiente per secoli, la Sorella-Sigillo è l’Ingannatrice del Freljord, dotata di poteri di negromanzia e magia illusoria. Zelaya mette alla prova la civiltà, valutando se sia degna di risvegliare i suoi fratelli dormienti… o se invece debbano continuare il loro sonno eterno.`
  },
  {
    title: 'Pantheon di Demacia',
    body: `A Demacia la fede ufficiale è quella delle Sorelle della Giustizia: due entità conosciute come la Protettrice e la Velata. La prima rappresenta la nazione stessa e ha ispirato le sue leggi, tradizioni e politiche; la seconda incarna la misericordia e l’espiazione, ma anche il mistero e il giudizio. I demaciani pregano per il passaggio sicuro dei defunti poco dopo la morte.

## Cuore della Foresta

(Vita, Natura, Protezione) Armato di due enormi scudi di corteccia, il Cuore della Foresta assume una forma titanica. È invocato per un buon raccolto, da chi cerca la magia delle foreste e da chi desidera stabilità e forza. Il suo culto è diffuso soprattutto nelle città demaciane di Trevale, Fossbarrow, Cloudfield e Uwendale.

## Bestia in Catene

(Sangue, Tempesta, Guerra) Pronunciato in preghiere sussurrate da marinai, criminali e da chi cerca potere attraverso il sangue, Bestia in Catene è un dio invocato solo in piccole dosi: il suo potere corrompe rapidamente e in modo assoluto se abusato. A Bilgewater è venerato dai marinai per sicurezza e potere sul mare; a Noxus alcuni seguaci credono di poterlo liberare temporaneamente e incanalarlo attraverso sé stessi.

## Madre del Cielo

(Luce, Forza, Tempesta) La Madre del Cielo è una donna dall’aspetto aviano, con enormi ali bianche che emanano una luce brillante come un giorno di sole. È invocata dai cavalieri dei rapaci demaciani per cieli sicuri, da chi cerca viaggi o comunicazioni rapide e dagli arcieri. Aquiloni e velieri sono simboli comuni del suo culto, e i falconieri sono spesso anche suoi chierici.`
  },
  {
    title: 'Pantheon di Targon',
    body: `Targon possiede un intero pantheon di divinità la cui influenza ha plasmato religioni, ideologie e leggende. Sei archetipi sono particolarmente venerati: Imperatrice, Guida, Protettore, Ingannatore, Custode e Guerriero. Le loro storie sono raccontate più come ideali che come biografie, e i mortali che li servono spesso cercano di incarnarne il modello.

## Lunari

Il culto della Luna insegnava che il mondo necessitava di un equilibrio tra Sole e Luna per vivere e prosperare. È stato soppresso dalla storia, molto probabilmente per mano dei Solari. Il ritorno dei Lunari potrebbe avverarsi attraverso la crociata condotta da Diana, il Disprezzo della Luna, considerata un’emarginata dagli stessi Solari.

## Solari

Il culto del Sole come fonte di tutta la vita. La fede solare è praticata principalmente da una setta di Rakkoriani che hanno deposto le armi per una devozione totale. Il loro fondatore scelse Targon, la vetta più alta e più vicina al Sole, e fu benedetto con il potere di placare l’ira solare. Oggi Leona, l’Alba Radiosa, ha assunto le insegne di quella leggenda e combatte per proteggere gli indifesi.`
  },
  {
    title: 'Pantheon di Shurima',
    body: `Gli dèi egiziani si sono pienamente integrati ad Aetherion, sebbene non esclusivamente in quel mondo. Anche altri pantheon esistono all’interno delle mura di Shurima: solo gli studiosi religiosi più devoti, fuori dai confini del regno, conoscono persino la loro esistenza.

## La Grande Tessitrice

Dea del destino, la Grande Tessitrice è venerata dagli shurimani che vivono e muoiono come viaggiatori, confidando nella sua guida. Si dice che intrecci i fili di ogni vita in un arazzo del fato, determinando ciò che è stato, ciò che è e ciò che sarà. Taliyah, la Tessimassi, è ritenuta dai suoi anziani una prescelta.

## Il Quickdeath

(Sangue, Morte, Inganno) Raramente discusso al di fuori di caverne nascoste, il Quickdeath è un antico ibrido umano-scorpione asceso allo status divino dopo aver eliminato il precedente dio dei veleni. Viene invocato per assassinii, veleni di ogni tipo e sotterfugi silenziosi.`
  },
  {
    title: 'Pantheon di Bilgewater',
    body: `Bilgewater è un crogiolo di culture, e la religione non fa eccezione: qui si venerano divinità provenienti da tutta Aetherion, insieme ad alcune proprie.

## Arasil

(Morte, Inganno, Crepuscolo) Spesso raffigurato come un giovane che stringe solo un coltello e una candela, Arasil è venerato a Bilgewater per l’acutezza delle lame e la sicurezza nelle ombre. I bambini vengono messi in guardia dal vagare di notte lungo le coste, con storie di Arasil che intaglia giocattoli smarriti.

## Il Corvo

(Sangue, Morte, Guerra) Divinità minore, sebbene i suoi fedeli siano ben consapevoli che dietro i miti si cela una creatura reale. È raffigurato come un essere oscuro e alato, con cannoni, arpioni e bocche da fuoco che emergono da neri pennacchi di piume. Pistoleri, giocatori d’azzardo, pirati e assassini pregano il Corvo per precisione, mano ferma e la capacità di vedere attraverso le illusioni.

## Il Serpente Madre

(Vita, Tempesta, Inganno) Dea del movimento, Nagakabouros, originaria delle Isole del Serpente, è conosciuta anche come la Signora della Fiamma Blu. Rimane la divinità dominante a Bilgewater; il suo culto è guidato dalla prescelta Illaoi, Portatrice della Verità. La religione enfatizza l’idea di seguire i propri desideri e forgiare il proprio destino.`
  },
  {
    title: 'Culti e ordini',
    body: `## Chiesa della Gloriosa Evoluzione

(Arcano, Sangue, Conoscenza) La Chiesa è celebrata sia a Piltover sia a Zaun. La Gloriosa Evoluzione considera la carne inferiore all’acciaio e al metallo, e ha raccolto la maggior parte dei suoi seguaci tra il popolo di Zaun. Le sue opere sono contraddistinte dall’amalgama tra carne e sostituzioni metalliche totali; finché esisteranno, il giorno in cui il mondo verrà rimpiazzato da esseri di acciaio e metallo militarizzati diventa ogni giorno più vicino. La Chiesa ha raccolto frammenti della filosofia di Viktor e lo considera una figura messianica, sebbene Viktor stesso veda questo culto come un’aberrazione.

## Culto delle Tre Sorelle

(Legale Malvagio; Conoscenza, Inganno) Simbolo: tre donne racchiuse in un diamante. Le Tre Sorelle sono Avarosa, Serylda e Lissandra: un culto del nord che intreccia memoria, ghiaccio e potere, e che non dimentica nessuno dei debiti contratti tra le sue fondatrici.

## Culto del Vuoto

(Caotico Malvagio; Conoscenza, Guerra) Simbolo: occhio violaceo. Guidato da Malzahar, il Profeta del Vuoto, il culto non prega una divinità ma ascolta una fame che divora materia e identità. I suoi membri cercano crepe nel mondo e le allargano.

## Discepoli dell’Armadillo

(Neutrale Puro; Natura) Simbolo: guscio di tartaruga. Seguaci e adoratori di Rammus, l’Armadillo, ne venerano la resistenza e la capacità di rotolare attraverso i pericoli senza spezzarsi.

## Vilemaw

Culto del Ragno. La maggior parte dei seguaci si trova tra Noxus e Demacia. La campionessa Elise funge da Somma Sacerdotessa, viaggiando tra le due nazioni e le Isole Ombra, conducendo i fedeli a vivere per l’eternità al servizio del Dio Ragno Vilemaw… o almeno così credono.`
  }
];
