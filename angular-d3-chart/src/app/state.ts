export  class State {
  firstDeriv: number;
  secondDeriv: number;
  thirdDeriv: number;
  noStocks: number;
  balance: number;

  //Constructor
  constructor(first:number,second:number,third:number,noStocks:number,balance:number){
    this.firstDeriv = first;
    this.secondDeriv = second;
    this.thirdDeriv = third;
    this.noStocks = noStocks;
    this.balance = balance;
  }

  // Set Balance
  setBalance(newBalance:number){
    this.balance = newBalance;
  }

  // Set Number of Stocks
  setNoStocks(newStock:number){
      this.noStocks = newStock;
  }

  // Set first derivative
  setFirstD(newFirstDer: number){
    this.firstDeriv = newFirstDer;
  }

   // Set second derivative
   setSecondD(newSecondDer: number){
    this.secondDeriv = newSecondDer;
  }

   // Set third derivative
   setThirdD(newThirdDer: number){
    this.thirdDeriv = newThirdDer;
  }

}