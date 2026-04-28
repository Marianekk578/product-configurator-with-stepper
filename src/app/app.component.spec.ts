import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';
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

  loadPcOptions = jasmine
    .createSpy()
    .and.returnValue(of([{ sku: 'GPU-AMD-64', provider: 'AMD', memoryGb: 64, price: 1200 }]));

  loadPiOptions = jasmine
    .createSpy()
    .and.returnValue(of([{ sku: 'PI-8-128', memoryGb: 8, diskGb: 128, price: 170 }]));

  createConfiguration = jasmine
    .createSpy()
    .and.returnValue(of({ id: 'cfg-3', storeName: 'Seattle North', productType: 'pc', totalPrice: 1200, createdAt: '2026-04-18' }));
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

  it('opens wizard and advances with raspberry pi selection', fakeAsync(() => {
    const createButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="primary"]');
    createButton.click();
    fixture.detectChanges();

    const piButton: HTMLButtonElement = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el: Element) =>
      el.textContent?.includes('Raspberry PI')
    ) as HTMLButtonElement;
    piButton.click();
    fixture.detectChanges();

    const nextButtons = Array.from(fixture.nativeElement.querySelectorAll('button')).filter((el: Element) =>
      el.textContent?.trim() === 'Next'
    ) as HTMLButtonElement[];
    nextButtons[0].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Raspberry PI variant');
  }));

  it('applies AMD downtown physical constraint for PC', fakeAsync(() => {
    const createButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="primary"]');
    createButton.click();
    fixture.detectChanges();

    const pcButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el: Element) =>
      el.textContent?.includes('Full PC')
    ) as HTMLButtonElement;
    pcButton.click();
    fixture.detectChanges();

    const next = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el: Element) =>
      el.textContent?.trim() === 'Next'
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    const storeInput = Array.from(fixture.nativeElement.querySelectorAll('input')).find((el: Element) =>
      !(el as HTMLInputElement).placeholder
    ) as HTMLInputElement;

    storeInput.value = 'Austin Downtown';
    storeInput.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    const optionText = fixture.nativeElement.textContent as string;
    expect(optionText).not.toContain('GPU-AMD-64');
  }));

  it('keeps wizard open while order submission is pending', fakeAsync(() => {
    const api = TestBed.inject(ProductApiService) as unknown as MockProductApiService;
    api.createConfiguration.and.returnValue(
      timer(200).pipe(
        mapTo({ id: 'cfg-3', storeName: 'Seattle North', productType: 'pc', totalPrice: 1200, createdAt: '2026-04-18' })
      )
    );

    fixture.componentInstance.showWizard = true;
    fixture.componentInstance.store.productType.set('raspberry-pi');
    fixture.componentInstance.store.storeName.set('Seattle North');
    fixture.componentInstance.store.selectedPiSku.set('PI-8-128');
    fixture.detectChanges();

    fixture.componentInstance.submitOrder();
    tick(100);
    fixture.detectChanges();

    expect(fixture.componentInstance.showWizard).toBeTrue();
    expect(fixture.componentInstance.isSubmitting).toBeTrue();

    tick(100);
    fixture.detectChanges();

    expect(fixture.componentInstance.showWizard).toBeFalse();
    expect(fixture.componentInstance.isSubmitting).toBeFalse();
  }));
});
