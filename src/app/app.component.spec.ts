import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { ProductApiService } from './services/product-api.service';

class MockProductApiService {
  loadConfigurations = jasmine
    .createSpy()
    .and.returnValue(
      of([
        { id: 'cfg-1', storeName: 'Seattle Central', productType: 'pc', totalPrice: 1000, createdAt: '2026-04-12' },
        { id: 'cfg-2', storeName: 'Austin Downtown', productType: 'raspberry-pi', totalPrice: 250, createdAt: '2026-04-14' }
      ])
    );

  loadCatalog = jasmine.createSpy().and.returnValue(
    of({
      pc: [
        {
          key: 'gpu',
          label: 'Graphics card',
          choices: [{ sku: 'GPU-AMD-64', provider: 'AMD', label: 'Radeon Pro 64GB', price: 1200 }]
        },
        { key: 'cpu', label: 'CPU', choices: [{ sku: 'CPU-INTEL-I7', provider: 'Intel', label: 'Intel i7', price: 420 }] },
        { key: 'memory', label: 'Memory', choices: [{ sku: 'MEM-32', provider: 'Corsair', label: '32GB DDR5', price: 220 }] }
      ],
      raspberryPi: {
        ram: [{ sku: 'PI-RAM-8', label: '8GB RAM', price: 90 }],
        disk: [{ sku: 'PI-DSK-128', label: '128GB Disk', price: 95 }]
      }
    })
  );

  createConfiguration = jasmine
    .createSpy()
    .and.returnValue(of({ id: 'cfg-3', storeName: 'Seattle North', productType: 'pc', totalPrice: 1200, createdAt: '2026-04-18' }));

  calculatePrice = jasmine.createSpy().and.callFake((choices, selectedSkus: string[]) =>
    choices.filter((choice: { sku: string }) => selectedSkus.includes(choice.sku)).reduce((sum: number, choice: { price: number }) => sum + choice.price, 0)
  );

  normalizeProductType = jasmine.createSpy().and.callFake((raw: string) => raw);
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideNoopAnimations(), { provide: ProductApiService, useClass: MockProductApiService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('filters overview rows by store name', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[placeholder="e.g. Seattle"]');
    input.value = 'Austin';
    input.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Austin Downtown');
  }));

  it('renders differentiated step-2 labels for raspberry pi', fakeAsync(() => {
    fixture.componentInstance.showWizard = true;
    fixture.componentInstance.store.chooseProduct('raspberry-pi');
    fixture.detectChanges();
    tick();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Raspberry PI RAM');
    expect(text).toContain('Raspberry PI Disk');
  }));

  it('applies AMD downtown physical constraint for PC gpu options', fakeAsync(() => {
    fixture.componentInstance.showWizard = true;
    fixture.componentInstance.store.chooseProduct('pc');
    fixture.componentInstance.store.storeName.set('Austin Downtown');
    fixture.detectChanges();
    tick();

    const gpuGroup = fixture.componentInstance.store.pcGroups().find((group) => group.key === 'gpu');
    expect(gpuGroup).toBeTruthy();

    const choices = fixture.componentInstance.store.availableChoicesFor(gpuGroup!);
    expect(choices.some((choice) => choice.sku === 'GPU-AMD-64')).toBeFalse();
  }));
});
