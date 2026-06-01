const spellFixes = {
    'ver vapor': 'Verduras al Vapor',
    'espagueti': 'Espagueti'
};
const lowerCaseWords = new Set(['de', 'la', 'el', 'en', 'y', 'con', 'a', 'las', 'los', 'del', 'al', 'por', 'para']);
const sideDishKeywords = /\b(espagueti|frijoles|arroz|puré|ensalada|tortillas|salsa|totopos|verduras|sopa|crema|caldo|consomé|guacamole|chilaquiles|postre|bebida|agua|pan|galletas)\b/gi;

const fixSpelling = (text) => {
    if (!text) return text;
    let cleaned = text.trim().replace(/(?:^|\s)[-*•+]\s*/g, ' • ').trim();
    cleaned = cleaned.toLowerCase().replace(/\s+/g, ' ');
    cleaned = cleaned.replace(sideDishKeywords, (match, p1, offset, fullString) => {
        if (offset === 0) return match; 
        const before = fullString.slice(0, offset).trimRight();
        if (before.length === 0) return match;
        if (/(?:[•\/\-\+\*\,:;]|\b(?:con|de|y|en|la|el|las|los|al|del|su|o|a))\s*$/i.test(before)) {
            return match; 
        }
        return `• ${match}`;
    });
    const words = cleaned.split(' ').filter(w => w.length > 0);
    let corrected = words.map((word, index) => {
        if (word === '•') return word;
        if (index === 0 || !lowerCaseWords.has(word) || words[index - 1] === '•') {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
    }).join(' ');
    Object.keys(spellFixes).forEach(err => {
        const regex = new RegExp(`\\b${err}\\b`, 'gi');
        corrected = corrected.replace(regex, spellFixes[err]);
    });
    corrected = corrected.replace(/(?:\()?\b(\d+)\s*(?:pz|pza|pzas|piezas|uni|unidades|uds)\b(?:\))?/gi, 
        (m, num) => num === '1' ? '(1 Pza)' : `(${num} Pzas)`);
    corrected = corrected.replace(/\(\s*(\d+)\s*\)/g, 
        (m, num) => num === '1' ? '(1 Pza)' : `(${num} Pzas)`);
    return corrected.replace(/\s+•/g, ' •').replace(/•\s+/g, '• ').replace(/•/g, '• ').replace(/\s+/g, ' ').trim();
};

console.log("TESTING 1:", fixSpelling('Fajitas de Sirloin Espagueti a la Crema Puré de Papa Ensalada de Betabel Tortillas Salsa'));
console.log("TESTING 2:", fixSpelling('ver vapor'));
