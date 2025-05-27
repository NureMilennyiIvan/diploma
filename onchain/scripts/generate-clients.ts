import { AnchorIdl, rootNodeFromAnchorWithoutDefaultVisitor } from "@codama/nodes-from-anchor";
import { renderJavaScriptVisitor, renderRustVisitor } from "@codama/renderers";
import { visit } from "@codama/visitors-core";
import liquidityPoolIdl from '../target/idl/liquidity_pool.json';
import launchpoolIdl from '../target/idl/launchpool.json';
import * as path from "node:path";
import * as fs from "fs/promises";

async function generateClients() {
    const nodeLiquidityPool = rootNodeFromAnchorWithoutDefaultVisitor(liquidityPoolIdl as AnchorIdl);
    const nodeLaunchpool = rootNodeFromAnchorWithoutDefaultVisitor(launchpoolIdl as AnchorIdl);

    const clients = [
        { type: "JS", dir: "../onchain-clients/liquidity-pool/js", renderVisitor: renderJavaScriptVisitor, node: nodeLiquidityPool, name: "@liquidity-pool/js" },
        { type: "Rust", dir: "../onchain-clients/liquidity-pool/rust", renderVisitor: renderRustVisitor, node: nodeLiquidityPool, name: "liquidity-pool" },
        { type: "JS", dir: "../onchain-clients/launchpool/js", renderVisitor: renderJavaScriptVisitor, node: nodeLaunchpool, name: "@launchpool/js"  },
        { type: "Rust", dir: "../onchain-clients/launchpool/rust", renderVisitor: renderRustVisitor, node: nodeLaunchpool, name: "launchpool" }
    ];

    for (const client of clients) {
        try {
            await visit(
                client.node,
                await client.renderVisitor(client.dir)
            );
            if (client.type == "JS"){
                await generatePackageJson(client.dir, client.name);
            }
            console.log(`✅ Successfully generated ${client.type} client for ${client.name} in directory: ${client.dir}!`);
        } catch (e) {
            console.error(`Error in ${client.renderVisitor.name}:`, e);
            throw e;
        }
    }
}

async function generatePackageJson(dir: string, name: string) {
    const packageJsonPath = path.join(dir, "package.json");
    const pkg = {
        name,
        version: "1.0.0",
        main: "index.ts",
        types: "index.ts",
        license: "MIT",
        private: true
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2));
    console.log(`📦 Created package.json for ${name}`);

}
generateClients();