import { BindingSignaler } from 'aurelia-templating-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, bindable } from 'aurelia-framework';
import { CandidatesService } from 'resources/services/candidates-service';

@inject(BindingSignaler, EventAggregator, CandidatesService)
export class CellCustomElement {

    @bindable row
    @bindable col
    constructor(bindingSignaler, eventAggregator, candidatesService) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._candidatesService = candidatesService;
        this._setupMode = true;
        this._reset();
    }

    bind() {
    }

    attached() {

        this._rowBlock = this._index2Block(this.row);
        this._colBlock = this._index2Block(this.col);

        this._registerCell();

        this._resetListener = this._eventAggregator.subscribe('resetGrid', _ => {
            this._reset();
        });

        this._toggleSetupModeSubscriber = this._eventAggregator.subscribe('toggleSetupMode', data => {
            this._setupMode = data.setupMode;
        });

        this._sweepselfSubscriber = this._eventAggregator.subscribe('setCellValue', data => {
            if (data.row == this.row && data.col == this.col) {
                this._applyGridvalue(data.value);
            }
        });

        this._cellValueSetSubscriber = this._eventAggregator.subscribe('cellValueSet', cell => {
            if (cell.row == this.row ||
                cell.col == this.col ||
                this._inThisBlock(cell.row, cell.col)) {
                this._removeCandidate(cell.value);
            }
        });
    }

    detached() {
        this._resetListener.dispose();
        this._toggleSetupModeSubscriber.dispose();
        this._sweepselfSubscriber.dispose();
        this._cellValueSetSubscriber.dispose();
    }

    selectCandidate(value) {
        if (this._setupMode) {
            this._applyGridvalue(value);
        } else {
            this._removeCandidate(value);
        }
    }

    _reset() {
        this.candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.value = -1;
        this._signalBindings();
    }

    _getCell() {
        return {
            value: this.value,
            row: this.row,
            col: this.col,
            rowBlock: this._rowBlock,
            colBlock: this._colBlock,
            candidates: this.candidates
        };
    }

    _registerCell() {
        this._candidatesService.registerCell(this._getCell());
    }

    _signalBindings() {
        this._bindingSignaler.signal('updateCandidates');
    }

    _index2Block(index) {
        return Math.floor(index / 3);
    }

    _inThisBlock(row, col) {
        return this._index2Block(row) == this._rowBlock &&
            this._index2Block(col) == this._colBlock;
    }

    _removeCandidate(value) {
        if (this.candidates[value] >= 0) {
            this.candidates[value] = -1;
            this._eventAggregator.publish('candidateRemoved');
            this._signalBindings();
            this._singleCandidateCheck();
        }
    }

    _applyGridvalue(value) {
        if (this.value < 0) {
            this.value = value;
            this.candidates = this.candidates.map(value => -1);
            this._eventAggregator.publish('cellValueSet', this._getCell());
        }
    }

    _singleCandidateCheck() {
        let candidates = this.candidates.filter(candidate => {
            return candidate >= 0;
        });
        if (candidates.length == 1) {
            this._applyGridvalue(candidates[0]);
        }
    }

}