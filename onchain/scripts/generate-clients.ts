import {AnchorIdl, rootNodeFromAnchor} from "@codama/nodes-from-anchor";
import { renderJavaScriptVisitor, renderRustVisitor } from "@codama/renderers";
import liquidityPoolIdl from '../target/idl/liquidity_pool.json';
import launchpoolIdl from '../target/idl/launchpool.json';
import * as path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import {createFromRoot} from "codama";

async function generateClients() {
    const codamaLiquidityPool = createFromRoot(rootNodeFromAnchor(liquidityPoolIdl as AnchorIdl));
    const codamaLaunchpool = createFromRoot(rootNodeFromAnchor(launchpoolIdl as AnchorIdl));

    const clients = [
        { type: "JS", dir: "../onchain-clients/liquidity-pool/js", renderVisitor: renderJavaScriptVisitor, codama: codamaLiquidityPool, name: "@liquidity-pool/js" },
        { type: "Rust", dir: "../onchain-clients/liquidity-pool/rust/src", renderVisitor: renderRustVisitor, codama: codamaLiquidityPool, name: "liquidity-pool" },
        { type: "JS", dir: "../onchain-clients/launchpool/js", renderVisitor: renderJavaScriptVisitor, codama: codamaLaunchpool, name: "@launchpool/js"  },
        { type: "Rust", dir: "../onchain-clients/launchpool/rust/src", renderVisitor: renderRustVisitor, codama: codamaLaunchpool, name: "launchpool" }
    ];

    for (const client of clients) {
        try {
            await client.codama.accept(
                await client.renderVisitor(client.dir)
            );
            if (client.type == "JS"){
                await generatePackageJson(client.dir, client.name);
            }
            else if (client.type == "Rust") {
                await generateCargoToml(client.dir, client.name);
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
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    console.log(`📦 Created package.json for ${name}`);

}
async function generateCargoToml(dir: string, name: string) {
    const cargoTomlPath = path.join(`${dir}/..`, "Cargo.toml");
    const toml = `[package]
        name = "${name}"
        version = "1.0.0"
        edition = "2021"
        
        [lib]
        path = "src/lib.rs"

        [dependencies]
        borsh = "1.5.7"
        solana-program = "2.2.1"
        serde = "1.0.219"
        num-derive = "0.4.2"
        thiserror = "2.0.12"
        num-traits = "0.2.19"
    `;
    fs.writeFileSync(cargoTomlPath, toml);
    fs.renameSync(`${dir}/mod.rs`, `${dir}/lib.rs`);
    const content = fs.readFileSync(`${dir}/lib.rs`, 'utf-8');
    fs.writeFileSync(`${dir}/lib.rs`, '#![allow(warnings)]\n' + content);


    const files = await fg([`${dir}/**/*.rs`]);

    for (const file of files) {
        const fullPath = path.resolve(file);
        const content = await fs.readFile(fullPath, "utf-8");

        const replaced = content.replace(/use\s+crate::generated::/g, "use crate::");

        if (content !== replaced) {
            await fs.writeFile(fullPath, replaced, "utf-8");
        }
    }

    console.log(`📦 Created Cargo.toml for ${name}`);

}
generateClients();