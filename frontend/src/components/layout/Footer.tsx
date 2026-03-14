export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <p className="text-xs text-text-secondary">
          Who I Am v2.0 — Identity resolution on the blockchain
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://bsv.brc.dev/peer-to-peer/0068"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary hover:text-primary transition-colors"
          >
            BRC-0068
          </a>
        </div>
      </div>
    </footer>
  )
}
