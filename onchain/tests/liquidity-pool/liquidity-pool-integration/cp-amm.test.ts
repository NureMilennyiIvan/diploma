import {
    Account,
    address,
    Address,
    KeyPairSigner,
    none,
    ProgramDerivedAddress, Some,
    some
} from "@solana/kit";
import {before, describe} from "mocha";
import {
    collectFeesFromCpAmm,
    initializeCpAmm,
    launchCpAmm,
    LiquidityPoolBackendIntegrationTestingEnvironment,
    provideToCpAmm, swapInCpAmm, withdrawFromCpAmm
} from "./helpers";
import {createTestUser, decodeSignAndSend, delay, getTransactionLogs} from "../../helpers";
import {
    createAtaWithTokens, createAtaWithTokens22,
    createToken22Mint,
    createToken22MintWithPermanentDelegate,
    createToken22MintWithTransferFee,
    createTokenMint, getToken22PDA, getTokenPDA
} from "../../tokens-helpers";
import {fetchAmmsConfig, fetchCpAmm} from "@liquidity-pool/js";
import {assert} from "chai";
import {
    fetchMint,
    Mint as TokenMint, Token as TokenAccount,
} from "@solana-program/token";
import {
    Mint as Token22Mint,
    Token as Token22Account,
    fetchMint as fetchMint22,
    Extension,
} from "@solana-program/token-2022";

export const cpAmmBackendIntegrationTests = (liquidityPoolTestingEnvironment: LiquidityPoolBackendIntegrationTestingEnvironment, ammsConfigAddress: ProgramDerivedAddress) => {
    describe("\nCpAmm tests", () => {
        const {rpcClient, headAuthority, user} = liquidityPoolTestingEnvironment;
        let generalUser: KeyPairSigner;

        /**
         * Stores test data for CpAmms.
         */
        const TEST_CP_AMMS: {
            lpMint1: Address,
            cpAmm1: Address,
            baseVault1: Address,
            quoteVault1: Address,
            lpVault1: Address,
            lpMint2: Address,
            cpAmm2: Address,
            baseVault2: Address,
            quoteVault2: Address,
            lpVault2: Address,
            lpMint3: Address,
            cpAmm3: Address,
            baseVault3: Address,
            quoteVault3: Address,
            lpVault3: Address
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

        before(async () => {
            generalUser = await createTestUser(rpcClient, 100);

            TEST_MINTS.validTokenMint1 = await createTokenMint(rpcClient, user, 6);
            TEST_MINTS.validTokenMint2 = await createTokenMint(rpcClient, user, 4);
            TEST_MINTS.validTokenMint3 = await createTokenMint(rpcClient, user, 9);
            TEST_MINTS.freezeAuthorityTokenMint = await createTokenMint(rpcClient, user, 1, user.address);

            TEST_MINTS.validToken22Mint1 = await createToken22Mint(rpcClient, user, 3);
            TEST_MINTS.validToken22Mint2 = await createToken22Mint(rpcClient, user, 0);
            TEST_MINTS.transferFeeToken2022Mint = await createToken22MintWithTransferFee(rpcClient, user, 2, 379, 10000);
            TEST_MINTS.permanentDelegateToken2022Mint = await createToken22MintWithPermanentDelegate(rpcClient, user, 0);

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

        /// Initialize CpAmm

        it("Unfunded with 0.1 SOL CpAmm initialization attempt should fail", async () => {
            const unfundedUser = await createTestUser(rpcClient, 0.1);

            const base64Tx = (await initializeCpAmm(
                unfundedUser.address,
                ammsConfigAddress[0],
                TEST_MINTS.validTokenMint1.address,
                TEST_MINTS.validTokenMint2.address,
                liquidityPoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [unfundedUser], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unfunded with 0.1 SOL CpAmm initialization attempt");
                },
                (_error) => {
                }
            );
        });

        it("Initialization CpAmm with equal mints should fail", async () => {
            const base64Tx = (await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.validTokenMint1.address,
                TEST_MINTS.validTokenMint1.address,
                liquidityPoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with equal mints");
                },
                (_error) => {
                }
            );
        });

        it("Initialization CpAmm with malware AmmsConfig should fail", async () => {
            const malwareAmmsConfigAddress = TEST_MINTS.validTokenMint2.address;
            await initializeCpAmm(
                user.address,
                malwareAmmsConfigAddress,
                TEST_MINTS.validTokenMint1.address,
                TEST_MINTS.validTokenMint2.address,
                liquidityPoolTestingEnvironment
            ).then(
                (_) => {
                    assert.fail("Expected failure of CpAmm initialization malware AmmsConfig");
                },
                (_error) => {
                }
            );
        });

        it("Initialization CpAmm with mint with freeze authority should fail", async () => {
            const base64Tx = (await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.freezeAuthorityTokenMint.address,
                TEST_MINTS.validTokenMint2.address,
                liquidityPoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with mint with freeze authority");
                },
                (_error) => {
                }
            );
        });

        it("Initialization CpAmm with mint with one of forbidden token extensions (Permanent Delegate) should fail", async () => {
            const base64Tx = (await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.permanentDelegateToken2022Mint.address,
                TEST_MINTS.validTokenMint2.address,
                liquidityPoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm initialization with mint with one of forbidden token extensions (Permanent Delegate)");
                },
                (_error) => {
                }
            );
        });


        it("Initialization CpAmm with token mint and token 2022 without any extensions", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const [base64Tx, cpAmmPubkey] = await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.validTokenMint1.address,
                TEST_MINTS.validToken22Mint1.address,
                liquidityPoolTestingEnvironment
            );
            TEST_CP_AMMS.cpAmm1 = address(cpAmmPubkey);
            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);

            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1);
            TEST_CP_AMMS.lpMint1 = cpAmmAccount.data.lpMint;
            TEST_CP_AMMS.lpVault1 = cpAmmAccount.data.lockedLpVault;
            TEST_CP_AMMS.baseVault1 = cpAmmAccount.data.baseVault;
            TEST_CP_AMMS.quoteVault1 = cpAmmAccount.data.quoteVault;
            [USER_TOKEN_ACCOUNTS.lpToken1, GENERAL_USER_TOKEN_ACCOUNTS.lpToken1] = await Promise.all([
                getTokenPDA(TEST_CP_AMMS.lpMint1, user.address), getTokenPDA(TEST_CP_AMMS.lpMint1, generalUser.address)
            ]);
            const [feeAuthorityBalanceAfter, lpMintAccount] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint1)
            ]);
            assert.strictEqual(feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value, BigInt(100_000_000));

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address));
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none());

            assert.strictEqual(cpAmmAccount.data.creator, user.address);
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0]);
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint1.address);
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.validToken22Mint1.address);

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault1);
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault1);
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault1);

            assert.strictEqual(cpAmmAccount.data.isInitialized, true);
            assert.strictEqual(cpAmmAccount.data.isLaunched, false);

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0));

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
        });
        it("Initialization CpAmm with two token mints", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const [base64Tx, cpAmmPubkey] = await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.validTokenMint2.address,
                TEST_MINTS.validTokenMint3.address,
                liquidityPoolTestingEnvironment
            );
            TEST_CP_AMMS.cpAmm2 = address(cpAmmPubkey);
            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);

            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2);
            TEST_CP_AMMS.lpMint2 = cpAmmAccount.data.lpMint;
            TEST_CP_AMMS.lpVault2 = cpAmmAccount.data.lockedLpVault;
            TEST_CP_AMMS.baseVault2 = cpAmmAccount.data.baseVault;
            TEST_CP_AMMS.quoteVault2 = cpAmmAccount.data.quoteVault;
            [USER_TOKEN_ACCOUNTS.lpToken2, GENERAL_USER_TOKEN_ACCOUNTS.lpToken2] = await Promise.all([
                getTokenPDA(TEST_CP_AMMS.lpMint2, user.address), getTokenPDA(TEST_CP_AMMS.lpMint2, generalUser.address)
            ]);
            const [feeAuthorityBalanceAfter, lpMintAccount] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint2)
            ]);
            assert.strictEqual(feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value, BigInt(100_000_000));

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address));
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none());

            assert.strictEqual(cpAmmAccount.data.creator, user.address);
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0]);
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint2.address);
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.validTokenMint3.address);

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault2);
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault2);
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault2);

            assert.strictEqual(cpAmmAccount.data.isInitialized, true);
            assert.strictEqual(cpAmmAccount.data.isLaunched, false);

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0));

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
        });
        it("Initialization CpAmm with token mint and token 2022 with one of allowed extensions (Transfer Fee Config)", async () => {
            const feeAuthorityBalanceBefore = await rpcClient.rpc.getBalance(headAuthority.address).send();

            const [base64Tx, cpAmmPubkey] = await initializeCpAmm(
                user.address,
                ammsConfigAddress[0],
                TEST_MINTS.validTokenMint2.address,
                TEST_MINTS.transferFeeToken2022Mint.address,
                liquidityPoolTestingEnvironment
            );
            TEST_CP_AMMS.cpAmm3 = address(cpAmmPubkey);
            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);

            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3);
            TEST_CP_AMMS.lpMint3 = cpAmmAccount.data.lpMint;
            TEST_CP_AMMS.lpVault3 = cpAmmAccount.data.lockedLpVault;
            TEST_CP_AMMS.baseVault3 = cpAmmAccount.data.baseVault;
            TEST_CP_AMMS.quoteVault3 = cpAmmAccount.data.quoteVault;
            [USER_TOKEN_ACCOUNTS.lpToken3, GENERAL_USER_TOKEN_ACCOUNTS.lpToken3] = await Promise.all([
                getTokenPDA(TEST_CP_AMMS.lpMint3, user.address), getTokenPDA(TEST_CP_AMMS.lpMint3, generalUser.address)
            ]);
            const [
                feeAuthorityBalanceAfter,
                lpMintAccount
            ] = await Promise.all([
                rpcClient.rpc.getBalance(headAuthority.address).send(),
                fetchMint(rpcClient.rpc, TEST_CP_AMMS.lpMint3)
            ]);
            assert.strictEqual(feeAuthorityBalanceAfter.value - feeAuthorityBalanceBefore.value, BigInt(100_000_000), "Fee authority balance does not match expected value");

            assert.deepStrictEqual(lpMintAccount.data.mintAuthority, some(cpAmmAccount.address));
            assert.deepStrictEqual(lpMintAccount.data.freezeAuthority, none());

            assert.strictEqual(cpAmmAccount.data.creator, user.address);
            assert.strictEqual(cpAmmAccount.data.ammsConfig, ammsConfigAddress[0]);
            assert.strictEqual(cpAmmAccount.data.baseMint, TEST_MINTS.validTokenMint2.address);
            assert.strictEqual(cpAmmAccount.data.quoteMint, TEST_MINTS.transferFeeToken2022Mint.address);

            assert.strictEqual(cpAmmAccount.data.baseVault, TEST_CP_AMMS.baseVault3);
            assert.strictEqual(cpAmmAccount.data.quoteVault, TEST_CP_AMMS.quoteVault3);
            assert.strictEqual(cpAmmAccount.data.lockedLpVault, TEST_CP_AMMS.lpVault3);

            assert.strictEqual(cpAmmAccount.data.isInitialized, true);
            assert.strictEqual(cpAmmAccount.data.isLaunched, false);

            assert.strictEqual(cpAmmAccount.data.initialLockedLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.lpTokensSupply, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolBaseFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.protocolQuoteFeesToRedeem, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.baseLiquidity, BigInt(0));
            assert.strictEqual(cpAmmAccount.data.quoteLiquidity, BigInt(0));

            assert.deepStrictEqual(cpAmmAccount.data.baseQuoteRatioSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
            assert.deepStrictEqual(cpAmmAccount.data.constantProductSqrt, {value: [[BigInt(0), BigInt(0), BigInt(0)]]});
        });

        // Launch CpAmm

        it("Launch CpAmm with insufficient balance of base tokens on signer's account should fail", async () => {
            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1);
            const baseLiquidity = BigInt(9_000_000_000_000_000);
            const quoteLiquidity = BigInt(43241);

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccount.address,
                USER_TOKEN_ACCOUNTS.validToken1.address,
                USER_TOKEN_ACCOUNTS.validToken221.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with insufficient balance of base tokens");
                },
                (_err) => {
                }
            );
        });
        it("Launch CpAmm with insufficient balance of quote tokens on signer's account should fail", async () => {
            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1);
            const baseLiquidity = BigInt(23437123213686);
            const quoteLiquidity = BigInt(1_000_000_000_000_001);

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccount.address,
                USER_TOKEN_ACCOUNTS.validToken1.address,
                USER_TOKEN_ACCOUNTS.validToken221.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with insufficient balance of quote tokens");
                },
                (_err) => {
                }
            );
        });
        it("Launch CpAmm with signer that isn't CpAmm creator should fail", async () => {
            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1);
            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);

            const [base64Tx, _] = await launchCpAmm(
                generalUser.address,
                cpAmmAccount.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken1.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken221.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with signer that isn't CpAmm creator");
                },
                (_err) => {
                }
            );
        });
        it("Launch CpAmm with token mint and token 2022 mint", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send()
            ]);
            const lpMintAccountBefore = await fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint);

            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);
            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * quoteLiquidity))));
            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;
            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                USER_TOKEN_ACCOUNTS.validToken1.address,
                USER_TOKEN_ACCOUNTS.validToken221.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);
            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [
                lpMintAccountAfter,
                signerBaseBalanceAfter,
                signerQuoteBalanceAfter,
                signerLpBalanceAfter,
                cpAmmBaseBalance,
                cpAmmQuoteBalance,
                cpAmmLpBalance
            ] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken1.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken221.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken1[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);
            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity);

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator);
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig);
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);

            assert.strictEqual(cpAmmAccountAfter.data.baseVault, cpAmmAccountBefore.data.baseVault);
            assert.strictEqual(cpAmmAccountAfter.data.quoteVault, cpAmmAccountBefore.data.quoteVault);
            assert.strictEqual(cpAmmAccountAfter.data.lockedLpVault, cpAmmAccountBefore.data.lockedLpVault);

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem);
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem);

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0]);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {
                value: [[11569318178613274784n, 12626128898751551786n, 0n]]
            });

            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[11035359224094822028n, 1696597754053898133n, 310231742n]]
            });
        });
        it("Relaunch of CpAmm should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm1);
            const baseLiquidity = BigInt(212342403);
            const quoteLiquidity = BigInt(453247832);

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                USER_TOKEN_ACCOUNTS.validToken1.address,
                USER_TOKEN_ACCOUNTS.validToken221.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm relaunching");
                },
                (_error) => {
                }
            );
        });
        it("Launch CpAmm with launch liquidity less than initial locked liquidity x4 should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2);
            const baseLiquidity = BigInt(159999);
            const quoteLiquidity = BigInt(999999);

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                USER_TOKEN_ACCOUNTS.validToken2.address,
                USER_TOKEN_ACCOUNTS.validToken3.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of CpAmm launching with liquidity less than initial locked liquidity x4");
                },
                (_error) => {
                }
            );
        });
        it("Launch CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);

            const lpMintAccountBefore = await fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint);

            const baseLiquidity = BigInt(160000);
            const quoteLiquidity = BigInt(1_000_000);
            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * quoteLiquidity))));
            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                USER_TOKEN_ACCOUNTS.validToken2.address,
                USER_TOKEN_ACCOUNTS.validToken3.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);
            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [
                lpMintAccountAfter,
                signerBaseBalanceAfter,
                signerQuoteBalanceAfter,
                signerLpBalanceAfter,
                cpAmmBaseBalance,
                cpAmmQuoteBalance,
                cpAmmLpBalance
            ] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity);

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator);
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig);
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault);

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem);
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem);

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0]);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {
                value: [[7378697629483820645n, 7378697629483820646n, 0n]]
            });
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[0n, 0n, 400000n]]
            });
        });
        it("Launch CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send()
            ]);

            const [quoteMint, lpMintAccountBefore] = await Promise.all([
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint)
            ]);

            const baseLiquidity = BigInt(5465487548754);
            const quoteLiquidity = BigInt(983129578946);

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find(
                (e) => e.__kind === "TransferFeeConfig"
            )!.olderTransferFee;

            const feeCalculated = (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints)) / 10_000n;
            const quoteFee = feeCalculated < BigInt(transferFee.maximumFee) ? feeCalculated : BigInt(transferFee.maximumFee);
            const quoteAfterFeeLiquidity = quoteLiquidity - quoteFee;

            const totalLiquidity = BigInt(Math.floor(Math.sqrt(Number(baseLiquidity * quoteAfterFeeLiquidity))));
            const initialLockedLiquidity = BigInt(Math.pow(10, lpMintAccountBefore.data.decimals));
            const signersLiquidity = totalLiquidity - initialLockedLiquidity;

            const [base64Tx, _] = await launchCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                USER_TOKEN_ACCOUNTS.validToken2.address,
                USER_TOKEN_ACCOUNTS.transferFeeToken22.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);
            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [
                lpMintAccountAfter,
                signerBaseBalanceAfter,
                signerQuoteBalanceAfter,
                signerLpBalanceAfter,
                cpAmmBaseBalance,
                cpAmmQuoteBalance,
                cpAmmLpBalance
            ] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.lpToken3[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount), signersLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBalance.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBalance.value.amount), quoteAfterFeeLiquidity);
            assert.strictEqual(BigInt(cpAmmLpBalance.value.amount), initialLockedLiquidity);

            assert.strictEqual(lpMintAccountAfter.data.supply, totalLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.creator, cpAmmAccountAfter.data.creator);
            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig);
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault);

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem);
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem);

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0]);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.strictEqual(cpAmmAccountAfter.data.initialLockedLiquidity, initialLockedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply, totalLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity, quoteAfterFeeLiquidity);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {
                value: [[3475547461318636948n, 6600456554340055308n, 2n]]
            });

            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[16463856578203948456n, 17179385210221578158n, 2318034170991n]]
            });
        });

        // Provide to CpAmm

        it("Provide liquidity to CpAmm with invalid token ratio should fail", async () => {
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2);
            const baseLiquidity = BigInt(480000);
            const quoteLiquidity = BigInt(3_000_001);

            const base64Tx = await provideToCpAmm(
                generalUser.address,
                cpAmmAccountBefore.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of providing liquidity to CpAmm with invalid token ratio");
                },
                (_error) => {
                }
            );
        });

        it("Provide liquidity to CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);

            const signerLpBalanceBefore = BigInt(0);

            const [lpMintAccountBefore, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, cpAmmLpBalanceBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.lockedLpVault).send()
            ]);

            const baseLiquidity = BigInt(480000);
            const quoteLiquidity = BigInt(3_000_000);
            const providedLiquidity = BigInt(1_200_000);

            const base64Tx = await provideToCpAmm(
                generalUser.address,
                cpAmmAccountBefore.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient);

            await delay(1);
            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [
                lpMintAccountAfter,
                signerBaseBalanceAfter,
                signerQuoteBalanceAfter,
                signerLpBalanceAfter,
                cpAmmBaseBalanceAfter,
                cpAmmQuoteBalanceAfter,
                cpAmmLpBalanceAfter
            ] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.lpToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount) - signerLpBalanceBefore, providedLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBalanceAfter.value.amount) - BigInt(cpAmmBaseBalanceBefore.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(cpAmmLpBalanceAfter.value.amount), BigInt(cpAmmLpBalanceBefore.value.amount));

            assert.strictEqual(lpMintAccountAfter.data.supply - lpMintAccountBefore.data.supply, providedLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig);
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault);

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem);
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem);

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0]);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.strictEqual(cpAmmAccountBefore.data.initialLockedLiquidity, cpAmmAccountAfter.data.initialLockedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply - cpAmmAccountBefore.data.lpTokensSupply, providedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, quoteLiquidity);

            assert.deepStrictEqual(cpAmmAccountBefore.data.baseQuoteRatioSqrt, cpAmmAccountAfter.data.baseQuoteRatioSqrt);
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[0n, 0n, 1600000n]]
            });
        });

        it("Provide liquidity to CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const [cpAmmAccountBefore, signerBaseBalanceBefore, signerQuoteBalanceBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send()
            ]);
            const signerLpBalanceBefore = BigInt(0);

            const [quoteMint, lpMintAccountBefore, cpAmmBaseBalanceBefore, cpAmmQuoteBalanceBefore, cpAmmLpBalanceBefore] = await Promise.all([
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.lockedLpVault).send()
            ]);

            const baseLiquidity = BigInt(5465487548754 * 5);
            const quoteLiquidity = BigInt(983129568946 * 5) + 10000n;

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find(
                (e) => e.__kind === "TransferFeeConfig"
            )!.olderTransferFee;

            const feeCalculated = (quoteLiquidity * BigInt(transferFee.transferFeeBasisPoints)) / 10_000n;
            const quoteFee = feeCalculated < BigInt(transferFee.maximumFee) ? feeCalculated : BigInt(transferFee.maximumFee);
            const quoteAfterFeeLiquidity = quoteLiquidity - quoteFee;
            const providedLiquidity = BigInt(11590170854955);

            const base64Tx = await provideToCpAmm(
                generalUser.address,
                cpAmmAccountBefore.address,
                GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address,
                GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address,
                baseLiquidity,
                quoteLiquidity,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient);
            await delay(1);
            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address);

            const [
                lpMintAccountAfter,
                signerBaseBalanceAfter,
                signerQuoteBalanceAfter,
                signerLpBalanceAfter,
                cpAmmBaseBalanceAfter,
                cpAmmQuoteBalanceAfter,
                cpAmmLpBalanceAfter
            ] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.lpToken3[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.lockedLpVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBalanceBefore.value.amount) - BigInt(signerBaseBalanceAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteBalanceBefore.value.amount) - BigInt(signerQuoteBalanceAfter.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBalanceAfter.value.amount) - signerLpBalanceBefore, providedLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBalanceAfter.value.amount) - BigInt(cpAmmBaseBalanceBefore.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBalanceAfter.value.amount) - BigInt(cpAmmQuoteBalanceBefore.value.amount), quoteAfterFeeLiquidity);
            assert.strictEqual(BigInt(cpAmmLpBalanceAfter.value.amount), BigInt(cpAmmLpBalanceBefore.value.amount));

            assert.strictEqual(lpMintAccountAfter.data.supply - lpMintAccountBefore.data.supply, providedLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.ammsConfig, cpAmmAccountAfter.data.ammsConfig);
            assert.strictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.strictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.strictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);

            assert.strictEqual(cpAmmAccountBefore.data.baseVault, cpAmmAccountAfter.data.baseVault);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVault, cpAmmAccountAfter.data.quoteVault);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault);

            assert.strictEqual(cpAmmAccountBefore.data.protocolBaseFeesToRedeem, cpAmmAccountAfter.data.protocolBaseFeesToRedeem);
            assert.strictEqual(cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, cpAmmAccountAfter.data.protocolQuoteFeesToRedeem);

            assert.strictEqual(cpAmmAccountBefore.data.bump[0], cpAmmAccountAfter.data.bump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.baseVaultBump[0], cpAmmAccountAfter.data.baseVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.quoteVaultBump[0], cpAmmAccountAfter.data.quoteVaultBump[0]);
            assert.strictEqual(cpAmmAccountBefore.data.lockedLpVaultBump[0], cpAmmAccountAfter.data.lockedLpVaultBump[0]);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.strictEqual(cpAmmAccountBefore.data.initialLockedLiquidity, cpAmmAccountAfter.data.initialLockedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.lpTokensSupply - cpAmmAccountBefore.data.lpTokensSupply, providedLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, quoteAfterFeeLiquidity);

            assert.deepStrictEqual(cpAmmAccountBefore.data.baseQuoteRatioSqrt, cpAmmAccountAfter.data.baseQuoteRatioSqrt);
            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[6549419100675932660n, 10842590892781710873n, 13908205025951n]]
            });
        });

        // Swap in CpAmm

        it("Swap base to quote in CpAmm with exceeding slippage should fail", async () => {
            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2);
            const swapAmount = BigInt(1_242_344);
            const estimatedResult = BigInt(2_593_581);
            const allowedSlippage = BigInt(0);
            const isInOut = true;

            const base64Tx = await swapInCpAmm(
                generalUser.address,
                cpAmmAccount.address,
                swapAmount,
                estimatedResult,
                allowedSlippage,
                isInOut,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of swap base to quote in CpAmm with exceeding slippage");
                },
                (_err) => {
                }
            );
        });
        it("Swap base to quote in CpAmm that drains base liquidity should fail", async () => {
            const cpAmmAccount = await fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2);
            const swapAmount = BigInt(2_694_732_631_580);
            const estimatedResult = BigInt(640_000);
            const allowedSlippage = BigInt(0);
            const isInOut = false;

            const base64Tx = await swapInCpAmm(
                generalUser.address,
                cpAmmAccount.address,
                swapAmount,
                estimatedResult,
                allowedSlippage,
                isInOut,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of swap draining base liquidity");
                },
                (_err) => {
                }
            );
        });
        it("Swap base to quote in CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBefore, signerQuoteBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);

            const [ammsConfig, cpAmmBaseBefore, cpAmmQuoteBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const swapAmount = BigInt(1_242_344);
            const isInOut = true;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(2_593_583);

            const protocolFee = swapAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints) / 10_000n;
            const providersFee = swapAmount * BigInt(ammsConfig.data.providersFeeRateBasisPoints) / 10_000n;
            const netSwapAmount = swapAmount - providersFee - protocolFee;

            const base64Tx = await swapInCpAmm(
                generalUser.address,
                cpAmmAccountBefore.address,
                swapAmount,
                estimatedResult,
                allowedSlippage,
                isInOut,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [generalUser], rpcClient);
            await delay(1);

            const [cpAmmAccountAfter, signerBaseAfter, signerQuoteAfter, cpAmmBaseAfter, cpAmmQuoteAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(GENERAL_USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseBefore.value.amount) - BigInt(signerBaseAfter.value.amount), swapAmount);
            assert.strictEqual(BigInt(signerQuoteAfter.value.amount) - BigInt(signerQuoteBefore.value.amount), estimatedResult);

            assert.strictEqual(BigInt(cpAmmBaseAfter.value.amount) - BigInt(cpAmmBaseBefore.value.amount), swapAmount);
            assert.strictEqual(BigInt(cpAmmQuoteBefore.value.amount) - BigInt(cpAmmQuoteAfter.value.amount), estimatedResult);

            assert.strictEqual(cpAmmAccountAfter.data.protocolBaseFeesToRedeem - cpAmmAccountBefore.data.protocolBaseFeesToRedeem, protocolFee);
            assert.strictEqual(cpAmmAccountAfter.data.baseLiquidity - cpAmmAccountBefore.data.baseLiquidity, netSwapAmount + providersFee);
            assert.strictEqual(cpAmmAccountBefore.data.quoteLiquidity - cpAmmAccountAfter.data.quoteLiquidity, estimatedResult);
        });
        it("Swap quote to base in CpAmm with two token mints", async () => {
            const [cpAmmAccountBefore, signerBaseBefore, signerQuoteBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm2),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send()
            ]);
            const [ammsConfig, cpAmmBaseBefore, cpAmmQuoteBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const swapQuoteAmount = BigInt(10_000);
            const protocolFee = (swapQuoteAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints)) / 10_000n;
            const providersFee = (swapQuoteAmount * BigInt(ammsConfig.data.providersFeeRateBasisPoints)) / 10_000n;
            const swapQuoteAmountAfterFees = swapQuoteAmount - providersFee - protocolFee;

            const isInOut = false;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(12_546);

            const base64Tx = await swapInCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                swapQuoteAmount,
                estimatedResult,
                allowedSlippage,
                isInOut,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);

            const [cpAmmAccountAfter, signerBaseAfter, signerQuoteAfter, cpAmmBaseAfter, cpAmmQuoteAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken3.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseAfter.value.amount) - BigInt(signerBaseBefore.value.amount), estimatedResult);
            assert.strictEqual(BigInt(signerQuoteBefore.value.amount) - BigInt(signerQuoteAfter.value.amount), swapQuoteAmount);

            assert.strictEqual(BigInt(cpAmmBaseBefore.value.amount) - BigInt(cpAmmBaseAfter.value.amount), estimatedResult);
            assert.strictEqual(BigInt(cpAmmQuoteAfter.value.amount) - BigInt(cpAmmQuoteBefore.value.amount), swapQuoteAmount);

            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem - cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, protocolFee);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, swapQuoteAmountAfterFees + providersFee);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity - swapQuoteAmountAfterFees, providersFee);
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, estimatedResult);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);
            assert.strictEqual(cpAmmAccountAfter.data.baseMint, cpAmmAccountBefore.data.baseMint);
            assert.strictEqual(cpAmmAccountAfter.data.quoteMint, cpAmmAccountBefore.data.quoteMint);
            assert.strictEqual(cpAmmAccountAfter.data.lpMint, cpAmmAccountBefore.data.lpMint);
        });
        it("Swap quote to base in CpAmm with token 2022 mint with TransferFeeConfig", async () => {
            const [cpAmmAccountBefore, signerBaseBefore, signerQuoteBefore] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, TEST_CP_AMMS.cpAmm3),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send()
            ]);

            const [ammsConfig, quoteMint, cpAmmBaseBefore, cpAmmQuoteBefore] = await Promise.all([
                fetchAmmsConfig(rpcClient.rpc, cpAmmAccountBefore.data.ammsConfig),
                fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const quoteAmountBeforeTransfer = BigInt(1_522_710_696);

            const transferFeeCfg = (quoteMint.data.extensions as Some<Extension[]>).value.find(
                (e) => e.__kind === "TransferFeeConfig"
            )?.olderTransferFee;

            const tokenSwapFee = Math.min(
                Number((quoteAmountBeforeTransfer * BigInt(transferFeeCfg.transferFeeBasisPoints)) / 10_000n),
                Number(transferFeeCfg.maximumFee)
            );

            const swapQuoteAmount = quoteAmountBeforeTransfer - BigInt(tokenSwapFee);

            const protocolFee = (swapQuoteAmount * BigInt(ammsConfig.data.protocolFeeRateBasisPoints)) / 10_000n;
            const providersFee = (swapQuoteAmount * BigInt(ammsConfig.data.providersFeeRateBasisPoints)) / 10_000n;
            const swapQuoteAmountAfterFees = swapQuoteAmount - providersFee - protocolFee;

            const isInOut = false;
            const allowedSlippage = BigInt(0);
            const estimatedResult = BigInt(8_039_884_568);

            const base64Tx = await swapInCpAmm(
                user.address,
                cpAmmAccountBefore.address,
                quoteAmountBeforeTransfer,
                estimatedResult,
                allowedSlippage,
                isInOut,
                liquidityPoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient);
            await delay(1);

            const [cpAmmAccountAfter, signerBaseAfter, signerQuoteAfter, cpAmmBaseAfter, cpAmmQuoteAfter] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmmAccountBefore.address),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.validToken2.address).send(),
                rpcClient.rpc.getTokenAccountBalance(USER_TOKEN_ACCOUNTS.transferFeeToken22.address).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseAfter.value.amount) - BigInt(signerBaseBefore.value.amount), estimatedResult);
            assert.strictEqual(BigInt(signerQuoteBefore.value.amount) - BigInt(signerQuoteAfter.value.amount), quoteAmountBeforeTransfer);

            assert.strictEqual(BigInt(cpAmmBaseBefore.value.amount) - BigInt(cpAmmBaseAfter.value.amount), estimatedResult);
            assert.strictEqual(BigInt(cpAmmQuoteAfter.value.amount) - BigInt(cpAmmQuoteBefore.value.amount), swapQuoteAmount);

            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem - cpAmmAccountBefore.data.protocolQuoteFeesToRedeem, protocolFee);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity, swapQuoteAmountAfterFees + providersFee);
            assert.strictEqual(cpAmmAccountAfter.data.quoteLiquidity - cpAmmAccountBefore.data.quoteLiquidity - swapQuoteAmountAfterFees, providersFee);
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, estimatedResult);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);
            assert.strictEqual(cpAmmAccountAfter.data.baseMint, cpAmmAccountBefore.data.baseMint);
            assert.strictEqual(cpAmmAccountAfter.data.quoteMint, cpAmmAccountBefore.data.quoteMint);
        });

        // Withdraw from CpAmm
        it("Withdraw liquidity from CpAmm with insufficient balance of lp tokens on signer's account should fail", async () => {
            const cpAmm = TEST_CP_AMMS.cpAmm1;
            const signerLpAccount = USER_TOKEN_ACCOUNTS.lpToken1[0];
            const signer = user;

            const signerLpBalance = await rpcClient.rpc.getTokenAccountBalance(signerLpAccount).send();
            const withdrawAmount = BigInt(signerLpBalance.value.amount) + 1n;

           let base64Tx = await withdrawFromCpAmm(signer.address, cpAmm, signerLpAccount, withdrawAmount, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of withdrawing liquidity from CpAmm with insufficient LP token balance");
                },
                (_err) => {
                }
            );
        });
        it("Withdraw liquidity from CpAmm with token mint and token 2022 mint", async () => {
            const cpAmm = TEST_CP_AMMS.cpAmm1;
            const signer = user;
            const signerBaseAccount = USER_TOKEN_ACCOUNTS.validToken1.address;
            const signerQuoteAccount = USER_TOKEN_ACCOUNTS.validToken221.address;
            const signerLpAccount = USER_TOKEN_ACCOUNTS.lpToken1[0];

            const withdrawLiquidity = 268_234_561n;
            const baseLiquidity = 183_596_852n;
            const quoteLiquidity = 391_890_051n;

            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, cpAmm);
            const [lpMintBefore, signerBaseBefore, signerQuoteBefore, signerLpBefore, cpAmmBaseBefore, cpAmmQuoteBefore] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountBefore.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(signerBaseAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(signerQuoteAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(signerLpAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const base64Tx = await withdrawFromCpAmm(signer.address, cpAmm, signerLpAccount, withdrawLiquidity, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [signer], rpcClient);
            await delay(1);

            const cpAmmAccountAfter = await fetchCpAmm(rpcClient.rpc, cpAmm);
            const [lpMintAfter, signerBaseAfter, signerQuoteAfter, signerLpAfter, cpAmmBaseAfter, cpAmmQuoteAfter] = await Promise.all([
                fetchMint(rpcClient.rpc, cpAmmAccountAfter.data.lpMint),
                rpcClient.rpc.getTokenAccountBalance(signerBaseAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(signerQuoteAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(signerLpAccount).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountAfter.data.quoteVault).send()
            ]);

            assert.strictEqual(BigInt(signerBaseAfter.value.amount) - BigInt(signerBaseBefore.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(signerQuoteAfter.value.amount) - BigInt(signerQuoteBefore.value.amount), quoteLiquidity);
            assert.strictEqual(BigInt(signerLpBefore.value.amount) - BigInt(signerLpAfter.value.amount), withdrawLiquidity);

            assert.strictEqual(BigInt(cpAmmBaseBefore.value.amount) - BigInt(cpAmmBaseAfter.value.amount), baseLiquidity);
            assert.strictEqual(BigInt(cpAmmQuoteBefore.value.amount) - BigInt(cpAmmQuoteAfter.value.amount), quoteLiquidity);
            assert.strictEqual(lpMintBefore.data.supply - lpMintAfter.data.supply, withdrawLiquidity);

            assert.strictEqual(cpAmmAccountBefore.data.lpTokensSupply - cpAmmAccountAfter.data.lpTokensSupply, withdrawLiquidity);
            assert.strictEqual(cpAmmAccountBefore.data.baseLiquidity - cpAmmAccountAfter.data.baseLiquidity, baseLiquidity);
            assert.strictEqual(cpAmmAccountBefore.data.quoteLiquidity - cpAmmAccountAfter.data.quoteLiquidity, quoteLiquidity);

            assert.deepStrictEqual(cpAmmAccountBefore.data.baseMint, cpAmmAccountAfter.data.baseMint);
            assert.deepStrictEqual(cpAmmAccountBefore.data.quoteMint, cpAmmAccountAfter.data.quoteMint);
            assert.deepStrictEqual(cpAmmAccountBefore.data.lpMint, cpAmmAccountAfter.data.lpMint);
            assert.deepStrictEqual(cpAmmAccountBefore.data.lockedLpVault, cpAmmAccountAfter.data.lockedLpVault);
            assert.deepStrictEqual(cpAmmAccountBefore.data.bump, cpAmmAccountAfter.data.bump);
            assert.deepStrictEqual(cpAmmAccountBefore.data.baseVaultBump, cpAmmAccountAfter.data.baseVaultBump);
            assert.deepStrictEqual(cpAmmAccountBefore.data.quoteVaultBump, cpAmmAccountAfter.data.quoteVaultBump);
            assert.deepStrictEqual(cpAmmAccountBefore.data.lockedLpVaultBump, cpAmmAccountAfter.data.lockedLpVaultBump);

            assert.strictEqual(cpAmmAccountAfter.data.isInitialized, true);
            assert.strictEqual(cpAmmAccountAfter.data.isLaunched, true);

            assert.deepStrictEqual(cpAmmAccountAfter.data.baseQuoteRatioSqrt, {
                value: [[13491493305820030747n, 12626128903649178949n, 0n]]
            });

            assert.deepStrictEqual(cpAmmAccountAfter.data.constantProductSqrt, {
                value: [[10456609623689113206n, 2423619042181433239n, 41997181n]]
            });
        });

        // Collect Fees from CpAmm
        it("Collect fees from CpAmm with token mint and token 2022 mint with TransferFee Config extension", async () => {
            const cpAmm = TEST_CP_AMMS.cpAmm3;
            const cpAmmAccountBefore = await fetchCpAmm(rpcClient.rpc, cpAmm);
            const quoteMint = await fetchMint22(rpcClient.rpc, cpAmmAccountBefore.data.quoteMint);

            const transferFee = (quoteMint.data.extensions as Some<Extension[]>).value.find(
                (e) => e.__kind === "TransferFeeConfig"
            ).olderTransferFee;

            const quoteTransferFee = (
                cpAmmAccountBefore.data.protocolQuoteFeesToRedeem * BigInt(transferFee.transferFeeBasisPoints) / 10_000n
            ) < BigInt(transferFee.maximumFee)
                ? (cpAmmAccountBefore.data.protocolQuoteFeesToRedeem * BigInt(transferFee.transferFeeBasisPoints) / 10_000n)
                : BigInt(transferFee.maximumFee);

            const [
                feeAuthorityBaseBefore,
                feeAuthorityQuoteBefore,
                baseVaultBefore,
                quoteVaultBefore
            ] = await Promise.all([
                0,
                0,
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            const tx = await collectFeesFromCpAmm(user.address, cpAmm, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(tx, [user], rpcClient);
            await delay(1);
            const [
                cpAmmAccountAfter,
                feeAuthorityBaseAfter,
                feeAuthorityQuoteAfter,
                baseVaultAfter,
                quoteVaultAfter
            ] = await Promise.all([
                fetchCpAmm(rpcClient.rpc, cpAmm),
                rpcClient.rpc.getTokenAccountBalance(FEE_AUTHORITY_TOKEN_ACCOUNTS.validToken2[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(FEE_AUTHORITY_TOKEN_ACCOUNTS.transferFeeToken22[0]).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.baseVault).send(),
                rpcClient.rpc.getTokenAccountBalance(cpAmmAccountBefore.data.quoteVault).send()
            ]);

            assert.strictEqual(
                BigInt(feeAuthorityBaseAfter.value.amount) - BigInt(feeAuthorityBaseBefore),
                cpAmmAccountBefore.data.protocolBaseFeesToRedeem
            );
            assert.strictEqual(
                BigInt(feeAuthorityQuoteAfter.value.amount) - BigInt(feeAuthorityQuoteBefore),
                cpAmmAccountBefore.data.protocolQuoteFeesToRedeem - quoteTransferFee
            );

            assert.strictEqual(
                BigInt(baseVaultBefore.value.amount) - BigInt(baseVaultAfter.value.amount),
                cpAmmAccountBefore.data.protocolBaseFeesToRedeem
            );
            assert.strictEqual(
                BigInt(quoteVaultBefore.value.amount) - BigInt(quoteVaultAfter.value.amount),
                cpAmmAccountBefore.data.protocolQuoteFeesToRedeem
            );

            assert.strictEqual(cpAmmAccountAfter.data.protocolBaseFeesToRedeem, 0n);
            assert.strictEqual(cpAmmAccountAfter.data.protocolQuoteFeesToRedeem, 0n);
        });
        it("Collect fees from CpAmm with 0 fees should fail", async () => {
            const cpAmm = TEST_CP_AMMS.cpAmm3;
            let base64Tx = await collectFeesFromCpAmm(user.address, cpAmm, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of collecting fees from CpAmm with 0 fees");
                },
                (_err) => {
                }
            );
        });

    });
}