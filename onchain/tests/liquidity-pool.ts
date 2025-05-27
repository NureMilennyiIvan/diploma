import {
    ProgramDerivedAddress
} from "@solana/kit";
import {before} from "mocha";
import {
    LiquidityPoolTestingEnvironment,
    createLiquidityPoolTestingEnvironment,
    getAmmsConfigPDA,
    getAmmsConfigsManagerPDA
} from "./liquidity-pool/helpers";
import {ammsConfigsManagerTests} from "./liquidity-pool/amms-configs-manager.test";
import {ammsConfigTests} from "./liquidity-pool/amms-config.test";
import {cpAmmTests} from "./liquidity-pool/cp-amm.test";

// Declare testing environment and key variables
let liquidityPoolTestingEnvironment: LiquidityPoolTestingEnvironment;
let ammsConfigsManagerAddress: ProgramDerivedAddress;
let ammsConfigAddress: ProgramDerivedAddress;

/**
 * Setup test environment before running tests.
 * Initializes testing environment and retrieves necessary program addresses.
 */
before(async () =>{
    // Initialize testing environment
    liquidityPoolTestingEnvironment = await createLiquidityPoolTestingEnvironment();
    console.log("Liquidity pool Program Address:", liquidityPoolTestingEnvironment.program.LIQUIDITY_POOL_PROGRAM_ADDRESS);

    // Fetch the AMMs Configs Manager PDA
    ammsConfigsManagerAddress = await getAmmsConfigsManagerPDA();
    console.log("AMMs Configs Manager PDA:", ammsConfigsManagerAddress);

    // Fetch a specific AMMs Config PDA (assuming config ID 0)
    ammsConfigAddress = await getAmmsConfigPDA(BigInt(0));
    console.log("AMMs Config PDA:", ammsConfigAddress);
});

/**
 * Runs a series of tests for the Liquidity pool program instructions.
 * This includes testing AMMs Configs Manager, AMMs Config, and CP AMM functionalities.
 */
it("Liquidity pool program instructions tests", async () => {
    // Run tests for AMMs Configs Manager
    ammsConfigsManagerTests(liquidityPoolTestingEnvironment, ammsConfigsManagerAddress);

    // Run tests for AMMs Config, linking it with the Configs Manager
    ammsConfigTests(liquidityPoolTestingEnvironment, ammsConfigsManagerAddress, ammsConfigAddress);

    // Run tests for CP AMM, linking it with AMMs Config
    cpAmmTests(liquidityPoolTestingEnvironment, ammsConfigAddress);
});
