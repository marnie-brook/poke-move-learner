const siteRoot = 'https://www.serebii.net';
const siteUrl = siteRoot + '/swordshield/galarpokedex.shtml';
const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');
const path = require('path');
const output = path.resolve(__dirname, 'resources')
const fs = require('fs');

const fetchData = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
}

function harvestName($) {
    return $('title').text().split(' - #')[0];
}

function harvestEvolutionChain($) {
    var pkmn = $('.pkmn').slice(2);
    return pkmn.map(
        (i, p) => $($($(p).children()[0]).children()[0]).prop('alt')
    ).get();
}

function findTableRowWithText($, text, nodeName) {
    return $(nodeName || 'tr')
        .filter((i, x) => $(x).text() === text);
}

function harvestEggGroups($) {
    var forms = $('form')
        .filter((i, x) => $(x).attr('name') && $(x).attr('name').startsWith('breed'));
    var out = [];
    for (var i = 0; i < forms.length; i++) {
        const selection = forms.eq(i).find('select').val();
        out.push(
            forms.eq(i).find('option').filter((i, x) => $(x).attr('value') === selection).html()
        );
    }
    return out;
}

function harvestLevelMoves($) {
    var tableHeader = findTableRowWithText($, 'Standard Level Up');
    var table = tableHeader.parent();
    return table.children()
        .map((i, x) => $(x).find('a').text())
        .filter((i, x) => x !== '')
        .get();
}

function harvestTmMoves($) {
    var tableHeader = findTableRowWithText($, 'Technical Machine Attacks');
    var table = tableHeader.parent();
    return table.children()
        .map((i, x) => $(x).find('a').length === 0 ? '' : $(x).find('a').text())
        .filter((i, x) => x !== '')
        .map((i, x) => x.slice(4))
        .get();
}

function harvestTrMoves($) {
    var tableHeader = findTableRowWithText($, 'Technical Record Attacks');
    var table = tableHeader.parent();
    return table.children()
        .map((i, x) => $(x).find('a').length === 0 ? '' : $(x).find('a').text())
        .filter((i, x) => x !== '')
        .map((i, x) => x.slice(4))
        .get();
}

function harvestEggMoves($) {
    var tableHeader = $('a[name=eggmoves]');
    var table = tableHeader.parent().parent().parent();
    return table.children()
        .map((i, x) => $(x).find('a').length === 0 ? '' : $(x).find('a').first().text())
        .filter((i, x) => x !== '')
        .get()
        .slice(1);
}

function harvestTutorMoves($) {
    var tableHeader = findTableRowWithText($, 'Move Tutor Attacks');
    var table = tableHeader.parent();
    return table.children()
        .map((i, x) => $(x).find('a').length === 0 ? '' : $(x).find('a').text())
        .filter((i, x) => x !== '')
        .get();
}

function harvestPage($) {
    return {
        name: harvestName($),
        evolutionChain: harvestEvolutionChain($),
        eggGroups: harvestEggGroups($),
        levelMoves: harvestLevelMoves($),
        tmMoves: harvestTmMoves($),
        trMoves: harvestTrMoves($),
        eggMoves: harvestEggMoves($),
        tutorMoves: harvestTutorMoves($)
    };
}

async function addPageToDex(page) {
    const result = await axios.get(page);
    const $ = cheerio.load(result.data);
    return harvestPage($);
}

async function main() {
    const dexPage = await fetchData();
    const pages = dexPage('a').filter((i, el) => {
        return dexPage(el).prop('href').startsWith('/pokedex-swsh/') &&
            dexPage(el).prop('href') !== '/pokedex-swsh/' &&
            !dexPage(el).prop('href').endsWith('shtml');
    }).map((i, el) => siteRoot + dexPage(el).prop('href')).get();
    const uniquePages = _.uniq(pages);
    const entries = [];
    let index = 1;
    for (const page of uniquePages) {
        console.log(`Harvesting page #${index} ${page}...`);
        const entry = await addPageToDex(page);
        entries.push(entry);
        index++;
    }
    fs.writeFile(
        path.join(output, 'pokemon.json'),
        JSON.stringify(entries),
        (err) => {
            if (err) {
                console.error('Could not save harvested dex')
            } else {
                console.log('Dex saved succesfully');
            }
        }
    );
}

main();