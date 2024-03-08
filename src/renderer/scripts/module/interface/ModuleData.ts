import ModuleCategory from '../../enum/ModuleCategory'

import Control from './Control'
import Jack from './Jack'
import Monitor from './Monitor'

export default interface ModuleData {
	id: string
	name: string
	category: ModuleCategory
	icon: string

	idx: number

	controls: Control[]
	monitors: Monitor[]
	jacks: Jack[]
}
