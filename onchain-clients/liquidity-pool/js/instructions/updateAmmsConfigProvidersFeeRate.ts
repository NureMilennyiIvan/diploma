/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getBytesDecoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  transformEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IAccountSignerMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlyAccount,
  type ReadonlyUint8Array,
  type TransactionSigner,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { LIQUIDITY_POOL_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE_DISCRIMINATOR =
  new Uint8Array([202, 201, 73, 47, 40, 32, 173, 196]);

export function getUpdateAmmsConfigProvidersFeeRateDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE_DISCRIMINATOR
  );
}

export type UpdateAmmsConfigProvidersFeeRateInstruction<
  TProgram extends string = typeof LIQUIDITY_POOL_PROGRAM_ADDRESS,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TAccountAmmsConfigsManager extends string | IAccountMeta<string> = string,
  TAccountAmmsConfig extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountAuthority extends string
        ? WritableSignerAccount<TAccountAuthority> &
            IAccountSignerMeta<TAccountAuthority>
        : TAccountAuthority,
      TAccountAmmsConfigsManager extends string
        ? ReadonlyAccount<TAccountAmmsConfigsManager>
        : TAccountAmmsConfigsManager,
      TAccountAmmsConfig extends string
        ? WritableAccount<TAccountAmmsConfig>
        : TAccountAmmsConfig,
      ...TRemainingAccounts,
    ]
  >;

export type UpdateAmmsConfigProvidersFeeRateInstructionData = {
  discriminator: ReadonlyUint8Array;
  newProvidersFeeRateBasisPoints: number;
};

export type UpdateAmmsConfigProvidersFeeRateInstructionDataArgs = {
  newProvidersFeeRateBasisPoints: number;
};

export function getUpdateAmmsConfigProvidersFeeRateInstructionDataEncoder(): Encoder<UpdateAmmsConfigProvidersFeeRateInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
      ['newProvidersFeeRateBasisPoints', getU16Encoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE_DISCRIMINATOR,
    })
  );
}

export function getUpdateAmmsConfigProvidersFeeRateInstructionDataDecoder(): Decoder<UpdateAmmsConfigProvidersFeeRateInstructionData> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['newProvidersFeeRateBasisPoints', getU16Decoder()],
  ]);
}

export function getUpdateAmmsConfigProvidersFeeRateInstructionDataCodec(): Codec<
  UpdateAmmsConfigProvidersFeeRateInstructionDataArgs,
  UpdateAmmsConfigProvidersFeeRateInstructionData
> {
  return combineCodec(
    getUpdateAmmsConfigProvidersFeeRateInstructionDataEncoder(),
    getUpdateAmmsConfigProvidersFeeRateInstructionDataDecoder()
  );
}

export type UpdateAmmsConfigProvidersFeeRateAsyncInput<
  TAccountAuthority extends string = string,
  TAccountAmmsConfigsManager extends string = string,
  TAccountAmmsConfig extends string = string,
> = {
  authority: TransactionSigner<TAccountAuthority>;
  ammsConfigsManager?: Address<TAccountAmmsConfigsManager>;
  ammsConfig: Address<TAccountAmmsConfig>;
  newProvidersFeeRateBasisPoints: UpdateAmmsConfigProvidersFeeRateInstructionDataArgs['newProvidersFeeRateBasisPoints'];
};

export async function getUpdateAmmsConfigProvidersFeeRateInstructionAsync<
  TAccountAuthority extends string,
  TAccountAmmsConfigsManager extends string,
  TAccountAmmsConfig extends string,
  TProgramAddress extends Address = typeof LIQUIDITY_POOL_PROGRAM_ADDRESS,
>(
  input: UpdateAmmsConfigProvidersFeeRateAsyncInput<
    TAccountAuthority,
    TAccountAmmsConfigsManager,
    TAccountAmmsConfig
  >,
  config?: { programAddress?: TProgramAddress }
): Promise<
  UpdateAmmsConfigProvidersFeeRateInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountAmmsConfigsManager,
    TAccountAmmsConfig
  >
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? LIQUIDITY_POOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: true },
    ammsConfigsManager: {
      value: input.ammsConfigsManager ?? null,
      isWritable: false,
    },
    ammsConfig: { value: input.ammsConfig ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.ammsConfigsManager.value) {
    accounts.ammsConfigsManager.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([
            97, 109, 109, 115, 95, 99, 111, 110, 102, 105, 103, 115, 95, 109,
            97, 110, 97, 103, 101, 114,
          ])
        ),
      ],
    });
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.ammsConfigsManager),
      getAccountMeta(accounts.ammsConfig),
    ],
    programAddress,
    data: getUpdateAmmsConfigProvidersFeeRateInstructionDataEncoder().encode(
      args as UpdateAmmsConfigProvidersFeeRateInstructionDataArgs
    ),
  } as UpdateAmmsConfigProvidersFeeRateInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountAmmsConfigsManager,
    TAccountAmmsConfig
  >;

  return instruction;
}

export type UpdateAmmsConfigProvidersFeeRateInput<
  TAccountAuthority extends string = string,
  TAccountAmmsConfigsManager extends string = string,
  TAccountAmmsConfig extends string = string,
> = {
  authority: TransactionSigner<TAccountAuthority>;
  ammsConfigsManager: Address<TAccountAmmsConfigsManager>;
  ammsConfig: Address<TAccountAmmsConfig>;
  newProvidersFeeRateBasisPoints: UpdateAmmsConfigProvidersFeeRateInstructionDataArgs['newProvidersFeeRateBasisPoints'];
};

export function getUpdateAmmsConfigProvidersFeeRateInstruction<
  TAccountAuthority extends string,
  TAccountAmmsConfigsManager extends string,
  TAccountAmmsConfig extends string,
  TProgramAddress extends Address = typeof LIQUIDITY_POOL_PROGRAM_ADDRESS,
>(
  input: UpdateAmmsConfigProvidersFeeRateInput<
    TAccountAuthority,
    TAccountAmmsConfigsManager,
    TAccountAmmsConfig
  >,
  config?: { programAddress?: TProgramAddress }
): UpdateAmmsConfigProvidersFeeRateInstruction<
  TProgramAddress,
  TAccountAuthority,
  TAccountAmmsConfigsManager,
  TAccountAmmsConfig
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? LIQUIDITY_POOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: true },
    ammsConfigsManager: {
      value: input.ammsConfigsManager ?? null,
      isWritable: false,
    },
    ammsConfig: { value: input.ammsConfig ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.ammsConfigsManager),
      getAccountMeta(accounts.ammsConfig),
    ],
    programAddress,
    data: getUpdateAmmsConfigProvidersFeeRateInstructionDataEncoder().encode(
      args as UpdateAmmsConfigProvidersFeeRateInstructionDataArgs
    ),
  } as UpdateAmmsConfigProvidersFeeRateInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountAmmsConfigsManager,
    TAccountAmmsConfig
  >;

  return instruction;
}

export type ParsedUpdateAmmsConfigProvidersFeeRateInstruction<
  TProgram extends string = typeof LIQUIDITY_POOL_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    authority: TAccountMetas[0];
    ammsConfigsManager: TAccountMetas[1];
    ammsConfig: TAccountMetas[2];
  };
  data: UpdateAmmsConfigProvidersFeeRateInstructionData;
};

export function parseUpdateAmmsConfigProvidersFeeRateInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedUpdateAmmsConfigProvidersFeeRateInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 3) {
    // TODO: Coded error.
    throw new Error('Not enough accounts');
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts![accountIndex]!;
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      authority: getNextAccount(),
      ammsConfigsManager: getNextAccount(),
      ammsConfig: getNextAccount(),
    },
    data: getUpdateAmmsConfigProvidersFeeRateInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
