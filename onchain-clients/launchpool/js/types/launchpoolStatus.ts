/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export enum LaunchpoolStatus {
  Uninitialized,
  Initialized,
  Launched,
  Finished,
  ClaimedProtocolReward,
}

export type LaunchpoolStatusArgs = LaunchpoolStatus;

export function getLaunchpoolStatusEncoder(): Encoder<LaunchpoolStatusArgs> {
  return getEnumEncoder(LaunchpoolStatus);
}

export function getLaunchpoolStatusDecoder(): Decoder<LaunchpoolStatus> {
  return getEnumDecoder(LaunchpoolStatus);
}

export function getLaunchpoolStatusCodec(): Codec<
  LaunchpoolStatusArgs,
  LaunchpoolStatus
> {
  return combineCodec(
    getLaunchpoolStatusEncoder(),
    getLaunchpoolStatusDecoder()
  );
}
