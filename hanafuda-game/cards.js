// 花札の全48枚のカードデータ
const HANAFUDA_CARDS = [
    // 1月（松）
    { id: 1, month: 1, name: '松', type: 'hikari', icon: '🏮', points: 20, description: '松に鶴' },
    { id: 2, month: 1, name: '松', type: 'tan', icon: '🎋', points: 5, description: '松に赤短' },
    { id: 3, month: 1, name: '松', type: 'kasu', icon: '🌲', points: 1, description: '松のカス1' },
    { id: 4, month: 1, name: '松', type: 'kasu', icon: '🌲', points: 1, description: '松のカス2' },

    // 2月（梅）
    { id: 5, month: 2, name: '梅', type: 'tane', icon: '🐦', points: 10, description: '梅に鶯' },
    { id: 6, month: 2, name: '梅', type: 'tan', icon: '🎋', points: 5, description: '梅に赤短' },
    { id: 7, month: 2, name: '梅', type: 'kasu', icon: '🌸', points: 1, description: '梅のカス1' },
    { id: 8, month: 2, name: '梅', type: 'kasu', icon: '🌸', points: 1, description: '梅のカス2' },

    // 3月（桜）
    { id: 9, month: 3, name: '桜', type: 'hikari', icon: '🌸', points: 20, description: '桜に幕' },
    { id: 10, month: 3, name: '桜', type: 'tan', icon: '🎋', points: 5, description: '桜に赤短' },
    { id: 11, month: 3, name: '桜', type: 'kasu', icon: '🌺', points: 1, description: '桜のカス1' },
    { id: 12, month: 3, name: '桜', type: 'kasu', icon: '🌺', points: 1, description: '桜のカス2' },

    // 4月（藤）
    { id: 13, month: 4, name: '藤', type: 'tane', icon: '🐦', points: 10, description: '藤に不如帰' },
    { id: 14, month: 4, name: '藤', type: 'tan', icon: '🎋', points: 5, description: '藤に短冊' },
    { id: 15, month: 4, name: '藤', type: 'kasu', icon: '💜', points: 1, description: '藤のカス1' },
    { id: 16, month: 4, name: '藤', type: 'kasu', icon: '💜', points: 1, description: '藤のカス2' },

    // 5月（菖蒲）
    { id: 17, month: 5, name: '菖蒲', type: 'tane', icon: '🏹', points: 10, description: '菖蒲に八橋' },
    { id: 18, month: 5, name: '菖蒲', type: 'tan', icon: '🎋', points: 5, description: '菖蒲に短冊' },
    { id: 19, month: 5, name: '菖蒲', type: 'kasu', icon: '🌿', points: 1, description: '菖蒲のカス1' },
    { id: 20, month: 5, name: '菖蒲', type: 'kasu', icon: '🌿', points: 1, description: '菖蒲のカス2' },

    // 6月（牡丹）
    { id: 21, month: 6, name: '牡丹', type: 'tane', icon: '🦋', points: 10, description: '牡丹に蝶' },
    { id: 22, month: 6, name: '牡丹', type: 'tan', icon: '🎋', points: 5, description: '牡丹に青短' },
    { id: 23, month: 6, name: '牡丹', type: 'kasu', icon: '🌹', points: 1, description: '牡丹のカス1' },
    { id: 24, month: 6, name: '牡丹', type: 'kasu', icon: '🌹', points: 1, description: '牡丹のカス2' },

    // 7月（萩）
    { id: 25, month: 7, name: '萩', type: 'tane', icon: '🐗', points: 10, description: '萩に猪' },
    { id: 26, month: 7, name: '萩', type: 'tan', icon: '🎋', points: 5, description: '萩に短冊' },
    { id: 27, month: 7, name: '萩', type: 'kasu', icon: '🍂', points: 1, description: '萩のカス1' },
    { id: 28, month: 7, name: '萩', type: 'kasu', icon: '🍂', points: 1, description: '萩のカス2' },

    // 8月（芒）
    { id: 29, month: 8, name: '芒', type: 'hikari', icon: '🌕', points: 20, description: '芒に月' },
    { id: 30, month: 8, name: '芒', type: 'tane', icon: '🦆', points: 10, description: '芒に雁' },
    { id: 31, month: 8, name: '芒', type: 'kasu', icon: '🌾', points: 1, description: '芒のカス1' },
    { id: 32, month: 8, name: '芒', type: 'kasu', icon: '🌾', points: 1, description: '芒のカス2' },

    // 9月（菊）
    { id: 33, month: 9, name: '菊', type: 'tane', icon: '🍶', points: 10, description: '菊に盃' },
    { id: 34, month: 9, name: '菊', type: 'tan', icon: '🎋', points: 5, description: '菊に青短' },
    { id: 35, month: 9, name: '菊', type: 'kasu', icon: '🌼', points: 1, description: '菊のカス1' },
    { id: 36, month: 9, name: '菊', type: 'kasu', icon: '🌼', points: 1, description: '菊のカス2' },

    // 10月（紅葉）
    { id: 37, month: 10, name: '紅葉', type: 'tane', icon: '🦌', points: 10, description: '紅葉に鹿' },
    { id: 38, month: 10, name: '紅葉', type: 'tan', icon: '🎋', points: 5, description: '紅葉に青短' },
    { id: 39, month: 10, name: '紅葉', type: 'kasu', icon: '🍁', points: 1, description: '紅葉のカス1' },
    { id: 40, month: 10, name: '紅葉', type: 'kasu', icon: '🍁', points: 1, description: '紅葉のカス2' },

    // 11月（柳）
    { id: 41, month: 11, name: '柳', type: 'hikari', icon: '🌧️', points: 20, description: '柳に小野道風' },
    { id: 42, month: 11, name: '柳', type: 'tane', icon: '🐸', points: 10, description: '柳に燕' },
    { id: 43, month: 11, name: '柳', type: 'tan', icon: '🎋', points: 5, description: '柳に短冊' },
    { id: 44, month: 11, name: '柳', type: 'kasu', icon: '🌿', points: 1, description: '柳のカス' },

    // 12月（桐）
    { id: 45, month: 12, name: '桐', type: 'hikari', icon: '🦅', points: 20, description: '桐に鳳凰' },
    { id: 46, month: 12, name: '桐', type: 'kasu', icon: '🌺', points: 1, description: '桐のカス1' },
    { id: 47, month: 12, name: '桐', type: 'kasu', icon: '🌺', points: 1, description: '桐のカス2' },
    { id: 48, month: 12, name: '桐', type: 'kasu', icon: '🌺', points: 1, description: '桐のカス3' },
];

// 役の定義
const YAKU_DEFINITIONS = {
    gokou: {
        name: '五光',
        points: 15,
        check: (cards) => {
            const hikari = cards.filter(c => c.type === 'hikari');
            return hikari.length === 5 ? 15 : 0;
        }
    },
    shikou: {
        name: '四光',
        points: 10,
        check: (cards) => {
            const hikari = cards.filter(c => c.type === 'hikari');
            const hasRain = hikari.some(c => c.id === 41); // 柳の小野道風（雨）
            if (hikari.length === 4 && !hasRain) return 10;
            return 0;
        }
    },
    sankou: {
        name: '三光',
        points: 6,
        check: (cards) => {
            const hikari = cards.filter(c => c.type === 'hikari');
            const hasRain = hikari.some(c => c.id === 41);
            if (hikari.length === 3 && !hasRain) return 6;
            return 0;
        }
    },
    inoshikacho: {
        name: '猪鹿蝶',
        points: 6,
        check: (cards) => {
            const hasIno = cards.some(c => c.id === 25); // 萩に猪
            const hasShika = cards.some(c => c.id === 37); // 紅葉に鹿
            const hasCho = cards.some(c => c.id === 21); // 牡丹に蝶
            return (hasIno && hasShika && hasCho) ? 6 : 0;
        }
    },
    hanamizake: {
        name: '花見酒',
        points: 5,
        check: (cards) => {
            const hasSakura = cards.some(c => c.id === 9); // 桜に幕
            const hasSake = cards.some(c => c.id === 33); // 菊に盃
            return (hasSakura && hasSake) ? 5 : 0;
        }
    },
    tsukimizake: {
        name: '月見酒',
        points: 5,
        check: (cards) => {
            const hasMoon = cards.some(c => c.id === 29); // 芒に月
            const hasSake = cards.some(c => c.id === 33); // 菊に盃
            return (hasMoon && hasSake) ? 5 : 0;
        }
    },
    akatan: {
        name: '赤短',
        points: 6,
        check: (cards) => {
            const redTan = [2, 6, 10]; // 松、梅、桜の赤短
            const hasAll = redTan.every(id => cards.some(c => c.id === id));
            return hasAll ? 6 : 0;
        }
    },
    aotan: {
        name: '青短',
        points: 6,
        check: (cards) => {
            const blueTan = [22, 34, 38]; // 牡丹、菊、紅葉の青短
            const hasAll = blueTan.every(id => cards.some(c => c.id === id));
            return hasAll ? 6 : 0;
        }
    },
    tane: {
        name: 'タネ',
        points: 1,
        check: (cards) => {
            const taneCards = cards.filter(c => c.type === 'tane');
            return taneCards.length >= 5 ? (taneCards.length - 4) : 0;
        }
    },
    tan: {
        name: 'タン',
        points: 1,
        check: (cards) => {
            const tanCards = cards.filter(c => c.type === 'tan');
            return tanCards.length >= 5 ? (tanCards.length - 4) : 0;
        }
    },
    kasu: {
        name: 'カス',
        points: 1,
        check: (cards) => {
            const kasuCards = cards.filter(c => c.type === 'kasu');
            return kasuCards.length >= 10 ? (kasuCards.length - 9) : 0;
        }
    }
};

// カードをシャッフルする関数
function shuffleCards() {
    const cards = [...HANAFUDA_CARDS];
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

// 役を計算する関数
function calculateYaku(cards) {
    const yakuResults = [];
    let totalPoints = 0;

    for (const [key, yaku] of Object.entries(YAKU_DEFINITIONS)) {
        const points = yaku.check(cards);
        if (points > 0) {
            yakuResults.push({ name: yaku.name, points });
            totalPoints += points;
        }
    }

    return { yakuResults, totalPoints };
}
