/** Comandi che `CodeMirrorEditor` espone alla toolbar e alla vista editor. */
export interface CodeMirrorHandle {
  focus(): void
  wrap(marker: string, placeholder?: string): void
  prefix(prefix: string): void
  insertLink(url: string): void
  insertImage(path: string, alt?: string): void
  insertSnippet(text: string): void
  replaceWikiLink(label: string, path: string): void
  undo(): void
  redo(): void
  selectedText(): string
  revealLine(line: number): void
}
