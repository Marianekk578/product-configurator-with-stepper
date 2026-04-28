export type ProductType = 'pc' | 'raspberry-pi';

export interface ProductConfigurationSummary {
  id: string;
  storeName: string;
  productType: ProductType;
  totalPrice: number;
  createdAt: string;
}

export interface PcOption {
  sku: string;
  provider: 'NVIDIA' | 'AMD';
  memoryGb: 16 | 32 | 64;
  price: number;
}

export interface PiOption {
  sku: string;
  memoryGb: 4 | 8 | 16;
  diskGb: 64 | 128 | 256;
  price: number;
}

export interface NewConfiguration {
  storeName: string;
  productType: ProductType;
  pcOption?: PcOption;
  piOption?: PiOption;
}
