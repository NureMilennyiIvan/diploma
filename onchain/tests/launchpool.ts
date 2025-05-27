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

// Declare testing environment and key variables
let launchpoolTestingEnvironment: LaunchpoolTestingEnvironment;
let launchpoolsConfigsManagerAddress: ProgramDerivedAddress;
let launchpoolsConfigAddress: ProgramDerivedAddress;

/**
 * Setup test environment before running tests.
 * Initializes testing environment and retrieves necessary program addresses.
 */
before(async () =>{
    // Initialize testing environment
    launchpoolTestingEnvironment = await createLaunchpoolTestingEnvironment();
    console.log("Launchpool Program Address:", launchpoolTestingEnvironment.program.LAUNCHPOOL_PROGRAM_ADDRESS);

    // Fetch the Launchpools Configs Manager PDA
    launchpoolsConfigsManagerAddress = await getLaunchpoolsConfigsManagerPDA();
    console.log("Launchpools Configs Manager PDA:", launchpoolsConfigsManagerAddress);

    // Fetch a specific Launchpools Config PDA (assuming config ID 0)
    launchpoolsConfigAddress = await getLaunchpoolsConfigPDA(BigInt(0));
    console.log("Launchpools Config PDA:", launchpoolsConfigAddress);
});

it("Launchpool program instructions tests", async () => {
    // Run tests for Launchpools Configs Manager
    launchpoolsConfigsManagerTests(launchpoolTestingEnvironment, launchpoolsConfigsManagerAddress)

    // Run tests for Launchpools Config, linking it with the Configs Manager
    launchpoolsConfigTests(launchpoolTestingEnvironment, launchpoolsConfigsManagerAddress, launchpoolsConfigAddress);

    // Run tests for Launchpool, linking it with Launchpools Config
    launchpoolTests(launchpoolTestingEnvironment, launchpoolsConfigAddress, launchpoolsConfigsManagerAddress);
});
