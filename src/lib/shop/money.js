/** Format an integer JPY amount as "¥15,000". */
export function yen(amount) {
	return '¥' + Number(amount ?? 0).toLocaleString('ja-JP');
}
