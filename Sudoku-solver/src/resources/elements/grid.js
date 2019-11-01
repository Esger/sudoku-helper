export class GridCustomElement {


    constructor() {
        this.grid = [];
        this.possibles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }

    attached() {
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({ possibles: this.possibles.slice(), value: 0 });
            }
            this.grid.push(row);
        }
    }

    applyGridNumber(row, cell, number) {
        this.grid[row][cell].value = number;
    }

    selectNumber(row, cell, number) {
        this.applyGridNumber(row, cell, number);
        console.log(...arguments);
    }
}