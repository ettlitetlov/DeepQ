import { State } from "./state";
import { CallbackConstructorRegistry } from "@tensorflow/tfjs-layers/dist/base_callbacks";

// Class for storing a memory of state -> action -> reward
export class Memory {
    state: State
    action: string
    reward: number
    nextState: State
    done: boolean

    // Constructor
    constructor( state:State, action:string, reward:number, nextState:State, done:boolean){
        this.state = state
        this.action = action
        this.reward = reward
        this.nextState = nextState
        this.done = done
    }
}