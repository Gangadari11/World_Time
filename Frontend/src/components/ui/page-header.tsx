type PageHeaderProps = {
    title: string
    description: string
    actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {actions && <div>{actions}</div>}
        </header>
    )
}