import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ControlsCustomElement {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.tucked = true;
        this.setupMode = true;
        this.hideTimeoutHandle = undefined;
        this.thinkingProgress = 0;
        this._addListers();
    }

    _addListers() {
        this._eventAggregator.subscribe('thinkingProgress', thinking => {
            this.thinkingProgress = thinking.progress * 5;
        });
    }

    showControls() {
        this.tucked = false;
        this.hideControls();
    }

    hideControls() {
        this.hideTimeoutHandle = setTimeout(_ => {
            this.tucked = true;
        }, 5000);
    }

    cancelHide() {
        clearTimeout(this.hideTimeoutHandle);
        this.hideControls();
    }

    resetGrid() {
        this._eventAggregator.publish('resetGrid');
    }

    toggleSetupMode() {
        this._eventAggregator.publish('toggleSetupMode', { setupMode: this.setupMode });
    }
}