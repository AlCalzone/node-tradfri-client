import { Accessory } from "./accessory";
import { BlindOperation } from "./blind";
import { Group, GroupOperation } from "./group";
import { LightOperation } from "./light";
import { PlugOperation } from "./plug";

export interface OperationProvider {
	operateGroup(group: Group, operation: GroupOperation, force?: boolean): Promise<boolean>;
	operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean>;
	operatePlug(accessory: Accessory, operation: PlugOperation): Promise<boolean>;
	operateBlind(accessory: Accessory, operation: BlindOperation): Promise<boolean>;
}
