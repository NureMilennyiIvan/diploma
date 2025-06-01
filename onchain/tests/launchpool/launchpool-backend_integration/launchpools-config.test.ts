import {
    Address,
    KeyPairSigner,
    ProgramDerivedAddress
} from "@solana/kit";
import {before, describe} from "mocha";
import {
    createTestUser,
    decodeSignAndSend, delay,
    getTransactionLogs,
} from "../../helpers";
import {assert} from "chai";
import {createToken22Mint, createToken22MintWithTransferFee, createTokenMint} from "../../tokens-helpers";
import {
    initializeLaunchpoolsConfig,
    LaunchpoolBackendIntegrationTestingEnvironment,
    updateLaunchpoolsConfigDuration, updateLaunchpoolsConfigPositionSizes,
    updateLaunchpoolsConfigProtocolRewardShare,
    updateLaunchpoolsConfigRewardAuthority
} from "./helpers";
import * as program from "@launchpool/js";
import {getLaunchpoolsConfigPDA} from "../helpers";

export const launchpoolsConfigBackendIntegrationTests = (
    launchpoolTestingEnvironment: LaunchpoolBackendIntegrationTestingEnvironment,
    launchpoolsConfigsManagerAddress: ProgramDerivedAddress,
    launchpoolsConfigAddress: ProgramDerivedAddress
) => {
    describe("\nLaunchpoolsConfig tests", () => {
        const {
            rpcClient,
            headAuthority,
            launchpoolsConfigsManagerAuthority,
            user
        } = launchpoolTestingEnvironment;
        let rewardAuthority: KeyPairSigner;
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
        })

        /// Initialization

        it("Unauthorized attempt to initialize LaunchpoolsConfig should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(user.address, launchpoolsConfigsManagerAddress[0], rewardAuthority.address, tokenMint, 57n, 543n, 23, 4234523n, launchpoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of LaunchpoolsConfig initialization");
                },
                (_error) => {
                }
            );
        })

        it("Initialization with exceeded reward should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                tokenMint,
                57n,
                543n,
                10001,
                4234523n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with exceeded reward basis points");
                },
                (_error) => {
                }
            );
        });


        it("Initialization with 0 duration should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                tokenMint,
                57n,
                543n,
                5000,
                0n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with 0 duration");
                },
                (_error) => {
                }
            );
        });

        it("Initialization with 0 min position size should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                tokenMint,
                0n,
                543n,
                5000,
                324234n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with 0 min position size");
                },
                (_error) => {
                }
            );
        });

        it("Initialization with max < min position size should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                tokenMint,
                234n,
                230n,
                5000,
                324234n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with max < min position size");
                },
                (_error) => {
                }
            );
        });

        it("Initialization with freeze stakable mint should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                freezeAuthorityMint,
                57n,
                543n,
                1000,
                4234523n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with freeze stakable mint");
                },
                (_error) => {
                }
            );
        });


        it("Initialization with forbidden extension stakable mint should fail", async () => {
            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                forbiddenExtensionMint,
                57n,
                543n,
                1000,
                4234523n,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure with forbidden extension mint");
                },
                (_error) => {
                }
            );
        });

        it("Initialize LaunchpoolsConfig by head authority", async () => {
            const managerBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0])

            const protocolRewardShareBasisPoints = 23;
            const duration = 4234n;
            const maxPositionSize = 543n;
            const minPositionSize = 57n;
            const stakableMint = tokenMint;

            const base64Tx = (await initializeLaunchpoolsConfig(
                headAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                stakableMint,
                minPositionSize,
                maxPositionSize,
                protocolRewardShareBasisPoints,
                duration,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1)

            const [configAccount, managerAfter] = await Promise.all([
                program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]),
                program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0])
            ]);

            assert.strictEqual(configAccount.data.rewardAuthority, rewardAuthority.address);
            assert.strictEqual(configAccount.data.stakableMint, stakableMint);
            assert.strictEqual(configAccount.data.id, managerBefore.data.configsCount);
            assert.strictEqual(configAccount.data.protocolRewardShareBasisPoints, protocolRewardShareBasisPoints);
            assert.strictEqual(configAccount.data.duration, duration);
            assert.strictEqual(configAccount.data.minPositionSize, minPositionSize);
            assert.strictEqual(configAccount.data.maxPositionSize, maxPositionSize);
            assert.strictEqual(configAccount.data.bump, launchpoolsConfigAddress[1].valueOf());
            assert.strictEqual(managerAfter.data.configsCount - managerBefore.data.configsCount, BigInt(1));
        });


        it("Initialize LaunchpoolsConfig by authority", async () => {
            const managerBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            const protocolRewardShareBasisPoints = 23;
            const duration = 4234n;
            const maxPositionSize = 543n;
            const minPositionSize = 57n;
            const stakableMint = token22Mint;

            const testConfigAddress = await getLaunchpoolsConfigPDA(managerBefore.data.configsCount);

            const base64Tx = (await initializeLaunchpoolsConfig(
                launchpoolsConfigsManagerAuthority.address,
                launchpoolsConfigsManagerAddress[0],
                rewardAuthority.address,
                stakableMint,
                minPositionSize,
                maxPositionSize,
                protocolRewardShareBasisPoints,
                duration,
                launchpoolTestingEnvironment
            ))[0];

            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1)
            const [configAccount, managerAfter] = await Promise.all([
                program.fetchLaunchpoolsConfig(rpcClient.rpc, testConfigAddress[0]),
                program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0])
            ]);

            assert.strictEqual(configAccount.data.rewardAuthority, rewardAuthority.address);
            assert.strictEqual(configAccount.data.stakableMint, stakableMint);
            assert.strictEqual(configAccount.data.id, managerBefore.data.configsCount);
            assert.strictEqual(configAccount.data.protocolRewardShareBasisPoints, protocolRewardShareBasisPoints);
            assert.strictEqual(configAccount.data.duration, duration);
            assert.strictEqual(configAccount.data.minPositionSize, minPositionSize);
            assert.strictEqual(configAccount.data.maxPositionSize, maxPositionSize);
            assert.strictEqual(configAccount.data.bump, testConfigAddress[1].valueOf());
            assert.strictEqual(managerAfter.data.configsCount - managerBefore.data.configsCount, BigInt(1));
        });

        /// Reward authority update

        it("Unauthorized attempt to update LaunchpoolsConfig reward authority should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigRewardAuthority(
                launchpoolsConfigAddress[0],
                user.address,
                headAuthority.address,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig reward authority");
                },
                (_error) => {
                }
            );
        });

        it("Update LaunchpoolsConfig reward authority by head authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const base64Tx = await updateLaunchpoolsConfigRewardAuthority(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                user.address,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1)
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, user.address, "Reward authority mismatch");
            assert.strictEqual(configAfter.data.rewardAuthority, user.address);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig reward authority by authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            const base64Tx = await updateLaunchpoolsConfigRewardAuthority(
                launchpoolsConfigAddress[0],
                launchpoolsConfigsManagerAuthority.address,
                headAuthority.address,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1)
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, headAuthority.address, "Reward authority mismatch");
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        /// Protocol reward share update
        it("Unauthorized attempt to update LaunchpoolsConfig protocol reward share should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigProtocolRewardShare(
                launchpoolsConfigAddress[0],
                user.address,
                123,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig protocol reward share");
                },
                (_error) => {
                }
            );
        });


        it("Update LaunchpoolsConfig protocol reward share by head authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newProtocolRewardShareBasisPoints = 1243;

            const base64Tx = await updateLaunchpoolsConfigProtocolRewardShare(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                newProtocolRewardShareBasisPoints,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, newProtocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig protocol reward share by authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newProtocolRewardShareBasisPoints = 1333;

            const base64Tx = await updateLaunchpoolsConfigProtocolRewardShare(
                launchpoolsConfigAddress[0],
                launchpoolsConfigsManagerAuthority.address,
                newProtocolRewardShareBasisPoints,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, newProtocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });

        it("Update LaunchpoolsConfig with exceeded protocol reward share should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigProtocolRewardShare(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                10001,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig update with exceeded protocol reward share");
                },
                (_error) => {
                }
            );
        });

        /// Duration update

        it("Unauthorized attempt to update LaunchpoolsConfig duration should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigDuration(
                launchpoolsConfigAddress[0],
                user.address,
                123n,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig duration");
                },
                (_error) => {
                }
            );
        });


        it("Update LaunchpoolsConfig duration by head authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newDuration = 3456n;

            const base64Tx = await updateLaunchpoolsConfigDuration(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                newDuration,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, newDuration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig duration by authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newDuration = 60n;

            const base64Tx = await updateLaunchpoolsConfigDuration(
                launchpoolsConfigAddress[0],
                launchpoolsConfigsManagerAuthority.address,
                newDuration,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, configBefore.data.maxPositionSize);
            assert.strictEqual(configAfter.data.minPositionSize, configBefore.data.minPositionSize);
            assert.strictEqual(configAfter.data.duration, newDuration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig duration with 0 duration", async () => {
            const base64Tx = await updateLaunchpoolsConfigDuration(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                0n,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of LaunchpoolsConfig duration update with 0 duration");
                },
                (_error) => {
                }
            );
        });

        /// Position sizes update

        it("Unauthorized attempt to update LaunchpoolsConfig position sizes should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigPositionSizes(
                launchpoolsConfigAddress[0],
                user.address,
                123n,
                250n,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfig position sizes");
                },
                (_error) => {
                }
            );
        });

        it("Update LaunchpoolsConfig position sizes by head authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newMin = 333n;
            const newMax = 500n;

            const base64Tx = await updateLaunchpoolsConfigPositionSizes(
                launchpoolsConfigAddress[0],
                headAuthority.address,
                newMin,
                newMax,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, newMax);
            assert.strictEqual(configAfter.data.minPositionSize, newMin);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig position sizes by authority", async () => {
            const configBefore = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);
            assert.ok(configBefore, "LaunchpoolsConfig doesn't exist");

            const newMin = 100_000_000n;
            const newMax = 100_000_000_000n;

            const base64Tx = await updateLaunchpoolsConfigPositionSizes(
                launchpoolsConfigAddress[0],
                launchpoolsConfigsManagerAuthority.address,
                newMin,
                newMax,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const configAfter = await program.fetchLaunchpoolsConfig(rpcClient.rpc, launchpoolsConfigAddress[0]);

            assert.strictEqual(configAfter.data.rewardAuthority, configBefore.data.rewardAuthority);
            assert.strictEqual(configAfter.data.stakableMint, configBefore.data.stakableMint);
            assert.strictEqual(configAfter.data.id, configBefore.data.id);
            assert.strictEqual(configAfter.data.protocolRewardShareBasisPoints, configBefore.data.protocolRewardShareBasisPoints);
            assert.strictEqual(configAfter.data.maxPositionSize, newMax);
            assert.strictEqual(configAfter.data.minPositionSize, newMin);
            assert.strictEqual(configAfter.data.duration, configBefore.data.duration);
            assert.strictEqual(configAfter.data.bump, configBefore.data.bump);
        });


        it("Update LaunchpoolsConfig position sizes with 0 min position size", async () => {
            const base64Tx = await updateLaunchpoolsConfigPositionSizes(
                launchpoolsConfigAddress[0],
                user.address,
                0n,
                250n,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig with 0 min position size");
                },
                (_error) => {
                }
            );
        });


        it("Update LaunchpoolsConfig position sizes with max position size less than min position size", async () => {
            const base64Tx = await updateLaunchpoolsConfigPositionSizes(
                launchpoolsConfigAddress[0],
                user.address,
                250n,
                100n,
                launchpoolTestingEnvironment
            );

            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of LaunchpoolsConfig with max < min position size");
                },
                (_error) => {
                }
            );
        });

    })
}