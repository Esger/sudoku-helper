export class GridCustomElement {


    constructor() {
        this.grid = [];
        this._possibles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    }

    attached() {
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({ possibles: this._possibles.slice(), value: 0 });
            }
            this.grid.push(row);
        }
    }

    _applyGridvalue(row, cell, value) {
        this.grid[row][cell].value = value;
    }

    _sweepRow(row, value) {
        const theRow = this.grid[row];
        theRow.forEach(cell => {
            cell.possibles[value] = '';
        });
        this._bindingSignaler.signal('updatePossibles');
    }
    _sweepCol(col, value) { }
    _sweepBlock(row, col, value) { }

    selectNumber(row, cell, value) {
        this._applyGridvalue(row, cell, value);
        this._sweepRow(row, value);
        this._sweepCol(cell, value);
        this._sweepBlock(row, cell, value);
        console.log(...arguments);
    }
}