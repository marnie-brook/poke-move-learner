import * as dex from './resources/pokemon.json';
import { Database, IPokemon, BreedChain } from './database';

function collectBreedChain(chain: BreedChain,
    path?: Array<string>,
    carry?: Array<Array<string>>
): Array<Array<string>> {
    const source = chain.source;
    const route = (path || []);
    const acc = carry || [];
    for (const p of chain.level) {
        acc.push([
            ...route,
            `${source.name} (Chain Breeding)`,
            `${p.name} (Level Up)`
        ]);
    }
    for (const p of chain.tm) {
        acc.push([
            ...route,
            `${source.name} (Chain Breeding)`,
            `${p.name} (TM)`
        ]);
    }
    for (const p of chain.tr) {
        acc.push([
            ...route,
            `${source.name} (Chain Breeding)`,
            `${p.name} (TR)`
        ]);
    }
    for (const p of chain.tutor) {
        acc.push([
            ...route,
            `${source.name} (Chain Breeding)`,
            `${p.name} (Move Tutor)`
        ]);
    }
    const chains = chain.chain.reduce(
        (carry, c) => collectBreedChain(
            c,
            route.concat(
                `${source.name} (Chain Breeding)`
            ),
            carry
        ),
        acc
    );
    return acc;
}

function displayBreedChainInfo(chain: BreedChain, move: string) {
    for (const x of collectBreedChain(chain)) {
        console.log(x.reverse().join(' -> '));
    }
}

function main(args: Array<string>) {
    const db = Database.create(dex as Array<IPokemon>);
    const pk = db.find(args[0]);
    if (pk === null) {
        console.error(`Could not find pokemon ${args[0]}`);
        return;
    }
    const move = args[1];
    if (!pk.learnsMove(move)) {
        console.error(`Pokemon ${args[0]} does not learn move ${move}`);
        return;
    }
    let requiresChain = true;
    if (pk.learnsMoveFromLevelUp(move)) {
        console.log(`${pk.name} (Level Up)`);
        requiresChain = false;
    }
    if (pk.learnsMoveFromTm(move)) {
        console.log(`${pk.name} (TM)`);
        requiresChain = false;
    }
    if (pk.learnsMoveFromTr(move)) {
        console.log(`${pk.name} (TR)`);
        requiresChain = false;
    }
    if (pk.learnsMoveFromTutor(move)) {
        console.log(`${pk.name} (Move Tutor)`);
        requiresChain = false;
    }
    if (!requiresChain) {
        return;
    }
    const breedChain = db.calculateBreedChain(pk, move);
    displayBreedChainInfo(breedChain, move);
}

main(process.argv.slice(2));
