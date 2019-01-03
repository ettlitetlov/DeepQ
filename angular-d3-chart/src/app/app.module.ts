import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MarketChartComponent } from './market-chart/market-chart.component';
import { QAgentComponent } from './q-agent/q-agent.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule, MatButtonModule } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    MarketChartComponent,
    QAgentComponent

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatListModule,
    MatButtonModule
  ],
  providers: [QAgentComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}