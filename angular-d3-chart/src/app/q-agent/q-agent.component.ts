import { Component, OnInit, Input, OnChanges } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { State } from '../state';
import { Memory } from '../memory';
import { input } from '@tensorflow/tfjs';
import { MarketPrice } from '../market-price';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { mape } from '@tensorflow/tfjs-layers/dist/exports_metrics';

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
  lastTwoVals: number[] = [0,0];
  actionList:string[] = ["Buying","Selling","Holding"];
  inTraining:boolean = false;
  buyPrice:number = 0;

  // How much do we want to discount future rewards?
  gamma:number = 0.95;
  epsilon:number = 1.0;
  epsilonDecay:number = 0.995;
  epsilonMin:number = 0.03;
  episodes:number = 32;
  readonly batchSize:number = 32;
  counter:number = 0;

  // Environment variables
  envCurrentStep:number;

  constructor() {}

  ngOnInit(){
    // Initialize first state
    console.log("Initializing state");
    this.currentState = new State(0,0,0,0,1500);

    this.networkModel = tf.sequential();
    this.networkModel.add(tf.layers.dense({units: 32, inputShape: [5], activation: 'relu'}));
    this.networkModel.add(tf.layers.dense({units: 32, activation: 'relu'}));
    this.networkModel.add(tf.layers.dense({units: 3, activation: 'linear'}));
    this.networkModel.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(0.06)})
  }

  ngOnChanges() {

    if(this.currentState && this.currentState.balance > 25000){
      this.action = "I Won!!";
    }
    else{
      // Pick a random action TODO: This rate should lower as the agent gets smarter
      if(this.marketStatus){
        let decision:number = this.act();
        this.action = this.actionList[decision];
        this.envStep(decision);
      }

      // Train network if possible
      if(this.memory.length > this.batchSize && (this.counter % 10 == 0) && !this.inTraining){
        this.inTraining = true;
        this.replay();
      }
      if(this.counter % this.batchSize == 0){
        this.envReset();
      }
      this.counter++;
    }
  }

  // Save state -> Actions pairs in memory
  remember(currentState:State, action:number, reward:number, nextState:State, done:boolean){
    if(this.memory.length < 500){
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
      //console.log(res);
      return option;
    }
    return Math.floor(Math.random() * Math.floor(3));
  }

  // Replays memories to enforce bellman equation into neural network
  replay(batchSize:number = 32){
    // Select some random samples inside the interval of the memory
    let miniBatch: number[] = Array.from({length: this.batchSize}, () => Math.floor(Math.random() * (this.memory.length -1)));
    let targetList:any[] = new Array(32);
    let states:State[] = [];
    let actionList:number[] = [];

    for(var i = 0; i < this.batchSize; i++){
      states.push(this.memory[miniBatch[i]].state);
      actionList.push(this.memory[miniBatch[i]].action);
      let emptyList:number[] = [0,0,0];
      if(this.memory[miniBatch[i]].done){
        let target:number[] = [];
        emptyList[this.memory[miniBatch[i]].action] = 1;
        target.push(this.memory[miniBatch[i]].reward * emptyList[0]);
        target.push(this.memory[miniBatch[i]].reward * emptyList[1]);
        target.push(this.memory[miniBatch[i]].reward * emptyList[2]);
        targetList[i] = (new Array(target[2],target[1],target[0]));
      }
      else{
        const predict = this.networkModel.predict(tf.tensor2d([this.memory[miniBatch[i]].nextState.firstDeriv, this.memory[miniBatch[i]].nextState.secondDeriv, this.memory[miniBatch[i]].nextState.price, this.memory[miniBatch[i]].nextState.noStocks, this.memory[miniBatch[i]].nextState.balance], [1,5]))as any;
        let res:any = Array.from(predict.dataSync());
        let target:number[] = [];
        emptyList[this.memory[miniBatch[i]].action] = 1;
        target.push((this.memory[miniBatch[i]].reward + this.gamma * res[0]) * emptyList[0]);
        target.push((this.memory[miniBatch[i]].reward + this.gamma * res[1]) * emptyList[1]);
        target.push((this.memory[miniBatch[i]].reward + this.gamma * res[2]) * emptyList[2]);
        targetList[i] = (new Array(target[2],target[1],target[0]));
      }
    }
    this.trainNetwork(states,targetList);

    if(this.epsilon > this.epsilonMin)
      this.epsilon *= this.epsilonDecay;

    console.log("Decreasing epsilon:" + this.epsilon);
  }

 /* predict(val: number) {
    const output = this.linearModel.predict(tf.tensor2d([val], [1, 1])) as any;
    this.prediction = Array.from(output.dataSync())[0]
  } */

  async trainNetwork(states:State[], prediction:number[]){
    const testingData = tf.tensor2d(states.map(item =>[
      item.firstDeriv,item.secondDeriv,item.price,item.noStocks,item.balance
    ]))
    
    const outputData = tf.tensor2d(prediction);

    await this.networkModel.fit(testingData,outputData, {epochs: 1, verbose: 0});

    console.log("Network Slighly trained");
    this.inTraining = false;
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
    this.currentState = new State(0,0,0,0,1500);
    this.buyPrice = 0;
    console.log("Reset environment")
  }

  // Step forward in the environment with the decided action
  envStep(action:number){

    this.currentState.firstDeriv = this.currentState.price - this.lastTwoVals[0];
    this.currentState.secondDeriv = this.currentState.price - this.lastTwoVals[1];

    // Keep the values up to time, so we can compute derivatives
    this.lastTwoVals.pop();
    this.lastTwoVals.unshift(this.marketStatus[0].open);
   
    this.envCurrentStep += 1;
    // The immediate reward is the difference between the agents net worth in previous step and the upcoming
    let reward:number = -10;

    let oldState:State = new State(this.currentState.firstDeriv,this.currentState.secondDeriv,this.currentState.price,this.currentState.noStocks, this.currentState.balance);
    this.envTrade(action);

    this.currentState.price = parseFloat(this.marketStatus[0].open.toFixed(2));
    let done = this.envCurrentStep == this.episodes -1;

    let newState:State = new State(this.currentState.price - this.lastTwoVals[0],this.currentState.price - this.lastTwoVals[1],this.currentState.price,this.currentState.noStocks, this.currentState.balance);
    
    if(action == 1 && newState.noStocks < oldState.noStocks){
      reward = newState.balance - this.buyPrice;
    }

    if(action == 0){
      reward = this.envGetFortune(this.marketStatus[0]) - this.envGetFortune(this.marketStatus[1]);
      if(oldState.noStocks < newState.noStocks){
        this.buyPrice = this.envGetFortune(this.marketStatus[0]);
      }
    }

    if(action == 1 && oldState.noStocks == 0){
        reward = -100;
    }




    this.remember(oldState,action,reward,newState,done);
  }

  // Returns the total value of the agents portfolio in the specified timestep
  envGetFortune(timeStep: MarketPrice): number {
    return (timeStep.open * this.currentState.noStocks) + this.currentState.balance;
  }

}