import ModuleCategory from '../../enum/ModuleCategory'

import Control from './Control'
import Jack from './Jack'
import Monitor from './Monitor'
import Pos from './Pos'

export default interface ModuleData {
	id: string
	name: string
	category: ModuleCategory

	idx?: number

	controls?: Control[]
	monitors?: Monitor[]
	jacks?: Jack[]

	pos?: Pos

	input?: AudioNode
	output?: AudioNode
}
