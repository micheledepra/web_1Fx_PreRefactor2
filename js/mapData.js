// Map data structure
const mapData = {
    continents: {
        'north-america': {
            name: 'North America',
            captureBonus: 5,
            territories: ['alaska', 'northwest territory', 'greenland', 'alberta', 'ontario', 'quebec', 'western united states', 'eastern united states', 'central america']
        },
        'south-america': {
            name: 'South America', 
            captureBonus: 2,
            territories: ['venezuela', 'brazil', 'peru', 'argentina']
        },
        'europe': {
            name: 'Europe',
            captureBonus: 5,
            territories: ['iceland', 'scandinavia', 'ukraine', 'great britain', 'northern europe', 'southern europe', 'western europe']
        },
        'africa': {
            name: 'Africa',
            captureBonus: 3,
            territories: ['north africa', 'egypt', 'east africa', 'congo', 'south africa', 'madagascar']
        },
        'asia': {
            name: 'Asia',
            captureBonus: 7,
            territories: ['ural', 'siberia', 'yakutsk', 'kamchatka', 'irkutsk', 'afghanistan', 'china', 'mongolia', 'japan', 'middle east', 'india', 'siam']
        },
        'australia': {
            name: 'Australia',
            captureBonus: 2,
            territories: ['indonesia', 'new guinea', 'western australia', 'eastern australia']
        }
    },
    territories: {
        // North America
        'alaska': { neighbors: ['northwest territory', 'alberta', 'kamchatka'] },
        'northwest territory': { neighbors: ['alaska', 'alberta', 'ontario', 'greenland'] },
        'greenland': { neighbors: ['northwest territory', 'ontario', 'quebec', 'iceland'] },
        'alberta': { neighbors: ['alaska', 'northwest territory', 'ontario', 'western united states'] },
        'ontario': { neighbors: ['northwest territory', 'alberta', 'quebec', 'western united states', 'eastern united states'] },
        'quebec': { neighbors: ['ontario', 'greenland', 'eastern united states'] },
        'western united states': { neighbors: ['alberta', 'ontario', 'eastern united states', 'central america'] },
        'eastern united states': { neighbors: ['quebec', 'ontario', 'western united states', 'central america'] },
        'central america': { neighbors: ['western united states', 'eastern united states', 'venezuela'] },
        
        // South America
        'venezuela': { neighbors: ['central america', 'peru', 'brazil'] },
        'peru': { neighbors: ['venezuela', 'brazil', 'argentina'] },
        'brazil': { neighbors: ['venezuela', 'peru', 'argentina', 'north africa'] },
        'argentina': { neighbors: ['peru', 'brazil'] },
        
        // Europe
        'iceland': { neighbors: ['greenland', 'great britain', 'scandinavia'] },
        'great britain': { neighbors: ['iceland', 'scandinavia', 'northern europe', 'western europe'] },
        'western europe': { neighbors: ['great britain', 'northern europe', 'southern europe', 'north africa'] },
        'scandinavia': { neighbors: ['iceland', 'great britain', 'northern europe', 'ukraine'] },
        'northern europe': { neighbors: ['great britain', 'scandinavia', 'ukraine', 'southern europe', 'western europe'] },
        'southern europe': { neighbors: ['western europe', 'northern europe', 'ukraine', 'middle east', 'egypt', 'north africa'] },
        'ukraine': { neighbors: ['scandinavia', 'ural', 'afghanistan', 'middle east', 'southern europe', 'northern europe'] },
        
        // Africa
        'north africa': { neighbors: ['brazil', 'western europe', 'southern europe', 'egypt', 'east africa', 'congo'] },
        'egypt': { neighbors: ['north africa', 'southern europe', 'middle east', 'east africa'] },
        'congo': { neighbors: ['north africa', 'east africa', 'south africa'] },
        'east africa': { neighbors: ['egypt', 'middle east', 'madagascar', 'south africa', 'congo', 'north africa'] },
        'south africa': { neighbors: ['congo', 'east africa', 'madagascar'] },
        'madagascar': { neighbors: ['east africa', 'south africa'] },
        
        // Asia
        'ural': { neighbors: ['ukraine', 'siberia', 'afghanistan', 'china'] },
        'siberia': { neighbors: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'] },
        'yakutsk': { neighbors: ['siberia', 'kamchatka', 'irkutsk'] },
        'kamchatka': { neighbors: ['yakutsk', 'irkutsk', 'mongolia', 'japan', 'alaska'] },
        'irkutsk': { neighbors: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'] },
        'afghanistan': { neighbors: ['ukraine', 'ural', 'china', 'india', 'middle east'] },
        'china': { neighbors: ['ural', 'siberia', 'mongolia', 'siam', 'india', 'afghanistan'] },
        'mongolia': { neighbors: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'] },
        'japan': { neighbors: ['kamchatka', 'mongolia'] },
        'middle east': { neighbors: ['ukraine', 'afghanistan', 'india', 'east africa', 'egypt', 'southern europe'] },
        'india': { neighbors: ['afghanistan', 'china', 'siam', 'middle east'] },
        'siam': { neighbors: ['india', 'china', 'indonesia'] },
        
        // Australia
        'indonesia': { neighbors: ['siam', 'new guinea', 'western australia'] },
        'new guinea': { neighbors: ['indonesia', 'western australia', 'eastern australia'] },
        'western australia': { neighbors: ['indonesia', 'new guinea', 'eastern australia'] },
        'eastern australia': { neighbors: ['western australia', 'new guinea'] }
    }
};
