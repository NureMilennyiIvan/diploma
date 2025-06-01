import {KeyPairSigner, ProgramDerivedAddress} from "@solana/kit";
import {before, describe} from "mocha";
import {
    initializeAmmsConfig,
    LiquidityPoolBackendIntegrationTestingEnvironment,
    updateAmmsConfigFeeAuthority, updateAmmsConfigProtocolFeeRate, updateAmmsConfigProvidersFeeRate
} from "./helpers";
import {createTestUser, decodeSignAndSend, delay, getTransactionLogs} from "../../helpers";
import { assert } from "chai";
import {fetchAmmsConfig, fetchAmmsConfigsManager} from "@liquidity-pool/js";
import {getAmmsConfigPDA} from "../helpers";

export const ammsConfigBackendIntegrationTests = (
    liquidityPoolTestingEnvironment: LiquidityPoolBackendIntegrationTestingEnvironment,
    ammsConfigsManagerAddress: ProgramDerivedAddress,
    ammsConfigAddress: ProgramDerivedAddress
) => {
    describe("\nAmmsConfig tests", () => {
        const { rpcClient, headAuthority, ammsConfigsManagerAuthority, user } = liquidityPoolTestingEnvironment;
        let feeAuthority: KeyPairSigner;

        before(async () => {
            // Create a test user to act as fee authority
            feeAuthority = await createTestUser(rpcClient, 100);
        })

        /// Initialization

        it("Unauthorized attempt to initialize AmmsConfig should fail", async () => {
            const base64Tx = (await initializeAmmsConfig(
                user.address,
                ammsConfigsManagerAddress[0],
                feeAuthority.address,
                40,
                75,
                liquidityPoolTestingEnvironment
            ))[0];
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of AmmsConfig initialization");
                },
                (_error) => {}
            );
        });

        it("Initialization of AmmsConfig with exceeded fees should fail", async () => {
            const base64Tx = (await initializeAmmsConfig(
                user.address,
                ammsConfigsManagerAddress[0],
                feeAuthority.address,
                5001,
                5000,
                liquidityPoolTestingEnvironment
            ))[0];
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of AmmsConfig initialization with exceeded fees");
                },
                (_error) => {}
            );
        });

        it("Initialize AmmsConfig by head authority", async () => {
            const ammsConfigsManagerAccountBefore = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);
            assert.ok(ammsConfigsManagerAccountBefore, "AmmsConfigsManager doesn't exist");

            const protocolFeeRateBasisPoints = 40;
            const providersFeeRateBasisPoints = 75;

            const base64Tx = (await initializeAmmsConfig(
                headAuthority.address,
                ammsConfigsManagerAddress[0],
                feeAuthority.address,
                protocolFeeRateBasisPoints,
                providersFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            ))[0];
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);

            const ammsConfigAccount = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            const ammsConfigsManagerAccountAfter = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);

            assert.ok(ammsConfigAccount, "AmmsConfig account was not created");
            assert.strictEqual(ammsConfigAccount.data.feeAuthority, feeAuthority.address, "Fee authority does not match expected value");
            assert.strictEqual(ammsConfigAccount.data.id, ammsConfigsManagerAccountBefore.data.configsCount, "Config ID does not match expected count");
            assert.strictEqual(ammsConfigAccount.data.protocolFeeRateBasisPoints, protocolFeeRateBasisPoints, "Protocol fee rate is incorrect");
            assert.strictEqual(ammsConfigAccount.data.providersFeeRateBasisPoints, providersFeeRateBasisPoints, "Provider fee rate is incorrect");
            assert.strictEqual(ammsConfigAccount.data.bump, ammsConfigAddress[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(
                ammsConfigsManagerAccountAfter.data.configsCount - ammsConfigsManagerAccountBefore.data.configsCount,
                BigInt(1),
                "Configs count was not incremented correctly"
            );
        });

        it("Initialize AmmsConfig by authority", async () => {
            const ammsConfigsManagerAccountBefore = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);
            assert.ok(ammsConfigsManagerAccountBefore, "AmmsConfigsManager doesn't exist");

            const protocolFeeRateBasisPoints = 40;
            const providersFeeRateBasisPoints = 75;

            const testAmmsConfigAddress = await getAmmsConfigPDA(ammsConfigsManagerAccountBefore.data.configsCount);

            const base64Tx = (await initializeAmmsConfig(
                ammsConfigsManagerAuthority.address,
                ammsConfigsManagerAddress[0],
                feeAuthority.address,
                protocolFeeRateBasisPoints,
                providersFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            ))[0];
            await decodeSignAndSend(base64Tx, [ammsConfigsManagerAuthority], rpcClient);
            await delay(1);

            const testAmmsConfigAccount = await fetchAmmsConfig(rpcClient.rpc, testAmmsConfigAddress[0]);
            const ammsConfigsManagerAccountAfter = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);

            assert.ok(testAmmsConfigAccount, "AmmsConfig account was not created");
            assert.strictEqual(testAmmsConfigAccount.data.feeAuthority, feeAuthority.address, "Fee authority does not match expected value");
            assert.strictEqual(testAmmsConfigAccount.data.id, ammsConfigsManagerAccountBefore.data.configsCount, "Config ID does not match expected count");
            assert.strictEqual(testAmmsConfigAccount.data.protocolFeeRateBasisPoints, protocolFeeRateBasisPoints, "Protocol fee rate is incorrect");
            assert.strictEqual(testAmmsConfigAccount.data.providersFeeRateBasisPoints, providersFeeRateBasisPoints, "Provider fee rate is incorrect");
            assert.strictEqual(testAmmsConfigAccount.data.bump, testAmmsConfigAddress[1].valueOf(), "Bump value is incorrect");
            assert.strictEqual(
                ammsConfigsManagerAccountAfter.data.configsCount - ammsConfigsManagerAccountBefore.data.configsCount,
                BigInt(1),
                "Configs count was not incremented correctly"
            );
        });

        /// Fee authority update

        it("Unauthorized attempt to update AmmsConfig fee authority should fail", async () => {
            const base64Tx = await updateAmmsConfigFeeAuthority(
                user.address,
                ammsConfigAddress[0],
                headAuthority.address,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of AmmsConfig fee authority");
                },
                (_error) => {}
            );
        });

        it("Update AmmsConfig fee authority by head authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const base64Tx = await updateAmmsConfigFeeAuthority(
                headAuthority.address,
                ammsConfigAddress[0],
                user.address,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, user.address, "Fee authority does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, ammsConfigAccountBefore.data.protocolFeeRateBasisPoints, "Protocol fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, ammsConfigAccountBefore.data.providersFeeRateBasisPoints, "Provider fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        it("Update AmmsConfig fee authority by authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const base64Tx = await updateAmmsConfigFeeAuthority(
                ammsConfigsManagerAuthority.address,
                ammsConfigAddress[0],
                headAuthority.address,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [ammsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, headAuthority.address, "Fee authority does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, ammsConfigAccountBefore.data.protocolFeeRateBasisPoints, "Protocol fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, ammsConfigAccountBefore.data.providersFeeRateBasisPoints, "Provider fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        /// Protocol fee rate update

        it("Unauthorized attempt to update AmmsConfig protocol fee rate should fail", async () => {
            const base64Tx = await updateAmmsConfigProtocolFeeRate(
                user.address,
                ammsConfigAddress[0],
                312,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of AmmsConfig protocol fee rate");
                },
                (_error) => {}
            );
        });

        it("Update AmmsConfig protocol fee rate by head authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const newProtocolFeeRateBasisPoints = 657;

            const base64Tx = await updateAmmsConfigProtocolFeeRate(
                headAuthority.address,
                ammsConfigAddress[0],
                newProtocolFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, ammsConfigAccountBefore.data.feeAuthority, "Fee authority should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, newProtocolFeeRateBasisPoints, "Protocol fee rate does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, ammsConfigAccountBefore.data.providersFeeRateBasisPoints, "Provider fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        it("Update AmmsConfig protocol fee rate by authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const newProtocolFeeRateBasisPoints = 100;

            const base64Tx = await updateAmmsConfigProtocolFeeRate(
                ammsConfigsManagerAuthority.address,
                ammsConfigAddress[0],
                newProtocolFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [ammsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, ammsConfigAccountBefore.data.feeAuthority, "Fee authority should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, newProtocolFeeRateBasisPoints, "Protocol fee rate does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, ammsConfigAccountBefore.data.providersFeeRateBasisPoints, "Provider fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        it("Update AmmsConfig protocol fee rate to exceeding fee should fail", async () => {
            const base64Tx = await updateAmmsConfigProtocolFeeRate(
                headAuthority.address,
                ammsConfigAddress[0],
                9926,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of AmmsConfig protocol fee rate to exceeding fee");
                },
                (_error) => {}
            );
        });

        /// Providers fee rate update

        it("Unauthorized attempt to update AmmsConfig providers fee rate should fail", async () => {
            const base64Tx = await updateAmmsConfigProvidersFeeRate(
                user.address,
                ammsConfigAddress[0],
                312,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of AmmsConfig providers fee rate");
                },
                (_error) => {}
            );
        });

        it("Update AmmsConfig providers fee rate by head authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const newProvidersFeeRateBasisPoints = 657;

            const base64Tx = await updateAmmsConfigProvidersFeeRate(
                headAuthority.address,
                ammsConfigAddress[0],
                newProvidersFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, ammsConfigAccountBefore.data.feeAuthority, "Fee authority should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, ammsConfigAccountBefore.data.protocolFeeRateBasisPoints, "Protocol fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, newProvidersFeeRateBasisPoints, "Provider fee rate does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        it("Update AmmsConfig providers fee rate by authority", async () => {
            const ammsConfigAccountBefore = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);
            assert.ok(ammsConfigAccountBefore, "AmmsConfig doesn't exist");

            const newProvidersFeeRateBasisPoints = 400;

            const base64Tx = await updateAmmsConfigProvidersFeeRate(
                ammsConfigsManagerAuthority.address,
                ammsConfigAddress[0],
                newProvidersFeeRateBasisPoints,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [ammsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const ammsConfigAccountAfter = await fetchAmmsConfig(rpcClient.rpc, ammsConfigAddress[0]);

            assert.strictEqual(ammsConfigAccountAfter.data.feeAuthority, ammsConfigAccountBefore.data.feeAuthority, "Fee authority should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.id, ammsConfigAccountBefore.data.id, "Config ID should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.protocolFeeRateBasisPoints, ammsConfigAccountBefore.data.protocolFeeRateBasisPoints, "Protocol fee rate should remain unchanged");
            assert.strictEqual(ammsConfigAccountAfter.data.providersFeeRateBasisPoints, newProvidersFeeRateBasisPoints, "Provider fee rate does not match expected value");
            assert.strictEqual(ammsConfigAccountAfter.data.bump, ammsConfigAccountBefore.data.bump, "Bump should remain unchanged");
        });

        it("Update AmmsConfig providers fee rate to exceeding fee should fail", async () => {
            const base64Tx = await updateAmmsConfigProvidersFeeRate(
                headAuthority.address,
                ammsConfigAddress[0],
                9901,
                liquidityPoolTestingEnvironment
            );
            await decodeSignAndSend(base64Tx, [headAuthority], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of update of AmmsConfig providers fee rate to exceeding fee");
                },
                (_error) => {}
            );
        });

    })
}