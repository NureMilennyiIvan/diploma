/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  isProgramError,
  type Address,
  type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  type SolanaError,
} from '@solana/kit';
import { LAUNCHPOOL_PROGRAM_ADDRESS } from '../programs';

/** StakePositionAlreadyInitialized: Stake position is already initialized. */
export const LAUNCHPOOL_ERROR__STAKE_POSITION_ALREADY_INITIALIZED = 0x1770; // 6000
/** InvalidStakePositionStateForOpen: Invalid state for opening a stake position. */
export const LAUNCHPOOL_ERROR__INVALID_STAKE_POSITION_STATE_FOR_OPEN = 0x1771; // 6001
/** StakePositionNotOpened: Stake position is not opened. */
export const LAUNCHPOOL_ERROR__STAKE_POSITION_NOT_OPENED = 0x1772; // 6002
/** MismatchedLaunchpool: Launchpool provided does not match the one stored in the position. */
export const LAUNCHPOOL_ERROR__MISMATCHED_LAUNCHPOOL = 0x1773; // 6003
/** StakeAmountIsZero: Stake amount must be greater than zero. */
export const LAUNCHPOOL_ERROR__STAKE_AMOUNT_IS_ZERO = 0x1774; // 6004
/** StakeBelowMinimum: Stake amount is below the minimum allowed. */
export const LAUNCHPOOL_ERROR__STAKE_BELOW_MINIMUM = 0x1775; // 6005
/** StakeAboveMaximum: Stake amount exceeds the maximum allowed. */
export const LAUNCHPOOL_ERROR__STAKE_ABOVE_MAXIMUM = 0x1776; // 6006
/** RewardAccumulationOverflow: Overflow occurred during reward accumulation. */
export const LAUNCHPOOL_ERROR__REWARD_ACCUMULATION_OVERFLOW = 0x1777; // 6007
/** RewardDebtExceedsAccrued: Reward debt is greater than total accrued reward. */
export const LAUNCHPOOL_ERROR__REWARD_DEBT_EXCEEDS_ACCRUED = 0x1778; // 6008
/** RewardOverflow: Overflow occurred while adding pending reward. */
export const LAUNCHPOOL_ERROR__REWARD_OVERFLOW = 0x1779; // 6009
/** StakeOverflow: Overflow occurred while increasing staked amount. */
export const LAUNCHPOOL_ERROR__STAKE_OVERFLOW = 0x177a; // 6010
/** RewardDebtCalculationOverflow: Overflow occurred while calculating reward debt. */
export const LAUNCHPOOL_ERROR__REWARD_DEBT_CALCULATION_OVERFLOW = 0x177b; // 6011

export type LaunchpoolError =
  | typeof LAUNCHPOOL_ERROR__INVALID_STAKE_POSITION_STATE_FOR_OPEN
  | typeof LAUNCHPOOL_ERROR__MISMATCHED_LAUNCHPOOL
  | typeof LAUNCHPOOL_ERROR__REWARD_ACCUMULATION_OVERFLOW
  | typeof LAUNCHPOOL_ERROR__REWARD_DEBT_CALCULATION_OVERFLOW
  | typeof LAUNCHPOOL_ERROR__REWARD_DEBT_EXCEEDS_ACCRUED
  | typeof LAUNCHPOOL_ERROR__REWARD_OVERFLOW
  | typeof LAUNCHPOOL_ERROR__STAKE_ABOVE_MAXIMUM
  | typeof LAUNCHPOOL_ERROR__STAKE_AMOUNT_IS_ZERO
  | typeof LAUNCHPOOL_ERROR__STAKE_BELOW_MINIMUM
  | typeof LAUNCHPOOL_ERROR__STAKE_OVERFLOW
  | typeof LAUNCHPOOL_ERROR__STAKE_POSITION_ALREADY_INITIALIZED
  | typeof LAUNCHPOOL_ERROR__STAKE_POSITION_NOT_OPENED;

let launchpoolErrorMessages: Record<LaunchpoolError, string> | undefined;
if (process.env.NODE_ENV !== 'production') {
  launchpoolErrorMessages = {
    [LAUNCHPOOL_ERROR__INVALID_STAKE_POSITION_STATE_FOR_OPEN]: `Invalid state for opening a stake position.`,
    [LAUNCHPOOL_ERROR__MISMATCHED_LAUNCHPOOL]: `Launchpool provided does not match the one stored in the position.`,
    [LAUNCHPOOL_ERROR__REWARD_ACCUMULATION_OVERFLOW]: `Overflow occurred during reward accumulation.`,
    [LAUNCHPOOL_ERROR__REWARD_DEBT_CALCULATION_OVERFLOW]: `Overflow occurred while calculating reward debt.`,
    [LAUNCHPOOL_ERROR__REWARD_DEBT_EXCEEDS_ACCRUED]: `Reward debt is greater than total accrued reward.`,
    [LAUNCHPOOL_ERROR__REWARD_OVERFLOW]: `Overflow occurred while adding pending reward.`,
    [LAUNCHPOOL_ERROR__STAKE_ABOVE_MAXIMUM]: `Stake amount exceeds the maximum allowed.`,
    [LAUNCHPOOL_ERROR__STAKE_AMOUNT_IS_ZERO]: `Stake amount must be greater than zero.`,
    [LAUNCHPOOL_ERROR__STAKE_BELOW_MINIMUM]: `Stake amount is below the minimum allowed.`,
    [LAUNCHPOOL_ERROR__STAKE_OVERFLOW]: `Overflow occurred while increasing staked amount.`,
    [LAUNCHPOOL_ERROR__STAKE_POSITION_ALREADY_INITIALIZED]: `Stake position is already initialized.`,
    [LAUNCHPOOL_ERROR__STAKE_POSITION_NOT_OPENED]: `Stake position is not opened.`,
  };
}

export function getLaunchpoolErrorMessage(code: LaunchpoolError): string {
  if (process.env.NODE_ENV !== 'production') {
    return (launchpoolErrorMessages as Record<LaunchpoolError, string>)[code];
  }

  return 'Error message not available in production bundles.';
}

export function isLaunchpoolError<TProgramErrorCode extends LaunchpoolError>(
  error: unknown,
  transactionMessage: {
    instructions: Record<number, { programAddress: Address }>;
  },
  code?: TProgramErrorCode
): error is SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> &
  Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> {
  return isProgramError<TProgramErrorCode>(
    error,
    transactionMessage,
    LAUNCHPOOL_PROGRAM_ADDRESS,
    code
  );
}
