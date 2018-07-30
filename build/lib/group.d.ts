import { IPSODevice } from "./ipsoDevice";
import { Scene } from "./scene";
export interface GroupInfo {
    group: Group;
    scenes: Record<string, Scene>;
}
export declare class Group extends IPSODevice {
    onOff: boolean;
    dimmer: number;
    sceneId: number;
    deviceIDs: number[];
    transitionTime: number;
    /**
     * Ensures this instance is linked to a tradfri client and an accessory
     * @throws Throws an error if it isn't
     */
    private ensureLink;
    /** Turn all lightbulbs on */
    turnOn(): Promise<boolean>;
    /** Turn all lightbulbs off */
    turnOff(): Promise<boolean>;
    /** Set all lightbulbs on/off to the given state */
    toggle(value: boolean): Promise<boolean>;
    /** Activates the given scene */
    activateScene(sceneOrId: Scene | number): Promise<boolean>;
    private operateGroup;
    /**
     * Changes this lightbulb's brightness
     * @returns true if a request was sent, false otherwise
     */
    setBrightness(value: number, transitionTime?: number): Promise<boolean>;
}
export declare type GroupOperation = Partial<Pick<Group, "onOff" | "dimmer" | "sceneId" | "transitionTime">>;
