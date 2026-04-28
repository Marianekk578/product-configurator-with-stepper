import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { NewConfiguration, PcOption, PiOption, ProductConfigurationSummary } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  loadConfigurations(): Observable<ProductConfigurationSummary[]> {
    return of([
      { id: 'cfg-100', storeName: 'Seattle Central', productType: 'pc', totalPrice: 2200, createdAt: '2026-04-12' },
      { id: 'cfg-101', storeName: 'Austin Downtown', productType: 'raspberry-pi', totalPrice: 340, createdAt: '2026-04-15' },
      { id: 'cfg-102', storeName: 'Seattle Central', productType: 'pc', totalPrice: 1850, createdAt: '2026-04-17' }
    ]).pipe(delay(120));
  }

  loadPcOptions(): Observable<PcOption[]> {
    return of([
      { sku: 'GPU-NV-16', provider: 'NVIDIA', memoryGb: 16, price: 700 },
      { sku: 'GPU-NV-32', provider: 'NVIDIA', memoryGb: 32, price: 950 },
      { sku: 'GPU-AMD-32', provider: 'AMD', memoryGb: 32, price: 880 },
      { sku: 'GPU-AMD-64', provider: 'AMD', memoryGb: 64, price: 1200 }
    ]).pipe(delay(120));
  }

  loadPiOptions(): Observable<PiOption[]> {
    return of([
      { sku: 'PI-4-64', memoryGb: 4, diskGb: 64, price: 120 },
      { sku: 'PI-8-128', memoryGb: 8, diskGb: 128, price: 170 },
      { sku: 'PI-16-256', memoryGb: 16, diskGb: 256, price: 260 }
    ]).pipe(delay(120));
  }

  createConfiguration(request: NewConfiguration): Observable<ProductConfigurationSummary> {
    const totalPrice = request.productType === 'pc' ? request.pcOption?.price ?? 0 : request.piOption?.price ?? 0;

    return of({
      id: `cfg-${Math.floor(Math.random() * 99999)}`,
      storeName: request.storeName,
      productType: request.productType,
      totalPrice,
      createdAt: new Date().toISOString().slice(0, 10)
    }).pipe(delay(120));
  }
}
