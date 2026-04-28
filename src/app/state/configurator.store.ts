import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ExistingConfiguration,
  NewConfigurationRequest,
  PcOptionGroup,
  ProductCatalog,
  ProductChoice,
  ProductType
} from '../models/product.models';
import { ProductApiService } from '../services/product-api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguratorStore {
  private readonly api = inject(ProductApiService);

  readonly isLoading = signal(false);
  readonly productType = signal<ProductType | null>(null);
  readonly storeFilter = signal('');
  readonly storeName = signal('');
  readonly configurations = signal<ExistingConfiguration[]>([]);
  readonly catalog = signal<ProductCatalog | null>(null);

  readonly selectedPcSkus = signal<Record<PcOptionGroup['key'], string | null>>({
    gpu: null,
    cpu: null,
    memory: null
  });
  readonly selectedPi = signal<{ ramSku: string | null; diskSku: string | null }>({ ramSku: null, diskSku: null });

  readonly filteredConfigurations = computed(() => {
    const term = this.storeFilter().toLowerCase().trim();
    return this.configurations().filter((cfg) => cfg.storeName.toLowerCase().includes(term));
  });

  readonly pcGroups = computed(() => this.catalog()?.pc ?? []);
  readonly raspberryPiOptions = computed(() => this.catalog()?.raspberryPi ?? { ram: [], disk: [] });

  readonly flatChoices = computed<ProductChoice[]>(() => {
    const catalog = this.catalog();
    if (!catalog) {
      return [];
    }
    return [...catalog.pc.flatMap((group) => group.choices), ...catalog.raspberryPi.ram, ...catalog.raspberryPi.disk];
  });

  readonly selectedSkus = computed<string[]>(() => {
    if (this.productType() === 'pc') {
      return Object.values(this.selectedPcSkus()).filter((sku): sku is string => !!sku);
    }

    if (this.productType() === 'raspberry-pi') {
      const pi = this.selectedPi();
      return [pi.ramSku, pi.diskSku].filter((sku): sku is string => !!sku);
    }

    return [];
  });

  readonly totalPrice = computed(() => this.api.calculatePrice(this.flatChoices(), this.selectedSkus()));

  async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    const [configs, catalog] = await Promise.all([
      firstValueFrom(this.api.loadConfigurations()),
      firstValueFrom(this.api.loadCatalog())
    ]);

    this.configurations.set(configs);
    this.catalog.set(catalog);
    this.isLoading.set(false);
  }

  chooseProduct(type: ProductType): void {
    this.productType.set(type);
    this.selectedPcSkus.set({ gpu: null, cpu: null, memory: null });
    this.selectedPi.set({ ramSku: null, diskSku: null });
  }

  selectPcChoice(groupKey: PcOptionGroup['key'], sku: string): void {
    const next = { ...this.selectedPcSkus(), [groupKey]: sku };
    const invalidPairs = this.findExcludedSkus(Object.values(next).filter((item): item is string => !!item));

    Object.entries(next).forEach(([key, selected]) => {
      if (selected && invalidPairs.has(selected) && key !== groupKey) {
        next[key as PcOptionGroup['key']] = null;
      }
    });

    this.selectedPcSkus.set(next);
  }

  availableChoicesFor(group: PcOptionGroup): ProductChoice[] {
    const selected = Object.values(this.selectedPcSkus()).filter((sku): sku is string => !!sku);
    const excluded = this.findExcludedSkus(selected);

    return group.choices.filter((choice) => {
      if (group.key === 'gpu' && choice.provider === 'AMD' && choice.sku === 'GPU-AMD-64' && this.storeName().toLowerCase().includes('downtown')) {
        return false;
      }

      if (excluded.has(choice.sku)) {
        return selected.includes(choice.sku);
      }

      return true;
    });
  }

  async submit(): Promise<void> {
    if (!this.productType() || !this.storeName().trim() || !this.canSubmit()) {
      return;
    }

    const request: NewConfigurationRequest = {
      productType: this.api.normalizeProductType(this.productType()),
      storeName: this.storeName().trim(),
      selectedSkus: this.selectedSkus()
    };

    const created = await firstValueFrom(this.api.createConfiguration(request, this.totalPrice()));
    this.configurations.update((current) => [created, ...current]);
    this.resetWizard();
  }

  canSubmit(): boolean {
    if (this.productType() === 'pc') {
      const selected = this.selectedPcSkus();
      return !!selected.gpu && !!selected.cpu && !!selected.memory;
    }

    if (this.productType() === 'raspberry-pi') {
      const selected = this.selectedPi();
      return !!selected.ramSku && !!selected.diskSku;
    }

    return false;
  }

  resetWizard(): void {
    this.productType.set(null);
    this.storeName.set('');
    this.selectedPcSkus.set({ gpu: null, cpu: null, memory: null });
    this.selectedPi.set({ ramSku: null, diskSku: null });
  }

  private findExcludedSkus(selectedSkus: string[]): Set<string> {
    const selectedChoices = this.flatChoices().filter((choice) => selectedSkus.includes(choice.sku));
    return new Set(selectedChoices.flatMap((choice) => choice.excludes ?? []));
  }
}
