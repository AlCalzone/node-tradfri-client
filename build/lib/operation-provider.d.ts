import { Accessory } from "./accessory";
import { Group, GroupOperation } from "./group";
import { LightOperation } from "./light";
export interface OperationProvider {
    operateGroup(group: Group, operation: GroupOperation): Promise<boolean>;
    operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean>;
}
