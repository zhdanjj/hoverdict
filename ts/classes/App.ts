import {WordHighlighter} from "./WordHighlighter";

export class App {
    wordHighlighter: WordHighlighter;
    constructor() {
        this.wordHighlighter = new WordHighlighter;
    }
    init() {
        alert('ts here');
    }
}
