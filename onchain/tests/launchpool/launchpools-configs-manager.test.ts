import {pipe, ProgramDerivedAddress} from "@solana/kit";
import {describe} from "mocha";
import {SYSTEM_PROGRAM_ADDRESS} from "@solana-program/system";
import {createTransaction, getTransactionLogs, signAndSendTransaction} from "../helpers";
import {assert} from "chai";
import {LaunchpoolTestingEnvironment} from "./helpers";
import {
    getInitializeLaunchpoolsConfigsManagerInstruction,
    getUpdateLaunchpoolsConfigsManagerAuthorityInstruction, getUpdateLaunchpoolsConfigsManagerHeadAuthorityInstruction,
    InitializeLaunchpoolsConfigsManagerInput,
    UpdateLaunchpoolsConfigsManagerAuthorityInput,
    UpdateLaunchpoolsConfigsManagerHeadAuthorityInput
} from "@launchpool/js";

export const launchpoolsConfigsManagerTests = (launchpoolTestingEnvironment: LaunchpoolTestingEnvironment, launchpoolsConfigsManagerAddress: ProgramDerivedAddress) =>{
    describe("\nLaunchpoolsConfigsManager tests", () =>{
        const {program, programDataAddress, rpcClient, rent, headAuthority, owner, launchpoolsConfigsManagerAuthority, user} = launchpoolTestingEnvironment;

        /// Initialization

        it("Unauthorized attempt to initialize LaunchpoolsConfigsManager should fail", async () => {
            const input: InitializeLaunchpoolsConfigsManagerInput = {
                signer: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                authority: launchpoolsConfigsManagerAuthority.address,
                headAuthority: owner.address,
                programData: programDataAddress,
                launchpoolProgram: program.LAUNCHPOOL_PROGRAM_ADDRESS,
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS
            };

            const ix = getInitializeLaunchpoolsConfigsManagerInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized attempt of LaunchpoolsConfigsManager initialization");
                },
                (_error) => {}
            ));
        })

        it("Initialization of LaunchpoolsConfigsManager should fail with an invalid head authority", async () => {
            const input: InitializeLaunchpoolsConfigsManagerInput = {
                signer: owner,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                authority: launchpoolsConfigsManagerAuthority.address,
                headAuthority: user.address,
                programData: programDataAddress,
                launchpoolProgram: program.LAUNCHPOOL_PROGRAM_ADDRESS,
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS
            };
            const ix = getInitializeLaunchpoolsConfigsManagerInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected to fail initialization of LaunchpoolsConfigsManager with an invalid head authority");
                },
                (_error) => {}
            ));
        })

        it("Initialize LaunchpoolsConfigsManager", async () => {
            const input: InitializeLaunchpoolsConfigsManagerInput = {
                signer: owner,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                authority: launchpoolsConfigsManagerAuthority.address,
                headAuthority: owner.address,
                programData: programDataAddress,
                launchpoolProgram: program.LAUNCHPOOL_PROGRAM_ADDRESS,
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS
            };
            const ix = getInitializeLaunchpoolsConfigsManagerInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).catch((error) => console.log(error));

            const launchpoolsConfigsManagerAccount = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(launchpoolsConfigsManagerAccount, "LaunchpoolsConfigsManager account was not created");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.authority, launchpoolsConfigsManagerAuthority.address, "Authority does not match the expected address");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.headAuthority, owner.address, "Head authority does not match the expected owner address");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.configsCount, BigInt(0), "Configs count should be initialized to 0");
            assert.strictEqual(launchpoolsConfigsManagerAccount.data.bump, launchpoolsConfigsManagerAddress[1].valueOf(), "Bump value is incorrect");
        })

        it("Reinitialization of LaunchpoolsConfigsManager should fail", async () => {
            const input: InitializeLaunchpoolsConfigsManagerInput = {
                signer: owner,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                authority: launchpoolsConfigsManagerAuthority.address,
                headAuthority: owner.address,
                programData: programDataAddress,
                launchpoolProgram: program.LAUNCHPOOL_PROGRAM_ADDRESS,
                rent,
                systemProgram: SYSTEM_PROGRAM_ADDRESS
            };
            const ix = getInitializeLaunchpoolsConfigsManagerInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of reinitialization LaunchpoolsConfigsManager");
                },
                (_error) => {}
            ));
        })

        // Authority update

        it("Unauthorized attempt to update LaunchpoolsConfigsManager authority should fail", async () => {
            const input: UpdateLaunchpoolsConfigsManagerAuthorityInput = {
                authority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                newAuthority: user.address
            };

            const ix = getUpdateLaunchpoolsConfigsManagerAuthorityInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfigsManager authority");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfigsManager authority by authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(launchpoolsConfigsManagerAccountBefore, "LaunchpoolsConfigsManager doesn't exist");

            const input: UpdateLaunchpoolsConfigsManagerAuthorityInput = {
                authority: launchpoolsConfigsManagerAuthority,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                newAuthority: user.address
            };

            const ix = getUpdateLaunchpoolsConfigsManagerAuthorityInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            )

            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, user.address, "Authority was not updated to the expected user address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, launchpoolsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })

        it("Update LaunchpoolsConfigsManager authority by head authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(launchpoolsConfigsManagerAccountBefore, "LaunchpoolsConfigsManager doesn't exist");

            const input: UpdateLaunchpoolsConfigsManagerAuthorityInput = {
                authority: owner,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                newAuthority: launchpoolsConfigsManagerAuthority.address
            };

            const ix = getUpdateLaunchpoolsConfigsManagerAuthorityInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            )

            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, launchpoolsConfigsManagerAuthority.address, "Authority was not updated to the expected authority address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, launchpoolsConfigsManagerAccountBefore.data.headAuthority, "Head authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })

        /// Head authority update

        it("Unauthorized attempt to update LaunchpoolsConfigsManager head authority should fail", async () => {
            const input: UpdateLaunchpoolsConfigsManagerHeadAuthorityInput = {
                headAuthority: user,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                newHeadAuthority: user.address
            };

            const ix = getUpdateLaunchpoolsConfigsManagerHeadAuthorityInstruction(input);

            await (pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            ).then(
                async (signature) => {
                    console.log(await getTransactionLogs(rpcClient, signature));
                    assert.fail("Expected failure of unauthorized update of LaunchpoolsConfigsManager head authority");
                },
                (_error) => {}
            ));
        })

        it("Update LaunchpoolsConfigsManager head authority", async () => {
            const launchpoolsConfigsManagerAccountBefore = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.ok(launchpoolsConfigsManagerAccountBefore, "LaunchpoolsConfigsManager doesn't exist");

            const input: UpdateLaunchpoolsConfigsManagerHeadAuthorityInput = {
                headAuthority: owner,
                launchpoolsConfigsManager: launchpoolsConfigsManagerAddress[0],
                newHeadAuthority:  headAuthority.address
            };
            const ix = getUpdateLaunchpoolsConfigsManagerHeadAuthorityInstruction(input);

            await pipe(
                await createTransaction(rpcClient, owner, [ix]),
                (tx) => signAndSendTransaction(rpcClient, tx)
            )

            const launchpoolsConfigsManagerAccountAfter = await program.fetchLaunchpoolsConfigsManager(rpcClient.rpc, launchpoolsConfigsManagerAddress[0]);

            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.authority, launchpoolsConfigsManagerAccountBefore.data.authority, "Authority should remain unchanged");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.headAuthority, headAuthority.address, "Head authority was not updated to the expected authority address");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.configsCount, launchpoolsConfigsManagerAccountBefore.data.configsCount, "Configs count should remain unchanged after update");
            assert.strictEqual(launchpoolsConfigsManagerAccountAfter.data.bump, launchpoolsConfigsManagerAccountBefore.data.bump, "Bump value should remain the same");
        })
    })
}