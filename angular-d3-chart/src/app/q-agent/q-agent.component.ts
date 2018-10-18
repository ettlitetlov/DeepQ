import { Component, OnInit, Input, OnChanges } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { State } from '../state';
import { Memory } from '../memory';
import { input } from '@tensorflow/tfjs';
import { MarketPrice } from '../market-price';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-q-agent',
  templateUrl: './q-agent.component.html',
  styleUrls: ['./q-agent.component.css']
})
export class QAgentComponent implements OnChanges {

  @Input() marketStatus: MarketPrice[];
  
  readonly size:number = 3;
  networkModel: tf.Sequential;
  prediction: any;
  currentState: State;
  memory: Memory[] = [];
  action: string;
  actionList:string[] = ["Buying","Selling","Holding"];

  // How much do we want to discount future rewards?
  gamma:number = 0.95;
  epsilon:number = 1.0;
  epsilonDecay:number = 0.995;
  epsilonMin:number = 0.03;
  episodes:number = 1000;
  readonly batchSize:number = 32;

  // Environment variables
  envCurrentStep:number;

  constructor() {}

  ngOnInit(){
    // Initialize first state
    console.log("Initializing state");
    this.currentState = new State(0,0,0,0,1500);

    this.networkModel = tf.sequential();
    this.networkModel.add(tf.layers.dense({units: 32, inputShape:[5], activation: 'relu'}));
    this.networkModel.add(tf.layers.dense({units: 32, activation: 'relu'}));
    this.networkModel.add(tf.layers.dense({units: 3, activation: 'linear'}));
    this.networkModel.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(0.06)})
  }

  ngOnChanges() {
    // Pick a random action TODO: This rate should lower as the agent gets smarter
    if(this.marketStatus){
      let decision:number = this.act();
      this.action = this.actionList[decision];
      this.envStep(decision);
    }

    // Train network if possible
    if(this.memory.length > this.batchSize){
      console.log("Going to replay");
      this.replay();
    }
  }

  // Save state -> Actions pairs in memory
  remember(currentState:State, action:number, reward:number, nextState:State, done:boolean){
    if(this.memory.length < 200){
      this.memory.push(new Memory(currentState,action,reward,nextState,done));
    }
    else{
      this.memory.pop()
      this.memory.push(new Memory(currentState,action,reward,nextState,done));
    }
  }

  // Selecting an action 
  act() : number {

    if(Math.random() > this.epsilon)
    {
      const data = this.networkModel.predict(tf.tensor2d([this.currentState.firstDeriv, this.currentState.secondDeriv, this.currentState.price, this.currentState.noStocks, this.currentState.balance], [1,5]))as any
      let res:any = Array.from(data.dataSync());
      let option = 0;
      for(let i = 0; i < 2; i++){
        if(res[i] < res[i+1]){
          option = i+1;
        }
      }
      console.log("Choosing my own way");
      return option;
    }
    return Math.floor(Math.random() * Math.floor(3));
  }

  // Replays memories to enforce bellman equation into neural network
  replay(batchSize:number = 32){
    // Select some random samples inside the interval of the memory
    let miniBatch: number[] = Array.from({length: this.batchSize}, () => Math.floor(Math.random() * (this.memory.length -1)));
    let target:number[] = [];
    let states:State[] = [];

    for(var i = 0; i < this.batchSize; i++){
      states.push(this.memory[miniBatch[i]].state);
      if(this.memory[miniBatch[i]].done){
        target.push(this.memory[miniBatch[i]].reward);
        target.push(this.memory[miniBatch[i]].reward);
        target.push(this.memory[miniBatch[i]].reward);
      }
      else{
        const predict = this.networkModel.predict(tf.tensor2d([this.memory[miniBatch[i]].nextState.firstDeriv, this.memory[miniBatch[i]].nextState.secondDeriv, this.memory[miniBatch[i]].nextState.price, this.memory[miniBatch[i]].nextState.noStocks, this.memory[miniBatch[i]].nextState.balance], [1,5]))as any;
        let res:any = Array.from(predict.dataSync());
        target.push(this.memory[miniBatch[i]].reward + this.gamma * res[0]);
        target.push(this.memory[miniBatch[i]].reward + this.gamma * res[1]);
        target.push(this.memory[miniBatch[i]].reward + this.gamma * res[2]);
        this.trainNetwork(this.currentState,target);
      }
    }

    if(this.epsilon > this.epsilonMin)
      this.epsilon *= this.epsilonDecay;

    console.log("Decreasing epsilon:" + this.epsilon);
  }

 /* predict(val: number) {
    const output = this.linearModel.predict(tf.tensor2d([val], [1, 1])) as any;
    this.prediction = Array.from(output.dataSync())[0]
  } */

  async trainNetwork(state:State, prediction:number[]){
    await this.networkModel.fit(tf.tensor2d([state.firstDeriv,state.secondDeriv,state.price,state.noStocks,state.balance], [1,5]),tf.tensor2d([prediction[0],prediction[1],prediction[2]], [1,3]), {epochs: 1, verbose: 0});
  }

  // Make a trade in the environment
  envTrade(action:number){
    switch(action){
      // Buy
      case 0 : {
          if(this.marketStatus[0].open < this.currentState.balance){
            if(this.currentState.noStocks == 0){
              this.currentState.setNoStocks(Math.floor(this.currentState.balance / this.marketStatus[0].open));
              this.currentState.setBalance(parseFloat((this.currentState.balance - (this.marketStatus[0].open * this.currentState.noStocks)).toFixed(2)));
            }
            else {
              let diff = this.currentState.noStocks;
              this.currentState.setNoStocks(this.currentState.noStocks + Math.floor(this.currentState.balance / this.marketStatus[0].open));
              diff = diff - this.currentState.noStocks;
              this.currentState.setBalance(parseFloat((this.currentState.balance - (this.marketStatus[0].open * diff)).toFixed(2)));
            }
          }
        break;
      }
      // Sell
      case 1 : {
        if(this.currentState.noStocks > 0){
          this.currentState.setBalance(parseFloat((this.currentState.noStocks * this.marketStatus[0].open).toFixed(2)));
          this.currentState.setNoStocks(0);
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  // Reset the environment
  envReset(){

  }

  // Step forward in the environment with the decided action
  envStep(action:number){

    // What was the agents net worth in previous step?
    let prevVal:number = this.envGetFortune(this.marketStatus[1]);

    this.envCurrentStep += 1;
    // The immediate reward is the difference between the agents net worth in previous step and the upcoming
    let reward:number = this.envGetFortune(this.marketStatus[0]) - prevVal;
    let oldState:State = new State(this.currentState.firstDeriv,this.currentState.secondDeriv,this.currentState.price,this.currentState.noStocks, this.currentState.balance);
    this.envTrade(action);
    this.currentState.price = parseFloat(this.marketStatus[0].open.toFixed(2));
    let done = this.envCurrentStep == this.episodes -1;

    let newState:State = new State(this.currentState.firstDeriv,this.currentState.secondDeriv,this.currentState.price,this.currentState.noStocks, this.currentState.balance);

    this.remember(oldState,action,reward,newState,done);
  }

  // Returns the total value of the agents portfolio in the specified timestep
  envGetFortune(timeStep: MarketPrice): number {
    return (timeStep.open * this.currentState.noStocks) + this.currentState.balance;
  }
}
