import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ConfiguratorStore } from './state/configurator.store';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly store = inject(ConfiguratorStore);
  showWizard = false;

  constructor() {
    void this.store.loadInitialData();
  }

  get canSubmit(): boolean {
    if (!this.store.storeName().trim() || !this.store.productType()) {
      return false;
    }

    return this.store.productType() === 'pc' ? !!this.store.selectedPcOption() : !!this.store.selectedPiOption();
  }
}
