import { Component, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { State } from '../state';

@Component({
  selector: 'app-q-agent',
  templateUrl: './q-agent.component.html',
  styleUrls: ['./q-agent.component.css']
})
export class QAgentComponent implements OnInit {

  readonly size:number = 3;
  linearModel : tf.Sequential;
  prediction: any;
  currentState: State;
  memory: number[];

  constructor() { }

  ngOnInit() {
    this.trainNewModel();
    // Initialize first state
    this.currentState = new State(0,0,0,0,1500);
  }

  async trainNewModel() {
    // Define a model for linear regression.
    this.linearModel = tf.sequential();
    this.linearModel.add(tf.layers.dense({units: 1, inputShape:[1]}))

    // Prepare the model for training: Specift Loss and the optimizer.
    this.linearModel.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    // Training data
    const xs = tf.tensor1d([3.2, 4.4, 5.5]);
    const ys = tf.tensor1d([1.6, 2.7, 3.5]);


    // Train
    await this.linearModel.fit(xs, ys)

    console.log('model trained!')

  }

  predict(val: number) {
    const output = this.linearModel.predict(tf.tensor2d([val], [1, 1])) as any;
    this.prediction = Array.from(output.dataSync())[0]
  }
}
