/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  fixDecoderSize,
  fixEncoderSize,
  getAddressDecoder,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Account,
  type Address,
  type Codec,
  type Decoder,
  type EncodedAccount,
  type Encoder,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
  type ReadonlyUint8Array,
} from '@solana/kit';

export const LAUNCHPOOLS_CONFIGS_MANAGER_DISCRIMINATOR = new Uint8Array([
  56, 218, 17, 176, 231, 150, 7, 11,
]);

export function getLaunchpoolsConfigsManagerDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    LAUNCHPOOLS_CONFIGS_MANAGER_DISCRIMINATOR
  );
}

export type LaunchpoolsConfigsManager = {
  discriminator: ReadonlyUint8Array;
  authority: Address;
  headAuthority: Address;
  configsCount: bigint;
  bump: number;
};

export type LaunchpoolsConfigsManagerArgs = {
  authority: Address;
  headAuthority: Address;
  configsCount: number | bigint;
  bump: number;
};

export function getLaunchpoolsConfigsManagerEncoder(): Encoder<LaunchpoolsConfigsManagerArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
      ['authority', getAddressEncoder()],
      ['headAuthority', getAddressEncoder()],
      ['configsCount', getU64Encoder()],
      ['bump', getU8Encoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: LAUNCHPOOLS_CONFIGS_MANAGER_DISCRIMINATOR,
    })
  );
}

export function getLaunchpoolsConfigsManagerDecoder(): Decoder<LaunchpoolsConfigsManager> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['authority', getAddressDecoder()],
    ['headAuthority', getAddressDecoder()],
    ['configsCount', getU64Decoder()],
    ['bump', getU8Decoder()],
  ]);
}

export function getLaunchpoolsConfigsManagerCodec(): Codec<
  LaunchpoolsConfigsManagerArgs,
  LaunchpoolsConfigsManager
> {
  return combineCodec(
    getLaunchpoolsConfigsManagerEncoder(),
    getLaunchpoolsConfigsManagerDecoder()
  );
}

export function decodeLaunchpoolsConfigsManager<
  TAddress extends string = string,
>(
  encodedAccount: EncodedAccount<TAddress>
): Account<LaunchpoolsConfigsManager, TAddress>;
export function decodeLaunchpoolsConfigsManager<
  TAddress extends string = string,
>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<LaunchpoolsConfigsManager, TAddress>;
export function decodeLaunchpoolsConfigsManager<
  TAddress extends string = string,
>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
):
  | Account<LaunchpoolsConfigsManager, TAddress>
  | MaybeAccount<LaunchpoolsConfigsManager, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getLaunchpoolsConfigsManagerDecoder()
  );
}

export async function fetchLaunchpoolsConfigsManager<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<LaunchpoolsConfigsManager, TAddress>> {
  const maybeAccount = await fetchMaybeLaunchpoolsConfigsManager(
    rpc,
    address,
    config
  );
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeLaunchpoolsConfigsManager<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<LaunchpoolsConfigsManager, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeLaunchpoolsConfigsManager(maybeAccount);
}

export async function fetchAllLaunchpoolsConfigsManager(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<LaunchpoolsConfigsManager>[]> {
  const maybeAccounts = await fetchAllMaybeLaunchpoolsConfigsManager(
    rpc,
    addresses,
    config
  );
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybeLaunchpoolsConfigsManager(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<LaunchpoolsConfigsManager>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) =>
    decodeLaunchpoolsConfigsManager(maybeAccount)
  );
}

export function getLaunchpoolsConfigsManagerSize(): number {
  return 81;
}
