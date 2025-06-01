import {
    ProgramDerivedAddress
} from "@solana/kit";
import {describe} from "mocha";
import {decodeSignAndSend, delay, getTransactionLogs} from "../../helpers";
import {assert} from "chai";
import {
    initLaunchpoolsConfigsManager,
    LaunchpoolBackendIntegrationTestingEnvironment,
    updateLaunchpoolsConfigsManagerAuthority, updateLaunchpoolsConfigsManagerHeadAuthority
} from "./helpers";
import * as program from "@launchpool/js";

export const launchpoolsConfigsManagerBackendIntegrationTests = (launchpoolTestingEnvironment: LaunchpoolBackendIntegrationTestingEnvironment, launchpoolsConfigsManagerAddress: ProgramDerivedAddress) =>{
    describe("\nLaunchpoolsConfigsManager tests", () =>{
        const {rpcClient, headAuthority, owner, launchpoolsConfigsManagerAuthority, user} = launchpoolTestingEnvironment;

        /// Initialization

        it("Unauthorized attempt to initialize LaunchpoolsConfigsManager should fail", async () => {
            const base64Tx = (await initLaunchpoolsConfigsManager(user.address, launchpoolsConfigsManagerAuthority.address, user.address, launchpoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of LaunchpoolsConfigsManager initialization");
                },
                (_error) => {}
            );
        })
        it("Initialization of LaunchpoolsConfigsManager should fail with an invalid head authority", async () => {
            const base64Tx = (await initLaunchpoolsConfigsManager(owner.address, launchpoolsConfigsManagerAuthority.address, user.address, launchpoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected to fail initialization of LaunchpoolsConfigsManager with an invalid head authority");
                },
                (_error) => {}
            );
        })

        it("Initialize LaunchpoolsConfigsManager", async () => {
            const base64Tx = (await initLaunchpoolsConfigsManager(owner.address, launchpoolsConfigsManagerAuthority.address, owner.address, launchpoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const launchpoolsConfigsManagerAccount = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(launchpoolsConfigsManagerAccount.data.authority, launchpoolsConfigsManagerAuthority.address, "Authority does not match the expected address");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.headAuthority, owner.address, "Head authority does not match the expected owner address");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.configsCount, BigInt(0), "Configs count should be initialized to 0");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.bump, launchpoolsConfigsManagerAddress[1].valueOf(), "Bump value is incorrect");
        })

        it("Reinitialization of LaunchpoolsConfigsManager should fail", async () => {
            const base64Tx = (await initLaunchpoolsConfigsManager(owner.address, launchpoolsConfigsManagerAuthority.address, owner.address, launchpoolTestingEnvironment))[0];
            await decodeSignAndSend(base64Tx, [owner], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of reinitialization LaunchpoolsConfigsManager");
                },
                (_error) => {}
            );
        })

        // Authority update

        it("Unauthorized attempt to update LaunchpoolsConfigsManager authority should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigsManagerAuthority(user.address, user.address, launchpoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfigsManager authority");
                },
                (_error) => {}
            );
        })

        it("Update LaunchpoolsConfigsManager authority by authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);
            const base64Tx = await updateLaunchpoolsConfigsManagerAuthority(launchpoolsConfigsManagerAuthority.address, user.address, launchpoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [launchpoolsConfigsManagerAuthority], rpcClient);
            await delay(1);
            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, user.address, "Authority was not updated to the expected user address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, launchpoolsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })

        it("Update LaunchpoolsConfigsManager authority by head authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            const base64Tx = await updateLaunchpoolsConfigsManagerAuthority(owner.address, launchpoolsConfigsManagerAuthority.address, launchpoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, launchpoolsConfigsManagerAuthority.address, "Authority was not updated to the expected authority address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, launchpoolsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })

        /// Head authority update

        it("Unauthorized attempt to update LaunchpoolsConfigsManager head authority should fail", async () => {
            const base64Tx = await updateLaunchpoolsConfigsManagerHeadAuthority(user.address, user.address, launchpoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [user], rpcClient).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfigsManager head authority");
                },
                (_error) => {}
            );
        })

        it("Update LaunchpoolsConfigsManager head authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);
            const base64Tx = await updateLaunchpoolsConfigsManagerHeadAuthority(owner.address, headAuthority.address, launchpoolTestingEnvironment);
            await decodeSignAndSend(base64Tx, [owner], rpcClient);
            await delay(1);
            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0], {
                commitment: "processed"
            });

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, launchpoolsConfigsManagerAccountBefore.data.authority, "Authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, headAuthority.address, "Head authority was not updated to the expected authority address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })
    })
}