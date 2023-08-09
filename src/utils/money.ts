export function formatMoney(amount: number): string {
	return Math.floor(amount) + ('.' + Math.floor((amount%1)*100)).padEnd(3, '0')
}