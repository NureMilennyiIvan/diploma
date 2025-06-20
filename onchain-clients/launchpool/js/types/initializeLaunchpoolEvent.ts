/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  getI64Decoder,
  getI64Encoder,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';
import {
  getQ64128Decoder,
  getQ64128Encoder,
  type Q64128,
  type Q64128Args,
} from '.';

export type InitializeLaunchpoolEvent = {
  authority: Address;
  launchpool: Address;
  launchpoolsConfig: Address;
  rewardMint: Address;
  rewardVault: Address;
  initialRewardAmount: bigint;
  protocolRewardAmount: bigint;
  participantsRewardAmount: bigint;
  participantsRewardLeftToObtain: bigint;
  protocolRewardLeftToObtain: bigint;
  participantsRewardLeftToDistribute: Q64128;
  minPositionSize: bigint;
  maxPositionSize: bigint;
  timestamp: bigint;
};

export type InitializeLaunchpoolEventArgs = {
  authority: Address;
  launchpool: Address;
  launchpoolsConfig: Address;
  rewardMint: Address;
  rewardVault: Address;
  initialRewardAmount: number | bigint;
  protocolRewardAmount: number | bigint;
  participantsRewardAmount: number | bigint;
  participantsRewardLeftToObtain: number | bigint;
  protocolRewardLeftToObtain: number | bigint;
  participantsRewardLeftToDistribute: Q64128Args;
  minPositionSize: number | bigint;
  maxPositionSize: number | bigint;
  timestamp: number | bigint;
};

export function getInitializeLaunchpoolEventEncoder(): Encoder<InitializeLaunchpoolEventArgs> {
  return getStructEncoder([
    ['authority', getAddressEncoder()],
    ['launchpool', getAddressEncoder()],
    ['launchpoolsConfig', getAddressEncoder()],
    ['rewardMint', getAddressEncoder()],
    ['rewardVault', getAddressEncoder()],
    ['initialRewardAmount', getU64Encoder()],
    ['protocolRewardAmount', getU64Encoder()],
    ['participantsRewardAmount', getU64Encoder()],
    ['participantsRewardLeftToObtain', getU64Encoder()],
    ['protocolRewardLeftToObtain', getU64Encoder()],
    ['participantsRewardLeftToDistribute', getQ64128Encoder()],
    ['minPositionSize', getU64Encoder()],
    ['maxPositionSize', getU64Encoder()],
    ['timestamp', getI64Encoder()],
  ]);
}

export function getInitializeLaunchpoolEventDecoder(): Decoder<InitializeLaunchpoolEvent> {
  return getStructDecoder([
    ['authority', getAddressDecoder()],
    ['launchpool', getAddressDecoder()],
    ['launchpoolsConfig', getAddressDecoder()],
    ['rewardMint', getAddressDecoder()],
    ['rewardVault', getAddressDecoder()],
    ['initialRewardAmount', getU64Decoder()],
    ['protocolRewardAmount', getU64Decoder()],
    ['participantsRewardAmount', getU64Decoder()],
    ['participantsRewardLeftToObtain', getU64Decoder()],
    ['protocolRewardLeftToObtain', getU64Decoder()],
    ['participantsRewardLeftToDistribute', getQ64128Decoder()],
    ['minPositionSize', getU64Decoder()],
    ['maxPositionSize', getU64Decoder()],
    ['timestamp', getI64Decoder()],
  ]);
}

export function getInitializeLaunchpoolEventCodec(): Codec<
  InitializeLaunchpoolEventArgs,
  InitializeLaunchpoolEvent
> {
  return combineCodec(
    getInitializeLaunchpoolEventEncoder(),
    getInitializeLaunchpoolEventDecoder()
  );
}
