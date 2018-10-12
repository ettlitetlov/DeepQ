class qAgent{
    constructor(currState, actions, gamma){
        this.currState = currState;
        this.actions = actions;
        this.gamma = gamma;
        this.policy = [];
    }

    get state(){
        return this.currState;
    }

    transition(action){

    }

} 
module.exports = qAgent;
