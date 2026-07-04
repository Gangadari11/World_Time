type PagePlaceholderProps = {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="rounded-xl border bg-card p-8 text-card-foreground shadow-xs">
        <p className="text-sm text-muted-foreground">
          Content for this module will be added here.
        </p>
      </div>
    </section>
  )
}
