var HB_SUBCLASS_DB_ID = '2f70274fdc1c803ca5cafa97ca1817cd';

// Questa è la funzione principale che devi chiamare
window.loadSubclassGallery = function(container) {
    container.innerHTML = '<div class="loader-dots"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div>';

    fetch('/api/notion?dbId=' + HB_SUBCLASS_DB_ID)
        .then(r => r.json())
        .then(data => {
            _renderHbLayout(container, data.pages || []);
        })
        .catch(err => {
            container.innerHTML = '<p class="sec-p">Errore nel risveglio delle pergamene.</p>';
            console.error(err);
        });
};

function _renderHbLayout(container, pages) {
    // 1. Creiamo la struttura Wiki (Sidebar + Griglia)
    container.innerHTML = `
        <div class="wiki-layout">
            <aside class="wiki-sidebar">
                <div class="sidebar-label">Filtra Classi</div>
                <ul id="class-filter">
                    <li class="f-item active" data-class="all">Tutte</li>
                    <li class="f-item" data-class="Guerriero">Guerriero</li>
                    <li class="f-item" data-class="Mago">Mago</li>
                    <li class="f-item" data-class="Ladro">Ladro</li>
                    <li class="f-item" data-class="Chierico">Chierico</li>
                    <li class="f-item" data-class="Barbaro">Barbaro</li>
                    <li class="f-item" data-class="Bardo">Bardo</li>
                    <li class="f-item" data-class="Druido">Druido</li>
                    <li class="f-item" data-class="Monaco">Monaco</li>
                    <li class="f-item" data-class="Paladino">Paladino</li>
                    <li class="f-item" data-class="Ranger">Ranger</li>
                    <li class="f-item" data-class="Stregone">Stregone</li>
                    <li class="f-item" data-class="Warlock">Warlock</li>
                </ul>
            </aside>
            <main class="dnd-grid" id="hb-gallery-grid">
                </main>
        </div>
    `;

    const grid = document.getElementById('hb-gallery-grid');

    // 2. Generiamo le card nere (lcard)
    pages.forEach(p => {
        const classe = p.classe || 'Generica';
        const card = document.createElement('div');
        card.className = 'lcard fade-in';
        card.setAttribute('data-class', classe);
        card.innerHTML = `
            <div class="lcard-body">
                <div class="lcard-meta">${classe}</div>
                <div class="lcard-title">${p.title}</div>
            </div>
        `;
        // Usa la tua funzione gp() per aprire la pagina della sottoclasse
        card.onclick = () => window.gp(p.id, p.title, p.icon?.emoji || '📜');
        grid.appendChild(card);
    });

    // 3. Colleghiamo i filtri della sidebar
    document.querySelectorAll('.f-item').forEach(btn => {
        btn.onclick = function() {
            const filter = this.getAttribute('data-class');
            
            // UI Update: sposta la classe active
            document.querySelectorAll('.f-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Nascondi/Mostra le card
            document.querySelectorAll('.lcard').forEach(card => {
                const cardClass = card.getAttribute('data-class');
                card.style.display = (filter === 'all' || cardClass === filter) ? 'flex' : 'none';
            });
        };
    });
}
