export default interface Monitor {
	id: string
	name: string
	width: number
	height: number

	draw?: () => void
}
