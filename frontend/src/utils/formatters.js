export const formatCurrency = (value) => {
	const number = Number(value)
	if (!Number.isFinite(number)) {
		return 'PKR 0'
	}

	return `PKR ${new Intl.NumberFormat('en-PK', {
		maximumFractionDigits: 2,
	}).format(number)}`
}

export const formatDate = (value) => {
	if (!value) {
		return '-'
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return '-'
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(parsed)
}

export const formatPercent = (value) => {
	const number = Number(value)
	if (!Number.isFinite(number)) {
		return '0.0%'
	}

	return `${number.toFixed(1)}%`
}

export const formatHourlyRate = (netReceived, hoursWorked) => {
	const net = Number(netReceived)
	const hours = Number(hoursWorked)

	if (!Number.isFinite(net) || !Number.isFinite(hours) || hours <= 0) {
		return 0
	}

	return Number((net / hours).toFixed(2))
}
