import {
    Account, generateKeyPairSigner, getAddressEncoder, getProgramDerivedAddress, KeyPairSigner, none,
    pipe, ProgramDerivedAddress, Some, some
} from "@solana/kit";
import {SYSTEM_PROGRAM_ADDRESS} from "@solana-program/system";
import {
    ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS, fetchMint,
    Mint as TokenMint, Token as TokenAccount, fetchToken as fetchTokenAccount
} from "@solana-program/token";
import {
    Mint as Token22Mint, Token as Token22Account, fetchMint as fetchMint22, fetchToken as fetchToken22Account, Extension, TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";
import {assert} from "chai";
import {before, describe} from "mocha";
import {
    CollectFeesFromCpAmmInput, CpAmm,
    fetchAmmsConfig,
    fetchCpAmm, getCollectFeesFromCpAmmInstruction,
    getInitializeCpAmmInstruction,
    getLaunchCpAmmInstruction,
    getProvideToCpAmmInstruction,
    getSwapInCpAmmInstruction,
    getWithdrawFromCpAmmInstruction,
    InitializeCpAmmInput,
    LaunchCpAmmInput,
    ProvideToCpAmmInput,
    SwapInCpAmmInput,
    WithdrawFromCpAmmInput
} from "@liquidity-pool/js";
import {
    createTestUser, createTransaction,
    getTransactionLogs,
    signAndSendTransaction
} from "../helpers";
import {LiquidityPoolTestingEnvironment, getCpAmmPDA, getCpAmmVaultPDA} from "./helpers"
import {
    getToken22PDA, getTokenPDA,
    createAtaWithTokens, createAtaWithTokens22,
    createToken22Mint,
    createToken22MintWithPermanentDelegate,
    createToken22MintWithTransferFee,
    createTokenMint
} from "../tokens-helpers";
import * as program from "@liquidity-pool/js";


/**
 * CpAmm tests function.
 */
export const cpAmmTests = (liquidityPoolTestingEnvironment: LiquidityPoolTestingEnvironment, ammsConfigAddress: ProgramDerivedAddress) =>{
    describe("\nCpAmm tests", () =>{
        const {rpcClient, rent, headAuthority, owner, user} = liquidityPoolTestingEnvironment;
        let generalUser: KeyPairSigner;

        /**
         * Stores test data for CpAmms.
         */
        const TEST_CP_AMMS: {
            lpMint1: KeyPairSigner,
            cpAmm1: ProgramDerivedAddress,
            baseVault1: ProgramDerivedAddress,
            quoteVault1: ProgramDerivedAddress,
            lpVault1: ProgramDerivedAddress,
            lpMint2: KeyPairSigner,
            cpAmm2: ProgramDerivedAddress,
            baseVault2: ProgramDerivedAddress,
            quoteVault2: ProgramDerivedAddress,
            lpVault2: ProgramDerivedAddress,
            lpMint3: KeyPairSigner,
            cpAmm3: ProgramDerivedAddress,
            baseVault3: ProgramDerivedAddress,
            quoteVault3: ProgramDerivedAddress,
            lpVault3: ProgramDerivedAddress
        } = {
            lpMint1: undefined,
            cpAmm1: undefined,
            baseVault1: undefined,
            quoteVault1: undefined,
            lpVault1: undefined,
            lpMint2: undefined,
            cpAmm2: undefined,
            baseVault2: undefined,
            quoteVault2: undefined,
            lpVault2: undefined,
            lpMint3: undefined,
            cpAmm3: undefined,
            baseVault3: undefined,
            quoteVault3: undefined,
            lpVault3: undefined,
        };


        /**
         * Stores test data for various token mints including standard SPL tokens
         * and Token-2022 variations with different configurations.
         */
        const TEST_MINTS: {
            validTokenMint1: Account<TokenMint>,
            validTokenMint2: Account<TokenMint>,
            validTokenMint3: Account<TokenMint>,
            freezeAuthorityTokenMint: Account<TokenMint>,
            validToken22Mint1: Account<Token22Mint>,
            validToken22Mint2: Account<Token22Mint>,
            transferFeeToken2022Mint: Account<Token22Mint>,
            permanentDelegateToken2022Mint: Account<Token22Mint>
        } = {
            validTokenMint1: undefined,
            validTokenMint2: undefined,
            validTokenMint3: undefined,
            freezeAuthorityTokenMint: undefined,
            validToken22Mint1: undefined,
            validToken22Mint2: undefined,
            transferFeeToken2022Mint: undefined,
            permanentDelegateToken2022Mint: undefined
        };

        /**
         * Stores token accounts belonging to the primary user.
         * Used to track token balances and interactions within the CpAmm.
         */
        const USER_TOKEN_ACCOUNTS: {
            validToken1: Account<TokenAccount>,
            validToken2: Account<TokenAccount>,
            validToken3: Account<TokenAccount>,
            validToken221: Account<Token22Account>,
            validToken222: Account<Token22Account>,
            transferFeeToken22: Account<Token22Account>,
            lpToken1: ProgramDerivedAddress,
            lpToken2: ProgramDerivedAddress,
            lpToken3: ProgramDerivedAddress
        } = {
            validToken1: undefined,
            validToken2: undefined,
            validToken3: undefined,
            validToken221: undefined,
            validToken222: undefined,
            transferFeeToken22: undefined,
            lpToken1: undefined,
            lpToken2: undefined,
            lpToken3: undefined
        };

        /**
         * Stores token accounts belonging to a secondary general user.
         * Used for testing interactions between multiple users in CpAmm.
         */
        const GENERAL_USER_TOKEN_ACCOUNTS: {
            validToken1: Account<TokenAccount>,
            validToken2: Account<TokenAccount>,
            validToken3: Account<TokenAccount>,
            validToken221: Account<Token22Account>,
            validToken222: Account<Token22Account>,
            transferFeeToken22: Account<Token22Account>,
            lpToken1: ProgramDerivedAddress,
            lpToken2: ProgramDerivedAddress,
            lpToken3: ProgramDerivedAddress
        } = {
            validToken1: undefined,
            validToken2: undefined,
            validToken3: undefined,
            validToken221: undefined,
            validToken222: undefined,
            transferFeeToken22: undefined,
            lpToken1: undefined,
            lpToken2: undefined,
            lpToken3: undefined
        };

        /**
         * Stores token accounts related to fee authorities.
         */
        const FEE_AUTHORITY_TOKEN_ACCOUNTS: {
            validToken1: ProgramDerivedAddress,
            validToken2: ProgramDerivedAddress,
            validToken3: ProgramDerivedAddress,
            validToken221: ProgramDerivedAddress,
            validToken222: ProgramDerivedAddress,
            transferFeeToken22: ProgramDerivedAddress
        } = {
            validToken1: undefined,
            validToken2: undefined,
            validToken3: undefined,
            validToken221: undefined,
            validToken222: undefined,
            transferFeeToken22: undefined
        };

        before(async () =>{
            generalUser = await createTestUser(rpcClient, 100);

            [TEST_CP_AMMS.lpMint1, TEST_CP_AMMS.lpMint2, TEST_CP_AMMS.lpMint3] = await Promise.all([
                generateKeyPairSigner(),
                generateKeyPairSigner(),
                generateKeyPairSigner()
            ]);
            [TEST_CP_AMMS.cpAmm1, TEST_CP_AMMS.cpAmm2, TEST_CP_AMMS.cpAmm3] = await Promise.all([
                getCpAmmPDA(TEST_CP_AMMS.lpMint1.address),
                getCpAmmPDA(TEST_CP_AMMS.lpMint2.address),
                getCpAmmPDA(TEST_CP_AMMS.lpMint3.address)
            ]);

            TEST_MINTS.validTokenMint1 = await createTokenMint(rpcClient, user, 6);
            TEST_MINTS.validTokenMint2 = await createTokenMint(rpcClient, user, 4);
            TEST_MINTS.validTokenMint3 = await createTokenMint(rpcClient, user, 9);
            TEST_MINTS.freezeAuthorityTokenMint = await createTokenMint(rpcClient, user, 1, user.address);

            TEST_MINTS.validToken22Mint1 = await createToken22Mint(rpcClient, user, 3);
            TEST_MINTS.validToken22Mint2 = await createToken22Mint(rpcClient, user, 0);
            TEST_MINTS.transferFeeToken2022Mint = await createToken22MintWithTransferFee(rpcClient, user, 2, 379, 10000);
            TEST_MINTS.permanentDelegateToken2022Mint = await createToken22MintWithPermanentDelegate(rpcClient, user, 0);

            [
                TEST_CP_AMMS.baseVault1, TEST_CP_AMMS.baseVault2, TEST_CP_AMMS.baseVault3,
                TEST_CP_AMMS.quoteVault1, TEST_CP_AMMS.quoteVault2, TEST_CP_AMMS.quoteVault3,
                TEST_CP_AMMS.lpVault1, TEST_CP_AMMS.lpVault2, TEST_CP_AMMS.lpVault3,
                USER_TOKEN_ACCOUNTS.lpToken1, USER_TOKEN_ACCOUNTS.lpToken2, USER_TOKEN_ACCOUNTS.lpToken3,
                GENERAL_USER_TOKEN_ACCOUNTS.lpToken1, GENERAL_USER_TOKEN_ACCOUNTS.lpToken2, GENERAL_USER_TOKEN_ACCOUNTS.lpToken3,
            ] = await Promise.all([
                getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm1[0], TEST_MINTS.validTokenMint1.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm2[0], TEST_MINTS.validTokenMint2.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm3[0], TEST_MINTS.validTokenMint2.address),
                getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm1[0], TEST_MINTS.validToken22Mint1.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm2[0], TEST_MINTS.validTokenMint3.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm3[0], TEST_MINTS.transferFeeToken2022Mint.address),
                getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm1[0], TEST_CP_AMMS.lpMint1.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm2[0], TEST_CP_AMMS.lpMint2.address), getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm3[0], TEST_CP_AMMS.lpMint3.address),
                getTokenPDA(TEST_CP_AMMS.lpMint1.address, user.address), getTokenPDA(TEST_CP_AMMS.lpMint2.address, user.address), getTokenPDA(TEST_CP_AMMS.lpMint3.address, user.address),
                getTokenPDA(TEST_CP_AMMS.lpMint1.address, generalUser.address), getTokenPDA(TEST_CP_AMMS.lpMint2.address, generalUser.address), getTokenPDA(TEST_CP_AMMS.lpMint3.address,generalUser.address)
            ]);

            const feeAuthority = (await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0])).data.feeAuthority;

            [
                FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken1, FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken2, FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken3,
                FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken221, FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken222, FEE_AUTHORITY_TOKEN_ACCOUNTS.transferFeeToken22
            ] = await Promise.all([
                getTokenPDA(TEST_MINTS.validTokenMint1.address, feeAuthority), getTokenPDA(TEST_MINTS.validTokenMint2.address, feeAuthority), getTokenPDA(TEST_MINTS.validTokenMint3.address, feeAuthority),
                getToken22PDA(TEST_MINTS.validToken22Mint1.address, feeAuthority), getToken22PDA(TEST_MINTS.validToken22Mint2.address, feeAuthority), getToken22PDA(TEST_MINTS.transferFeeToken2022Mint.address, feeAuthority)
            ]);

            USER_TOKEN_ACCOUNTS.validToken1 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint1.address, user, user, BigInt(1_000_000_000_000_000));
            USER_TOKEN_ACCOUNTS.validToken2 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint2.address, user, user, BigInt(1_000_000_000_000_000));
            USER_TOKEN_ACCOUNTS.validToken3 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint3.address, user, user, BigInt(1_000_000_000_000_000));

            USER_TOKEN_ACCOUNTS.validToken221 = await createAtaWithTokens22(rpcClient, TEST_MINTS.validToken22Mint1.address, user, user, BigInt(1_000_000_000_000_000));
            USER_TOKEN_ACCOUNTS.validToken222 = await createAtaWithTokens22(rpcClient, TEST_MINTS.validToken22Mint2.address, user, user, BigInt(1_000_000_000_000_000));
            USER_TOKEN_ACCOUNTS.transferFeeToken22 = await createAtaWithTokens22(rpcClient, TEST_MINTS.transferFeeToken2022Mint.address, user, user, BigInt(1_000_000_000_000_000));

            GENERAL_USER_TOKEN_ACCOUNTS.validToken1 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint1.address, user, generalUser, BigInt(1_000_000_000_000_000));
            GENERAL_USER_TOKEN_ACCOUNTS.validToken2 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint2.address, user, generalUser, BigInt(1_000_000_000_000_000));
            GENERAL_USER_TOKEN_ACCOUNTS.validToken3 = await createAtaWithTokens(rpcClient, TEST_MINTS.validTokenMint3.address, user, generalUser, BigInt(1_000_000_000_000_000));

            GENERAL_USER_TOKEN_ACCOUNTS.validToken221 = await createAtaWithTokens22(rpcClient, TEST_MINTS.validToken22Mint1.address, user, generalUser, BigInt(1_000_000_000_000_000));
            GENERAL_USER_TOKEN_ACCOUNTS.validToken222 = await createAtaWithTokens22(rpcClient, TEST_MINTS.validToken22Mint2.address, user, generalUser, BigInt(1_000_000_000_000_000));
            GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22 = await createAtaWithTokens22(rpcClient, TEST_MINTS.transferFeeToken2022Mint.address, user, generalUser, BigInt(1_000_000_000_000_000));

        })

        // Initialize CpAmm

        it("Unfunded with 0.1 SOL CpAmm initialization attempt should fail", async () => {
            const unfundedUser = await createTestUser(rpcClient, 0.1);

            const input: InitializeCpAmmInput = {
                signer: unfundedUser,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unfunded with 0.1 SOL CpAmm initialization attempt");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with equal mints should fail", async () => {

            const input: InitializeCpAmmInput = {
                signer: user,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint1.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.baseVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with equal mints");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with invalid fee authority should fail", async () => {

            const input: InitializeCpAmmInput = {
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: user.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with invalid fee authority");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with malware AmmsConfig should fail", async () => {
            const malwareAmmsConfigAddress = TEST_MINTS.validTokenMint2.address;
            const input: InitializeCpAmmInput = {
                ammsConfig: malwareAmmsConfigAddress,
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization malware AmmsConfig");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with invalid LP mint should fail", async () => {
            const invalidLpMint = await generateKeyPairSigner();

            const input: InitializeCpAmmInput = {
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: invalidLpMint,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with invalid LP mint");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with invalid token account as vault should fail", async () => {
            const invalidPdaTokenAccount = await getProgramDerivedAddress({
                programAddress: program.LIQUIDITY_POOL_PROGRAM_ADDRESS,
                seeds: ["vaultt", getAddressEncoder().encode(TEST_CP_AMMS.cpAmm1[0]), getAddressEncoder().encode(TEST_MINTS.validTokenMint1.address)]
            });

            const input: InitializeCpAmmInput = {
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1[0],
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: invalidPdaTokenAccount[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with invalid token account as vault");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with mint with freeze authority should fail", async () => {
            const [baseVault] = await getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm1[0], TEST_MINTS.freezeAuthorityTokenMint.address);
            const input: InitializeCpAmmInput = {
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.freezeAuthorityTokenMint.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: baseVault,
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with mint with freeze authority");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with mint with one of forbidden token extensions (Permanent Delegate) should fail", async () => {
            const [baseVault] = await getCpAmmVaultPDA(TEST_CP_AMMS.cpAmm1[0], TEST_MINTS.permanentDelegateToken2022Mint.address);
            const input: InitializeCpAmmInput = {
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.permanentDelegateToken2022Mint.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validTokenMint2.address,
                cpAmmBaseVault: baseVault,
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                signer: user,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with mint with one of forbidden token extensions (Permanent Delegate)");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with token mint and token 2022", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const input: InitializeCpAmmInput = {
                signer: user,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validToken22Mint1.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_2022_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [feeAuthorityBalanceAfter, lpMintAccount, cpAmmAccount, cpAmmBaseVaultAccount, cpAmmQuoteVaultAccount, cpAmmLockedLpVaultAccount] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint1.address),
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.baseVault1[0]),
                fetchToken22Account(rpcClient.rpc, TEST_CP_AMMS.quoteVault1[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.lpVault1[0]),
            ]);

            assert.ok(lpMintAccount, "LP mint account was not created");
            assert.ok(cpAmmAccount, "CpAmm account was not created");
            assert.ok(cpAmmBaseVaultAccount, "CpAmm base vault account was not created");
            assert.ok(cpAmmQuoteVaultAccount, "CpAmm quote vault account was not created");
            assert.ok(cpAmmLockedLpVaultAccount, "CpAmm locked LP vault account was not created");

            assert.strictEqual((feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value), BigInt(100_000_000), "Fee authority balance does not match expected value");

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address), "LP mint authority is incorrect");
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none(), "LP mint freeze authority should be none");

            assert.strictEqual(cpAmmAccount.data.creator, user.address,  "Creator address mismatch");
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0],  "AMMs config address mismatch");
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint1.address, "Base mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.validToken22Mint1.address, "Quote mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.lpMint, lpMintAccount.address, "LP mint address mismatch");

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault1[0], "Base vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault1[0], "Quote vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault1[0], "LP vault address mismatch");

            assert.strictEqual(cpAmmAccount.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccount.data.isLaunched, false,  "CpAmm shouldn't be launched");

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0), "Initial locked liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0), "LP token supply should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0), "Protocol base fees should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0), "Protocol quote fees should be 0");
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0), "Base liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0), "Quote liquidity should be 0");

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Base quote ratio sqrt should be initialized to 0");
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Constant product sqrt should be initialized to 0");

            assert.strictEqual(cpAmmAccount.data.bump[0], TEST_CP_AMMS.cpAmm1[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.baseVaultBump[0], TEST_CP_AMMS.baseVault1[1].valueOf(), "Base vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.quoteVaultBump[0], TEST_CP_AMMS.quoteVault1[1].valueOf(), "Quote vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.lockedLpVaultBump[0], TEST_CP_AMMS.lpVault1[1].valueOf(), "Locked LP vault bump value is incorrect");
        })

        it("Reinitialization of CpAmm should fail", async () => {
            const input: InitializeCpAmmInput = {
                signer: user,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint1.address,
                cpAmm: TEST_CP_AMMS.cpAmm1[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint1,
                quoteMint: TEST_MINTS.validToken22Mint1.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_2022_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm reinitialization");
                },
                (_error) => {}
            ));
        })

        it("Initialization CpAmm with two token mints", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const input: InitializeCpAmmInput = {
                signer: user,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint2.address,
                cpAmm: TEST_CP_AMMS.cpAmm2[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint2,
                quoteMint: TEST_MINTS.validTokenMint3.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault2[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault2[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault2[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_PROGRAM_ADDRESS
            }

            const ix = getInitializeCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [feeAuthorityBalanceAfter, lpMintAccount, cpAmmAccount, cpAmmBaseVaultAccount, cpAmmQuoteVaultAccount, cpAmmLockedLpVaultAccount] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint2.address),
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.baseVault2[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.quoteVault2[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.lpVault2[0]),
            ]);

            assert.ok(lpMintAccount, "LP mint account was not created");
            assert.ok(cpAmmAccount, "CpAmm account was not created");
            assert.ok(cpAmmBaseVaultAccount, "CpAmm base vault account was not created");
            assert.ok(cpAmmQuoteVaultAccount, "CpAmm quote vault account was not created");
            assert.ok(cpAmmLockedLpVaultAccount, "CpAmm locked LP vault account was not created");

            assert.strictEqual((feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value), BigInt(100_000_000), "Fee authority balance does not match expected value");

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address), "LP mint authority is incorrect");
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none(), "LP mint freeze authority should be none");

            assert.strictEqual(cpAmmAccount.data.creator, user.address,  "Creator address mismatch");
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0],  "AMMs config address mismatch");
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint2.address, "Base mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.validTokenMint3.address, "Quote mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.lpMint, lpMintAccount.address, "LP mint address mismatch");

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault2[0], "Base vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault2[0], "Quote vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault2[0], "LP vault address mismatch");

            assert.strictEqual(cpAmmAccount.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccount.data.isLaunched, false,  "CpAmm shouldn't be launched");

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0), "Initial locked liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0), "LP token supply should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0), "Protocol base fees should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0), "Protocol quote fees should be 0");
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0), "Base liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0), "Quote liquidity should be 0");

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Base quote ratio sqrt should be initialized to 0");
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Constant product sqrt should be initialized to 0");

            assert.strictEqual(cpAmmAccount.data.bump[0], TEST_CP_AMMS.cpAmm2[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.baseVaultBump[0], TEST_CP_AMMS.baseVault2[1].valueOf(), "Base vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.quoteVaultBump[0], TEST_CP_AMMS.quoteVault2[1].valueOf(), "Quote vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.lockedLpVaultBump[0], TEST_CP_AMMS.lpVault2[1].valueOf(), "Locked LP vault bump value is incorrect");
        })

        it("Initialization CpAmm with token mint and token 2022 with one of allowed extensions (Transfer Fee Config)", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const input: InitializeCpAmmInput = {
                signer: user,
                ammsConfig: ammsConfigAddress[0],
                baseMint: TEST_MINTS.validTokenMint2.address,
                cpAmm: TEST_CP_AMMS.cpAmm3[0],
                feeAuthority: headAuthority.address,
                lpMint: TEST_CP_AMMS.lpMint3,
                quoteMint: TEST_MINTS.transferFeeToken2022Mint.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault3[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault3[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault3[0],
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                baseTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: TOKEN_2022_PROGRAM_ADDRESS
            }
            const ix = getInitializeCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [feeAuthorityBalanceAfter, lpMintAccount, cpAmmAccount, cpAmmBaseVaultAccount, cpAmmQuoteVaultAccount, cpAmmLockedLpVaultAccount] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint3.address),
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.baseVault3[0]),
                fetchToken22Account(rpcClient.rpc, TEST_CP_AMMS.quoteVault3[0]),
                fetchTokenAccount(rpcClient.rpc, TEST_CP_AMMS.lpVault3[0]),
            ]);

            assert.ok(lpMintAccount, "LP mint account was not created");
            assert.ok(cpAmmAccount, "CpAmm account was not created");
            assert.ok(cpAmmBaseVaultAccount, "CpAmm base vault account was not created");
            assert.ok(cpAmmQuoteVaultAccount, "CpAmm quote vault account was not created");
            assert.ok(cpAmmLockedLpVaultAccount, "CpAmm locked LP vault account was not created");

            assert.strictEqual((feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value), BigInt(100_000_000), "Fee authority balance does not match expected value");

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address), "LP mint authority is incorrect");
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none(), "LP mint freeze authority should be none");

            assert.strictEqual(cpAmmAccount.data.creator, user.address,  "Creator address mismatch");
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0],  "AMMs config address mismatch");
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint2.address, "Base mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.transferFeeToken2022Mint.address, "Quote mint address mismatch");
            assert.strictEqual(cpAmmAccount.data.lpMint, lpMintAccount.address, "LP mint address mismatch");

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault3[0], "Base vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault3[0], "Quote vault address mismatch");
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault3[0], "LP vault address mismatch");

            assert.strictEqual(cpAmmAccount.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccount.data.isLaunched, false,  "CpAmm shouldn't be launched");

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0), "Initial locked liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0), "LP token supply should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0), "Protocol base fees should be 0");
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0), "Protocol quote fees should be 0");
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0), "Base liquidity should be 0");
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0), "Quote liquidity should be 0");

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Base quote ratio sqrt should be initialized to 0");
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]}, "Constant product sqrt should be initialized to 0");

            assert.strictEqual(cpAmmAccount.data.bump[0], TEST_CP_AMMS.cpAmm3[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.baseVaultBump[0], TEST_CP_AMMS.baseVault3[1].valueOf(), "Base vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.quoteVaultBump[0], TEST_CP_AMMS.quoteVault3[1].valueOf(), "Quote vault bump value is incorrect");
            assert.strictEqual(cpAmmAccount.data.lockedLpVaultBump[0], TEST_CP_AMMS.lpVault3[1].valueOf(), "Locked LP vault bump value is incorrect");
        })

        // Launch CpAmm

        it("Launch CpAmm with insufficient balance of base tokens on signer's account should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(9_000_000_000_000_000);
            const quoteLiquidity = BigInt(43241);

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with insufficient balance of base tokens on signer's account");
                },
                (_error) => {}
            ));
        })

        it("Launch CpAmm with insufficient balance of quote tokens on signer's account should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(23437123213686);
            const quoteLiquidity = BigInt(1_000_000_000_000_001);

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with insufficient balance of quote tokens on signer's account");
                },
                (_error) => {}
            ));
        })

        it("Launch CpAmm with signer that isn't CpAmm creator should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: generalUser,
                creatorBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken1.address,
                creatorLpAccount:  GENERAL_USER_TOKEN_ACCOUNTS.lpToken1[0],
                creatorQuoteAccount:  GENERAL_USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with signer that isn't CpAmm creator");
                },
                (_error) => {}
            ));
        })

        it("Launch CpAmm with token mint and token 2022 mint", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send()
            ]);
            const [baseMint, quoteMint, lpMintAccountBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint)
            ]);

            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);
            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * quoteLiquidity))));

            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalance, cpAmmQuoteBalance, cpAmmLpBalance] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken1[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteLiquidity, "CpAmm quote balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity, "CpAmm locked lp balance does not match expected value");

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator,  "Creator address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.baseVault,  cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.quoteVault,  cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.lockedLpVault,  cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity, `Initial locked liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {value: [[ 11569318178613274784n, 12626128898751551786n, 0n ]]}, "Base quote ratio sqrt mismatch");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {value: [[ 11035359224094822028n, 1696597754053898133n, 310231742n ]]}, "Constant product sqrt mismatch");
        })

        it("Relaunch of CpAmm should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm relaunching");
                },
                (_error) => {}
            ));
        })

        it("Launch CpAmm with launch liquidity less then initial locked liquidity x4 should fail", async () => {
            const [cpAmmAccountBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0])
            ]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(159999);
            const quoteLiquidity = BigInt(999999);

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault2[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault2[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault2[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken2.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken2[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken3.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with launch liquidity less then initial locked liquidity x4");
                },
                (_error) => {}
            ));
        })

        it("Launch CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);
            const [baseMint, quoteMint, lpMintAccountBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint)
            ]);

            const baseLiquidity = BigInt(160000);
            const quoteLiquidity = BigInt(1_000_000);
            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * quoteLiquidity))));

            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault2[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault2[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault2[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken2.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken2[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken3.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalance, cpAmmQuoteBalance, cpAmmLpBalance] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteLiquidity, "CpAmm quote balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity, "CpAmm locked lp balance does not match expected value");

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator,  "Creator address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.baseVault,  cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.quoteVault,  cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.lockedLpVault,  cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity, `Initial locked liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {value: [[ 7378697629483820645n, 7378697629483820646n, 0n ] ]}, "Base quote ratio sqrt mismatch");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {value: [[ 0n, 0n, 400000n ]]}, "Constant product sqrt mismatch");
        })

        it("Launch CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0]),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send()
            ]);
            const [baseMint, quoteMint, lpMintAccountBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint)
            ]);

            const baseLiquidity = BigInt(5465487548754);
            const quoteLiquidity = BigInt(983129578946);

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find((extension) => extension.__kind == "TransferFeeConfig").olderTransferFee;
            const quoteFee = (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000)) < BigInt(transferFee.maximumFee)
                ? (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000))
                : BigInt(transferFee.maximumFee);

            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * (quoteLiquidity - quoteFee)))));

            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;

            const input: LaunchCpAmmInput = {
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseLiquidity,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault3[0],
                cpAmmLockedLpVault: TEST_CP_AMMS.lpVault3[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault3[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteLiquidity,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                creator: user,
                creatorBaseAccount: USER_TOKEN_ACCOUNTS.validToken2.address,
                creatorLpAccount:  USER_TOKEN_ACCOUNTS.lpToken3[0],
                creatorQuoteAccount:  USER_TOKEN_ACCOUNTS.transferFeeToken22.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
            }

            const ix = getLaunchCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalance, cpAmmQuoteBalance, cpAmmLpBalance] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken3[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteLiquidity - quoteFee, "CpAmm quote balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity, "CpAmm locked lp balance does not match expected value");

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator,  "Creator address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.baseVault,  cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.quoteVault,  cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.lockedLpVault,  cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity, `Initial locked liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity - quoteFee, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {value: [[ 3475547461318636948n, 6600456554340055308n, 2n ]]}, "Base quote ratio sqrt mismatch");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {value: [[ 16463856578203948456n, 17179385210221578158n, 2318034170991n ]]}, "Constant product sqrt mismatch");

        })

        // Provide to CpAmm

        it("Provide liquidity to CpAmm with invalid token ratio should fail", async () => {
            const cpAmmAccountBefore = await  fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint)
            ]);

            const baseLiquidity = BigInt(480000);
            const quoteLiquidity = BigInt(3_000_001);

            const input: ProvideToCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                lpMint: cpAmmAccountBefore.data.lpMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerLpAccount: GENERAL_USER_TOKEN_ACCOUNTS.lpToken2[0],
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
                baseLiquidity,
                quoteLiquidity,
            }

            const ix = getProvideToCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of providing liquidity to CpAmm with invalid token ratio");
                },
                (_error) => {}
            ));
        });

        it("Provide liquidity to CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore, signerLpBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                0,
            ]);
            const [baseMint, quoteMint, lpMintAccountBefore, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, cpAmmLpBalanceBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.lockedLpVault).send()
            ]);

            const baseLiquidity = BigInt(480000);
            const quoteLiquidity = BigInt(3_000_000);
            const providedLiquidity = BigInt(1200000);

            const input: ProvideToCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                lpMint: cpAmmAccountBefore.data.lpMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerLpAccount: GENERAL_USER_TOKEN_ACCOUNTS.lpToken2[0],
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
                baseLiquidity,
                quoteLiquidity,
            }

            const ix = getProvideToCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const cpAmmAccountAfter: Account<CpAmm> = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter, cpAmmLpBalanceAfter] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.lpToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount) - BigInt(signerLpBalanceBefore), providedLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceAfter.value.amount) - BigInt(cpAmmBaseBalanceBefore.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), quoteLiquidity, "CpAmm quote balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmLpBalanceAfter.value.amount), BigInt(cpAmmLpBalanceBefore.value.amount), "CpAmm locked lp balance should remain unchanged");

            assert.strictEqual(lpMintAccountAfter.data.supply - lpMintAccountBefore.data.supply, providedLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountBefore.data.initialLockedLiquidity, cpAmmAccountAfter.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply - cpAmmAccountBefore.data.lpTokensSupply, providedLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, quoteLiquidity, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountBefore.data.baseQuoteRatioSqrt, cpAmmAccountAfter.data.baseQuoteRatioSqrt, "Base quote ratio should remain unchanged");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 0n, 0n, 1600000n ] ] }, "Constant product sqrt mismatch");

        })

        it("Provide liquidity to CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore, signerLpBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0]),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                0,
            ]);
            const [baseMint, quoteMint, lpMintAccountBefore, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, cpAmmLpBalanceBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.lockedLpVault).send()
            ]);

            const baseLiquidity = BigInt(5465487548754 * 5);
            const quoteLiquidity = BigInt(983129568946 * 5) + 10000n;

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find((extension) => extension.__kind == "TransferFeeConfig").olderTransferFee;
            const quoteFee = (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000)) < BigInt(transferFee.maximumFee)
                ? (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000))
                : BigInt(transferFee.maximumFee);

            const quoteAfterFeeLiquidity = quoteLiquidity - quoteFee;
            const providedLiquidity = BigInt(11590170854955);

            const input: ProvideToCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                lpMint: cpAmmAccountBefore.data.lpMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerLpAccount: GENERAL_USER_TOKEN_ACCOUNTS.lpToken3[0],
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress,
                baseLiquidity,
                quoteLiquidity,
            }

            const ix = getProvideToCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            )

            const cpAmmAccountAfter: Account<CpAmm> = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter, cpAmmLpBalanceAfter] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.lpToken3[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount) - BigInt(signerLpBalanceBefore), providedLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceAfter.value.amount) - BigInt(cpAmmBaseBalanceBefore.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), quoteAfterFeeLiquidity, "CpAmm quote balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmLpBalanceAfter.value.amount), BigInt(cpAmmLpBalanceBefore.value.amount), "CpAmm locked lp balance should remain unchanged");

            assert.strictEqual(lpMintAccountAfter.data.supply - lpMintAccountBefore.data.supply, providedLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountBefore.data.initialLockedLiquidity, cpAmmAccountAfter.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply - cpAmmAccountBefore.data.lpTokensSupply, providedLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, quoteAfterFeeLiquidity, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountBefore.data.baseQuoteRatioSqrt, cpAmmAccountAfter.data.baseQuoteRatioSqrt, "Base quote ratio should remain unchanged");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 6549419100675932660n, 10842590892781710873n, 13908205025951n ]  ] }, "Constant product sqrt mismatch");

        })

        // Swap in CpAmm

        it("Swap base to quote in CpAmm with exceeding slippage should fail", async() => {
            const [cpAmmAccountBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0])
            ]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
            ]);

            const swapBaseAmount = BigInt(1_242_344);
            const isInOut = true;
            // Invalid result to check slippage
            const estimatedResult = BigInt(2593581);
            // Slippage exceeded by 2
            const allowedSlippage = BigInt(0);


            const input: SwapInCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress,
                swapAmount: swapBaseAmount,
                isInOut,
                estimatedResult,
                allowedSlippage
            };

            const ix = getSwapInCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of swap base to quote in CpAmm with exceeding slippage");
                },
                (_error) => {}
            ));
        })

        it("Swap base to quote in CpAmm that drains base liquidity should fail", async() => {
            const [cpAmmAccountBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0])
            ]);
            const [baseMint, quoteMint] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
            ]);
            // After 5% fees 2_559_996_000_001
            const swapQuoteAmount = BigInt(2_694_732_631_580);
            const isInOut = false;
            const estimatedResult = BigInt(640_000);
            const allowedSlippage = BigInt(0);


            const input: SwapInCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress,
                swapAmount: swapQuoteAmount,
                isInOut,
                estimatedResult,
                allowedSlippage
            };

            const ix = getSwapInCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of swap base to quote in CpAmm with exceeding slippage");
                },
                (_error) => {}
            ));
        })

        it("Swap base to quote in CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);
            const [ammsConfig, baseMint, quoteMint, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const swapBaseAmount = BigInt(1_242_344);
            const protocolFee = swapBaseAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints) / BigInt(10_000);
            const providersFee = swapBaseAmount * BigInt(ammsConfig.data.providersFeeRateBasisPoints) / BigInt(10_000);

            //1_180_228
            const swapBaseAmountAfterFees = swapBaseAmount - providersFee - protocolFee;

            const isInOut = true;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(2593583);

            const input: SwapInCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: generalUser,
                signerBaseAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                signerQuoteAccount: GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress,
                swapAmount: swapBaseAmount,
                isInOut,
                estimatedResult,
                allowedSlippage
            };

            const ix = getSwapInCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [cpAmmAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), swapBaseAmount, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceAfter.value.amount) - BigInt(signerQuoteBalanceBefore.value.amount), estimatedResult, "Signer quote balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceAfter.value.amount) - BigInt(cpAmmBaseBalanceBefore.value.amount), swapBaseAmount, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceBefore.value.amount) - BigInt(cpAmmQuoteBalanceAfter.value.amount), estimatedResult, "CpAmm quote balance does not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.protocolBaseFeesToRedeem - cpAmmAccountBefore.data.protocolBaseFeesToRedeem, protocolFee, "Protocol base fees do not match expected value");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, cpAmmAccountBefore.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, cpAmmAccountBefore.data.lpTokensSupply, `LP token supply should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, swapBaseAmountAfterFees + providersFee, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity - swapBaseAmountAfterFees, providersFee, "Collected base providers fees doesn't match");
            assert.strictEqual(cpAmmAccountBefore.data.quoteLiquidity - cpAmmAccountAfter.data.quoteLiquidity, estimatedResult, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, { value: [ [ 16462419620470434942n, 2823589378402813650n, 1n ] ] }, "Base quote ratio does not match expected value");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 1819616245600884935n, 2825593252532761162n, 1621693n ] ] }, "Constant product does not match expected value");

        })

        it("Swap quote to base in CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2[0]),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);
            const [ammsConfig, baseMint, quoteMint, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const swapQuoteAmount = BigInt(10_000);
            const protocolFee = swapQuoteAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints) / BigInt(10_000);
            const providersFee = swapQuoteAmount * BigInt(ammsConfig.data.providersFeeRateBasisPoints) / BigInt(10_000);

            //9_500
            const swapQuoteAmountAfterFees = swapQuoteAmount - providersFee - protocolFee;

            const isInOut = false;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(12546);

            const input: SwapInCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: user,
                signerBaseAccount: USER_TOKEN_ACCOUNTS.validToken2.address,
                signerQuoteAccount: USER_TOKEN_ACCOUNTS.validToken3.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress,
                swapAmount: swapQuoteAmount,
                isInOut,
                estimatedResult,
                allowedSlippage
            };

            const ix = getSwapInCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [cpAmmAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceAfter.value.amount) - BigInt(signerBaseBalanceBefore.value.amount), estimatedResult, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), swapQuoteAmount, "Signer quote balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceBefore.value.amount) - BigInt(cpAmmBaseBalanceAfter.value.amount), estimatedResult, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), swapQuoteAmount, "CpAmm quote balance does not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem - cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, protocolFee, "Protocol quote fees do not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, cpAmmAccountBefore.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, cpAmmAccountBefore.data.lpTokensSupply, `LP token supply should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, swapQuoteAmountAfterFees + providersFee, `Quote liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity - swapQuoteAmountAfterFees, providersFee, "Collected quote providers fees doesn't match");
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, estimatedResult, `Base liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, { value: [ [ 15987902991137401516n, 2677894456575790090n, 1n ] ] }, "Base quote ratio does not match expected value");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 7047898065208341957n, 4627779000934118380n, 1621922n ] ] }, "Constant product does not match expected value");

        })

        it("Swap quote to base in CpAmm with token mints and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0]),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send()
            ]);
            const [ammsConfig, baseMint, quoteMint, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const quoteAmountBeforeTransfer = BigInt(1_522_710_696);

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find((extension) => extension.__kind == "TransferFeeConfig").olderTransferFee;
            const tokenSwapFee = (quoteAmountBeforeTransfer * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000)) < BigInt(transferFee.maximumFee)
                ? (quoteAmountBeforeTransfer * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000))
                : BigInt(transferFee.maximumFee);

            const swapQuoteAmount = quoteAmountBeforeTransfer - tokenSwapFee;

            const protocolFee = swapQuoteAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints) / BigInt(10_000);
            const providersFee = swapQuoteAmount  * BigInt(ammsConfig.data.providersFeeRateBasisPoints) / BigInt(10_000);

            //1_446_565_663
            const swapQuoteAmountAfterFees = swapQuoteAmount - providersFee - protocolFee;

            const isInOut = false;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(8039884568);

            const input: SwapInCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: user,
                signerBaseAccount: USER_TOKEN_ACCOUNTS.validToken2.address,
                signerQuoteAccount: USER_TOKEN_ACCOUNTS.transferFeeToken22.address,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress,
                swapAmount: quoteAmountBeforeTransfer,
                isInOut,
                estimatedResult,
                allowedSlippage
            };

            const ix = getSwapInCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [cpAmmAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceAfter.value.amount) - BigInt(signerBaseBalanceBefore.value.amount), estimatedResult, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteAmountBeforeTransfer, "Signer quote balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceBefore.value.amount) - BigInt(cpAmmBaseBalanceAfter.value.amount), estimatedResult, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), swapQuoteAmount, "CpAmm quote balance does not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem - cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, protocolFee, "Protocol quote fees do not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, cpAmmAccountBefore.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, cpAmmAccountBefore.data.lpTokensSupply, `LP token supply should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, swapQuoteAmountAfterFees + providersFee, `Quote liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity - swapQuoteAmountAfterFees, providersFee, "Collected quote providers fees doesn't match");
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, estimatedResult, `Base liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, { value: [ [ 13633151984817872298n, 6589568649514524675n, 2n ]  ] }, "Base quote ratio does not match expected value");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 2275439533309780308n, 339741531755323081n, 13908276812984n ] ] }, "Constant product does not match expected value");
        })

        // Withdraw from CpAmm

        it("Withdraw liquidity from CpAmm with insufficient balance of lp tokens on signer's account should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [baseMint, quoteMint, signerLpBalance] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken1[0]).send()
            ]);

            const withdrawLiquidity = BigInt(signerLpBalance.value.amount) + BigInt(1);
            const input: WithdrawFromCpAmmInput = {
                lpTokens: withdrawLiquidity,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                signer: user,
                signerBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                signerLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                signerQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress
            }

            const ix = getWithdrawFromCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of withdrawing liquidity from CpAmm with insufficient balance of lp tokens on signer's account");
                },
                (_error) => {}
            ));
        })

        it("Withdraw liquidity from CpAmm with token mint and token 2022 mint", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1[0]);
            const [lpMintAccountBefore, baseMint, quoteMint, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore, signerLpBalanceBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken1[0]).send()
            ]);

            const withdrawLiquidity = BigInt(268_234_561);
            const baseLiquidity = BigInt(183_596_852);
            const quoteLiquidity = BigInt(391_890_051);

            const input: WithdrawFromCpAmmInput = {
                lpTokens: withdrawLiquidity,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                baseMint: cpAmmAccountBefore.data.baseMint,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: TEST_CP_AMMS.baseVault1[0],
                cpAmmQuoteVault: TEST_CP_AMMS.quoteVault1[0],
                lpMint: cpAmmAccountBefore.data.lpMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                signer: user,
                signerBaseAccount: USER_TOKEN_ACCOUNTS.validToken1.address,
                signerQuoteAccount:  USER_TOKEN_ACCOUNTS.validToken221.address,
                signerLpAccount:  USER_TOKEN_ACCOUNTS.lpToken1[0],
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                lpTokenProgram: TOKEN_PROGRAM_ADDRESS,
                quoteTokenProgram: quoteMint.programAddress
            }

            const ix = getWithdrawFromCpAmmInstruction(input);
            console.log()
            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).catch((error) => console.log(error));

            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [lpMintAccountAfter, signerBaseBalanceAfter, signerQuoteBalanceAfter, signerLpBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken1[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceAfter.value.amount) - BigInt(signerBaseBalanceBefore.value.amount), baseLiquidity, "Signer base balance does not match expected value");
            assert.strictEqual(BigInt(signerQuoteBalanceAfter.value.amount) - BigInt(signerQuoteBalanceBefore.value.amount), quoteLiquidity, "Signer quote balance does not match expected value");
            assert.strictEqual(BigInt(signerLpBalanceBefore.value.amount) - BigInt(signerLpBalanceAfter.value.amount), withdrawLiquidity, "Signer lp balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceBefore.value.amount) - BigInt(cpAmmBaseBalanceAfter.value.amount), baseLiquidity, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceBefore.value.amount) - BigInt(cpAmmQuoteBalanceAfter.value.amount), quoteLiquidity, "CpAmm quote balance does not match expected value");

            assert.strictEqual(lpMintAccountBefore.data.supply - lpMintAccountAfter.data.supply, withdrawLiquidity, "LP mint supply is incorrect");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem, "Protocol base fees should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, "Protocol quote fees should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountBefore.data.initialLockedLiquidity, cpAmmAccountAfter.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountBefore.data.lpTokensSupply - cpAmmAccountAfter.data.lpTokensSupply, withdrawLiquidity, `LP token supply does not match expected value`);
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, baseLiquidity, `Base liquidity does not match expected value`);
            assert.strictEqual(cpAmmAccountBefore.data.quoteLiquidity - cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity, `Quote liquidity does not match expected value`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, { value: [ [ 13491493305820030747n, 12626128903649178949n, 0n ] ] }, "Base quote ratio should remain unchanged");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, { value: [ [ 10456609623689113206n, 2423619042181433239n, 41997181n ] ] }, "Constant product sqrt mismatch");

        })

        // Collect Fees from CpAmm

        it("Collect fees from CpAmm with invalid fee authority should fail", async () => {
            const [cpAmmAccountBefore, invalidFeeAuthority] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0]),
                generateKeyPairSigner()
            ]);
            const [baseMint, quoteMint, invalidFeeAuthorityBaseAccount, invalidFeeAuthorityQuoteAccount] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                getTokenPDA(cpAmmAccountBefore.data.baseMint, invalidFeeAuthority.address),
                getToken22PDA(cpAmmAccountBefore.data.quoteMint, invalidFeeAuthority.address)
            ]);

            const input: CollectFeesFromCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: user,
                feeAuthority: invalidFeeAuthority.address,
                feeAuthorityBaseAccount: invalidFeeAuthorityBaseAccount[0],
                feeAuthorityQuoteAccount: invalidFeeAuthorityQuoteAccount[0],
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress
            };

            const ix = getCollectFeesFromCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of collecting fees from CpAmm with invalid fee authority should fail");
                },
                (_error) => {}
            ));
        })

        it("Collect fees from CpAmm from CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0])
            ]);
            const [ammsConfig, baseMint, quoteMint, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, feeAuthorityBaseBalanceBefore, feeAuthorityQuoteBalanceBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                0,
                0
            ]);

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find((extension) => extension.__kind == "TransferFeeConfig").olderTransferFee;
            const quoteTransferFee = (cpAmmAccountBefore.data.protocolQuoteFeesToRedeem * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000)) < BigInt(transferFee.maximumFee)
                ? (cpAmmAccountBefore.data.protocolQuoteFeesToRedeem * BigInt(transferFee.transferFeeBasisPoints) / BigInt(10_000))
                : BigInt(transferFee.maximumFee);

            const input: CollectFeesFromCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: user,
                feeAuthority: ammsConfig.data.feeAuthority,
                feeAuthorityBaseAccount: FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken2[0],
                feeAuthorityQuoteAccount: FEE_AUTHORITY_TOKEN_ACCOUNTS.transferFeeToken22[0],
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress
            };

            const ix = getCollectFeesFromCpAmmInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const [cpAmmAccountAfter, feeAuthorityBaseBalanceAfter, feeAuthorityQuoteBalanceAfter, cpAmmBaseBalanceAfter, cpAmmQuoteBalanceAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(FEE_AUTHORITY_TOKEN_ACCOUNTS.transferFeeToken22[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(feeAuthorityBaseBalanceAfter.value.amount) - BigInt(feeAuthorityBaseBalanceBefore), cpAmmAccountBefore.data.protocolBaseFeesToRedeem, "Fee authority base balance does not match expected value");
            assert.strictEqual(BigInt(feeAuthorityQuoteBalanceAfter.value.amount) - BigInt(feeAuthorityQuoteBalanceBefore), cpAmmAccountBefore.data.protocolQuoteFeesToRedeem - quoteTransferFee, "Fee authority quote balance does not match expected value");

            assert.strictEqual(BigInt(cpAmmBaseBalanceBefore.value.amount) - BigInt(cpAmmBaseBalanceAfter.value.amount), cpAmmAccountBefore.data.protocolBaseFeesToRedeem, "CpAmm base balance does not match expected value");
            assert.strictEqual(BigInt(cpAmmQuoteBalanceBefore.value.amount) - BigInt(cpAmmQuoteBalanceAfter.value.amount), cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, "CpAmm quote balance does not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig,  "AMMs config address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint, "Base mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint, "Quote mint address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint, "LP mint address should remain unchanged");

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault, "Base vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault, "Quote vault address should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault, "LP vault address should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.protocolBaseFeesToRedeem, BigInt(0), "Protocol base fees do not match expected value");
            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, BigInt(0), "Protocol quote fees do not match expected value");

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0], "Bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0], "Base vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0], "Quote vault bump value should remain unchanged");
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0], "Locked LP vault bump value should remain unchanged");

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true,  "CpAmm should be initialized");
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true,  "CpAmm should be launched");

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, cpAmmAccountBefore.data.initialLockedLiquidity, `Initial locked liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, cpAmmAccountBefore.data.lpTokensSupply, `LP token supply should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, cpAmmAccountBefore.data.quoteLiquidity, `Quote liquidity should remain unchanged`);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, cpAmmAccountAfter.data.baseLiquidity, `Base liquidity should remain unchanged`);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, cpAmmAccountBefore.data.baseQuoteRatioSqrt, "Base quote ratio should remain unchanged");
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, cpAmmAccountBefore.data.constantProductSqrt, "Constant product should remain unchanged");

        })

        it("Collect fees from CpAmm with 0 fees should fail", async () => {
            const [cpAmmAccountBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3[0])
            ]);
            const [ammsConfig, baseMint, quoteMint] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.baseMint),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
            ]);

            const input: CollectFeesFromCpAmmInput = {
                baseMint: cpAmmAccountBefore.data.baseMint,
                quoteMint: cpAmmAccountBefore.data.quoteMint,
                ammsConfig: cpAmmAccountBefore.data.ammsConfig,
                cpAmm: cpAmmAccountBefore.address,
                cpAmmBaseVault: cpAmmAccountBefore.data.baseVault,
                cpAmmQuoteVault: cpAmmAccountBefore.data.quoteVault,
                signer: user,
                feeAuthority: ammsConfig.data.feeAuthority,
                feeAuthorityBaseAccount: FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken2[0],
                feeAuthorityQuoteAccount: FEE_AUTHORITY_TOKEN_ACCOUNTS.transferFeeToken22[0],
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                baseTokenProgram: baseMint.programAddress,
                quoteTokenProgram: quoteMint.programAddress
            };

            const ix = getCollectFeesFromCpAmmInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of collecting fees from CpAmm with 0 fees");
                },
                (_error) => {}
            ));
        })
    })
}