import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  ExistingConfiguration,
  NewConfigurationRequest,
  ProductCatalog,
  ProductChoice,
  ProductType
} from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  loadConfigurations(): Observable<ExistingConfiguration[]> {
    return of([
      { id: 'cfg-100', storeName: 'Seattle Central', productType: 'pc', totalPrice: 2200, createdAt: '2026-04-12' },
      { id: 'cfg-101', storeName: 'Austin Downtown', productType: 'raspberry-pi', totalPrice: 340, createdAt: '2026-04-15' },
      { id: 'cfg-102', storeName: 'Seattle Central', productType: 'pc', totalPrice: 1850, createdAt: '2026-04-17' }
    ]).pipe(delay(120));
  }

  loadCatalog(): Observable<ProductCatalog> {
    return of({
      pc: [
        {
          key: 'gpu',
          label: 'Graphics card',
          choices: [
            { sku: 'GPU-NV-16', provider: 'NVIDIA', label: 'RTX 4060 16GB', price: 700, excludes: ['MEM-64'] },
            { sku: 'GPU-AMD-32', provider: 'AMD', label: 'RX 7900 32GB', price: 880 },
            { sku: 'GPU-AMD-64', provider: 'AMD', label: 'Radeon Pro 64GB', price: 1200 }
          ]
        },
        {
          key: 'cpu',
          label: 'CPU',
          choices: [
            { sku: 'CPU-INTEL-I7', provider: 'Intel', label: 'Intel i7', price: 420 },
            { sku: 'CPU-AMD-R7', provider: 'AMD', label: 'AMD Ryzen 7', price: 380 }
          ]
        },
        {
          key: 'memory',
          label: 'Memory',
          choices: [
            { sku: 'MEM-32', provider: 'Corsair', label: '32GB DDR5', price: 220 },
            { sku: 'MEM-64', provider: 'Corsair', label: '64GB DDR5', price: 390, excludes: ['GPU-NV-16'] }
          ]
        }
      ],
      raspberryPi: {
        ram: [
          { sku: 'PI-RAM-4', label: '4GB RAM', price: 55 },
          { sku: 'PI-RAM-8', label: '8GB RAM', price: 90 },
          { sku: 'PI-RAM-16', label: '16GB RAM', price: 130 }
        ],
        disk: [
          { sku: 'PI-DSK-64', label: '64GB Disk', price: 60 },
          { sku: 'PI-DSK-128', label: '128GB Disk', price: 95 },
          { sku: 'PI-DSK-256', label: '256GB Disk', price: 150 }
        ]
      }
    }).pipe(delay(120));
  }

  createConfiguration(request: NewConfigurationRequest, totalPrice: number): Observable<ExistingConfiguration> {
    return of({
      id: `cfg-${Math.floor(Math.random() * 99999)}`,
      storeName: request.storeName,
      productType: request.productType,
      totalPrice,
      createdAt: new Date().toISOString().slice(0, 10)
    }).pipe(delay(120));
  }

  calculatePrice(catalogChoices: ProductChoice[], selectedSkus: string[]): number {
    return catalogChoices.filter((choice) => selectedSkus.includes(choice.sku)).reduce((sum, choice) => sum + choice.price, 0);
  }

  normalizeProductType(raw: ProductType): ProductType {
    return raw;
  }
}
