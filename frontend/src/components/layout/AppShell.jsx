import { LogOut } from 'lucide-react'

const roleLabel = (role) => {
	if (role === 'worker') {
		return 'Worker'
	}

	if (role === 'verifier') {
		return 'Verifier'
	}

	if (role === 'advocate') {
		return 'Advocate'
	}

	return 'User'
}

const AppShell = ({ title, subtitle, profile, onLogout, children }) => {
	return (
		<div className="min-h-screen bg-brand-light text-brand-darkest">
			<header className="border-b border-brand-muted/50 bg-brand-darkest text-brand-light">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
					<div>
						<p className="text-sm text-brand-muted">FairGig Dashboard</p>
						<h1 className="text-xl font-bold md:text-2xl">{title}</h1>
						{subtitle ? <p className="text-sm text-brand-light/85">{subtitle}</p> : null}
					</div>

					<div className="flex items-center gap-3">
						<div className="rounded-full border border-brand-primary bg-brand-primary/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-light">
							{roleLabel(profile?.role)}
						</div>

						<button
							type="button"
							onClick={onLogout}
							className="inline-flex items-center gap-2 rounded-md border border-brand-primary bg-brand-primary px-3 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
						>
							<LogOut size={16} aria-hidden="true" />
							Logout
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
		</div>
	)
}

export default AppShell
