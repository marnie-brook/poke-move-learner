export interface IPokemon {
    name: string;
    evolutionChain: Array<string>,
    eggGroups: Array<string>;
    levelMoves: Array<string>;
    tmMoves: Array<string>;
    trMoves: Array<string>;
    eggMoves: Array<string>;
    tutorMoves: Array<string>;
}

export class Pokemon implements IPokemon {
    constructor(
        public name: string,
        public evolutionChain: Array<string>,
        public eggGroups: Array<string>,
        public levelMoves: Array<string>,
        public tmMoves: Array<string>,
        public trMoves: Array<string>,
        public eggMoves: Array<string>,
        public tutorMoves: Array<string>
    ) {
    }

    learnsMove(move: string): boolean {
        return this.learnsMoveFromLevelUp(move) ||
            this.learnsMoveFromTm(move) ||
            this.learnsMoveFromTr(move) ||
            this.learnsMoveFromEgg(move) ||
            this.learnsMoveFromTutor(move);
    }

    learnsMoveFromLevelUp(move: string): boolean {
        return this.levelMoves.some((m) => m.toLowerCase() === move.toLowerCase());
    }

    learnsMoveFromTm(move: string): boolean {
        return this.tmMoves.some((m) => m.toLowerCase() === move.toLowerCase());
    }

    learnsMoveFromTr(move: string): boolean {
        return this.trMoves.some((m) => m.toLowerCase() === move.toLowerCase());
    }

    learnsMoveFromEgg(move: string): boolean {
        return this.eggMoves.some((m) => m.toLowerCase() === move.toLowerCase());
    }

    learnsMoveFromTutor(move: string): boolean {
        return this.tutorMoves.some((m) => m.toLowerCase() === move.toLowerCase());
    }

    static create(raw: IPokemon) {
        return new Pokemon(
            raw.name,
            raw.evolutionChain,
            raw.eggGroups,
            raw.levelMoves,
            raw.tmMoves,
            raw.trMoves,
            raw.eggMoves,
            raw.tutorMoves
        );
    }
}

export interface BreedChain {
    source: IPokemon;
    matches: number;
    level: Array<IPokemon>;
    tm: Array<IPokemon>;
    tr: Array<IPokemon>;
    tutor: Array<IPokemon>;
    chain: Array<BreedChain>;
}

export class Database {
    constructor(private pokemon: Array<Pokemon>) {
    }

    find(name: string): Pokemon|null {
        return this.pokemon.find((p) => p.name.toLowerCase() === name.toLowerCase()) || null;
    }

    calculateBreedChain(pokemon: Pokemon, move: string, covered?: Array<string>): BreedChain {
        const traversed = (covered || []).concat(pokemon.name);
        const breedables = this.pokemon.filter(
            (p) => {
                return traversed.indexOf(p.name) === -1 &&
                    p.eggGroups.some((m) => pokemon.eggGroups.indexOf(m) > -1);
            }
        );
        const learners = breedables.filter(
            (p) => p.learnsMove(move)
        );
        const levelLearners = breedables.filter(
            (p) => p.learnsMoveFromLevelUp(move)
        );
        const tmLearners = breedables.filter(
            (p) => p.learnsMoveFromTm(move)
        );
        const trLearners = breedables.filter(
            (p) => p.learnsMoveFromTr(move)
        );
        const tutorLearners = breedables.filter(
            (p) => p.learnsMoveFromTutor(move)
        );
        const chains = learners
            .filter((l) => l.learnsMoveFromEgg(move))
            .map((l) => this.calculateBreedChain(l, move, traversed.concat(...l.evolutionChain))).filter(
                (c) => c.matches > 0
            );
        const reducedChains = chains.reduce<Array<BreedChain>>(
            (carry, chain, index) => {
                const covered = chains.slice(0, index).some(
                    (c) => chain.source.evolutionChain.indexOf(c.source.name) > -1
                );
                if (!covered) {
                    carry.push(chain);
                }
                return carry;
            },
            []
        );
        return {
            source: pokemon,
            matches: levelLearners.length + tmLearners.length + trLearners.length + tutorLearners.length,
            level: levelLearners,
            tm: tmLearners,
            tr: trLearners,
            tutor: tutorLearners,
            chain: reducedChains
        };
    }

    static create(dex: Array<IPokemon>) {
        return new Database(dex.map(Pokemon.create));
    }
}
