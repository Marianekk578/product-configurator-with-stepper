import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NewConfiguration, PcOption, PiOption, ProductConfigurationSummary, ProductType } from '../models/product.models';
import { ProductApiService } from '../services/product-api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguratorStore {
  private readonly api = inject(ProductApiService);

  readonly isLoading = signal(false);
  readonly productType = signal<ProductType | null>(null);
  readonly storeFilter = signal('');
  readonly storeName = signal('');
  readonly selectedPcSku = signal<string | null>(null);
  readonly selectedPiSku = signal<string | null>(null);
  readonly configurations = signal<ProductConfigurationSummary[]>([]);
  readonly pcOptions = signal<PcOption[]>([]);
  readonly piOptions = signal<PiOption[]>([]);

  readonly filteredConfigurations = computed(() => {
    const term = this.storeFilter().toLowerCase().trim();
    return this.configurations().filter((cfg) => cfg.storeName.toLowerCase().includes(term));
  });

  readonly availablePcOptions = computed(() =>
    this.pcOptions().filter((option) => {
      if (this.productType() !== 'pc') {
        return false;
      }
      return !(option.provider === 'AMD' && option.memoryGb === 64 && this.storeName().toLowerCase().includes('downtown'));
    })
  );

  readonly selectedPcOption = computed(() => this.availablePcOptions().find((item) => item.sku === this.selectedPcSku()) ?? null);
  readonly selectedPiOption = computed(() => this.piOptions().find((item) => item.sku === this.selectedPiSku()) ?? null);

  readonly totalPrice = computed(() => this.selectedPcOption()?.price ?? this.selectedPiOption()?.price ?? 0);

  async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    const [configs, pcOptions, piOptions] = await Promise.all([
      firstValueFrom(this.api.loadConfigurations()),
      firstValueFrom(this.api.loadPcOptions()),
      firstValueFrom(this.api.loadPiOptions())
    ]);

    this.configurations.set(configs);
    this.pcOptions.set(pcOptions);
    this.piOptions.set(piOptions);
    this.isLoading.set(false);
  }

  chooseProduct(type: ProductType): void {
    this.productType.set(type);
    this.selectedPcSku.set(null);
    this.selectedPiSku.set(null);
  }

  async submit(): Promise<void> {
    if (!this.productType() || !this.storeName().trim()) {
      return;
    }

    const request: NewConfiguration = {
      productType: this.productType(),
      storeName: this.storeName().trim(),
      pcOption: this.selectedPcOption() ?? undefined,
      piOption: this.selectedPiOption() ?? undefined
    };

    const created = await firstValueFrom(this.api.createConfiguration(request));
    this.configurations.update((current) => [created, ...current]);
    this.resetWizard();
  }

  resetWizard(): void {
    this.productType.set(null);
    this.storeName.set('');
    this.selectedPcSku.set(null);
    this.selectedPiSku.set(null);
  }
}
