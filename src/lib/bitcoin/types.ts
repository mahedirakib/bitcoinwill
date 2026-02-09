export type BitcoinNetwork = 'testnet' | 'regtest';

export interface PlanInput {
  network: BitcoinNetwork;
  inheritance_type: 'timelock_recovery';
  owner_pubkey: string;      // Compressed hex pubkey
  beneficiary_pubkey: string; // Compressed hex pubkey
  locktime_blocks: number;    // Relative locktime in blocks
  plan_label?: string;
}

export interface PlanOutput {
  descriptor: string;
  script_asm: string;
  script_hex: string;
  address: string;
  witness_script: string;
  network: BitcoinNetwork;
  human_explanation: string[];
}
