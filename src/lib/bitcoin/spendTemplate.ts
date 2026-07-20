import { address as bitcoinAddress, Psbt } from 'bitcoinjs-lib';
import './init';
import type { PlanInput, PlanOutput, BitcoinNetwork } from './types';
import type { VaultUtxo } from './explorer/types';
import { getNetworkParams } from './network';
import { hexToBytes } from './hex';
import { sanitizeAddress } from './explorer/utils';

export type SpendPath = 'owner' | 'beneficiary' | 'checkin';

export interface SpendTemplateInput {
  network: BitcoinNetwork;
  plan: PlanInput;
  result: PlanOutput;
  utxos: VaultUtxo[];
  /** Required for owner/beneficiary; ignored for check-in (pays vault address). */
  destinationAddress?: string;
  feeRateSatsPerVbyte: number;
  path: SpendPath;
  selectedOutpoints?: Array<{ txid: string; vout: number }>;
}

export interface SpendTemplateResult {
  psbtBase64: string;
  psbtHex: string;
  path: SpendPath;
  estimatedVsize: number;
  feeSats: number;
  totalInputSats: number;
  outputSats: number;
  inputCount: number;
  destinationAddress: string;
  warnings: string[];
}

const MAX_FEE_RATE_SATS_PER_VBYTE = 500;
const MAX_ABSOLUTE_FEE_SATS = 1_000_000;
const MIN_OUTPUT_SATS = 546;
const DEFAULT_OWNER_SEQUENCE = 0xfffffffe;

const estimateInputVbytes = (addressType: 'p2wsh' | 'p2tr', witnessScriptHex: string): number => {
  const scriptBytes = Math.ceil(witnessScriptHex.length / 2);
  // Conservative SegWit vsize: non-witness input base (~41) + witness/4.
  // Signature ~73, empty IF/ELSE selector, script, (+ control block for P2TR).
  if (addressType === 'p2tr') {
    const controlBlockBytes = 33;
    const witnessBytes = 1 + 73 + 1 + scriptBytes + controlBlockBytes;
    return 41 + Math.ceil(witnessBytes / 4);
  }
  const witnessBytes = 1 + 73 + 1 + 1 + scriptBytes;
  return 41 + Math.ceil(witnessBytes / 4);
};

const estimateOutputVbytes = (destination: string, network: BitcoinNetwork): number => {
  try {
    const script = bitcoinAddress.toOutputScript(destination, getNetworkParams(network));
    // Outputs sit in the non-witness section: 8-byte value + compactSize + script.
    return 8 + 1 + script.length;
  } catch {
    return 43;
  }
};

const estimateTxVsize = (
  inputCount: number,
  addressType: 'p2wsh' | 'p2tr',
  witnessScriptHex: string,
  destination: string,
  network: BitcoinNetwork,
): number => {
  const overhead = 10.5;
  const inputs = inputCount * estimateInputVbytes(addressType, witnessScriptHex);
  const output = estimateOutputVbytes(destination, network);
  return Math.ceil(overhead + inputs + output);
};

const selectUtxos = (
  utxos: VaultUtxo[],
  path: SpendPath,
  locktimeBlocks: number,
  selectedOutpoints?: Array<{ txid: string; vout: number }>,
): VaultUtxo[] => {
  let pool = utxos.filter((u) => u.confirmed && u.valueSats > 0);

  if (path === 'beneficiary') {
    pool = pool.filter((u) => (u.confirmations ?? 0) >= locktimeBlocks);
  }

  if (selectedOutpoints && selectedOutpoints.length > 0) {
    const wanted = new Set(selectedOutpoints.map((o) => `${o.txid}:${o.vout}`));
    pool = pool.filter((u) => wanted.has(`${u.txid}:${u.vout}`));
    if (pool.length !== selectedOutpoints.length) {
      throw new Error('One or more selected UTXOs are missing or not eligible for this path.');
    }
  }

  if (pool.length === 0) {
    if (path === 'beneficiary') {
      throw new Error(
        `No confirmed UTXOs with at least ${locktimeBlocks} confirmation(s) for the beneficiary path.`,
      );
    }
    throw new Error('No confirmed UTXOs available to spend.');
  }

  return pool;
};

/**
 * Build an unsigned PSBT for a vault spend (owner, beneficiary, or owner check-in).
 * Never accepts private keys — sign externally (Sparrow, hardware wallet, etc.).
 */
export const buildSpendTemplate = (input: SpendTemplateInput): SpendTemplateResult => {
  const { plan, result, network, path, feeRateSatsPerVbyte } = input;

  if (result.network !== network || plan.network !== network) {
    throw new Error('Plan network does not match requested network.');
  }

  if (result.address_type !== 'p2wsh' && result.address_type !== 'p2tr') {
    throw new Error('Unsupported address type for spend template.');
  }

  if (result.address_type === 'p2tr' && !result.taproot_control_block) {
    throw new Error('Taproot control block is required for P2TR spend templates.');
  }

  if (
    !Number.isFinite(feeRateSatsPerVbyte) ||
    feeRateSatsPerVbyte <= 0 ||
    feeRateSatsPerVbyte > MAX_FEE_RATE_SATS_PER_VBYTE
  ) {
    throw new Error(`Fee rate must be between 1 and ${MAX_FEE_RATE_SATS_PER_VBYTE} sat/vB.`);
  }

  const destination =
    path === 'checkin'
      ? sanitizeAddress(result.address, network)
      : sanitizeAddress(input.destinationAddress ?? '', network);

  if (path !== 'checkin' && destination === result.address.toLowerCase()) {
    throw new Error('Destination must differ from the vault address (use check-in path to re-lock).');
  }

  const selected = selectUtxos(
    input.utxos,
    path === 'checkin' ? 'owner' : path,
    plan.locktime_blocks,
    input.selectedOutpoints,
  );

  const totalInputSats = selected.reduce((sum, u) => sum + u.valueSats, 0);
  const estimatedVsize = estimateTxVsize(
    selected.length,
    result.address_type,
    result.witness_script,
    destination,
    network,
  );
  const feeSats = Math.max(1, Math.ceil(estimatedVsize * feeRateSatsPerVbyte));

  if (feeSats > MAX_ABSOLUTE_FEE_SATS) {
    throw new Error(`Estimated fee exceeds safety cap of ${MAX_ABSOLUTE_FEE_SATS} sats.`);
  }

  if (BigInt(feeSats) * 100n > BigInt(totalInputSats) * 10n) {
    throw new Error('Estimated fee exceeds 10% of inputs. Lower the fee rate or select more UTXOs.');
  }

  const outputSats = totalInputSats - feeSats;
  if (outputSats < MIN_OUTPUT_SATS) {
    throw new Error(
      `Output would be ${outputSats} sats after fees (below dust limit of ${MIN_OUTPUT_SATS}).`,
    );
  }

  const networkParams = getNetworkParams(network);
  const witnessScript = hexToBytes(result.witness_script);
  const sequence =
    path === 'beneficiary' ? plan.locktime_blocks : DEFAULT_OWNER_SEQUENCE;

  const warnings: string[] = [
    'This PSBT is unsigned. Sign it in an external wallet (e.g. Sparrow), then broadcast the signed hex.',
  ];

  if (path === 'beneficiary') {
    warnings.push(
      `Beneficiary inputs use nSequence=${plan.locktime_blocks}. Transaction version is 2 (CSV).`,
    );
  }

  if (path === 'checkin') {
    warnings.push(
      'Check-in spends every selected UTXO back to the same vault address, resetting relative CSV timers.',
    );
  }

  if (selected.some((u) => !u.confirmed)) {
    warnings.push('Unconfirmed UTXOs were excluded automatically.');
  }

  const psbt = new Psbt({ network: networkParams });
  psbt.setVersion(2);

  const outputScript = bitcoinAddress.toOutputScript(result.address, networkParams);

  for (const utxo of selected) {
    if (result.address_type === 'p2wsh') {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence,
        witnessUtxo: {
          script: outputScript,
          value: BigInt(utxo.valueSats),
        },
        witnessScript,
      });
    } else {
      const controlBlock = hexToBytes(result.taproot_control_block!);
      const leafVersion = result.taproot_leaf_version ?? 0xc0;
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence,
        witnessUtxo: {
          script: outputScript,
          value: BigInt(utxo.valueSats),
        },
        tapLeafScript: [
          {
            leafVersion,
            script: witnessScript,
            controlBlock,
          },
        ],
      });
    }
  }

  psbt.addOutput({
    address: destination,
    value: BigInt(outputSats),
  });

  return {
    psbtBase64: psbt.toBase64(),
    psbtHex: psbt.toHex(),
    path,
    estimatedVsize,
    feeSats,
    totalInputSats,
    outputSats,
    inputCount: selected.length,
    destinationAddress: destination,
    warnings,
  };
};
