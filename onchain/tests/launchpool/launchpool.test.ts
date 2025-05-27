import {Account, KeyPairSigner, pipe, ProgramDerivedAddress} from "@solana/kit";
import {
    getLaunchpoolPDA,
    getLaunchpoolVaultPDA,
    getStakePositionPDA,
    getStakePositionVaultPDA,
    LaunchpoolTestingEnvironment
} from "./helpers";
import {before, describe} from "mocha";
import {
    compareU192,
    createTestUser,
    createTransaction,
    delay,
    getTransactionLogs,
    signAndSendTransaction
} from "../helpers";
import {
    createAtaWithTokens,
    createAtaWithTokens22,
    createToken22Mint,
    createToken22MintWithPermanentDelegate,
    createTokenMint,
    getToken22PDA,
    getTokenPDA, transferTokens, transferTokens22
} from "../tokens-helpers";
import {
    Mint as TokenMint,
    Token as TokenAccount,
    TOKEN_PROGRAM_ADDRESS,
    fetchToken as fetchTokenAccount,
    fetchMint, ASSOCIATED_TOKEN_PROGRAM_ADDRESS
} from "@solana-program/token";
import {
    Mint as Token22Mint,
    Token as Token22Account,
    fetchToken as fetchToken22Account,
    fetchMint as fetchMint22,
    TOKEN_2022_PROGRAM_ADDRESS} from "@solana-program/token-2022";
import {
    CloseStakePositionInput,
    CollectProtocolRewardInput,
    fetchLaunchpool,
    fetchLaunchpoolsConfig,
    fetchStakePosition,
    getCloseStakePositionInstruction,
    getCollectProtocolRewardInstruction,
    getIncreaseStakePositionInstruction,
    getInitializeLaunchpoolInstruction,
    getLaunchLaunchpoolInstruction,
    getOpenStakePositionInstruction,
    IncreaseStakePositionInput,
    InitializeLaunchpoolInput,
    LaunchLaunchpoolInput,
    LaunchpoolsConfig,
    LaunchpoolStatus,
    OpenStakePositionInput,
    PositionStatus
} from "@launchpool/js";
import {SYSTEM_PROGRAM_ADDRESS} from "@solana-program/system";
import {assert} from "chai";

export const launchpoolTests = (
    launchpoolTestingEnvironment: LaunchpoolTestingEnvironment,
    launchpoolsConfigAddress: ProgramDerivedAddress,
    launchpoolsConfigsManagerAddress: ProgramDerivedAddress
) => {
    describe("\nLaunchpool tests", () =>{
        const {rpcClient, rent, headAuthority, owner, user, launchpoolsConfigsManagerAuthority} = launchpoolTestingEnvironment;

        let generalUser: KeyPairSigner;
        let evilUser: KeyPairSigner;
        let tokenCreatorUser: KeyPairSigner;
        let launchpoolsConfigAccount: Account<LaunchpoolsConfig>;
        let stakableMint: Account<TokenMint>;
        const launchpool1StartBump = 5;
        const launchpool3StartBump = 20;

        const TEST_LAUNCHPOOLS: {
            rewardMint1: Account<TokenMint>,
            launchpool1: ProgramDerivedAddress,
            rewardVault1: ProgramDerivedAddress,
            rewardMint2: Account<TokenMint>,
            launchpool2: ProgramDerivedAddress,
            rewardVault2: ProgramDerivedAddress,
            rewardMint3: Account<Token22Mint>,
            launchpool3: ProgramDerivedAddress,
            rewardVault3: ProgramDerivedAddress,
            freezeAuthorityRewardMint: Account<TokenMint>,
            freezeAuthorityLaunchpool: ProgramDerivedAddress,
            freezeAuthorityRewardVault: ProgramDerivedAddress,
            forbiddenExtensionRewardMint: Account<Token22Mint>,
            forbiddenExtensionLaunchpool: ProgramDerivedAddress,
            forbiddenExtensionRewardVault: ProgramDerivedAddress,
        } = {
            rewardMint1: undefined,
            launchpool1: undefined,
            rewardVault1: undefined,
            rewardMint2: undefined,
            launchpool2: undefined,
            rewardVault2: undefined,
            rewardMint3: undefined,
            launchpool3: undefined,
            rewardVault3: undefined,
            freezeAuthorityRewardMint: undefined,
            freezeAuthorityLaunchpool: undefined,
            freezeAuthorityRewardVault: undefined,
            forbiddenExtensionRewardMint: undefined,
            forbiddenExtensionLaunchpool: undefined,
            forbiddenExtensionRewardVault: undefined,
        };

        const USER_ACCOUNTS: {
            stakableToken: Account<TokenAccount>,
            rewardToken1: Account<TokenAccount>,
            stakePosition1: ProgramDerivedAddress,
            stakePositionVault1: ProgramDerivedAddress,
            rewardToken2: ProgramDerivedAddress,
            stakePosition2: ProgramDerivedAddress,
            stakePositionVault2: ProgramDerivedAddress,
            rewardToken3: ProgramDerivedAddress,
            stakePosition3: ProgramDerivedAddress,
            stakePositionVault3: ProgramDerivedAddress
        } = {
            stakableToken: undefined,
            rewardToken1: undefined,
            stakePosition1: undefined,
            stakePositionVault1: undefined,
            rewardToken2: undefined,
            stakePosition2: undefined,
            stakePositionVault2: undefined,
            rewardToken3: undefined,
            stakePosition3: undefined,
            stakePositionVault3: undefined
        };
        const EVIL_USER_ACCOUNTS: {
            stakableToken: Account<TokenAccount>,
            rewardToken1: Account<TokenAccount>,
            stakePosition1: ProgramDerivedAddress,
            stakePositionVault1: ProgramDerivedAddress
        } = {
            stakableToken: undefined,
            rewardToken1: undefined,
            stakePosition1: undefined,
            stakePositionVault1: undefined
        };

        const GENERAL_USER_ACCOUNTS: {
            stakableToken: Account<TokenAccount>,
            rewardToken1: Account<TokenAccount>,
            stakePosition1: ProgramDerivedAddress,
            stakePositionVault1: ProgramDerivedAddress,
            rewardToken2: ProgramDerivedAddress,
            stakePosition2: ProgramDerivedAddress,
            stakePositionVault2: ProgramDerivedAddress,
            rewardToken3: ProgramDerivedAddress,
            stakePosition3: ProgramDerivedAddress,
            stakePositionVault3: ProgramDerivedAddress
        } = {
            stakableToken: undefined,
            rewardToken1: undefined,
            stakePosition1: undefined,
            stakePositionVault1: undefined,
            rewardToken2: undefined,
            stakePosition2: undefined,
            stakePositionVault2: undefined,
            rewardToken3: undefined,
            stakePosition3: undefined,
            stakePositionVault3: undefined
        };
        const TOKEN_CREATOR_TOKEN_ACCOUNTS: {
            rewardToken1: Account<TokenAccount>,
            rewardToken2: Account<TokenAccount>,
            rewardToken3: Account<Token22Account>
        } = {
            rewardToken1: undefined,
            rewardToken2: undefined,
            rewardToken3: undefined
        };
        const REWARD_AUTHORITY_TOKEN_ACCOUNTS: {
            rewardToken1: ProgramDerivedAddress,
            rewardToken2: ProgramDerivedAddress,
            rewardToken3: ProgramDerivedAddress
        } = {
            rewardToken1: undefined,
            rewardToken2: undefined,
            rewardToken3: undefined
        };

        before(async () =>{
            [generalUser, evilUser, tokenCreatorUser] = await Promise.all([
                createTestUser(rpcClient, 1000), createTestUser(rpcClient, 1000), createTestUser(rpcClient, 1000)
            ]);

            launchpoolsConfigAccount = await fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            stakableMint = await fetchMint(rpcClient.rpc, launchpoolsConfigAccount.data.stakableMint);

            TEST_LAUNCHPOOLS.rewardMint1 = await createTokenMint(rpcClient, tokenCreatorUser, 6);
            TEST_LAUNCHPOOLS.rewardMint2 = await createTokenMint(rpcClient, tokenCreatorUser, 4);
            TEST_LAUNCHPOOLS.rewardMint3 = await createToken22Mint(rpcClient, tokenCreatorUser, 3);
            TEST_LAUNCHPOOLS.freezeAuthorityRewardMint = await createTokenMint(rpcClient, tokenCreatorUser, 6, tokenCreatorUser.address);
            TEST_LAUNCHPOOLS.forbiddenExtensionRewardMint = await createToken22MintWithPermanentDelegate(rpcClient, tokenCreatorUser, 6);

            TOKEN_CREATOR_TOKEN_ACCOUNTS.rewardToken1 = await createAtaWithTokens(rpcClient, TEST_LAUNCHPOOLS.rewardMint1.address, tokenCreatorUser, tokenCreatorUser, BigInt(10_000_000_000_000_000_000n));
            TOKEN_CREATOR_TOKEN_ACCOUNTS.rewardToken2 = await createAtaWithTokens(rpcClient, TEST_LAUNCHPOOLS.rewardMint2.address, tokenCreatorUser, tokenCreatorUser, BigInt(10_000_000_000_000_000_000n));
            TOKEN_CREATOR_TOKEN_ACCOUNTS.rewardToken3 = await createAtaWithTokens22(rpcClient, TEST_LAUNCHPOOLS.rewardMint3.address, tokenCreatorUser, tokenCreatorUser, BigInt(10_000_000_000_000_000_000n));
            USER_ACCOUNTS.rewardToken1 = await createAtaWithTokens(rpcClient, TEST_LAUNCHPOOLS.rewardMint1.address, tokenCreatorUser, user, BigInt(0));
            GENERAL_USER_ACCOUNTS.rewardToken1 = await createAtaWithTokens(rpcClient, TEST_LAUNCHPOOLS.rewardMint1.address, tokenCreatorUser, generalUser, BigInt(0));
            EVIL_USER_ACCOUNTS.rewardToken1 = await createAtaWithTokens(rpcClient, TEST_LAUNCHPOOLS.rewardMint1.address, tokenCreatorUser, evilUser, BigInt(0));

            USER_ACCOUNTS.stakableToken = await createAtaWithTokens(rpcClient, launchpoolsConfigAccount.data.stakableMint, user, user, BigInt(3_000_000_000_000_000_000n));
            GENERAL_USER_ACCOUNTS.stakableToken = await createAtaWithTokens(rpcClient, launchpoolsConfigAccount.data.stakableMint, user, generalUser, BigInt(3_000_000_000_000_000_000n));
            EVIL_USER_ACCOUNTS.stakableToken = await createAtaWithTokens(rpcClient, launchpoolsConfigAccount.data.stakableMint, user, evilUser, BigInt(3_000_000_000_000_000_000n));
            [
                TEST_LAUNCHPOOLS.launchpool1, TEST_LAUNCHPOOLS.launchpool2, TEST_LAUNCHPOOLS.launchpool3, TEST_LAUNCHPOOLS.freezeAuthorityLaunchpool, TEST_LAUNCHPOOLS.forbiddenExtensionLaunchpool
            ] = await Promise.all([
                getLaunchpoolPDA(TEST_LAUNCHPOOLS.rewardMint1.address), getLaunchpoolPDA(TEST_LAUNCHPOOLS.rewardMint2.address), getLaunchpoolPDA(TEST_LAUNCHPOOLS.rewardMint3.address), getLaunchpoolPDA(TEST_LAUNCHPOOLS.freezeAuthorityRewardMint.address), getLaunchpoolPDA(TEST_LAUNCHPOOLS.forbiddenExtensionRewardMint.address)
            ]);

            [
                REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken1, REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken2, REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken3,
                USER_ACCOUNTS.rewardToken2, USER_ACCOUNTS.rewardToken3,
                GENERAL_USER_ACCOUNTS.rewardToken2, GENERAL_USER_ACCOUNTS.rewardToken3,
                USER_ACCOUNTS.stakePosition1, USER_ACCOUNTS.stakePosition2, USER_ACCOUNTS.stakePosition3,
                GENERAL_USER_ACCOUNTS.stakePosition1, GENERAL_USER_ACCOUNTS.stakePosition2, GENERAL_USER_ACCOUNTS.stakePosition3,
                EVIL_USER_ACCOUNTS.stakePosition1,
            ] = await Promise.all([
                getTokenPDA(TEST_LAUNCHPOOLS.rewardMint1.address, launchpoolsConfigAccount.data.rewardAuthority), getTokenPDA(TEST_LAUNCHPOOLS.rewardMint2.address, launchpoolsConfigAccount.data.rewardAuthority), getToken22PDA(TEST_LAUNCHPOOLS.rewardMint3.address, launchpoolsConfigAccount.data.rewardAuthority),
                getTokenPDA(TEST_LAUNCHPOOLS.rewardMint2.address, user.address), getToken22PDA(TEST_LAUNCHPOOLS.rewardMint3.address, user.address),
                getTokenPDA(TEST_LAUNCHPOOLS.rewardMint2.address, generalUser.address), getToken22PDA(TEST_LAUNCHPOOLS.rewardMint3.address, generalUser.address),
                getStakePositionPDA(user.address, TEST_LAUNCHPOOLS.launchpool1[0]), getStakePositionPDA(user.address, TEST_LAUNCHPOOLS.launchpool2[0]), getStakePositionPDA(user.address, TEST_LAUNCHPOOLS.launchpool3[0]),
                getStakePositionPDA(generalUser.address, TEST_LAUNCHPOOLS.launchpool1[0]), getStakePositionPDA(generalUser.address, TEST_LAUNCHPOOLS.launchpool2[0]), getStakePositionPDA(generalUser.address, TEST_LAUNCHPOOLS.launchpool3[0]),
                getStakePositionPDA(evilUser.address, TEST_LAUNCHPOOLS.launchpool1[0]),
            ]);

            [
                TEST_LAUNCHPOOLS.rewardVault1, TEST_LAUNCHPOOLS.rewardVault2, TEST_LAUNCHPOOLS.rewardVault3, TEST_LAUNCHPOOLS.freezeAuthorityRewardVault, TEST_LAUNCHPOOLS.forbiddenExtensionRewardVault,
                USER_ACCOUNTS.stakePositionVault1, USER_ACCOUNTS.stakePositionVault2, USER_ACCOUNTS.stakePositionVault3,
                GENERAL_USER_ACCOUNTS.stakePositionVault1, GENERAL_USER_ACCOUNTS.stakePositionVault2, GENERAL_USER_ACCOUNTS.stakePositionVault3,
                EVIL_USER_ACCOUNTS.stakePositionVault1,
            ] = await Promise.all([
                getLaunchpoolVaultPDA(TEST_LAUNCHPOOLS.launchpool1[0]), getLaunchpoolVaultPDA(TEST_LAUNCHPOOLS.launchpool2[0]), getLaunchpoolVaultPDA(TEST_LAUNCHPOOLS.launchpool3[0]), getLaunchpoolVaultPDA(TEST_LAUNCHPOOLS.freezeAuthorityLaunchpool[0]), getLaunchpoolVaultPDA(TEST_LAUNCHPOOLS.forbiddenExtensionLaunchpool[0]),
                getStakePositionVaultPDA(USER_ACCOUNTS.stakePosition1[0]), getStakePositionVaultPDA(USER_ACCOUNTS.stakePosition2[0]), getStakePositionVaultPDA(USER_ACCOUNTS.stakePosition3[0]),
                getStakePositionVaultPDA(GENERAL_USER_ACCOUNTS.stakePosition1[0]), getStakePositionVaultPDA(GENERAL_USER_ACCOUNTS.stakePosition2[0]), getStakePositionVaultPDA(GENERAL_USER_ACCOUNTS.stakePosition3[0]),
                getStakePositionVaultPDA(EVIL_USER_ACCOUNTS.stakePosition1[0])
            ]);
        })

        /// Initialization

        it("Unauthorized attempt to initialize Launchpool should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                initialRewardAmount: 100_000_000_000n
            }
            let ix = getInitializeLaunchpoolInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of Launchpool initialization");
                },
                (_error) => {}
            ));
        });

        it("Initialization of Launchpool with mismatched reward mint and vault should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint2.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault2[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                initialRewardAmount: 100_000_000_000n
            }
            let ix = getInitializeLaunchpoolInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool initialization with mismatched reward mint and vault");
                },
                (_error) => {}
            ));
        });

        it("Initialization of Launchpool with freeze reward mint should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.freezeAuthorityRewardMint.address,
                launchpool: TEST_LAUNCHPOOLS.freezeAuthorityLaunchpool[0],
                rewardVault: TEST_LAUNCHPOOLS.freezeAuthorityRewardVault[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                initialRewardAmount: 100_000_000_000n
            }
            let ix = getInitializeLaunchpoolInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool initialization with freeze reward mint");
                },
                (_error) => {}
            ));
        });

        it("Initialization of Launchpool with reward mint with forbidden extension should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.forbiddenExtensionRewardMint.address,
                launchpool: TEST_LAUNCHPOOLS.forbiddenExtensionLaunchpool[0],
                rewardVault: TEST_LAUNCHPOOLS.forbiddenExtensionRewardVault[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
                initialRewardAmount: 100_000_000_000n
            }
            let ix = getInitializeLaunchpoolInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool initialization  with reward mint with forbidden extension");
                },
                (_error) => {}
            ));
        });

        it("Initialization of Launchpool with 0 initial reward amount should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint3.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool3[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault3[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
                initialRewardAmount: 0
            }
            let ix = getInitializeLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool initialization with 0 initial reward amount");
                },
                (_error) => {}
            ));
        });

        it("Authorized initialization of Launchpool by authority", async () => {
            let initialRewardAmount = 100_000_000_000n;

            const input: InitializeLaunchpoolInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint3.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool3[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault3[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
                initialRewardAmount
            }
            let ix = getInitializeLaunchpoolInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );
            const expectedProtocolRewardAmount = initialRewardAmount / 10_000n * BigInt(launchpoolsConfigAccount.data.protocolRewardShareBasisPoints);
            const expectedParticipantsRewardAmount = initialRewardAmount - expectedProtocolRewardAmount;

            const [launchpoolAccount, rewardVault] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool3[0]),
                fetchToken22Account(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardVault3[0]),
            ]);

            assert.ok(launchpoolAccount, "Launchpool account was not created");
            assert.ok(rewardVault, "Launchpool vault was not created");
            assert.strictEqual(launchpoolAccount.data.launchpoolsConfig, launchpoolsConfigAccount.address, "LaunchpoolsConfig does not match the expected address");
            assert.strictEqual(launchpoolAccount.data.rewardVault, TEST_LAUNCHPOOLS.rewardVault3[0], "Reward vault does not match the expected address");
            assert.strictEqual(launchpoolAccount.data.rewardMint, TEST_LAUNCHPOOLS.rewardMint3.address, "Reward mint does not match the expected address");

            assert.strictEqual(launchpoolAccount.data.status, LaunchpoolStatus.Initialized, "Status should be initialized");
            assert.strictEqual(launchpoolAccount.data.initialRewardAmount, initialRewardAmount, "Initial reward amount does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.protocolRewardAmount, expectedProtocolRewardAmount, "Protocol reward amount does not match the expected value");
            assert.deepStrictEqual(launchpoolAccount.data.participantsRewardAmount, {value: [[BigInt(0), BigInt(0), expectedParticipantsRewardAmount]]}, "Participants reward amount does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.protocolRewardLeftToObtain, expectedProtocolRewardAmount, "Protocol reward left to obtain does not match the expected value");
            assert.deepStrictEqual(launchpoolAccount.data.participantsRewardLeftToDistribute, {value: [[BigInt(0), BigInt(0), expectedParticipantsRewardAmount]]}, "Participant reward left to distribute does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.participantsRewardLeftToObtain, expectedParticipantsRewardAmount, "Participant reward left to obtain does not match the expected value");

            assert.deepStrictEqual(launchpoolAccount.data.rewardRate, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward rate should be 0");
            assert.deepStrictEqual(launchpoolAccount.data.rewardPerToken, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward per token should be 0");
            assert.strictEqual(launchpoolAccount.data.stakedAmount, BigInt(0), "Staked amount should be 0");
            assert.strictEqual(launchpoolAccount.data.startTimestamp, BigInt(0), "Start timestamp should be 0");
            assert.strictEqual(launchpoolAccount.data.endTimestamp, BigInt(0), "End timestamp should be 0");
            assert.strictEqual(launchpoolAccount.data.lastUpdateTimestamp, BigInt(0), "Last update timestamp should be 0");

            assert.strictEqual(launchpoolAccount.data.bump[0], TEST_LAUNCHPOOLS.launchpool3[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(launchpoolAccount.data.rewardVaultBump[0], TEST_LAUNCHPOOLS.rewardVault3[1].valueOf(), "Reward vault bump value is incorrect");
        });

        it("Authorized initialization of Launchpool by head authority", async () => {
            let initialRewardAmount = 100_000_000_000n;

            const input: InitializeLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                initialRewardAmount
            }
            let ix = getInitializeLaunchpoolInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );
            const expectedProtocolRewardAmount = initialRewardAmount / 10_000n * BigInt(launchpoolsConfigAccount.data.protocolRewardShareBasisPoints);
            const expectedParticipantsRewardAmount = initialRewardAmount - expectedProtocolRewardAmount;

            const [launchpoolAccount, rewardVault] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardVault1[0]),
            ]);

            assert.ok(launchpoolAccount, "Launchpool account was not created");
            assert.ok(rewardVault, "Launchpool vault was not created");
            assert.strictEqual(launchpoolAccount.data.launchpoolsConfig, launchpoolsConfigAccount.address, "LaunchpoolsConfig does not match the expected address");
            assert.strictEqual(launchpoolAccount.data.rewardVault, TEST_LAUNCHPOOLS.rewardVault1[0], "Reward vault does not match the expected address");
            assert.strictEqual(launchpoolAccount.data.rewardMint, TEST_LAUNCHPOOLS.rewardMint1.address, "Reward mint does not match the expected address");

            assert.strictEqual(launchpoolAccount.data.status, LaunchpoolStatus.Initialized, "Status should be initialized");
            assert.strictEqual(launchpoolAccount.data.initialRewardAmount, initialRewardAmount, "Initial reward amount does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.protocolRewardAmount, expectedProtocolRewardAmount, "Protocol reward amount does not match the expected value");
            assert.deepStrictEqual(launchpoolAccount.data.participantsRewardAmount, {value: [[BigInt(0), BigInt(0), expectedParticipantsRewardAmount]]}, "Participants reward amount does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.protocolRewardLeftToObtain, expectedProtocolRewardAmount, "Protocol reward left to obtain does not match the expected value");
            assert.deepStrictEqual(launchpoolAccount.data.participantsRewardLeftToDistribute, {value: [[BigInt(0), BigInt(0), expectedParticipantsRewardAmount]]}, "Participant reward left to distribute does not match the expected value");
            assert.strictEqual(launchpoolAccount.data.participantsRewardLeftToObtain, expectedParticipantsRewardAmount, "Participant reward left to obtain does not match the expected value");

            assert.deepStrictEqual(launchpoolAccount.data.rewardRate, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward rate should be 0");
            assert.deepStrictEqual(launchpoolAccount.data.rewardPerToken, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward per token should be 0");
            assert.strictEqual(launchpoolAccount.data.stakedAmount, BigInt(0), "Staked amount should be 0");
            assert.strictEqual(launchpoolAccount.data.startTimestamp, BigInt(0), "Start timestamp should be 0");
            assert.strictEqual(launchpoolAccount.data.endTimestamp, BigInt(0), "End timestamp should be 0");
            assert.strictEqual(launchpoolAccount.data.lastUpdateTimestamp, BigInt(0), "Last update timestamp should be 0");

            assert.strictEqual(launchpoolAccount.data.bump[0], TEST_LAUNCHPOOLS.launchpool1[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(launchpoolAccount.data.rewardVaultBump[0], TEST_LAUNCHPOOLS.rewardVault1[1].valueOf(), "Reward vault bump value is incorrect");
        });

        it("Reinitialization of already initialized Launchpool should fail", async () => {
            const input: InitializeLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                initialRewardAmount: 100_000n
            }
            let ix = getInitializeLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool reinitialization");
                },
                (_error) => {}
            ));
        });

        /// Launch

        it("Launch of an unfunded Launchpool should fail", async () => {
            const startTimestamp = Math.floor(Date.now() / 1000) + 20;
            const input: LaunchLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of launch attempt of an unfunded Launchpool");
                },
                (_error) => {}
            ));
            const [launchpoolAccount, rewardMint] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchMint(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardMint1.address),
            ]);
            await transferTokens(
                rpcClient,
                TOKEN_CREATOR_TOKEN_ACCOUNTS.rewardToken1.address,
                launchpoolAccount.data.rewardVault,
                launchpoolAccount.data.rewardMint,
                tokenCreatorUser,
                launchpoolAccount.data.initialRewardAmount,
                rewardMint.data.decimals
            )
        });

        it("Unauthorized attempt to launch Launchpool should fail", async () => {
            const startTimestamp = Math.floor(Date.now() / 1000) + 20;
            const input: LaunchLaunchpoolInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool unauthorized launch attempt");
                },
                (_error) => {}
            ));
        });

        it("Launch of an uninitialized Launchpool should fail", async () => {
            const startTimestamp = Math.floor(Date.now() / 1000) + 20;
            const input: LaunchLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint2.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool2[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault2[0],
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of a launch of uninitialized Launchpool");
                },
                (_error) => {}
            ));
        });

        it("Launch attempt to launch Launchpool with start timestamp in past should fail", async () => {
            const startTimestamp = Math.floor(Date.now() / 1000) - 20;
            const input: LaunchLaunchpoolInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of a Launchpool launch with start in past");
                },
                (_error) => {}
            ));
        });

        it("Authorized launch of Launchpool by authority", async () => {
            let launchpoolAddress = TEST_LAUNCHPOOLS.launchpool1[0];
            let rewardVaultAddress = TEST_LAUNCHPOOLS.rewardVault1[0];
            const launchpoolAccountBefore = await fetchLaunchpool(rpcClient.rpc, launchpoolAddress);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");

            const startTimestamp = BigInt(Math.floor(Date.now() / 1000) + launchpool1StartBump);
            const input: LaunchLaunchpoolInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: launchpoolAddress,
                rewardVault: rewardVaultAddress,
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [launchpoolAccountAfter, rewardVault] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, launchpoolAddress),
                fetchTokenAccount(rpcClient.rpc, rewardVaultAddress),
            ]);

            assert.ok(rewardVault.data.amount >= launchpoolAccountBefore.data.initialRewardAmount, "Reward vault is unfunded");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToDistribute, launchpoolAccountBefore.data.participantsRewardLeftToDistribute, "Participant reward left to distribute should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardPerToken, launchpoolAccountBefore.data.rewardPerToken, "Reward per token should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount, "Staked amount should remain unchanged");

            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, {value: [[BigInt(0), BigInt(0), BigInt(1444500000)]]}, "Reward rate  does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, startTimestamp, "Start timestamp does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, startTimestamp + launchpoolsConfigAccount.data.duration, "End timestamp s does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.lastUpdateTimestamp, startTimestamp, "Last update timestamp s does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");

        });

        it("Authorized launch of Launchpool by head authority", async () => {
            let launchpoolAddress = TEST_LAUNCHPOOLS.launchpool3[0];
            let rewardVaultAddress = TEST_LAUNCHPOOLS.rewardVault3[0];
            const [launchpoolAccountBefore, rewardMint] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, launchpoolAddress),
                fetchMint22(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardMint3.address)
            ]);
            await transferTokens22(
                rpcClient,
                TOKEN_CREATOR_TOKEN_ACCOUNTS.rewardToken3.address,
                launchpoolAccountBefore.data.rewardVault,
                launchpoolAccountBefore.data.rewardMint,
                tokenCreatorUser,
                launchpoolAccountBefore.data.initialRewardAmount,
                rewardMint.data.decimals
            )

            const startTimestamp = BigInt(Math.floor(Date.now() / 1000) + launchpool3StartBump);
            const input: LaunchLaunchpoolInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: rewardMint.address,
                launchpool: launchpoolAddress,
                rewardVault: rewardVaultAddress,
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [launchpoolAccountAfter, rewardVault] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, launchpoolAddress),
                fetchToken22Account(rpcClient.rpc, rewardVaultAddress),
            ]);

            assert.ok(rewardVault.data.amount >= launchpoolAccountBefore.data.initialRewardAmount, "Reward vault is unfunded");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToDistribute, launchpoolAccountBefore.data.participantsRewardLeftToDistribute, "Participant reward left to distribute should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardPerToken, launchpoolAccountBefore.data.rewardPerToken, "Reward per token should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount, "Staked amount should remain unchanged");

            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, {value: [[BigInt(0), BigInt(0), BigInt(1444500000)]]}, "Reward rate  does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, startTimestamp, "Start timestamp  does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, startTimestamp + launchpoolsConfigAccount.data.duration, "End timestamp s does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.lastUpdateTimestamp, startTimestamp, "Last update timestamp s does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");

        });

        it("Relaunch of an already launched Launchpool should fail", async () => {
            const startTimestamp = BigInt(Math.floor(Date.now() / 1000) + 20);
            const input: LaunchLaunchpoolInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                startTimestamp
            }

            let ix = getLaunchLaunchpoolInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of Launchpool relaunch");
                },
                (_error) => {}
            );
        });

        /// Open Postion

        it("Opening StakePosition in not launched Launchpool should fail", async () => {
            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: USER_ACCOUNTS.stakableToken.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool2[0],
                stakePosition: USER_ACCOUNTS.stakePosition2[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault2[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount: 400_000n
            }
            let ix = getOpenStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition opening attempt in not launched Launchpool");
                },
                (_error) => {}
            ));
        });

        it("Opening StakePosition before pool has started should fail", async () => {
            const launchpoolAccountBefore = await fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");

            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: USER_ACCOUNTS.stakableToken.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount: 400_000n
            }
            let ix = getOpenStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition opening attempt in Launchpool before start");
                },
                (_error) => {}
            ));
            await delay(launchpool1StartBump);
        });

        it("Opening StakePosition with stake bigger than allowed should fail", async () => {
            const [signerStakableAccount, launchpoolAccountBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0])
            ]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");
            assert.ok(signerStakableAccount, "Signer stakable account doesn't exist");
            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccount.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount: launchpoolAccountBefore.data.maxPositionSize + 1n
            }
            let ix = getOpenStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition opening attempt with stake bigger than allowed");
                },
                (_error) => {}
            ));
        });

        it("Opening StakePosition with stake less than allowed should fail", async () => {
            const [signerStakableAccount, launchpoolAccountBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0])
            ]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");
            assert.ok(signerStakableAccount, "Signer stakable account doesn't exist");
            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccount.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount: launchpoolAccountBefore.data.minPositionSize - 1n
            }
            let ix = getOpenStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition opening attempt with stake less than allowed");
                },
                (_error) => {}
            ));
        });

        it("Opening StakePosition for a user and first for Launchpool", async () => {
            const [signerStakableAccountBefore, launchpoolAccountBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0])
            ]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");
            assert.ok(signerStakableAccountBefore, "Signer stakable account doesn't exist");

            const stakeAmount = 100_000_000n;

            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccountBefore.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolAccountBefore.data.launchpoolsConfig,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount
            };

            const ix = getOpenStakePositionInstruction(input);
            const expectedLastUpdateTimestamp = BigInt(Math.floor(Date.now() / 1000));

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [signerStakableAccountAfter, launchpoolAccountAfter, stakePositionAccount, stakeVaultAccount] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakePositionVault1[0])
            ]);

            assert.ok(stakePositionAccount, "StakePosition doesn't exist");
            assert.ok(stakeVaultAccount, "Stake vault doesn't exist");

            assert.strictEqual(stakeVaultAccount.data.amount, stakeAmount, "Stake vault account balance does not match the expected value");
            assert.strictEqual(signerStakableAccountAfter.data.amount, signerStakableAccountBefore.data.amount - stakeAmount, "Signer stakable account balance does not match the expected value");

            const timestampDiff = launchpoolAccountAfter.data.lastUpdateTimestamp - expectedLastUpdateTimestamp;
            assert.ok(timestampDiff >= -1n && timestampDiff <= 1n, `Timestamps differ by more than 1 second`);
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount + stakeAmount, "Staked amount does not match the expected value");

            assert.strictEqual(stakePositionAccount.data.authority, user.address, "Authority does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.launchpool, launchpoolAccountBefore.address, "Launchpool does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.stakeVault, stakeVaultAccount.address, "Stake vault does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.status, PositionStatus.Opened, "Status should be opened");
            assert.strictEqual(stakePositionAccount.data.bump[0], USER_ACCOUNTS.stakePosition1[1], "Bump does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.stakeVaultBump[0], USER_ACCOUNTS.stakePositionVault1[1], "Stake vault bump does not match the expected value");
            assert.deepStrictEqual(stakePositionAccount.data.rewardDebt, {value: [[0n, 0n, 0n]]}, "Reward debt does not match the expected value");
            assert.deepStrictEqual(stakePositionAccount.data.rewardEarned, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward earned does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToDistribute, launchpoolAccountBefore.data.participantsRewardLeftToDistribute, "Participant reward left to distribute should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardPerToken, launchpoolAccountBefore.data.rewardPerToken, "Reward per tokenshould remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        it("Reopening StakePosition should fail", async () => {
            const [signerStakableAccountBefore, launchpoolAccountBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0])
            ]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");
            assert.ok(signerStakableAccountBefore, "Signer stakable account doesn't exist");

            const stakeAmount = 100_000_000n;

            const input: OpenStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccountBefore.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount
            };
            const ix = getOpenStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition reopening");
                },
                (_error) => {}
            ));
        });

        it("Opening StakePosition for a general user", async () => {
            await delay(3);
            const [signerStakableAccountBefore, launchpoolAccountBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0])
            ]);
            assert.ok(launchpoolAccountBefore, "Launchpool doesn't exist");
            assert.ok(signerStakableAccountBefore, "Signer stakable account doesn't exist");

            const stakeAmount = 200_000_000n;

            const input: OpenStakePositionInput = {
                signer: generalUser,
                signerStakableAccount: signerStakableAccountBefore.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolAccountBefore.data.launchpoolsConfig,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: GENERAL_USER_ACCOUNTS.stakePosition1[0],
                stakeVault: GENERAL_USER_ACCOUNTS.stakePositionVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                stakableTokenProgram: stakableMint.programAddress,
                stakeAmount
            };

            const ix = getOpenStakePositionInstruction(input);
            const expectedLastUpdateTimestamp = BigInt(Math.floor(Date.now() / 1000));

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [signerStakableAccountAfter, launchpoolAccountAfter, stakePositionAccount, stakeVaultAccount] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePositionVault1[0])
            ]);

            assert.ok(stakePositionAccount, "StakePosition doesn't exist");
            assert.ok(stakeVaultAccount, "Stake vault doesn't exist");

            assert.strictEqual(stakeVaultAccount.data.amount, stakeAmount, "Stake vault account balance does not match the expected value");
            assert.strictEqual(signerStakableAccountAfter.data.amount, signerStakableAccountBefore.data.amount - stakeAmount, "Signer stakable account balance does not match the expected value");
            const timestampDiff = launchpoolAccountAfter.data.lastUpdateTimestamp - expectedLastUpdateTimestamp;
            assert.ok(timestampDiff >= -1n && timestampDiff <= 1n, `Timestamps differ by more than 1 second`);

            assert.notDeepEqual(launchpoolAccountAfter.data.rewardPerToken, launchpoolAccountBefore.data.rewardPerToken, "Reward per token does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount + stakeAmount, "Staked amount does not match the expected value");

            assert.strictEqual(stakePositionAccount.data.authority, generalUser.address, "Authority does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.launchpool, launchpoolAccountBefore.address, "Launchpool does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.stakeVault, stakeVaultAccount.address, "Stake vault does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.status, PositionStatus.Opened, "Status should be opened");
            assert.strictEqual(stakePositionAccount.data.bump[0], GENERAL_USER_ACCOUNTS.stakePosition1[1], "Bump does not match the expected value");
            assert.strictEqual(stakePositionAccount.data.stakeVaultBump[0], GENERAL_USER_ACCOUNTS.stakePositionVault1[1], "Stake vault bump does not match the expected value");
            assert.notDeepEqual(stakePositionAccount.data.rewardDebt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward debt does not match the expected value");
            assert.deepStrictEqual(stakePositionAccount.data.rewardEarned, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Reward earned does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToDistribute, launchpoolAccountBefore.data.participantsRewardLeftToDistribute, "Participant reward left to distribute should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        /// Increase Position

        it("Increasing a StakePosition that is not opened should fail", async () => {
            const input: IncreaseStakePositionInput = {
                signer: evilUser,
                signerStakableAccount: EVIL_USER_ACCOUNTS.stakableToken.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                stakePosition: EVIL_USER_ACCOUNTS.stakePosition1[0],
                stakeVault: EVIL_USER_ACCOUNTS.stakePositionVault1[0],
                stakableTokenProgram: stakableMint.programAddress,
                stakeIncreaseAmount: 50_000_000n
            }
            let ix = getIncreaseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of increasing StakePosition that is nor opened");
                },
                (_error) => {}
            ));
        });

        it("Unauthorized attempt to increase StakePosition should fail", async () => {
            const input: IncreaseStakePositionInput = {
                signer: evilUser,
                signerStakableAccount: EVIL_USER_ACCOUNTS.stakableToken.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                stakableTokenProgram: stakableMint.programAddress,
                stakeIncreaseAmount: 10_000_000n
            }
            let ix = getIncreaseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized StakePosition increasing");
                },
                (_error) => {}
            ));
        });

        it("Increasing StakePosition beyond maximum allowed should fail", async () => {
            const input: IncreaseStakePositionInput = {
                signer: user,
                signerStakableAccount: USER_ACCOUNTS.stakableToken.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                stakableTokenProgram: stakableMint.programAddress,
                stakeIncreaseAmount: 100_000_000_000n
            }
            let ix = getIncreaseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of increasing StakePosition beyond maximum allowed");
                },
                (_error) => {}
            ));
        });

        it("Increase of StakePosition for a user", async () => {
            await delay(1);
            const [signerStakableAccountBefore, launchpoolAccountBefore, stakePositionBefore, stakePositionVaultBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakePositionVault1[0])
            ]);
            const stakeIncreaseAmount = 3_000_000n;
            const input: IncreaseStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccountBefore.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: stakePositionBefore.address,
                stakeVault: stakePositionVaultBefore.address,
                stakableTokenProgram: stakableMint.programAddress,
                stakeIncreaseAmount
            }
            let ix = getIncreaseStakePositionInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );
            const expectedLastUpdateTimestamp = BigInt(Math.floor(Date.now() / 1000));

            const [signerStakableAccountAfter, launchpoolAccountAfter, stakePositionAfter, stakePositionVaultAfter] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc,signerStakableAccountBefore.address),
                fetchLaunchpool(rpcClient.rpc, launchpoolAccountBefore.address),
                fetchStakePosition(rpcClient.rpc, stakePositionBefore.address),
                fetchTokenAccount(rpcClient.rpc, stakePositionVaultBefore.address)
            ]);

            assert.strictEqual(stakePositionVaultAfter.data.amount, stakePositionVaultBefore.data.amount + stakeIncreaseAmount, "Stake vault account balance does not match the expected value");
            assert.strictEqual(signerStakableAccountAfter.data.amount, signerStakableAccountBefore.data.amount - stakeIncreaseAmount, "Signer stakable account balance does not match the expected value");

            const timestampDiff = launchpoolAccountAfter.data.lastUpdateTimestamp - expectedLastUpdateTimestamp;
            assert.ok(timestampDiff >= -1n && timestampDiff <= 1n, `Timestamps differ by more than 1 second`);
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount + stakeIncreaseAmount, "Staked amount does not match the expected value");

            assert.strictEqual(compareU192(stakePositionAfter.data.rewardDebt.value, stakePositionBefore.data.rewardDebt.value), 1, "Reward debt does not match the expected value");
            assert.strictEqual(compareU192(stakePositionAfter.data.rewardEarned.value, stakePositionBefore.data.rewardEarned.value), 1, "Reward earned does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.rewardPerToken.value, launchpoolAccountBefore.data.rewardPerToken.value), 1, "Reward per token does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.participantsRewardLeftToDistribute.value, launchpoolAccountBefore.data.participantsRewardLeftToDistribute.value), -1, "Participant reward left to distribute does not match the expected value");

            assert.strictEqual(stakePositionAfter.data.authority, stakePositionBefore.data.authority, "Authority should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.launchpool, stakePositionBefore.data.launchpool, "Launchpool should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.stakeVault, stakePositionBefore.data.stakeVault, "Stake vault should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.status, PositionStatus.Opened, "Status should be opened");
            assert.strictEqual(stakePositionAfter.data.bump[0], stakePositionBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.stakeVaultBump[0], stakePositionBefore.data.stakeVaultBump[0], "Stake vault bump should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        it("Increase of StakePosition for a general user", async () => {
            await delay(10);
            const [signerStakableAccountBefore, launchpoolAccountBefore, stakePositionBefore, stakePositionVaultBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePositionVault1[0])
            ]);
            const stakeIncreaseAmount = 15_000_000n;
            const input: IncreaseStakePositionInput = {
                signer: generalUser,
                signerStakableAccount: signerStakableAccountBefore.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                launchpool: launchpoolAccountBefore.address,
                stakePosition: stakePositionBefore.address,
                stakeVault: stakePositionVaultBefore.address,
                stakableTokenProgram: stakableMint.programAddress,
                stakeIncreaseAmount
            }
            let ix = getIncreaseStakePositionInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );
            const expectedLastUpdateTimestamp = BigInt(Math.floor(Date.now() / 1000));

            const [signerStakableAccountAfter, launchpoolAccountAfter, stakePositionAfter, stakePositionVaultAfter] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc,signerStakableAccountBefore.address),
                fetchLaunchpool(rpcClient.rpc, launchpoolAccountBefore.address),
                fetchStakePosition(rpcClient.rpc, stakePositionBefore.address),
                fetchTokenAccount(rpcClient.rpc, stakePositionVaultBefore.address)
            ]);

            assert.strictEqual(stakePositionVaultAfter.data.amount, stakePositionVaultBefore.data.amount + stakeIncreaseAmount, "Stake vault account balance does not match the expected value");
            assert.strictEqual(signerStakableAccountAfter.data.amount, signerStakableAccountBefore.data.amount - stakeIncreaseAmount, "Signer stakable account balance does not match the expected value");

            const timestampDiff = launchpoolAccountAfter.data.lastUpdateTimestamp - expectedLastUpdateTimestamp;
            assert.ok(timestampDiff >= -1n && timestampDiff <= 1n, `Timestamps differ by more than 1 second`);
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount + stakeIncreaseAmount, "Staked amount does not match the expected value");

            assert.strictEqual(compareU192(stakePositionAfter.data.rewardDebt.value, stakePositionBefore.data.rewardDebt.value), 1, "Reward debt does not match the expected value");
            assert.strictEqual(compareU192(stakePositionAfter.data.rewardEarned.value, stakePositionBefore.data.rewardEarned.value), 1, "Reward earned does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.rewardPerToken.value, launchpoolAccountBefore.data.rewardPerToken.value), 1, "Reward per token  does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.participantsRewardLeftToDistribute.value, launchpoolAccountBefore.data.participantsRewardLeftToDistribute.value), -1, "Participant reward left to distribute  does not match the expected value");

            assert.strictEqual(stakePositionAfter.data.authority, stakePositionBefore.data.authority, "Authority should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.launchpool, stakePositionBefore.data.launchpool, "Launchpool should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.stakeVault, stakePositionBefore.data.stakeVault, "Stake vault should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.status, PositionStatus.Opened, "Status should be opened");
            assert.strictEqual(stakePositionAfter.data.bump[0], stakePositionBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(stakePositionAfter.data.stakeVaultBump[0], stakePositionBefore.data.stakeVaultBump[0], "Stake vault bump should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Launched, "Status should be launched");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        /// Close Position

        it("Collecting protocol reward from an unfinished Launchpool should fail", async () => {
            const input: CollectProtocolRewardInput = {
                signer: user,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardAuthority: launchpoolsConfigAccount.data.rewardAuthority,
                rewardAuthorityAccount: REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken1[0],
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS
            }
            let ix = getCollectProtocolRewardInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of collecting protocol reward from an unfinished Launchpool");
                },
                (_error) => {}
            ));
        });

        it("Closing StakePosition in an unfinished Launchpool should fail", async () => {
            const input: CloseStakePositionInput = {
                signer: user,
                signerStakableAccount: USER_ACCOUNTS.stakableToken.address,
                signerRewardAccount: USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of closing StakePosition in an unfinished Launchpool");
                },
                (_error) => {}
            ));
            await delay(50);
        });



        it("Closing a non-opened StakePosition should fail", async () => {
            const input: CloseStakePositionInput = {
                signer: evilUser,
                signerStakableAccount: EVIL_USER_ACCOUNTS.stakableToken.address,
                signerRewardAccount: EVIL_USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                stakePosition: EVIL_USER_ACCOUNTS.stakePosition1[0],
                stakeVault: EVIL_USER_ACCOUNTS.stakePositionVault1[0],
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of closing a non-opened StakePosition");
                },
                (_error) => {}
            ));
        });

        it("Unauthorized attempt to close StakePosition should fail", async () => {
            const input: CloseStakePositionInput = {
                signer: evilUser,
                signerStakableAccount: EVIL_USER_ACCOUNTS.stakableToken.address,
                signerRewardAccount: EVIL_USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of an unauthorized attempt to close StakePosition");
                },
                (_error) => {}
            ));
        });

        it("Authorized StakePosition close for a user", async () => {
            const [signerStakableAccountBefore, launchpoolAccountBefore, stakePositionBefore, stakePositionVaultBefore, rewardVaultBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.stakePositionVault1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardVault1[0])
            ]);
            const input: CloseStakePositionInput = {
                signer: user,
                signerStakableAccount: signerStakableAccountBefore.address,
                signerRewardAccount: USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: launchpoolAccountBefore.address,
                rewardVault: rewardVaultBefore.address,
                stakePosition: stakePositionBefore.address,
                stakeVault: stakePositionVaultBefore.address,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [signerStakableAccountAfter, launchpoolAccountAfter, rewardVaultAfter, signerRewardVault] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, signerStakableAccountBefore.address),
                fetchLaunchpool(rpcClient.rpc, launchpoolAccountBefore.address),
                fetchTokenAccount(rpcClient.rpc, rewardVaultBefore.address),
                fetchTokenAccount(rpcClient.rpc, USER_ACCOUNTS.rewardToken1.address)
            ]);
            assert.strictEqual(signerStakableAccountAfter.data.amount - signerStakableAccountBefore.data.amount, stakePositionBefore.data.amount.value[0][2], "Signer stakable account balance does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.lastUpdateTimestamp, launchpoolAccountAfter.data.endTimestamp, "Last update timestamp does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount - stakePositionBefore.data.amount.value[0][2], "Staked amount does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.rewardPerToken.value, launchpoolAccountBefore.data.rewardPerToken.value), 1, "Reward per token  does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.participantsRewardLeftToDistribute.value, launchpoolAccountBefore.data.participantsRewardLeftToDistribute.value), -1, "Participant reward left to distribute does not match the expected value");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain - signerRewardVault.data.amount, "Participant reward left to obtain does not match the expected value");
            assert.strictEqual(rewardVaultBefore.data.amount - rewardVaultAfter.data.amount, signerRewardVault.data.amount, "Reward balances does not match the expected value");



            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Finished, "Status should be finished");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        it("Reclosing of StakePosition should fail", async () => {
            const input: CloseStakePositionInput = {
                signer: user,
                signerStakableAccount: USER_ACCOUNTS.stakableToken.address,
                signerRewardAccount: USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                stakePosition: USER_ACCOUNTS.stakePosition1[0],
                stakeVault: USER_ACCOUNTS.stakePositionVault1[0],
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of StakePosition reclosing");
                },
                (_error) => {}
            );
        });

        it("Authorized StakePosition close for a general user", async () => {
            const [signerStakableAccountBefore, launchpoolAccountBefore, stakePositionBefore, stakePositionVaultBefore, rewardVaultBefore] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakableToken.address),
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchStakePosition(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePosition1[0]),
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.stakePositionVault1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardVault1[0])
            ]);
            const input: CloseStakePositionInput = {
                signer: generalUser,
                signerStakableAccount: signerStakableAccountBefore.address,
                signerRewardAccount: GENERAL_USER_ACCOUNTS.rewardToken1.address,
                stakableMint: stakableMint.address,
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                launchpool: launchpoolAccountBefore.address,
                rewardVault: rewardVaultBefore.address,
                stakePosition: stakePositionBefore.address,
                stakeVault: stakePositionVaultBefore.address,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                rent,
                stakableTokenProgram: stakableMint.programAddress,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            };
            let ix = getCloseStakePositionInstruction(input);
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [signerStakableAccountAfter, launchpoolAccountAfter, stakePositionVaultAfter, rewardVaultAfter, signerRewardVault] = await Promise.all([
                fetchTokenAccount(rpcClient.rpc,signerStakableAccountBefore.address),
                fetchLaunchpool(rpcClient.rpc, launchpoolAccountBefore.address),
                fetchTokenAccount(rpcClient.rpc, stakePositionVaultBefore.address),
                fetchTokenAccount(rpcClient.rpc, rewardVaultBefore.address),
                fetchTokenAccount(rpcClient.rpc, GENERAL_USER_ACCOUNTS.rewardToken1.address)
            ]);

            assert.strictEqual(signerStakableAccountAfter.data.amount - signerStakableAccountBefore.data.amount, stakePositionBefore.data.amount.value[0][2], "Signer stakable account balance does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.lastUpdateTimestamp, launchpoolAccountBefore.data.lastUpdateTimestamp, "Last update timestamp does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount - stakePositionBefore.data.amount.value[0][2], "Staked amount does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.rewardPerToken.value, launchpoolAccountBefore.data.rewardPerToken.value), 0, "Reward per token  does not match the expected value");
            assert.strictEqual(compareU192(launchpoolAccountAfter.data.participantsRewardLeftToDistribute.value, launchpoolAccountBefore.data.participantsRewardLeftToDistribute.value), -1, "Participant reward left to distribute does not match the expected value");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain - signerRewardVault.data.amount, "Participant reward left to obtain does not match the expected value");
            assert.strictEqual(rewardVaultBefore.data.amount - rewardVaultAfter.data.amount, signerRewardVault.data.amount, "Reward balances does not match the expected value");

            assert.strictEqual(stakePositionVaultAfter.data.amount, 0n, "Stake vault account balance does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.Finished, "Status should be finished");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Protocol reward left should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");
        });

        /// Collect Protocol Reward

        it("Unauthorized attempt to collect protocol reward should fail", async () => {
            const input: CollectProtocolRewardInput = {
                signer: user,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardAuthority: user.address,
                rewardAuthorityAccount: USER_ACCOUNTS.rewardToken1.address,
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS
            }
            let ix = getCollectProtocolRewardInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt to collect protocol reward");
                },
                (_error) => {}
            ));
        });

        it("Collection of protocol reward for reward authority", async () => {
            const [launchpoolAccountBefore, rewardVaultBefore] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, TEST_LAUNCHPOOLS.launchpool1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_LAUNCHPOOLS.rewardVault1[0])
            ]);
            const input: CollectProtocolRewardInput = {
                signer: user,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardAuthority: launchpoolsConfigAccount.data.rewardAuthority,
                rewardAuthorityAccount: REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken1[0],
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS
            }
            let ix = getCollectProtocolRewardInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [launchpoolAccountAfter, rewardVaultAfter, rewardAuthorityTokenAfter] = await Promise.all([
                fetchLaunchpool(rpcClient.rpc, launchpoolAccountBefore.address),
                fetchTokenAccount(rpcClient.rpc, rewardVaultBefore.address),
                fetchTokenAccount(rpcClient.rpc, REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken1[0])
            ]);


            assert.strictEqual(rewardVaultAfter.data.amount, rewardVaultBefore.data.amount - launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Reward vault does not match the expected value");
            assert.strictEqual(rewardAuthorityTokenAfter.data.amount, launchpoolAccountBefore.data.protocolRewardLeftToObtain, "Reward authority balance does not match the expected value");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardLeftToObtain, 0n, "Protocol reward does not match the expected value");

            assert.strictEqual(launchpoolAccountAfter.data.launchpoolsConfig, launchpoolAccountBefore.data.launchpoolsConfig, "LaunchpoolsConfig should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVault, launchpoolAccountBefore.data.rewardVault, "Reward vault should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardMint, launchpoolAccountBefore.data.rewardMint, "Reward mint should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.status, LaunchpoolStatus.ClaimedProtocolReward, "Status should be claimed protocol reward");
            assert.strictEqual(launchpoolAccountAfter.data.initialRewardAmount, launchpoolAccountBefore.data.initialRewardAmount, "Initial reward amount should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.protocolRewardAmount, launchpoolAccountBefore.data.protocolRewardAmount, "Protocol reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardAmount, launchpoolAccountBefore.data.participantsRewardAmount, "Participants reward amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.participantsRewardLeftToDistribute, launchpoolAccountBefore.data.participantsRewardLeftToDistribute, "Participant reward left to distribute should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.participantsRewardLeftToObtain, launchpoolAccountBefore.data.participantsRewardLeftToObtain, "Participant reward left to obtain should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardPerToken, launchpoolAccountBefore.data.rewardPerToken, "Reward per token should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.stakedAmount, launchpoolAccountBefore.data.stakedAmount, "Staked amount should remain unchanged");
            assert.deepStrictEqual(launchpoolAccountAfter.data.rewardRate, launchpoolAccountBefore.data.rewardRate, "Reward rate should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.startTimestamp, launchpoolAccountBefore.data.startTimestamp, "Start timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.endTimestamp, launchpoolAccountBefore.data.endTimestamp, "End timestamp should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.lastUpdateTimestamp, launchpoolAccountBefore.data.lastUpdateTimestamp, "Last update timestamp should remain unchanged");

            assert.strictEqual(launchpoolAccountAfter.data.bump[0], launchpoolAccountBefore.data.bump[0], "Bump should remain unchanged");
            assert.strictEqual(launchpoolAccountAfter.data.rewardVaultBump[0], launchpoolAccountBefore.data.rewardVaultBump[0], "Reward vault bump should remain unchanged");

        });

        it("Recollection of protocol reward should fail", async () => {
            const input: CollectProtocolRewardInput = {
                signer: user,
                launchpool: TEST_LAUNCHPOOLS.launchpool1[0],
                launchpoolsConfig: launchpoolsConfigAccount.address,
                rewardAuthority: launchpoolsConfigAccount.data.rewardAuthority,
                rewardAuthorityAccount: REWARD_AUTHORITY_TOKEN_ACCOUNTS.rewardToken1[0],
                rewardMint: TEST_LAUNCHPOOLS.rewardMint1.address,
                rewardVault: TEST_LAUNCHPOOLS.rewardVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                rewardTokenProgram: TOKEN_PROGRAM_ADDRESS
            }
            let ix = getCollectProtocolRewardInstruction(input);
            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of protocol reward recollection");
                },
                (_error) => {}
            ));
        });

    });
}