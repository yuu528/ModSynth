import JackType from '../../enum/JackType'

export default interface Jack {
	id: string
	name: string
	type: JackType

	index?: number
}
