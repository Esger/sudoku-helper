import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ControlsCustomElement {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.tucked = true;
    }

    showControls() {
        this.tucked = false;
        setTimeout(this.hideControls.bind(this), 2000);
    }

    hideControls() {
        this.tucked = true;
    }

    resetGrid() {
        this._eventAggregator.publish('resetGrid');
    }
}