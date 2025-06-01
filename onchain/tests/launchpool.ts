import {
    ProgramDerivedAddress
} from "@solana/kit";
import {before} from "mocha";
import {
    createLaunchpoolTestingEnvironment, getLaunchpoolsConfigPDA,
    getLaunchpoolsConfigsManagerPDA,
    LaunchpoolTestingEnvironment
} from "./launchpool/helpers";
import {launchpoolsConfigsManagerTests} from "./launchpool/launchpools-configs-manager.test";
import {launchpoolsConfigTests} from "./launchpool/launchpools-config.test";
import {launchpoolTests} from "./launchpool/launchpool.test";
import {
    createLaunchpoolBackendIntegrationTestingEnvironment, LaunchpoolBackendIntegrationTestingEnvironment
} from "./launchpool/launchpool-backend_integration/helpers";
import {
    launchpoolsConfigsManagerBackendIntegrationTests
} from "./launchpool/launchpool-backend_integration/launchpools-configs-manager.test";
import {
    launchpoolsConfigBackendIntegrationTests
} from "./launchpool/launchpool-backend_integration/launchpools-config.test";
import {launchpoolBackendIntegrationTests} from "./launchpool/launchpool-backend_integration/launchpool.test";

// Declare testing environment and key variables
let launchpoolTestingEnvironment: LaunchpoolTestingEnvironment;
let launchpoolsConfigsManagerAddress: ProgramDerivedAddress;
let launchpoolsConfigAddress: ProgramDerivedAddress;
let launchpoolBackendIntegrationTestingEnvironment: LaunchpoolBackendIntegrationTestingEnvironment;
/**
 * Setup test environment before running tests.
 * Initializes testing environment and retrieves necessary program addresses.
 */
before(async () =>{
    // Initialize testing environment
    launchpoolTestingEnvironment = await createLaunchpoolTestingEnvironment();
    launchpoolBackendIntegrationTestingEnvironment = await createLaunchpoolBackendIntegrationTestingEnvironment()
    console.log("Launchpool Program Address:", launchpoolTestingEnvironment.program.LAUNCHPOOL_PROGRAM_ADDRESS);

    // Fetch the Launchpools Configs Manager PDA
    launchpoolsConfigsManagerAddress = await getLaunchpoolsConfigsManagerPDA();
    console.log("Launchpools Configs Manager PDA:", launchpoolsConfigsManagerAddress);

    // Fetch a specific Launchpools Config PDA (assuming config ID 0)
    launchpoolsConfigAddress = await getLaunchpoolsConfigPDA(BigInt(0));
    console.log("Launchpools Config PDA:", launchpoolsConfigAddress);
});
/*
it("Launchpool program instructions tests", async () => {
    // Run tests for Launchpools Configs Manager
    launchpoolsConfigsManagerTests(launchpoolTestingEnvironment, launchpoolsConfigsManagerAddress)

    // Run tests for Launchpools Config, linking it with the Configs Manager
    launchpoolsConfigTests(launchpoolTestingEnvironment, launchpoolsConfigsManagerAddress, launchpoolsConfigAddress);

    // Run tests for Launchpool, linking it with Launchpools Config
    launchpoolTests(launchpoolTestingEnvironment, launchpoolsConfigAddress, launchpoolsConfigsManagerAddress);
});*/

it("Launchpool program backend integration tests", async () => {
    launchpoolsConfigsManagerBackendIntegrationTests(launchpoolBackendIntegrationTestingEnvironment, launchpoolsConfigsManagerAddress)

    launchpoolsConfigBackendIntegrationTests(launchpoolBackendIntegrationTestingEnvironment, launchpoolsConfigsManagerAddress, launchpoolsConfigAddress)

    launchpoolBackendIntegrationTests(launchpoolBackendIntegrationTestingEnvironment, launchpoolsConfigAddress);
});
