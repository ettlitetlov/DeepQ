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
  linearModel : tf.Sequential;
  prediction: any;
  currentState: State;
  memory: Memory[];
  action: string;
  actionList:string[] = ["Buying","Selling","Holding"];

  constructor() {}

  ngOnInit(){
    // Initialize first state
    console.log("Initializing state");
    this.currentState = new State(0,0,0,0,1500);
  }

  ngOnChanges() {
    // Pick a random action TODO: This rate should lower as the agent gets smarter
    let decision:number = this.act();
    this.action = this.actionList[decision];
    this.trade(this.marketStatus[0],decision);
  }

  // Save state -> Actions pairs in memory
  remember(currentState:State, action:string, reward:number, nextState:State, done:boolean){
    if(this.memory.length < 100){
      this.memory.unshift(new Memory(currentState,action,reward,nextState,done));
    }
    else{
      this.memory.pop()
      this.memory.unshift(new Memory(currentState,action,reward,nextState,done));
    }
  }

  // Selecting an action 
  act() : number {
    return Math.floor(Math.random() * Math.floor(3));
    // TODO: Implement exploration/ exploitation of neural network
  }

  // Replays memories to enforce bellman equation into neural network
  replay(batchSize:number = 32){
    // TODO: Implement FIT-method for the model
  }

  async trainNewModel() {
    // Define a model for linear regression.
    this.linearModel = tf.sequential();
    this.linearModel.add(tf.layers.dense({units: 1, inputShape:[1]}));

    // Prepare the model for training: Specift Loss and the optimizer.
    this.linearModel.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    // Training data
    const xs = tf.tensor1d([3.2, 4.4, 5.5]);
    const ys = tf.tensor1d([1.6, 2.7, 3.5]);


    // Train
    await this.linearModel.fit(xs, ys, {epochs: 200})

    console.log('model trained!')

  }

  predict(val: number) {
    const output = this.linearModel.predict(tf.tensor2d([val], [1, 1])) as any;
    this.prediction = Array.from(output.dataSync())[0]
  }

  trade(price:MarketPrice, action:number){
    switch(action){
      // Buy
      case 0 : {
          if(price.open < this.currentState.balance){
            this.currentState.noStocks = Math.floor(this.currentState.balance / price.open);
            this.currentState.setBalance(parseFloat((this.currentState.balance - (price.open * this.currentState.noStocks)).toFixed(2)));
          }
        break;
      }
      // Sell
      case 1 : {
        if(this.currentState.noStocks > 0){
          this.currentState.setBalance(parseFloat((this.currentState.noStocks * price.open).toFixed(2)));
          this.currentState.noStocks = 0;
        }

        break;
      }
      default: {
        break;
      }
    }
  }
}
