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
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  getU64Decoder,
  getU64Encoder,
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
import { LAUNCHPOOL_PROGRAM_ADDRESS } from '../programs';
import {
  expectAddress,
  getAccountMetaFactory,
  type ResolvedAccount,
} from '../shared';

export const INITIALIZE_LAUNCHPOOLS_CONFIG_DISCRIMINATOR = new Uint8Array([
  29, 24, 244, 80, 150, 166, 49, 195,
]);

export function getInitializeLaunchpoolsConfigDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    INITIALIZE_LAUNCHPOOLS_CONFIG_DISCRIMINATOR
  );
}

export type InitializeLaunchpoolsConfigInstruction<
  TProgram extends string = typeof LAUNCHPOOL_PROGRAM_ADDRESS,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TAccountLaunchpoolsConfigsManager extends
    | string
    | IAccountMeta<string> = string,
  TAccountLaunchpoolsConfig extends string | IAccountMeta<string> = string,
  TAccountRewardAuthority extends string | IAccountMeta<string> = string,
  TAccountStakableMint extends string | IAccountMeta<string> = string,
  TAccountRent extends
    | string
    | IAccountMeta<string> = 'SysvarRent111111111111111111111111111111111',
  TAccountSystemProgram extends
    | string
    | IAccountMeta<string> = '11111111111111111111111111111111',
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountAuthority extends string
        ? WritableSignerAccount<TAccountAuthority> &
            IAccountSignerMeta<TAccountAuthority>
        : TAccountAuthority,
      TAccountLaunchpoolsConfigsManager extends string
        ? WritableAccount<TAccountLaunchpoolsConfigsManager>
        : TAccountLaunchpoolsConfigsManager,
      TAccountLaunchpoolsConfig extends string
        ? WritableAccount<TAccountLaunchpoolsConfig>
        : TAccountLaunchpoolsConfig,
      TAccountRewardAuthority extends string
        ? ReadonlyAccount<TAccountRewardAuthority>
        : TAccountRewardAuthority,
      TAccountStakableMint extends string
        ? ReadonlyAccount<TAccountStakableMint>
        : TAccountStakableMint,
      TAccountRent extends string
        ? ReadonlyAccount<TAccountRent>
        : TAccountRent,
      TAccountSystemProgram extends string
        ? ReadonlyAccount<TAccountSystemProgram>
        : TAccountSystemProgram,
      ...TRemainingAccounts,
    ]
  >;

export type InitializeLaunchpoolsConfigInstructionData = {
  discriminator: ReadonlyUint8Array;
  minPositionSize: bigint;
  maxPositionSize: bigint;
  protocolRewardShareBasisPoints: number;
  duration: bigint;
};

export type InitializeLaunchpoolsConfigInstructionDataArgs = {
  minPositionSize: number | bigint;
  maxPositionSize: number | bigint;
  protocolRewardShareBasisPoints: number;
  duration: number | bigint;
};

export function getInitializeLaunchpoolsConfigInstructionDataEncoder(): Encoder<InitializeLaunchpoolsConfigInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
      ['minPositionSize', getU64Encoder()],
      ['maxPositionSize', getU64Encoder()],
      ['protocolRewardShareBasisPoints', getU16Encoder()],
      ['duration', getU64Encoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: INITIALIZE_LAUNCHPOOLS_CONFIG_DISCRIMINATOR,
    })
  );
}

export function getInitializeLaunchpoolsConfigInstructionDataDecoder(): Decoder<InitializeLaunchpoolsConfigInstructionData> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['minPositionSize', getU64Decoder()],
    ['maxPositionSize', getU64Decoder()],
    ['protocolRewardShareBasisPoints', getU16Decoder()],
    ['duration', getU64Decoder()],
  ]);
}

export function getInitializeLaunchpoolsConfigInstructionDataCodec(): Codec<
  InitializeLaunchpoolsConfigInstructionDataArgs,
  InitializeLaunchpoolsConfigInstructionData
> {
  return combineCodec(
    getInitializeLaunchpoolsConfigInstructionDataEncoder(),
    getInitializeLaunchpoolsConfigInstructionDataDecoder()
  );
}

export type InitializeLaunchpoolsConfigAsyncInput<
  TAccountAuthority extends string = string,
  TAccountLaunchpoolsConfigsManager extends string = string,
  TAccountLaunchpoolsConfig extends string = string,
  TAccountRewardAuthority extends string = string,
  TAccountStakableMint extends string = string,
  TAccountRent extends string = string,
  TAccountSystemProgram extends string = string,
> = {
  authority: TransactionSigner<TAccountAuthority>;
  launchpoolsConfigsManager?: Address<TAccountLaunchpoolsConfigsManager>;
  launchpoolsConfig?: Address<TAccountLaunchpoolsConfig>;
  rewardAuthority: Address<TAccountRewardAuthority>;
  stakableMint: Address<TAccountStakableMint>;
  rent?: Address<TAccountRent>;
  systemProgram?: Address<TAccountSystemProgram>;
  minPositionSize: InitializeLaunchpoolsConfigInstructionDataArgs['minPositionSize'];
  maxPositionSize: InitializeLaunchpoolsConfigInstructionDataArgs['maxPositionSize'];
  protocolRewardShareBasisPoints: InitializeLaunchpoolsConfigInstructionDataArgs['protocolRewardShareBasisPoints'];
  duration: InitializeLaunchpoolsConfigInstructionDataArgs['duration'];
};

export async function getInitializeLaunchpoolsConfigInstructionAsync<
  TAccountAuthority extends string,
  TAccountLaunchpoolsConfigsManager extends string,
  TAccountLaunchpoolsConfig extends string,
  TAccountRewardAuthority extends string,
  TAccountStakableMint extends string,
  TAccountRent extends string,
  TAccountSystemProgram extends string,
  TProgramAddress extends Address = typeof LAUNCHPOOL_PROGRAM_ADDRESS,
>(
  input: InitializeLaunchpoolsConfigAsyncInput<
    TAccountAuthority,
    TAccountLaunchpoolsConfigsManager,
    TAccountLaunchpoolsConfig,
    TAccountRewardAuthority,
    TAccountStakableMint,
    TAccountRent,
    TAccountSystemProgram
  >,
  config?: { programAddress?: TProgramAddress }
): Promise<
  InitializeLaunchpoolsConfigInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountLaunchpoolsConfigsManager,
    TAccountLaunchpoolsConfig,
    TAccountRewardAuthority,
    TAccountStakableMint,
    TAccountRent,
    TAccountSystemProgram
  >
> {
  // Program address.
  const programAddress = config?.programAddress ?? LAUNCHPOOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: true },
    launchpoolsConfigsManager: {
      value: input.launchpoolsConfigsManager ?? null,
      isWritable: true,
    },
    launchpoolsConfig: {
      value: input.launchpoolsConfig ?? null,
      isWritable: true,
    },
    rewardAuthority: {
      value: input.rewardAuthority ?? null,
      isWritable: false,
    },
    stakableMint: { value: input.stakableMint ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.launchpoolsConfigsManager.value) {
    accounts.launchpoolsConfigsManager.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([
            108, 97, 117, 110, 99, 104, 112, 111, 111, 108, 115, 95, 99, 111,
            110, 102, 105, 103, 115, 95, 109, 97, 110, 97, 103, 101, 114,
          ])
        ),
      ],
    });
  }
  if (!accounts.launchpoolsConfig.value) {
    accounts.launchpoolsConfig.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([
            108, 97, 117, 110, 99, 104, 112, 111, 111, 108, 115, 95, 99, 111,
            110, 102, 105, 103,
          ])
        ),
        getAddressEncoder().encode(
          expectAddress(accounts.launchpoolsConfigsManager.value)
        ),
      ],
    });
  }
  if (!accounts.rent.value) {
    accounts.rent.value =
      'SysvarRent111111111111111111111111111111111' as Address<'SysvarRent111111111111111111111111111111111'>;
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.launchpoolsConfigsManager),
      getAccountMeta(accounts.launchpoolsConfig),
      getAccountMeta(accounts.rewardAuthority),
      getAccountMeta(accounts.stakableMint),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
    ],
    programAddress,
    data: getInitializeLaunchpoolsConfigInstructionDataEncoder().encode(
      args as InitializeLaunchpoolsConfigInstructionDataArgs
    ),
  } as InitializeLaunchpoolsConfigInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountLaunchpoolsConfigsManager,
    TAccountLaunchpoolsConfig,
    TAccountRewardAuthority,
    TAccountStakableMint,
    TAccountRent,
    TAccountSystemProgram
  >;

  return instruction;
}

export type InitializeLaunchpoolsConfigInput<
  TAccountAuthority extends string = string,
  TAccountLaunchpoolsConfigsManager extends string = string,
  TAccountLaunchpoolsConfig extends string = string,
  TAccountRewardAuthority extends string = string,
  TAccountStakableMint extends string = string,
  TAccountRent extends string = string,
  TAccountSystemProgram extends string = string,
> = {
  authority: TransactionSigner<TAccountAuthority>;
  launchpoolsConfigsManager: Address<TAccountLaunchpoolsConfigsManager>;
  launchpoolsConfig: Address<TAccountLaunchpoolsConfig>;
  rewardAuthority: Address<TAccountRewardAuthority>;
  stakableMint: Address<TAccountStakableMint>;
  rent?: Address<TAccountRent>;
  systemProgram?: Address<TAccountSystemProgram>;
  minPositionSize: InitializeLaunchpoolsConfigInstructionDataArgs['minPositionSize'];
  maxPositionSize: InitializeLaunchpoolsConfigInstructionDataArgs['maxPositionSize'];
  protocolRewardShareBasisPoints: InitializeLaunchpoolsConfigInstructionDataArgs['protocolRewardShareBasisPoints'];
  duration: InitializeLaunchpoolsConfigInstructionDataArgs['duration'];
};

export function getInitializeLaunchpoolsConfigInstruction<
  TAccountAuthority extends string,
  TAccountLaunchpoolsConfigsManager extends string,
  TAccountLaunchpoolsConfig extends string,
  TAccountRewardAuthority extends string,
  TAccountStakableMint extends string,
  TAccountRent extends string,
  TAccountSystemProgram extends string,
  TProgramAddress extends Address = typeof LAUNCHPOOL_PROGRAM_ADDRESS,
>(
  input: InitializeLaunchpoolsConfigInput<
    TAccountAuthority,
    TAccountLaunchpoolsConfigsManager,
    TAccountLaunchpoolsConfig,
    TAccountRewardAuthority,
    TAccountStakableMint,
    TAccountRent,
    TAccountSystemProgram
  >,
  config?: { programAddress?: TProgramAddress }
): InitializeLaunchpoolsConfigInstruction<
  TProgramAddress,
  TAccountAuthority,
  TAccountLaunchpoolsConfigsManager,
  TAccountLaunchpoolsConfig,
  TAccountRewardAuthority,
  TAccountStakableMint,
  TAccountRent,
  TAccountSystemProgram
> {
  // Program address.
  const programAddress = config?.programAddress ?? LAUNCHPOOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: true },
    launchpoolsConfigsManager: {
      value: input.launchpoolsConfigsManager ?? null,
      isWritable: true,
    },
    launchpoolsConfig: {
      value: input.launchpoolsConfig ?? null,
      isWritable: true,
    },
    rewardAuthority: {
      value: input.rewardAuthority ?? null,
      isWritable: false,
    },
    stakableMint: { value: input.stakableMint ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.rent.value) {
    accounts.rent.value =
      'SysvarRent111111111111111111111111111111111' as Address<'SysvarRent111111111111111111111111111111111'>;
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.launchpoolsConfigsManager),
      getAccountMeta(accounts.launchpoolsConfig),
      getAccountMeta(accounts.rewardAuthority),
      getAccountMeta(accounts.stakableMint),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
    ],
    programAddress,
    data: getInitializeLaunchpoolsConfigInstructionDataEncoder().encode(
      args as InitializeLaunchpoolsConfigInstructionDataArgs
    ),
  } as InitializeLaunchpoolsConfigInstruction<
    TProgramAddress,
    TAccountAuthority,
    TAccountLaunchpoolsConfigsManager,
    TAccountLaunchpoolsConfig,
    TAccountRewardAuthority,
    TAccountStakableMint,
    TAccountRent,
    TAccountSystemProgram
  >;

  return instruction;
}

export type ParsedInitializeLaunchpoolsConfigInstruction<
  TProgram extends string = typeof LAUNCHPOOL_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    authority: TAccountMetas[0];
    launchpoolsConfigsManager: TAccountMetas[1];
    launchpoolsConfig: TAccountMetas[2];
    rewardAuthority: TAccountMetas[3];
    stakableMint: TAccountMetas[4];
    rent: TAccountMetas[5];
    systemProgram: TAccountMetas[6];
  };
  data: InitializeLaunchpoolsConfigInstructionData;
};

export function parseInitializeLaunchpoolsConfigInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedInitializeLaunchpoolsConfigInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 7) {
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
      launchpoolsConfigsManager: getNextAccount(),
      launchpoolsConfig: getNextAccount(),
      rewardAuthority: getNextAccount(),
      stakableMint: getNextAccount(),
      rent: getNextAccount(),
      systemProgram: getNextAccount(),
    },
    data: getInitializeLaunchpoolsConfigInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
