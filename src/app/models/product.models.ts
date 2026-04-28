export type ProductType = 'pc' | 'raspberry-pi';

export interface ExistingConfiguration {
  id: string;
  storeName: string;
  productType: ProductType;
  totalPrice: number;
  createdAt: string;
}

export interface PcOptionGroup {
  key: 'gpu' | 'cpu' | 'memory';
  label: string;
  choices: ProductChoice[];
}

export interface ProductChoice {
  sku: string;
  provider?: 'NVIDIA' | 'AMD' | 'Intel' | 'Corsair';
  label: string;
  price: number;
  excludes?: string[];
}

export interface RaspberryPiOptions {
  ram: ProductChoice[];
  disk: ProductChoice[];
}

export interface ProductCatalog {
  pc: PcOptionGroup[];
  raspberryPi: RaspberryPiOptions;
}

export interface NewConfigurationRequest {
  storeName: string;
  productType: ProductType;
  selectedSkus: string[];
}
