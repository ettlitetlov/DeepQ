export  class State {
  firstDeriv: number;
  secondDeriv: number;
  price: number;
  noStocks: number;
  balance: number;

  //Constructor
  constructor(first:number,second:number,price:number,noStocks:number,balance:number){
    this.firstDeriv = first;
    this.secondDeriv = second;
    this.price = price;
    this.noStocks = noStocks;
    this.balance = balance;
  }

  // Set Balance
  setBalance(newBalance:number){
    this.balance = newBalance;
  }

  //Get Balance
  getBalance(): number{
    return this.balance;
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

   // Set price
   setThirdD(price: number){
    this.price = price;
  }

}