import {ProgramDerivedAddress} from "@solana/kit";
import {describe} from "mocha";
import {
    initializeAmmsConfigsManager,
    LiquidityPoolBackendIntegrationTestingEnvironment,
    updateAmmsConfigsManagerAuthority, updateAmmsConfigsManagerHeadAuthority
} from "./helpers";
import {decodeSignAndSend, delay, getTransactionLogs} from "../../helpers";
import {assert} from "chai";
import { fetchAmmsConfigsManager } from "@liquidity-pool/js";

export const ammsConfigsManagerBackendIntegrationTests = (liquidityPoolTestingEnvironment: LiquidityPoolBackendIntegrationTestingEnvironment, ammsConfigsManagerAddress: ProgramDerivedAddress) => {
    describe("\nAmmsConfigsManager tests", () => {
        const {rpcClient, headAuthority, owner, ammsConfigsManagerAuthority, user} = liquidityPoolTestingEnvironment;

        it("Unauthorized attempt to initialize AmmsConfigsManager should fail", async () => {
            const base64Tx = (await initializeAmmsConfigsManager(user.address, ammsConfigsManagerAuthority.address, user.address, liquidityPoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of AmmsConfigsManager initialization");
                },
                (_error) => {}
            );
        });

        it("Initialization of AmmsConfigsManager should fail with an invalid head authority", async () => {
            const base64Tx = (await initializeAmmsConfigsManager(owner.address, ammsConfigsManagerAuthority.address, user.address, liquidityPoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected to fail initialization of AmmsConfigsManager with an invalid head authority");
                },
                (_error) => {}
            );
        });

        it("Initialize AmmsConfigsManager", async () => {
            const base64Tx = (await initializeAmmsConfigsManager(owner.address, ammsConfigsManagerAuthority.address, owner.address, liquidityPoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const ammsConfigsManagerAccount = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(ammsConfigsManagerAccount.data.authority, ammsConfigsManagerAuthority.address, "Authority does not match the expected address");
            assert.strictEqual(ammsConfigsManagerAccount.data.headAuthority, owner.address, "Head authority does not match the expected owner address");
            assert.strictEqual(ammsConfigsManagerAccount.data.configsCount, BigInt(0), "Configs count should be initialized to 0");
            assert.strictEqual(ammsConfigsManagerAccount.data.bump, ammsConfigsManagerAddress[1].valueOf(), "Bump value is incorrect");
        });

        it("Reinitialization of AmmsConfigsManager should fail", async () => {
            const base64Tx = (await initializeAmmsConfigsManager(owner.address, ammsConfigsManagerAuthority.address, owner.address, liquidityPoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of reinitialization AmmsConfigsManager");
                },
                (_error) => {}
            );
        });

        /// Authority update

        it("Unauthorized attempt to update AmmsConfigsManager authority should fail", async () => {
            const base64Tx = await updateAmmsConfigsManagerAuthority(user.address, user.address, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of AmmsConfigsManager authority");
                },
                (_error) => {}
            );
        });

        it("Update AmmsConfigsManager authority by authority", async () => {
            const ammsConfigsManagerAccountBefore = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);

            const base64Tx = await updateAmmsConfigsManagerAuthority(ammsConfigsManagerAuthority.address, user.address, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [ammsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const ammsConfigsManagerAccountAfter = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(ammsConfigsManagerAccountAfter.data.authority, user.address, "Authority was not updated to the expected user address");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.headAuthority, ammsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.configsCount, ammsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.bump, ammsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        });

        it("Update AmmsConfigsManager authority by head authority", async () => {
            const ammsConfigsManagerAccountBefore = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);

            const base64Tx = await updateAmmsConfigsManagerAuthority(owner.address, ammsConfigsManagerAuthority.address, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const ammsConfigsManagerAccountAfter = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(ammsConfigsManagerAccountAfter.data.authority, ammsConfigsManagerAuthority.address, "Authority was not updated to the expected authority address");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.headAuthority, ammsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.configsCount, ammsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.bump, ammsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        });


        /// Head authority update

        it("Unauthorized attempt to update AmmsConfigsManager head authority should fail", async () => {
            const base64Tx = await updateAmmsConfigsManagerHeadAuthority(user.address, user.address, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of AmmsConfigsManager head authority");
                },
                (_error) => {}
            );
        });

        it("Update AmmsConfigsManager head authority", async () => {
            const ammsConfigsManagerAccountBefore = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0]);

            const base64Tx = await updateAmmsConfigsManagerHeadAuthority(owner.address, headAuthority.address, liquidityPoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const ammsConfigsManagerAccountAfter = await fetchAmmsConfigsManager(rpcClient.rpc, ammsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(ammsConfigsManagerAccountAfter.data.authority, ammsConfigsManagerAccountBefore.data.authority, "Authority should remain unchanged");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.headAuthority, headAuthority.address, "Head authority was not updated to the expected authority address");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.configsCount, ammsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(ammsConfigsManagerAccountAfter.data.bump, ammsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        });


    })
}