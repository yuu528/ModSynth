import Component from '../../enum/Component'
import SelectItem from '../../module/interface/SelectItem'

export default interface Control {
	id: string
	name: string
	component: Component

	min?: number
	max?: number
	step?: number
	si?: boolean

	items?: SelectItem[]

	value?: number | string
	disabled?: boolean

	color?: string
	bgColor?: string

	valueLabels?: string[]
	valueUnit?: string

	elmId?: string
}
