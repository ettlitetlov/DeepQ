class qAgent{
    constructor(currState, actions, gamma){
        this.currState = currState;
        this.actions = actions;
        this.gamma = gamma;
    }

    get state(){
        return this.currState;
    }

    transition(action){

    }

    remember(state, action, reward, nextState,done){

    }
    // Should return an action depending on the state sent in
    act(state){

    }
    // Experience replay, learn from randomized mini-batches of State->Action->reward->Next State
    replay(){

    }
} 
module.exports = qAgent;
