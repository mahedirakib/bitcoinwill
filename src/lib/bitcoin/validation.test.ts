import { describe, it, expect } from 'vitest';
import { validatePubkey, validatePlanInput } from './validation';
import { PlanInput } from './types';

describe('Validation Module', () => {
  describe('validatePubkey', () => {
    it('accepts valid compressed public key with 02 prefix', () => {
      const validKey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      expect(validatePubkey(validKey)).toBe(true);
    });

    it('accepts valid compressed public key with 03 prefix', () => {
      const validKey = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      expect(validatePubkey(validKey)).toBe(true);
    });

    it('rejects uncompressed public key (04 prefix)', () => {
      const uncompressedKey = '04e9634f19b165239105436a5c17e3371901c5651581452a32997874747474747411111111111111111111111111111111';
      expect(validatePubkey(uncompressedKey)).toBe(false);
    });

    it('rejects public key with invalid prefix', () => {
      const invalidKey = '05e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      expect(validatePubkey(invalidKey)).toBe(false);
    });

    it('rejects public key that is too short', () => {
      const shortKey = '02e9634f19b165239105436a5c17e3371901c5651581452a3299787474747474';
      expect(validatePubkey(shortKey)).toBe(false);
    });

    it('rejects public key that is too long', () => {
      const longKey = '02e9634f19b165239105436a5c17e3371901c5651581452a32997874747474747444';
      expect(validatePubkey(longKey)).toBe(false);
    });

    it('rejects public key with invalid hex characters', () => {
      const invalidHexKey = '02e9634f19b165239105436a5c17e3371901c5651581452a3299787474747474ZZ';
      expect(validatePubkey(invalidHexKey)).toBe(false);
    });

    it('rejects public key that is not a valid point on the curve', () => {
      const invalidPoint = '020000000000000000000000000000000000000000000000000000000000000000';
      expect(validatePubkey(invalidPoint)).toBe(false);
    });

    it('rejects public key with special characters', () => {
      const specialCharKey = '02e9634f19b165239105436a5c17e3371901c5651581452a3299787474747474!!';
      expect(validatePubkey(specialCharKey)).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validatePubkey('')).toBe(false);
    });

    it('rejects non-hex string', () => {
      expect(validatePubkey('not-a-valid-key')).toBe(false);
    });

    it('accepts mixed case hex', () => {
      const mixedCaseKey = '02E9634F19B165239105436A5C17E3371901C5651581452A329978747474747474';
      expect(validatePubkey(mixedCaseKey)).toBe(true);
    });

    it('accepts lowercase hex', () => {
      const lowercaseKey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      expect(validatePubkey(lowercaseKey)).toBe(true);
    });

    it('accepts uppercase hex', () => {
      const uppercaseKey = '02E9634F19B165239105436A5C17E3371901C5651581452A329978747474747474';
      expect(validatePubkey(uppercaseKey)).toBe(true);
    });

    it('verifies exact length of 66 characters', () => {
      const key66 = '02' + 'a'.repeat(64); // Exactly 66 chars
      expect(validatePubkey(key66)).toBe(true);

      const key65 = '02' + 'a'.repeat(63); // 65 chars
      expect(validatePubkey(key65)).toBe(false);

      const key67 = '02' + 'a'.repeat(65); // 67 chars
      expect(validatePubkey(key67)).toBe(false);
    });
  });

  describe('validatePlanInput', () => {
    const validInput: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      locktime_blocks: 1000,
    };

    it('does not throw for valid input', () => {
      expect(() => validatePlanInput(validInput)).not.toThrow();
    });

    it('throws error for invalid owner public key', () => {
      const invalidInput = {
        ...validInput,
        owner_pubkey: 'invalid-key',
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid Owner Public Key');
    });

    it('throws error for invalid beneficiary public key', () => {
      const invalidInput = {
        ...validInput,
        beneficiary_pubkey: 'invalid-key',
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid Beneficiary Public Key');
    });

    it('throws error when owner and beneficiary keys are identical', () => {
      const invalidInput = {
        ...validInput,
        beneficiary_pubkey: validInput.owner_pubkey,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Owner and Beneficiary public keys must be different');
    });

    it('throws error when owner and beneficiary keys differ only by hex casing', () => {
      const invalidInput = {
        ...validInput,
        owner_pubkey: validInput.owner_pubkey.toUpperCase(),
        beneficiary_pubkey: validInput.owner_pubkey.toLowerCase(),
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Owner and Beneficiary public keys must be different');
    });

    it('rejects opposite-parity compressed keys for Taproot', () => {
      const invalidInput = {
        ...validInput,
        address_type: 'p2tr' as const,
      };

      expect(() => validatePlanInput(invalidInput)).toThrow(
        'Taproot keys must have different x-coordinates',
      );
    });

    it('allows opposite-parity compressed keys for P2WSH', () => {
      const p2wshInput = {
        ...validInput,
        address_type: 'p2wsh' as const,
      };

      expect(() => validatePlanInput(p2wshInput)).not.toThrow();
    });

    it('throws error for locktime of 0', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: 0,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for negative locktime', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: -100,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for locktime exceeding maximum', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: 52561,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for non-integer locktime', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: 1.5,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for NaN locktime', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: Number.NaN,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for runtime string locktime payload', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: '144' as unknown as number,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error for runtime undefined locktime payload', () => {
      const invalidInput = {
        ...validInput,
        locktime_blocks: undefined as unknown as number,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('accepts minimum locktime of 1', () => {
      const validMinInput = {
        ...validInput,
        locktime_blocks: 1,
      };
      expect(() => validatePlanInput(validMinInput)).not.toThrow();
    });

    it('accepts maximum locktime of 52560', () => {
      const validMaxInput = {
        ...validInput,
        locktime_blocks: 52560,
      };
      expect(() => validatePlanInput(validMaxInput)).not.toThrow();
    });

    it('accepts all valid network types', () => {
      const testnetInput = { ...validInput, network: 'testnet' as const };
      expect(() => validatePlanInput(testnetInput)).not.toThrow();

      const mainnetInput = { ...validInput, network: 'mainnet' as const };
      expect(() => validatePlanInput(mainnetInput)).not.toThrow();

      const regtestInput = { ...validInput, network: 'regtest' as const };
      expect(() => validatePlanInput(regtestInput)).not.toThrow();
    });

    it('throws error for unsupported runtime network payload', () => {
      const invalidInput = {
        ...validInput,
        network: 'signet' as unknown as PlanInput['network'],
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid network');
    });

    it('throws error for unsupported inheritance type runtime payload', () => {
      const invalidInput = {
        ...validInput,
        inheritance_type: 'legacy_recovery' as unknown as PlanInput['inheritance_type'],
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid inheritance type');
    });

    it('accepts input with optional plan_label', () => {
      const inputWithLabel = {
        ...validInput,
        plan_label: 'My Test Plan',
      };
      expect(() => validatePlanInput(inputWithLabel)).not.toThrow();
    });

    it('accepts input without optional plan_label', () => {
      const { plan_label: _plan_label, ...inputWithoutLabel } = validInput;
      expect(() => validatePlanInput(inputWithoutLabel as PlanInput)).not.toThrow();
    });

    it('accepts a valid hardware-wallet owner key origin', () => {
      const input = {
        ...validInput,
        owner_key_origin: {
          device: 'ledger' as const,
          derivation_path: "m/84'/1'/0'/0/0",
          fingerprint: '00a1b2c3',
        },
      };

      expect(() => validatePlanInput(input)).not.toThrow();
    });

    it('rejects malformed hardware-wallet origin metadata', () => {
      expect(() => validatePlanInput({
        ...validInput,
        owner_key_origin: {
          device: 'ledger',
          derivation_path: '84/1/0',
          fingerprint: 'xyz',
        },
      } as unknown as PlanInput)).toThrow('Invalid owner derivation path');
    });

    it('validates owner key before beneficiary key', () => {
      const invalidInput = {
        ...validInput,
        owner_pubkey: 'invalid-owner',
        beneficiary_pubkey: 'invalid-beneficiary',
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid Owner Public Key');
    });

    it('validates beneficiary key before checking key equality', () => {
      const invalidInput = {
        ...validInput,
        owner_pubkey: 'invalid-owner',
        beneficiary_pubkey: validInput.owner_pubkey,
      };
      expect(() => validatePlanInput(invalidInput)).toThrow('Invalid Owner Public Key');
    });

    describe('recovery_method and sss_config consistency', () => {
      it('accepts social recovery with a valid 2-of-3 config', () => {
        const input = { ...validInput, recovery_method: 'social', sss_config: { threshold: 2, total: 3 } } as PlanInput;
        expect(() => validatePlanInput(input)).not.toThrow();
      });

      it('accepts social recovery with a valid 3-of-5 config', () => {
        const input = { ...validInput, recovery_method: 'social', sss_config: { threshold: 3, total: 5 } } as PlanInput;
        expect(() => validatePlanInput(input)).not.toThrow();
      });

      it('accepts single recovery with no sss_config', () => {
        const input = { ...validInput, recovery_method: 'single' } as PlanInput;
        expect(() => validatePlanInput(input)).not.toThrow();
      });

      it('throws when social recovery is requested without an sss_config', () => {
        const input = { ...validInput, recovery_method: 'social' } as PlanInput;
        expect(() => validatePlanInput(input)).toThrow('valid SSS configuration');
      });

      it('throws when social recovery uses an unsupported sss_config', () => {
        const input = {
          ...validInput,
          recovery_method: 'social',
          sss_config: { threshold: 2, total: 5 },
        } as unknown as PlanInput;
        expect(() => validatePlanInput(input)).toThrow('valid SSS configuration');
      });

      it('throws when single recovery includes an sss_config', () => {
        const input = {
          ...validInput,
          recovery_method: 'single',
          sss_config: { threshold: 2, total: 3 },
        } as PlanInput;
        expect(() => validatePlanInput(input)).toThrow('must not include an SSS configuration');
      });

      it('throws when an sss_config is present without a recovery_method', () => {
        const input = { ...validInput, sss_config: { threshold: 2, total: 3 } } as PlanInput;
        expect(() => validatePlanInput(input)).toThrow('recovery_method to be set to "social"');
      });

      it('throws for an unsupported recovery_method value', () => {
        const input = { ...validInput, recovery_method: 'multisig' } as unknown as PlanInput;
        expect(() => validatePlanInput(input)).toThrow('Invalid recovery method');
      });
    });
  });
});
