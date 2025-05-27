import {
    Account,
    Address,
    getProgramDerivedAddress,
    KeyPairSigner,
    pipe,
    ProgramDerivedAddress
} from "@solana/kit";
import {getLaunchpoolsConfigPDA, LaunchpoolTestingEnvironment} from "./helpers";
import {before, describe} from "mocha";
import {createTestUser, createTransaction, getTransactionLogs, signAndSendTransaction} from "../helpers";
import {SYSTEM_PROGRAM_ADDRESS} from "@solana-program/system";
import {assert} from "chai";
import {
    getInitializeLaunchpoolsConfigInstruction,
    getUpdateLaunchpoolsConfigDurationInstruction, getUpdateLaunchpoolsConfigPositionSizesInstruction,
    getUpdateLaunchpoolsConfigProtocolRewardShareInstruction,
    getUpdateLaunchpoolsConfigRewardAuthorityInstruction,
    InitializeLaunchpoolsConfigInput, LaunchpoolsConfig, LaunchpoolsConfigsManager,
    UpdateLaunchpoolsConfigDurationInput,
    UpdateLaunchpoolsConfigPositionSizesInput,
    UpdateLaunchpoolsConfigProtocolRewardShareInput,
    UpdateLaunchpoolsConfigRewardAuthorityInput
} from "@launchpool/js";
import {createToken22Mint, createToken22MintWithTransferFee, createTokenMint} from "../tokens-helpers";

export const launchpoolsConfigTests = (
    launchpoolTestingEnvironment: LaunchpoolTestingEnvironment,
    launchpoolsConfigsManagerAddress: ProgramDerivedAddress,
    launchpoolsConfigAddress: ProgramDerivedAddress
) => {
    describe("\nLaunchpoolsConfig tests", () => {
        const {
            program,
            rpcClient,
            rent,
            headAuthority,
            owner,
            launchpoolsConfigsManagerAuthority,
            user
        } = launchpoolTestingEnvironment;
        let rewardAuthority: KeyPairSigner;
        let malwareLaunchpoolsConfigsManagerAddress: ProgramDerivedAddress;
        let tokenMint: Address;
        let token22Mint: Address;
        let freezeAuthorityMint: Address;
        let forbiddenExtensionMint: Address;

        before(async () => {
            // Create a test user to act as reward authority
            rewardAuthority = await createTestUser(rpcClient, 100);

            // Create stakable mints
            tokenMint = (await createTokenMint(rpcClient, user, 6)).address;
            token22Mint = (await createToken22Mint(rpcClient, user, 4)).address;
            freezeAuthorityMint = (await createTokenMint(rpcClient, user, 5, rewardAuthority.address)).address;
            forbiddenExtensionMint = (await createToken22MintWithTransferFee(rpcClient, user, 3, 250, 20)).address

            // Generate an invalid Launchpools Configs Manager address for test validation
            malwareLaunchpoolsConfigsManagerAddress = await getProgramDerivedAddress({
                programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
                seeds: ["launchpoolss_configs_manager"]
            });
        })

        /// Initialization

        it("Unauthorized attempt to initialize LaunchpoolsConfig should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 4234523,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 23,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of LaunchpoolsConfig initialization");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfig with exceeded reward should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 4234523,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 10001,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with exceeded reward");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfig with 0 duration should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 0,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 5000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with 0 duration");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfig with 0 min position size should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 324234,
                maxPositionSize: 543,
                minPositionSize: 0,
                protocolRewardShareBasisPoints: 5000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with 0 min position size");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfig with max position size less then min position size should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 324234,
                maxPositionSize: 230,
                minPositionSize: 234,
                protocolRewardShareBasisPoints: 5000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with max position size less then min position size");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfig with malware LaunchpoolsConfigManager should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: user,
                launchpoolsConfigsManager: malwareLaunchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: tokenMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 4234523,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 10000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with malware LaunchpoolsConfigManager");
                },
                (_error) => {}
            ));
        })

        it("Initialize LaunchpoolsConfig with freeze stakable mint should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: freezeAuthorityMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 4234523,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 1000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with freeze stakable mint");
                },
                (_error) => {}
            ));
        })

        it("Initialize LaunchpoolsConfig with stakable mint with forbidden extension should fail", async () => {
            const input: InitializeLaunchpoolsConfigInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint: forbiddenExtensionMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration: 4234523,
                maxPositionSize: 543,
                minPositionSize: 57,
                protocolRewardShareBasisPoints: 1000,
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig initialization with stakable mint with forbidden extension");
                },
                (_error) => {}
            ));
        })

        it("Initialize LaunchpoolsConfig by head authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);
            assert.ok(launchpoolsConfigsManagerAccountBefore, "LaunchpoolsConfigManager doesn't exist");

            const protocolRewardShareBasisPoints = 23;
            const duration = BigInt(4234);
            const maxPositionSize = BigInt(543);
            const minPositionSize = BigInt(57);
            const stakableMint = tokenMint;

            const input: InitializeLaunchpoolsConfigInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration,
                maxPositionSize,
                minPositionSize,
                protocolRewardShareBasisPoints
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccount: Account<LaunchpoolsConfig> = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            const launchpoolsConfigsManagerAccountAfter: Account<LaunchpoolsConfigsManager> = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(launchpoolsConfigAccount, "LaunchpoolsConfig account was not created");
            assert.strictEqual(launchpoolsConfigAccount.data.rewardAuthority, rewardAuthority.address, "Reward authority does not match expected value");
            assert.strictEqual(launchpoolsConfigAccount.data.stakableMint,stakableMint, "Stakable mint does not match expected value");
            assert.strictEqual(launchpoolsConfigAccount.data.id, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Config ID does not match expected count");
            assert.strictEqual(launchpoolsConfigAccount.data.protocolRewardShareBasisPoints, protocolRewardShareBasisPoints, "Protocol reward share is incorrect");
            assert.strictEqual(launchpoolsConfigAccount.data.duration, duration, "Duration is incorrect");
            assert.strictEqual(launchpoolsConfigAccount.data.minPositionSize, minPositionSize, "Min position size is incorrect");
            assert.strictEqual(launchpoolsConfigAccount.data.maxPositionSize, maxPositionSize, "Max position size is incorrect");

            assert.strictEqual(launchpoolsConfigAccount.data.bump, launchpoolsConfigAddress[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount - launchpoolsConfigsManagerAccountBefore.data.configsCount, BigInt(1), "Configs count was not incremented correctly");
        })

        it("Initialize LaunchpoolsConfig by authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);
            assert.ok(launchpoolsConfigsManagerAccountBefore, "LaunchpoolsConfigManager doesn't exist");

            const protocolRewardShareBasisPoints = 23;
            const duration = BigInt(4234);
            const maxPositionSize = BigInt(543);
            const minPositionSize = BigInt(57);
            const stakableMint = token22Mint;

            const testLaunchpoolsConfigAddress = await getLaunchpoolsConfigPDA(launchpoolsConfigsManagerAccountBefore.data.configsCount);

            const input: InitializeLaunchpoolsConfigInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: testLaunchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration,
                maxPositionSize,
                minPositionSize,
                protocolRewardShareBasisPoints
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const testLaunchpoolsConfigAccount: Account<LaunchpoolsConfig> = await program.fetchLaunchpoolsConfig(rpcClient.rpc, testLaunchpoolsConfigAddress[0]);
            const launchpoolsConfigsManagerAccountAfter: Account<LaunchpoolsConfigsManager> = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(testLaunchpoolsConfigAccount, "LaunchpoolsConfig account was not created");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.rewardAuthority, rewardAuthority.address, "Reward authority does not match expected value");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.stakableMint,stakableMint, "Stakable mint does not match expected value");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.id, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Config ID does not match expected count");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.protocolRewardShareBasisPoints, protocolRewardShareBasisPoints, "Protocol reward share is incorrect");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.duration, duration, "Duration is incorrect");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.minPositionSize, minPositionSize, "Min position size is incorrect");
            assert.strictEqual(testLaunchpoolsConfigAccount.data.maxPositionSize, maxPositionSize, "Max position size is incorrect");

            assert.strictEqual(testLaunchpoolsConfigAccount.data.bump, launchpoolsConfigAddress[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount - launchpoolsConfigsManagerAccountBefore.data.configsCount, BigInt(1), "Configs count was not incremented correctly");
        })

        it("Reinitialization of LaunchpoolsConfig should fail", async () => {

            const protocolRewardShareBasisPoints = 23;
            const duration = BigInt(4234);
            const maxPositionSize = BigInt(543);
            const minPositionSize = BigInt(57);
            const stakableMint = tokenMint;

            const input: InitializeLaunchpoolsConfigInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                rewardAuthority: rewardAuthority.address,
                stakableMint,
                rent: rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS,
                duration,
                maxPositionSize,
                minPositionSize,
                protocolRewardShareBasisPoints
            };

            const ix = getInitializeLaunchpoolsConfigInstruction(input);

            pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(() => assert.fail("Expected failure of reinitialization LaunchpoolsConfig")).catch();
        })

        /// Reward authority update

        it("Unauthorized attempt to update LaunchpoolsConfig reward authority should fail", async () => {
            const input: UpdateLaunchpoolsConfigRewardAuthorityInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newRewardAuthority: headAuthority.address
            };

            const ix = getUpdateLaunchpoolsConfigRewardAuthorityInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig fee authority");
                },
                (_error) => {}
            ));
        })

        it("Update of LaunchpoolsConfig reward authority with malware LaunchpoolsConfigsManager should fail", async () => {
            const input: UpdateLaunchpoolsConfigRewardAuthorityInput = {
                authority: user,
                launchpoolsConfigsManager: malwareLaunchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newRewardAuthority: headAuthority.address
            };

            const ix = getUpdateLaunchpoolsConfigRewardAuthorityInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig reward authority with malware LaunchpoolsConfigsManager");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfig reward authority by head authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const input: UpdateLaunchpoolsConfigRewardAuthorityInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newRewardAuthority: user.address
            };

            const ix = getUpdateLaunchpoolsConfigRewardAuthorityInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, user.address, "Reward authority does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig reward authority by authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const input: UpdateLaunchpoolsConfigRewardAuthorityInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newRewardAuthority: headAuthority.address
            };

            const ix = getUpdateLaunchpoolsConfigRewardAuthorityInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, headAuthority.address, "Reward authority does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        /// Protocol reward share update

        it("Unauthorized attempt to update LaunchpoolsConfig protocol reward share should fail", async () => {
            const input: UpdateLaunchpoolsConfigProtocolRewardShareInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newProtocolRewardShareBasisPoints: 123
            };

            const ix = getUpdateLaunchpoolsConfigProtocolRewardShareInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig protocol reward share");
                },
                (_error) => {}
            ));
        })

        it("Update of LaunchpoolsConfig protocol reward share with malware LaunchpoolsConfigsManager should fail", async () => {
            const input: UpdateLaunchpoolsConfigProtocolRewardShareInput = {
                authority: user,
                launchpoolsConfigsManager: malwareLaunchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newProtocolRewardShareBasisPoints: 123
            };

            const ix = getUpdateLaunchpoolsConfigProtocolRewardShareInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig protocol reward share with malware LaunchpoolsConfigsManager");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfig protocol reward share by head authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            let newProtocolRewardShareBasisPoints = 1243;

            const input: UpdateLaunchpoolsConfigProtocolRewardShareInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newProtocolRewardShareBasisPoints
            };

            const ix = getUpdateLaunchpoolsConfigProtocolRewardShareInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  newProtocolRewardShareBasisPoints, "Protocol reward share does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig protocol reward share by authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            let newProtocolRewardShareBasisPoints = 1333;

            const input: UpdateLaunchpoolsConfigProtocolRewardShareInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newProtocolRewardShareBasisPoints
            };

            const ix = getUpdateLaunchpoolsConfigProtocolRewardShareInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  newProtocolRewardShareBasisPoints, "Protocol reward share does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig with exceeded protocol reward share", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const input: UpdateLaunchpoolsConfigProtocolRewardShareInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newProtocolRewardShareBasisPoints: 10001
            };

            const ix = getUpdateLaunchpoolsConfigProtocolRewardShareInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig update with exceeded protocol reward share");
                },
                (_error) => {}
            ));
        })

        /// Duration update

        it("Unauthorized attempt to update LaunchpoolsConfig duration should fail", async () => {
            const input: UpdateLaunchpoolsConfigDurationInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newDuration: 123
            };

            const ix = getUpdateLaunchpoolsConfigDurationInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig duration");
                },
                (_error) => {}
            ));
        })

        it("Update of LaunchpoolsConfig duration with malware LaunchpoolsConfigsManager should fail", async () => {
            const input: UpdateLaunchpoolsConfigDurationInput = {
                authority: user,
                launchpoolsConfigsManager: malwareLaunchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newDuration: 123
            };

            const ix = getUpdateLaunchpoolsConfigDurationInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig duration with malware LaunchpoolsConfigsManager");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfig duration by head authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            let newDuration = BigInt(3456);

            const input: UpdateLaunchpoolsConfigDurationInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newDuration
            };

            const ix = getUpdateLaunchpoolsConfigDurationInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  newDuration, "Duration  does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig duration by authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            let newDuration = BigInt(60);

            const input: UpdateLaunchpoolsConfigDurationInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newDuration
            };

            const ix = getUpdateLaunchpoolsConfigDurationInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  launchpoolsConfigAccountBefore.data.maxPositionSize, "Max position size should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize,  launchpoolsConfigAccountBefore.data.minPositionSize, "Min position size share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  newDuration, "Duration  does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig duration with 0 duration", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const input: UpdateLaunchpoolsConfigDurationInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newDuration: BigInt(0)
            };

            const ix = getUpdateLaunchpoolsConfigDurationInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig duration update with 0 duration");
                },
                (_error) => {}
            ));
        })

        /// Position sizes update

        it("Unauthorized attempt to update LaunchpoolsConfig position sizes should fail", async () => {
            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMinPositionSize: 123,
                newMaxPositionSize: 250
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig position sizes");
                },
                (_error) => {}
            ));
        })

        it("Update of LaunchpoolsConfig position sizes with malware LaunchpoolsConfigsManager should fail", async () => {
            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: user,
                launchpoolsConfigsManager: malwareLaunchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMinPositionSize: 123,
                newMaxPositionSize: 250
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig position sizes with malware LaunchpoolsConfigsManager");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfig position sizes by head authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const newMaxPositionSize = BigInt(500);
            const newMinPositionSize = BigInt(333);

            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: headAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMaxPositionSize,
                newMinPositionSize
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  newMaxPositionSize, "Max position does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize, newMinPositionSize, "Min position does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig position sizes by authority", async () => {
            const launchpoolsConfigAccountBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(launchpoolsConfigAccountBefore, "LaunchpoolsConfig doesn't exist");

            const newMaxPositionSize = BigInt(100_000_000_000);
            const newMinPositionSize = BigInt(100_000_000);

            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMaxPositionSize,
                newMinPositionSize
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            );

            const launchpoolsConfigAccountAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(launchpoolsConfigAccountAfter.data.rewardAuthority, launchpoolsConfigAccountBefore.data.rewardAuthority, "Reward authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.stakableMint, launchpoolsConfigAccountBefore.data.stakableMint, "Stakable mint should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.id, launchpoolsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.protocolRewardShareBasisPoints,  launchpoolsConfigAccountBefore.data.protocolRewardShareBasisPoints, "Protocol reward share should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.maxPositionSize,  newMaxPositionSize, "Max position does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.minPositionSize, newMinPositionSize, "Min position does not match expected value");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.duration,  launchpoolsConfigAccountBefore.data.duration, "Duration should remain unchanged");
            assert.strictEqual(launchpoolsConfigAccountAfter.data.bump,  launchpoolsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        })

        it("Update LaunchpoolsConfig position sizes with 0 min position size", async () => {
            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMinPositionSize: 0,
                newMaxPositionSize: 250
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig position sizes with 0 min position size");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfig position sizes with max position size less then min position size", async () => {
            const input: UpdateLaunchpoolsConfigPositionSizesInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                launchpoolsConfig: launchpoolsConfigAddress[0],
                newMinPositionSize: 250,
                newMaxPositionSize: 100
            };

            const ix = getUpdateLaunchpoolsConfigPositionSizesInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig position sizes with max position size less then min position size");
                },
                (_error) => {}
            ));
        })
    })
}