import { describe, expect, it } from 'vitest';
import {
  STEP_ORDER,
  getStepDefinition,
  getNextStep,
  getPreviousStep,
  canTransitionTo,
  getTotalSteps,
} from './stateMachine';
import type { WizardState } from './types';
import { createInitialState } from './types';

describe('stateMachine', () => {
  const validPubkey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
  const validPubkey2 = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';

  const createState = (overrides: Partial<WizardState> = {}): WizardState => ({
    ...createInitialState('testnet'),
    ...overrides,
  });

  describe('STEP_ORDER', () => {
    it('has correct step sequence', () => {
      expect(STEP_ORDER).toEqual(['TYPE', 'KEYS', 'TIMELOCK', 'REVIEW', 'RESULT']);
    });
  });

  describe('getStepDefinition', () => {
    it('returns definition for each step', () => {
      STEP_ORDER.forEach((step) => {
        const def = getStepDefinition(step);
        expect(def.id).toBe(step);
        expect(typeof def.stepNumber).toBe('number');
        expect(typeof def.canGoBack).toBe('boolean');
        expect(typeof def.canGoNext).toBe('boolean');
        expect(typeof def.validate).toBe('function');
      });
    });

    it('has correct navigation properties', () => {
      expect(getStepDefinition('TYPE')).toMatchObject({ canGoBack: false, canGoNext: true });
      expect(getStepDefinition('KEYS')).toMatchObject({ canGoBack: true, canGoNext: true });
      expect(getStepDefinition('TIMELOCK')).toMatchObject({ canGoBack: true, canGoNext: true });
      expect(getStepDefinition('REVIEW')).toMatchObject({ canGoBack: true, canGoNext: false });
      expect(getStepDefinition('RESULT')).toMatchObject({ canGoBack: false, canGoNext: false });
    });
  });

  describe('getNextStep', () => {
    it('returns next step in sequence', () => {
      expect(getNextStep('TYPE')).toBe('KEYS');
      expect(getNextStep('KEYS')).toBe('TIMELOCK');
      expect(getNextStep('TIMELOCK')).toBe('REVIEW');
      expect(getNextStep('REVIEW')).toBe('RESULT');
    });

    it('returns null for RESULT', () => {
      expect(getNextStep('RESULT')).toBeNull();
    });

    it('returns null for unknown step', () => {
      expect(getNextStep('UNKNOWN' as never)).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    it('returns previous step in sequence', () => {
      expect(getPreviousStep('KEYS')).toBe('TYPE');
      expect(getPreviousStep('TIMELOCK')).toBe('KEYS');
      expect(getPreviousStep('REVIEW')).toBe('TIMELOCK');
      expect(getPreviousStep('RESULT')).toBe('REVIEW');
    });

    it('returns null for TYPE', () => {
      expect(getPreviousStep('TYPE')).toBeNull();
    });

    it('returns null for unknown step', () => {
      expect(getPreviousStep('UNKNOWN' as never)).toBeNull();
    });
  });

  describe('canTransitionTo', () => {
    it('allows staying on same step', () => {
      const state = createState();
      expect(canTransitionTo('TYPE', 'TYPE', state)).toBe(true);
      expect(canTransitionTo('KEYS', 'KEYS', state)).toBe(true);
    });

    it('allows forward transition when validation passes', () => {
      const state = createState({
        step: 'TYPE',
        input: { ...createInitialState('testnet').input, recovery_method: 'single' },
      });
      expect(canTransitionTo('TYPE', 'KEYS', state)).toBe(true);
    });

    it('blocks forward transition when TYPE validation fails (missing SSS config)', () => {
      const state = createState({
        step: 'TYPE',
        input: { ...createInitialState('testnet').input, recovery_method: 'social' },
      });
      expect(canTransitionTo('TYPE', 'KEYS', state)).toBe(false);
    });

    it('allows forward transition from TYPE with SSS config set', () => {
      const state = createState({
        step: 'TYPE',
        input: {
          ...createInitialState('testnet').input,
          recovery_method: 'social',
          sss_config: { threshold: 2, total: 3 },
        },
      });
      expect(canTransitionTo('TYPE', 'KEYS', state)).toBe(true);
    });

    it('blocks forward transition when KEYS validation fails (invalid pubkey)', () => {
      const state = createState({
        step: 'KEYS',
        input: { ...createInitialState('testnet').input, owner_pubkey: 'invalid' },
      });
      expect(canTransitionTo('KEYS', 'TIMELOCK', state)).toBe(false);
    });

    it('allows forward transition from KEYS with valid pubkeys', () => {
      const state = createState({
        step: 'KEYS',
        input: {
          ...createInitialState('testnet').input,
          owner_pubkey: validPubkey,
          beneficiary_pubkey: validPubkey2,
        },
      });
      expect(canTransitionTo('KEYS', 'TIMELOCK', state)).toBe(true);
    });

    it('blocks forward transition when keys are identical', () => {
      const state = createState({
        step: 'KEYS',
        input: {
          ...createInitialState('testnet').input,
          owner_pubkey: validPubkey,
          beneficiary_pubkey: validPubkey,
        },
      });
      expect(canTransitionTo('KEYS', 'TIMELOCK', state)).toBe(false);
    });

    it('allows forward transition from KEYS for social recovery (no beneficiary key needed)', () => {
      const state = createState({
        step: 'KEYS',
        input: {
          ...createInitialState('testnet').input,
          recovery_method: 'social',
          sss_config: { threshold: 2, total: 3 },
          owner_pubkey: validPubkey,
          beneficiary_pubkey: '',
        },
      });
      expect(canTransitionTo('KEYS', 'TIMELOCK', state)).toBe(true);
    });

    it('allows backward transition when current step allows going back', () => {
      const state = createState({ step: 'KEYS' });
      expect(canTransitionTo('KEYS', 'TYPE', state)).toBe(true);
    });

    it('blocks backward transition from TYPE', () => {
      const state = createState({ step: 'TYPE' });
      expect(canTransitionTo('TYPE', 'TYPE', state)).toBe(true);
      expect(getStepDefinition('TYPE').canGoBack).toBe(false);
    });

    it('allows transition to RESULT only from REVIEW with result set', () => {
      const stateWithResult = createState({
        step: 'REVIEW',
        result: {} as never,
      });
      expect(canTransitionTo('REVIEW', 'RESULT', stateWithResult)).toBe(true);
    });

    it('blocks transition to RESULT from REVIEW without result', () => {
      const stateWithoutResult = createState({ step: 'REVIEW', result: null });
      expect(canTransitionTo('REVIEW', 'RESULT', stateWithoutResult)).toBe(false);
    });

    it('blocks transition to RESULT from non-REVIEW steps', () => {
      const state = createState({ step: 'TIMELOCK' });
      expect(canTransitionTo('TIMELOCK', 'RESULT', state)).toBe(false);
    });

    it('allows all forward transitions from TIMELOCK', () => {
      const state = createState({ step: 'TIMELOCK' });
      expect(canTransitionTo('TIMELOCK', 'REVIEW', state)).toBe(true);
    });

    it('blocks forward transition from REVIEW', () => {
      const state = createState({ step: 'REVIEW' });
      expect(canTransitionTo('REVIEW', 'RESULT', state)).toBe(false);
    });
  });

  describe('getTotalSteps', () => {
    it('returns number of non-RESULT steps', () => {
      expect(getTotalSteps()).toBe(4);
    });
  });

  describe('step definitions have correct step numbers', () => {
    it('has sequential step numbers', () => {
      expect(getStepDefinition('TYPE').stepNumber).toBe(1);
      expect(getStepDefinition('KEYS').stepNumber).toBe(2);
      expect(getStepDefinition('TIMELOCK').stepNumber).toBe(3);
      expect(getStepDefinition('REVIEW').stepNumber).toBe(4);
      expect(getStepDefinition('RESULT').stepNumber).toBe(5);
    });
  });
});
