export class WordHighlighter {
    element: HTMLElement;

    readonly className: string = 'hodi-highlight';

    constructor() {
        this.element = document.createElement('div');
        this.element.className = this.className;
        document.body.appendChild(this.element);
        this.addListeners();
    }

    private addListeners() {
        document.addEventListener('scroll', this.onWindowScroll.bind(this))
        document.addEventListener('click', this.onDocumentClick.bind(this))
    }

    private onWindowScroll() {
        this.hide();
    }

    private onDocumentClick() {
        this.hide()
    }

    setPositionAndSize(rect: ClientRect) {
        this.element.style.top = rect.top + 'px';
        this.element.style.left = rect.left + 'px';
        this.element.style.width = rect.width + 'px';
        this.element.style.height = rect.height + 'px';
        return this;
    }

    hide() {
        this.element.style.display = 'none'
    }

    show() {
        this.element.style.display = 'block'
    }
}
